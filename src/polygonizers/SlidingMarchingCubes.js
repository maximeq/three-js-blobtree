"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Material = require("../blobtree/Material.js");
const Convergence = require("../utils/Convergence.js");

const Tables = require("./MCTables.js");

/**
 *  Axis Aligned Bounding Box in 2D carrying accuracy data
 *  @constructor
 *  @extends THREE.Box2
 *  @param {number=} min_x Minimum x coordinate of the box
 *  @param {number=} min_y Minimum y coordinate of the box
 *  @param {number=} max_x Maximum x coordinate of the box
 *  @param {number=} max_y Maximum y coordinate of the box
 *  @param {number=} nice_acc Nice accuracy in this box
 *  @param {number=} raw_acc Raw accuracy in this box
 */
var Box2Acc = function (min,max, nice_acc, raw_acc)
{
    THREE.Box2.call(this,min,max);

    if(nice_acc === undefined || nice_acc === null){
        var s = Math.max(this.max.x-this.min.x, this.max.y-this.min.y);
        this.nice_acc = s <=0 ? 10000000 : s;
    }else{
        this.nice_acc = nice_acc;
    }
    if(raw_acc === undefined || raw_acc === null){
        this.raw_acc = this.nice_acc;
    }else{
        this.raw_acc = raw_acc;
    }
};

Box2Acc.prototype = Object.create(THREE.Box2.prototype);

Box2Acc.prototype.union = function(box) {
    THREE.Box2.prototype.union.call(this,box);
    // Union of 2 boxes get the min acc for both
    this.raw_acc = Math.min(box.raw_acc, this.raw_acc);
    this.nice_acc = Math.min(box.nice_acc, this.nice_acc);
};

Box2Acc.prototype.getRawAcc = function() {
    return this.raw_acc;
};

Box2Acc.prototype.getNiceAcc = function() {
    return this.nice_acc;
};

Box2Acc.prototype.setRawAcc = function(raw_acc) {
    this.raw_acc = Math.max(0,raw_acc);;
};

Box2Acc.prototype.setNiceAcc = function(nice_acc) {
    this.nice_acc = Math.max(0,nice_acc);
};

Box2Acc.prototype.toString = function() {
    return "(" + this.min.x.toFixed(2) + ", " + this.min.y.toFixed(2) + ") -> (" + this.max.x.toFixed(2) + ", " + this.max.y.toFixed(2) + ") ";
}

/**
 *  @param {number} min_x
 *  @param {number} min_y
 *  @param {number} max_x
 *  @param {number} max_y
 *  @param {number=} nice_acc
 *  @param {number=} raw_acc
 */
Box2Acc.prototype.set = function (min_x,min_y,max_x,max_y, nice_acc, raw_acc)
{
    this.min.set(min_x,min_y);
    this.max.set(max_x,max_y);
    if(nice_acc !== undefined){
        this.nice_acc = nice_acc;
    }
    if(raw_acc !== undefined){
        this.raw_acc = raw_acc;
    }
};

/**
 *  Get corner with the minimum coordinates
 *  @return {THREE.Vector3}
 */
Box2Acc.prototype.getMinCorner = function(){
    return this.min;
};





/**
 *  Class for a dual marching cube using 2 sliding arrays.
 *  @param {RootNode} blobtree A blobtree to polygonize.
 *  @param {Object} params Parameters and option for this polygonizer.
 *  @param {String} params.zResolution Defines how the stepping in z occurs. Options are :
 *                                     "adaptive" (default) steps are computed according to local minimum accuracy.
 *                                     "uniform" steps are uniform along z, according to the global minimum accuracy.
 *  @param {number} params.detailRatio The blobtree defines some needed accuracies for polygonizing.
 *                                     However, if you want more details, you can set this to less than 1.
 *                                     Note that this is limited to 0.01, which will already increase your model complexity by a 10 000 factor.
 *  @param {Function} params.progress Progress callback, taling a percentage as parameter.
 *  @param {Object} params.convergence Add newton convergence steps to position each vertex.
 *  @param {number} params.convergence.ratio A ratio of a the marching cube grid size defining the wanted geometrical accuracy. Must be lower than 1, default is 0.01
 *  @param {number} params.convergence.step The maximum number of newton steps, default is 10.
 *                                            The newton process will stop either when the threshold of ratio*cube_size is matched, or the number of steps allowed has been reached.
 *  @param {number} params.dichotomy NOT YET IMPLEMENTED Add dichotomy steps to position each vertex. Usually using convergence is better, except if the implicit
 *                                   field is such that congerging is not possible (for example, null gradients on large areas)
 *  @constructor
 */
var SlidingMarchingCubes = function(blobtree, params) {

    var params = params || {};

    this.blobtree = blobtree;

    this.uniformZ = params.zResolution === "uniform" ? true : false;

    this.detail_ratio = params.detailRatio ? Math.max(0.01, params.detailRatio) : 1.0;

    if(params.convergence){
        this.convergence = params.convergence;
        this.convergence.ratio = this.convergence.ratio || 0.01;
        this.convergence.step = this.convergence.step || 10;
    }else{
        this.convergence = null;
    }

    this.progress = params.progress ? params.progress : function(percent){
        //console.log(percent);
    };

    /** @type {Int32Array} */
    this.reso = new Int32Array(3);
    this.steps = {
        x:null,
        y:null,
        z:null
    };
    /** @type {!{x:number,y:number,z:number}} */
    this.curr_steps = {
        x:0,
        y:0,
        z:0
    };
    // = this.curr_steps.x*this.curr_steps.y*this.curr_steps.z
    this.curr_step_vol = 0;

    /**
     *  Sliding values array
     *  @type {!Array.<Float32Array>}
     */
    this.values_xy = [
        null,
        null
    ];
    /**
     *  Sliding values array
     *  @type {!Array.<Int32Array>}
     */
    this.vertices_xy = [
        null,
        null
    ];
    this.areas = [];
    this.min_acc = 1;

    // Processing vars
    this.values = new Array(8);
    this.x      = 0;
    this.y      = 0;
    this.z      = 0;
    this.mask = 0;
    this.edge_cross = [
        false,  // Tables.EdgeVMap[0], x=1
        false, false, false,
        false,  // edge 2 : Tables.EdgeVMap[4], y=1
        false, false, false,
        false,   // edge 3 : Tables.EdgeVMap[8], z=1
        false, false, false
    ];

    this.vertex = new THREE.Vector3(0,0,0);   // vertex associated to the cell if any
    this.vertex_n = new THREE.Vector3(0,0,0); // vertex normal
    this.vertex_m = new Material();           // vertex material


    // Vars and tmp vars for extension checks
    this.extended = false;
    this.dis_o_aabb = new THREE.Box3();
    this.ext_p = new THREE.Vector3();

    /**
     *  Resulting mesh data
     */
    this.geometry = null;
};

/**
 *  Initialize the internal Geometry structure.
 *  @private
 */
SlidingMarchingCubes.prototype.initGeometry = function(){
    this.geometry = {
        position:[],
        normal:[],
        color:[],
        metalness:[],
        roughness:[],
        nVertices:0,
        faces:[],
        nFaces:0,
        addVertex:function(data){
            this.position.push(data.p.x, data.p.y, data.p.z);
            this.normal.push(data.n.x, data.n.y, data.n.z);
            this.color.push(data.c.r, data.c.g, data.c.b);
            this.roughness.push(data.r);
            this.metalness.push(data.m);
            this.nVertices++;
        },
        addFace:function(a,b,c){
            this.faces.push(a,b,c);
            this.nFaces++;
        }
    };
};

/**
 *  Build the resulting BufferGeometry from current values in this.geometry.
 *  used in compute function.
 *  @private
 */
SlidingMarchingCubes.prototype.buildResultingBufferGeometry = function(){
    var res = new THREE.BufferGeometry();
    res.addAttribute( 'position',  new THREE.BufferAttribute( new Float32Array( this.geometry.position ),  3 ) );
    res.addAttribute( 'normal',    new THREE.BufferAttribute( new Float32Array( this.geometry.normal ),    3 ) );
    res.addAttribute( 'color',     new THREE.BufferAttribute( new Float32Array( this.geometry.color ),     3 ) );
    res.addAttribute( 'roughness', new THREE.BufferAttribute( new Float32Array( this.geometry.roughness ), 1 ) );
    res.addAttribute( 'metalness', new THREE.BufferAttribute( new Float32Array( this.geometry.metalness ), 1 ) );

    res.setIndex(new THREE.BufferAttribute(
        this.geometry.nVertices >65535 ? new Uint32Array(this.geometry.faces) : new Uint16Array(this.geometry.faces), 1 )
    );

    return res;
};

/**
 *  Set values in this.values_xy[1] to 0
 *  @private
 */
SlidingMarchingCubes.prototype.setFrontToZero = function(){
    // init to 0, can be omptim later
    for(var i=0; i<this.values_xy[1].length; ++i){
        this.values_xy[1][i] = 0;
    }
};

/**
 *  Set values in this.values_xy[1] to -1.
 *  -1 is a marker to state the value has not been computed nor interpolated
 *  @private
 */
SlidingMarchingCubes.prototype.setFrontToMinus = function(){
    // init to 0, can be omptim later
    for(var i=0; i<this.values_xy[1].length; ++i){
        this.values_xy[1][i] = -1;
    }
};

/**
 *  Set values in this.values_xy[1] to 0 wherever it is -1.
 *  @private
 */
SlidingMarchingCubes.prototype.setFrontToZeroIfMinus = function(){
    // init to 0, can be omptim later
    for(var i=0; i<this.values_xy[1].length; ++i){
        if(this.values_xy[1][i] === -1){
            this.values_xy[1][i] = 0;
        }
    }
};

/**
 *  Perform bilinear interpolation in a given 2D box to set values in front array
 *
 *  @param {number} cx Coordinate x of bottom left corner of the front array
 *  @param {number} cy Coordinate x of bottom left corner of the front array
 *  @param {number} cz Coordinate x of bottom left corner of the front array
 *
 *  @param {number} x0 Lower x box osition in the array
 *  @param {number} x1 Upper x box position in the array
 *  @param {number} y0 Lower y box position in the array
 *  @param {number} y1 Upper y box position in the array
 *
 *  @private
 */
SlidingMarchingCubes.prototype.interpolateInBox = function(cx,cy,cz, x0,x1,y0,y1)
{
    var varr = this.values_xy[1];

    var nx = x1-x0;
    var ny = y1-y0;

    /*
    this.computeFrontValAtBoxCorners(cx,cy,cz, new THREE.Vector2(x0,y0), new THREE.Vector2(x1,y1));
    var mask = this.computeBoxMask(new THREE.Vector2(x0,y0), new THREE.Vector2(x1,y1));
    if(!(mask === 0xf || mask === 0x0)){
        throw "Error bad mask when interpolating";
    }
    */

    if(nx>1){
        // must interpolate
        var line = y0*this.reso[0];
        var val0 = varr[line+x0];
        var v_step = (varr[line+x1] - val0)/nx;
        for(var i = 1;i<nx;++i){
            if(varr[line+x0+i] === -1){
                varr[line+x0+i] = val0+i*v_step;
                //this.computeFrontValAt(cx,cy,cz,x0+i,y0);
            }
        }
    }

    if(ny>1){
        // compute upper line
        var line = y1*this.reso[0];
        var val0 = varr[line+x0];
        var v_step = (varr[line+x1] - val0)/nx;
        for(var i = 1;i<nx;++i){
            if(varr[line+x0+i] ===-1){
                varr[line+x0+i] = val0+i*v_step;
                //this.computeFrontValAt(cx,cy,cz,x0+i,y1);
            }
        }

        for(var i = 0;i<=nx;++i){
            val0 = varr[y0*this.reso[0]+x0+i];
            v_step = (varr[y1*this.reso[0]+x0+i] - val0)/ny;
            for(var k = 1;k<ny;++k){
                if(varr[(y0+k)*this.reso[0]+x0+i] === -1){
                    varr[(y0+k)*this.reso[0]+x0+i] = val0+k*v_step;
                    //if(i===0 || i==nx){
                    //    this.computeFrontValAt(cx,cy,cz,x0+i,(y0+k));
                    //}
                }
            }
        }
    }

};

/**
 *  Compute blobtree value at a given position in the front sliding array.
 *
 *  @param {number} cx Coordinate x of bottom left corner of the front array
 *  @param {number} cy Coordinate x of bottom left corner of the front array
 *  @param {number} cz Coordinate x of bottom left corner of the front array
 *
 *  @param {number} x X position in the array
 *  @param {number} y Y position in the array
 *
 *  @private
 */
SlidingMarchingCubes.prototype.computeFrontValAt = function(cx, cy, cz, x,y){
    this.computeFrontValAtClosure(cx, cy, cz, x,y);
};
/**
 *  Function using closure to have static variable. Wrapped in computeFrontValAt
 *  for profiling purpose.
 */
SlidingMarchingCubes.prototype.computeFrontValAtClosure = (function(){
    var eval_res = {v:0};
    var p = new THREE.Vector3();
    return function(cx, cy, cz, x,y){
        var index = y*this.reso[0]+x;
        eval_res.v = this.blobtree.getNeutralValue();
        if(this.values_xy[1][index] === -1){
            p.set(
                cx+x*this.min_acc,
                cy+y*this.min_acc,
                cz
            );
            this.blobtree.value(p, eval_res);
            this.values_xy[1][index] = eval_res.v;
        }
    };
})();

/**
 *  Compute corner values in the front buffer in 2D box defined by min,max
 *  @param {number} cx X coordinate of the front buffer corner
 *  @param {number} cy Y coordinate of the front buffer corner
 *  @param {number} cz Z coordinate of the front buffer corner
 *  @param {!THREE.Vector2} min 2D box min
 *  @param {!THREE.Vector2} max 2D box max
 */
SlidingMarchingCubes.prototype.computeFrontValAtBoxCorners = function(cx,cy,cz, min, max){
    this.computeFrontValAt(cx,cy,cz, min.x, min.y);
    this.computeFrontValAt(cx,cy,cz, min.x, max.y);
    this.computeFrontValAt(cx,cy,cz, max.x, min.y);
    this.computeFrontValAt(cx,cy,cz, max.x, max.y);
};

/**
 *  Compute all values in the front buffer in 2D box defined by min,max
 *  @param {number} cx X coordinate of the front buffer corner
 *  @param {number} cy Y coordinate of the front buffer corner
 *  @param {number} cz Z coordinate of the front buffer corner
 *  @param {!THREE.Vector2} min 2D box min
 *  @param {!THREE.Vector2} max 2D box max
 */
SlidingMarchingCubes.prototype.computeFrontValInBox = function(cx,cy,cz, min, max){
    for(var xx = min.x; xx<=max.x; ++xx){
        for(var yy = min.y; yy<=max.y; ++yy){
            this.computeFrontValAt(cx,cy,cz, xx, yy);
        }
    }
};

/**
 *  Set all values in 2D box min,max at 0.
 *  @param {!THREE.Vector2} min 2D box min
 *  @param {!THREE.Vector2} max 2D box max
 */
SlidingMarchingCubes.prototype.setFrontValZeroInBox = function(min, max){
    for(var ix=min.x; ix<=max.x; ++ix){
        for(var iy=min.y; iy<=max.y; ++iy){
            this.values_xy[1][iy*this.reso[0]+ix] = 0;
        }
    }
};

/**
 *  Compute 2D mask of a given 2D box. Mask is an hex integer unique for each
 *  combination of iso value crossing (like in 3D marching cubes, but in 2D).
 *  @param {!THREE.Vector2} min 2D box min
 *  @param {!THREE.Vector2} max 2D box max
 *  @return {number} The mask
 */
SlidingMarchingCubes.prototype.computeBoxMask = function(min, max){
    var mask = 0;
    mask |= (this.values_xy[1][min.y*this.reso[0]+min.x] > this.blobtree.getIsoValue()) ? (1<<0) : 0;
    mask |= (this.values_xy[1][min.y*this.reso[0]+max.x] > this.blobtree.getIsoValue()) ? (1<<1) : 0;
    mask |= (this.values_xy[1][max.y*this.reso[0]+max.x] > this.blobtree.getIsoValue()) ? (1<<2) : 0;
    mask |= (this.values_xy[1][max.y*this.reso[0]+min.x] > this.blobtree.getIsoValue()) ? (1<<3) : 0;
    return mask;
};

/**
 *  Return 0 if and only if all coners value of 2D box min,max are 0
 *  @param {!THREE.Vector2} min 2D box min
 *  @param {!THREE.Vector2} max 2D box max
 *  @return {number}
 */
SlidingMarchingCubes.prototype.checkZeroBox = function(min, max){
    return   this.values_xy[1][min.y*this.reso[0]+min.x]
           + this.values_xy[1][min.y*this.reso[0]+max.x]
           + this.values_xy[1][max.y*this.reso[0]+max.x]
           + this.values_xy[1][max.y*this.reso[0]+min.x];
};


/**
 *  Recursive function computing values in the given 2D box (which is a subbox
 *  of the whole front buffer), by cuting in 2 at each step. This function is
 *  "smart", since computed boxes are buid with their scalar field accuracy.
 *  Depending on the accuracy, scalar field values may be computed from the
 *  blobtree or interpolated (linear).
 *  @param {number} cx X coordinate of the front buffer corner
 *  @param {number} cy Y coordinate of the front buffer corner
 *  @param {number} cz Z coordinate of the front buffer corner
 *  @param {!Array.<!Box2Acc>} boxes2D 2D boxes intersecting box. Used to compute accuracy for split boxes.
 *  @param {!Box2Acc} box The 2D box in which we compute values
 */
SlidingMarchingCubes.prototype.recursiveBoxComputation = function(cx,cy,cz, box, boxes2D){
    // split the current box in 2 boxes in the largest dimension

    var new_boxes = null;
    var diff = new THREE.Vector2(
        Math.round((box.max.x-box.min.x)),
        Math.round((box.max.y-box.min.y))
    );

    if(diff.x>1 && diff.x>=diff.y){
        // cut in x
        var x_cut = box.min.x+Math.floor(diff.x/2);
        new_boxes = [
            new Box2Acc(box.min, new THREE.Vector2(x_cut, box.max.y),
                10000 , 10000
            ),
            new Box2Acc(new THREE.Vector2(x_cut, box.min.y),box.max,
                10000 , 10000
            )
        ];
        this.computeFrontValAt(cx,cy,cz, x_cut, box.min.y);
        this.computeFrontValAt(cx,cy,cz, x_cut, box.max.y);
        //this.computeFrontValAt(cx,cy,cz, x_cut+1, box.min.y);
        //this.computeFrontValAt(cx,cy,cz, x_cut+1, box.max.y);
    }else{
        // cut in y
        if(diff.y>1){
            var y_cut = box.min.y+Math.floor(diff.y/2);
            new_boxes = [
                 new Box2Acc(box.min,new THREE.Vector2(box.max.x, y_cut),
                    10000 , 10000
                ),
                 new Box2Acc(new THREE.Vector2(box.min.x, y_cut), box.max,
                    10000 , 10000
                )
            ];
            this.computeFrontValAt(cx,cy,cz, box.min.x, y_cut);
            this.computeFrontValAt(cx,cy,cz, box.max.x, y_cut);
            //this.computeFrontValAt(cx,cy,cz, box.min.x, y_cut+1);
            //this.computeFrontValAt(cx,cy,cz, box.max.x, y_cut+1);
        }else{
            // the box is 1 in size, so we stop
            return;
        }
    }
    /*
    if(new_boxes[0].intersectsBox(new_boxes[1])){
        console.log("Fucking shit");
    }
    */

    // Compute accuracies for each box
    var boxes2D_rec = [ [], [] ];
    for(var i=0; i<boxes2D.length; ++i){
        for(var k=0; k<new_boxes.length;++k){
            if(new_boxes[k].intersectsBox(boxes2D[i])){
                new_boxes[k].setRawAcc(
                    Math.min(
                        new_boxes[k].getRawAcc(),
                        boxes2D[i].getRawAcc()
                        )
                );
                new_boxes[k].setNiceAcc(
                    Math.min(
                        new_boxes[k].getNiceAcc(),
                        boxes2D[i].getNiceAcc()
                    )
                );
                boxes2D_rec[k].push(boxes2D[i]);
            }
        }
    }

    for(var k=0; k<new_boxes.length;++k){
        var b = new_boxes[k];

        var bsize = b.getSize(new THREE.Vector3());

        if(boxes2D_rec[k].length ===0){
            this.setFrontValZeroInBox(b.min, b.max);
        }else{
            if(bsize.x<=b.getRawAcc() && bsize.y<=b.getRawAcc()){
                // We reach the raw level
                var mask = this.computeBoxMask(b.min, b.max)
                if( mask === 0xf
                    ||
                    mask === 0x0
                ){
                    // all points are inside, since we reached raw, we can interpolate
                    // Note when all values are very close to 0, it's useless to interpolate, setting 0 can do.
                    this.interpolateInBox(cx,cy,cz, b.min.x, b.max.x, b.min.y, b.max.y);

                    // OR just compute all values.
                    // this.computeFrontValInBox(cx,cy,cz,b.min,b.max);
                }else{
                    //Surface is crossed, must go down to the nice
                    if(bsize.x<=b.getNiceAcc() && bsize.y<=b.getNiceAcc()){
                        // We are under nice acc, just interpolate
                        this.interpolateInBox(cx,cy,cz, b.min.x, b.max.x, b.min.y, b.max.y);

                        // OR just compute all values.
                        // this.computeFrontValInBox(cx,cy,cz,b.min,b.max);
                    }else{
                        this.recursiveBoxComputation(cx,cy,cz, b, boxes2D_rec[k]);
                        //console.log("going down in " + b.toString());
                    }
                }
            }else{
                // we did not reach the raw level, so we must cut again
                this.recursiveBoxComputation(cx,cy,cz, b, boxes2D_rec[k]);
            }
        }
    }
};

/**
 *  Compute all values in the front buffer.
 *  @param {number} cx X coordinate of the front buffer corner
 *  @param {number} cy Y coordinate of the front buffer corner
 *  @param {number} cz Z coordinate of the front buffer corner
 */
SlidingMarchingCubes.prototype.computeFrontValues = function(cx,cy,cz)
{
        this.setFrontToMinus();

        var areas = this.blobtree.getAreas();
        var bigbox =  new Box2Acc();
        bigbox.makeEmpty();
        var boxes2D = [];
        for(var i=0; i<areas.length; ++i){
            var raw_acc = Math.round(areas[i].bv.getMinRawAcc()*this.detail_ratio/this.min_acc);
            var nice_acc = Math.round(areas[i].bv.getMinAcc()*this.detail_ratio/this.min_acc);
            var x_min = Math.max(0,Math.floor((areas[i].aabb.min.x-cx)/this.min_acc));
            var y_min = Math.max(0,Math.floor((areas[i].aabb.min.y-cy)/this.min_acc));
            var x_max = Math.min(this.reso[0]-1,Math.ceil( (areas[i].aabb.max.x-cx)/this.min_acc));
            var y_max = Math.min(this.reso[1]-1,Math.ceil( (areas[i].aabb.max.y-cy)/this.min_acc));
            boxes2D.push(
                 new Box2Acc(
                    new THREE.Vector2(x_min, y_min),
                    new THREE.Vector2(x_max, y_max),
                    nice_acc, raw_acc
                )
            );
            bigbox.union(boxes2D[boxes2D.length-1]);
        }

        bigbox.intersect(new Box2Acc(new THREE.Vector2(0, 0), new THREE.Vector2(this.reso[0], this.reso[1]), bigbox.getNiceAcc(), bigbox.getRawAcc()));

        this.computeFrontValAtBoxCorners(cx,cy,cz, bigbox.min, bigbox.max);
        this.recursiveBoxComputation(cx,cy,cz, bigbox, boxes2D);

        this.setFrontToZeroIfMinus();
};


/**
 *   get the min accuracy needed for this zone
 *   @param {THREE.Box3} bbox the zone for which we want the minAcc
 *   @return {number} the min acc for this zone
 */
SlidingMarchingCubes.prototype.getMinAcc = function(bbox) {
    var areas = this.blobtree.getAreas();
    var minAcc = Number.MAX_VALUE;

    for(var i=0; i<areas.length; i++) {
        var area = areas[i];
        if( area.aabb.intersectsBox(bbox) ) {
            if( area.bv ) {
                // it's a new area, we can get the min acc
                var areaMinAcc = area.bv.getMinAcc();
                if( areaMinAcc < minAcc ) {
                    minAcc = areaMinAcc;
                }
            }
        }
    }
    return minAcc*this.detail_ratio;
}

/**
 *   get the max accuracy needed for this zone
 *   @param {THREE.Box3} bbox the zone for which we want the minAcc
 *   @return {number} the max acc for this zone
 */
SlidingMarchingCubes.prototype.getMaxAcc = function(bbox) {
    var areas = this.blobtree.getAreas();
    var maxAcc = 0;

    for(var i=0; i<areas.length; i++) {
        var area = areas[i];
        if( area.aabb.intersectsBox(bbox) ) {
            if( area.bv ) {
                // it's a new area, we can get the min acc
                var areaMaxAcc = area.bv.getMinAcc();
                if( areaMaxAcc > maxAcc ) {
                    maxAcc = areaMaxAcc;
                }
            }
        }
    }
    return maxAcc*this.detail_ratio;
}

/**
 *  Note : returned mesh data will be accurate only if extened AABB difference
 *  with o_aabb is small. compared to o_aabb size.
 *  @param {THREE.Box3} o_aabb The aabb where to compute the surface, if null, the blobtree AABB will be used
 *  @param {boolean=} extended True if we want the agorithm to extend the computation zone
 *                            to ensure overlap with a mesh resulting from a computation
 *                            in a neighbouring aabb (Especially usefull for parallelism).
 */
SlidingMarchingCubes.prototype.compute = function(o_aabb, extended) {

    this.initGeometry();

    var timer_begin = new Date();

    this.blobtree.prepareForEval();
    var aabb = null;
    if(o_aabb){
        aabb = o_aabb.clone();
    }else{
        aabb = this.blobtree.getAABB();
    }

    this.extended = extended !== undefined ? extended : false;

    if(this.extended){
        var adims = aabb.getSize(new THREE.Vector3());
        var minAcc = Math.min(
            Math.min(this.getMinAcc(aabb), adims[0]),
            Math.min(adims[1], adims[2])
        );
        var acc_box = aabb.clone();
        var final_bbox = aabb.clone();
        var axis = ['x','y','z'];
        for(var k=0; k<axis.length; ++k){
            acc_box.max[axis[k]] = aabb.min[axis[k]] + minAcc;
            var slice_max = this.getMaxAcc(acc_box);
            if(slice_max !== 0){
                final_bbox.min[axis[k]] = final_bbox.min[axis[k]] - slice_max;
            }
            acc_box.max[axis[k]] = aabb.max[axis[k]] - minAcc;
            slice_max = this.getMaxAcc(acc_box);
            if(slice_max !== 0){
                final_bbox.max[axis[k]] = final_bbox.max[axis[k]] + slice_max;
            }
        }
        aabb.copy(final_bbox);
    }

    var aabb_trim = [];
    var aabb_trim_parents = [];
    if(o_aabb){
        this.blobtree.externalTrim(aabb, aabb_trim, aabb_trim_parents);
        this.blobtree.prepareForEval();
    }

    this.areas = this.blobtree.getAreas();

    // if no areas, blobtree is empty so stop and send an empty mesh.
    if(this.areas.length === 0){
        this.progress(100);
        return new THREE.BufferGeometry();
    }

    this.min_acc = this.areas.length !== 0 ? this.areas[0].bv.getMinAcc() : 1;
    for(var i=0; i<this.areas.length; ++i){
        if(this.areas[i].bv.getMinAcc()<this.min_acc){
            this.min_acc = this.areas[i].bv.getMinAcc();
        }
    }
    this.min_acc = this.min_acc*this.detail_ratio;

    var corner = aabb.min;
    var dims = aabb.getSize(new THREE.Vector3());

    this.steps.z = new Float32Array(Math.ceil(dims.z/this.min_acc)+2);
    var z = corner.z;
    this.steps.z[0] = corner.z;
    var index = 1;
    var areas = this.blobtree.getAreas();
    while(this.steps.z[index-1]<corner.z+dims.z){
        var min_step = dims.z;
        // If uniformZ is true, we do not adapt z stepping to local slice accuracy.
        if(this.uniformZ){
            min_step = this.min_acc;
        }else{
            // find minimum accuracy needed in this slice.
            for(var i=0; i<areas.length; ++i){
                min_step = Math.min(min_step, areas[i].bv.getAxisProjectionMinStep('z',this.steps.z[index-1])*this.detail_ratio);
            }
        }
        this.steps.z[index] = this.steps.z[index-1]+min_step;
        index++;
    }
    this.reso[2] = index;

    this.reso[0] = Math.ceil(dims.x/this.min_acc)+2;
    this.reso[1] = Math.ceil(dims.y/this.min_acc)+2;

    // If necessary, set this.dis_o_aabb
    // Reminder : dis_o_aabb is the discret o_aabb, ie indices for which we are in the o_aabb.
    if(this.extended){
        var i=0;
        this.dis_o_aabb.set(new THREE.Vector3(-1,-1,-1),new THREE.Vector3(-1,-1,-1));
        while(i<this.reso[2] && this.dis_o_aabb.min.z === -1){
            if(this.steps.z[i] >= o_aabb.min.z){
                this.dis_o_aabb.min.z = i;
            }
            i++;
        }
        if(i>this.reso[2]-1){ this.dis_o_aabb.min.z = this.reso[2]-1; } // should never happen

        i = this.reso[2]-1;
        while(i>=0 && this.dis_o_aabb.max.z === -1){
            if(this.steps.z[i] < o_aabb.max.z){
                this.dis_o_aabb.max.z = i;
            }
            i--;
        }
        if(i<0){ this.dis_o_aabb.max.z = 0; } // should never happen

        this.dis_o_aabb.min.x = Math.round((o_aabb.min.x-aabb.min.x)/this.min_acc);
        this.dis_o_aabb.min.y = Math.round((o_aabb.min.y-aabb.min.y)/this.min_acc);
        this.dis_o_aabb.max.x = this.reso[0]-2 - Math.round((aabb.max.x-o_aabb.max.x)/this.min_acc);
        this.dis_o_aabb.max.y = this.reso[1]-2 - Math.round((aabb.max.y-o_aabb.max.y)/this.min_acc);
    }
    // Back values
    this.values_xy[0] = new Float32Array(this.reso[0]*this.reso[1]);
    // Front values
    this.values_xy[1] = new Float32Array(this.reso[0]*this.reso[1]);

    this.vertices_xy[0] = new Int32Array(this.reso[0]*this.reso[1]);
    this.vertices_xy[1] = new Int32Array(this.reso[0]*this.reso[1]);

    // Aabb for trimming the blobtree
    var trim_aabb = new THREE.Box3();
    this.computeFrontValues(corner.x, corner.y, corner.z);

    var percent = 0;

    for(var iz=0; iz<this.reso[2]-1; ++iz){

        // Switch the 2 arrays, and fill the one in front
        var switcher = this.values_xy[0];
        this.values_xy[0] = this.values_xy[1];
        this.values_xy[1] = switcher;
        switcher = this.vertices_xy[0];
        this.vertices_xy[0] = this.vertices_xy[1];
        this.vertices_xy[1] = switcher;

        var z1 = this.steps.z[iz+1];
        trim_aabb.set(  new THREE.Vector3(
                            corner.x,
                            corner.y,
                            z1-this.min_acc/64
                        ),
                        new THREE.Vector3(
                            corner.x+this.reso[0]*this.min_acc,
                            corner.y+this.reso[1]*this.min_acc,
                            z1+this.min_acc/64
                        )
        );
        this.blobtree.internalTrim(trim_aabb);
        this.blobtree.prepareForEval();
        this.computeFrontValues(corner.x, corner.y, z1);
        this.blobtree.internalUntrim(trim_aabb);
        this.blobtree.prepareForEval();

        this.z = this.steps.z[iz];

        this.curr_steps.z = this.steps.z[iz+1]-this.steps.z[iz];
        this.curr_steps.x = this.min_acc;
        this.curr_steps.y = this.min_acc;
        this.curr_step_vol = this.curr_steps.x*this.curr_steps.y*this.curr_steps.z;

        for(var iy=0; iy<this.reso[1]-1; ++iy){
            for(var ix=0; ix<this.reso[0]-1; ++ix){
                this.y = corner.y + iy*this.min_acc;
                this.fetchAndTriangulate(ix, iy, iz, corner);
            }
        }

        if(Math.round(100*iz/this.reso[2]) > percent){
            percent = Math.round(100*iz/this.reso[2]);
            this.progress(percent);
        }
    }


    if(o_aabb){
        this.blobtree.untrim(aabb_trim, aabb_trim_parents);
        this.blobtree.prepareForEval();
    }

    var timer_end = new Date();
    console.log("Sliding Marching Cubes computed in " + (timer_end-timer_begin) + "ms");

    // Clear memory, in case this object is kept alive
    this.values_xy[0] = null;
    this.values_xy[1] = null;
    this.vertices_xy[0] = null;
    this.vertices_xy[1] = null;

    this.progress(100);

    return this.buildResultingBufferGeometry();
};

/**
 *  Check values for cube at x, y. Ie get values front front and back arrays,
 *  compute marching cube mask, build the resulting vertex and faces if necessary.
 *  @param {number} x
 *  @param {number} y
 *  @param {THREE.Vector3} corner Bottom left corner of front array.
 */
SlidingMarchingCubes.prototype.fetchAndTriangulate = function(x,y,z, corner)
{
    var idx_y_0 = y*this.reso[0]+x;
    var idx_y_1 = (y+1)*this.reso[0]+x;
    this.values[0] = this.values_xy[0][idx_y_0];    //v_000;
    this.values[1] = this.values_xy[1][idx_y_0];    //v_001;
    this.values[2] = this.values_xy[0][idx_y_1];    //v_010;
    this.values[3] = this.values_xy[1][idx_y_1];    //v_011;
    this.values[4] = this.values_xy[0][idx_y_0+1];  //v_100;
    this.values[5] = this.values_xy[1][idx_y_0+1];  //v_101;
    this.values[6] = this.values_xy[0][idx_y_1+1];  //v_110;
    this.values[7] = this.values_xy[1][idx_y_1+1];  //v_111;

    this.computeMask();
    if(this.mask !== 0x0){
        if(this.mask !== 0xff){
            this.x = corner.x + x*this.min_acc;
            this.computeVertex();
            this.geometry.addVertex({
                p:this.vertex,
                n:this.vertex_n,
                c:this.vertex_m.getColor(),
                r:this.vertex_m.getRoughness(),
                m:this.vertex_m.getMetalness()
            });
            this.vertices_xy[1][idx_y_0] = this.geometry.nVertices-1;
            this.triangulate(x,y,z);
        }
    }
};

/**
 *  Push 2 faces in direct order (right handed).
 *  @param {number} v1 Index of vertex 1 in this.geometry
 *  @param {number} v2 Index of vertex 2 in this.geometry
 *  @param {number} v3 Index of vertex 3 in this.geometry
 *  @param {number} v4 Index of vertex 4 in this.geometry
 */
SlidingMarchingCubes.prototype.pushDirectFaces = function(v1,v2,v3,v4){
    this.geometry.addFace(v1,v2,v3);
    this.geometry.addFace(v3,v4,v1);
};
/**
 *  Push 2 faces in undirect order (left handed).
 *  @param {number} v1 Index of vertex 1 in this.geometry
 *  @param {number} v2 Index of vertex 2 in this.geometry
 *  @param {number} v3 Index of vertex 3 in this.geometry
 *  @param {number} v4 Index of vertex 4 in this.geometry
 */
SlidingMarchingCubes.prototype.pushUndirectFaces = function(v1,v2,v3,v4){
    this.geometry.addFace(v3,v2,v1);
    this.geometry.addFace(v1,v4,v3);
}

/**
 *  Compute and add faces depending on current cell crossing mask
 *  @param {number} x Current cell x coordinate in the grid (integer)
 *  @param {number} y Current cell y coordinate in the grid (integer)
 *  @param {number} z Current cell z coordinate in the grid (integer)
 */
SlidingMarchingCubes.prototype.triangulate = function(x,y,z){
    var idx_y_0 = y*this.reso[0]+x;
    if(this.edge_cross[0] && y!==0 && z!==0){
        // x edge is crossed
        // Check orientation
        var v1 = this.vertices_xy[1][idx_y_0];
        var v2 = this.vertices_xy[1][(y-1)*this.reso[0]+x];
        var v3 = this.vertices_xy[0][(y-1)*this.reso[0]+x];
        var v4 = this.vertices_xy[0][idx_y_0];
        if(this.mask & 0x1){
            this.pushDirectFaces(v1,v2,v3,v4);
        }else{
            this.pushUndirectFaces(v1,v2,v3,v4);
        }

    }
    if(this.edge_cross[4] && x!==0 && z!==0){
        // y edge is crossed
        // Check orientation
        var v1 = this.vertices_xy[1][idx_y_0];
        var v2 = this.vertices_xy[0][idx_y_0];
        var v3 = this.vertices_xy[0][idx_y_0-1];
        var v4 = this.vertices_xy[1][idx_y_0-1];
        if(this.mask & 0x1){
            this.pushDirectFaces(v1,v2,v3,v4);
        }else{
            this.pushUndirectFaces(v1,v2,v3,v4);
        }

    }
    if(this.edge_cross[8] && x!==0 && y!==0){
        // z edge is crossed
        // Check orientation
        var v1 = this.vertices_xy[1][idx_y_0];
        var v2 = this.vertices_xy[1][idx_y_0-1];
        var v3 = this.vertices_xy[1][(y-1)*this.reso[0]+x-1];
        var v4 = this.vertices_xy[1][(y-1)*this.reso[0]+x];
        if(this.mask & 0x1){
            this.pushDirectFaces(v1,v2,v3,v4);
        }else{
            this.pushUndirectFaces(v1,v2,v3,v4);
        }
    }
};

/**
 *  Compute the vertex in the current cube.
 *  Use this.x, this.y, this.z
 */
SlidingMarchingCubes.prototype.computeVertex = (function() {
    // Function static variable
    var eval_res = {v:null, g:new THREE.Vector3(0,0,0), m:new Material()};
    var conv_res = new THREE.Vector3();

    return function()
    {
        eval_res.v = this.blobtree.getNeutralValue();

        // Optimization note :
        //      Here I dont use tables but performances may be improved
        //      by using tables. See marching cube and surface net for examples

        // Average edge intersection
        var e_count = 0;

        this.vertex.set(0,0,0);

        //For every edge of the cube...
        for(var i=0; i<12; ++i)
        {

            // --> the following code does not seem to work. Tables.EdgeCross may be broken
            //Use edge mask to check if it is crossed
            // if(!(edge_mask & (1<<i))) {
            //     continue;
            // }

            //Now find the point of intersection
            var e0 = Tables.EdgeVMap[i][0];       //Unpack vertices
            var e1 = Tables.EdgeVMap[i][1];
            var p0 = Tables.VertexTopo[e0];
            var p1 = Tables.VertexTopo[e1];
            var g0 = this.values[e0];                //Unpack grid values
            var g1 = this.values[e1];

            // replace the mask check with that. Slower.
            this.edge_cross[i] = ((g0>this.blobtree.getIsoValue()) !== (g1>this.blobtree.getIsoValue()));
            if( !this.edge_cross[i] ){
                continue;
            }
            //If it did, increment number of edge crossings
            ++e_count;

            var d = (g1-g0);
            var t  = 0;  //Compute point of intersection
            if(Math.abs(d) > 1e-6) {
                t = (this.blobtree.getIsoValue()-g0) / d;
            } else {
                continue;
            }

            this.vertex.x += (1.0-t)*p0[0] + t * p1[0];
            this.vertex.y += (1.0-t)*p0[1] + t * p1[1];
            this.vertex.z += (1.0-t)*p0[2] + t * p1[2];
        }

        this.vertex.x = this.x + this.curr_steps.x*this.vertex.x/e_count;
        this.vertex.y = this.y + this.curr_steps.y*this.vertex.y/e_count;
        this.vertex.z = this.z + this.curr_steps.z*this.vertex.z/e_count;

        // now make some convergence step
        // Note : it cost 15 to 20% performance lost
        //        and the result does not seem 15 et 20% better...
        if(this.convergence){
            Convergence.safeNewton3D(
                this.blobtree,      // Scalar Field to eval
                this.vertex,                  // 3D point where we start, must comply to THREE.Vector3 API
                this.blobtree.getIsoValue(),               // iso value we are looking for
                this.min_acc*this.convergence.ratio ,               // Geometrical limit to stop
                this.convergence.step,                           // limit of number of step
                this.min_acc,                     // Bounding volume inside which we look for the iso, getting out will make the process stop.
                conv_res                          // the resulting point
            );
            this.vertex.copy(conv_res);
        }

        this.blobtree.value(this.vertex, eval_res);

        eval_res.g.normalize();
        this.vertex_n.copy(eval_res.g).multiplyScalar(-1);
        this.vertex_m.copy(eval_res.m);
    };
})();

/**
 *  Compute mask of the current cube.
 *  Use this.values, set this.mask
 */
SlidingMarchingCubes.prototype.computeMask = function()
{
    this.mask = 0;

    //For each this, compute cube mask
    for(var i=0; i<8; ++i) {
        var s = this.values[i];
        this.mask |= (s > this.blobtree.getIsoValue()) ? (1<<i) : 0;
    }
};

module.exports = SlidingMarchingCubes;






















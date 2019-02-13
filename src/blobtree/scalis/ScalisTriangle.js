'use strict';

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("../Types.js");
const Material = require("../Material.js");
const ScalisPrimitive = require("./ScalisPrimitive.js");
const ScalisVertex = require("./ScalisVertex.js");
const ScalisMath = require("./ScalisMath.js");
const AreaScalisTri = require("../areas/AreaScalisTri.js");
const Accuracies = require("../accuracies/Accuracies.js");

const TriangleUtils = require("../../utils/TriangleUtils.js");

// Number of sample in the Simpsons integration.
var sampleNumber = 10;

/**
 *  This class implements a ScalisTriangle primitive.
 *  CONVOL Evaluation is not exact so we use simpsons numerical integration.
 *
 *  @constructor
 *  @param {!Array.<!ScalisVertex>} v the 3 vertices for the triangle
 *  @param {string} volType type of volume
 *  @param {number} density Density like for other Scalis Primitives. This parameter is here only to ensure signature consistancy.
 *                          It is not implemented for now and will therefore be set to 1.0.
 *  @param {!Array.<!Material>} mats the triangle materials per vertices
 *  @extends ScalisPrimitive
 */
var ScalisTriangle = function(v, volType, density, mats) {
    // Calling parent class initialize function
    ScalisPrimitive.call(this);

    if(density !== 1.0){
        throw "Error in ScalisTriangle : cannot use a density different from 1.0, not implemented.";
    }

    this.volType = volType;
    this.materials     = mats !== null? mats : [Material.defaultMaterial.clone(), Material.defaultMaterial.clone(), Material.defaultMaterial.clone()];

    this.v = v;
    this.v[0].setPrimitive(this);
    this.v[1].setPrimitive(this);
    this.v[2].setPrimitive(this);
    this.min_thick = Math.min(this.v[0].getThickness(), this.v[1].getThickness(), this.v[2].getThickness());
    this.max_thick = Math.max(this.v[0].getThickness(), this.v[1].getThickness(), this.v[2].getThickness());

    // Temporary for eval
    // TODO : should be wrapped in the eval function scope if possible (ie not precomputed)
    this.res_gseg = {};
    this.tmp_res_gseg = {};

    this.p0p1  = new THREE.Vector3();
    this.p1p2 = new THREE.Vector3();
    this.p2p0 = new THREE.Vector3();
    this.unit_normal = new THREE.Vector3();
    this.unit_p0p1 = new THREE.Vector3();
    this.unit_p1p2 = new THREE.Vector3();
    this.unit_p2p0 = new THREE.Vector3();
    this.length_p0p1 = 0;
    this.length_p1p2 = 0;
    this.length_p2p0 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p0p1 = 0;
    this.main_dir       = new THREE.Vector3();
    this.point_iso_zero = new THREE.Vector3();
    this.ortho_dir      = new THREE.Vector3();
    this.unsigned_ortho_dir= new THREE.Vector3();
    this.proj_dir       = new THREE.Vector3();
    this.equal_weights = false; // Use to skip computations for a specific case

    this.coord_max           = 0;
    this.coord_middle        = 0;
    this.unit_delta_weight   = 0;
    this.longest_dir_special = 0;
    this.max_seg_length      = 0;
    this.half_dir_1 = new THREE.Vector3();
    this.point_half = new THREE.Vector3();
    this.half_dir_2 = new THREE.Vector3();
    this.point_min = new THREE.Vector3();
    this.weight_min = 0;

    this.valid_aabb = false;
};

// inherits from Primitive
ScalisTriangle.prototype = Object.create(ScalisPrimitive.prototype);
ScalisTriangle.prototype.constructor = ScalisTriangle;

ScalisTriangle.type = "ScalisTriangle";
Types.register(ScalisTriangle.type, ScalisTriangle);

ScalisTriangle.prototype.getType = function(){
    return ScalisTriangle.type;
};

ScalisTriangle.prototype.toJSON = function() {
    var res = ScalisPrimitive.prototype.toJSON.call(this);
    return res;
};
ScalisTriangle.fromJSON = function(json){
    var v = [
        ScalisVertex.fromJSON(json.v[0]),
        ScalisVertex.fromJSON(json.v[1]),
        ScalisVertex.fromJSON(json.v[2])
    ];
    var m = [
        Material.fromJSON(json.materials[0]),
        Material.fromJSON(json.materials[1]),
        Material.fromJSON(json.materials[2])
    ];
    return new ScalisTriangle(v, json.volType, 1.0, m);
};

// [Abstract] See Primitive.prepareForEval for more details
ScalisTriangle.prototype.prepareForEval = function() {
    if(!this.valid_aabb)
    {
        this.computeHelpVariables();
        this.valid_aabb = true;
    }
};


// [Abstract] See Primtive.getArea for more details
ScalisTriangle.prototype.getAreas = function() {
    if(!this.valid_aabb){
        console.log("ERROR : Cannot get area of invalid primitive");
        return [];
    }else{
        var segParams = [];
        segParams.push({"norm":         this.length_p0p1,
                        "diffThick":    this.diffThick_p0p1,
                        "dir":          this.unit_p0p1,
                        "v":            [this.v[0], this.v[1]],
                        "ortho_vec_x":  this.v[0].getThickness() - this.v[1].getThickness(),
                        "ortho_vec_y":  this.length_p0p1});
        segParams.push({"norm":         this.length_p1p2,
                        "diffThick":    this.diffThick_p1p2,
                        "dir":          this.unit_p1p2,
                        "v":            [this.v[1], this.v[2]],
                        "ortho_vec_x":  this.v[1].getThickness() - this.v[2].getThickness(),
                        "ortho_vec_y":  this.length_p1p2});
        segParams.push({"norm":         this.length_p2p0,
                        "diffThick":    this.diffThick_p2p0,
                        "dir":          this.unit_p2p0,
                        "v":            [this.v[2], this.v[0]],
                        "ortho_vec_x":  this.v[2].getThickness() - this.v[0].getThickness(),
                        "ortho_vec_y":  this.length_p2p0});
        return [{
            aabb:this.aabb,
            bv: new AreaScalisTri(this.v,
                                this.unit_normal,
                                this.main_dir,
                                segParams,
                                this.min_thick,
                                this.max_thick),
            obj: this
        }];
    }
};

// [Abstract] See Primitive.computeHelpVariables for more details
ScalisTriangle.prototype.computeHelpVariables = function() {
    TriangleUtils.computeVectorsDirs(this);
    // Compute the AABB from the union of the BBox of the vertices
    this.computeAABB();
};

// [Abstract] See ScalisPrimitive.mutableVolType for more details
ScalisTriangle.prototype.mutableVolType = function() {
    return true;
};

// [Abstract] See Primitive.setVolType for more details
ScalisTriangle.prototype.setVolType = function(vt)
{
    if( !(vt == ScalisPrimitive.CONVOL || vt == ScalisPrimitive.DIST) ){
        throw "ERROR : volType must be set to ScalisPrimitive.CONVOL or ScalisPrimitive.DIST";
    }

    if(this.volType != vt){
        this.volType = vt;
        this.invalidAABB();
    }
};

// [Abstract] See Primitive.getVolType for more details
ScalisTriangle.prototype.getVolType = function()
{
    return this.volType;
};

/**
 *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
 *  @param {number} a
 *  @param {number} b
 *  @param {number} c
 *  @return {number} Clamped value
 *  Author: Jakub Korzeniowski
 *  Agency: Softhis
 *  http://www.softhis.com
 */
ScalisTriangle.prototype.clamp = function (a,b,c){
    return Math.max(b,Math.min(c,a));
};

// [Abstract] See Primitive.distanceTo for more details
ScalisTriangle.prototype.distanceTo = (function() {
    var p0p = new THREE.Vector3();
    var p1p = new THREE.Vector3();
    var p2p = new THREE.Vector3();
    var tmp = new THREE.Vector3();
    return function(p) {

        p0p.subVectors(p,this.v[0].getPos());
        p1p.subVectors(p,this.v[1].getPos());
        p2p.subVectors(p,this.v[2].getPos());
        if( tmp.crossVectors(this.p0p1,p0p).dot(this.unit_normal)>0 &&
            tmp.crossVectors(this.p1p2,p1p).dot(this.unit_normal)>0 &&
            tmp.crossVectors(this.p2p0,p2p).dot(this.unit_normal)>0)
        {
            // p is in the triangle
            return Math.abs(p0p.dot(this.unit_normal));
        }else{
            var t0 = p0p.dot(this.p0p1) / this.length_p0p1;
            // clamp is our own function declared there
            t0=this.clamp(t0,0,1);
            tmp.copy(this.p0p1)
                .multiplyScalar(t0)
                .add(this.v[0].getPos());
            t0 = p.distanceToSquared(tmp);

            var t1 = p1p.dot(this.p1p2) / this.length_p1p2;
            // clamp is our own function declared there
            t1=this.clamp(t1,0,1);
            tmp.copy(this.p1p2)
                .multiplyScalar(t1)
                .add(this.v[1].getPos());
            t1 = p.distanceToSquared(tmp);

            var t2 = p2p.dot(this.p2p0) / this.length_p2p0;
            // clamp is our own function declared there
            t2=this.clamp(t2,0,1);
            tmp.copy(this.p2p0)
                .multiplyScalar(t2)
                .add(this.v[2].getPos());
            t2 = p.distanceToSquared(tmp);

            return Math.sqrt(Math.min(Math.min(t0,t1),t2));
        }
    };
})();

// [Abstract] See Primitive.heuristicStepWithin for more details
ScalisTriangle.prototype.heuristicStepWithin = function() {
    return this.weight_min/3;
};

// [Abstract] See Primitive.value for more details
ScalisTriangle.prototype.value = function(p,res) {
    switch(this.volType){
        case ScalisPrimitive.DIST:
            return this.evalDist(p,res);
        case ScalisPrimitive.CONVOL:
            // for now rings are just evaluated as distance surface
            return this.evalConvol(p,res);
        default:
            throw "Unknown volType, use Orga";
        break;
    }
};

/**
 *  value function for Distance volume type (distance field).
 */
// jshint maxstatements:150
ScalisTriangle.prototype.evalDist = (function(){
    var ev_eps = {v:0};
    var p_eps = new THREE.Vector3();
    return function(p,res)
    {
    /*
        // bounding box check (could/should be done in the node ?)
        if( p.x > this.aabb.min_x && p.x < this.aabb.max_x &&
            p.y > this.aabb.min_y && p.y < this.aabb.max_y &&
            p.z > this.aabb.min_z && p.z < this.aabb.max_z
            )
        {
    */
            // First compute the distance to the triangle and find the nearest point
            // Code taken from EuclideanDistance functor, can be optimized.
            var p0_to_p = new THREE.Vector3();
            p0_to_p.subVectors(p,this.v[0].getPos());
            var normal_inv = this.unit_normal.clone().multiplyScalar(-1);
            ///////////////////////////////////////////////////////////////////////
            // We must generalize the principle used for the segment
            if(!this.equal_weights){

                // Now look for the point equivalent to the Z point for the segment.
                // This point Z is the intersection of 3 orthogonal planes :
                //      plane 1 : triangle plane
                //      plane 2 : n = ortho_dir, passing through point
                //      plane 3 : n = main_dir, passing through point_iso_zero_dir1 and point_iso_zero_dir2
                // Formula for a unique intersection of 3 planes : http://geomalgorithms.com/a05-_intersect-1.html
                //  Plane equation from a normal n and a point p0 : <n.(x,y,z)> - <n.p0> = 0
                //
                // TODO : this formula can probably be optimized :
                //        - some elements can be stored
                //        - some assertion are verified and may help to simplify the computation, for example : n3 = n2%n1
                var n1 = normal_inv;
                var n2 = this.unsigned_ortho_dir;
                var n3 = this.main_dir.clone().multiplyScalar(-1);
                var d1 = -this.v[0].getPos().dot(n1);
                var d2 = -p.dot(n2);
                var d3 = -this.point_iso_zero.dot(n3);

                var d1n2n3 = new THREE.Vector3();
                d1n2n3.crossVectors(n2,n3);
                d1n2n3.multiplyScalar(-d1);
                var d2n3n1 = new THREE.Vector3();
                d2n3n1.crossVectors(n3,n1);
                d2n3n1.multiplyScalar(-d2);
                var d3n1n2 = new THREE.Vector3();
                d3n1n2.crossVectors(n1,n2);
                d3n1n2.multiplyScalar(-d3);
                var n2cn3 = new THREE.Vector3();
                n2cn3.crossVectors(n2,n3);
                var Z = new THREE.Vector3(  d1n2n3.x+d2n3n1.x+d3n1n2.x,
                                            d1n2n3.y+d2n3n1.y+d3n1n2.y,
                                            d1n2n3.z+d2n3n1.z+d3n1n2.z);
                Z.divideScalar(n1.dot(n2cn3));

                // Now we want to project in the direction orthogonal to (pZ) and ortho_dir
                var pz = new THREE.Vector3(Z.x-p.x,Z.y-p.y,Z.z-p.z);

                // set proj_dir
                this.proj_dir = new THREE.Vector3();
                this.proj_dir.crossVectors(pz,this.unsigned_ortho_dir);
                this.proj_dir.normalize(); // should be useless
            }

            // Project along the given direction
            var non_ortho_proj = new THREE.Vector3();
            non_ortho_proj.copy(this.proj_dir);
            non_ortho_proj.multiplyScalar( -p0_to_p.dot(normal_inv)/this.proj_dir.dot(normal_inv));
            non_ortho_proj.add(p);

            var tmp_vec = new THREE.Vector3();
            var tmp_vec0 = new THREE.Vector3();
            var tmp_vec1 = new THREE.Vector3();
            var tmp_vec2 = new THREE.Vector3();
            tmp_vec0.subVectors(non_ortho_proj,this.v[0].getPos());
            tmp_vec1.subVectors(non_ortho_proj,this.v[1].getPos());
            tmp_vec2.subVectors(non_ortho_proj,this.v[2].getPos());

            if( tmp_vec.crossVectors(this.unit_p0p1,tmp_vec0).dot(normal_inv) > 0.0 &&
                tmp_vec.crossVectors(this.unit_p1p2,tmp_vec1).dot(normal_inv) > 0.0 &&
                tmp_vec.crossVectors(this.unit_p2p0,tmp_vec2).dot(normal_inv) > 0.0)
            {
                tmp_vec.subVectors(p,non_ortho_proj);
                res.v = tmp_vec.lengthSq();

                // get barycentric coordinates of nearest_point (which is necessarily in the triangle
                var p0 = this.v[0].getPos();
                var p1 = this.v[1].getPos();
                var p2 = this.v[2].getPos();

                var tmp_vec_bis = new THREE.Vector3();
                tmp_vec.subVectors(p1,p0);
                tmp_vec_bis.subVectors(p2,p0);
                var n = new THREE.Vector3();
                n.crossVectors(tmp_vec,tmp_vec_bis);
                tmp_vec.subVectors(p2,p1);
                var n1 = new THREE.Vector3();
                n1.crossVectors(tmp_vec,tmp_vec1);
                tmp_vec.subVectors(p0,p2);
                var n2 = new THREE.Vector3();
                n2.crossVectors(tmp_vec,tmp_vec2);
                tmp_vec.subVectors(p1,p0);
                var n3 = new THREE.Vector3();
                n3.crossVectors(tmp_vec,tmp_vec0);

                var nsq = n.lengthSq();
                var a1 = n.dot(n1);
                var a2 = n.dot(n2);
                var a3 = n.dot(n3);

                var inter_weight = (a1*this.v[0].getThickness()+a2*this.v[1].getThickness()+a3*this.v[2].getThickness())/nsq;

                res.v = ScalisMath.Poly6Eval(Math.sqrt(res.v)/inter_weight)*ScalisMath.Poly6NF0D;

                if(res.m){
                    res.m.triMean(this.materials[0],this.materials[1],this.materials[2],a1,a2,a3,nsq);
                }
            }
            else
            {
                // Use to keep the case selected in case we need to compute the material
                var seg_case = 0;
                // do the same as for a segment on all triangle sides
                this.GenericSegmentComputation(
                    p,
                    this.v[0].getPos(),
                    this.p0p1,
                    this.length_p0p1,
                    this.length_p0p1*this.length_p0p1,
                    this.v[0].getThickness(),
                    this.v[1].getThickness()-this.v[0].getThickness(),
                    this.res_gseg
                );

                this.res_gseg.sqrdist = this.res_gseg.proj_to_p.lengthSq();
                this.res_gseg.ratio = this.res_gseg.sqrdist/(this.res_gseg.weight_proj*this.res_gseg.weight_proj);

                this.GenericSegmentComputation(
                    p,
                    this.v[1].getPos(),
                    this.p1p2,
                    this.length_p1p2,
                    this.length_p1p2*this.length_p1p2,
                    this.v[1].getThickness(),
                    this.v[2].getThickness()-this.v[1].getThickness(),
                    this.tmp_res_gseg
                );
                this.tmp_res_gseg.sqrdist = this.tmp_res_gseg.proj_to_p.lengthSq();
                this.tmp_res_gseg.ratio = this.tmp_res_gseg.sqrdist/(this.tmp_res_gseg.weight_proj*this.tmp_res_gseg.weight_proj);
                if(this.res_gseg.ratio>this.tmp_res_gseg.ratio){
                    this.res_gseg.sqrdist         = this.tmp_res_gseg.sqrdist;
                    this.res_gseg.proj_to_p       = this.tmp_res_gseg.proj_to_p;
                    this.res_gseg.weight_proj     = this.tmp_res_gseg.weight_proj;
                    this.res_gseg.ratio           = this.tmp_res_gseg.ratio;
                    this.res_gseg.t               = this.tmp_res_gseg.t;
                    seg_case = 1;
                }

                this.GenericSegmentComputation(
                    p,
                    this.v[2].getPos(),
                    this.p2p0,
                    this.length_p2p0,
                    this.length_p2p0*this.length_p2p0,
                    this.v[2].getThickness(),
                    this.v[0].getThickness()-this.v[2].getThickness(),
                    this.tmp_res_gseg
                );
                this.tmp_res_gseg.sqrdist = this.tmp_res_gseg.proj_to_p.lengthSq();
                this.tmp_res_gseg.ratio = this.tmp_res_gseg.sqrdist/(this.tmp_res_gseg.weight_proj*this.tmp_res_gseg.weight_proj);
                if(this.res_gseg.ratio>this.tmp_res_gseg.ratio){
                    this.res_gseg.sqrdist         = this.tmp_res_gseg.sqrdist;
                    this.res_gseg.proj_to_p       = this.tmp_res_gseg.proj_to_p;
                    this.res_gseg.weight_proj     = this.tmp_res_gseg.weight_proj;
                    this.res_gseg.ratio           = this.tmp_res_gseg.ratio;
                    this.res_gseg.t               = this.tmp_res_gseg.t;
                    seg_case = 2;
                }

                res.v = ScalisMath.Poly6Eval(Math.sqrt(this.res_gseg.sqrdist)/this.res_gseg.weight_proj)*ScalisMath.Poly6NF0D;





                ////////////////////////////////////////////////////////////////
                // Material computation
                if(res.m){
                    switch(seg_case){
                        case 0:
                            res.m.copy(this.materials[0]);
                            res.m.lerp(this.materials[1], this.res_gseg.t);
                        break;
                        case 1:
                            res.m.copy(this.materials[1]);
                            res.m.lerp(this.materials[2], this.res_gseg.t);
                        break;
                        case 2:
                            res.m.copy(this.materials[2]);
                            res.m.lerp(this.materials[0], this.res_gseg.t);
                        break;
                        default:
                            throw "Error : seg_case unknown";
                        break;
                    }
                }
                //////////////////////////////////////////////////////////////
            }
            // IMPORTANT NOTE :
            // We should use an analytical gradient here. It should be possible to
            // compute.
            if(res.g)
            {
                var epsilon = 0.00001;
                p_eps.copy(p);
                p_eps.x += epsilon;
                this.evalDist(p_eps, ev_eps);
                res.g.x = (ev_eps.v-res.v)/epsilon;
                p_eps.x -= epsilon;

                p_eps.y += epsilon;
                this.evalDist(p_eps, ev_eps);
                res.g.y = (ev_eps.v-res.v)/epsilon;
                p_eps.y -= epsilon;

                p_eps.z += epsilon;
                this.evalDist(p_eps, ev_eps);
                res.g.z = (ev_eps.v-res.v)/epsilon;
            }
    /*
        }else{
            res.v = 0;
        }
    */
    };
})();


/**
 *
 *  Segment computations used in Distance triangle evaluation.
 *
 *  @param {!THREE.Vector3} point Point where value is wanted, as a THREE.Vector3
 *  @param {!THREE.Vector3} p1 Segment first point, as a THREE.Vector3
 *  @param {!THREE.Vector3} p1p2 Segment first to second point, as a THREE.Vector3
 *  @param {number} length Length of the segment
 *  @param {number} sqr_length Squared length of the segment
 *  @param {number} weight_1 Weight for the first point of the segment
 *  @param {number} delta_weight weight_2 - weight_1
 *  @param {!Object} res {proj_to_p, weight_proj}
 *
 */
ScalisTriangle.prototype.GenericSegmentComputation = function(
                                            point,
                                            p1,
                                            p1p2,
                                            length,
                                            sqr_length,
                                            weight_1,
                                            delta_weight, // = weight_2-weight_1
                                            res)
{
    var origin_to_p = new THREE.Vector3();
    origin_to_p.subVectors(point,p1);

    var orig_p_scal_dir = origin_to_p.dot(p1p2);
    var orig_p_sqr = origin_to_p.lengthSq();

    var denum = sqr_length * weight_1 + orig_p_scal_dir * delta_weight;
    var t = (delta_weight<0.0) ? 0.0 : 1.0;
    if(denum > 0.0)
    {
        t = (orig_p_scal_dir * weight_1 + orig_p_sqr * delta_weight) /denum;
        t = (t<0.0) ? 0.0 : ((t>1.0) ? 1.0 : t) ; // clipping (nearest point on segment not line)
    }

    res.proj_to_p = new THREE.Vector3(  t*p1p2.x - origin_to_p.x,
                                        t*p1p2.y - origin_to_p.y,
                                        t*p1p2.z - origin_to_p.z);
    res.weight_proj = weight_1 + t*delta_weight;

    res.t = t;

    return res;
};

///////////////////////////////////////////////////////////////////////////
// Convolution Evaluation functions and auxiliaary functions

/**
 *  value function for Distance volume type (distance field).
 */
ScalisTriangle.prototype.evalConvol = (function() {

    var g = new THREE.Vector3();
    var m = new Material();
    var tmpRes = {v:0,g:null,m:null};
    var g2 = new THREE.Vector3();
    var m2 = new Material();
    var tmpRes2 = {v:0,g:null,m:null};

    return function (p, res) {

        tmpRes.g = res.g ? g : null;
        tmpRes.m = res.m ? m : null;

        // Compute closest point (t parameter) on the triangle in "warped space" as well as clipping
        var clipped = {l1: 0, l2: 0};
        if (this.ComputeTParam(p, clipped)) {
            var t_low = clipped.l1;
            var t_high = clipped.l2;
            // Compute local warp coordinates
            var w_local = this.weight_min + t_low * this.unit_delta_weight;
            var local_t_max = this.warpAbscissa((t_high - t_low) / w_local);

            // Compute the required number of sample
            var nb_samples = 2 * (0.5 * sampleNumber * local_t_max + 1.0);
            var d_step_size = local_t_max / nb_samples;

            // Perform Simpson scheme
            var t = d_step_size;
            d_step_size *= 2.0;
            var res_odd = 0.0;
            var grad_odd = new THREE.Vector3();

            for (var i = 1; i < nb_samples; i += 2) {
                this.computeLineIntegral(this.unwarpAbscissa(t) * w_local + t_low, p, tmpRes);
                res_odd += tmpRes.v;
                if (res.g) {
                    grad_odd.addVectors(grad_odd, tmpRes.g);
                }
                t += d_step_size;
            }

            var res_even = 0.0;
            var grad_even = new THREE.Vector3();
            t = 0.0;
            for (var i = 2; i < nb_samples; i += 2) {
                t += d_step_size;
                this.computeLineIntegral(this.unwarpAbscissa(t) * w_local + t_low, p, tmpRes);
                if (res.g) {
                    grad_even.addVectors(grad_even, tmpRes.g);
                }
                res_even += tmpRes.v;
            }

            tmpRes2.g = res.g ? g2 : null;
            tmpRes2.m = res.m ? m2 : null;

            var res_low = this.computeLineIntegral(t_low, p, tmpRes);
            var res_high = this.computeLineIntegral(t_high, p, tmpRes2);

            res.v = res_low.v + 4.0 * res_odd + 2.0 * res_even + res_low.v;
            var factor = ( local_t_max / (3.0 * (nb_samples)) ) * ScalisMath.Poly6NF2D;
            res.v *= factor;
            if (res.g) {
                var grad_res = new THREE.Vector3();
                grad_res.addVectors(grad_res, res_low.g);
                grad_res.addVectors(grad_res, grad_odd.multiplyScalar(4.0));
                grad_res.addVectors(grad_res, grad_even.multiplyScalar(2.0));
                grad_res.addVectors(grad_res, res_high.g);
                res.g = grad_res.multiplyScalar(factor);
            }
        } else {
            res.v = 0.0;
            res.g = new THREE.Vector3();
        }
        if (res.m) {
            tmpRes.g = null;
            this.evalDist(p, tmpRes);
            res.m.copy(tmpRes.m);
        }
    };
})();
/**
 *  @param {number} t
 *  @return {number} Warped value
 */
ScalisTriangle.prototype.warpAbscissa = function (t) {
    // Compute approx of ln(d*l+1)/d
    var dt = t * this.unit_delta_weight;
    var inv_dtp2 = 1.0 / (dt + 2.0);
    var sqr_dt_divdlp2 = dt * inv_dtp2;
    sqr_dt_divdlp2 *= sqr_dt_divdlp2;
    var serie_approx = 1.0 + sqr_dt_divdlp2*(
                                   (1.0/3.0) + sqr_dt_divdlp2*(
                                        (1.0/5.0) + sqr_dt_divdlp2*(
                                            (1.0/7.0) + sqr_dt_divdlp2*(
                                                (1.0/9.0) + sqr_dt_divdlp2*(
                                                    (1.0/11.0) + sqr_dt_divdlp2*(1.0/13.0) )))));
    return 2.0 * t * inv_dtp2 * serie_approx;
};

/**
 *  @param {number} t
 *  @return {number} Unwarped value
 */
ScalisTriangle.prototype.unwarpAbscissa = function (t) {
    // Compute approx of (exp(d*l)-1)/d
    var dt = t * this.unit_delta_weight;
    return t * ( 1.0 + dt *( 1.0/2.0 + dt * ( 1.0/6.0 + dt * ( 1.0/24.0 + dt * ( 1.0/120.0 + dt * 1.0/720.0 ))))) ;
};

/**
 *  @param {number} t
 *  @param {!THREE.Vector3} p point, as a THREE.Vector3
 *  @param {Object} res result containing the wanted elements like res.v for the value, res.g for the gradient, res.m for the material.
 *  @return the res parameter, filled with proper values
 */
ScalisTriangle.prototype.computeLineIntegral = function (t, p, res) {

    var weight = this.weight_min + t * this.unit_delta_weight;
    var p_1 = new THREE.Vector3();
    p_1.addVectors(this.point_min, this.longest_dir_special.clone().multiplyScalar(t));

    var length = (t<this.coord_middle) ? (t/this.coord_middle) * this.max_seg_length
                                           : ((this.coord_max-t)/(this.coord_max - this.coord_middle)) * this.max_seg_length;
    if (res.g) {
        this.consWeightEvalGradForSeg( p_1, weight, this.ortho_dir, length, p, res);
    } else {
        this.consWeightEvalForSeg( p_1, weight, this.ortho_dir, length, p, res);
    }

    return res;
};


/**
 * "Select" the part of a segment that is inside (in the homothetic space) of a clipping "sphere".
 *          This function use precomputed values given as parameter (prevent redundant computation during convolution
 *          computation for instance)
 *          This function is used in Eval function of CompactPolynomial kernel which use a different parametrization for a greater stability.
 *
 *
 *  @param {!THREE.Vector3} w special_coeff, x, y and z attributes must be defined
 *  @param {number} length
 *  @param {!Object} clipped Result if clipping occured, in l1 and l2, returned
 *                           values are between 0.0 and length/weight_min
 *
 *  @return {boolean} true if clipping occured
 *
 *  @protected
 */
ScalisTriangle.prototype.homotheticClippingSpecial = function(w, length, clipped)
{
    // we search solution t \in [0,1] such that at^2-2bt+c<=0
    var a = -w.z;
    var b = -w.y;
    var c = -w.x;

    var delta = b*b - a*c;
    if(delta>=0.0)
    {
        var b_p_sqrt_delta = b+Math.sqrt(delta);
        if( (b_p_sqrt_delta<0.0) || (length*b_p_sqrt_delta<c) )
        {
            return false;
        }
        else
        {
            var main_root = c / b_p_sqrt_delta;
            clipped.l1 = (main_root<0.0) ? 0.0 : main_root;
            var a_r = a*main_root;
            clipped.l2 = (2.0*b<a_r+a*length) ? c/(a_r) : length;
            return true;
        }
    }
    return false;
};

/**
 *  @param {!THREE.Vector3} p_1
 *  @param {number} w_1
 *  @param {!THREE.Vector3} unit_dir
 *  @param {number} length
 *  @param {!THREE.Vector3} point
 *  @return {!Object} Object defining v attribute with the computed value
 *
 *  @protected
 */
ScalisTriangle.prototype.consWeightEvalForSeg = function( p_1, w_1, unit_dir, length, point, res) {
    var p_min_to_point = new THREE.Vector3();
    p_min_to_point.subVectors( point, p_1 );
    var uv = unit_dir.dot(p_min_to_point);
    var d2 = p_min_to_point.lengthSq();

    var special_coeff = new THREE.Vector3();
    special_coeff.set( w_1*w_1  - ScalisMath.KIS2 * d2,
                       - ScalisMath.KIS2 * uv,
                       - ScalisMath.KIS2 );
    var clipped = {l1: 0, l2:0};
    if(this.homotheticClippingSpecial(special_coeff, length, clipped))
    {
        var inv_local_min_weight = 1.0 / w_1;
        special_coeff.x = 1.0 - ScalisMath.KIS2 * ( clipped.l1*(clipped.l1-2.0*uv) + d2 ) * inv_local_min_weight*inv_local_min_weight;
        special_coeff.y = - ScalisMath.KIS2*(uv-clipped.l1) * inv_local_min_weight;

        res.v = this.homotheticCompactPolynomial_segment_F_i6_cste( (clipped.l2-clipped.l1) * inv_local_min_weight,
                                                                                                  special_coeff );
    }else{
        res = 0;
    }

    return res;
};

/**
 *  @param {!THREE.Vector3} p_1
 *  @param {number} w_1
 *  @param {!THREE.Vector3} unit_dir
 *  @param {number} length
 *  @param {!THREE.Vector3} point
 *  @return {!Object} Object defining v attribute with the computed value
 *
 *  @protected
 */
ScalisTriangle.prototype.consWeightEvalGradForSeg = function( p_1, w_1, unit_dir, length, point, res) {

    var p_min_to_point = new THREE.Vector3();
    p_min_to_point.subVectors( point, p_1 );
    var uv = unit_dir.dot(p_min_to_point);
    var d2 = p_min_to_point.lengthSq();

    var special_coeff = new THREE.Vector3();
    special_coeff.set( w_1*w_1  - ScalisMath.KIS2 * d2 ,
                       - ScalisMath.KIS2 * uv ,
                       - ScalisMath.KIS2 );
    var clipped = {l1: 0, l2:0};
    if(this.homotheticClippingSpecial(special_coeff, length, clipped))
    {
        var inv_local_min_weight = 1.0 / w_1;
        special_coeff.x = 1.0 - ScalisMath.KIS2 * ( clipped.l1*(clipped.l1-2.0*uv) + d2 ) * inv_local_min_weight*inv_local_min_weight;
        special_coeff.y = - ScalisMath.KIS2*(uv-clipped.l1) * inv_local_min_weight;

        var F0F1F2 = new THREE.Vector3();
        this.homotheticCompactPolynomial_segment_FGradF_i6_cste( (clipped.l2-clipped.l1) * inv_local_min_weight,
                                                                                                special_coeff, F0F1F2);
        res.v = F0F1F2.x;
        F0F1F2.y *= inv_local_min_weight;
        var vect = unit_dir.clone();
        vect.multiplyScalar( F0F1F2.z + clipped.l1 * F0F1F2.y);
        p_min_to_point.multiplyScalar(- F0F1F2.y);
        p_min_to_point.addVectors(p_min_to_point,vect);
        res.g =  p_min_to_point.multiplyScalar(6.0*ScalisMath.KIS2*inv_local_min_weight);
    }else{
        res.v = 0;
        res.g.set(0,0,0);
    }

    return res;
};

/**
 *  @param {!THREE.Vector3} point the point of evaluation, as a THREE.Vector3
 *  @param {!Object} clipped Result if clipping occured, in l1 and l2, returned
 *                           values are between 0.0 and length/weight_min
 *  @return {boolean} true if clipping occured
 */
ScalisTriangle.prototype.ComputeTParam = function(point, clipped) {
    var p_min_to_point = new THREE.Vector3();
    p_min_to_point.subVectors( point, this.point_min );

    var coord_main_dir = p_min_to_point.dot(this.main_dir);
    var coord_normal   = p_min_to_point.dot(this.unit_normal);

    //WARNING : Assume that the compact support is defined in the same way as HomotheticCompactPolynomial kernels
    var dist_sqr = coord_main_dir*coord_main_dir + coord_normal*coord_normal;

    var special_coeff = new THREE.Vector3();
    special_coeff.set( this.weight_min*this.weight_min - ScalisMath.KIS2 * dist_sqr,
                      -this.unit_delta_weight*this.weight_min - ScalisMath.KIS2 * coord_main_dir,
                       this.unit_delta_weight*this.unit_delta_weight - ScalisMath.KIS2);

    return this.homotheticClippingSpecial(special_coeff, this.coord_max, clipped);
};

/**
 *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
 *  Function designed by Cedric Zanni, optimized for C++ using matlab.
 *  @param {number} l
 *  @param {!THREE.Vector3} w Some coefficient, as a THREE.Vector3
 *  @return {number} the value
 */
ScalisTriangle.prototype.homotheticCompactPolynomial_segment_F_i6_cste = function(l, w) {
    var t7068 = w.z;
    var t7078 = t7068 * l;
    var t7069 = w.y;
    var t7070 = w.x;
    var t2 = t7069 * t7069;
    var t7065 = t7068 * t7070 - t2;
    var t7067 = 0.1e1 / t7068;
    var t7077 = t7065 * t7067;
    var t7064 = t7070 + (-0.2e1 * t7069 + t7078) * l;
    var t7066 = t7078 - t7069;
    var t6 = t7064 * t7064;
    var t7076 = t7066 * t6;
    var t7 = t7070 * t7070;
    var t7075 = t7069 * t7;
    return  (0.6e1 / 0.5e1 * (0.4e1 / 0.3e1 * (0.2e1 * t7065 * l + t7066 * t7064 + t7069 * t7070) * t7077 + t7076 + t7075) * t7077 + t7064 * t7076 + t7070 * t7075) * t7067 / 0.7e1;
};

// optimized function for segment of constant weight
// computes value and grad
/**
 *  Sub-function for optimized convolution for segment of constant weight,
 *  value and gradient computation (Homothetic Compact Polynomial).
 *  Function designed by Cedric Zanni, optimized for C++ using matlab.
 *  @param {number} l
 *  @param {!THREE.Vector3} res result in a THREE.Vector3
 *  @param {!THREE.Vector3} w a THREE.Vector3
 *
 */
ScalisTriangle.prototype.homotheticCompactPolynomial_segment_FGradF_i6_cste = function(l, w, res) {
    var t7086 = w.z;
    var t7095 = t7086 * l;
    var t7087 = w.y;
    var t7088 = w.x;
    var t2 = t7087 * t7087;
    var t7082 = t7086 * t7088 - t2;
    var t7084 = 0.1e1 / t7086;
    var t7094 = t7082 * t7084;
    var t7081 = t7088 + (-0.2e1 * t7087 + t7095) * l;
    var t7083 = t7095 - t7087;
    var t7089 = t7081 * t7081;
    var t7091 = t7088 * t7088;
    var t7079 = 0.4e1 / 0.3e1 * (0.2e1 * t7082 * l + t7083 * t7081 + t7087 * t7088) * t7094 + t7083 * t7089 + t7087 * t7091;
    var t7093 = t7079 * t7084 / 0.5e1;
    var t7085 = t7088 * t7091;
    var t7080 = t7081 * t7089;
    res.x = (0.6e1 / 0.5e1 * t7079 * t7094 + t7083 * t7080 + t7087 * t7085) * t7084 / 0.7e1;
    res.y = t7093;
    res.z = (t7087 * t7093 + t7080 / 0.6e1 - t7085 / 0.6e1) * t7084;
};

module.exports = ScalisTriangle;
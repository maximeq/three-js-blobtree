'use strict';

const THREE = require("three-full/builds/Three.cjs.js");
const ScalisMath = require("../scalis/ScalisMath.js");
const Area = require("./Area.js");
const TriangleUtils = require("../../utils/TriangleUtils.js");
const Accuracies = require("../accuracies/Accuracies.js");
const AreaScalisSeg = require("./AreaScalisSeg");

/**
 *  Bounding area for the triangle.
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere fr now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 *  @extends {Area}
 *
 *  @param {Array.<!ScalisVertex>} v Array or vertices
 *  @param {!THREE.Vector3} unit_normal Normal to the plane made by the 3 vertices, as a THREE.Vector3
 *  @param {!THREE.Vector3} main_dir Main direction dependeing on thicknesses
 *  @param {!Object}  segParams
 *  @param {number}  min_thick Minimum thickness in the Triangle
 *  @param {number} max_thick Maximum thickness in the triangle
 *
 * @constructor
 */
var AreaScalisTri = function(v,unit_normal,main_dir,segParams,min_thick,max_thick)
{
    Area.call(this);

    this.tmpVect = new THREE.Vector3();
    this.min_thick = min_thick;
    this.max_thick = max_thick;
    this.v = v;
    this.p0p1 = this.tmpVect.clone().subVectors(this.v[1].getPos(), this.v[0].getPos());
    this.p2p0 = this.tmpVect.clone().subVectors(this.v[0].getPos(), this.v[2].getPos());
    this.unit_normal = unit_normal; // Normal computed from crossVectors of p0p1 and P2p1
    this.main_dir = main_dir;
    var delta_1 = Math.abs(this.v[0].getThickness() - this.v[1].getThickness());
    var delta_2 = Math.abs(this.v[1].getThickness() - this.v[2].getThickness());
    this.equal_weights = (delta_1/Math.abs(this.v[0].getThickness()+this.v[1].getThickness()) < 0.001
                         && delta_2/Math.abs(this.v[1].getThickness()+this.v[2].getThickness()) < 0.001);
    /* segParams is defined as: (e.g for segment p0p1)
    segParams.push({"norm":         this.length_p0p1,
                    "diffThick":    this.diffThick_p0p1,
                    "dir":          this.unit_p0p1,
                    "v":            [this.v[0], this.v[1]],
                    "ortho_vec_x":  this.v[0].getThickness() - this.v[1].getThickness(),
                    "ortho_vec_y":  this.length_p0p1});
    */
    this.segParams = segParams;

    // Store tmp computation parameters when doing computation on one segment of the triangle
    this.segAttr = {"p0_to_p": 0,
                    "p0_to_p_sqrnorm": 0,
                    "x_p_2D": 0,
                    "y_p_2D": 0,
                    "y_p_2DSq": 0,
                    "p_proj_x": 0 };


    // Construct the triangular prism going through each vertices
    var n1 = this.tmpVect.clone().crossVectors(this.segParams[0].dir, this.unit_normal ).normalize();
    var n2 = this.tmpVect.clone().crossVectors(this.segParams[1].dir, this.unit_normal ).normalize();
    var n3 = this.tmpVect.clone().crossVectors(this.segParams[2].dir, this.unit_normal ).normalize();
    // Compute the prism vertices
    this.tmpVect.copy(this.unit_normal);
    var pri = [];
    pri.push(this.tmpVect.clone().addVectors(this.v[0].getPos(), this.tmpVect.multiplyScalar(this.v[0].getThickness()*ScalisMath.KS)));
    this.tmpVect.copy(this.unit_normal);
    pri.push(this.tmpVect.clone().addVectors(this.v[1].getPos(), this.tmpVect.multiplyScalar(this.v[1].getThickness()*ScalisMath.KS)));
    this.tmpVect.copy(this.unit_normal);
    pri.push(this.tmpVect.clone().addVectors(this.v[2].getPos(), this.tmpVect.multiplyScalar(this.v[2].getThickness()*ScalisMath.KS)));
    this.tmpVect.copy(this.unit_normal);
    pri.push(this.tmpVect.clone().addVectors(this.v[0].getPos(), this.tmpVect.multiplyScalar(-this.v[0].getThickness()*ScalisMath.KS)));
    this.tmpVect.copy(this.unit_normal);
    pri.push(this.tmpVect.clone().addVectors(this.v[1].getPos(), this.tmpVect.multiplyScalar(-this.v[1].getThickness()*ScalisMath.KS)));
    this.tmpVect.copy(this.unit_normal);
    pri.push(this.tmpVect.clone().addVectors(this.v[2].getPos(), this.tmpVect.multiplyScalar(-this.v[2].getThickness()*ScalisMath.KS)));
    // Compute the normals of top and bottom faces of the prism
    var tmp2 = new THREE.Vector3();
    this.tmpVect.subVectors(pri[1], pri[0]);
    tmp2.subVectors(pri[2], pri[0]);
    var n4 = this.tmpVect.clone().crossVectors(this.tmpVect, tmp2).normalize();
    this.tmpVect.subVectors(pri[5], pri[3]);
    tmp2.subVectors(pri[4], pri[3]);
    var n5 = this.tmpVect.clone().crossVectors(this.tmpVect, tmp2).normalize();

    // planeParams contains the definition of the prism 5 faces {normal, orig}
    this.planeParams = [];
    this.planeParams.push({"orig":this.v[0].getPos(), "n":n1});
    this.planeParams.push({"orig":this.v[1].getPos(), "n":n2});
    this.planeParams.push({"orig":this.v[2].getPos(), "n":n3});
    this.planeParams.push({"orig":pri[0], "n":n4});
    this.planeParams.push({"orig":pri[3], "n":n5});

    // use segments areas to factoirize some code.
    this.segAreas = [];
    for(var i=0; i<3; ++i){
        this.segAreas.push(
            new AreaScalisSeg(
                this.segParams[i].v[0].getPos(),this.segParams[i].v[1].getPos(),
                this.segParams[i].v[0].getThickness(), this.segParams[i].v[1].getThickness(),
                this.segParams[i].norm, this.segParams[i].dir)
        );
    }

};

AreaScalisTri.prototype = Object.create(Area.prototype);
AreaScalisTri.prototype.constructor = AreaScalisTri;


/**
 *  Compute projection (used in other functions)
 *  @param {!THREE.Vector3} p Point to proj
 *  @param {!Object} segParams A seg param object
 *
 *  @protected
 */
AreaScalisTri.prototype.proj_computation = function(p, segParams){
    this.segAttr.p0_to_p = this.tmpVect;
    this.segAttr.p0_to_p.subVectors(p, segParams.v[0].getPos());
    this.segAttr.p0_to_p_sqrnorm = this.segAttr.p0_to_p.lengthSq();
    this.segAttr.x_p_2D = this.segAttr.p0_to_p.dot(segParams.dir);
    // pythagore inc.
    this.segAttr.y_p_2DSq = this.segAttr.p0_to_p_sqrnorm - this.segAttr.x_p_2D*this.segAttr.x_p_2D;
    this.segAttr.y_p_2D = this.segAttr.y_p_2DSq>0 ? Math.sqrt(this.segAttr.y_p_2DSq) : 0; // because of rounded errors tmp can be <0 and this causes the next sqrt to return NaN...

    var t = -this.segAttr.y_p_2D/segParams.ortho_vec_y;
    // P proj is the point at the intersection of:
    //              - the local X axis (computation in the unit_dir basis)
    //                  and
    //              - the line defined by P and the vector orthogonal to the weight line
    this.segAttr.p_proj_x = this.segAttr.x_p_2D + t*segParams.ortho_vec_x;
    //this.segAttr.p_proj_y = 0.0;
};

/**
 *  Test intersection of the shape with a sphere
 *  @return {boolean} true if the sphere and the area intersect
 *
 *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *
 */
AreaScalisTri.prototype.sphereIntersect = function(sphere)
{
    // First: Test the intersection of the sphere to all three segments as they are included in the triangle bv
    for(var i=0; i<3; i++) {
        var intersectSeg = this.sphereIntersectSegment(sphere, this.segParams[i], ScalisMath.KS);
        // The sphere intersecting ones the angle means the sphere intersect the Bounding Volume
        if (intersectSeg) {return true;}
    }
    // Second: Test the intersection of the sphere with the triangular prism defined by
    // the 2D triangle constructed from the vertices and of half heights Ti*KS along the unit_normal for each vertices Vi
    for (var i=0, inside = true; i<5; i++) {
        this.tmpVect.subVectors(sphere.center, this.planeParams[i].orig);
        // Get the signed dist to the plane
        var dist = this.tmpVect.dot(this.planeParams[i].n);
        // if the dist to the plane is positive, we are in the part where the normal is
        inside = inside && (dist+sphere.r>0); // Modulation by the sphere radius
    }
    // If the sphere is outside one of the plane-> BLAM OUTSIDE SON
    return inside;
};

/**
 *  Adapted from the segment sphere intersection. Could be factorised!
 *  @return {boolean} true if the sphere and the area intersect
 *
 *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @param {!Object} segParams A segParams object containing data for a segment
 *  @param {number} KS Kernel Scale, ie ScalisMath.KS (Why is it a parameter, its global!?)
 *
 */
AreaScalisTri.prototype.sphereIntersectSegment = function(sphere, segParams, KS)
{
    this.proj_computation(sphere.center, segParams);

    var thick0 = segParams.v[0].getThickness();
    var thick1 = segParams.v[1].getThickness();
    if(this.segAttr.p_proj_x<0.0){
        return (Math.sqrt(this.segAttr.p0_to_p_sqrnorm)-sphere.r < thick0*KS);
    }else{
        if( this.segAttr.p_proj_x > segParams.norm)
        {
            this.segAttr.p0_to_p.subVectors(sphere.center, segParams.v[1].getPos());
            return this.segAttr.p0_to_p.length()-sphere.r < thick1*KS;
        }else{
            var sub1 = this.segAttr.x_p_2D - this.segAttr.p_proj_x;
            var dist = sub1*sub1 + this.segAttr.y_p_2DSq;
            var tt = this.segAttr.p_proj_x/segParams.norm;
            var inter_w = thick0*(1.0-tt) + tt*thick1;
            var tmp = sphere.r + inter_w*KS;
            return (dist<tmp*tmp);
        }
    }
};

/**
 *  Test if p is in the area.
 *
 *  @return {boolean} true if p is in th area, false otherwise.
 *
 *  @param {!THREE.Vector3} p A point in space
 *
 */
AreaScalisTri.prototype.contains = function(p)
{
    var sphere = {r:0, c:p};
    return this.sphereIntersect(sphere);
};

/**
 *  Copied from AreaSeg.getAcc
 *
 *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @param {!Object} segParams A segParams object containing data for a segment area
 *
 *  @return {!Object} Object containing intersect (boolean) and currAcc (number) attributes
 */
AreaScalisTri.prototype.getAccSegment = function(sphere, segParams)
{
    var allReturn = {intersect:false, currAcc:Accuracies.nice*this.min_thick};
    if (this.sphereIntersectSegment(sphere, segParams, 1)) {
        // Thales between two triangles that have the same angles gives us the dist of:
        // side A = sphere.r*this.abs_diff_thick/this.length;
        // Then pythagore this shit up as A² + sphere.r² = delta²
        // i.e delta² = (sphere.r*this.abs_diff_thick/this.length)² + sphere.r²
        // <=> delta = sphere.r*Math.sqrt(1+(this.abs_diff_thick/this.length)²);
        var tmp = Math.abs(segParams.diffThick)/segParams.norm;
        var half_delta = sphere.r*Math.sqrt(1+tmp*tmp)*0.5;

        var thick0 = segParams.v[0].getThickness();
        var thick1 = segParams.v[1].getThickness();
        // we check only the direction where the weight is minimum since
        // we will return minimum accuracy needed in the area.
        var absc = this.segAttr.p_proj_x;
        absc += thick0 > thick1 ? half_delta : -half_delta;

        if(absc<=0.0){
            allReturn.currAcc   = thick0;
        }else if(absc>=segParams.norm)
        {
            allReturn.currAcc   = thick1;
        }else{
            var tt = absc/segParams.norm;
            allReturn.currAcc = thick0*(1.0-tt) + tt*thick1;
        }
        allReturn.intersect = true;
    }
    return allReturn;
};

/**
 *  Get accuracy for the inner triangle (do not consider segment edges)
 *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 */
AreaScalisTri.prototype.getAccTri = function(sphere)
{
    // Inequal thickness triangle case:
    if (!this.equal_weights) {
        var v0 = this.v[0].getPos(); // Should be the min thickness point on the triangle
        // Get the main dir furthest point
        var main_dir_point = this.tmpVect.addVectors(sphere.center, this.main_dir.clone().multiplyScalar(sphere.r));
        // Get the proj of this point
        // 1/ get the ortho coord 2D wise
        this.tmpVect.subVectors(main_dir_point, v0);
        var distLineSq = this.tmpVect.lengthSq();
        // Get the dist to the plane (signed)
        var y_p_2D = this.tmpVect.dot(this.unit_normal); // Should do some test here to know if we are above or below the plane
        var x_p_2D = Math.sqrt(distLineSq - y_p_2D*y_p_2D);
        // Get the ortho proj point in the triangle plane
        // Cf. http://geomalgorithms.com/a04-_planes.html
        var proj_ortho_point = this.tmpVect.clone().addVectors(sphere.center, this.unit_normal.clone().multiplyScalar(-y_p_2D));
        // Get the thickness at this point
        var params = TriangleUtils.getTriBaryCoord(this.p0p1, this.p2p0, this.v[0].getPos(), proj_ortho_point);
        var thick_ortho_point = TriangleUtils.getMeanThick(this, params.u, params.v);
        // Ortho vector to the weight varies along where the sphere is relative to the plane
        thick_ortho_point = y_p_2D>=0? thick_ortho_point: -thick_ortho_point;
        var ortho_vec_x = this.v[0].getThickness() - thick_ortho_point;
        var ortho_vec_y = x_p_2D;
        var t = -y_p_2D/ortho_vec_y;
        // P proj is the point at the intersection of:
        //              - the local X axis (computation in the unit_dir basis)
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        var p_proj_x = x_p_2D + t*ortho_vec_x;

        var dirVect = this.tmpVect.subVectors(v0, proj_ortho_point).normalize();
        var p_proj = this.tmpVect.addVectors(proj_ortho_point, dirVect.multiplyScalar(x_p_2D-p_proj_x));
        // Get the barycentric parameters of the non orthogonal point
        params = TriangleUtils.getTriBaryCoord(this.p0p1, this.p2p0, this.v[0].getPos(), p_proj);
        if (params.u<=1 && params.v <=1 && params.u+ params.v <=1 && params.u >= 0 && params.v >= 0 ) {
            // Return the barycentered thickness (yes barycentered is a proper english terminology)
            return TriangleUtils.getMeanThick(this, params.u, params.v);
        } else {
            return this.max_thick*10000;
        }
    } else {
        // Case of equal weights
        return this.min_thick;
    }
};

/**
 *  Return the minimum accuracy needed in the intersection of the sphere and the area.
 *         This function is a generic function used in both getNoceAcc and getRawAcc.
 *
 *  @return {number} the accuracy needed in the intersection zone, as a ratio of the linear variation
 *         of the radius in the triangle
 *
 *  @param {!{r:number,c:!THREE.Vector3}} sphere  A aphere object, must define sphere.r (radius) and sphere.center (center, as a THREE.Vector3)
 *  @param {number}  factor  the ratio to determine the wanted accuracy.
 */
AreaScalisTri.prototype.getAcc = function(sphere, factor) {

    // First: Test the intersection of the sphere to all three segments to get the min Acc for segments
    for(var i=0, minForSeg=this.max_thick*100000; i<3; i++) {
        var intersectSeg = this.getAccSegment(sphere, this.segParams[i]);
        // The sphere intersecting ones the angle means the sphere intersect the Bounding Volume
        if (intersectSeg.intersect) {
            minForSeg = minForSeg > intersectSeg.currAcc ? intersectSeg.currAcc: minForSeg;
        }
    }
    // Second: Test the inner triangle
    var minForTri = this.max_thick*100000;
    if (minForSeg !== this.min_thick) {
        minForTri = this.getAccTri(sphere);
    }

    var minThick = Math.min(minForSeg, minForTri);
    if (minThick !== this.max_thick*100000) {
        //minThick = Math.min(Math.max(minThick, this.min_thick), this.max_thick);
        return minThick*factor;
    } else {
        // Sphere does not intersect with the segments, or the inner triangle
        return this.max_thick*factor;
    }

    //return this.min_thick*factor;
};

/**
 *  Convenience function, just call getAcc with Nice Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The Nice accuracy needed in the intersection zone
 */
AreaScalisTri.prototype.getNiceAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.nice);
};
/**
 *  Convenience function, just call getAcc with Curr Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The Current accuracy needed in the intersection zone
 */
AreaScalisTri.prototype.getCurrAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.curr);
};
/**
 *  Convenience function, just call getAcc with Raw Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The raw accuracy needed in the intersection zone
 */
AreaScalisTri.prototype.getRawAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.raw);
};

/**
 *  @return {number} the minimum accuracy needed for the triangle
 */
AreaScalisTri.prototype.getMinAcc = function()
{
    return Accuracies.curr*this.min_thick;
};

/**
 *  @return {number} the minimum accuracy needed for the triangle
 */
AreaScalisTri.prototype.getMinRawAcc = function()
{
    return Accuracies.raw*this.min_thick;
};

/**
 *  Return the minimum accuracy required at some point on the given axis.
 *  The returned accuracy is the one you would need when stepping in the axis
 *  direction when you are on the axis at coordinate t.
 *  @param {string} axis x, y or z
 *  @param {number} t Coordinate on the axis
 *  @return {number} The step you can safely do in axis direction
 */
AreaScalisTri.prototype.getAxisProjectionMinStep = function(axis,t){
    var step = Number.MAX_VALUE;
    for(var i=0;i<3;++i){
        step = Math.min(step,this.segAreas[i].getAxisProjectionMinStep(axis,t));
    }
    return step;
};

module.exports = AreaScalisTri;

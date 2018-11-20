"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Area = require("./Area.js");
const Accuracies = require("../accuracies/Accuracies.js");

/**
 *  General representation of a "Capsule" area, ie, 2 sphere connected by a cone.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @extends {Area}
 *
 *  @param {!THREE.Vector3} p1     First point of the shape
 *  @param {!THREE.Vector3} p2     Second point of the shape
 *  @param {number}  r1 radius at p1
 *  @param {number}  r2 radius at p2
 *  @param {number}  accFactor1 Apply an accuracy factor to the standard one, around p1. Default to 1.
 *  @param {number}  accFactor2 Apply an accuracy factor to the standard one, around p2. Default to 1.
 *
 * @constructor
 */
var AreaCapsule = function(p1, p2, r1, r2, accFactor1, accFactor2 )
{
    Area.call(this);

    this.p1 = p1.clone();
    this.p2 = p2.clone();
    this.r1 = r1;
    this.r2 = r2;

    this.accFactor1 = accFactor1 || 1.0;
    this.accFactor2 = accFactor2 || 1.0;

    this.unit_dir = new THREE.Vector3().subVectors(p2,p1);
    this.length = this.unit_dir.length();
    this.unit_dir.normalize();

    // tmp var for functions below
    this.vector = new THREE.Vector3();
    this.p1_to_p = this.vector; // basically the same as above + smart name
    this.p1_to_p_sqrnorm = 0;
    this.x_p_2D = 0;
    this.y_p_2D = 0;
    this.y_p_2DSq = 0;
    this.ortho_vec_x = this.r1 - this.r2; // direction orthogonal to the "line" getting from one weight to the other. Precomputed
    this.ortho_vec_y = this.length;
    this.p_proj_x = 0;
    this.p_proj_y = 0;

    this.abs_diff_thick = Math.abs(this.ortho_vec_x);
};

AreaCapsule.prototype = Object.create(Area.prototype);
AreaCapsule.prototype.constructor = AreaCapsule;

/**
 *  Compute some of the tmp variables. Used to factorized other functions code.
 *  @param {!THREE.Vector3} p A point as a THREE.Vector3
 *
 *  @protected
 */
AreaCapsule.prototype.proj_computation = function(p)
{
    this.p1_to_p = this.vector;
    this.p1_to_p.subVectors(p, this.p1);
    this.p1_to_p_sqrnorm = this.p1_to_p.lengthSq();
    this.x_p_2D = this.p1_to_p.dot(this.unit_dir);
    // pythagore inc.
    this.y_p_2DSq = this.p1_to_p_sqrnorm - this.x_p_2D*this.x_p_2D;
    this.y_p_2D = this.y_p_2DSq>0 ? Math.sqrt(this.y_p_2DSq) : 0; // because of rounded errors tmp can be <0 and this causes the next sqrt to return NaN...

    var t = -this.y_p_2D/this.ortho_vec_y;
    // P proj is the point at the intersection of:
    //              - the local X axis (computation in the unit_dir basis)
    //                  and
    //              - the line defined by P and the vector orthogonal to the weight line
    this.p_proj_x = this.x_p_2D + t*this.ortho_vec_x;
    this.p_proj_y = 0.0;
};

/**
 *  [Abstract]
 *  @todo Check the Maths (Ask Cedric Zanni?)
 */
AreaCapsule.prototype.sphereIntersect = function(sphere)
{
    this.proj_computation(sphere.center);

    if(this.p_proj_x<0.0){
        return (Math.sqrt(this.p1_to_p_sqrnorm)-sphere.radius < this.r1);
    }else{
        if(this.p_proj_x>this.length)
        {
            this.vector.subVectors(sphere.center, this.p2);
            return (Math.sqrt(this.vector.lengthSq())-sphere.radius < this.r2);
        }else{
            var sub1 = this.x_p_2D-this.p_proj_x;
            //var sub2 = this.y_p_2D-this.p_proj_y; //this.p_proj_y is set at 0 by definition
            //var dist = Math.sqrt(sub1*sub1 +this.y_p_2DSq);//sub2*sub2);
            var dist = sub1*sub1 +this.y_p_2DSq;//sub2*sub2);
            var tt = this.p_proj_x/this.length;
            var inter_w = this.r1*(1.0-tt) + tt*this.r2;
            var tmp = sphere.radius + inter_w;
            //return (dist-sphere.radius < inter_w);
            return (dist<tmp*tmp);
        }
    }
};

/**
 *  Sea documentation in parent class Area
 */
AreaCapsule.prototype.contains = function(p)
{
    this.proj_computation(p);
    // P proj is the point at the intersection of:
    //              - the X axis
    //                  and
    //              - the line defined by P and the vector orthogonal to the weight line
    if(this.p_proj_x<0.0){
        // Proj is before the line segment beginning defined by P0: spherical containment
        return this.p1_to_p_sqrnorm < this.r1*this.r1;
    }else{
        if(this.p_proj_x>this.length)
        {
            // Proj is after the line segment beginning defined by P1: spherical containment
            this.vector.subVectors(p, this.p2);
            return this.vector.lengthSq() < this.r2*this.r2;
        }else{
            // Proj is in between the line segment P1-P0: Linear kind of containment
            var sub1 = this.x_p_2D-this.p_proj_x;
            var sub2 = this.y_p_2D-this.p_proj_y;
            var dist2 = sub1*sub1+sub2*sub2;
            var tt = this.p_proj_x/this.length;
            var inter_w = this.r1*(1.0-tt) + tt*this.r2;
            return dist2 < inter_w*inter_w;
        }
    }
};

/**
 *  Return the minimum accuracy needed in the intersection of the sphere and the area.
 *         This function is a generic function used in both getNiceAcc and getRawAcc.
 *
 *  @return {number} the accuracy needed in the intersection zone
 *
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @param {number}  factor  the ratio to determine the wanted accuracy.
 *
 *  @todo Check the Maths
 */
AreaCapsule.prototype.getAcc = function(sphere, factor)
{
    this.proj_computation(sphere.center);

    // Thales between two triangles that have the same angles gives us the dist of:
    // side A = sphere.radius*this.abs_diff_thick/this.length;
    // Then pythagore this shit up as A² + sphere.radius² = delta²
    // i.e delta² = (sphere.radius*this.abs_diff_thick/this.length)² + sphere.radius²
    // <=> delta = sphere.radius*Math.sqrt(1+(this.abs_diff_thick/this.length)²);

    var tmp = this.abs_diff_thick/this.length;
    var half_delta = sphere.radius*Math.sqrt(1+tmp*tmp)*0.5;

    // we check only the direction where the weight is minimum since
    // we will return minimum accuracy needed in the area.
    var absc = this.p_proj_x;
    absc += this.r1 > this.r2 ? half_delta : -half_delta;

    if(absc<0.0){
        return this.r1*this.accFactor1*factor;
    }else if(absc>this.length)
    {
        return this.r2*this.accFactor2*factor;
    }else{

        var tt = absc/this.length;
        var inter_w = this.r1*this.accFactor1*(1.0-tt) + tt*this.r2*this.accFactor2;
        return inter_w*factor;
    }
};

/**
 *  Convenience function, just call getAcc with Nice Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The Nice accuracy needed in the intersection zone
 */
AreaCapsule.prototype.getNiceAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.nice);
};
/**
 *  Convenience function, just call getAcc with Curr Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The Curr accuracy needed in the intersection zone
 */
AreaCapsule.prototype.getCurrAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.curr);
};
/**
 *  Convenience function, just call getAcc with Raw Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The raw accuracy needed in the intersection zone
 */
AreaCapsule.prototype.getRawAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.raw);
};

/**
 *  Sea documentation in parent class Area
 */
AreaCapsule.prototype.getMinAcc = function()
{
    return Accuracies.curr*Math.min(this.r1*this.accFactor1, this.r2*this.accFactor2);
};
/**
 *  Sea documentation in parent class Area
 */
AreaCapsule.prototype.getMinRawAcc = function()
{
    return Accuracies.raw*Math.min(this.r1*this.accFactor1, this.r2*this.accFactor2);
};

/**
 *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
 *  The returned accuracy is the one you would need when stepping in the axis
 *  direction when you are on the axis at coordinate t.
 *  @param {string} axis x, y or z
 *  @param {number} t Coordinate on the axis
 *  @return {number} The step you can safely do in axis direction
 */
AreaCapsule.prototype.getAxisProjectionMinStep = function(axis,t){
    var step = Number.MAX_VALUE;
    var p1 = this.p1[axis] < this.p2[axis] ? this.p1 : this.p2;
    var p2, r1, r2;
    if(p1 === this.p1){
        p2 = this.p2;
        r1 = this.r1*this.accFactor1;
        r2 = this.r2*this.accFactor2;
    }else{
        p2 = this.p1;
        r1 = this.r2;
        r2 = this.r1*this.accFactor1;
    }

    var diff = t-p1[axis];
    if(diff<-2*r1){
        step = Math.min(step,Math.max(Math.abs(diff+2*r1),Accuracies.curr*r1));
    }else if(diff<2*r1){
        step = Math.min(step,Accuracies.curr*r1);
    }// else the sphere is behind us
    diff = t-p2[axis];
    if(diff<-2*r2){
        step = Math.min(step,Math.max(Math.abs(diff+2*r2),Accuracies.curr*r2));
    }else if(diff<2*r2){
        step = Math.min(step,Accuracies.curr*r2);
    }// else the sphere is behind us

    var tbis = t-p1[axis];
    var axis_l = p2[axis]-p1[axis];
    if(tbis>0 && tbis<axis_l && axis_l!==0){
        // t is in p1p2
        step = Math.min(step,Accuracies.curr*(r1 + (tbis/axis_l)*(r2 - r1)));
    }

    return step;
};

module.exports = AreaCapsule;



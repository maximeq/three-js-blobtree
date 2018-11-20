"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const ScalisMath = require("../scalis/ScalisMath.js");
const Area = require("./Area.js");
const Accuracies = require("../accuracies/Accuracies.js");

/**
 *  Bounding area for the segment.
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *  The resulting volume is a clipped cone with spherical extremities, wich is
 *  actually the support of the primitive.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere fr now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 *  @extends {Area}
 *
 *  @param {!THREE.Vector3} p0     first point of the shape
 *  @param {!THREE.Vector3} p1     second point of the shape
 *  @param {number}  thick0 radius at p0
 *  @param {number}  thick1 radius at p1
 *
 *  @todo should be possible to replace with an AreaCapsule
 *
 * @constructor
 */
var AreaScalisSeg = function(p0, p1, thick0, thick1)
{
    Area.call(this);

    this.p0 = new THREE.Vector3(p0.x,p0.y,p0.z);
    this.p1 = new THREE.Vector3(p1.x,p1.y,p1.z);
    this.thick0 = thick0;
    this.thick1 = thick1;

    this.unit_dir = new THREE.Vector3().subVectors(p1,p0);
    this.length = this.unit_dir.length();
    this.unit_dir.normalize();

    // tmp var for functions below
    this.vector = new THREE.Vector3();
    this.p0_to_p = this.vector; // basically the same as above + smart name
    this.p0_to_p_sqrnorm = 0;
    this.x_p_2D = 0;
    this.y_p_2D = 0;
    this.y_p_2DSq = 0;
    this.ortho_vec_x = this.thick0 - this.thick1; // direction orthogonal to the "line" getting from one weight to the other. Precomputed
    this.ortho_vec_y = this.length;
    this.p_proj_x = 0;
    this.p_proj_y = 0;

    this.abs_diff_thick = Math.abs(this.ortho_vec_x);
};

AreaScalisSeg.prototype = Object.create(Area.prototype);
AreaScalisSeg.prototype.constructor = AreaScalisSeg;

/**
 *  Compute some of the tmp variables.
 *  Used to factorized other functions code.
 *  @param {!THREE.Vector3} p A point as a THREE.Vector3
 *
 *  @protected
 */
AreaScalisSeg.prototype.proj_computation = function(p)
{
    this.p0_to_p = this.vector;
    this.p0_to_p.subVectors(p, this.p0);
    this.p0_to_p_sqrnorm = this.p0_to_p.lengthSq();
    this.x_p_2D = this.p0_to_p.dot(this.unit_dir);
    // pythagore inc.
    this.y_p_2DSq = this.p0_to_p_sqrnorm - this.x_p_2D*this.x_p_2D;
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
 *  Sea documentation in parent class Area
 *  TODO :
 *      Check the Maths (Ask Cedric Zanni?)
 */
AreaScalisSeg.prototype.sphereIntersect = function(sphere)
{
    this.proj_computation(sphere.center);

    if(this.p_proj_x<0.0){
        return (Math.sqrt(this.p0_to_p_sqrnorm)-sphere.radius < this.thick0*ScalisMath.KS);
    }else{
        if(this.p_proj_x>this.length)
        {
            this.vector.subVectors(sphere.center, this.p1);
            return (Math.sqrt(this.vector.lengthSq())-sphere.radius < this.thick1*ScalisMath.KS);
        }else{
            var sub1 = this.x_p_2D-this.p_proj_x;
            //var sub2 = this.y_p_2D-this.p_proj_y; //this.p_proj_y is set at 0 by definition
            //var dist = Math.sqrt(sub1*sub1 +this.y_p_2DSq);//sub2*sub2);
            var dist = sub1*sub1 +this.y_p_2DSq;//sub2*sub2);
            var tt = this.p_proj_x/this.length;
            var inter_w = this.thick0*(1.0-tt) + tt*this.thick1;
            var tmp = sphere.radius + inter_w*ScalisMath.KS;
            //return (dist-sphere.radius < inter_w*ScalisMath.KS);
            return (dist<tmp*tmp);
        }
    }
};

/**
 *  Sea documentation in parent class Area
 */
AreaScalisSeg.prototype.contains = function(p)
{
    this.proj_computation(p);
    // P proj is the point at the intersection of:
    //              - the X axis
    //                  and
    //              - the line defined by P and the vector orthogonal to the weight line
    if(this.p_proj_x<0.0){
        // Proj is before the line segment beginning defined by P0: spherical containment
        return this.p0_to_p_sqrnorm < this.thick0*this.thick0*ScalisMath.KS2;
    }else{
        if(this.p_proj_x>this.length)
        {
            // Proj is after the line segment beginning defined by P1: spherical containment
            this.vector.subVectors(p, this.p1);
            return this.vector.lengthSq() < this.thick1*this.thick1*ScalisMath.KS2;
        }else{
            // Proj is in between the line segment P1-P0: Linear kind of containment
            var sub1 = this.x_p_2D-this.p_proj_x;
            var sub2 = this.y_p_2D-this.p_proj_y;
            var dist2 = sub1*sub1+sub2*sub2;
            var tt = this.p_proj_x/this.length;
            var inter_w = this.thick0*(1.0-tt) + tt*this.thick1;
            return dist2 < inter_w*inter_w*ScalisMath.KS2;
        }
    }
};

/**
 *
 *  TODO :
 *      check the Maths
 */
AreaScalisSeg.prototype.getAcc = function(sphere, factor)
{
    this.proj_computation(sphere.center);
/*
    // Following is a modified bit that improves acc computation outside of segments.
    // However, it appears that we are losing some quality in the models
    // (as the other computation gives a lower min acc bound by design)
    // TODO: decide if we uncomment or delete this

    // Get the point at the intersection of the line defined by the center of the sphere and of vector dir orthovec
    // and the weight line going through (0,thick0)  and orthogonal to orthovec
    var t = (thick0*this.ortho_vec_y - this.p_proj_x*this.ortho_vec_x)/(this.ortho_vec_x*this.ortho_vec_x+this.ortho_vec_y*this.ortho_vec_y);
    var inter_proj_x = this.p_proj_x +t*this.ortho_vec_x;
    var inter_proj_y = t*this.ortho_vec_y;
    // If inside the min acc is found according to the sphere normal radius
    var newR = sphere.radius;
    if (this.y_p_2D > inter_proj_y) {
        // If we are outside the segment, the sphere intersection with the weight line is computed
        var sub1 = this.x_p_2D-inter_proj_x;
        var sub2 = this.y_p_2D-inter_proj_y;
        var dist = Math.sqrt(sub1*sub1 +sub2*sub2);
        // Pythagore this
        newR = Math.sqrt(sphere.radius*sphere.radius-dist*dist);
    }
    var tmp = this.abs_diff_thick/this.length;
    var half_delta = newR*Math.sqrt(1+tmp*tmp)*0.5;
*/
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
    absc += this.thick0 > this.thick1 ? half_delta : -half_delta;

    if(absc<0.0){
        return this.thick0*factor;
    }else if(absc>this.length)
    {
        return this.thick1*factor;
    }else{

        var tt = absc/this.length;
        var inter_w = this.thick0*(1.0-tt) + tt*this.thick1;
        return inter_w*factor;
    }
};

/**
 *  Sea documentation in parent class Area
 */
AreaScalisSeg.prototype.getNiceAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.nice);
};
/**
 *  Sea documentation in parent class Area
 */
AreaScalisSeg.prototype.getCurrAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.curr);
};
/**
 *  Sea documentation in parent class Area
 */
AreaScalisSeg.prototype.getRawAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.raw);
};

/**
 *  Sea documentation in parent class Area
 */
AreaScalisSeg.prototype.getMinAcc = function()
{
    return Accuracies.curr*Math.min(this.thick0, this.thick1);
};
/**
 *  Sea documentation in parent class Area
 */
AreaScalisSeg.prototype.getMinRawAcc = function()
{
    return Accuracies.raw*Math.min(this.thick0, this.thick1);
};

/**
 *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
 *  The returned accuracy is the one you would need when stepping in the axis
 *  direction when you are on the axis at coordinate t.
 *  @param {string} axis x, y or z
 *  @param {number} t Coordinate on the axis
 *  @return {number} The step you can safely do in axis direction
 */
AreaScalisSeg.prototype.getAxisProjectionMinStep = function(axis,t){
    var step = Number.MAX_VALUE;
    var p0 = this.p0[axis] < this.p1[axis] ? this.p0 : this.p1;
    var p1, thick0, thick1;
    if(p0 === this.p0){
        p1 = this.p1;
        thick0 = this.thick0;
        thick1 = this.thick1;
    }else{
        p1 = this.p0;
        thick0 = this.thick1;
        thick1 = this.thick0;
    }

    var diff = t-p0[axis];
    if(diff<-2*thick0){
        step = Math.min(step,Math.max(Math.abs(diff+2*thick0),Accuracies.curr*thick0));
    }else if(diff<2*thick0){
        step = Math.min(step,Accuracies.curr*thick0);
    }// else the vertex is behind us
    diff = t-p1[axis];
    if(diff<-2*thick1){
        step = Math.min(step,Math.max(Math.abs(diff+2*thick1),Accuracies.curr*thick1));
    }else if(diff<2*thick1){
        step = Math.min(step,Accuracies.curr*thick1);
    }// else the vertex is behind us

    var tbis = t-p0[axis];
    var axis_l = p1[axis]-p0[axis];
    if(tbis>0 && tbis<axis_l && axis_l!==0){
        // t is in p0p1
        step = Math.min(step,Accuracies.curr*(thick0 + (tbis/axis_l)*(thick1 - thick0)));
    }

    return step;
};

module.exports = AreaScalisSeg;



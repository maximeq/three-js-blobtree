"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const ScalisMath = require("../../scalis/ScalisMath.js");
const Area = require("./Area.js");
const Accuracies = require("../accuracies/Accuracies.js");

/**
 *  AreaPoint represent the areas influenced by a ScalisPoint primitive.
 *  See Primitive.getArea for more details.
 *
 *  @constructor
 *  @extends {Area}
 *
 *  @todo should be possible to replace with an AreaPoint

 *  @param {!THREE.Vector3} p Point to locate the area
 *  @param {number} thick Thickness
 */
var AreaScalisPoint = function(p,thick)
{
    Area.call(this);

    this.p = new THREE.Vector3(p.x,p.y,p.z);
    this.thick = thick;

    // tmp var
    this.v_to_p = new THREE.Vector3();

};

AreaScalisPoint.prototype = Object.create(Area.prototype);
AreaScalisPoint.prototype.constructor = AreaScalisPoint;


/**
 *  Test intersection of the shape with a sphere
 *  @return {boolean} true if the sphere and the area intersect
 *
 *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 */
AreaScalisPoint.prototype.sphereIntersect = function(sphere)
{
    this.v_to_p.subVectors(sphere.center,this.p);
    var tmp = sphere.radius+this.thick*ScalisMath.KS;
    return this.v_to_p.lengthSq() < tmp*tmp;
};

/**
 *  Test if p is in the area.
 *
 *  @return {boolean} true if p is in th area, false otherwise.
 *
 *  @param {!Object} p A point in space, must comply to THREE.Vector3 API.
 *
 */
AreaScalisPoint.prototype.contains = function(p)
{
    this.v_to_p.subVectors(p,this.p);
    return this.v_to_p.lengthSq() < this.thick*this.thick*ScalisMath.KS2;
};

/**
 *  Return the minimum accuracy needed in the intersection of the sphere and the area.
 *         This function is a generic function used in both getNoceAcc and getRawAcc.
 *
 *  @return {number} the accuracy needed in the intersection zone
 *
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @param {number}  factor  the ratio to determine the wanted accuracy.
 */
AreaScalisPoint.prototype.getAcc = function(sphere, factor)
{
    return this.thick*factor;
};

/**
 *  Convenience function, just call getAcc with Nice Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The Nice accuracy needed in the intersection zone
 */
AreaScalisPoint.prototype.getNiceAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.nice);
};
/**
 *  Convenience function, just call getAcc with Curr Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The Curr accuracy needed in the intersection zone
 */
AreaScalisPoint.prototype.getCurrAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.curr);
};
/**
 *  Convenience function, just call getAcc with Raw Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The raw accuracy needed in the intersection zone
 */
AreaScalisPoint.prototype.getRawAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.raw);
};

/**
 *  @return {number} the minimum accuracy needed for this primitive
 */
AreaScalisPoint.prototype.getMinAcc = function()
{
    return Accuracies.curr*this.thick;
};

/**
 *  @return {number} the minimum raw accuracy needed for this primitive
 */
AreaScalisPoint.prototype.getMinRawAcc = function()
{
    return Accuracies.raw*this.thick;
};

   /**
 *  Return the minimum accuracy required at some point on the given axis.
 *  The returned accuracy is the one you would need when stepping in the axis
 *  direction when you are on the axis at coordinate t.
 *  @param {string} axis x, y or z
 *  @param {number} t Coordinate on the axis
 *  @return {number} The step you can safely do in axis direction
 */
AreaScalisPoint.prototype.getAxisProjectionMinStep = function(axis,t){
    var step = 100000000;
    var diff = t-this.p[axis];
    if(diff<-2*this.thick){
        step = Math.min(step,Math.max(Math.abs(diff+2*this.thick),Accuracies.curr*this.thick));
    }else if(diff<2*this.thick){
        step = Math.min(step,Accuracies.curr*this.thick);
    }// else the vertex is behind us
    return step;
};

module.exports = AreaScalisPoint;


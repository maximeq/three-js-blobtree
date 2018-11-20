"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const ScalisMath = require("../scalis/ScalisMath.js");
const Area = require("./Area.js");
const Accuracies = require("../accuracies/Accuracies.js");

/**
 *  AreaSphere is a general representation of a spherical area.
 *  See Primitive.getArea for more details.
 *
 *  @constructor
 *  @extends {Area}
 *
 *  @param {!THREE.Vector3} p Point to locate the area
 *  @param {number} r Radius of the area
 *  @param {number} accFactor Accuracy factor. By default SphereArea will use global Accuracies parameters. However, you can setup a accFactor.
 *                            to change that. You will usually want to have accFactor between 0 (excluded) and 1. Default to 1.0.
 *                            Be careful not to set it too small as it can increase the complexity of some algorithms up to the crashing point.
 *
 */
var AreaSphere = function( p, r, accFactor )
{
    Area.call(this);

    this.p = new THREE.Vector3(p.x,p.y,p.z);
    this.r = r;

    this.accFactor = accFactor || 1.0;
};

AreaSphere.prototype = Object.create(Area.prototype);
AreaSphere.prototype.constructor = AreaSphere;

/**
 *  Test intersection of the shape with a sphere
 *  @return {boolean} true if the sphere and the area intersect
 *
 *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 */
AreaSphere.prototype.sphereIntersect = (function(){
    var v = new THREE.Vector3();
    return function(sphere)
    {
        v.subVectors(sphere.center,this.p);
        var tmp = sphere.radius+this.radius;
        return v.lengthSq() < tmp*tmp;
    };
})();

/**
 *  Test if p is in the area.
 *
 *  @return {boolean} true if p is in th area, false otherwise.
 *
 *  @param {!Object} p A point in space, must comply to THREE.Vector3 API.
 *
 */
AreaSphere.prototype.contains = (function(){
    var v = new THREE.Vector3();
    return function(p)
    {
        v.subVectors(p,this.p);
        return v.lengthSq() < this.r*this.r;
    };
})();

/**
 *  Return the minimum accuracy needed in the intersection of the sphere and the area.
 *         This function is a generic function used in both getNiceAcc and getRawAcc.
 *
 *  @return {number} the accuracy needed in the intersection zone
 *
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @param {number}  factor  the ratio to determine the wanted accuracy.
 */
AreaSphere.prototype.getAcc = function(sphere, factor)
{
    return this.radius*factor;
};

/**
 *  Convenience function, just call getAcc with Nice Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The Nice accuracy needed in the intersection zone
 */
AreaSphere.prototype.getNiceAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.nice*this.accFactor);
};
/**
 *  Convenience function, just call getAcc with Curr Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The Curr accuracy needed in the intersection zone
 */
AreaSphere.prototype.getCurrAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.curr*this.accFactor);
};
/**
 *  Convenience function, just call getAcc with Raw Accuracy parameters.
 *  @param {!{r:number,c:!THREE.Vector3}}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The raw accuracy needed in the intersection zone
 */
AreaSphere.prototype.getRawAcc = function(sphere)
{
    return this.getAcc(sphere,Accuracies.raw*this.accFactor);
};

/**
 *  @return {number} the minimum accuracy needed for this primitive
 */
AreaSphere.prototype.getMinAcc = function()
{
    return Accuracies.curr*this.r*this.accFactor;
};

/**
 *  @return {number} the minimum raw accuracy needed for this primitive
 */
AreaSphere.prototype.getMinRawAcc = function()
{
    return Accuracies.raw*this.r*this.accFactor;
};

/**
 *  Return the minimum accuracy required at some point on the given axis.
 *  The returned accuracy is the one you would need when stepping in the axis
 *  direction when you are on the axis at coordinate t.
 *  @param {string} axis x, y or z
 *  @param {number} t Coordinate on the axis
 *  @return {number} The step you can safely do in axis direction
 */
AreaSphere.prototype.getAxisProjectionMinStep = function(axis,t){
    var step = 100000000;
    var diff = t-this.p[axis];
    if(diff<-2*this.r){
        step = Math.min(
            step,
            Math.max(
                Math.abs(diff+this.r),
                Accuracies.curr*this.r*this.accFactor
            )
        );
    }else if(diff<2*this.r){
        step = Math.min(
            step,
            Accuracies.curr*this.r*this.accFactor
        );
    }// else the area is behind us
    return step;
};

module.exports = AreaSphere;


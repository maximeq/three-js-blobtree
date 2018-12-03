 'use strict';

/**
 *  Bounding area for a primitive
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere for now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 * @constructor
 */
var Area = function()
{

};

/**
 *  [Abstract]
 *  Test intersection of the shape with a sphere
 *  @return {boolean} true if the sphere and the area intersect
 *
 *  @param {!{radius:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *
 */
Area.prototype.sphereIntersect = function(sphere)
{
    throw "Error : sphereIntersect is abstract, should have been overwritten";
};

/**
 * [Asbtract]
 *  Test if p is in the area.
 *
 *  @return {boolean} true if p is in the area, false otherwise.
 *
 *  @param {!THREE.Vector3} p A point in space
 *
 */
Area.prototype.contains = function(p)
{
    throw "Error : contains is abstract, should have been overwritten";
};

/**
 *  @abstract
 *  Return the minimum accuracy needed in the intersection of the sphere and the area.
 *         This function is a generic function used in both getNiceAcc and getRawAcc.
 *
 *  @return {number} the accuracy needed in the intersection zone, as a ratio of the linear variation
 *         of the radius along (this.p0,this.p1)
 *
 *  @param {!{radius:number,c:!THREE.Vector3}} sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @param {number}  factor  the ratio to determine the wanted accuracy.
 *                   Example : for an AreaScalisSeg, if thick0 is 1 and thick1 is 2, a sphere
 *                      centered at (p0+p1)/2 and of radius 0.2
 *                      will show its minimum accuracy at p0+0.3*unit_dir.
 *                      The linear interpolation of weights at this position
 *                      will give a wanted radius of 1.3
 *                      This function will return factor*1.3
 *
 */
Area.prototype.getAcc = function(sphere, factor)
{
    throw "Error : getAcc is abstract, should have been overwritten";
};

/**
 *  @abstract
 *  Convenience function, just call getAcc with Nice Accuracy parameters.
 *  @param {!{radius:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The Nice accuracy needed in the intersection zone
 */
Area.prototype.getNiceAcc = function(sphere)
{
    throw "Error : getNiceAcc is abstract, should have been overwritten";
};
/**
 *  @abstract
 *  Convenience function, just call getAcc with Current Accuracy parameters.
 *  @param {!{radius:number,c:!THREE.Vector3}} sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The Current accuracy needed in the intersection zone
 */
Area.prototype.getCurrAcc = function(sphere)
{
    throw "Error : getCurrAcc is abstract, should have been overwritten";
};

/**
 *  @abstract
 *  Convenience function, just call getAcc with Raw Accuracy parameters.
 *  @param {!{radius:number,c:!THREE.Vector3}} sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
 *  @return {number} The raw accuracy needed in the intersection zone
 */
Area.prototype.getRawAcc = function(sphere)
{
    throw "Error : getRawAcc is abstract, should have been overwritten";
};

/**
 *  @abstract
 *  @return {number} the minimum accuracy needed in the whole area
 */
Area.prototype.getMinAcc = function()
{
    throw "Error : getRawAcc is abstract, should have been overwritten";
};
/**
 *  @abstract
 *  @return {number} the minimum raw accuracy needed in the whole area
 */
Area.prototype.getMinRawAcc = function()
{
    throw "Error : getRawAcc is abstract, should have been overwritten";
};

module.exports = Area;

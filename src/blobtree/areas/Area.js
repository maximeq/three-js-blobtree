'use strict';

// eslint-disable-next-line
const THREE = require('three');

/**
 * @typedef {Object} AreaSphereParam
 * @property {number} radius
 * @property {THREE.Vector3} center
 */

/**
 *  Bounding area for a primitive
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere for now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 */
class Area {

    /**
     *  @abstract
     *  Test intersection of the shape with a sphere
     *  @param {AreaSphereParam} _sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {boolean} true if the sphere and the area intersect
     */
    sphereIntersect(_sphere) {
        throw "Error : sphereIntersect is abstract, should have been overwritten";
    }

    /**
     * @abstract
     * Test if p is in the area.
     * @param {!THREE.Vector3} _p A point in space
     * @return {boolean} true if p is in the area, false otherwise.
     */
    contains(_p) {
        throw "Error : contains is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  Return the minimum accuracy needed in the intersection of the sphere and the area.
     *  This function is a generic function used in both getNiceAcc and getRawAcc.
     *
     *  @param {AreaSphereParam}  _sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {number}  _factor  the ratio to determine the wanted accuracy.
     *                   Example : for an AreaScalisSeg, if thick0 is 1 and thick1 is 2, a sphere
     *                      centered at (p0+p1)/2 and of radius 0.2
     *                      will show its minimum accuracy at p0+0.3*unit_dir.
     *                      The linear interpolation of weights at this position
     *                      will give a wanted radius of 1.3
     *                      This function will return factor*1.3
     *  @return {number} the accuracy needed in the intersection zone, as a ratio of the linear variation
     *         of the radius along (this.p0,this.p1)
     */
    getAcc(_sphere, _factor) {
        throw "Error : getAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  Convenience function, just call getAcc with Nice Accuracy parameters.
     *  @param {AreaSphereParam} _sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(_sphere) {
        throw "Error : getNiceAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  Convenience function, just call getAcc with Current Accuracy parameters.
     *  @param {AreaSphereParam} _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Current accuracy needed in the intersection zone
     */
    getCurrAcc(_sphere) {
        throw "Error : getCurrAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  Convenience function, just call getAcc with Raw Accuracy parameters.
     *  @param {AreaSphereParam} _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The raw accuracy needed in the intersection zone
     */
    getRawAcc (_sphere) {
        throw "Error : getRawAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  @return {number} the minimum accuracy needed in the whole area
     */
    getMinAcc() {
        throw "Error : getRawAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  @return {number} the minimum raw accuracy needed in the whole area
     */
    getMinRawAcc() {
        throw "Error : getRawAcc is abstract, should have been overwritten";
    },

    /**
     *  @abstract
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param {string} axis x, y or z
     *  @param {number} t Coordinate on the axis
     *  @return {number} The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis, t) {
        console.error("Area.getAxisProjectionMinStep is a pure virtual function, please reimplement");
        return 1;
    }
};

module.exports = Area;

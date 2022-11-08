export = Area;
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
declare class Area {
    /**
     *  @abstract
     *  Test intersection of the shape with a sphere
     *  @param {AreaSphereParam} _sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {boolean} true if the sphere and the area intersect
     */
    sphereIntersect(_sphere: AreaSphereParam): boolean;
    /**
     * @abstract
     * Test if p is in the area.
     * @param {!THREE.Vector3} _p A point in space
     * @return {boolean} true if p is in the area, false otherwise.
     */
    contains(_p: THREE.Vector3): boolean;
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
    getAcc(_sphere: AreaSphereParam, _factor: number): number;
    /**
     *  @abstract
     *  Convenience function, just call getAcc with Nice Accuracy parameters.
     *  @param {AreaSphereParam} _sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(_sphere: AreaSphereParam): number;
    /**
     *  @abstract
     *  Convenience function, just call getAcc with Current Accuracy parameters.
     *  @param {AreaSphereParam} _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Current accuracy needed in the intersection zone
     */
    getCurrAcc(_sphere: AreaSphereParam): number;
    /**
     *  @abstract
     *  Convenience function, just call getAcc with Raw Accuracy parameters.
     *  @param {AreaSphereParam} _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The raw accuracy needed in the intersection zone
     */
    getRawAcc(_sphere: AreaSphereParam): number;
    /**
     *  @abstract
     *  @return {number} the minimum accuracy needed in the whole area
     */
    getMinAcc(): number;
    /**
     *  @abstract
     *  @return {number} the minimum raw accuracy needed in the whole area
     */
    getMinRawAcc(): number;
    /**
     *  @abstract
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param {string} _axis x, y or z
     *  @param {number} _t Coordinate on the axis
     *  @return {number} The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(_axis: string, _t: number): number;
}
declare namespace Area {
    export { AreaSphereParam };
}
type AreaSphereParam = {
    radius: number;
    center: THREE.Vector3;
};
import THREE = require("three");
//# sourceMappingURL=Area.d.ts.map
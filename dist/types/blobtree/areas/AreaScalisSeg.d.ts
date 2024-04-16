import { Area } from "./Area.js";
/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */
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
 *  @todo should be possible to replace with an AreaCapsule
 *
 */
export declare class AreaScalisSeg extends Area {
    /**
     * @param {!THREE.Vector3} p0 first point of the shape
     * @param {!THREE.Vector3} p1 second point of the shape
     * @param {number} thick0 radius at p0
     * @param {number} thick1 radius at p1
     */
    constructor(p0: any, p1: any, thick0: any, thick1: any);
    /**
    * Compute some of the tmp variables.Used to factorized other functions code.
    * @param { !THREE.Vector3 } p A point as a THREE.Vector3
    *
    * @protected
    */
    proj_computation(p: any): void;
    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @param {AreaSphereParam} sphere
     * @return {boolean} true if the sphere and the area intersect
     */
    sphereIntersect(sphere: any): boolean;
    /**
     * @link Area.contains for a complete description
     * @param {THREE.Vector3} p
     */
    contains(p: any): boolean;
    /**
     *  @link Area.getAcc for a complete description
     *
     *  @return {number} the accuracy needed in the intersection zone
     *
     *  @param {AreaSphereParam} sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {number}  factor  the ratio to determine the wanted accuracy.
     *
     *  @todo Check the Maths
     */
    getAcc(sphere: any, factor: any): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere: any): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Curr accuracy needed in the intersection zone
     */
    getCurrAcc: (sphere: any) => any;
    /**
     *  @link Area.getRawAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere: any): number;
    /**
     * @link Area.getMinAcc
     * @return {number}
     */
    getMinAcc(): number;
    /**
     * @link Area.getMinRawAcc
     * @return {number}
     */
    getMinRawAcc(): number;
    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param {string} axis x, y or z
     *  @param {number} t Coordinate on the axis
     *  @return {number} The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis: any, t: any): number;
}
//# sourceMappingURL=AreaScalisSeg.d.ts.map
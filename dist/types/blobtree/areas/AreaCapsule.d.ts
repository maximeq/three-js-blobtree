import { Area } from "./Area.js";
/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */
/**
 *  General representation of a "Capsule" area, ie, 2 sphere connected by a cone.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @extends {Area}
 *
 * @constructor
 */
export declare class AreaCapsule extends Area {
    /**
     *
     *  @param {!THREE.Vector3} p1     First point of the shape
     *  @param {!THREE.Vector3} p2     Second point of the shape
     *  @param {number}  r1 radius at p1
     *  @param {number}  r2 radius at p2
     *  @param {number}  accFactor1 Apply an accuracy factor to the standard one, around p1. Default to 1.
     *  @param {number}  accFactor2 Apply an accuracy factor to the standard one, around p2. Default to 1.
     *
     */
    constructor(p1: any, p2: any, r1: any, r2: any, accFactor1: any, accFactor2: any);
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
    getCurrAcc(sphere: any): number;
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
//# sourceMappingURL=AreaCapsule.d.ts.map
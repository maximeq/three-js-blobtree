import { Area } from "./Area.js";
/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */
/**
 *  AreaSphere is a general representation of a spherical area.
 *  See Primitive.getArea for more details.
 *
 *  @extends {Area}
 */
export declare class AreaSphere extends Area {
    /**
     *  @param {!Vector3} p Point to locate the area
     *  @param {number} r Radius of the area
     *  @param {number=} accFactor Accuracy factor. By default SphereArea will use global Accuracies parameters. However, you can setup a accFactor.
     *                            to change that. You will usually want to have accFactor between 0 (excluded) and 1. Default to 1.0.
     *                            Be careful not to set it too small as it can increase the complexity of some algorithms up to the crashing point.
     */
    constructor(p: any, r: any, accFactor: any);
    /**
     *  Test intersection of the shape with a sphere
     *  @return {boolean} true if the sphere and the area intersect
     *
     *  @param {!{r:number,c:!Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     */
    sphereIntersect: (sphere: any) => boolean;
    /**
     * @link Area.contains for a complete description
     * @param {Vector3} p
     * @return {boolean}
     */
    contains: (p: any) => boolean;
    /**
     *  @link Area.getAcc for a complete description
     *
     *  @return {number} the accuracy needed in the intersection zone
     *
     *  @param {AreaSphereParam} _sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param {number}  factor  the ratio to determine the wanted accuracy.
     *
     */
    getAcc(_sphere: any, factor: any): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return {number} The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere: any): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return {number} The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere: any): number;
    /**
     *  @link Area.getRawAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
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
//# sourceMappingURL=AreaSphere.d.ts.map
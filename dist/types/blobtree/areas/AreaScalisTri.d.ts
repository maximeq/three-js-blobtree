import { Area } from "./Area.js";
/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */
/** @typedef {import('../scalis/ScalisVertex')} ScalisVertex */
/**
 *  Bounding area for the triangle.
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere fr now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 *  @extends {Area}
 */
export declare class AreaScalisTri extends Area {
    /**
     *  @param { Array.< !ScalisVertex >} v Array or vertices
     *  @param {!Vector3} unit_normal Normal to the plane made by the 3 vertices, as a Vector3
     *  @param {!Vector3} main_dir Main direction dependeing on thicknesses
     * @param {!Object}  segParams
     *  @param {number}  min_thick Minimum thickness in the Triangle
     *  @param {number} max_thick Maximum thickness in the triangle
     */
    constructor(v: any, unit_normal: any, main_dir: any, segParams: any, min_thick: any, max_thick: any);
    /**
     *  Compute projection (used in other functions)
     *  @param {!Vector3} p Point to proj
     *  @param {!Object} segParams A seg param object @todo clarify this parameter
     *
     *  @protected
     */
    proj_computation(p: any, segParams: any): void;
    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @param {AreaSphereParam} sphere
     * @return {boolean} true if the sphere and the area intersect
     */
    sphereIntersect(sphere: any): boolean;
    /**
     *  Adapted from the segment sphere intersection. Could be factorised!
     *  @return {boolean} true if the sphere and the area intersect
     *
     *  @param {AreaSphereParam} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param {!Object} segParams A segParams object containing data for a segment
     *  @param {number} KS Kernel Scale, ie ScalisMath.KS (Why is it a parameter, its global!?)
     *
     */
    sphereIntersectSegment(sphere: any, segParams: any, KS: any): boolean;
    /**
     * @link Area.contains for a complete description
     * @param {Vector3} p
     */
    contains: (p: any) => any;
    /**
     *  Copied from AreaSeg.getAcc
     *
     *  @param {AreaSphereParam} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param {!Object} segParams A segParams object containing data for a segment area
     *
     *  @return {!Object} Object containing intersect (boolean) and currAcc (number) attributes
     */
    getAccSegment(sphere: any, segParams: any): {
        intersect: boolean;
        currAcc: number;
    };
    /**
     *  Get accuracy for the inner triangle (do not consider segment edges)
     *  @param {AreaSphereParam} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     */
    getAccTri(sphere: any): any;
    /**
     *  @link Area.getAcc for a complete description
     *
     *  @return {number} the accuracy needed in the intersection zone
     *
     *  @param {AreaSphereParam} sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param {number}  factor  the ratio to determine the wanted accuracy.
     *
     *  @todo Check the Maths
     */
    getAcc(sphere: any, factor: any): number;
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
    getMinRawAcc: () => number;
    /**
     *  Return the minimum accuracy required at some point on the given axis.
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param {string} axis x, y or z
     *  @param {number} t Coordinate on the axis
     *  @return {number} The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis: any, t: any): number;
}
//# sourceMappingURL=AreaScalisTri.d.ts.map
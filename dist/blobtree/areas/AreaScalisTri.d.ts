export = AreaScalisTri;
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
declare class AreaScalisTri extends Area {
    /**
     *  @param { Array.< !ScalisVertex >} v Array or vertices
     *  @param {!THREE.Vector3} unit_normal Normal to the plane made by the 3 vertices, as a THREE.Vector3
     *  @param {!THREE.Vector3} main_dir Main direction dependeing on thicknesses
     * @param {!Object}  segParams
     *  @param {number}  min_thick Minimum thickness in the Triangle
     *  @param {number} max_thick Maximum thickness in the triangle
     */
    constructor(v: Array<ScalisVertex>, unit_normal: THREE.Vector3, main_dir: THREE.Vector3, segParams: any, min_thick: number, max_thick: number);
    tmpVect: THREE.Vector3;
    min_thick: number;
    max_thick: number;
    v: import("../scalis/ScalisVertex")[];
    p0p1: THREE.Vector3;
    p2p0: THREE.Vector3;
    unit_normal: THREE.Vector3;
    main_dir: THREE.Vector3;
    equal_weights: boolean;
    segParams: any;
    segAttr: {
        p0_to_p: THREE.Vector3;
        p0_to_p_sqrnorm: number;
        x_p_2D: number;
        y_p_2D: number;
        y_p_2DSq: number;
        p_proj_x: number;
    };
    planeParams: {
        orig: THREE.Vector3;
        n: THREE.Vector3;
    }[];
    segAreas: AreaScalisSeg[];
    /**
     *  Compute projection (used in other functions)
     *  @param {!THREE.Vector3} p Point to proj
     *  @param {!Object} segParams A seg param object @todo clarify this parameter
     *
     *  @protected
     */
    protected proj_computation(p: THREE.Vector3, segParams: any): void;
    /**
     *  Adapted from the segment sphere intersection. Could be factorised!
     *  @return {boolean} true if the sphere and the area intersect
     *
     *  @param {AreaSphereParam} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {!Object} segParams A segParams object containing data for a segment
     *  @param {number} KS Kernel Scale, ie ScalisMath.KS (Why is it a parameter, its global!?)
     *
     */
    sphereIntersectSegment(sphere: AreaSphereParam, segParams: any, KS: number): boolean;
    /**
     *  Copied from AreaSeg.getAcc
     *
     *  @param {AreaSphereParam} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {!Object} segParams A segParams object containing data for a segment area
     *
     *  @return {!Object} Object containing intersect (boolean) and currAcc (number) attributes
     */
    getAccSegment(sphere: AreaSphereParam, segParams: any): any;
    /**
     *  Get accuracy for the inner triangle (do not consider segment edges)
     *  @param {AreaSphereParam} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     */
    getAccTri(sphere: AreaSphereParam): number;
}
declare namespace AreaScalisTri {
    export { AreaSphereParam, ScalisVertex };
}
import Area = require("./Area.js");
import THREE = require("three");
import AreaScalisSeg = require("./AreaScalisSeg");
type AreaSphereParam = import('./Area.js').AreaSphereParam;
type ScalisVertex = import('../scalis/ScalisVertex');
//# sourceMappingURL=AreaScalisTri.d.ts.map
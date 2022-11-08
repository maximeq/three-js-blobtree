/**
 * A number, or a string containing a number.
 * @typedef {Object} VertexLike
 * @property {() => THREE.Vector3} getPos
 * @property {() => number} getThickness
 */
/**
 * A number, or a string containing a number.
 * @typedef {Object} TriangleLike
 * @property {Array<VertexLike>} v
 * @property {THREE.Vector3} p0p1
 * @property {THREE.Vector3} p1p2
 * @property {THREE.Vector3} p2p0
 * @property {THREE.Vector3} unit_p0p1
 * @property {THREE.Vector3} unit_p1p2
 * @property {THREE.Vector3} unit_p2p0
 * @property {THREE.Vector3} unit_normal
 * @property {number} length_p0p1
 * @property {number} length_p1p2
 * @property {number} length_p2p0
 * @property {THREE.Vector3} unit_p0p1
 * @property {number} diffThick_p0p1
 * @property {number} diffThick_p1p2
 * @property {number} diffThick_p2p0
 * @property {THREE.Vector3} ortho_dir
 * @property {THREE.Vector3} point_min
 * @property {number} weight_min
 * @property {THREE.Vector3} main_dir
 * @property {THREE.Vector3} point_iso_zero
 * @property {THREE.Vector3} proj_dir
 * @property {boolean} equal_weights
 * @property {THREE.Vector3} half_dir_1
 * @property {THREE.Vector3} point_half
 * @property {THREE.Vector3} half_dir_2
 * @property {number} coord_max
 * @property {number} coord_middle
 * @property {number} unit_delta_weight
 * @property {THREE.Vector3} longest_dir_special
 * @property {number} max_seg_length = tmp.length();
 * @property {THREE.Vector3} unsigned_ortho_dir = triangle.ortho_dir.clone();
 */
/**
 *  Compute some internal vars for triangle
 *  @param {TriangleLike} triangle The triangle to compute vars for (blobtree or skel)
 */
export function computeVectorsDirs(triangle: TriangleLike): void;
/**
 *  @param {!Object} triangle
 *     u parametrisation of the point to compute along the axis V0->V1
 *     v parametrisation of the point to compute along the axis V0->V2
 *  @return {{pos:!THREE.Vector3, thick:number}} An object with the computed pos and thickness
 */
export function getParametrisedVertexAttr(triangle: any, u: any, v: any): {
    pos: THREE.Vector3;
    thick: number;
};
/**
 *  @param {!Object} triangle The concerned triangle
 *  @param {number} u u coordinate
 *  @param {number} v v coordinate
 *  @return {number}
 */
export function getMeanThick(triangle: any, u: number, v: number): number;
/**
 *  @param {!Object} triangle The concerned triangle
 *  @param {number} u u coordinate
 *  @param {number} v v coordinate
 *  @return {!Material} Interpolated material
 */
export function getMeanMat(triangle: any, u: number, v: number): Material;
/**
 *  Get the triangle barycenter coordinates. The projection is non orthogonal.
 *  WTF is that? Barycentirc coordinates are 3 components, not 2 !
 *  @param {!THREE.Vector3} p0p1 Vector from p0 to p1
 *  @param {!THREE.Vector3} p2p0 Vector from p2 to p0
 *  @param {!THREE.Vector3} p0 Point 0 in triangle
 *  @param {!THREE.Vector3} p Point in space
 *
 *  @return {{u:number,v:number}} Coordinate of barycenter
 */
export function getTriBaryCoord(p0p1: THREE.Vector3, p2p0: THREE.Vector3, p0: THREE.Vector3, p: THREE.Vector3): {
    u: number;
    v: number;
};
export function getUVCoord(U: any, V: any, p0: any, p: any): {
    u: number;
    v: number;
};
/**
 * A number, or a string containing a number.
 */
export type VertexLike = {
    getPos: () => THREE.Vector3;
    getThickness: () => number;
};
/**
 * A number, or a string containing a number.
 */
export type TriangleLike = {
    v: Array<VertexLike>;
    p0p1: THREE.Vector3;
    p1p2: THREE.Vector3;
    p2p0: THREE.Vector3;
    unit_p0p1: THREE.Vector3;
    unit_p1p2: THREE.Vector3;
    unit_p2p0: THREE.Vector3;
    unit_normal: THREE.Vector3;
    length_p0p1: number;
    length_p1p2: number;
    length_p2p0: number;
    diffThick_p0p1: number;
    diffThick_p1p2: number;
    diffThick_p2p0: number;
    ortho_dir: THREE.Vector3;
    point_min: THREE.Vector3;
    weight_min: number;
    main_dir: THREE.Vector3;
    point_iso_zero: THREE.Vector3;
    proj_dir: THREE.Vector3;
    equal_weights: boolean;
    half_dir_1: THREE.Vector3;
    point_half: THREE.Vector3;
    half_dir_2: THREE.Vector3;
    coord_max: number;
    coord_middle: number;
    unit_delta_weight: number;
    longest_dir_special: THREE.Vector3;
    /**
     * = tmp.length();
     */
    max_seg_length: number;
    /**
     * = triangle.ortho_dir.clone();
     */
    unsigned_ortho_dir: THREE.Vector3;
};
import THREE = require("three");
import Material = require("../blobtree/Material");
//# sourceMappingURL=TriangleUtils.d.ts.map
export = AreaCapsule;
/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */
/**
 *  General representation of a "Capsule" area, ie, 2 sphere connected by a cone.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @extends {Area}
 *
 * @constructor
 */
declare class AreaCapsule extends Area {
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
    constructor(p1: THREE.Vector3, p2: THREE.Vector3, r1: number, r2: number, accFactor1: number, accFactor2: number);
    p1: THREE.Vector3;
    p2: THREE.Vector3;
    r1: number;
    r2: number;
    accFactor1: number;
    accFactor2: number;
    unit_dir: THREE.Vector3;
    length: number;
    vector: THREE.Vector3;
    p1_to_p: THREE.Vector3;
    p1_to_p_sqrnorm: number;
    x_p_2D: number;
    y_p_2D: number;
    y_p_2DSq: number;
    ortho_vec_x: number;
    ortho_vec_y: number;
    p_proj_x: number;
    p_proj_y: number;
    abs_diff_thick: number;
    /**
     * Compute some of the tmp variables.Used to factorized other functions code.
     * @param { !THREE.Vector3 } p A point as a THREE.Vector3
     *
     * @protected
     */
    protected proj_computation(p: THREE.Vector3): void;
}
declare namespace AreaCapsule {
    export { AreaSphereParam };
}
import Area = require("./Area.js");
import THREE = require("three");
type AreaSphereParam = import('./Area.js').AreaSphereParam;
//# sourceMappingURL=AreaCapsule.d.ts.map
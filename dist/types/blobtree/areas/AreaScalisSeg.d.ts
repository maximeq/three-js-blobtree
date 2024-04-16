export = AreaScalisSeg;
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
declare class AreaScalisSeg extends Area {
    /**
     * @param {!THREE.Vector3} p0 first point of the shape
     * @param {!THREE.Vector3} p1 second point of the shape
     * @param {number} thick0 radius at p0
     * @param {number} thick1 radius at p1
     */
    constructor(p0: THREE.Vector3, p1: THREE.Vector3, thick0: number, thick1: number);
    p0: THREE.Vector3;
    p1: THREE.Vector3;
    thick0: number;
    thick1: number;
    unit_dir: THREE.Vector3;
    length: number;
    vector: THREE.Vector3;
    p0_to_p: THREE.Vector3;
    p0_to_p_sqrnorm: number;
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
declare namespace AreaScalisSeg {
    export { AreaSphereParam };
}
import Area = require("./Area.js");
import THREE = require("three");
type AreaSphereParam = import('./Area.js').AreaSphereParam;
//# sourceMappingURL=AreaScalisSeg.d.ts.map
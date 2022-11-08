export = ScalisSegment;
/** @typedef {import('./ScalisPrimitive').ScalisPrimitiveJSON} ScalisPrimitiveJSON */
/**
 * @typedef {{density:number} & ScalisPrimitiveJSON} ScalisSegmentJSON
 */
/**
 *  Implicit segment class in the blobtree.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
declare class ScalisSegment extends ScalisPrimitive {
    /**
     * @param {ScalisSegmentJSON} json
     * @returns {ScalisSegment}
     */
    static fromJSON(json: ScalisSegmentJSON): ScalisSegment;
    /**
     *  @param {!ScalisVertex} v0 First vertex for the segment
     *  @param {!ScalisVertex} v1 Second vertex for the segment
     *  @param {!string} volType Volume type, can be ScalisPrimitive.CONVOL
     *                 (homothetic convolution surfaces, Zanni and al), or
     *                 ScalisPrimitive.DIST (classic weighted distance field)
     *  @param {number} density Density is another constant to modulate the implicit
     *                  field. Used only for DIST voltype.
     *  @param {!Array.<Material>} mats Material for this primitive.
     *                                  Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
     *
     */
    constructor(v0: ScalisVertex, v1: ScalisVertex, volType: string, density: number, mats: Array<Material>);
    density: number;
    clipped_l1: number;
    clipped_l2: number;
    vector: THREE.Vector3;
    cycle: THREE.Vector3;
    proj: THREE.Vector3;
    v0_p: THREE.Vector3;
    v1_p: THREE.Vector3;
    dir: THREE.Vector3;
    lengthSq: number;
    length: number;
    unit_dir: THREE.Vector3;
    weight_p1: number;
    c0: number;
    c1: number;
    increase_unit_dir: THREE.Vector3;
    p_min: THREE.Vector3;
    weight_min: number;
    inv_weight_min: number;
    unit_delta_weight: number;
    maxbound: number;
    maxboundSq: number;
    cyl_bd0: number;
    cyl_bd1: number;
    f0f1f2: THREE.Vector3;
    tmpVec1: THREE.Vector3;
    tmpVec2: THREE.Vector3;
    /**
     * @returns {ScalisSegmentJSON}
     */
    toJSON(): ScalisSegmentJSON;
    /**
     *  @param {number} d The new density
     */
    setDensity(d: number): void;
    /**
     *  @return {number} The current density
     */
    getDensity(): number;
    setVolType(vt: any): void;
    getAreas(): {
        aabb: THREE.Box3;
        bv: AreaScalisSeg;
        obj: this;
    }[];
    value(p: any, res: any): void;
    /**
     *  value function for Distance volume type (distance field).
     */
    evalDist: (p: any, res: any) => void;
    /**
     *
     * @param {THREE.Vector3} p Evaluation point
     * @param {Object} res Resulting material will be in res.m
     */
    evalMat(p: THREE.Vector3, res: any): void;
    /**
     *  @param {!THREE.Vector3} w special_coeff
     *  @return {boolean}
     */
    HomotheticClippingSpecial(w: THREE.Vector3): boolean;
    /**
     *  value function for Convol volume type (Homothetic convolution).
     */
    evalConvol(p: any, res: any): void;
    /**
     *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
     *  @param {number} a
     *  @param {number} b
     *  @param {number} c
     *  @return {number} Clamped value
     *  Author: Jakub Korzeniowski
     *  Agency: Softhis
     *  http://www.softhis.com
     */
    clamp(a: number, b: number, c: number): number;
    distanceTo: (p: any) => any;
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param {number} l
     *  @param {number} d
     *  @param {!Object} w
     *  @return {number} the value
     */
    HomotheticCompactPolynomial_segment_F_i6(l: number, d: number, w: any): number;
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).
     *  (Approximation? Faster?).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param {number} l
     *  @param {number} d
     *  @param {number} q
     *  @param {!Object} w
     */
    HomotheticCompactPolynomial_approx_segment_F_i6(l: number, d: number, q: number, w: any): number;
    /**
     *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  Result is stored in this.f0f1f2
     *  @param {number} l
     *  @param {number} d
     *  @param {!Object} w
     *
     */
    HomotheticCompactPolynomial_segment_FGradF_i6(l: number, d: number, w: any): void;
    /**
     *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  Result is stored in this.f0f1f2
     *  @param {number} l
     *  @param {number} d
     *  @param {!Object} w
     */
    HomotheticCompactPolynomial_approx_segment_FGradF_i6(l: number, d: number, q: any, w: any): void;
}
declare namespace ScalisSegment {
    export { ScalisPrimitiveJSON, ScalisSegmentJSON };
}
import ScalisPrimitive = require("./ScalisPrimitive.js");
import THREE = require("three");
type ScalisSegmentJSON = {
    density: number;
} & ScalisPrimitiveJSON;
import AreaScalisSeg = require("../areas/AreaScalisSeg.js");
import ScalisVertex = require("./ScalisVertex.js");
import Material = require("../Material.js");
type ScalisPrimitiveJSON = import('./ScalisPrimitive').ScalisPrimitiveJSON;
//# sourceMappingURL=ScalisSegment.d.ts.map
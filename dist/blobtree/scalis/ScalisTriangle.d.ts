export = ScalisTriangle;
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./ScalisPrimitive').ScalisPrimitiveJSON} ScalisPrimitiveJSON */
/**
 * @typedef {ScalisPrimitiveJSON} ScalisTriangleJSON
 */
/**
 * This class implements a ScalisTriangle primitive.
 *  CONVOL Evaluation is not exact so we use simpsons numerical integration.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
declare class ScalisTriangle extends ScalisPrimitive {
    /** @type {"ScalisTriangle"} */
    static type: "ScalisTriangle";
    /**
     * @param {ScalisTriangleJSON} json
     * @returns
     */
    static fromJSON(json: ScalisTriangleJSON): import("./ScalisTriangle.js");
    /**
     *  @param {!Array.<ScalisVertex>} v the 3 vertices for the triangle
     *  @param {!string} volType Volume type, can be ScalisPrimitive.CONVOL
     *                 (homothetic convolution surfaces, Zanni and al), or
     *                 ScalisPrimitive.DIST (classic weighted distance field)
     *  @param {number} density Density is another constant to modulate the implicit
     *                  field. Used only for DIST voltype.
     *  @param {!Array.<Material>} mats Material for this primitive.
     *                                  Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
     *
     */
    constructor(v: Array<ScalisVertex>, volType: string, density: number, mats: Array<Material>);
    min_thick: number;
    max_thick: number;
    res_gseg: {};
    tmp_res_gseg: {};
    p0p1: THREE.Vector3;
    p1p2: THREE.Vector3;
    p2p0: THREE.Vector3;
    unit_normal: THREE.Vector3;
    unit_p0p1: THREE.Vector3;
    unit_p1p2: THREE.Vector3;
    unit_p2p0: THREE.Vector3;
    length_p0p1: number;
    length_p1p2: number;
    length_p2p0: number;
    diffThick_p0p1: number;
    diffThick_p1p2: number;
    diffThick_p2p0: number;
    main_dir: THREE.Vector3;
    point_iso_zero: THREE.Vector3;
    ortho_dir: THREE.Vector3;
    unsigned_ortho_dir: THREE.Vector3;
    proj_dir: THREE.Vector3;
    equal_weights: boolean;
    coord_max: number;
    coord_middle: number;
    unit_delta_weight: number;
    longest_dir_special: THREE.Vector3;
    max_seg_length: number;
    half_dir_1: THREE.Vector3;
    point_half: THREE.Vector3;
    half_dir_2: THREE.Vector3;
    point_min: THREE.Vector3;
    weight_min: number;
    getType(): "ScalisTriangle";
    getAreas(): {
        aabb: THREE.Box3;
        bv: AreaScalisTri;
        obj: this;
    }[];
    setVolType(vt: any): void;
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
    distanceTo: (p: any) => number;
    /**
     *  value function for Distance volume type (distance field).
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    evalDist: (p: THREE.Vector3, res: ValueResultType) => void;
    /**
     *
     *  Segment computations used in Distance triangle evaluation.
     *
     *  @param {!THREE.Vector3} point Point where value is wanted, as a THREE.Vector3
     *  @param {!THREE.Vector3} p1 Segment first point, as a THREE.Vector3
     *  @param {!THREE.Vector3} p1p2 Segment first to second point, as a THREE.Vector3
     *  @param {number} length Length of the segment
     *  @param {number} sqr_length Squared length of the segment
     *  @param {number} weight_1 Weight for the first point of the segment
     *  @param {number} delta_weight weight_2 - weight_1
     *  @param {!Object} res {proj_to_p, weight_proj}
     *
     */
    GenericSegmentComputation(point: THREE.Vector3, p1: THREE.Vector3, p1p2: THREE.Vector3, length: number, sqr_length: number, weight_1: number, delta_weight: number, res: any): any;
    /**
     *  value function for Distance volume type (distance field).
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    evalConvol: (p: THREE.Vector3, res: ValueResultType) => void;
    /**
     *  @param {number} t
     *  @return {number} Warped value
     */
    warpAbscissa(t: number): number;
    /**
     *  @param {number} t
     *  @return {number} Unwarped value
     */
    unwarpAbscissa(t: number): number;
    /**
     *  @param {number} t
     *  @param {!THREE.Vector3} p point, as a THREE.Vector3
     *  @param {Object} res result containing the wanted elements like res.v for the value, res.g for the gradient, res.m for the material.
     *  @return the res parameter, filled with proper values
     */
    computeLineIntegral(t: number, p: THREE.Vector3, res: any): any;
    /**
     * "Select" the part of a segment that is inside (in the homothetic space) of a clipping "sphere".
     *          This function use precomputed values given as parameter (prevent redundant computation during convolution
     *          computation for instance)
     *          This function is used in Eval function of CompactPolynomial kernel which use a different parametrization for a greater stability.
     *
     *
     *  @param {!THREE.Vector3} w special_coeff, x, y and z attributes must be defined
     *  @param {number} length
     *  @param {!Object} clipped Result if clipping occured, in l1 and l2, returned
     *                           values are between 0.0 and length/weight_min
     *
     *  @return {boolean} true if clipping occured
     *
     *  @protected
     */
    protected homotheticClippingSpecial(w: THREE.Vector3, length: number, clipped: any): boolean;
    /**
     *  @param {!THREE.Vector3} p_1
     *  @param {number} w_1
     *  @param {!THREE.Vector3} unit_dir
     *  @param {number} length
     *  @param {!THREE.Vector3} point
     *  @return {!Object} Object defining v attribute with the computed value
     *
     *  @protected
     */
    protected consWeightEvalForSeg(p_1: THREE.Vector3, w_1: number, unit_dir: THREE.Vector3, length: number, point: THREE.Vector3, res: any): any;
    /**
     *  @param {!THREE.Vector3} p_1
     *  @param {number} w_1
     *  @param {!THREE.Vector3} unit_dir
     *  @param {number} length
     *  @param {!THREE.Vector3} point
     *  @return {!Object} Object defining v attribute with the computed value
     *
     *  @protected
     */
    protected consWeightEvalGradForSeg(p_1: THREE.Vector3, w_1: number, unit_dir: THREE.Vector3, length: number, point: THREE.Vector3, res: any): any;
    /**
     *  @param {!THREE.Vector3} point the point of evaluation, as a THREE.Vector3
     *  @param {!Object} clipped Result if clipping occured, in l1 and l2, returned
     *                           values are between 0.0 and length/weight_min
     *  @return {boolean} true if clipping occured
     */
    ComputeTParam(point: THREE.Vector3, clipped: any): boolean;
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param {number} l
     *  @param {!THREE.Vector3} w Some coefficient, as a THREE.Vector3
     *  @return {number} the value
     */
    homotheticCompactPolynomial_segment_F_i6_cste(l: number, w: THREE.Vector3): number;
    /**
     *  Sub-function for optimized convolution for segment of constant weight,
     *  value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param {number} l
     *  @param {!THREE.Vector3} res result in a THREE.Vector3
     *  @param {!THREE.Vector3} w a THREE.Vector3
     *
     */
    homotheticCompactPolynomial_segment_FGradF_i6_cste(l: number, w: THREE.Vector3, res: THREE.Vector3): void;
}
declare namespace ScalisTriangle {
    export { ValueResultType, ScalisPrimitiveJSON, ScalisTriangleJSON };
}
import ScalisPrimitive = require("./ScalisPrimitive.js");
import THREE = require("three");
import AreaScalisTri = require("../areas/AreaScalisTri.js");
type ValueResultType = import('../Element.js').ValueResultType;
type ScalisTriangleJSON = ScalisPrimitiveJSON;
import ScalisVertex = require("./ScalisVertex.js");
import Material = require("../Material.js");
type ScalisPrimitiveJSON = import('./ScalisPrimitive').ScalisPrimitiveJSON;
//# sourceMappingURL=ScalisTriangle.d.ts.map
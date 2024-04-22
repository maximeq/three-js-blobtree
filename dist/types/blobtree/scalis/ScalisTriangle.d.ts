import { Box3, Vector3 } from "three";
import { Material } from "../Material.js";
import { ScalisPrimitive, type ScalisPrimitiveJSON, type ScalisPrimitiveVolType } from "./ScalisPrimitive.js";
import { ScalisVertex } from "./ScalisVertex.js";
import { AreaScalisTri } from "../areas/AreaScalisTri.js";
import type { ValueResultType } from "../Element.js";
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./ScalisPrimitive').ScalisPrimitiveJSON} ScalisPrimitiveJSON */
export type ScalisTriangleJSON = ScalisPrimitiveJSON;
/**
 * This class implements a ScalisTriangle primitive.
 *  CONVOL Evaluation is not exact so we use simpsons numerical integration.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
export declare class ScalisTriangle extends ScalisPrimitive {
    static type: "ScalisTriangle";
    static fromJSON(json: ScalisTriangleJSON): ScalisTriangle;
    min_thick: number;
    max_thick: number;
    res_gseg: {};
    tmp_res_gseg: {};
    p0p1: Vector3;
    p1p2: Vector3;
    p2p0: Vector3;
    unit_normal: Vector3;
    unit_p0p1: Vector3;
    unit_p1p2: Vector3;
    unit_p2p0: Vector3;
    length_p0p1: number;
    length_p1p2: number;
    length_p2p0: number;
    diffThick_p0p1: number;
    diffThick_p0p1: number;
    diffThick_p0p1: number;
    diffThick_p1p2: number;
    diffThick_p2p0: number;
    main_dir: Vector3;
    point_iso_zero: Vector3;
    ortho_dir: Vector3;
    unsigned_ortho_dir: Vector3;
    proj_dir: Vector3;
    equal_weights: boolean;
    coord_max: number;
    coord_middle: number;
    unit_delta_weight: number;
    longest_dir_special: Vector3;
    max_seg_length: number;
    half_dir_1: Vector3;
    point_half: Vector3;
    half_dir_2: Vector3;
    point_min: Vector3;
    weight_min: number;
    valid_aabb: boolean;
    /**
     *  @param v the 3 vertices for the triangle
     *  @param volType Volume type, can be ScalisPrimitive.CONVOL
     *                 (homothetic convolution surfaces, Zanni and al), or
     *                 ScalisPrimitive.DIST (classic weighted distance field)
     *  @param density Density is another constant to modulate the implicit
     *                  field. Used only for DIST voltype.
     *  @param mats Material for this primitive.
     *                                  Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
     *
     */
    constructor(v: ScalisVertex[], volType: ScalisPrimitiveVolType, density: number, mats: Material[]);
    getType(): "ScalisTriangle";
    toJSON(): ScalisTriangleJSON;
    prepareForEval(): void;
    getAreas(): {
        aabb: Box3;
        bv: AreaScalisTri;
        obj: ScalisTriangle;
    }[];
    computeHelpVariables(): void;
    mutableVolType(): boolean;
    setVolType(vt: ScalisPrimitiveVolType): void;
    getVolType(): ScalisPrimitiveVolType;
    /**
     *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
     *  @return Clamped value
     *  Author: Jakub Korzeniowski
     *  Agency: Softhis
     *  http://www.softhis.com
     */
    clamp(a: number, b: number, c: number): number;
    distanceTo: (p: Vector3) => number;
    heuristicStepWithin(): number;
    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  value function for Distance volume type (distance field).
     */
    evalDist: (p: Vector3, res: ValueResultType) => void;
    /**
     *
     *  Segment computations used in Distance triangle evaluation.
     *
     *  @param  point Point where value is wanted, as a Vector3
     *  @param  p1 Segment first point, as a Vector3
     *  @param  p1p2 Segment first to second point, as a Vector3
     *  @param  length Length of the segment
     *  @param  sqr_length Squared length of the segment
     *  @param  weight_1 Weight for the first point of the segment
     *  @param  delta_weight weight_2 - weight_1
     *  @param  res {proj_to_p, weight_proj}
     *
     */
    GenericSegmentComputation(point: Vector3, p1: Vector3, p1p2: Vector3, length: number, sqr_length: number, weight_1: number, delta_weight: number, // = weight_2-weight_1
    res: {
        proj_to_p: Vector3;
        weight_proj: number;
        t: number;
    }): {
        proj_to_p: Vector3;
        weight_proj: number;
        t: number;
    };
    /**
     *  value function for Distance volume type (distance field).
     *
     *  @param {Vector3} p
     *  @param {ValueResultType} res
     */
    evalConvol: (p: Vector3, res: ValueResultType) => void;
    /**
     *  @return Warped value
     */
    warpAbscissa(t: number): number;
    /**
     *  @return Unwarped value
     */
    unwarpAbscissa(t: number): number;
    /**
     *  @param  t
     *  @param  p point, as a Vector3
     *  @param  res result containing the wanted elements like res.v for the value, res.g for the gradient, res.m for the material.
     *  @return the res parameter, filled with proper values
     */
    computeLineIntegral(t: number, p: Vector3, res: Object): Object;
    /**
     * "Select" the part of a segment that is inside (in the homothetic space) of a clipping "sphere".
     *          This function use precomputed values given as parameter (prevent redundant computation during convolution
     *          computation for instance)
     *          This function is used in Eval function of CompactPolynomial kernel which use a different parametrization for a greater stability.
     *
     *
     *  @param w special_coeff, x, y and z attributes must be defined
     *  @param length
     *  @param clipped Result if clipping occured, in l1 and l2, returned
     *                           values are between 0.0 and length/weight_min
     *
     *  @return  true if clipping occured
     *
     *  @protected
     */
    homotheticClippingSpecial(w: Vector3, length: number, clipped: Object): boolean;
    /**
     *  @param {!Vector3} point
     *  @return Object defining v attribute with the computed value
     *
     *  @protected
     */
    consWeightEvalForSeg(p_1: Vector3, w_1: number, unit_dir: Vector3, length: number, point: Vector3, res: Object): Object;
    /**
     *  @return  Object defining v attribute with the computed value
     *  @protected
     */
    consWeightEvalGradForSeg(p_1: Vector3, w_1: number, unit_dir: Vector3, length: number, point: Vector3, res: Object): Object;
    /**
     *  @param  point the point of evaluation, as a Vector3
     *  @param  clipped Result if clipping occured, in l1 and l2, returned
     *                           values are between 0.0 and length/weight_min
     *  @return  true if clipping occured
     */
    ComputeTParam(point: Vector3, clipped: Object): boolean;
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param w Some coefficient, as a Vector3
     *  @return  the value
     */
    homotheticCompactPolynomial_segment_F_i6_cste(l: number, w: Vector3): number;
    /**
     *  Sub-function for optimized convolution for segment of constant weight,
     *  value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param  l
     *  @param  res result in a Vector3
     *  @param  w a Vector3
     *
     */
    homotheticCompactPolynomial_segment_FGradF_i6_cste(l: number, w: Vector3, res: Vector3): void;
}
//# sourceMappingURL=ScalisTriangle.d.ts.map
import { Box3, Vector3 } from "three";
import { Material } from "../Material";
import { ScalisPrimitive, type ScalisPrimitiveJSON, type ScalisPrimitiveVolType } from "./ScalisPrimitive";
import { ScalisVertex } from "./ScalisVertex";
import { AreaScalisSeg } from "../areas/AreaScalisSeg";
import type { ValueResultType } from "../Element";
export type ScalisSegmentJSON = {
    density: number;
} & ScalisPrimitiveJSON;
/**
 *  Implicit segment class in the blobtree.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
export declare class ScalisSegment extends ScalisPrimitive {
    static type: "ScalisSegment";
    static fromJSON(json: ScalisSegmentJSON): ScalisSegment;
    density: number;
    clipped_l1: number;
    clipped_l2: number;
    vector: Vector3;
    cycle: Vector3;
    proj: Vector3;
    v0_p: Vector3;
    v1_p: Vector3;
    dir: Vector3;
    lengthSq: number;
    length: number;
    unit_dir: Vector3;
    weight_p1: number;
    c0: number;
    c1: number;
    increase_unit_dir: Vector3;
    p_min: Vector3;
    weight_min: number;
    inv_weight_min: number;
    unit_delta_weight: number;
    maxbound: number;
    maxboundSq: number;
    cyl_bd0: number;
    cyl_bd1: number;
    f0f1f2: Vector3;
    tmpVec1: Vector3;
    tmpVec2: Vector3;
    /**
     *  @param v0 First vertex for the segment
     *  @param v1 Second vertex for the segment
     *  @param volType Volume type, can be ScalisPrimitive.CONVOL
     *                 (homothetic convolution surfaces, Zanni and al), or
     *                 ScalisPrimitive.DIST (classic weighted distance field)
     *  @param density Density is another constant to modulate the implicit
     *                  field. Used only for DIST voltype.
     *  @param mats Material for this primitive.
     *              Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
     */
    constructor(v0: ScalisVertex, v1: ScalisVertex, volType: ScalisPrimitiveVolType, density: number, mats: Material[]);
    getType(): string;
    toJSON(): ScalisSegmentJSON;
    mutableVolType(): boolean;
    /**
     *  @param d The new density
     */
    setDensity(d: number): void;
    /**
     *  @return The current density
     */
    getDensity(): number;
    /**
     *  [Abstract] See Primitive.setVolType for more details.
     *  @param vt New VolType to set (Only for SCALIS primitives)
     */
    setVolType(vt: ScalisPrimitiveVolType): void;
    getVolType(): ScalisPrimitiveVolType;
    prepareForEval(): void;
    getAreas(): {
        aabb: Box3;
        bv: AreaScalisSeg;
        obj: ScalisSegment;
    }[];
    computeHelpVariables(): void;
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  value function for Distance volume type (distance field).
     */
    evalDist: (this: ScalisSegment, p: Vector3, res: ValueResultType) => void;
    /**
     *
     * @param p Evaluation point
     * @param res Resulting material will be in res.m
    */
    evalMat(p: Vector3, res: ValueResultType): void;
    /**
     *  @param w special_coeff
     */
    HomotheticClippingSpecial(w: Vector3): boolean;
    heuristicStepWithin(): number;
    /**
     *  value function for Convol volume type (Homothetic convolution).
     */
    evalConvol(p: Vector3, res: ValueResultType): void;
    /**
     *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
     *  @return Clamped value
     *  Author: Jakub Korzeniowski
     *  Agency: Softhis
     *  http://www.softhis.com
     */
    clamp(a: number, b: number, c: number): number;
    distanceTo: (this: ScalisSegment, p: Vector3) => number;
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @return the value
     */
    HomotheticCompactPolynomial_segment_F_i6(l: number, d: number, w: {
        x: number;
        y: number;
        z: number;
    }): number;
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).
     *  (Approximation? Faster?).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     */
    HomotheticCompactPolynomial_approx_segment_F_i6(l: number, d: number, q: number, w: {
        x: number;
        y: number;
        z: number;
    }): number;
    /**
     *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  Result is stored in this.f0f1f2
     */
    HomotheticCompactPolynomial_segment_FGradF_i6(l: number, d: number, w: {
        x: number;
        y: number;
        z: number;
    }): void;
    /**
     *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  Result is stored in this.f0f1f2
     */
    HomotheticCompactPolynomial_approx_segment_FGradF_i6(l: number, d: number, q: number, w: {
        x: number;
        y: number;
        z: number;
    }): void;
}
//# sourceMappingURL=ScalisSegment.d.ts.map
import { Box3, Vector3 } from "three";
import { Material } from "../Material.js";
import { ScalisPrimitive, type ScalisPrimitiveJSON, type ScalisPrimitiveVolType } from "./ScalisPrimitive.js";
import { ScalisVertex } from "./ScalisVertex.js";
import { AreaSphere } from "../areas/AreaSphere.js";
import type { ValueResultType } from "../Element.js";
export type ScalisPointJSON = {
    density: number;
} & ScalisPrimitiveJSON;
export declare class ScalisPoint extends ScalisPrimitive {
    static type: string;
    /**
     * @param {ScalisPointJSON} json
     * @returns
     */
    static fromJSON(json: ScalisPointJSON): ScalisPoint;
    density: number;
    v_to_p: Vector3;
    /**
     *  @param vertex The vertex with point parameters.
     *  @param volType The volume type wanted for this primitive.
     *                          Note : "convolution" does not make sens for a point, so technically,
     *                                 ScalisPrimitive.DIST or ScalisPrimitive.CONVOL will give the same results.
     *                                 However, since this may be a simple way of sorting for later blending,
     *                                 you can still choose between the 2 options.
     *  @param density Implicit field density.
     *                          Gives afiner control of the created implicit field.
     *  @param mat Material for the point
     */
    constructor(vertex: ScalisVertex, volType: ScalisPrimitiveVolType, density: number, mat: Material);
    getType(): string;
    toJSON(): {
        density: number;
        v: import("./ScalisVertex.js").ScalisVertexJSON[];
        volType: ScalisPrimitiveVolType;
        materials: import("../Material.js").MaterialJSON[];
        type: string;
    };
    /**
     *  @param d New density to set
     */
    setDensity(d: number): void;
    /**
     *  @return  Current density
     */
    getDensity(): number;
    /**
     *  Set material for this point
     *  @param  m
     */
    setMaterial(m: Material): void;
    /**
     * @link Primitive.computeHelpVariables
     */
    computeHelpVariables(): void;
    /**
     * @link Element.prepareForEval
     */
    prepareForEval(): void;
    getAreas(): {
        aabb: Box3;
        bv: AreaSphere;
        obj: ScalisPoint;
    }[];
    /**
     * @link Element.heuristicStepWithin
     * @return {number} The next step length to do with respect to this primitive/node.
     */
    heuristicStepWithin(): number;
    /**
     *  @link Element.value
     *
     *  @param p Point where we want to evaluate the primitive field
     *  @param res
     */
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  @param p
     *  @return
     */
    distanceTo(p: Vector3): number;
}
//# sourceMappingURL=ScalisPoint.d.ts.map
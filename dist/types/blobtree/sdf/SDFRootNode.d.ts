import { Vector3, Box3 } from "three";
import { SDFNode, type SDFNodeJSON } from "./SDFNode.js";
import { Primitive, type PrimitiveJSON } from "../Primitive.js";
import { Material } from "../Material.js";
import { DistanceFunctor, type DistanceFunctorJSON } from './DistanceFunctor.js';
import { SDFPrimitive } from './SDFPrimitive.js';
import { Area } from '../areas/Area.js';
import { type ValueResultType } from "../Element.js";
export type SDFRootNodeJSON = {
    f: DistanceFunctorJSON;
    sdfRoot: SDFNodeJSON;
} & PrimitiveJSON;
export type SDFRootNodeType = "SDFRootNode";
/**
 *  This class implements a SDF Root Node, which is basically a Signed Distance Field
 *  made of some node combination, on which is applied a compact support function.
 *  For now SDF nodes do not have materials. A unique material is defined in the SDFRootNode.
 */
export declare class SDFRootNode extends Primitive {
    static type: SDFRootNodeType;
    f: DistanceFunctor;
    sdfRoot: SDFNode;
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    static fromJSON(json: SDFRootNodeJSON): SDFRootNode;
    /**
     * @param f The distance function to be applied to the distance field.
     * It must respect the Blobtree convention, which is : positive everywhere, with a finite support.
     * @param material The material for this node.
     * @param sdfRoot The child containing the complete SDF. SDFRootNode can have only one child.
     */
    constructor(f: DistanceFunctor, material?: Material, sdfRoot?: SDFNode | SDFPrimitive);
    getType(): SDFRootNodeType;
    addChild(c: SDFNode | SDFPrimitive): void;
    removeChild(c: SDFNode | SDFPrimitive): void;
    toJSON(): SDFRootNodeJSON;
    prepareForEval(): void;
    /**
     *  @link Element.getAreas for a complete description
     *
     *  This function is an attempt to have SDFRootNode behave like a Primitive in the normal Blobtree.
     */
    getAreas(): {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     *  @link Node.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
    computeHelpVariables(): void;
    heuristicStepWithin(): number;
}
//# sourceMappingURL=SDFRootNode.d.ts.map
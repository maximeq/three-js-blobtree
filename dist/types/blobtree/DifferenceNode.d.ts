import { Vector3, Box3 } from "three";
import { Node, type NodeJSON } from "./Node";
import { Material } from "./Material";
import { Element, type ValueResultType } from './Element';
type DifferenceNodeJSON = {
    alpha: number;
} & NodeJSON;
/**
 *  This class implement a difference blending node.
 *  The scalar field of the second child of this node will be substracted to the first node field.
 *  The result is clamped to 0 to always keep a positive field value.
 *  @constructor
 *  @extends Node
 */
export declare class DifferenceNode extends Node {
    alpha: number;
    clamped: number;
    tmp_res0: ValueResultType;
    tmp_res1: ValueResultType;
    g0: Vector3;
    m0: Material;
    g1: Vector3;
    m1: Material;
    tmp_v_arr: Float32Array;
    tmp_m_arr: [Material | null, Material | null];
    static type: string;
    static fromJSON(json: DifferenceNodeJSON): DifferenceNode;
    /**
     *
     *  @param node0 The first node
     *  @param node1 The second node, its value will be substracted to the node 0 value.
     *  @param alpha Power of the second field : the greater alpha the sharper the difference. Default is 1, must be > 1.
     */
    constructor(node0: Node, node1: Node, alpha: number);
    getAlpha(): number;
    setAlpha(alpha: number): void;
    toJSON(): DifferenceNodeJSON;
    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval(): void;
    /**
     *  Compute the value and/or gradient and/or material
     *  of the element at position p in space. return computations in res (see below)
     *
     *  @param p Point where we want to evaluate the primitive field
     *  @param res Computed values will be stored here. Each values should exist and
     *                       be allocated already.
     *  @param res.v Value, must be defined
     *  @param res.m Material, must be allocated and defined if wanted
     *  @param res.g Gradient, must be allocated and defined if wanted
     *  @param res.step The next step we can safely walk without missing the iso (0). Mostly used for convergence function or ray marching.
     *  @param res.stepOrtho
     */
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  @link Element.trim for a complete description.
     *
     *  Trim must be redefined for DifferenceNode since in this node we cannot trim one of the 2 nodes without trimming the other.
     */
    trim(aabb: Box3, trimmed: Element[], parents: Node[]): void;
}
export {};
//# sourceMappingURL=DifferenceNode.d.ts.map
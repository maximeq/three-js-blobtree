import { Vector3, Matrix4, Box3 } from "three";
import { Node, type NodeJSON } from "./Node";
import { Material } from "./Material";
import type { ValueResultType, Element } from './Element';
type TwistNodeJSON = {
    twist_amount: number;
    axis_x: number;
    axis_y: number;
    axis_z: number;
} & NodeJSON;
/**
 *  This class implement a TwistNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export declare class TwistNode extends Node {
    _twist_amount: number;
    _twist_axis: Vector3;
    _twist_axis_mat: Matrix4;
    _twist_axis_mat_inv: Matrix4;
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;
    static type: string;
    /**
    *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children?: Node[]);
    /**
    * @link Node.toJSON
    * @returns {TwistNodeJSON}
    */
    toJSON(): TwistNodeJSON;
    /**
     *@link Node.fromJSON
     *
     * @param {TwistNodeJSON} json
     * @returns {TwistNode}
     */
    static fromJSON(json: TwistNodeJSON): TwistNode;
    setTwistAmount(amount: number): void;
    setTwistAxis(axis: Vector3): void;
    _computeTransforms(): void;
    getType(): string;
    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval(): void;
    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  @link Element.trim for a complete description.
     */
    trim(aabb: Box3, trimmed: Element[], parents: Node[]): void;
}
export {};
//# sourceMappingURL=TwistNode.d.ts.map
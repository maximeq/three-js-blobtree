import { Vector3 } from "three";
import { Node, type NodeJSON } from "./Node";
import { Material } from "./Material";
import { type ValueResultType } from './Element';
type MaxNodeJSON = NodeJSON;
/**
 *  This class implement a Max node.
 *  It will return the maximum value of the field of each primitive.
 *  Return 0 in region were no primitive is present.
 *  @class MaxNode
 *  @extends Node
 */
export declare class MaxNode extends Node {
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;
    static type: string;
    static fromJSON(json: MaxNodeJSON): MaxNode;
    /**
     *  @constructor
     *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
     */
    constructor(children?: Node[]);
    getType(): string;
    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval(): void;
    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
}
export {};
//# sourceMappingURL=MaxNode.d.ts.map
import { Vector3, Box3 } from "three";
import { Node, type NodeJSON } from "./Node";
import { Material } from "./Material";
import { type ValueResultType, Element } from './Element';
type MinNodeJSON = NodeJSON;
/**
 *  This class implement a Min node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export declare class MinNode extends Node {
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;
    static type: string;
    fromJSON(json: MinNodeJSON): MinNode;
    /**
    *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children?: Node[]);
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
//# sourceMappingURL=MinNode.d.ts.map
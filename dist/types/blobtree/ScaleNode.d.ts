import { Vector3, Box3 } from "three";
import { Node } from "./Node";
import { Material } from "./Material";
import type { ValueResultType, Element } from './Element';
import type { NodeJSON } from './Node';
type ScaleNodeJSON = {
    scale_x: number;
    scale_y: number;
    scale_z: number;
} & NodeJSON;
/**
 *  This class implement a ScaleNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export declare class ScaleNode extends Node {
    _scale: Vector3;
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
    */
    toJSON(): ScaleNodeJSON;
    /**
     * @link Node.fromJSON
     */
    static fromJSON(json: ScaleNodeJSON): ScaleNode;
    /**
     * @link ScaleNode.setScale
     */
    setScale(scale: Vector3): void;
    /**
     * @link Node.getType
     */
    getType(): string;
    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval(): void;
    /**
    * @link Element.computeAABB for a complete description
    */
    computeAABB(): void;
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
//# sourceMappingURL=ScaleNode.d.ts.map
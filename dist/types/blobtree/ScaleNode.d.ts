import { Node } from "./Node";
/** @typedef {import('./Element.js')} Element */
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */
/**
 * @typedef { {scale_x:number} & {scale_y:number} & {scale_z:number} & NodeJSON} ScaleNodeJSON
 */
/**
 *  This class implement a ScaleNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export declare class ScaleNode extends Node {
    static type: string;
    /**
    *  @param {Array.<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children: any);
    /**
    * @link Node.toJSON
    * @returns {ScaleNodeJSON}
    */
    toJSON(): {
        scale_x: any;
        scale_y: any;
        scale_z: any;
        children: never[];
        type: string;
    };
    /**
     * @link Node.fromJSON
     *
     * @param {ScaleNodeJSON} json
     * @returns {ScaleNode}
     */
    static fromJSON(json: any): ScaleNode;
    /**
     * @link ScaleNode.setScale
     * @param {Vector3} scale
     */
    setScale(scale: any): void;
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
     *
     *  @param {Vector3} p
     *  @param {ValueResultType} res
     */
    value(p: any, res: any): void;
    /**
     *  @link Element.trim for a complete description.
     *
     *  @param {Box3} aabb
     *  @param {Array<Element>} trimmed
     *  @param {Array<Node>} parents
     */
    trim(aabb: any, trimmed: any, parents: any): void;
}
//# sourceMappingURL=ScaleNode.d.ts.map
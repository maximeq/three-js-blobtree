import { Node } from "./Node";
/** @typedef {import('./Element.js')} Element */
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */
/**
 * @typedef {NodeJSON} MinNodeJSON
 */
/**
 *  This class implement a Min node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export declare class MinNode extends Node {
    static type: string;
    /**
     *
     * @param {MinNodeJSON} json
     * @returns {MinNode}
     */
    static fromJSON(json: any): MinNode;
    /**
    *  @param {Array.<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children: any);
    getType(): string;
    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval(): void;
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
//# sourceMappingURL=MinNode.d.ts.map
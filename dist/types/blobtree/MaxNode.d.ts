import { Node } from "./Node";
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */
/**
 * @typedef {NodeJSON} MaxNodeJSON
 */
/**
 *  This class implement a Max node.
 *  It will return the maximum value of the field of each primitive.
 *  Return 0 in region were no primitive is present.
 *  @class MaxNode
 *  @extends Node
 */
export declare class MaxNode extends Node {
    static type: string;
    /**
     *
     * @param {Json} json
     * @returns
     */
    static fromJSON(json: any): MaxNode;
    /**
     *  @constructor
     *  @param {Array<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
     */
    constructor(children: any);
    /**
     * @returns {string}
     */
    getType: () => string;
    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval(): void;
    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value(p: any, res: any): void;
}
//# sourceMappingURL=MaxNode.d.ts.map
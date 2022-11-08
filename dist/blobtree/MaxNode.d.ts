export = MaxNode;
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
declare class MaxNode extends Node {
    /**
     *
     * @param {Json} json
     * @returns
     */
    static fromJSON(json: Json): import("./MaxNode.js");
    /**
     *  @constructor
     *  @param {Array<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
     */
    constructor(children?: Array<Node> | undefined);
    /** @type {{v:number, g:THREE.Vector3, m:Material}} */
    tmp_res: {
        v: number;
        g: THREE.Vector3;
        m: Material;
    };
    /** @type {THREE.Vector3} */
    tmp_g: THREE.Vector3;
    /** @type {Material} */
    tmp_m: Material;
}
declare namespace MaxNode {
    export { Json, ValueResultType, NodeJSON, MaxNodeJSON };
}
import Node = require("./Node.js");
import THREE = require("three");
import Material = require("./Material.js");
type Json = import('./Element.js').Json;
type ValueResultType = import('./Element.js').ValueResultType;
type NodeJSON = import('./Node.js').NodeJSON;
type MaxNodeJSON = NodeJSON;
//# sourceMappingURL=MaxNode.d.ts.map
export = MinNode;
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
declare class MinNode extends Node {
    /**
     *
     * @param {MinNodeJSON} json
     * @returns {MinNode}
     */
    static fromJSON(json: MinNodeJSON): MinNode;
    /**
    *  @param {Array.<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
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
declare namespace MinNode {
    export { Element, Json, ValueResultType, NodeJSON, MinNodeJSON };
}
import Node = require("./Node.js");
import THREE = require("three");
import Material = require("./Material.js");
type MinNodeJSON = NodeJSON;
type Element = import('./Element.js');
type Json = import('./Element.js').Json;
type ValueResultType = import('./Element.js').ValueResultType;
type NodeJSON = import('./Node.js').NodeJSON;
//# sourceMappingURL=MinNode.d.ts.map
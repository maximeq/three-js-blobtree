export = ScaleNode;
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
declare class ScaleNode extends Node {
    /**
     * @link Node.fromJSON
     *
     * @param {ScaleNodeJSON} json
     * @returns {ScaleNode}
     */
    static fromJSON(json: ScaleNodeJSON): ScaleNode;
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
    _scale: THREE.Vector3;
    /**
    * @link Node.toJSON
    * @returns {ScaleNodeJSON}
    */
    toJSON(): ScaleNodeJSON;
    /**
     * @link ScaleNode.setScale
     */
    setScale(scale: any): void;
}
declare namespace ScaleNode {
    export { Element, Json, ValueResultType, NodeJSON, ScaleNodeJSON };
}
import Node = require("./Node.js");
import THREE = require("three");
import Material = require("./Material.js");
type ScaleNodeJSON = {
    scale_x: number;
} & {
    scale_y: number;
} & {
    scale_z: number;
} & NodeJSON;
type Element = import('./Element.js');
type Json = import('./Element.js').Json;
type ValueResultType = import('./Element.js').ValueResultType;
type NodeJSON = import('./Node.js').NodeJSON;
//# sourceMappingURL=ScaleNode.d.ts.map
export = TwistNode;
/** @typedef {import('./Element.js')} Element */
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */
/**
 * @typedef { {twist_amout:number} & {axis_x:number} & {axis_y:number} & {axis_z:number} & NodeJSON} TwistNodeJSON
 */
/**
 *  This class implement a TwistNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
declare class TwistNode extends Node {
    /**
     *@link Node.fromJSON
     *
     * @param {TwistNodeJSON} json
     * @returns {TwistNode}
     */
    static fromJSON(json: TwistNodeJSON): TwistNode;
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
    _twist_amout: number;
    _twist_axis: THREE.Vector3;
    _twist_axis_mat: THREE.Matrix4;
    _twist_axis_mat_inv: THREE.Matrix4;
    /**
    * @link Node.toJSON
    * @returns {TwistNodeJSON}
    */
    toJSON(): TwistNodeJSON;
    setTwistAmount(amount: any): void;
    setTwistAxis(axis: any): void;
    _computeTransforms(): void;
}
declare namespace TwistNode {
    export { Element, Json, ValueResultType, NodeJSON, TwistNodeJSON };
}
import Node = require("./Node.js");
import THREE = require("three");
import Material = require("./Material.js");
type TwistNodeJSON = {
    twist_amout: number;
} & {
    axis_x: number;
} & {
    axis_y: number;
} & {
    axis_z: number;
} & NodeJSON;
type Element = import('./Element.js');
type Json = import('./Element.js').Json;
type ValueResultType = import('./Element.js').ValueResultType;
type NodeJSON = import('./Node.js').NodeJSON;
//# sourceMappingURL=TwistNode.d.ts.map
export = RicciNode;
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */
/**
 * @typedef {{ricci_n:number} & NodeJSON} RicciNodeJSON
 */
/**
 *  This class implement a n-ary blend node which use a Ricci Blend.
 *  Ricci blend is : v = k-root( Sum(c.value^k) ) for all c in node children.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
declare class RicciNode extends Node {
    /**
     * @link Node.fromJSON
     * @param {Json} json
     * @returns
     */
    static fromJSON(json: Json): import("./RicciNode.js");
    /**
     *  @param {number} ricci_n The value for ricci
     *  @param {Array<Node>=} children The children to add to this node. Just a convenient parameter, you can do it manually using addChild
     */
    constructor(ricci_n: number, children?: Array<Node> | undefined);
    /** @type {number} */
    ricci_n: number;
    /** @type {Float32Array} */
    tmp_v_arr: Float32Array;
    /** @type {Array<Material>} */
    tmp_m_arr: Array<Material>;
    /** @type {{v:number, g: THREE.Vector3, m:Material}} */
    tmp_res: {
        v: number;
        g: THREE.Vector3;
        m: Material;
    };
    /** @type {THREE.Vector3} */
    tmp_g: THREE.Vector3;
    /** @type {Material} */
    tmp_m: Material;
    /**
     * @link Node.toJSON
     * @returns {RicciNodeJSON}
     */
    toJSON(): RicciNodeJSON;
    /**
     * @param {number} n
     */
    setRicciN(n: number): void;
    /**
     * @returns {number}
     */
    getRicciN: () => number;
}
declare namespace RicciNode {
    export { Json, ValueResultType, NodeJSON, RicciNodeJSON };
}
import Node = require("./Node.js");
import Material = require("./Material.js");
import THREE = require("three");
type RicciNodeJSON = {
    ricci_n: number;
} & NodeJSON;
type Json = import('./Element.js').Json;
type ValueResultType = import('./Element.js').ValueResultType;
type NodeJSON = import('./Node.js').NodeJSON;
//# sourceMappingURL=RicciNode.d.ts.map
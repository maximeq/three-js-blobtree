export = DifferenceNode;
/**
 * @typedef {import('./Element.js')} Element
 * @typedef {import('./Element.js').Json} Json
 * @typedef {import('./Node.js').NodeJSON} NodeJSON
 */
/**
 * @typedef {{alpha:number} & NodeJSON} DifferenceNodeJSON
 */
/**
 *  This class implement a difference blending node.
 *  The scalar field of the second child of this node will be substracted to the first node field.
 *  The result is clamped to 0 to always keep a positive field value.
 *  @constructor
 *  @extends Node
 */
declare class DifferenceNode extends Node {
    /**
     * @param {DifferenceNodeJSON} json
     * @returns {DifferenceNode}
     */
    static fromJSON(json: DifferenceNodeJSON): DifferenceNode;
    /**
     *
     *  @param {!Node} node0 The first node
     *  @param {!Node} node1 The second node, its value will be substracted to the node 0 value.
     *  @param {number} alpha Power of the second field : the greater alpha the sharper the difference. Default is 1, must be > 1.
     */
    constructor(node0: Node, node1: Node, alpha: number);
    /** @type {number} */
    alpha: number;
    /**
     * For now, this field value is clamped to 0
     * @type {number}
     */
    clamped: number;
    /** @type {{v:number, g:THREE.Vector3, m:Material}} */
    tmp_res0: {
        v: number;
        g: THREE.Vector3;
        m: Material;
    };
    /** @type {{v:number, g:THREE.Vector3, m:Material}} */
    tmp_res1: {
        v: number;
        g: THREE.Vector3;
        m: Material;
    };
    /** @type {THREE.Vector3} */
    g0: THREE.Vector3;
    /** @type {Material} */
    m0: Material;
    /** @type {THREE.Vector3} */
    g1: THREE.Vector3;
    /** @type {Material} */
    m1: Material;
    /** @type {Float32Array} */
    tmp_v_arr: Float32Array;
    /** @type {Array<Material|null>} */
    tmp_m_arr: Array<Material | null>;
    /**
     * @returns {number}
     */
    getAlpha(): number;
    /**
     * @param {number} alpha
     */
    setAlpha(alpha: number): void;
    /**
     * @returns {DifferenceNodeJSON}
     */
    toJSON(): DifferenceNodeJSON;
    /**
     *  Compute the value and/or gradient and/or material
     *  of the element at position p in space. return computations in res (see below)
     *
     *  @param {THREE.Vector3} p Point where we want to evaluate the primitive field
     *  @param {Object} res Computed values will be stored here. Each values should exist and
     *                       be allocated already.
     *  @param {number} res.v Value, must be defined
     *  @param {Material} res.m Material, must be allocated and defined if wanted
     *  @param {THREE.Vector3} res.g Gradient, must be allocated and defined if wanted
     *  @param {number=} res.step The next step we can safely walk without missing the iso (0). Mostly used for convergence function or ray marching.
     *  @param {number=} res.stepOrtho
     */
    value(p: THREE.Vector3, res: {
        v: number;
        m: Material;
        g: THREE.Vector3;
        step?: number | undefined;
        stepOrtho?: number | undefined;
    }): void;
}
declare namespace DifferenceNode {
    export { Element, Json, NodeJSON, DifferenceNodeJSON };
}
import Node = require("./Node.js");
import THREE = require("three");
import Material = require("./Material.js");
type DifferenceNodeJSON = {
    alpha: number;
} & NodeJSON;
type Element = import('./Element.js');
type Json = import('./Element.js').Json;
type NodeJSON = import('./Node.js').NodeJSON;
//# sourceMappingURL=DifferenceNode.d.ts.map
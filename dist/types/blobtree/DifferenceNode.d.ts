import { Node } from "./Node";
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
export declare class DifferenceNode extends Node {
    static type: string;
    /**
     * @param {DifferenceNodeJSON} json
     * @returns {DifferenceNode}
     */
    static fromJSON(json: any): DifferenceNode;
    /**
     *
     *  @param {!Node} node0 The first node
     *  @param {!Node} node1 The second node, its value will be substracted to the node 0 value.
     *  @param {number} alpha Power of the second field : the greater alpha the sharper the difference. Default is 1, must be > 1.
     */
    constructor(node0: any, node1: any, alpha: any);
    /**
     * @returns {number}
     */
    getAlpha(): any;
    /**
     * @param {number} alpha
     */
    setAlpha(alpha: any): void;
    /**
     * @returns {DifferenceNodeJSON}
     */
    toJSON(): {
        alpha: any;
        children: never[];
        type: string;
    };
    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval(): void;
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
    value(p: any, res: any): void;
    /**
     *  @link Element.trim for a complete description.
     *
     *  Trim must be redefined for DifferenceNode since in this node we cannot trim one of the 2 nodes without trimming the other.
     *
     *  @param {THREE.Box3} aabb
     *  @param {Array.<Element>} trimmed
     *  @param {Array.<Node>} parents
     */
    trim(aabb: any, trimmed: any, parents: any): void;
}
//# sourceMappingURL=DifferenceNode.d.ts.map
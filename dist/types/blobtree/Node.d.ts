import { Element } from './Element';
/**
 * @typedef {import('./Element.js').Json} Json
 * @typedef {import('./Element.js').ElementJSON} ElementJSON
 * @typedef {import('./Primitive.js')} Primitive
 * @typedef {import('./areas/Area')} Area
 */
/** @typedef {{children:Array<{ElementJSON}>} & ElementJSON} NodeJSON*/
/**
 *  This class implements an abstract Node class for implicit blobtree.
 *  @constructor
 *  @extends {Element}
 */
export declare class Node extends Element {
    static type: string;
    /**
     * @param {NodeJSON} _json
     */
    static fromJSON(_json: any): void;
    constructor();
    getType(): string;
    /**
     * @return {NodeJSON}
     */
    toJSON(): {
        children: never[];
        type: string;
    };
    /**
     *  Clone current node and itss hierarchy
     */
    clone(): any;
    /**
     *  @link Element.prepareForEval
     */
    prepareForEval(): void;
    /**
     *  Invalid the bounding boxes recursively down for all children
     */
    invalidAll(): void;
    /**
     *  Destroy the node and its children. The node is removed from the blobtree
     *  (basically clean up the links between blobtree elements).
     */
    destroy(): void;
    /**
     *  Only works with nary nodes, otherwise a set function would be more appropriate.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  If c already belongs to the tree, it is removed from its current parent
     *  children list before anything (ie it is "moved").
     *
     *  @param {Element} c The child to add.
     */
    addChild(c: any): this;
    /**
     *  Only works with n-ary nodes, otherwise order matters and we therefore
     *  have to set "null" and node cannot be evaluated.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  WARNING:
     *      Should only be called when a Primitive is deleted.
     *      Otherwise :
     *          To move a node to another parent : use addChild.
     *  @param {Element} c The child to remove.
     */
    removeChild(c: any): void;
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB(): void;
    /**
     *  @link Element.getAreas for a complete description
     *  @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas(): any[];
    /**
     * @link Element.distanceTo for a complete description
     * @param {THREE.Vector3} p
     * @returns {number}
     */
    distanceTo(p: any): number;
    /**
     * @returns
     */
    heuristicStepWithin(): number;
    /**
     *  @link Element.trim for a complete description.
     *
     *  @param {THREE.Box3} aabb
     *  @param {Array.<Element>} trimmed
     *  @param {Array.<Node>} parents
     */
    trim(aabb: any, trimmed: any, parents: any): void;
    /**
     *  @link Element.count for a complete description.
     *
     *  @param {Function} cls
     *  @return {number}
     */
    count(cls: any): number;
}
//# sourceMappingURL=Node.d.ts.map
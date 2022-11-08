export = Node;
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
declare class Node extends Element {
    /**
     * @param {NodeJSON} _json
     */
    static fromJSON(_json: NodeJSON): void;
    /** @type {Array.<!Element>} */
    children: Array<Element>;
    /**
     * @return {NodeJSON}
     */
    toJSON(): NodeJSON;
    /**
     *  Clone current node and itss hierarchy
     */
    clone(): any;
    /**
     *  Only works with nary nodes, otherwise a set function would be more appropriate.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  If c already belongs to the tree, it is removed from its current parent
     *  children list before anything (ie it is "moved").
     *
     *  @param {Element} c The child to add.
     */
    addChild(c: Element): Node;
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
    removeChild(c: Element): void;
}
declare namespace Node {
    export { Json, ElementJSON, Primitive, Area, NodeJSON };
}
import Element = require("./Element.js");
type NodeJSON = {
    children: Array<{
        ElementJSON;
    }>;
} & ElementJSON;
type Json = import('./Element.js').Json;
type ElementJSON = import('./Element.js').ElementJSON;
type Primitive = import('./Primitive.js');
type Area = import('./areas/Area');
//# sourceMappingURL=Node.d.ts.map
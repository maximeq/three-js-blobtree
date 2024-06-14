import { Element, type ElementJSON } from './Element';
import type { Box3, Vector3 } from 'three';
import { Primitive } from './Primitive';
import { Area } from './areas/Area';
export type NodeJSON = {
    children: ElementJSON[];
} & ElementJSON;
/**
 *  This class implements an abstract Node class for implicit blobtree.
 *  @constructor
 *  @extends {Element}
 */
export declare abstract class Node extends Element {
    children: Node[];
    static type: string;
    static fromJSON(_json: NodeJSON): Node;
    constructor();
    getType(): string;
    toJSON(): NodeJSON;
    /**
     *  Clone current node and itss hierarchy
     */
    clone(): this;
    /**
     *  @link Element.prepareForEval
     */
    abstract prepareForEval(): void;
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
     *  @param c The child to add.
     */
    addChild(c: Node): this;
    /**
     *  Only works with n-ary nodes, otherwise order matters and we therefore
     *  have to set "null" and node cannot be evaluated.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  WARNING:
     *      Should only be called when a Primitive is deleted.
     *      Otherwise :
     *          To move a node to another parent : use addChild.
     *  @param c The child to remove.
     */
    removeChild(c: Element): void;
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB(): void;
    /**
     *  @link Element.getAreas for a complete description
     *  @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas(): {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     * @link Element.distanceTo for a complete description
     */
    distanceTo(p: Vector3): number;
    /**
     * @returns
     */
    heuristicStepWithin(): number;
    /**
     *  @link Element.trim for a complete description.
     */
    trim(aabb: Box3, trimmed: Element[], parents: Node[]): void;
    /**
     *  @link Element.count for a complete description.
     */
    count(cls: Function): number;
}
//# sourceMappingURL=Node.d.ts.map
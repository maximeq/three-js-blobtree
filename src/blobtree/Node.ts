import { Element, type ElementJSON } from './Element';
import { Types } from "./Types";
import type { Box3, Vector3 } from 'three';
import { Primitive } from './Primitive';
import { Area } from './areas/Area';

export type NodeJSON = {
    children: ElementJSON[];
} & ElementJSON;

export type RicciNodeType = "RicciNode";
export type RootNodeType = "RootNode";
export type ScaleNodeType = "ScaleNode";
export type TwistNodeType = "TwistNode";
export type DifferenceNodeType = "DifferenceNode";
export type MaxNodeType = "MaxNode";
export type MinNodeType = "MinNode";
export type SDFNodeType = "SDFNode";

export type NodeType = "Node" | RicciNodeType | RootNodeType | ScaleNodeType | TwistNodeType | DifferenceNodeType | MaxNodeType | MinNodeType | SDFNodeType;

/**
 *  This class implements an abstract Node class for implicit blobtree.
 *  @constructor
 *  @extends {Element}
 */
export abstract class Node extends Element {
    children: Element[];

    static override type: NodeType = "Node";

    static override fromJSON(_json: NodeJSON): Node {
        throw new Error("Node.fromJSON should never be called as Node is abstract.");
    }

    constructor() {
        super();
        this.children = [];
    }

    override getType(): NodeType {
        return Node.type;
    }

    override toJSON(): NodeJSON {
        const res: NodeJSON = {
            ...super.toJSON(),
            children: []
        };
        for (let i = 0; i < this.children.length; ++i) {
            res.children.push(this.children[i].toJSON());
        }
        return res;
    }

    /**
     *  Clone current node and its hierarchy
     */
    override clone(): this {
        return Types.fromJSON(this.toJSON());
    }

    /**
     *  @link Element.prepareForEval
     */
    abstract override prepareForEval(): void;

    /**
     *  Invalid the bounding boxes recursively down for all children
     */
    override invalidAll(): void {
        this.invalidAABB();
        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].invalidAll();
            }
        }
    };

    /**
     *  Destroy the node and its children. The node is removed from the blobtree
     *  (basically clean up the links between blobtree elements).
     */
    destroy(): void {
        // need to Copy the array since indices will change.
        const arr_c = this.children.slice(0, this.children.length);
        for (let i = 0; i < arr_c.length; i++) {
            arr_c[i].destroy();
        }
        if (this.children.length !== 0) {
            throw "Error : children length should be 0";
        }
        if (this.parentNode !== null) {
            this.parentNode.removeChild(this);
        }
        if (this.parentNode !== null) {
            throw "Error : parent node should be null at this point";
        }
        this.children.length = 0;
    };

    /**
     *  Only works with nary nodes, otherwise a set function would be more appropriate.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  If c already belongs to the tree, it is removed from its current parent
     *  children list before anything (ie it is "moved").
     *
     *  @param c The child to add.
     */
    addChild(c: Element) {
        if (c.parentNode !== null) {
            c.parentNode.removeChild(c);
        }
        // TODO should ckeck that the node does not already belong to the children list
        this.children.push(c);
        c.parentNode = this;

        this.invalidAABB();

        return this;
    };

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
    removeChild(c: Element) {
        let i = 0;
        const cdn = this.children; // minimize the code

        // Note : if this becomes too long, sort this.children using ids
        while (cdn[i] !== c && i < cdn.length) ++i;

        if (i != cdn.length) {
            cdn[i] = cdn[cdn.length - 1];
            cdn.pop();
        } else {
            throw "c does not belong to the children of this node";
        }

        this.invalidAABB();

        c.parentNode = null;
    }

    /**
     * @link Element.computeAABB for a complete description
     */
    override computeAABB() {
        this.aabb.makeEmpty();
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].computeAABB();
            this.aabb.union(this.children[i].getAABB());
        }
    }

    /**
     *  @link Element.getAreas for a complete description
     *  @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    override getAreas() {
        if (!this.valid_aabb) {
            throw "Error : cannot call getAreas on a not prepared for eval nod, please call PrepareForEval first. Node concerned is a " + this.getType();
        }
        const res: { aabb: Box3, bv: Area, obj: Primitive }[] = [];
        for (let i = 0; i < this.children.length; i++) {
            res.push.apply(res, this.children[i].getAreas());
        }
        return res;
    };

    /**
     * @link Element.distanceTo for a complete description
     */
    override distanceTo(p: Vector3): number {
        let res = 10000000;
        for (let i = 0; i < this.children.length; i++) {
            res = Math.min(res, this.children[i].distanceTo(p));
        }
        return res;
    };

    /**
     * @returns
     */
    heuristicStepWithin(): number {
        let res = 10000000;
        for (let i = 0; i < this.children.length; i++) {
            res = Math.min(res, this.children[i].heuristicStepWithin());
        }
        return res;
    };

    /**
     *  @link Element.trim for a complete description.
     */
    override trim(aabb: Box3, trimmed: Element[], parents: Node[]) {
        let idx = trimmed.length;
        for (let i = 0; i < this.children.length; i++) {
            if (!this.children[i].getAABB().intersectsBox(aabb)) {
                // trim the node
                trimmed.push(this.children[i]);
                parents.push(this);
            }
        }
        for (let i = idx; i < trimmed.length; ++i) {
            this.removeChild(trimmed[i]);
        }
        // Trim remaining nodes
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    };

    /**
     *  @link Element.count for a complete description.
     */
    override count(cls: Function): number {
        let count = 0;

        if (this instanceof cls) {
            count++;
        }

        for (let i = 0; i < this.children.length; i++) {
            count += this.children[i].count(cls);
        }

        return count;
    };

};

Types.register(Node.type, Node);


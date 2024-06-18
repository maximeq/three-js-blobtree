import { Box3, Vector3 } from "three";
import { Types } from "./Types";
import type { Node, NodeType } from "./Node";
import type { Area } from "./areas";
import type { Primitive, PrimitiveType } from "./Primitive";
import type { Material } from "./Material";
import type { SDFPrimitiveType } from "./sdf/SDFPrimitive";

/**   
 * Computed values will be stored here. Each values should exist and be allocated already.              
 * @property v Value, must be defined
 * @property m Material, must be allocated and defined if wanted
 * @property g Gradient, must be allocated and defined if wanted
 * @property step ??? Not sure, probably a "safe" step for raymarching
 * @property stepOrtho ??? Same as step but in orthogonal direction ?
 */
export type ValueResultType = {
    v: number,
    m?: Material | null,
    g?: Vector3 | null,
    step?: number,
    stepOrtho?: number,
};

type ElementType = "Element" | NodeType | PrimitiveType | SDFPrimitiveType;

export type ElementJSON = { type: string }

let elementIds = 0;

/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @class
 *  @constructor
 */
export abstract class Element {

    static type: ElementType = "Element";

    static fromJSON(_json: ElementJSON) {
        throw new Error("Element.fromJSON should never be called as Element is abstract.");
    }

    id: number;
    aabb = new Box3();
    valid_aabb: boolean = false;
    parentNode: Node | null = null;

    constructor() {
        this.id = elementIds++;
    }

    /**
     *  Return a Javscript Object respecting JSON convention.
     *  All classes must defined it.
     */
    toJSON(): ElementJSON {
        return {
            type: this.getType()
        };
    }

    /**
     *  Clone the object.
     */
    clone(): Element {
        return Types.fromJSON(this.toJSON());
    }

    /**
     *  @return The parent node of this primitive.
     */
    getParentNode(): Node | null {
        return this.parentNode;
    }

    /**
     *  @return Type of the element
     */
    getType(): ElementType {
        return Element.type;
    }

    /**
     *  Perform precomputation that will help to reduce future processing time,
     *  especially on calls to value.
     *  @protected
     */
    computeHelpVariables(): void {
        this.computeAABB();
    }

    /**
     *  @abstract
     *  Compute the Axis Aligned Bounding Box (AABB) for the current primitive.
     *  By default, the AABB returned is the unionns of all vertices AABB (This is
     *  good for almost all basic primitives).
     */
    abstract computeAABB(): void;

    /**
     *  @return The AABB of this Element (primitive or node). WARNING : call
     *  isValidAABB before to ensure the current AABB does correspond to the primitive
     *  settings.
     */
    getAABB(): Box3 {
        return this.aabb;
    }

    /**
     *  @return True if the current aabb is valid, ie it does
     *  correspond to the internal primitive parameters.
     */
    isValidAABB(): boolean {
        return this.valid_aabb;
    }

    /**
     *  Invalid the bounding boxes recursively up to the root
     */
    invalidAABB(): void {
        this.valid_aabb = false;
        if (this.parentNode !== null && this.parentNode.isValidAABB()) {
            this.parentNode.invalidAABB();
        }
    }

    /**
     *  Note : This function was made for Node to recursively invalidate
     *  children AABB. Default is to invalidate only this AABB.
     */
    invalidAll(): void {
        this.invalidAABB();
    }

    /**
     *  @abstract
     *  Prepare the element for a call to value.
     *  Important note: For now, a primitive is considered prepared for eval if and only
     *                  if its bounding box is valid (valid_aabb is true).
     */
    abstract prepareForEval(): void;
        // Possible improvement: return the list of deleted objects and new ares,
        // for example to launch a Marching Cube in the changed area only
        // @return {{del_obj:Array<Object>, new_areas:Array<Object>}}
        // return {del_obj:[], new_areas:[]};

    /**
     *  @abstract
     *  Compute the value and/or gradient and/or material
     *  of the element at position p in space. return computations in res (see below)
     *
     *  @param p Point where we want to evaluate the primitive field
     */
    abstract value(p: Vector3, res: ValueResultType): void;

    /**
     * @param p The point where we want the numerical gradient
     * @param res The resulting gradient
     * @param epsilon The step value for the numerical evaluation
     */
    numericalGradient = (function () {
        type coordinate = "x" | "y" | "z";
        let tmp = { v: 0, m: null, g: null };
        let coord: coordinate[] = ['x', 'y', 'z'];

        return function (this: Element, p: Vector3, res: Vector3, epsilon: number) {

            /** @type Element */
            let self = this;

            let eps = epsilon || 0.00001;

            for (let i = 0; i < 3; ++i) {
                p[coord[i]] = p[coord[i]] + eps;
                self.value(p, tmp);
                res[coord[i]] = tmp.v;
                p[coord[i]] = p[coord[i]] - 2 * eps;
                self.value(p, tmp);
                res[coord[i]] = (res[coord[i]] - tmp.v) / (2 * eps);
                p[coord[i]] = p[coord[i]] + eps; // reset p
            }
        }
    }
    )()

    /**
     *  @abstract
     *  Get the Area object.
     *  Area objects do provide methods useful when rasterizing, raytracing or polygonizing
     *  the area (intersections with other areas, minimum level of detail needed to
     *  capture the feature nicely, etc etc...).
     *  @returns The Areas object corresponding to the node/primitive, in an array
     */
    getAreas(): { aabb: Box3, bv: Area, obj: Primitive }[] {
        return [];
    }

    /**
     *  @abstract
     *  This function is called when a point is outside of the potential influence of a primitive/node.
     *  @param  _p
     *  @return  The next step length to do with respect to this primitive/node
     */
    distanceTo(_p: Vector3): number {
        throw new Error("ERROR : distanceTo is a virtual function, should be reimplemented in all classes extending Element. Concerned type: " + this.getType() + ".");
    }

    /**
     *  @abstract
     *  This function is called when a point is within the potential influence of a primitive/node.
     *  @return The next step length to do with respect to this primitive/node.
     */
    abstract heuristicStepWithin(): number;

    /**
     *  Trim the tree to keep only nodes influencing a given bounding box.
     *  The tree must be prepared for eval for this process to be working.
     *  Default behaviour is doing nothing, leaves cannot be sub-trimmed, only nodes.
     *  Note : only the root can untrim
     *
     *  @param _aabb
     *  @param _trimmed Array of trimmed Elements
     *  @param _parents Array of fathers from which each trimmed element has been removed.
     */
    trim(_aabb: Box3, _trimmed: Element[], _parents: Node[]) {
        // Do nothing by default
    };

    /**
     *  count the number of elements of class cls in this node and subnodes
     *  @param  _cls the class of the elements we want to count
     *  @return  The number of element of class cls
     */
    count(_cls: Function): number {
        return 0;
    }

    abstract destroy(): void;

};

Types.register(Element.type,  Element);


import { Box3, Vector3 } from "three";
import type { Node } from "./Node";
import type { Area } from "./areas";
import type { Primitive } from "./Primitive";
import type { Material } from "./Material";
/**
 * Computed values will be stored here. Each values should exist and be allocated already.
 * @property v Value, must be defined
 * @property m Material, must be allocated and defined if wanted
 * @property g Gradient, must be allocated and defined if wanted
 * @property step ??? Not sure, probably a "safe" step for raymarching
 * @property stepOrtho ??? Same as step but in orthogonal direction ?
 */
export type ValueResultType = {
    v: number;
    m: Material | null;
    g: Vector3 | null;
    step?: number;
    stepOrtho?: number;
};
export type ElementJSON = {
    type: string;
};
/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @class
 *  @constructor
 */
export declare abstract class Element {
    static type: string;
    static fromJSON(_json: ElementJSON): void;
    id: number;
    aabb: Box3;
    valid_aabb: boolean;
    parentNode: Node | null;
    constructor();
    /**
     *  Return a Javscript Object respecting JSON convention.
     *  All classes must defined it.
     */
    toJSON(): ElementJSON;
    /**
     *  Clone the object.
     */
    clone(): Element;
    /**
     *  @return The parent node of this primitive.
     */
    getParentNode(): Node | null;
    /**
     *  @return Type of the element
     */
    getType(): string;
    /**
     *  Perform precomputation that will help to reduce future processing time,
     *  especially on calls to value.
     *  @protected
     */
    computeHelpVariables(): void;
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
    getAABB(): Box3;
    /**
     *  @return True if the current aabb is valid, ie it does
     *  correspond to the internal primitive parameters.
     */
    isValidAABB(): boolean;
    /**
     *  Invalid the bounding boxes recursively up to the root
     */
    invalidAABB(): void;
    /**
     *  Note : This function was made for Node to recursively invalidate
     *  children AABB. Default is to invalidate only this AABB.
     */
    invalidAll(): void;
    /**
     *  @abstract
     *  Prepare the element for a call to value.
     *  Important note: For now, a primitive is considered prepared for eval if and only
     *                  if its bounding box is valid (valid_aabb is true).
     */
    abstract prepareForEval(): void;
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
    numericalGradient: (this: Element, p: Vector3, res: Vector3, epsilon: number) => void;
    /**
     *  @abstract
     *  Get the Area object.
     *  Area objects do provide methods useful when rasterizing, raytracing or polygonizing
     *  the area (intersections with other areas, minimum level of detail needed to
     *  capture the feature nicely, etc etc...).
     *  @returns The Areas object corresponding to the node/primitive, in an array
     */
    getAreas(): {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     *  @abstract
     *  This function is called when a point is outside of the potential influence of a primitive/node.
     *  @param  _p
     *  @return  The next step length to do with respect to this primitive/node
     */
    distanceTo(_p: Vector3): number;
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
    trim(_aabb: Box3, _trimmed: Element[], _parents: Node[]): void;
    /**
     *  count the number of elements of class cls in this node and subnodes
     *  @param  _cls the class of the elements we want to count
     *  @return  The number of element of class cls
     */
    count(_cls: Function): number;
    destroy(): void;
}
//# sourceMappingURL=Element.d.ts.map
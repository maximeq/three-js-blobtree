/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @class
 *  @constructor
 */
export declare class Element {
    static type: string;
    /**
     * @param {ElementJSON} _json
     */
    static fromJSON(_json: any): void;
    constructor();
    /**
     *  Return a Javscript Object respecting JSON convention.
     *  All classes must defined it.
     *  @return {ElementJSON}
     */
    toJSON(): {
        type: string;
    };
    /**
     *  Clone the object.
     * @return {Element}
     */
    clone(): any;
    /**
     *  @return {Node} The parent node of this primitive.
     */
    getParentNode(): any;
    /**
     *  @return {string} Type of the element
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
    computeAABB(): void;
    /**
     *  @return {THREE.Box3} The AABB of this Element (primitive or node). WARNING : call
     *  isValidAABB before to ensure the current AABB does correspond to the primitive
     *  settings.
     */
    getAABB(): any;
    /**
     *  @return {boolean} True if the current aabb is valid, ie it does
     *  correspond to the internal primitive parameters.
     */
    isValidAABB(): any;
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
    prepareForEval(): void;
    /**
     *  @abstract
     *  Compute the value and/or gradient and/or material
     *  of the element at position p in space. return computations in res (see below)
     *
     *  @param {THREE.Vector3} _p Point where we want to evaluate the primitive field
     *  @param {ValueResultType} _res
     */
    value(_p: any, _res: any): void;
    /**
     * @param {THREE.Vector3} p The point where we want the numerical gradient
     * @param {THREE.Vector3} res The resulting gradient
     * @param {number} epsilon The step value for the numerical evaluation
     */
    numericalGradient: (p: any, res: any, epsilon: any) => void;
    /**
     *  @abstract
     *  Get the Area object.
     *  Area objects do provide methods useful when rasterizing, raytracing or polygonizing
     *  the area (intersections with other areas, minimum level of detail needed to
     *  capture the feature nicely, etc etc...).
     *  @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>} The Areas object corresponding to the node/primitive, in an array
     */
    getAreas(): never[];
    /**
     *  @abstract
     *  This function is called when a point is outside of the potential influence of a primitive/node.
     *  @param {THREE.Vector3} _p
     *  @return {number} The next step length to do with respect to this primitive/node
     */
    distanceTo(_p: any): void;
    /**
     *  @abstract
     *  This function is called when a point is within the potential influence of a primitive/node.
     *  @return {number} The next step length to do with respect to this primitive/node.
     */
    heuristicStepWithin(): void;
    /**
     *  Trim the tree to keep only nodes influencing a given bounding box.
     *  The tree must be prepared for eval for this process to be working.
     *  Default behaviour is doing nothing, leaves cannot be sub-trimmed, only nodes.
     *  Note : only the root can untrim
     *
     *  @param {THREE.Box3} _aabb
     *  @param {Array.<Element>} _trimmed Array of trimmed Elements
     *  @param {Array.<Node>} _parents Array of fathers from which each trimmed element has been removed.
     */
    trim(_aabb: any, _trimmed: any, _parents: any): void;
    /**
     *  count the number of elements of class cls in this node and subnodes
     *  @param {Function} _cls the class of the elements we want to count
     *  @return {number} The number of element of class cls
     */
    count(_cls: any): number;
    destroy(): void;
}
//# sourceMappingURL=Element.d.ts.map
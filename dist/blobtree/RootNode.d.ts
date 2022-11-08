export = RootNode;
/** @typedef {import('./Element')} Element */
/** @typedef {import('./Node')} Node */
/** @typedef {import('./Material')} Material */
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./RicciNode').RicciNodeJSON} RicciNodeJSON */
/**
 * @typedef {{iso:number} & RicciNodeJSON} RootNodeJSON
 */
/**
 * @typedef {Object} IntersectionResult The result of the intersection
 * @property {number=} distance distance from ray.origin to intersection point,
 * @property {THREE.Vector3} point: intersection point,
 * @property {THREE.Vector3} g: gradient at intersection, if required.
 */
/**
 *  The root of any implicit blobtree. Does behave computationaly like a RicciNode with n = 64.
 *  The RootNode is the only node to be its own parent.
 *  @constructor
 *  @extends RicciNode
 */
declare class RootNode extends RicciNode {
    /**
     * @param {RootNodeJSON} json
     * @returns {RootNode}
     */
    static fromJSON(json: RootNodeJSON): RootNode;
    constructor();
    /** @type {number} */
    iso_value: number;
    /** @type {Array<Element>} */
    trimmed: Array<Element>;
    /** @type {Array<Node>} */
    trim_parents: Array<Node>;
    /**
     * @link RicciNode.toJSON
     * @returns {RootNodeJSON}
     */
    toJSON(): RootNodeJSON;
    /**
     * @returns {number}
     */
    getIsoValue(): number;
    /**
     * @param {number} v
     */
    setIsoValue(v: number): void;
    /**
     *  @return {number} The neutral value of this tree, ie the value of the field in empty region of space.
     *                   This is an API for external use and future development. For now it is hard set to 0.
     */
    getNeutralValue(): number;
    /**
     *  Basically perform a trim but keep track of trimmed elements.
     *  This is usefull if you want to trim, then untrim, then trim, etc...
     *  For example, this is very useful for evaluation optim
     *  @param {THREE.Box3} aabb
     */
    internalTrim(aabb: THREE.Box3): void;
    /**
     *  Wrapper for trim, will help programmers to make the difference between
     *  internal and external trim.
     *  @param {THREE.Box3} aabb
     *  @param {Array.<Element>} trimmed Array of trimmed Elements
     *  @param {Array.<Node>} parents Array of fathers from which each trimmed element has been removed.
     */
    externalTrim(aabb: THREE.Box3, trimmed: Array<Element>, parents: Array<Node>): void;
    /**
     *  Reset the full blobtree
     */
    internalUntrim(): void;
    /**
     *  Reset the full blobtree given previous trimming data.
     *  Note : don't forget to recall prepareForEval if you want to perform evaluation.
     *  @param {Array.<Element>} trimmed Array of trimmed Elements
     *  @param {Array.<Node>} parents Array of fathers from which each trimmed element has been removed.
     */
    untrim(trimmed: Array<Element>, parents: Array<Node>): void;
    /**
     *  Tell if the blobtree is empty
     *  @return true if blobtree is empty
     */
    isEmpty: () => boolean;
    intersectRayBlob: (this: RootNode, ray: THREE.Ray, res: IntersectionResult, maxDistance: number, _precision: number) => boolean;
    /**
     *  Kaiser function for some intersection and raycasting...
     *  Undocumented.
     *  TODO : check, it is probably an optimized intersection for blob intersection
     *         in X, Y or Z directions.
     */
    intersectOrthoRayBlob: (this: RootNode, wOffset: number, hOffset: number, res: Array<IntersectionResult>, dim: any) => void;
}
declare namespace RootNode {
    export { Element, Node, Material, Json, ValueResultType, RicciNodeJSON, RootNodeJSON, IntersectionResult };
}
import RicciNode = require("./RicciNode.js");
type Element = import('./Element');
type Node = import('./Node');
type RootNodeJSON = {
    iso: number;
} & RicciNodeJSON;
import THREE = require("three");
/**
 * The result of the intersection
 */
type IntersectionResult = {
    /**
     * distance from ray.origin to intersection point,
     */
    distance?: number | undefined;
    /**
     * : intersection point,
     */
    point: THREE.Vector3;
    /**
     * : gradient at intersection, if required.
     */
    g: THREE.Vector3;
};
type Material = import('./Material');
type Json = import('./Element.js').Json;
type ValueResultType = import('./Element.js').ValueResultType;
type RicciNodeJSON = import('./RicciNode').RicciNodeJSON;
//# sourceMappingURL=RootNode.d.ts.map
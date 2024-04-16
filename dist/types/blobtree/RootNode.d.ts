import { RicciNode } from "./RicciNode.js";
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
export declare class RootNode extends RicciNode {
    static type: string;
    /**
     * @param {RootNodeJSON} json
     * @returns {RootNode}
     */
    static fromJSON(json: any): RootNode;
    constructor();
    /**
     * @link Node.getType
     * @returns {string}
     */
    getType(): string;
    /**
     * @link RicciNode.toJSON
     * @returns {RootNodeJSON}
     */
    toJSON(): {
        iso: any;
        ricci_n: any;
        children: never[];
        type: string;
    };
    /**
     * @returns {number}
     */
    getIsoValue(): any;
    /**
     * @param {number} v
     */
    setIsoValue(v: any): void;
    /**
     *  @return {number} The neutral value of this tree, ie the value of the field in empty region of space.
     *                   This is an API for external use and future development. For now it is hard set to 0.
     */
    getNeutralValue(): number;
    /**
     * @link Node.invalidAABB for a complete description
     */
    invalidAABB(): void;
    /**
     *  Basically perform a trim but keep track of trimmed elements.
     *  This is usefull if you want to trim, then untrim, then trim, etc...
     *  For example, this is very useful for evaluation optim
     *  @param {THREE.Box3} aabb
     */
    internalTrim(aabb: any): void;
    /**
     *  Wrapper for trim, will help programmers to make the difference between
     *  internal and external trim.
     *  @param {THREE.Box3} aabb
     *  @param {Array.<Element>} trimmed Array of trimmed Elements
     *  @param {Array.<Node>} parents Array of fathers from which each trimmed element has been removed.
     */
    externalTrim(aabb: any, trimmed: any, parents: any): void;
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
    untrim(trimmed: any, parents: any): void;
    /**
     *  Tell if the blobtree is empty
     *  @return true if blobtree is empty
     */
    isEmpty: () => boolean;
    intersectRayBlob: (ray: any, res: any, maxDistance: any, _precision: any) => boolean;
    /**
     *  Kaiser function for some intersection and raycasting...
     *  Undocumented.
     *  TODO : check, it is probably an optimized intersection for blob intersection
     *         in X, Y or Z directions.
     */
    intersectOrthoRayBlob: (wOffset: any, hOffset: any, res: any, dim: any) => void;
}
//# sourceMappingURL=RootNode.d.ts.map
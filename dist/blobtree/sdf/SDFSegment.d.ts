export = SDFSegment;
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./SDFPrimitive').SDFPrimitiveJSON} SDFPrimitiveJSON */
/**
 * @typedef {{p1:{x:number,y:number,z:number},p2:{x:number,y:number,z:number}, acc:number} & SDFPrimitiveJSON} SDFSegmentJSON
 */
/**
 *
 *  @constructor
 *  @extends SDFPrimitive
 *
 *  @param {THREE.Vector3} p1 Position of the first segment extremity
 *  @param {THREE.Vector3} p2 Position of the second segment extremity
 *  @param {number} acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
 */
declare class SDFSegment extends SDFPrimitive {
    /**
     * @param {SDFSegmentJSON} json
     * @returns SDFSegment
     */
    static fromJSON(json: SDFSegmentJSON): import("./SDFSegment.js");
    /**
     *
     * @param {THREE.Vector3} p1
     * @param {THREE.Vector3} p2
     * @param {number} acc
     */
    constructor(p1: THREE.Vector3, p2: THREE.Vector3, acc: number);
    p1: THREE.Vector3;
    p2: THREE.Vector3;
    acc: number;
    /** @type {THREE.Line3} */
    l: THREE.Line3;
    /**
     *
     * @returns {SDFSegmentJSON}
     */
    toJSON(): SDFSegmentJSON;
    /**
     *  @param {number} acc The new accuracy factor
     */
    setAccuracy(acc: number): void;
    /**
     *  @return {number} Current accuracy factor
     */
    getAccuracy(): number;
    /**
     *  @param {THREE.Vector3} p1 The new position of the first segment point.
     */
    setPosition1(p1: THREE.Vector3): void;
    /**
     *  @param {THREE.Vector3} p2 The new position of the second segment point
     */
    setPosition2(p2: THREE.Vector3): void;
    /**
     *  @return {THREE.Vector3} Current position of the first segment point
     */
    getPosition1(): THREE.Vector3;
    /**
     *  @return {THREE.Vector3} Current position of the second segment point
     */
    getPosition2(): THREE.Vector3;
    computeDistanceAABB(d: any): THREE.Box3;
    /**
     * @param {number} d
     * @return {Object} The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d: number): any;
}
declare namespace SDFSegment {
    export { Json, ValueResultType, SDFPrimitiveJSON, SDFSegmentJSON };
}
import SDFPrimitive = require("./SDFPrimitive.js");
import THREE = require("three");
type SDFSegmentJSON = {
    p1: {
        x: number;
        y: number;
        z: number;
    };
    p2: {
        x: number;
        y: number;
        z: number;
    };
    acc: number;
} & SDFPrimitiveJSON;
type Json = import('../Element.js').Json;
type ValueResultType = import('../Element.js').ValueResultType;
type SDFPrimitiveJSON = import('./SDFPrimitive').SDFPrimitiveJSON;
//# sourceMappingURL=SDFSegment.d.ts.map
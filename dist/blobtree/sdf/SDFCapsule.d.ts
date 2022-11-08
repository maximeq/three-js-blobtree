export = SDFCapsule;
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./SDFPrimitive').SDFPrimitiveJSON} SDFPrimitiveJSON */
/**
 * @typedef {{p1:{x:number,y:number,z:number},r1:number,p2:{x:number,y:number,z:number},r2:number} & SDFPrimitiveJSON} SDFCapsuleJSON
 */
/**
 *  This primitive implements a distance field to an extanded "capsule geometry", which is actually a weighted segment.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @constructor
 *  @extends SDFPrimitive
 *
 */
declare class SDFCapsule extends SDFPrimitive {
    /**
     * @param {SDFCapsuleJSON} json
     * @returns {SDFCapsule}
     */
    static fromJSON(json: SDFCapsuleJSON): SDFCapsule;
    /**
     *
     *  @param {THREE.Vector3} p1 Position of the first segment extremity
     *  @param {THREE.Vector3} p2 Position of the second segment extremity
     *  @param {number} r1 Radius of the sphere centered in p1
     *  @param {number} r2 Radius of the sphere centered in p2
     */
    constructor(p1: THREE.Vector3, p2: THREE.Vector3, r1: number, r2: number);
    p1: THREE.Vector3;
    p2: THREE.Vector3;
    r1: number;
    r2: number;
    rdiff: number;
    unit_dir: THREE.Vector3;
    lengthSq: number;
    length: number;
    /**
     * @returns {SDFCapsuleJSON}
     */
    toJSON(): SDFCapsuleJSON;
    /**
     *  @param {number} r1 The new radius at p1
     */
    setRadius1(r1: number): void;
    /**
     *  @param {number} r2 The new radius at p2
     */
    setRadius2(r2: number): void;
    /**
     *  @return {number} Current radius at p1
     */
    getRadius1(): number;
    /**
     *  @return {number} Current radius at p2
     */
    getRadius2(): number;
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
declare namespace SDFCapsule {
    export { Json, ValueResultType, SDFPrimitiveJSON, SDFCapsuleJSON };
}
import SDFPrimitive = require("./SDFPrimitive.js");
import THREE = require("three");
type SDFCapsuleJSON = {
    p1: {
        x: number;
        y: number;
        z: number;
    };
    r1: number;
    p2: {
        x: number;
        y: number;
        z: number;
    };
    r2: number;
} & SDFPrimitiveJSON;
type Json = import('../Element.js').Json;
type ValueResultType = import('../Element.js').ValueResultType;
type SDFPrimitiveJSON = import('./SDFPrimitive').SDFPrimitiveJSON;
//# sourceMappingURL=SDFCapsule.d.ts.map
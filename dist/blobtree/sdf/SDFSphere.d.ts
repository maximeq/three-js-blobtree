export = SDFSphere;
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./SDFPrimitive').SDFPrimitiveJSON} SDFPrimitiveJSON */
/**
 * @typedef {{p:{x:number,y:number,z:number}, r:number} & SDFPrimitiveJSON} SDFSphereJSON
 */
/**
 *  @constructor
 *  @extends SDFPrimitive
 *
 *  @param {THREE.Vector3} p Position (ie center) of the sphere
 *  @param {number} r Radius of the sphere
 */
declare class SDFSphere extends SDFPrimitive {
    /**
     * @param {SDFSphereJSON} json
     * @returns
     */
    static fromJSON(json: SDFSphereJSON): import("./SDFSphere.js");
    /**
     *
     * @param {THREE.Vector3} p
     * @param {number} r The radius of the sphere
     */
    constructor(p: THREE.Vector3, r: number);
    p: THREE.Vector3;
    r: number;
    /**
     *
     * @returns {SDFSphereJSON}
     */
    toJSON(): SDFSphereJSON;
    /**
     *  @param {number} r The new radius
     */
    setRadius(r: number): void;
    /**
     *  @return {number} Current radius
     */
    getRadius(): number;
    /**
     *  @param {THREE.Vector3} p The new position (ie center)
     */
    setPosition(p: THREE.Vector3): void;
    /**
     *  @return {THREE.Vector3} Current position (ie center)
     */
    getPosition(): THREE.Vector3;
    computeDistanceAABB(d: any): THREE.Box3;
    /**
     * @param {number} d
     * @return {Object} The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d: number): any;
}
declare namespace SDFSphere {
    export { Json, ValueResultType, SDFPrimitiveJSON, SDFSphereJSON };
}
import SDFPrimitive = require("./SDFPrimitive.js");
import THREE = require("three");
type SDFSphereJSON = {
    p: {
        x: number;
        y: number;
        z: number;
    };
    r: number;
} & SDFPrimitiveJSON;
type Json = import('../Element.js').Json;
type ValueResultType = import('../Element.js').ValueResultType;
type SDFPrimitiveJSON = import('./SDFPrimitive').SDFPrimitiveJSON;
//# sourceMappingURL=SDFSphere.d.ts.map
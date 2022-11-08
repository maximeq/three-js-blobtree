export = SDFPoint;
/** @typedef {import('../areas/Area')} Area */
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./SDFPrimitive').SDFPrimitiveJSON} SDFPrimitiveJSON */
/**
 * @typedef {{p:{x:number,y:number,z:number},acc:number} & SDFPrimitiveJSON} SDFPointJSON
 */
/**
 *  @constructor
 *  @extends SDFPrimitive
 *s
 */
declare class SDFPoint extends SDFPrimitive {
    /**
     * @param {SDFPointJSON} json
     * @returns {SDFPoint}
     */
    static fromJSON(json: SDFPointJSON): SDFPoint;
    /**
     *
     *  @param {THREE.Vector3} p Position (ie center) of the point
     *  @param {number} acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
     */
    constructor(p: THREE.Vector3, acc: number);
    p: THREE.Vector3;
    acc: number;
    /**
     * @returns {SDFPointJSON}
     */
    toJSON(): SDFPointJSON;
    /**
     *  @param {number} acc The new accuracy factor
     */
    setAccuracy(acc: number): void;
    /**
     *  @return {number} Current accuracy factor
     */
    getAccuracy(): number;
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
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value: (p: any, res: any) => void;
}
declare namespace SDFPoint {
    export { Area, Json, ValueResultType, SDFPrimitiveJSON, SDFPointJSON };
}
import SDFPrimitive = require("./SDFPrimitive.js");
import THREE = require("three");
type SDFPointJSON = {
    p: {
        x: number;
        y: number;
        z: number;
    };
    acc: number;
} & SDFPrimitiveJSON;
type Area = import('../areas/Area');
type Json = import('../Element.js').Json;
type ValueResultType = import('../Element.js').ValueResultType;
type SDFPrimitiveJSON = import('./SDFPrimitive').SDFPrimitiveJSON;
//# sourceMappingURL=SDFPoint.d.ts.map
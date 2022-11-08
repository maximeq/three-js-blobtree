export = SDFNode;
/** @typedef {import('../areas/Area')} Area */
/** @typedef {import('./SDFPrimitive')} SDFPrimitive */
/** @typedef {import('../Node').NodeJSON} NodeJSON */
/** @typedef {NodeJSON} SDFNodeJSON */
/**
 *  This class implements an abstract Node class for Signed Distance Field.
 *  The considered primtive is at distance = 0.
 *  Convention is : negative value inside the surface, positive value outside.
 *  @constructor
 *  @extends {Node}
 */
declare class SDFNode extends Node {
    /** @type {Array<SDFNode|SDFPrimitive>} */
    children: Array<SDFNode | SDFPrimitive>;
    /**
     *  Return the bounding box of the node for a given maximum distance.
     *  Ie, the distance field is greater than d everywhere outside the returned box.
     *  @abstract
     *  @param {number} d Distance
     *  @return {THREE.Box3}
     *
     */
    computeDistanceAABB(d: number): THREE.Box3;
    /**
     *
     * @param {SDFNode | SDFPrimitive} c
     */
    addChild(c: SDFNode | SDFPrimitive): this;
    /**
     *  SDF Field are infinite, so Areas do not make sens except for the SDFRoot, which will
     *  usually apply a compact kernel to the distance field.
     *  @abstract
     *  @return {Object}
     */
    getAreas(): any;
    /**
     * @param {number} d Distance to consider for the area computation.
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:SDFPrimitive}>}
     */
    getDistanceAreas(d: number): Array<{
        aabb: THREE.Box3;
        bv: Area;
        obj: SDFPrimitive;
    }>;
}
declare namespace SDFNode {
    export { Area, SDFPrimitive, NodeJSON, SDFNodeJSON };
}
import Node = require("../Node.js");
type SDFPrimitive = import('./SDFPrimitive');
import THREE = require("three");
type Area = import('../areas/Area');
type NodeJSON = import('../Node').NodeJSON;
type SDFNodeJSON = NodeJSON;
//# sourceMappingURL=SDFNode.d.ts.map
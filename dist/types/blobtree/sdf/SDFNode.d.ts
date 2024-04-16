import * as THREE from "three";
import { Node } from '../Node';
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
export declare class SDFNode extends Node {
    static type: string;
    constructor();
    getType(): string;
    computeAABB(): void;
    /**
     *  Return the bounding box of the node for a given maximum distance.
     *  Ie, the distance field is greater than d everywhere outside the returned box.
     *  @abstract
     *  @param {number} d Distance
     *  @return {THREE.Box3}
     *
     */
    computeDistanceAABB(d: any): THREE.Box3;
    /**
     *
     * @param {SDFNode | SDFPrimitive} c
     */
    addChild(c: any): this;
    /**
     *  SDF Field are infinite, so Areas do not make sens except for the SDFRoot, which will
     *  usually apply a compact kernel to the distance field.
     *  @abstract
     *  @return {Object}
     */
    getAreas(): void;
    /**
     * @param {number} d Distance to consider for the area computation.
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:SDFPrimitive}>}
     */
    getDistanceAreas(d: any): any[];
    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     * @param {THREE.Vector3} _p Point
     * @return {number}
     */
    distanceTo(_p: any): void;
    /**
     * @abstract
     * @return {number}
     */
    heuristicStepWithin(): void;
}
//# sourceMappingURL=SDFNode.d.ts.map
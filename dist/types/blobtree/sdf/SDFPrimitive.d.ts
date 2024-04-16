import * as THREE from "three";
import { Element } from "../Element";
/** @typedef {import('../areas/Area')} Area */
/** @typedef {import('../Element').ElementJSON} ElementJSON */
/** @typedef {import('../Primitive')} Primitive */
/**
 * @typedef {ElementJSON} SDFPrimitiveJSON
 */
/**
 *  This class implements an abstract primitve class for signed distance field.
 *  SDFPrimitive subclasses must define a scalar field being the distance to a geometry.
 *  @constructor
 *  @extends {Element}
 */
export declare class SDFPrimitive extends Element {
    static type: string;
    constructor();
    /**
     * @return {string} Type of the element
     */
    getType(): string;
    /**
     * @link Element.computeAABB for a completve description.
     */
    computeAABB(): void;
    /**
     * Return the bounding box of the node for a given maximum distance.
     * Ie, the distance field is greater than d everywhere outside the returned box.
     * @param {number} _d Distance
     * @abstract
     * @return {THREE.Box3}
     */
    computeDistanceAABB(_d: any): THREE.Box3;
    /**
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas(): void;
    /**
     * @param {number} _d Distance to consider for the area computation.
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:SDFPrimitive}>}
     */
    getDistanceAreas(_d: any): never[];
    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     *
     * @param {THREE.Vector3} p
     */
    distanceTo: (p: any) => number;
    /**
     * @link see Element.heuristicStepWithin for a det
     */
    heuristicStepWithin(): number;
}
//# sourceMappingURL=SDFPrimitive.d.ts.map
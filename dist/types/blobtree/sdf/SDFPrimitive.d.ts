import { Vector3, Box3 } from "three";
import { Element, type ElementJSON } from "../Element";
import type { Area } from '../areas/Area';
import type { Primitive } from '../Primitive';
export type SDFPrimitiveJSON = ElementJSON;
export type SDFPointType = "SDFPoint";
export type SDFCapsuleType = "SDFCapsule";
export type SDFSegmentType = "SDFSegment";
export type SDFSphereType = "SDFSphere";
export type SDFPrimitiveType = "SDFPrimitive" | SDFPointType | SDFCapsuleType | SDFSegmentType | SDFSphereType;
/**
 *  This class implements an abstract primitive class for signed distance field.
 *  SDFPrimitive subclasses must define a scalar field being the distance to a geometry.
 *  @constructor
 *  @extends {Element}
 */
export declare abstract class SDFPrimitive extends Element {
    static type: SDFPrimitiveType;
    constructor();
    /**
     * @return Type of the element
     */
    getType(): SDFPrimitiveType;
    /**
     * @link Element.computeAABB for a complete description.
     */
    computeAABB(): void;
    /**
     * Return the bounding box of the node for a given maximum distance.
     * Ie, the distance field is greater than d everywhere outside the returned box.
     * @param d Distance
     * @abstract
     */
    abstract computeDistanceAABB(d: number): Box3;
    getAreas(): {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     * @param d Distance to consider for the area computation.
     */
    abstract getDistanceAreas(d: number): {
        aabb: Box3;
        bv: Area;
        obj: SDFPrimitive;
    }[];
    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     *
     * @param p
     */
    distanceTo: (this: SDFPrimitive, p: Vector3) => number;
    /**
     * @link see Element.heuristicStepWithin for a complete description.
     */
    heuristicStepWithin(): number;
    destroy(): void;
}
//# sourceMappingURL=SDFPrimitive.d.ts.map
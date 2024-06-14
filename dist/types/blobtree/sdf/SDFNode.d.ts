import { Vector3, Box3 } from "three";
import { Node, type NodeJSON } from '../Node';
import type { Area } from '../areas/Area';
import type { SDFPrimitive } from './SDFPrimitive';
import type { Primitive } from '../Primitive';
export type SDFNodeJSON = NodeJSON;
/**
 *  This class implements an abstract Node class for Signed Distance Field.
 *  The considered primitive is at distance = 0.
 *  Convention is : negative value inside the surface, positive value outside.
 *  @constructor
 *  @extends {Node}
 */
export declare class SDFNode extends Node {
    static type: string;
    children: (SDFNode | SDFPrimitive)[];
    constructor();
    overridegetType(): string;
    computeAABB(): void;
    /**
     *  Return the bounding box of the node for a given maximum distance.
     *  Ie, the distance field is greater than d everywhere outside the returned box.
     *  @abstract
     *  @param d Distance
     */
    computeDistanceAABB(d: number): Box3;
    addChild(c: SDFNode | SDFPrimitive): this;
    /**
     *  SDF Field are infinite, so Areas do not make sense except for the SDFRoot, which will
     *  usually apply a compact kernel to the distance field.
     *  @abstract
     */
    getAreas(): {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     * @param d Distance to consider for the area computation.
     */
    getDistanceAreas(d: number): {
        aabb: Box3;
        bv: Area;
        obj: SDFPrimitive;
    }[];
    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     * @param _p Point
     */
    distanceTo(_p: Vector3): number;
    heuristicStepWithin(): number;
}
//# sourceMappingURL=SDFNode.d.ts.map
import { Vector3, Box3 } from "three";
import { Node, type NodeJSON, type SDFNodeType } from '../Node';
import type { Area } from '../areas/Area';
import type { SDFPrimitive } from './SDFPrimitive';
import type { Primitive } from '../Primitive';
import type { ValueResultType } from '../Element';
export type SDFNodeJSON = NodeJSON;
/**
 *  This class implements an abstract Node class for Signed Distance Field.
 *  The considered primitive is at distance = 0.
 *  Convention is : negative value inside the surface, positive value outside.
 *  @constructor
 *  @extends {Node}
 */
export declare class SDFNode extends Node {
    static type: SDFNodeType;
    children: (SDFNode | SDFPrimitive)[];
    constructor();
    getType(): SDFNodeType;
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
    prepareForEval(): void;
    value(_p: Vector3, _res: ValueResultType): void;
}
//# sourceMappingURL=SDFNode.d.ts.map
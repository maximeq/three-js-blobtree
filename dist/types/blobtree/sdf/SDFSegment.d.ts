import { Vector3, Line3, Box3 } from "three";
import { SDFPrimitive, type SDFPrimitiveJSON } from "./SDFPrimitive.js";
import { AreaCapsule } from "../areas/AreaCapsule.js";
import type { ValueResultType } from "../Element.js";
export type SDFSegmentJSON = {
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
export declare class SDFSegment extends SDFPrimitive {
    static type: string;
    static fromJSON(json: SDFSegmentJSON): SDFSegment;
    p1: Vector3;
    p2: Vector3;
    acc: number;
    l: Line3;
    /**
    *  @param p1 Position of the first segment extremity
    *  @param p2 Position of the second segment extremity
    *  @param acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
    */
    constructor(p1: Vector3, p2: Vector3, acc: number);
    getType(): string;
    toJSON(): SDFSegmentJSON;
    /**
     *  @param acc The new accuracy factor
     */
    setAccuracy(acc: number): void;
    /**
     *  @return Current accuracy factor
     */
    getAccuracy(): number;
    /**
     *  @param  p1 The new position of the first segment point.
     */
    setPosition1(p1: Vector3): void;
    /**
     *  @param p2 The new position of the second segment point
     */
    setPosition2(p2: Vector3): void;
    /**
     *  @return {Vector3} Current position of the first segment point
     */
    getPosition1(): Vector3;
    /**
     *  @return {Vector3} Current position of the second segment point
     */
    getPosition2(): Vector3;
    computeDistanceAABB(d: number): Box3;
    prepareForEval(): void;
    /**
     * @param {number} d
     * @return {Object} The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d: number): {
        aabb: Box3;
        bv: AreaCapsule;
        obj: SDFSegment;
    }[];
    /**
     *  @link Element.value for a complete description
     */
    value: (p: Vector3, res: ValueResultType) => void;
}
//# sourceMappingURL=SDFSegment.d.ts.map
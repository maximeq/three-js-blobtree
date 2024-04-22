import { Vector3, Box3 } from "three";
import { SDFPrimitive, type SDFPrimitiveJSON } from "./SDFPrimitive";
import { AreaCapsule } from "../areas/AreaCapsule";
import type { ValueResultType } from "../Element";
export type SDFCapsuleJSON = {
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
/**
 *  This primitive implements a distance field to an extanded "capsule geometry", which is actually a weighted segment.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @constructor
 *  @extends SDFPrimitive
 *
 */
export declare class SDFCapsule extends SDFPrimitive {
    static type: "SDFCapsule";
    static fromJSON(json: SDFCapsuleJSON): SDFCapsule;
    p1: Vector3;
    p2: Vector3;
    r1: number;
    r2: number;
    rdiff: number;
    unit_dir: Vector3;
    lengthSq: number;
    length: number;
    /**
     *
     *  @param {Vector3} p1 Position of the first segment extremity
     *  @param {Vector3} p2 Position of the second segment extremity
     *  @param {number} r1 Radius of the sphere centered in p1
     *  @param {number} r2 Radius of the sphere centered in p2
     */
    constructor(p1: Vector3, p2: Vector3, r1: number, r2: number);
    /**
     *  @return  Type of the element
     */
    getType(): "SDFCapsule";
    toJSON(): SDFCapsuleJSON;
    /**
     *  @param r1 The new radius at p1
     */
    setRadius1(r1: number): void;
    /**
     *  @param r2 The new radius at p2
     */
    setRadius2(r2: number): void;
    /**
     *  @return Current radius at p1
     */
    getRadius1(): number;
    /**
     *  @return Current radius at p2
     */
    getRadius2(): number;
    /**
     *  @param p1 The new position of the first segment point.
     */
    setPosition1(p1: Vector3): void;
    /**
     *  @param p2 The new position of the second segment point
     */
    setPosition2(p2: Vector3): void;
    /**
     *  @return Current position of the first segment point
     */
    getPosition1(): Vector3;
    /**
     *  @return Current position of the second segment point
     */
    getPosition2(): Vector3;
    computeDistanceAABB(d: number): Box3;
    /**
     * @link Element.prepareForEval for a complete description
     */
    prepareForEval(): void;
    /**
     * @param  d
     * @return The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d: number): {
        aabb: Box3;
        bv: AreaCapsule;
        obj: SDFCapsule;
    }[];
    /**
     *  @link Element.value for a complete description
     */
    value: (p: Vector3, res: ValueResultType) => void;
}
//# sourceMappingURL=SDFCapsule.d.ts.map
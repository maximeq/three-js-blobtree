import { Vector3, Box3 } from "three";
import { SDFPrimitive, type SDFPrimitiveJSON, type SDFPointType } from "./SDFPrimitive.js";
import type { Area } from "../areas/Area.js";
import type { ValueResultType } from "../Element.js";
export type SDFPointJSON = {
    p: {
        x: number;
        y: number;
        z: number;
    };
    acc: number;
} & SDFPrimitiveJSON;
export declare class SDFPoint extends SDFPrimitive {
    static type: SDFPointType;
    static fromJSON(json: SDFPointJSON): SDFPoint;
    p: Vector3;
    acc: number;
    /**
     *  @param p Position (ie center) of the point
     *  @param acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
     */
    constructor(p: Vector3, acc?: number);
    getType(): SDFPointType;
    toJSON(): SDFPointJSON;
    /**
     *  @param acc The new accuracy factor
     */
    setAccuracy(acc: number): void;
    /**
     *  @return Current accuracy factor
     */
    getAccuracy(): number;
    /**
     *  @param p The new position (ie center)
     */
    setPosition(p: Vector3): void;
    /**
     *  @return Current position (ie center)
     */
    getPosition(): Vector3;
    /**
     *  @param d Distance
     */
    computeDistanceAABB(d: number): Box3;
    prepareForEval(): void;
    /**
     * @link SDFPrimitive.getDistanceAreas
     * @param d Distance to consider for the area computation.
     */
    getDistanceAreas(d: number): {
        aabb: Box3;
        bv: Area;
        obj: SDFPoint;
    }[];
    /**
     *  @link Element.value for a complete description
     */
    value: (this: SDFPoint, p: Vector3, res: ValueResultType) => void;
}
//# sourceMappingURL=SDFPoint.d.ts.map
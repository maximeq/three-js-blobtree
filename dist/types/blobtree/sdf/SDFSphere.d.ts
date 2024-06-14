import { Vector3, Box3 } from "three";
import { SDFPrimitive, type SDFPrimitiveJSON } from "./SDFPrimitive.js";
import { AreaSphere } from "../areas/AreaSphere.js";
import type { ValueResultType } from "../Element.js";
export type SDFSphereJSON = {
    p: {
        x: number;
        y: number;
        z: number;
    };
    r: number;
} & SDFPrimitiveJSON;
export declare class SDFSphere extends SDFPrimitive {
    static type: string;
    static fromJSON(json: SDFSphereJSON): SDFSphere;
    p: Vector3;
    r: number;
    /**
     *  @param  p Position (ie center) of the sphere
     *  @param  r Radius of the sphere
     */
    constructor(p: Vector3, r: number);
    getType(): string;
    toJSON(): SDFSphereJSON;
    /**
     *  @param r The new radius
     */
    setRadius(r: number): void;
    /**
     *  @return Current radius
     */
    getRadius(): number;
    /**
     *  @param p The new position (ie center)
     */
    setPosition(p: Vector3): void;
    /**
     *  @return  Current position (ie center)
     */
    getPosition(): Vector3;
    computeDistanceAABB(d: number): Box3;
    prepareForEval(): void;
    /**
     * @return The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d: number): {
        aabb: Box3;
        bv: AreaSphere;
        obj: SDFSphere;
    }[];
    /**
     *  @link Element.value for a complete description
     */
    value: (this: SDFSphere, p: Vector3, res: ValueResultType) => void;
}
//# sourceMappingURL=SDFSphere.d.ts.map
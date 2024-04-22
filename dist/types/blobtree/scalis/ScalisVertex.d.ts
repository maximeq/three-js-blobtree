import { Vector3, Box3 } from "three";
import type { ScalisPrimitive } from "./ScalisPrimitive.js";
export type ScalisVertexJSON = {
    position: {
        x: number;
        y: number;
        z: number;
    };
    thickness: number;
};
/**
 *  A scalis ScalisVertex. Basically a point and a wanted thickness.
 */
export declare class ScalisVertex {
    static fromJSON(json: ScalisVertexJSON): ScalisVertex;
    pos: Vector3;
    thickness: number;
    id: number;
    prim: ScalisPrimitive | null;
    aabb: Box3;
    valid_aabb: boolean;
    /**
     *  @param  pos A position in space, as a Vector3
     *  @param  thickness Wanted thickness at this point. Misnamed parameter : this is actually half the thickness.
     */
    constructor(pos: Vector3, thickness: number);
    /**
     *  Set an internal pointer to the primitive using this vertex.
     *  Should be called from primitive constructor.
     * @param prim
     */
    setPrimitive(prim: ScalisPrimitive): void;
    toJSON(): ScalisVertexJSON;
    /**
     *  Set a new position.
     *  @param pos A position in space, as a Vector3
     */
    setPos(pos: Vector3): void;
    /**
     *  Set a new thickness
     *  @param thickness The new thickness
     */
    setThickness(thickness: number): void;
    /**
     *  Set a both position and thickness
     *  @param thickness The new thickness
     *  @param pos A position in space, as a Vector3
     */
    setAll(pos: Vector3, thickness: number): void;
    /**
     *  Get the current position
     *  @return Current position, as a Vector3
     */
    getPos(): Vector3;
    /**
     *  Get the current Thickness
     *  @return {number} Current Thickness
     */
    getThickness(): number;
    /**
     *  Get the current AxisAlignedBoundingBox
     *  @return The AABB of this vertex.
     */
    getAABB(): Box3;
    /**
     *  Compute the current AABB.
     *  @protected
     */
    computeAABB(): void;
    /**
     *  Check equality between 2 vertices
     */
    equals(other: ScalisVertex): boolean;
}
//# sourceMappingURL=ScalisVertex.d.ts.map
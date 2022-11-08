export = ScalisVertex;
/**
 *  A scalis ScalisVertex. Basically a point and a wanted thickness.
 */
declare class ScalisVertex {
    static fromJSON(json: any): import("./ScalisVertex.js");
    /**
     *  @param {!THREE.Vector3} pos A position in space, as a THREE.Vector3
     *  @param {number} thickness Wanted thickness at this point. Misnamed parameter : this is actually half the thickness.
     */
    constructor(pos: THREE.Vector3, thickness: number);
    pos: THREE.Vector3;
    thickness: number;
    id: number;
    prim: import("./ScalisPrimitive");
    aabb: THREE.Box3;
    valid_aabb: boolean;
    /**
     *  Set an internal pointer to the primitive using this vertex.
     *  Should be called from primitive constructor.
     * @param {ScalisPrimitive} prim
     */
    setPrimitive(prim: ScalisPrimitive): void;
    /**
     * @returns {ScalisVertexJSON}
     */
    toJSON(): ScalisVertexJSON;
    /**
     *  Set a new position.
     *  @param {!THREE.Vector3} pos A position in space, as a THREE.Vector3
     */
    setPos(pos: THREE.Vector3): void;
    /**
     *  Set a new thickness
     *  @param {number} thickness The new thickness
     */
    setThickness(thickness: number): void;
    /**
     *  Set a both position and thickness
     *  @param {number} thickness The new thickness
     *  @param {!THREE.Vector3} pos A position in space, as a THREE.Vector3
     */
    setAll(pos: THREE.Vector3, thickness: number): void;
    /**
     *  Get the current position
     *  @return {!THREE.Vector3} Current position, as a THREE.Vector3
     */
    getPos(): THREE.Vector3;
    /**
     *  Get the current Thickness
     *  @return {number} Current Thickness
     */
    getThickness(): number;
    /**
     *  Get the current AxisAlignedBoundingBox
     *  @return {THREE.Box3} The AABB of this vertex.
     */
    getAABB(): THREE.Box3;
    /**
     *  Compute the current AABB.
     *  @protected
     */
    protected computeAABB(): void;
    /**
     *  Check equality between 2 vertices
     *  @param {ScalisVertex} other
     *  @return {boolean}
     */
    equals(other: ScalisVertex): boolean;
}
declare namespace ScalisVertex {
    export { ScalisPrimitive, Json, ScalisVertexJSON };
}
import THREE = require("three");
type ScalisPrimitive = import('./ScalisPrimitive');
type ScalisVertexJSON = {
    position: {
        x: number;
        y: number;
        z: number;
    };
    thickness: number;
};
type Json = import('../Element.js').Json;
//# sourceMappingURL=ScalisVertex.d.ts.map
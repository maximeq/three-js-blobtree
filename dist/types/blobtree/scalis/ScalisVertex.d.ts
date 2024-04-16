/**
 *  A scalis ScalisVertex. Basically a point and a wanted thickness.
 */
export declare class ScalisVertex {
    static fromJSON(json: any): ScalisVertex;
    /**
     *  @param {!Vector3} pos A position in space, as a Vector3
     *  @param {number} thickness Wanted thickness at this point. Misnamed parameter : this is actually half the thickness.
     */
    constructor(pos: any, thickness: any);
    /**
     *  Set an internal pointer to the primitive using this vertex.
     *  Should be called from primitive constructor.
     * @param {ScalisPrimitive} prim
     */
    setPrimitive(prim: any): void;
    /**
     * @returns {ScalisVertexJSON}
     */
    toJSON(): {
        position: {
            x: any;
            y: any;
            z: any;
        };
        thickness: any;
    };
    /**
     *  Set a new position.
     *  @param {!Vector3} pos A position in space, as a Vector3
     */
    setPos(pos: any): void;
    /**
     *  Set a new thickness
     *  @param {number} thickness The new thickness
     */
    setThickness(thickness: any): void;
    /**
     *  Set a both position and thickness
     *  @param {number} thickness The new thickness
     *  @param {!Vector3} pos A position in space, as a Vector3
     */
    setAll(pos: any, thickness: any): void;
    /**
     *  Get the current position
     *  @return {!Vector3} Current position, as a Vector3
     */
    getPos(): any;
    /**
     *  Get the current Thickness
     *  @return {number} Current Thickness
     */
    getThickness(): any;
    /**
     *  Get the current AxisAlignedBoundingBox
     *  @return {Box3} The AABB of this vertex.
     */
    getAABB(): any;
    /**
     *  Compute the current AABB.
     *  @protected
     */
    computeAABB(): void;
    /**
     *  Check equality between 2 vertices
     *  @param {ScalisVertex} other
     *  @return {boolean}
     */
    equals(other: any): any;
}
//# sourceMappingURL=ScalisVertex.d.ts.map
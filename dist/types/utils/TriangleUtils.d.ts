import { Vector3 } from "three";
interface VertexLike {
    getPos: () => Vector3;
    getThickness: () => number;
}
export interface TriangleLike extends TriangleComputedAttributes {
    v: VertexLike[];
}
export interface TriangleComputedAttributes {
    p0p1?: Vector3;
    p1p2?: Vector3;
    p2p0?: Vector3;
    unit_p0p1?: Vector3;
    unit_p1p2?: Vector3;
    unit_p2p0?: Vector3;
    unit_normal?: Vector3;
    length_p0p1?: number;
    length_p1p2?: number;
    length_p2p0?: number;
    diffThick_p0p1?: number;
    diffThick_p1p2?: number;
    diffThick_p2p0?: number;
    ortho_dir?: Vector3;
    point_min?: Vector3;
    weight_min?: number;
    main_dir?: Vector3;
    point_iso_zero?: Vector3;
    proj_dir?: Vector3;
    equal_weights?: boolean;
    half_dir_1?: Vector3;
    point_half?: Vector3;
    half_dir_2?: Vector3;
    coord_max?: number;
    coord_middle?: number;
    unit_delta_weight?: number;
    longest_dir_special?: Vector3;
    max_seg_length?: number;
    unsigned_ortho_dir?: Vector3;
}
export interface TriangleLikeDeprecated {
    v: VertexLike[];
    p0p1: Vector3;
    p1p2: Vector3;
    p2p0: Vector3;
    unit_p0p1: Vector3;
    unit_p1p2: Vector3;
    unit_p2p0: Vector3;
    unit_normal: Vector3;
    main_dir: Vector3;
    ortho_dir: Vector3;
    length_p0p1?: number;
    length_p1p2?: number;
    length_p2p0?: number;
    diffThick_p0p1?: number;
    diffThick_p1p2?: number;
    diffThick_p2p0?: number;
    point_min?: Vector3;
    weight_min?: number;
    point_iso_zero?: Vector3;
    proj_dir?: Vector3;
    equal_weights?: boolean;
    half_dir_1?: Vector3;
    point_half?: Vector3;
    half_dir_2?: Vector3;
    coord_max?: number;
    coord_middle?: number;
    unit_delta_weight?: number;
    longest_dir_special?: Vector3;
    max_seg_length?: number;
    unsigned_ortho_dir?: Vector3;
}
export declare const TriangleUtils: {
    /**
     * intermediary functions used in computeVectorsDirs
     */
    cleanIndex(ind: number, lengthArray: number): number;
    /**
     * Updates the cached values of the triangle
     * @param triangle The triangles who's internal values need to be updated
     */
    updateComputedAttributes(triangle: TriangleLike): void;
    /**
     *  Compute some internal consts for triangle
     *  @param triangle The triangle to compute consts for (blobtree or skel)
     *  @deprecated Please use updateComputedAtrributes instead
     */
    computeVectorsDirs(triangle: TriangleLikeDeprecated): void;
    /**
     *  @param triangle
     *     u parametrisation of the point to compute along the axis V0->V1
     *     v parametrisation of the point to compute along the axis V0->V2
     *  @return An object with the computed pos and thickness
     */
    getParametrisedVertexAttr(triangle: TriangleLike, u: number, v: number): {
        pos: Vector3;
        thick: number;
    };
    /**
     *  @param triangle The concerned triangle
     *  @param u u coordinate
     *  @param v v coordinate
     */
    getMeanThick(triangle: TriangleLike, u: number, v: number): number;
    /**
     *  Get the triangle barycenter coordinates. The projection is non orthogonal.
     *  WTF is that? Barycentirc coordinates are 3 components, not 2 !
     *  @param p0p1 Vector from p0 to p1
     *  @param p2p0 Vector from p2 to p0
     *  @param p0 Point 0 in triangle
     *  @param p Point in space
     *
     *  @return {{u:number,v:number}} Coordinate of barycenter
     */
    getTriBaryCoord(p0p1: Vector3, p2p0: Vector3, p0: Vector3, p: Vector3): {
        u: number;
        v: number;
    };
    getUVCoord(U: Vector3, V: Vector3, p0: Vector3, p: Vector3): {
        u: number;
        v: number;
    };
};
export {};
//# sourceMappingURL=TriangleUtils.d.ts.map
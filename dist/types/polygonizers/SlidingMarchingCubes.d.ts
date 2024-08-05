import { Box2, Vector2, Vector3, Box3, BufferGeometry } from "three";
import { Material } from "../blobtree/Material.js";
import { RootNode } from '../blobtree/RootNode';
import { Area } from '../blobtree/areas/Area';
import { Primitive } from "../blobtree/Primitive";
export interface SMCParams {
    /**
     * Defines how the stepping in z occurs. Options are :
     * "adaptive" (default) steps are computed according to local minimum accuracy.
     * "uniform" steps are uniform along z, according to the global minimum accuracy.
     */
    zResolution?: string;
    /**
     * The blobtree defines some needed accuracies for polygonizing.
     * However, if you want more details, you can set this to less than 1.
     * Note that this is limited to 0.01, which will already increase your model complexity by a 10 000 factor.
     */
    detailRatio?: number;
    /**
     * Progress callback, taking a percentage as parameter.
     */
    progress?: (percent: number) => void;
    /**
     * Add newton convergence steps to position each vertex.
     */
    convergence?: ConvergenceParams;
    /**
     * NOT YET IMPLEMENTED Add dichotomy steps to position each vertex. Usually using convergence is better,
     * except if the implicit field is such that converging is not possible (for example, null gradients on large areas)
     */
    dichotomy?: number;
}
export interface ConvergenceParams {
    /**
     * A ratio of a the marching cube grid size defining the wanted geometrical accuracy.
     * Must be lower than 1, default is 0.01.
     */
    ratio?: number;
    /**
     * The newton process will stop either when the threshold of ratio*cube_size is matched,
     * or the number of steps allowed has been reached. Default is 10.
     */
    step?: number;
}
export interface VertexData {
    p: {
        x: number;
        y: number;
        z: number;
    };
    n: {
        x: number;
        y: number;
        z: number;
    };
    c: {
        r: number;
        g: number;
        b: number;
    };
    r: number;
    m: number;
}
export interface ResultingGeometry {
    position: number[];
    normal: number[];
    color: number[];
    metalness: number[];
    roughness: number[];
    nVertices: number;
    faces: number[];
    nFaces: number;
    addVertex: (data: VertexData) => void;
    addFace: (a: number, b: number, c: number) => void;
}
/**
 *  Axis Aligned Bounding Box in 2D carrying accuracy data
 *  @constructor
 *  @extends Box2
 */
declare class Box2Acc extends Box2 {
    nice_acc: number | null;
    raw_acc: number | null;
    /**
     *  @param min Minimum x,y coordinate of the box
     *  @param max Maximum x,y coordinate of the box
     *  @param nice_acc Nice accuracy in this box
     *  @param raw_acc Raw accuracy in this box
     */
    constructor(min?: Vector2, max?: Vector2, nice_acc?: number | null, raw_acc?: number | null);
    unionWithAcc(box: Box2Acc): void;
    getRawAcc(): number | null;
    getNiceAcc(): number | null;
    setRawAcc(raw_acc: number): void;
    setNiceAcc(nice_acc: number): void;
    toString(): string;
    setWithAcc(min_x: number, min_y: number, max_x: number, max_y: number, nice_acc: number, raw_acc: number): void;
    /**
     *  Get corner with the minimum coordinates
     */
    getMinCorner(): Vector2;
}
/**
 *  Class for a dual marching cube using 2 sliding arrays.

 *  @constructor
 */
export declare class SlidingMarchingCubes {
    blobtree: RootNode;
    uniformZ: boolean;
    detail_ratio: number;
    convergence: {
        ratio: number;
        step: number;
    } | null;
    progress: (percent: number) => void;
    reso: Int32Array;
    steps: {
        x: Float32Array | null;
        y: Float32Array | null;
        z: Float32Array | null;
    };
    curr_steps: {
        x: number;
        y: number;
        z: number;
    };
    curr_step_vol: number;
    values_xy: [Float32Array | null, Float32Array | null];
    vertices_xy: [Int32Array | null, Int32Array | null];
    areas: {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    min_acc: number;
    values: number[];
    x: number;
    y: number;
    z: number;
    mask: number;
    edge_cross: boolean[];
    vertex: Vector3;
    vertex_n: Vector3;
    vertex_m: Material;
    extended: boolean;
    dis_o_aabb: Box3;
    ext_p: Vector3;
    geometry: ResultingGeometry | null;
    minCurvOrient: boolean;
    _isMinCurvatureTriangulation: (v1: number, v2: number, v3: number, v4: number) => boolean;
    /**
     *  @param blobtree A blobtree to polygonize.
     *  @param smcParams Parameters and option for this polygonizer
     */
    constructor(blobtree: RootNode, smcParams: SMCParams);
    /**
     *  Initialize the internal Geometry structure.
     *  @private
     */
    initGeometry(): void;
    /**
     *  Build the resulting BufferGeometry from current values in this.geometry.
     *  used in compute function.
     *  @private
     */
    buildResultingBufferGeometry(): BufferGeometry;
    /**
     *  Set values in this.values_xy[1] to 0
     *  @private
     */
    setFrontToZero(): void;
    /**
     *  Set values in this.values_xy[1] to -1.
     *  -1 is a marker to state the value has not been computed nor interpolated
     *  @private
     */
    setFrontToMinus(): void;
    /**
     *  Set values in this.values_xy[1] to 0 wherever it is -1.
     *  @private
     */
    setFrontToZeroIfMinus(): void;
    /**
     *  Perform bilinear interpolation in a given 2D box to set values in front array
     *
     *  @param cx Coordinate x of bottom left corner of the front array
     *  @param cy Coordinate x of bottom left corner of the front array
     *  @param cz Coordinate x of bottom left corner of the front array
     *
     *  @param x0 Lower x box osition in the array
     *  @param x1 Upper x box position in the array
     *  @param y0 Lower y box position in the array
     *  @param y1 Upper y box position in the array
     *
     *  @private
     */
    interpolateInBox(_cx: number, _cy: number, _cz: number, x0: number, x1: number, y0: number, y1: number): void;
    /**
     *  Compute blobtree value at a given position in the front sliding array.
     *
     *  @param cx Coordinate x of bottom left corner of the front array
     *  @param cy Coordinate x of bottom left corner of the front array
     *  @param cz Coordinate x of bottom left corner of the front array
     *
     *  @param x X position in the array
     *  @param y Y position in the array
     *
     *  @private
     */
    computeFrontValAt(cx: number, cy: number, cz: number, x: number, y: number): void;
    /**
     *  Function using closure to have static variable. Wrapped in computeFrontValAt
     *  for profiling purpose.
     */
    computeFrontValAtClosure: (this: SlidingMarchingCubes, cx: number, cy: number, cz: number, x: number, y: number) => void;
    /**
     *  Compute corner values in the front buffer in 2D box defined by min,max
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     *  @param min 2D box min
     *  @param max 2D box max
     */
    computeFrontValAtBoxCorners(cx: number, cy: number, cz: number, min: Vector2, max: Vector2): void;
    /**
     *  Compute all values in the front buffer in 2D box defined by min,max
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     *  @param min 2D box min
     *  @param max 2D box max
     */
    computeFrontValInBox(cx: number, cy: number, cz: number, min: Vector2, max: Vector2): void;
    /**
     *  Set all values in 2D box min,max at 0.
     *  @param min 2D box min
     *  @param max 2D box max
     */
    setFrontValZeroInBox(min: Vector2, max: Vector2): void;
    /**
     *  Compute 2D mask of a given 2D box. Mask is an hex integer unique for each
     *  combination of iso value crossing (like in 3D marching cubes, but in 2D).
     *  @param min 2D box min
     *  @param max 2D box max
     *  @return The mask
     */
    computeBoxMask(min: Vector2, max: Vector2): number;
    /**
     *  Return 0 if and only if all coners value of 2D box min,max are 0
     *  @param min 2D box min
     *  @param max 2D box max
     */
    checkZeroBox(min: Vector2, max: Vector2): number;
    /**
     *  Recursive function computing values in the given 2D box (which is a subbox
     *  of the whole front buffer), by cuting in 2 at each step. This function is
     *  "smart", since computed boxes are buid with their scalar field accuracy.
     *  Depending on the accuracy, scalar field values may be computed from the
     *  blobtree or interpolated (linear).
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     *  @param boxes2D 2D boxes intersecting box. Used to compute accuracy for split boxes.
     *  @param box The 2D box in which we compute values
     */
    recursiveBoxComputation(cx: number, cy: number, cz: number, box: Box2Acc, boxes2D: Box2Acc[]): void;
    /**
     *  Compute all values in the front buffer.
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     */
    computeFrontValues(cx: number, cy: number, cz: number): void;
    /**
     *   get the min accuracy needed for this zone
     *   @param bbox the zone for which we want the minAcc
     *   @return the min acc for this zone
     */
    getMinAcc(bbox: Box3): number;
    /**
     *   get the max accuracy needed for this zone
     *   @param bbox the zone for which we want the minAcc
     *   @return the max acc for this zone
     */
    getMaxAcc(bbox: Box3): number;
    /**
     *  Note : returned mesh data will be accurate only if extened AABB difference
     *  with o_aabb is small. compared to o_aabb size.
     *  @param o_aabb The aabb where to compute the surface, if null, the blobtree AABB will be used
     *  @param extended True if we want the agorithm to extend the computation zone
     *                            to ensure overlap with a mesh resulting from a computation
     *                            in a neighbouring aabb (Especially usefull for parallelism).
     */
    compute(o_aabb?: Box3, extended?: boolean): BufferGeometry;
    /**
     *  Check values for cube at x, y. Ie get values front front and back arrays,
     *  compute marching cube mask, build the resulting vertex and faces if necessary.
     *  @param x
     *  @param y
     *  @param corner Bottom left corner of front array.
     */
    fetchAndTriangulate(x: number, y: number, z: number, corner: Vector3): void;
    /**
     *  Push 2 faces in direct order (right handed).
     *  @param v1 Index of vertex 1 in this.geometry
     *  @param v2 Index of vertex 2 in this.geometry
     *  @param v3 Index of vertex 3 in this.geometry
     *  @param v4 Index of vertex 4 in this.geometry
     */
    pushDirectFaces(v1: number, v2: number, v3: number, v4: number): void;
    /**
     *  Push 2 faces in undirect order (left handed).
     *  @param v1 Index of vertex 1 in this.geometry
     *  @param v2 Index of vertex 2 in this.geometry
     *  @param v3 Index of vertex 3 in this.geometry
     *  @param v4 Index of vertex 4 in this.geometry
     */
    pushUndirectFaces(v1: number, v2: number, v3: number, v4: number): void;
    /**
     *  Compute and add faces depending on current cell crossing mask
     *  @param x Current cell x coordinate in the grid (integer)
     *  @param y Current cell y coordinate in the grid (integer)
     *  @param z Current cell z coordinate in the grid (integer)
     */
    triangulate(x: number, y: number, z: number): void;
    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex: (this: SlidingMarchingCubes) => void;
    /**
     *  Compute mask of the current cube.
     *  Use this.values, set this.mask
     */
    computeMask(): void;
}
export {};
//# sourceMappingURL=SlidingMarchingCubes.d.ts.map
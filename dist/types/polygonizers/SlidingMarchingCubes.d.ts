import { BufferGeometry } from "three";
/**
*  @typedef {Object} SMCParams Parameters and option for this polygonizer.
*  @property {string=} zResolution Defines how the stepping in z occurs. Options are :
*                                  "adaptive" (default) steps are computed according to local minimum accuracy.
*                                  "uniform" steps are uniform along z, according to the global minimum accuracy.
*  @property {number=} detailRatio The blobtree defines some needed accuracies for polygonizing.
*                                  However, if you want more details, you can set this to less than 1.
*                                  Note that this is limited to 0.01, which will already increase your model complexity by a 10 000 factor.
*  @property {(percent:number) => void=} progress Progress callback, taling a percentage as parameter.
*  @property {ConvergenceParams=} convergence Add newton convergence steps to position each vertex.
*  @property {number=} dichotomy NOT YET IMPLEMENTED Add dichotomy steps to position each vertex. Usually using convergence is better, except if the implicit
*                                field is such that congerging is not possible (for example, null gradients on large areas)
*/
/**
 *  Class for a dual marching cube using 2 sliding arrays.

 *  @constructor
 */
export declare class SlidingMarchingCubes {
    /**
     *  @param {RootNode} blobtree A blobtree to polygonize.
     *  @param {SMCParams} smcParams Parameters and option for this polygonizer
     */
    constructor(blobtree: any, smcParams: any);
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
     *  @param {number} cx Coordinate x of bottom left corner of the front array
     *  @param {number} cy Coordinate x of bottom left corner of the front array
     *  @param {number} cz Coordinate x of bottom left corner of the front array
     *
     *  @param {number} x0 Lower x box osition in the array
     *  @param {number} x1 Upper x box position in the array
     *  @param {number} y0 Lower y box position in the array
     *  @param {number} y1 Upper y box position in the array
     *
     *  @private
     */
    interpolateInBox(cx: any, cy: any, cz: any, x0: any, x1: any, y0: any, y1: any): void;
    /**
     *  Compute blobtree value at a given position in the front sliding array.
     *
     *  @param {number} cx Coordinate x of bottom left corner of the front array
     *  @param {number} cy Coordinate x of bottom left corner of the front array
     *  @param {number} cz Coordinate x of bottom left corner of the front array
     *
     *  @param {number} x X position in the array
     *  @param {number} y Y position in the array
     *
     *  @private
     */
    computeFrontValAt(cx: any, cy: any, cz: any, x: any, y: any): void;
    /**
     *  Function using closure to have static variable. Wrapped in computeFrontValAt
     *  for profiling purpose.
     */
    computeFrontValAtClosure: (cx: any, cy: any, cz: any, x: any, y: any) => void;
    /**
     *  Compute corner values in the front buffer in 2D box defined by min,max
     *  @param {number} cx X coordinate of the front buffer corner
     *  @param {number} cy Y coordinate of the front buffer corner
     *  @param {number} cz Z coordinate of the front buffer corner
     *  @param {!Vector2} min 2D box min
     *  @param {!Vector2} max 2D box max
     */
    computeFrontValAtBoxCorners(cx: any, cy: any, cz: any, min: any, max: any): void;
    /**
     *  Compute all values in the front buffer in 2D box defined by min,max
     *  @param {number} cx X coordinate of the front buffer corner
     *  @param {number} cy Y coordinate of the front buffer corner
     *  @param {number} cz Z coordinate of the front buffer corner
     *  @param {!Vector2} min 2D box min
     *  @param {!Vector2} max 2D box max
     */
    computeFrontValInBox(cx: any, cy: any, cz: any, min: any, max: any): void;
    /**
     *  Set all values in 2D box min,max at 0.
     *  @param {!Vector2} min 2D box min
     *  @param {!Vector2} max 2D box max
     */
    setFrontValZeroInBox(min: any, max: any): void;
    /**
     *  Compute 2D mask of a given 2D box. Mask is an hex integer unique for each
     *  combination of iso value crossing (like in 3D marching cubes, but in 2D).
     *  @param {!Vector2} min 2D box min
     *  @param {!Vector2} max 2D box max
     *  @return {number} The mask
     */
    computeBoxMask(min: any, max: any): number;
    /**
     *  Return 0 if and only if all coners value of 2D box min,max are 0
     *  @param {!Vector2} min 2D box min
     *  @param {!Vector2} max 2D box max
     *  @return {number}
     */
    checkZeroBox(min: any, max: any): any;
    /**
     *  Recursive function computing values in the given 2D box (which is a subbox
     *  of the whole front buffer), by cuting in 2 at each step. This function is
     *  "smart", since computed boxes are buid with their scalar field accuracy.
     *  Depending on the accuracy, scalar field values may be computed from the
     *  blobtree or interpolated (linear).
     *  @param {number} cx X coordinate of the front buffer corner
     *  @param {number} cy Y coordinate of the front buffer corner
     *  @param {number} cz Z coordinate of the front buffer corner
     *  @param {!Array.<!Box2Acc>} boxes2D 2D boxes intersecting box. Used to compute accuracy for split boxes.
     *  @param {!Box2Acc} box The 2D box in which we compute values
     */
    recursiveBoxComputation(cx: any, cy: any, cz: any, box: any, boxes2D: any): void;
    /**
     *  Compute all values in the front buffer.
     *  @param {number} cx X coordinate of the front buffer corner
     *  @param {number} cy Y coordinate of the front buffer corner
     *  @param {number} cz Z coordinate of the front buffer corner
     */
    computeFrontValues(cx: any, cy: any, cz: any): void;
    /**
     *   get the min accuracy needed for this zone
     *   @param {Box3} bbox the zone for which we want the minAcc
     *   @return {number} the min acc for this zone
     */
    getMinAcc(bbox: any): number;
    /**
     *   get the max accuracy needed for this zone
     *   @param {Box3} bbox the zone for which we want the minAcc
     *   @return {number} the max acc for this zone
     */
    getMaxAcc(bbox: any): number;
    /**
     *  Note : returned mesh data will be accurate only if extened AABB difference
     *  with o_aabb is small. compared to o_aabb size.
     *  @param {Box3} o_aabb The aabb where to compute the surface, if null, the blobtree AABB will be used
     *  @param {boolean=} extended True if we want the agorithm to extend the computation zone
     *                            to ensure overlap with a mesh resulting from a computation
     *                            in a neighbouring aabb (Especially usefull for parallelism).
     */
    compute(o_aabb: any, extended: any): BufferGeometry;
    /**
     *  Check values for cube at x, y. Ie get values front front and back arrays,
     *  compute marching cube mask, build the resulting vertex and faces if necessary.
     *  @param {number} x
     *  @param {number} y
     *  @param {Vector3} corner Bottom left corner of front array.
     */
    fetchAndTriangulate(x: any, y: any, z: any, corner: any): void;
    /**
     *  Push 2 faces in direct order (right handed).
     *  @param {number} v1 Index of vertex 1 in this.geometry
     *  @param {number} v2 Index of vertex 2 in this.geometry
     *  @param {number} v3 Index of vertex 3 in this.geometry
     *  @param {number} v4 Index of vertex 4 in this.geometry
     */
    pushDirectFaces(v1: any, v2: any, v3: any, v4: any): void;
    /**
     *  Push 2 faces in undirect order (left handed).
     *  @param {number} v1 Index of vertex 1 in this.geometry
     *  @param {number} v2 Index of vertex 2 in this.geometry
     *  @param {number} v3 Index of vertex 3 in this.geometry
     *  @param {number} v4 Index of vertex 4 in this.geometry
     */
    pushUndirectFaces(v1: any, v2: any, v3: any, v4: any): void;
    /**
     *  Compute and add faces depending on current cell crossing mask
     *  @param {number} x Current cell x coordinate in the grid (integer)
     *  @param {number} y Current cell y coordinate in the grid (integer)
     *  @param {number} z Current cell z coordinate in the grid (integer)
     */
    triangulate(x: any, y: any, z: any): void;
    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex: () => void;
    /**
     *  Compute mask of the current cube.
     *  Use this.values, set this.mask
     */
    computeMask(): void;
}
//# sourceMappingURL=SlidingMarchingCubes.d.ts.map
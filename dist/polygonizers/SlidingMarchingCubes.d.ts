export = SlidingMarchingCubes;
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
declare class SlidingMarchingCubes {
    /**
     *  @param {RootNode} blobtree A blobtree to polygonize.
     *  @param {SMCParams} smcParams Parameters and option for this polygonizer
     */
    constructor(blobtree: RootNode, smcParams: SMCParams);
    /**
     * @type {RootNode}
     */
    blobtree: RootNode;
    /** @type {boolean} */
    uniformZ: boolean;
    detail_ratio: number;
    convergence: ConvergenceParams;
    /** @type {(percent:number) => void} */
    progress: (percent: number) => void;
    /** @type {Int32Array} */
    reso: Int32Array;
    /**
     * @type {{x:Float32Array, y:Float32Array, z:Float32Array}}
     */
    steps: {
        x: Float32Array;
        y: Float32Array;
        z: Float32Array;
    };
    /** @type {!{x:number,y:number,z:number}} */
    curr_steps: {
        x: number;
        y: number;
        z: number;
    };
    /** @type {number} */
    curr_step_vol: number;
    /**
     *  Sliding values array
     *  @type {[Float32Array, Float32Array]}
     */
    values_xy: [Float32Array, Float32Array];
    /**
     *  Sliding values array
     *  @type {!Array.<Int32Array>}
     */
    vertices_xy: Array<Int32Array>;
    areas: any[];
    min_acc: number;
    /** @type {Array<number>} */
    values: Array<number>;
    x: number;
    y: number;
    z: number;
    mask: number;
    /** @type {Array<boolean>} */
    edge_cross: Array<boolean>;
    /** @type {THREE.Vector3} */
    vertex: THREE.Vector3;
    /** @type {THREE.Vector3} */
    vertex_n: THREE.Vector3;
    /** @type {Material} */
    vertex_m: Material;
    /** @type {boolean} */
    extended: boolean;
    /** @type {THREE.Box3} */
    dis_o_aabb: THREE.Box3;
    /** @type {THREE.Vector3} */
    ext_p: THREE.Vector3;
    /**
     * Resulting mesh data
     * @type {ResultingGeometry}
     */
    geometry: ResultingGeometry;
    /** @type {boolean} */
    minCurvOrient: boolean;
    /** @type {(v1:number,v2:number,v3:number,v4:number) => boolean} */
    _isMinCurvatureTriangulation: (v1: number, v2: number, v3: number, v4: number) => boolean;
    /**
     *  Initialize the internal Geometry structure.
     *  @private
     */
    private initGeometry;
    /**
     *  Build the resulting BufferGeometry from current values in this.geometry.
     *  used in compute function.
     *  @private
     */
    private buildResultingBufferGeometry;
    /**
     *  Set values in this.values_xy[1] to 0
     *  @private
     */
    private setFrontToZero;
    /**
     *  Set values in this.values_xy[1] to -1.
     *  -1 is a marker to state the value has not been computed nor interpolated
     *  @private
     */
    private setFrontToMinus;
    /**
     *  Set values in this.values_xy[1] to 0 wherever it is -1.
     *  @private
     */
    private setFrontToZeroIfMinus;
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
    private interpolateInBox;
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
    private computeFrontValAt;
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
     *  @param {!THREE.Vector2} min 2D box min
     *  @param {!THREE.Vector2} max 2D box max
     */
    computeFrontValAtBoxCorners(cx: number, cy: number, cz: number, min: THREE.Vector2, max: THREE.Vector2): void;
    /**
     *  Compute all values in the front buffer in 2D box defined by min,max
     *  @param {number} cx X coordinate of the front buffer corner
     *  @param {number} cy Y coordinate of the front buffer corner
     *  @param {number} cz Z coordinate of the front buffer corner
     *  @param {!THREE.Vector2} min 2D box min
     *  @param {!THREE.Vector2} max 2D box max
     */
    computeFrontValInBox(cx: number, cy: number, cz: number, min: THREE.Vector2, max: THREE.Vector2): void;
    /**
     *  Set all values in 2D box min,max at 0.
     *  @param {!THREE.Vector2} min 2D box min
     *  @param {!THREE.Vector2} max 2D box max
     */
    setFrontValZeroInBox(min: THREE.Vector2, max: THREE.Vector2): void;
    /**
     *  Compute 2D mask of a given 2D box. Mask is an hex integer unique for each
     *  combination of iso value crossing (like in 3D marching cubes, but in 2D).
     *  @param {!THREE.Vector2} min 2D box min
     *  @param {!THREE.Vector2} max 2D box max
     *  @return {number} The mask
     */
    computeBoxMask(min: THREE.Vector2, max: THREE.Vector2): number;
    /**
     *  Return 0 if and only if all coners value of 2D box min,max are 0
     *  @param {!THREE.Vector2} min 2D box min
     *  @param {!THREE.Vector2} max 2D box max
     *  @return {number}
     */
    checkZeroBox(min: THREE.Vector2, max: THREE.Vector2): number;
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
    recursiveBoxComputation(cx: number, cy: number, cz: number, box: Box2Acc, boxes2D: Array<Box2Acc>): void;
    /**
     *  Compute all values in the front buffer.
     *  @param {number} cx X coordinate of the front buffer corner
     *  @param {number} cy Y coordinate of the front buffer corner
     *  @param {number} cz Z coordinate of the front buffer corner
     */
    computeFrontValues(cx: number, cy: number, cz: number): void;
    /**
     *   get the min accuracy needed for this zone
     *   @param {THREE.Box3} bbox the zone for which we want the minAcc
     *   @return {number} the min acc for this zone
     */
    getMinAcc(bbox: THREE.Box3): number;
    /**
     *   get the max accuracy needed for this zone
     *   @param {THREE.Box3} bbox the zone for which we want the minAcc
     *   @return {number} the max acc for this zone
     */
    getMaxAcc(bbox: THREE.Box3): number;
    /**
     *  Note : returned mesh data will be accurate only if extened AABB difference
     *  with o_aabb is small. compared to o_aabb size.
     *  @param {THREE.Box3} o_aabb The aabb where to compute the surface, if null, the blobtree AABB will be used
     *  @param {boolean=} extended True if we want the agorithm to extend the computation zone
     *                            to ensure overlap with a mesh resulting from a computation
     *                            in a neighbouring aabb (Especially usefull for parallelism).
     */
    compute(o_aabb: THREE.Box3, extended?: boolean | undefined): THREE.BufferGeometry;
    /**
     *  Check values for cube at x, y. Ie get values front front and back arrays,
     *  compute marching cube mask, build the resulting vertex and faces if necessary.
     *  @param {number} x
     *  @param {number} y
     *  @param {THREE.Vector3} corner Bottom left corner of front array.
     */
    fetchAndTriangulate(x: number, y: number, z: any, corner: THREE.Vector3): void;
    /**
     *  Push 2 faces in direct order (right handed).
     *  @param {number} v1 Index of vertex 1 in this.geometry
     *  @param {number} v2 Index of vertex 2 in this.geometry
     *  @param {number} v3 Index of vertex 3 in this.geometry
     *  @param {number} v4 Index of vertex 4 in this.geometry
     */
    pushDirectFaces(v1: number, v2: number, v3: number, v4: number): void;
    /**
     *  Push 2 faces in undirect order (left handed).
     *  @param {number} v1 Index of vertex 1 in this.geometry
     *  @param {number} v2 Index of vertex 2 in this.geometry
     *  @param {number} v3 Index of vertex 3 in this.geometry
     *  @param {number} v4 Index of vertex 4 in this.geometry
     */
    pushUndirectFaces(v1: number, v2: number, v3: number, v4: number): void;
    /**
     *  Compute and add faces depending on current cell crossing mask
     *  @param {number} x Current cell x coordinate in the grid (integer)
     *  @param {number} y Current cell y coordinate in the grid (integer)
     *  @param {number} z Current cell z coordinate in the grid (integer)
     */
    triangulate(x: number, y: number, z: number): void;
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
declare namespace SlidingMarchingCubes {
    export { RootNode, ConvergenceParams, VertexData, ResultingGeometry, SMCParams };
}
type RootNode = import('../blobtree/RootNode');
type ConvergenceParams = {
    /**
     * A ratio of a the marching cube grid size defining the wanted geometrical accuracy.
     * Must be lower than 1, default is 0.01 The maximum number of newton steps, default is 10.
     */
    ratio?: number | undefined;
    /**
     * The newton process will stop either when the threshold of ratio*cube_size is matched, or the number of steps allowed has been reached.
     */
    step?: number | undefined;
};
import THREE = require("three");
import Material = require("../blobtree/Material.js");
type ResultingGeometry = {
    /**
     * ,
     */
    position: Array<number>;
    normal: Array<number>;
    color: Array<number>;
    metalness: Array<number>;
    roughness: Array<number>;
    nVertices: number;
    faces: Array<number>;
    nFaces: number;
    addVertex: (data: VertexData) => void;
    addFace: (a: number, b: number, c: number) => void;
};
/**
 * @typedef {import('../blobtree/RootNode')} RootNode
 */
/**
 * @typedef {Object} ConvergenceParams
 * @property {number=} ratio A ratio of a the marching cube grid size defining the wanted geometrical accuracy.
 *                           Must be lower than 1, default is 0.01 The maximum number of newton steps, default is 10.
 * @property {number=} step The newton process will stop either when the threshold of ratio*cube_size is matched, or the number of steps allowed has been reached.
 */
/**
 * @typedef {Object} VertexData
 * @property {Object} p
 * @property {number} p.x
 * @property {number} p.y
 * @property {number} p.z
 * @property {Object} n
 * @property {number} n.x
 * @property {number} n.y
 * @property {number} n.z
 * @property {Object} c
 * @property {number} c.r
 * @property {number} c.g
 * @property {number} c.b
 * @property {number} r
 * @property {number} m
 */
/**
 * @typedef {Object} ResultingGeometry
 * @property {Array<number>} position,
 * @property {Array<number>} normal
 * @property {Array<number>} color
 * @property {Array<number>} metalness
 * @property {Array<number>} roughness
 * @property {number} nVertices
 * @property {Array<number>} faces
 * @property {number} nFaces
 * @property {(data:VertexData) => void} addVertex
 * @property {(a:number, b:number, c:number) => void} addFace
 */
/**
 *  Axis Aligned Bounding Box in 2D carrying accuracy data
 *  @constructor
 *  @extends THREE.Box2
 */
declare class Box2Acc extends Box2 {
    /**
     *  @param {THREE.Vector2=} min Minimum x,y coordinate of the box
     *  @param {THREE.Vector2=} max Maximum x,y coordinate of the box
     *  @param {number=} nice_acc Nice accuracy in this box
     *  @param {number=} raw_acc Raw accuracy in this box
     */
    constructor(min?: THREE.Vector2 | undefined, max?: THREE.Vector2 | undefined, nice_acc?: number | undefined, raw_acc?: number | undefined);
    /** @type {number} */
    nice_acc: number;
    raw_acc: number;
    /**
     *
     * @param {Box2Acc} box
     */
    unionWithAcc(box: Box2Acc): void;
    getRawAcc(): number;
    getNiceAcc(): number;
    setRawAcc(raw_acc: any): void;
    setNiceAcc(nice_acc: any): void;
    /**
     *  @param {number} min_x
     *  @param {number} min_y
     *  @param {number} max_x
     *  @param {number} max_y
     *  @param {number=} nice_acc
     *  @param {number=} raw_acc
     */
    setWithAcc(min_x: number, min_y: number, max_x: number, max_y: number, nice_acc?: number | undefined, raw_acc?: number | undefined): void;
    /**
     *  Get corner with the minimum coordinates
     *  @return {THREE.Vector2}
     */
    getMinCorner(): THREE.Vector2;
}
/**
 * Parameters and option for this polygonizer.
 */
type SMCParams = {
    /**
     * Defines how the stepping in z occurs. Options are :
     * "adaptive" (default) steps are computed according to local minimum accuracy.
     * "uniform" steps are uniform along z, according to the global minimum accuracy.
     */
    zResolution?: string | undefined;
    /**
     * The blobtree defines some needed accuracies for polygonizing.
     * However, if you want more details, you can set this to less than 1.
     * Note that this is limited to 0.01, which will already increase your model complexity by a 10 000 factor.
     */
    detailRatio?: number | undefined;
    /**
     * Progress callback, taling a percentage as parameter.
     */
    progress?: (percent: number) => void;
    /**
     * Add newton convergence steps to position each vertex.
     */
    convergence?: ConvergenceParams | undefined;
    /**
     * NOT YET IMPLEMENTED Add dichotomy steps to position each vertex. Usually using convergence is better, except if the implicit
     * field is such that congerging is not possible (for example, null gradients on large areas)
     */
    dichotomy?: number | undefined;
};
type VertexData = {
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
};
import { Box2 } from "three/src/math/Box2.js";
//# sourceMappingURL=SlidingMarchingCubes.d.ts.map
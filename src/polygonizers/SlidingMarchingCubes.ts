import { Box2, Vector2, Vector3, Box3, BufferGeometry, BufferAttribute } from "three";
import { Material } from "../blobtree/Material.js"
import { Convergence } from "../utils/Convergence.js"
import { Tables } from "./MCTables.js"
import { RootNode } from '../blobtree/RootNode';
import { Area, type Coordinate } from '../blobtree/areas/Area';
import { Element } from "../blobtree/Element";
import { Node } from "../blobtree/Node";
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


class Box2Acc extends Box2 {
    nice_acc: number | null;
    raw_acc: number | null;

    /**
     *  @param min Minimum x,y coordinate of the box
     *  @param max Maximum x,y coordinate of the box
     *  @param nice_acc Nice accuracy in this box
     *  @param raw_acc Raw accuracy in this box
     */
    constructor(min?: Vector2, max?: Vector2, nice_acc?: number | null, raw_acc?: number | null) {
        super(min, max);

        var s = Math.max(this.max.x - this.min.x, this.max.y - this.min.y);

        this.nice_acc = 10000000;

        // Can nice_acc be 0 ? if yes we can simplify the next line
        if (nice_acc === undefined || nice_acc === null && s > 0) {
            this.nice_acc = s;
        } else {
            this.nice_acc = nice_acc;
        }
        this.raw_acc = raw_acc ?? this.nice_acc;

    }

    unionWithAcc(box: Box2Acc) {
        if (box.nice_acc === null || box.raw_acc === null)
            throw "[SlidingMarchingCubes] unionWithAcc : box has no accuracy data";
        if (this.raw_acc === null || this.nice_acc === null)
            throw "[SlidingMarchingCubes] unionWithAcc : this has no accuracy data";
        super.union(box);
        // Union of 2 boxes get the min acc for both
        this.raw_acc = Math.min(box.raw_acc, this.raw_acc);
        this.nice_acc = Math.min(box.nice_acc, this.nice_acc);
    }

    getRawAcc(): number | null {
        return this.raw_acc;
    };

    getNiceAcc(): number | null {
        return this.nice_acc;
    };

    setRawAcc(raw_acc: number): void {
        this.raw_acc = Math.max(0, raw_acc);
    };

    setNiceAcc(nice_acc: number): void {
        this.nice_acc = Math.max(0, nice_acc);
    };

    override toString(): string {
        return (
            "(" +
            this.min.x.toFixed(2) +
            ", " +
            this.min.y.toFixed(2) +
            ") -> (" +
            this.max.x.toFixed(2) +
            ", " +
            this.max.y.toFixed(2) +
            ") "
        );
    };

    setWithAcc(min_x: number, min_y: number, max_x: number, max_y: number, nice_acc: number, raw_acc: number) {
        this.min.set(min_x, min_y);
        this.max.set(max_x, max_y);
        if (nice_acc !== undefined) {
            this.nice_acc = nice_acc;
        }
        if (raw_acc !== undefined) {
            this.raw_acc = raw_acc;
        }
    };

    /**
     *  Get corner with the minimum coordinates
     */
    getMinCorner() {
        return this.min;
    };
}

/**
 *  Class for a dual marching cube using 2 sliding arrays.

 *  @constructor
 */

export class SlidingMarchingCubes {
    blobtree: RootNode;
    uniformZ: boolean;
    detail_ratio: number;
    convergence: {
        ratio: number;
        step: number;
    } | null;
    progress: (percent: number) => void;
    reso: Int32Array;
    steps: { x: Float32Array | null; y: Float32Array| null; z: Float32Array| null; };
    curr_steps: { x: number; y: number; z: number; };
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
    constructor(blobtree: RootNode, smcParams: SMCParams) {
        if (!smcParams) {
            throw "[SlidingMarchingCubes] constructor : smcParams must be provided for SlidingMarchingCubes, to use all default values, please use {}";
        }

        this.blobtree = blobtree;

        this.uniformZ = smcParams.zResolution === "uniform" ? true : false;

        this.detail_ratio = smcParams.detailRatio
            ? Math.max(0.01, smcParams.detailRatio)
            : 1.0;

        if (smcParams.convergence) {
            this.convergence = {
                ratio: smcParams.convergence.ratio ?? 0.01,
                step: smcParams.convergence.step ?? 10
            };
        } else {
            this.convergence = null;
        }

        this.progress = smcParams.progress
            ? smcParams.progress
            : function (_percent) {
                //console.log(percent);
            };

        this.reso = new Int32Array(3);
        this.steps = {
            x: null,
            y: null,
            z: null
        };

        this.curr_steps = {
            x: 0,
            y: 0,
            z: 0
        };

        // = this.curr_steps.x*this.curr_steps.y*this.curr_steps.z
        this.curr_step_vol = 0;

        /**
         *  Sliding values array
         */
        this.values_xy = [null, null];
        /**
         *  Sliding values array
         */
        this.vertices_xy = [null, null];
        this.areas = [];
        this.min_acc = 1;

        // Processing vars
        this.values = new Array(8);

        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.mask = 0;

        this.edge_cross = [
            false, // Tables.EdgeVMap[0], x=1
            false,
            false,
            false,
            false, // edge 2 : Tables.EdgeVMap[4], y=1
            false,
            false,
            false,
            false, // edge 3 : Tables.EdgeVMap[8], z=1
            false,
            false,
            false
        ];

        this.vertex = new Vector3(0, 0, 0); // vertex associated to the cell if any

        this.vertex_n = new Vector3(0, 0, 0); // vertex normal

        this.vertex_m = new Material(); // vertex material

        // Vars and tmp vars for extension checks
        this.extended = false;
        this.dis_o_aabb = new Box3();
        this.ext_p = new Vector3();




        /**
         * Resulting mesh data
         */
        this.geometry = null;


        // Ensure triangulation along min curvature edge
        this.minCurvOrient = true;


        // Returns true if 123/143 split is along min curvature
        this._isMinCurvatureTriangulation =
            (function () {
                //Var and tmp var pre allocated and Scoped
                //for optimization of triangulation criteria
                //assuming a v1v2v3v4 quad
                let p1 = new Vector3(); //v1 position
                let p2 = new Vector3(); //v2 position
                let p3 = new Vector3(); //v3 position
                let p4 = new Vector3(); //v4 position
                //Edges from v2
                let pp_2_1 = new Vector3(); //v2v1 edge
                let pp_2_3 = new Vector3(); //v2v3 edge
                let pp_2_4 = new Vector3(); //v2v4 edge
                //Edges from v4
                let pp_4_1 = new Vector3(); //v4v1 edge
                let pp_4_3 = new Vector3(); //v3v1 edge

                let n_2 = new Vector3(); //123 normal
                let n_4 = new Vector3(); //341 normal
                let n_23 = new Vector3(); //234 normal
                let n_42 = new Vector3(); //412 normal

                return function (this: SlidingMarchingCubes, v1: number, v2: number, v3: number, v4: number) {
                    //Quad opposes v1 and v3 and v2 and v4
                    //check min curvature
                    if (this.geometry === null) 
                        throw "[SlidingMarchingCubes] _isMinCurvatureTriangulation : Geometry not initialized";
                    p1.x = this.geometry.position[v1 * 3];
                    p1.y = this.geometry.position[v1 * 3 + 1]
                    p1.z = this.geometry.position[v1 * 3 + 2];

                    p2.x = this.geometry.position[v2 * 3]
                    p2.y = this.geometry.position[v2 * 3 + 1]
                    p2.z = this.geometry.position[v2 * 3 + 2];

                    p3.x = this.geometry.position[v3 * 3]
                    p3.y = this.geometry.position[v3 * 3 + 1]
                    p3.z = this.geometry.position[v3 * 3 + 2];

                    p4.x = this.geometry.position[v4 * 3]
                    p4.y = this.geometry.position[v4 * 3 + 1]
                    p4.z = this.geometry.position[v4 * 3 + 2];

                    //Edges from v2
                    pp_2_1.subVectors(p1, p2);
                    pp_2_3.subVectors(p3, p2);
                    pp_2_4.subVectors(p4, p2);

                    //Edges from v4
                    pp_4_1.subVectors(p1, p4);
                    pp_4_3.subVectors(p3, p4);

                    //normal of 123 triangle
                    n_2.copy(pp_2_3);
                    n_2.cross(pp_2_1).normalize();

                    //normal of 143 triangle
                    n_4.copy(pp_4_1);
                    n_4.cross(pp_4_3).normalize();

                    //normal of 234 triangle
                    n_23.copy(pp_2_3);
                    n_23.cross(pp_2_4).normalize();

                    //normal of 214 triangle
                    n_42.copy(pp_4_1);
                    n_42.cross(pp_2_4.multiplyScalar(-1.0)).normalize();

                    let dot_24 = n_2.dot(n_4);
                    let dot_31 = n_23.dot(n_42);

                    return dot_31 < dot_24;
                }
            })();
    }

    /**
     *  Initialize the internal Geometry structure.
     *  @private
     */
    initGeometry() {
        this.geometry = {
            position: [],
            normal: [],
            color: [],
            metalness: [],
            roughness: [],
            nVertices: 0,
            faces: [],
            nFaces: 0,
            addVertex: function (data) {
                this.position.push(data.p.x, data.p.y, data.p.z);
                this.normal.push(data.n.x, data.n.y, data.n.z);
                this.color.push(data.c.r, data.c.g, data.c.b);
                this.roughness.push(data.r);
                this.metalness.push(data.m);
                this.nVertices++;
            },
            addFace: function (a, b, c) {
                this.faces.push(a, b, c);
                this.nFaces++;
            }
        };
    }

    /**
     *  Build the resulting BufferGeometry from current values in this.geometry.
     *  used in compute function.
     *  @private
     */
    buildResultingBufferGeometry() {
        if (this.geometry === null)
            throw "[SlidingMarchingCubes] buildResultingBufferGeometry : Geometry not initialized";

        var res = new BufferGeometry();
        res.setAttribute(
            "position",
            new BufferAttribute(new Float32Array(this.geometry.position), 3)
        );
        res.setAttribute(
            "normal",
            new BufferAttribute(new Float32Array(this.geometry.normal), 3)
        );
        res.setAttribute(
            "color",
            new BufferAttribute(new Float32Array(this.geometry.color), 3)
        );
        res.setAttribute(
            "roughness",
            new BufferAttribute(new Float32Array(this.geometry.roughness), 1)
        );
        res.setAttribute(
            "metalness",
            new BufferAttribute(new Float32Array(this.geometry.metalness), 1)
        );

        res.setIndex(
            new BufferAttribute(
                this.geometry.nVertices > 65535
                    ? new Uint32Array(this.geometry.faces)
                    : new Uint16Array(this.geometry.faces),
                1
            )
        );

        return res;
    }

    /**
     *  Set values in this.values_xy[1] to 0
     *  @private
     */
    setFrontToZero() {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] setFrontToZero : values_xy[1] is null when it should not be";
        // init to 0, can be omptim later
        for (let i = 0; i < this.values_xy[1].length; ++i) {
            this.values_xy[1][i] = 0;
        }
    }

    /**
     *  Set values in this.values_xy[1] to -1.
     *  -1 is a marker to state the value has not been computed nor interpolated
     *  @private
     */
    setFrontToMinus() {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] setFrontToMinus : values_xy[1] is null when it should not be";
        // init to 0, can be omptim later
        for (let i = 0; i < this.values_xy[1].length; ++i) {
            this.values_xy[1][i] = -1;
        }
    }

    /**
     *  Set values in this.values_xy[1] to 0 wherever it is -1.
     *  @private
     */
    setFrontToZeroIfMinus() {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] setFrontToZeroIfMinus : values_xy[1] is null when it should not be";
        // init to 0, can be omptim later
        for (let i = 0; i < this.values_xy[1].length; ++i) {
            if (this.values_xy[1][i] === -1) {
                this.values_xy[1][i] = 0;
            }
        }
    }

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
    interpolateInBox(
        _cx: number,
        _cy: number,
        _cz: number,
        x0: number,
        x1: number,
        y0: number,
        y1: number
    ): void {
        if (this.values_xy[1] === null) {
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling interpolateInBox";
        }
        let varr = this.values_xy[1];

        let nx = x1 - x0;
        let ny = y1 - y0;

        /*
        this.computeFrontValAtBoxCorners(cx,cy,cz, new Vector2(x0,y0), new Vector2(x1,y1));
        var mask = this.computeBoxMask(new Vector2(x0,y0), new Vector2(x1,y1));
        if(!(mask === 0xf || mask === 0x0)){
            throw "Error bad mask when interpolating";
        }
        */

        if (nx > 1) {
            // must interpolate
            let line = y0 * this.reso[0];
            let val0 = varr[line + x0];
            let v_step = (varr[line + x1] - val0) / nx;
            for (let i = 1; i < nx; ++i) {
                if (varr[line + x0 + i] === -1) {
                    varr[line + x0 + i] = val0 + i * v_step;
                    //this.computeFrontValAt(cx,cy,cz,x0+i,y0);
                }
            }
        }

        if (ny > 1) {
            // compute upper line
            let line = y1 * this.reso[0];
            let val0 = varr[line + x0];
            let v_step = (varr[line + x1] - val0) / nx;
            for (let i = 1; i < nx; ++i) {
                if (varr[line + x0 + i] === -1) {
                    varr[line + x0 + i] = val0 + i * v_step;
                    //this.computeFrontValAt(cx,cy,cz,x0+i,y1);
                }
            }

            for (let i = 0; i <= nx; ++i) {
                val0 = varr[y0 * this.reso[0] + x0 + i];
                v_step = (varr[y1 * this.reso[0] + x0 + i] - val0) / ny;
                for (let k = 1; k < ny; ++k) {
                    if (varr[(y0 + k) * this.reso[0] + x0 + i] === -1) {
                        varr[(y0 + k) * this.reso[0] + x0 + i] = val0 + k * v_step;
                        //if(i===0 || i==nx){
                        //    this.computeFrontValAt(cx,cy,cz,x0+i,(y0+k));
                        //}
                    }
                }
            }
        }
    }

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
    computeFrontValAt(cx: number, cy: number, cz: number, x: number, y: number): void {
        this.computeFrontValAtClosure(cx, cy, cz, x, y);
    };

    /**
     *  Function using closure to have static variable. Wrapped in computeFrontValAt
     *  for profiling purpose.
     */
    computeFrontValAtClosure = (function () {
        var eval_res = { v: 0 };
        var p = new Vector3();
        return function (this: SlidingMarchingCubes, cx: number, cy: number, cz: number, x: number, y: number) {
            let self = this;
            if (self.values_xy[1] === null)
                throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling computeFrontValAt";
            var index = y * self.reso[0] + x;
            eval_res.v = self.blobtree.getNeutralValue();
            if (self.values_xy[1][index] === -1) {
                p.set(cx + x * self.min_acc, cy + y * self.min_acc, cz);
                self.blobtree.value(p, eval_res);
                self.values_xy[1][index] = eval_res.v;
            }
        };
    })();

    /**
     *  Compute corner values in the front buffer in 2D box defined by min,max
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     *  @param min 2D box min
     *  @param max 2D box max
     */
    computeFrontValAtBoxCorners(
        cx: number,
        cy: number,
        cz: number,
        min: Vector2,
        max: Vector2
    ) {
        this.computeFrontValAt(cx, cy, cz, min.x, min.y);
        this.computeFrontValAt(cx, cy, cz, min.x, max.y);
        this.computeFrontValAt(cx, cy, cz, max.x, min.y);
        this.computeFrontValAt(cx, cy, cz, max.x, max.y);
    };

    /**
     *  Compute all values in the front buffer in 2D box defined by min,max
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     *  @param min 2D box min
     *  @param max 2D box max
     */
    computeFrontValInBox(
        cx: number,
        cy: number,
        cz: number,
        min: Vector2,
        max: Vector2
    ) {
        for (let xx = min.x; xx <= max.x; ++xx) {
            for (let yy = min.y; yy <= max.y; ++yy) {
                this.computeFrontValAt(cx, cy, cz, xx, yy);
            }
        }
    };

    /**
     *  Set all values in 2D box min,max at 0.
     *  @param min 2D box min
     *  @param max 2D box max
     */
    setFrontValZeroInBox(min: Vector2, max: Vector2) {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling setFrontValZeroInBox";
        for (let ix = min.x; ix <= max.x; ++ix) {
            for (let iy = min.y; iy <= max.y; ++iy) {
                this.values_xy[1][iy * this.reso[0] + ix] = 0;
            }
        }
    };

    /**
     *  Compute 2D mask of a given 2D box. Mask is an hex integer unique for each
     *  combination of iso value crossing (like in 3D marching cubes, but in 2D).
     *  @param min 2D box min
     *  @param max 2D box max
     *  @return The mask
     */
    computeBoxMask(min: Vector2, max: Vector2): number {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling computeBoxMask";
        let mask = 0;
        mask |=
            this.values_xy[1][min.y * this.reso[0] + min.x] >
                this.blobtree.getIsoValue()
                ? 1 << 0
                : 0;
        mask |=
            this.values_xy[1][min.y * this.reso[0] + max.x] >
                this.blobtree.getIsoValue()
                ? 1 << 1
                : 0;
        mask |=
            this.values_xy[1][max.y * this.reso[0] + max.x] >
                this.blobtree.getIsoValue()
                ? 1 << 2
                : 0;
        mask |=
            this.values_xy[1][max.y * this.reso[0] + min.x] >
                this.blobtree.getIsoValue()
                ? 1 << 3
                : 0;
        return mask;
    };

    /**
     *  Return 0 if and only if all coners value of 2D box min,max are 0
     *  @param min 2D box min
     *  @param max 2D box max
     */
    checkZeroBox(min: Vector2, max: Vector2): number {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling checkZeroBox";
        return (
            this.values_xy[1][min.y * this.reso[0] + min.x] +
            this.values_xy[1][min.y * this.reso[0] + max.x] +
            this.values_xy[1][max.y * this.reso[0] + max.x] +
            this.values_xy[1][max.y * this.reso[0] + min.x]
        );
    };

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
    recursiveBoxComputation(
        cx: number,
        cy: number,
        cz: number,
        box: Box2Acc,
        boxes2D: Box2Acc[]
    ) {
        // split the current box in 2 boxes in the largest dimension

        var new_boxes = null;
        var diff = new Vector2(
            Math.round(box.max.x - box.min.x),
            Math.round(box.max.y - box.min.y)
        );

        if (diff.x > 1 && diff.x >= diff.y) {
            // cut in x
            var x_cut = box.min.x + Math.floor(diff.x / 2);
            new_boxes = [
                new Box2Acc(
                    box.min,
                    new Vector2(x_cut, box.max.y),
                    10000,
                    10000
                ),
                new Box2Acc(
                    new Vector2(x_cut, box.min.y),
                    box.max,
                    10000,
                    10000
                )
            ];
            this.computeFrontValAt(cx, cy, cz, x_cut, box.min.y);
            this.computeFrontValAt(cx, cy, cz, x_cut, box.max.y);
        } else {
            // cut in y
            if (diff.y > 1) {
                var y_cut = box.min.y + Math.floor(diff.y / 2);
                new_boxes = [
                    new Box2Acc(
                        box.min,
                        new Vector2(box.max.x, y_cut),
                        10000,
                        10000
                    ),
                    new Box2Acc(
                        new Vector2(box.min.x, y_cut),
                        box.max,
                        10000,
                        10000
                    )
                ];
                this.computeFrontValAt(cx, cy, cz, box.min.x, y_cut);
                this.computeFrontValAt(cx, cy, cz, box.max.x, y_cut);
            } else {
                // the box is 1 in size, so we stop
                return;
            }
        }

        // Compute accuracies for each box
        var boxes2D_rec: [Box2Acc[], Box2Acc[]] = [[], []];
        for (let i = 0; i < boxes2D.length; ++i) {
            for (let k = 0; k < new_boxes.length; ++k) {
                const newBoxRawAcc = new_boxes[k].getRawAcc();
                const newBoxNiceAcc = new_boxes[k].getNiceAcc();
                if (newBoxRawAcc === null || newBoxNiceAcc === null)
                    throw "[SlidingMarchingCubes] recursiveBoxComputation : new_boxes["+ k + "] has no accuracy data";

                const boxRawAcc = boxes2D[i].getRawAcc();
                const boxNiceAcc = boxes2D[i].getNiceAcc();
                if (boxRawAcc === null || boxNiceAcc === null)
                    throw "[SlidingMarchingCubes] recursiveBoxComputation : box has no accuracy data";
                if (new_boxes[k].intersectsBox(boxes2D[i])) {
                    new_boxes[k].setRawAcc(
                        Math.min(newBoxRawAcc, boxRawAcc)
                    );
                    new_boxes[k].setNiceAcc(
                        Math.min(newBoxNiceAcc, boxNiceAcc)
                    );
                    boxes2D_rec[k].push(boxes2D[i]);
                }
            }
        }

        for (let k = 0; k < new_boxes.length; ++k) {
            let b = new_boxes[k];

            let bsize = b.getSize(new Vector2());

            if (boxes2D_rec[k].length === 0) {
                this.setFrontValZeroInBox(b.min, b.max);
            } else {
                const bRawAcc = b.getRawAcc();
                const bNiceAcc = b.getNiceAcc();
                if (bRawAcc === null || bNiceAcc === null)
                    throw "[SlidingMarchingCubes] recursiveBoxComputation : b has no accuracy data";
                if (bsize.x <= bRawAcc && bsize.y <= bRawAcc) {
                    // We reach the raw level
                    let mask = this.computeBoxMask(b.min, b.max);
                    if (mask === 0xf || mask === 0x0) {
                        // all points are inside, since we reached raw, we can interpolate
                        // Note when all values are very close to 0, it's useless to interpolate, setting 0 can do.
                        this.interpolateInBox(
                            cx,
                            cy,
                            cz,
                            b.min.x,
                            b.max.x,
                            b.min.y,
                            b.max.y
                        );

                        // OR just compute all values.
                        // this.computeFrontValInBox(cx,cy,cz,b.min,b.max);
                    } else {
                        //Surface is crossed, must go down to the nice
                        if (
                            bsize.x <= bNiceAcc &&
                            bsize.y <= bNiceAcc
                        ) {
                            // We are under nice acc, just interpolate
                            this.interpolateInBox(
                                cx,
                                cy,
                                cz,
                                b.min.x,
                                b.max.x,
                                b.min.y,
                                b.max.y
                            );

                            // OR just compute all values.
                            // this.computeFrontValInBox(cx,cy,cz,b.min,b.max);
                        } else {
                            this.recursiveBoxComputation(
                                cx,
                                cy,
                                cz,
                                b,
                                boxes2D_rec[k]
                            );
                            //console.log("going down in " + b.toString());
                        }
                    }
                } else {
                    // we did not reach the raw level, so we must cut again
                    this.recursiveBoxComputation(cx, cy, cz, b, boxes2D_rec[k]);
                }
            }
        }
    };

    /**
     *  Compute all values in the front buffer.
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     */
    computeFrontValues(cx: number, cy: number, cz: number) {
        this.setFrontToMinus();

        var areas = this.blobtree.getAreas();
        var bigbox = new Box2Acc();
        bigbox.makeEmpty();
        var boxes2D = [];
        for (let i = 0; i < areas.length; ++i) {
            var raw_acc = Math.round(
                (areas[i].bv.getMinRawAcc() * this.detail_ratio) / this.min_acc
            );
            var nice_acc = Math.round(
                (areas[i].bv.getMinAcc() * this.detail_ratio) / this.min_acc
            );
            var x_min = Math.max(
                0,
                Math.floor((areas[i].aabb.min.x - cx) / this.min_acc)
            );
            var y_min = Math.max(
                0,
                Math.floor((areas[i].aabb.min.y - cy) / this.min_acc)
            );
            var x_max = Math.min(
                this.reso[0] - 1,
                Math.ceil((areas[i].aabb.max.x - cx) / this.min_acc)
            );
            var y_max = Math.min(
                this.reso[1] - 1,
                Math.ceil((areas[i].aabb.max.y - cy) / this.min_acc)
            );
            boxes2D.push(
                new Box2Acc(
                    new Vector2(x_min, y_min),
                    new Vector2(x_max, y_max),
                    nice_acc,
                    raw_acc
                )
            );
            bigbox.unionWithAcc(boxes2D[boxes2D.length - 1]);
        }

        bigbox.intersect(
            new Box2Acc(
                new Vector2(0, 0),
                new Vector2(this.reso[0], this.reso[1]),
                bigbox.getNiceAcc(),
                bigbox.getRawAcc()
            )
        );

        this.computeFrontValAtBoxCorners(cx, cy, cz, bigbox.min, bigbox.max);
        this.recursiveBoxComputation(cx, cy, cz, bigbox, boxes2D);

        this.setFrontToZeroIfMinus();
    };

    /**
     *   get the min accuracy needed for this zone
     *   @param bbox the zone for which we want the minAcc
     *   @return the min acc for this zone
     */
    getMinAcc(bbox: Box3): number {
        var areas = this.blobtree.getAreas();
        var minAcc = Number.MAX_VALUE;

        for (let i = 0; i < areas.length; i++) {
            var area = areas[i];
            if (area.aabb.intersectsBox(bbox)) {
                if (area.bv) {
                    // it's a new area, we can get the min acc
                    var areaMinAcc = area.bv.getMinAcc();
                    if (areaMinAcc < minAcc) {
                        minAcc = areaMinAcc;
                    }
                }
            }
        }
        return minAcc * this.detail_ratio;
    };

    /**
     *   get the max accuracy needed for this zone
     *   @param bbox the zone for which we want the minAcc
     *   @return the max acc for this zone
     */
    getMaxAcc(bbox: Box3): number {
        var areas = this.blobtree.getAreas();
        var maxAcc = 0;

        for (let i = 0; i < areas.length; i++) {
            var area = areas[i];
            if (area.aabb.intersectsBox(bbox)) {
                if (area.bv) {
                    // it's a new area, we can get the min acc
                    var areaMaxAcc = area.bv.getMinAcc();
                    if (areaMaxAcc > maxAcc) {
                        maxAcc = areaMaxAcc;
                    }
                }
            }
        }
        return maxAcc * this.detail_ratio;
    }

    /**
     *  Note : returned mesh data will be accurate only if extened AABB difference
     *  with o_aabb is small. compared to o_aabb size.
     *  @param o_aabb The aabb where to compute the surface, if null, the blobtree AABB will be used
     *  @param extended True if we want the agorithm to extend the computation zone
     *                            to ensure overlap with a mesh resulting from a computation
     *                            in a neighbouring aabb (Especially usefull for parallelism).
     */
    compute(o_aabb?: Box3, extended?: boolean): BufferGeometry {
        this.initGeometry();

        const timer_begin = new Date().getTime();

        this.blobtree.prepareForEval();
        let aabb = null;
        if (o_aabb) {
            aabb = o_aabb.clone();
        } else {
            aabb = this.blobtree.getAABB();
        }

        this.extended = extended !== undefined ? extended : false;

        if (this.extended) {
            let adims: Vector3 = aabb.getSize(new Vector3());
            let minAcc = Math.min(
                Math.min(this.getMinAcc(aabb), adims.x),
                Math.min(adims.y, adims.z)
            );
            let acc_box = aabb.clone();
            let final_bbox = aabb.clone();
            let axis: Coordinate[] = ["x", "y", "z"];
            for (let k = 0; k < axis.length; ++k) {
                acc_box.max[axis[k]] = aabb.min[axis[k]] + minAcc;
                let slice_max = this.getMaxAcc(acc_box);
                if (slice_max !== 0) {
                    final_bbox.min[axis[k]] = final_bbox.min[axis[k]] - slice_max;
                }
                acc_box.max[axis[k]] = aabb.max[axis[k]] - minAcc;
                slice_max = this.getMaxAcc(acc_box);
                if (slice_max !== 0) {
                    final_bbox.max[axis[k]] = final_bbox.max[axis[k]] + slice_max;
                }
            }
            aabb.copy(final_bbox);
        }

        var aabb_trim: Element[] = [];
        var aabb_trim_parents: Node[] = [];
        if (o_aabb) {
            this.blobtree.externalTrim(aabb, aabb_trim, aabb_trim_parents);
            this.blobtree.prepareForEval();
        }

        this.areas = this.blobtree.getAreas();

        // if no areas, blobtree is empty so stop and send an empty mesh.
        if (this.areas.length === 0) {
            this.progress(100);
            return this.buildResultingBufferGeometry();
        }

        this.min_acc = this.areas.length !== 0 ? this.areas[0].bv.getMinAcc() : 1;
        for (let i = 0; i < this.areas.length; ++i) {
            if (this.areas[i].bv.getMinAcc() < this.min_acc) {
                this.min_acc = this.areas[i].bv.getMinAcc();
            }
        }
        this.min_acc = this.min_acc * this.detail_ratio;

        var corner = aabb.min;
        var dims = aabb.getSize(new Vector3());

        this.steps.z = new Float32Array(Math.ceil(dims.z / this.min_acc) + 2);
        this.steps.z[0] = corner.z;
        var index = 1;
        var areas = this.blobtree.getAreas();
        while (this.steps.z[index - 1] < corner.z + dims.z) {
            var min_step = dims.z;
            // If uniformZ is true, we do not adapt z stepping to local slice accuracy.
            if (this.uniformZ) {
                min_step = this.min_acc;
            } else {
                // find minimum accuracy needed in this slice.
                for (let i = 0; i < areas.length; ++i) {
                    min_step = Math.min(
                        min_step,
                        areas[i].bv.getAxisProjectionMinStep(
                            "z",
                            this.steps.z[index - 1]
                        ) * this.detail_ratio
                    );
                }
            }
            this.steps.z[index] = this.steps.z[index - 1] + min_step;
            index++;
        }
        this.reso[2] = index;

        this.reso[0] = Math.ceil(dims.x / this.min_acc) + 2;
        this.reso[1] = Math.ceil(dims.y / this.min_acc) + 2;

        // If necessary, set this.dis_o_aabb
        // Reminder : dis_o_aabb is the discret o_aabb, ie indices for which we are in the o_aabb.
        if (this.extended) {
            var i = 0;
            this.dis_o_aabb.set(
                new Vector3(-1, -1, -1),
                new Vector3(-1, -1, -1)
            );
            while (i < this.reso[2] && this.dis_o_aabb.min.z === -1) {
                if (this.steps.z[i] >= aabb.min.z) {
                    this.dis_o_aabb.min.z = i;
                }
                i++;
            }
            if (i > this.reso[2] - 1) {
                this.dis_o_aabb.min.z = this.reso[2] - 1;
            } // should never happen

            i = this.reso[2] - 1;
            while (i >= 0 && this.dis_o_aabb.max.z === -1) {
                if (this.steps.z[i] < aabb.max.z) {
                    this.dis_o_aabb.max.z = i;
                }
                i--;
            }
            if (i < 0) {
                this.dis_o_aabb.max.z = 0;
            } // should never happen

            this.dis_o_aabb.min.x = Math.round(
                (aabb.min.x - aabb.min.x) / this.min_acc
            );
            this.dis_o_aabb.min.y = Math.round(
                (aabb.min.y - aabb.min.y) / this.min_acc
            );
            this.dis_o_aabb.max.x =
                this.reso[0] -
                2 -
                Math.round((aabb.max.x - aabb.max.x) / this.min_acc);
            this.dis_o_aabb.max.y =
                this.reso[1] -
                2 -
                Math.round((aabb.max.y - aabb.max.y) / this.min_acc);
        }
        // Back values
        this.values_xy[0] = new Float32Array(this.reso[0] * this.reso[1]);
        // Front values
        this.values_xy[1] = new Float32Array(this.reso[0] * this.reso[1]);

        this.vertices_xy[0] = new Int32Array(this.reso[0] * this.reso[1]);
        this.vertices_xy[1] = new Int32Array(this.reso[0] * this.reso[1]);

        // Aabb for trimming the blobtree
        var trim_aabb = new Box3();
        this.computeFrontValues(corner.x, corner.y, corner.z);

        var percent = 0;

        for (let iz = 0; iz < this.reso[2] - 1; ++iz) {
            // Switch the 2 arrays, and fill the one in front
            let valuesSwitcher: Float32Array | null = this.values_xy[0];
            this.values_xy[0] = this.values_xy[1];
            this.values_xy[1] = valuesSwitcher;
            let verticesSwitcher : Int32Array | null = this.vertices_xy[0];
            this.vertices_xy[0] = this.vertices_xy[1];
            this.vertices_xy[1] = verticesSwitcher;

            var z1 = this.steps.z[iz + 1];
            trim_aabb.set(
                new Vector3(corner.x, corner.y, z1 - this.min_acc / 64),
                new Vector3(
                    corner.x + this.reso[0] * this.min_acc,
                    corner.y + this.reso[1] * this.min_acc,
                    z1 + this.min_acc / 64
                )
            );
            this.blobtree.internalTrim(trim_aabb);
            this.blobtree.prepareForEval();
            this.computeFrontValues(corner.x, corner.y, z1);
            this.blobtree.internalUntrim();
            this.blobtree.prepareForEval();

            this.z = this.steps.z[iz];

            this.curr_steps.z = this.steps.z[iz + 1] - this.steps.z[iz];
            this.curr_steps.x = this.min_acc;
            this.curr_steps.y = this.min_acc;
            this.curr_step_vol =
                this.curr_steps.x * this.curr_steps.y * this.curr_steps.z;

            for (let iy = 0; iy < this.reso[1] - 1; ++iy) {
                for (let ix = 0; ix < this.reso[0] - 1; ++ix) {
                    this.y = corner.y + iy * this.min_acc;
                    this.fetchAndTriangulate(ix, iy, iz, corner);
                }
            }

            if (Math.round((100 * iz) / this.reso[2]) > percent) {
                percent = Math.round((100 * iz) / this.reso[2]);
                this.progress(percent);
            }
        }

        if (o_aabb) {
            this.blobtree.untrim(aabb_trim, aabb_trim_parents);
            this.blobtree.prepareForEval();
        }

        var timer_end = new Date().getTime();
        console.log(
            "Sliding Marching Cubes computed in " + (timer_end - timer_begin) + "ms"
        );

        // Clear memory, in case this object is kept alive
        this.values_xy[0] = null;
        this.values_xy[1] = null;
        this.vertices_xy[0] = null;
        this.vertices_xy[1] = null;

        this.progress(100);

        return this.buildResultingBufferGeometry();
    };

    /**
     *  Check values for cube at x, y. Ie get values front front and back arrays,
     *  compute marching cube mask, build the resulting vertex and faces if necessary.
     *  @param x
     *  @param y
     *  @param corner Bottom left corner of front array.
     */
    fetchAndTriangulate(x: number, y: number, z: number, corner: Vector3) {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling fetchAndTriangulate";
        if (this.values_xy[0] === null)
            throw "[SlidingMarchingCubes] values_xy[0] must be initialized before calling fetchAndTriangulate";
        if (this.vertices_xy[1] === null)
            throw "[SlidingMarchingCubes] vertices_xy[1] must be initialized before calling fetchAndTriangulate";
        if (this.geometry === null)
            throw "[SlidingMarchingCubes] geometry must be initialized before calling fetchAndTriangulate";
        const idx_y_0 = y * this.reso[0] + x;
        const idx_y_1 = (y + 1) * this.reso[0] + x;
        this.values[0] = this.values_xy[0][idx_y_0]; //v_000;
        this.values[1] = this.values_xy[1][idx_y_0]; //v_001;
        this.values[2] = this.values_xy[0][idx_y_1]; //v_010;
        this.values[3] = this.values_xy[1][idx_y_1]; //v_011;
        this.values[4] = this.values_xy[0][idx_y_0 + 1]; //v_100;
        this.values[5] = this.values_xy[1][idx_y_0 + 1]; //v_101;
        this.values[6] = this.values_xy[0][idx_y_1 + 1]; //v_110;
        this.values[7] = this.values_xy[1][idx_y_1 + 1]; //v_111;

        this.computeMask();
        if (this.mask !== 0x0) {
            if (this.mask !== 0xff) {
                this.x = corner.x + x * this.min_acc;
                this.computeVertex();
                this.geometry.addVertex({
                    p: this.vertex,
                    n: this.vertex_n,
                    c: this.vertex_m.getColor(),
                    r: this.vertex_m.getRoughness(),
                    m: this.vertex_m.getMetalness()
                });
                this.vertices_xy[1][idx_y_0] = this.geometry.nVertices - 1;
                this.triangulate(x, y, z);
            }
        }
    };

    /**
     *  Push 2 faces in direct order (right handed).
     *  @param v1 Index of vertex 1 in this.geometry
     *  @param v2 Index of vertex 2 in this.geometry
     *  @param v3 Index of vertex 3 in this.geometry
     *  @param v4 Index of vertex 4 in this.geometry
     */
    pushDirectFaces(v1: number, v2: number, v3: number, v4: number): void {
        if (this.geometry === null)
            throw "[SlidingMarchingCubes] geometry must be initialized before calling pushDirectFaces";
        this.geometry.addFace(v1, v2, v3);
        this.geometry.addFace(v3, v4, v1);
    };
    /**
     *  Push 2 faces in undirect order (left handed).
     *  @param v1 Index of vertex 1 in this.geometry
     *  @param v2 Index of vertex 2 in this.geometry
     *  @param v3 Index of vertex 3 in this.geometry
     *  @param v4 Index of vertex 4 in this.geometry
     */
    pushUndirectFaces(v1: number, v2: number, v3: number, v4: number): void {
        if (this.geometry === null)
            throw "[SlidingMarchingCubes] geometry must be initialized before calling pushUndirectFaces";
        this.geometry.addFace(v3, v2, v1);
        this.geometry.addFace(v1, v4, v3);
    };


    /**
     *  Compute and add faces depending on current cell crossing mask
     *  @param x Current cell x coordinate in the grid (integer)
     *  @param y Current cell y coordinate in the grid (integer)
     *  @param z Current cell z coordinate in the grid (integer)
     */
    triangulate(x: number, y: number, z: number) {
        if (this.vertices_xy[1] === null)
            throw "[SlidingMarchingCubes] vertices_xy[1] must be initialized before calling triangulate";
        if (this.vertices_xy[0] === null)
            throw "[SlidingMarchingCubes] vertices_xy[0] must be initialized before calling triangulate";
        let idx_y_0 = y * this.reso[0] + x;
        if (this.edge_cross[0] && y !== 0 && z !== 0) {
            // x edge is crossed
            // Check orientation
            let v1 = this.vertices_xy[1][idx_y_0];
            let v2 = this.vertices_xy[1][(y - 1) * this.reso[0] + x];
            let v3 = this.vertices_xy[0][(y - 1) * this.reso[0] + x];
            let v4 = this.vertices_xy[0][idx_y_0];


            if (this.minCurvOrient) {
                let switch_edge = !this._isMinCurvatureTriangulation(v1, v2, v3, v4);
                if (switch_edge) {
                    let tmp = v1;
                    v1 = v2;
                    v2 = v3;
                    v3 = v4;
                    v4 = tmp;
                }
            }

            if (this.mask & 0x1) {
                this.pushDirectFaces(v1, v2, v3, v4);
            } else {
                this.pushUndirectFaces(v1, v2, v3, v4);
            }
        }
        if (this.edge_cross[4] && x !== 0 && z !== 0) {
            // y edge is crossed
            // Check orientation
            let v1 = this.vertices_xy[1][idx_y_0];
            let v2 = this.vertices_xy[0][idx_y_0];
            let v3 = this.vertices_xy[0][idx_y_0 - 1];
            let v4 = this.vertices_xy[1][idx_y_0 - 1];

            if (this.minCurvOrient) {
                let switch_edge = !this._isMinCurvatureTriangulation(v1, v2, v3, v4);
                if (switch_edge) {
                    let tmp = v1;
                    v1 = v2;
                    v2 = v3;
                    v3 = v4;
                    v4 = tmp;
                }
            }
            if (this.mask & 0x1) {
                this.pushDirectFaces(v1, v2, v3, v4);
            } else {
                this.pushUndirectFaces(v1, v2, v3, v4);
            }
        }
        if (this.edge_cross[8] && x !== 0 && y !== 0) {
            // z edge is crossed
            // Check orientation
            let v1 = this.vertices_xy[1][idx_y_0];
            let v2 = this.vertices_xy[1][idx_y_0 - 1];
            let v3 = this.vertices_xy[1][(y - 1) * this.reso[0] + x - 1];
            let v4 = this.vertices_xy[1][(y - 1) * this.reso[0] + x];

            if (this.minCurvOrient) {
                let switch_edge = !this._isMinCurvatureTriangulation(v1, v2, v3, v4);
                if (switch_edge) {
                    let tmp = v1;
                    v1 = v2;
                    v2 = v3;
                    v3 = v4;
                    v4 = tmp;
                }
            }
            if (this.mask & 0x1) {
                this.pushDirectFaces(v1, v2, v3, v4);
            } else {
                this.pushUndirectFaces(v1, v2, v3, v4);
            }
        }
    };

    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex = (function () {
        // Function static variable
        var eval_res = {
            v: 0,
            g: new Vector3(0, 0, 0),
            m: new Material()
        };
        var conv_res = new Vector3();

        return function (this: SlidingMarchingCubes) {
            eval_res.v = this.blobtree.getNeutralValue();

            // Optimization note :
            //      Here I dont use tables but performances may be improved
            //      by using tables. See marching cube and surface net for examples

            // Average edge intersection
            var e_count = 0;

            this.vertex.set(0, 0, 0);

            //For every edge of the cube...
            for (let i = 0; i < 12; ++i) {
                // --> the following code does not seem to work. Tables.EdgeCross may be broken
                //Use edge mask to check if it is crossed
                // if(!(edge_mask & (1<<i))) {
                //     continue;
                // }

                //Now find the point of intersection
                var e0 = Tables.EdgeVMap[i][0]; //Unpack vertices
                var e1 = Tables.EdgeVMap[i][1];
                var p0 = Tables.VertexTopo[e0];
                var p1 = Tables.VertexTopo[e1];
                var g0 = this.values[e0]; //Unpack grid values
                var g1 = this.values[e1];

                // replace the mask check with that. Slower.
                this.edge_cross[i] =
                    g0 > this.blobtree.getIsoValue() !==
                    g1 > this.blobtree.getIsoValue();
                if (!this.edge_cross[i]) {
                    continue;
                }
                //If it did, increment number of edge crossings
                ++e_count;

                var d = g1 - g0;
                var t = 0; //Compute point of intersection
                if (Math.abs(d) > 1e-6) {
                    t = (this.blobtree.getIsoValue() - g0) / d;
                } else {
                    continue;
                }

                this.vertex.x += (1.0 - t) * p0[0] + t * p1[0];
                this.vertex.y += (1.0 - t) * p0[1] + t * p1[1];
                this.vertex.z += (1.0 - t) * p0[2] + t * p1[2];
            }

            this.vertex.x = this.x + (this.curr_steps.x * this.vertex.x) / e_count;
            this.vertex.y = this.y + (this.curr_steps.y * this.vertex.y) / e_count;
            this.vertex.z = this.z + (this.curr_steps.z * this.vertex.z) / e_count;

            // now make some convergence step
            // Note : it cost 15 to 20% performance lost
            //        and the result does not seem 15 et 20% better...
            if (this.convergence) {
                Convergence.safeNewton3D(
                    this.blobtree, // Scalar Field to eval
                    this.vertex, // 3D point where we start, must comply to Vector3 API
                    this.blobtree.getIsoValue(), // iso value we are looking for
                    this.min_acc * this.convergence.ratio, // Geometrical limit to stop
                    this.convergence.step, // limit of number of step
                    this.min_acc, // Bounding volume inside which we look for the iso, getting out will make the process stop.
                    conv_res // the resulting point
                );
                this.vertex.copy(conv_res);
            }

            this.blobtree.value(this.vertex, eval_res);

            eval_res.g.normalize();
            this.vertex_n.copy(eval_res.g).multiplyScalar(-1);
            this.vertex_m.copy(eval_res.m);
        };
    })();

    /**
     *  Compute mask of the current cube.
     *  Use this.values, set this.mask
     */
    computeMask() {
        this.mask = 0;

        //For each this, compute cube mask
        for (let i = 0; i < 8; ++i) {
            var s = this.values[i];
            this.mask |= s > this.blobtree.getIsoValue() ? 1 << i : 0;
        }
    }
};
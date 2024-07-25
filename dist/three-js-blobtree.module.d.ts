import * as three from 'three';
import { Vector3, Color, Box3, Line3, Ray, Matrix4, BufferGeometry, Vector2, Box2 } from 'three';

type AreaSphereParam$2 = {
    radius: number;
    center: Vector3;
};
type Coordinate = 'x' | 'y' | 'z';
/**
 *  Bounding area for a primitive
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere for now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 */
declare abstract class Area {
    /**
     *  @abstract
     *  Test intersection of the shape with a sphere
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return true if the sphere and the area intersect
     */
    abstract sphereIntersect(sphere: AreaSphereParam$2): boolean;
    /**
     * @abstract
     * Test if p is in the area.
     * @param p A point in space
     * @return true if p is in the area, false otherwise.
     */
    abstract contains(p: Vector3): boolean;
    /**
     *  @abstract
     *  Return the minimum accuracy needed in the intersection of the sphere and the area.
     *  This function is a generic function used in both getNiceAcc and getRawAcc.
     *
     *  @param sphere  A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor  the ratio to determine the wanted accuracy.
     *                   Example: for an AreaScalisSeg, if thick0 is 1 and thick1 is 2, a sphere
     *                      centered at (p0+p1)/2 and of radius 0.2
     *                      will show its minimum accuracy at p0+0.3*unit_dir.
     *                      The linear interpolation of weights at this position
     *                      will give a wanted radius of 1.3
     *                      This function will return factor*1.3
     *  @return the accuracy needed in the intersection zone, as a ratio of the linear variation
     *         of the radius along (this.p0,this.p1)
     */
    abstract getAcc(sphere: AreaSphereParam$2, factor: number): number;
    /**
     *  @abstract
     *  Convenience function, just call getAcc with Nice Accuracy parameters.
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    abstract getNiceAcc(sphere: AreaSphereParam$2): number;
    /**
     *  @abstract
     *  Convenience function, just call getAcc with Current Accuracy parameters.
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Current accuracy needed in the intersection zone
     */
    abstract getCurrAcc(sphere: AreaSphereParam$2): number;
    /**
     *  @abstract
     *  Convenience function, just call getAcc with Raw Accuracy parameters.
     *  @param _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    abstract getRawAcc(sphere: AreaSphereParam$2): number;
    /**
     *  @abstract
     *  @return the minimum accuracy needed in the whole area
     */
    abstract getMinAcc(): number;
    /**
     *  @abstract
     *  @return the minimum raw accuracy needed in the whole area
     */
    abstract getMinRawAcc(): number;
    /**
     *  @abstract
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    abstract getAxisProjectionMinStep(axis: string, t: number): number;
}

interface AreaSphereParam$1 {
    radius: number;
    center: Vector3;
}
/**
 *  General representation of a "Capsule" area, ie, 2 sphere connected by a cone.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @extends {Area}
 *
 * @constructor
 */
declare class AreaCapsule extends Area {
    p1: Vector3;
    p2: Vector3;
    r1: number;
    r2: number;
    accFactor1: number;
    accFactor2: number;
    unit_dir: Vector3;
    length: number;
    vector: Vector3;
    p1_to_p: Vector3;
    p1_to_p_sqrnorm: number;
    x_p_2D: number;
    y_p_2D: number;
    y_p_2DSq: number;
    ortho_vec_x: number;
    ortho_vec_y: number;
    p_proj_x: number;
    p_proj_y: number;
    abs_diff_thick: number;
    /**
     *  @param p1 First point of the shape
     *  @param p2 Second point of the shape
     *  @param r1 radius at p1
     *  @param r2 radius at p2
     *  @param accFactor1 Apply an accuracy factor to the standard one, around p1. Default to 1.
     *  @param accFactor2 Apply an accuracy factor to the standard one, around p2. Default to 1.
     */
    constructor(p1: Vector3, p2: Vector3, r1: number, r2: number, accFactor1?: number, accFactor2?: number);
    /**
     * Compute some of the tmp variables. Used to factorized other functions code.
     * @param p A point as a Vector3
     * @protected
     */
    proj_computation(p: Vector3): void;
    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @param sphere
     * @return true if the sphere and the area intersect
     */
    sphereIntersect(sphere: AreaSphereParam$1): boolean;
    /**
     * @link Area.contains for a complete description
     */
    contains(p: Vector3): boolean;
    /**
     *  @link Area.getAcc for a complete description
     *  @return the accuracy needed in the intersection zone
     *  @param sphere  A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor  the ratio to determine the wanted accuracy.
     *  @todo Check the Maths
     */
    getAcc(sphere: AreaSphereParam$1, factor: number): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere: AreaSphereParam$1): number;
    /**
     *  @link Area.getCurrAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere: AreaSphereParam$1): number;
    /**
     *  @link Area.getRawAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere: AreaSphereParam$1): number;
    /**
     * @link Area.getMinAcc
     * @return
     */
    getMinAcc(): number;
    /**
     * @link Area.getMinRawAcc
     * @return
     */
    getMinRawAcc(): number;
    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis: Coordinate, t: number): number;
}

interface AreaSphereParam {
    radius: number;
    center: Vector3;
}
/**
 *  Bounding area for the segment.
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *  The resulting volume is a clipped cone with spherical extremities, which is
 *  actually the support of the primitive.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere for now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 *  @extends {Area}
 *  @todo should be possible to replace with an AreaCapsule
 *
 */
declare class AreaScalisSeg extends Area {
    p0: Vector3;
    p1: Vector3;
    thick0: number;
    thick1: number;
    unit_dir: Vector3;
    length: number;
    vector: Vector3;
    p0_to_p: Vector3;
    p0_to_p_sqrnorm: number;
    x_p_2D: number;
    y_p_2D: number;
    y_p_2DSq: number;
    ortho_vec_x: number;
    ortho_vec_y: number;
    p_proj_x: number;
    p_proj_y: number;
    abs_diff_thick: number;
    /**
     * @param p0 first point of the shape
     * @param p1 second point of the shape
     * @param thick0 radius at p0
     * @param thick1 radius at p1
     */
    constructor(p0: Vector3, p1: Vector3, thick0: number, thick1: number);
    /**
    * Compute some of the tmp variables.Used to factorized other functions code.
    * @param p A point as a Vector3
    *
    * @protected
    */
    protected proj_computation(p: Vector3): void;
    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @return true if the sphere and the area intersect
     */
    sphereIntersect(sphere: AreaSphereParam): boolean;
    /**
     * @link Area.contains for a complete description
     */
    contains(p: Vector3): boolean;
    /**
     *  @link Area.getAcc for a complete description
     *
     *  @param sphere  A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor  the ratio to determine the wanted accuracy.
     *
     *  @return the accuracy needed in the intersection zone
     *  @todo Check the Maths
     */
    getAcc(sphere: AreaSphereParam, factor: number): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere: AreaSphereParam): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere: AreaSphereParam): number;
    /**
     *  @link Area.getRawAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere: AreaSphereParam): number;
    /**
     * @link Area.getMinAcc
     */
    getMinAcc(): number;
    /**
     * @link Area.getMinRawAcc
     */
    getMinRawAcc(): number;
    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis: 'x' | 'y' | 'z', t: number): number;
}

type MaterialJSON = {
    color: string;
    roughness: number;
    metalness: number;
    emissive: string;
};
interface MaterialParams {
    color?: Color;
    roughness?: number;
    metalness?: number;
    emissive?: Color;
}
/**
 *  Material object for blobtree. It is an internal material, that should especially
 *  be used in implicit elements. It is the internal representation of the material,
 *  not the openGL material that will be used for display.
 */
declare class Material {
    color: Color;
    roughness: number;
    metalness: number;
    emissive: Color;
    static defaultMaterial: Material;
    /**
     *  Compare arrays of materials
     *
     *  @param {Array.<Material>} arr1
     *  @param {Array.<Material>} arr2
     *  @param {Array.<Material>=} arr3
     *  @param {Array.<Material>=} arr4
     *  @param {Array.<Material>=} arr5
     *
     *  @return true if and only if all arguments are arrays of the same length and containing the same material values.
     *  @deprecated
     */
    static areEqualsArrays(arr1: Material[]): boolean;
    static fromJSON(json: MaterialJSON): Material;
    /**
    *  @constructor
    *
    *  @param params Parameters for the material.As a dictionary to be easily extended later.
    *
    *  @param params.color Base diffuse color for the material. Defaults to #aaaaaa
    *
    *  @param params.roughness Roughness for the material. Defaults to 0.
    *
    *  @param params.metalness Metalness aspect of the material, 1 for metalness, 0 for dielectric. Defaults to 0.
    *
    *  @param params.emissive Emissive color for the material. Defaults to pitch black. (no light emission)
    */
    constructor(params?: MaterialParams);
    toJSON(): {
        color: string;
        roughness: number;
        metalness: number;
        emissive: string;
    };
    /**
     *  Return a clone of the material
     *  @return The new material
     */
    clone(): Material;
    /**
     *  Copy the given material parameters
     *  @param mat Material to be copied
     */
    copy(mat: Material): void;
    /**
     *  @deprecated Use setParams instead
     *  Set Material parameters at once. DEPRECATED. Use setParams
     *  @param  c Color
     *  @param r roughness
     *  @param m Metalness
     */
    set(c: Color, r: number, m: number): void;
    /**
     *  Set Material parameters (all or just some)
     *
     *  @param params Parameters for the material. As a dictionary to be easily extended later.
     *  @param params.color        Base diffuse color for the material.
     *  @param params.roughness    Roughness for the material.
     *  @param params.metalness    Metalness aspect of the material, 1 for metalness, 0 for dielectric.
     *  @param params.emissive       Emissive color for the material.
     */
    setParams(params: MaterialParams): void;
    getColor(): Color;
    getRoughness(): number;
    getMetalness(): number;
    getEmissive(): Color;
    equals(m: Material): boolean;
    /**
     *  Perform a linear interpolation between this material and a given other.
     * (1-s)*this + s*m = this +(m1-this)*s
     *  @param m The material to interpolate with this
     *  @param s the interpolation coefficient
     */
    lerp(m: Material, s: number): void;
    /**
     *  Used in triangles (ok it's specific, still we need it :)
     *  Linear interpolation over a triangle? Store the result in this
     *  @param m1 The material of first corner
     *  @param m2 The material of second corner
     *  @param m3 The material of third corner
     *  @param a1 the interpolation coefficient 1
     *  @param a2 the interpolation coefficient 2
     *  @param a3 the interpolation coefficient 3
     *  @param denum Normalizing the result (division)
     *  @return this
     */
    triMean(m1: Material, m2: Material, m3: Material, a1: number, a2: number, a3: number, denum: number): Material;
    /**
     *  Perform a weighted mean over several materials and set to this.
     *  Note that m_arr.length must equals v_arr.length
     *  @param m_arr Array of materials
     *  @param v_arr Array of values being the corresponding weights
     *  @param n Can be set if you want to mean only the n first element of the arrays
     */
    weightedMean(m_arr: Material[], v_arr: (number[] | Float32Array), n?: number): this;
}

declare const ScalisMath: {
    KS: number;
    KIS: number;
    KS2: number;
    KIS2: number;
    /**
     *  Compact Polynomial of degree 6 evaluation function
     *  @param r Radius (ie distance)
     */
    Poly6Eval: (r: number) => number;
    /**
     *  Compact Polynomial of degree 6 evaluation function from a squared radius.
     *  (avoid square roots in some cases)
     *  @param r2 Radius squared (ie distance squared)
     */
    Poly6EvalSq: (r2: number) => number;
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 0 dimension (point)
     *
     *  @param degree  Polynomial degree of the kernel
     *  @param scale   Kernel scale
     *  @param dist    Distance
     *  @return The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom0D: (degree: number, scale: number, dist: number) => number;
    /**
     * Normalization Factor for polynomial 4 in 0 dimension
     * @const
     */
    Poly4NF0D: number;
    /**
     * Normalization Factor for polynomial 6 in 0 dimension
     * @const
     */
    Poly6NF0D: number;
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 1 dimension
     *
     *  @param degree  Polynomial degree of the kernel
     *  @param scale   Kernel scale
     *  @param dist    Distance
     *  @return The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom1D: (degree: number, scale: number, dist: number) => number;
    /**
     * Normalization Factor for polynomial 4 in 1 dimension
     * @const
     */
    Poly4NF1D: number;
    /**
     * Normalization Factor for polynomial 6 in 1 dimension
     * @const
     */
    Poly6NF1D: number;
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 2 dimensions
     *
     *  @param degree  Polynomial degree of the kernel
     *  @param scale   Kernel scale
     *  @param dist    Distance
     *  @return The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom2D: (degree: number, scale: number, dist: number) => number;
    /**
     * Normalization Factor for polynomial 4 in 2 dimension
     * @const
     */
    Poly4NF2D: number;
    /**
     * Normalization Factor for polynomial 6 in 2 dimension
     * @const
     */
    Poly6NF2D: number;
};

/**
 *  AreaSphere is a general representation of a spherical area.
 *  See Primitive.getArea for more details.
 *
 *  @extends {Area}
 */
declare class AreaSphere extends Area {
    p: Vector3;
    r: number;
    accFactor: number;
    /**
     *  @param p Point to locate the area
     *  @param r Radius of the area
     *  @param accFactor Accuracy factor. By default SphereArea will use global Accuracies parameters. However, you can setup a accFactor.
     *                            to change that. You will usually want to have accFactor between 0 (excluded) and 1. Default to 1.0.
     *                            Be careful not to set it too small as it can increase the complexity of some algorithms up to the crashing point.
     */
    constructor(p: Vector3, r: number, accFactor?: number);
    /**
     *  Test intersection of the shape with a sphere
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return true if the sphere and the area intersect
     */
    sphereIntersect: (this: AreaSphere, sphere: {
        radius: number;
        center: Vector3;
    }) => boolean;
    /**
     * @link Area.contains for a complete description
     * @param p A point in space, must comply to Vector3 API.
     * @return true if the point is within the area
     */
    contains: (this: AreaSphere, p: Vector3) => boolean;
    /**
     *  @link Area.getAcc for a complete description
     *  @param _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor The ratio to determine the wanted accuracy.
     *  @return the accuracy needed in the intersection zone
     */
    getAcc(_sphere: AreaSphereParam$2, factor: number): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere: AreaSphereParam$2): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere: AreaSphereParam$2): number;
    /**
     *  @link Area.getRawAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere: AreaSphereParam$2): number;
    /**
     * @link Area.getMinAcc
     * @return the minimum accuracy needed in the area
     */
    getMinAcc(): number;
    /**
     * @link Area.getMinRawAcc
     * @return the minimum raw accuracy needed in the area
     */
    getMinRawAcc(): number;
    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis: Coordinate, t: number): number;
}

type ScalisPointJSON = {
    density: number;
} & ScalisPrimitiveJSON;
declare class ScalisPoint extends ScalisPrimitive {
    static type: ScalisPointType;
    static fromJSON(json: ScalisPointJSON): ScalisPoint;
    density: number;
    v_to_p: Vector3;
    /**
     * @param vertex The vertex with point parameters.
     * @param volType The volume type wanted for this primitive.
     *                 Note: "convolution" does not make sense for a point, so technically,
     *                 ScalisPrimitive.DIST or ScalisPrimitive.CONVOL will give the same results.
     *                 However, since this may be a simple way of sorting for later blending,
     *                 you can still choose between the 2 options.
     * @param density Implicit field density.
     *                 Gives a finer control of the created implicit field.
     * @param mat Material for the point
     */
    constructor(vertex: ScalisVertex, volType: ScalisPrimitiveVolType, density: number, mat: Material);
    getType(): ScalisPointType;
    toJSON(): ScalisPointJSON;
    /**
     * @param d New density to set
     */
    setDensity(d: number): void;
    /**
     * @return Current density
     */
    getDensity(): number;
    /**
     * Set material for this point
     * @param m Material
     */
    setMaterial(m: Material): void;
    /**
     * @link Primitive.computeHelpVariables
     */
    computeHelpVariables(): void;
    /**
     * @link Element.prepareForEval
     */
    prepareForEval(): void;
    getAreas(): {
        aabb: Box3;
        bv: AreaSphere;
        obj: ScalisPoint;
    }[];
    /**
     * @link Element.heuristicStepWithin
     * @return The next step length to do with respect to this primitive/node.
     */
    heuristicStepWithin(): number;
    /**
     * @link Element.value
     *
     * @param p Point where we want to evaluate the primitive field
     * @param res ValueResultType
     */
    value(p: Vector3, res: ValueResultType): void;
    distanceTo(p: Vector3): number;
}

type ScalisSegmentJSON = {
    density: number;
} & ScalisPrimitiveJSON;
/**
 *  Implicit segment class in the blobtree.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
declare class ScalisSegment extends ScalisPrimitive {
    static type: ScalisSegmentType;
    static fromJSON(json: ScalisSegmentJSON): ScalisSegment;
    density: number;
    clipped_l1: number;
    clipped_l2: number;
    vector: Vector3;
    cycle: Vector3;
    proj: Vector3;
    v0_p: Vector3;
    v1_p: Vector3;
    dir: Vector3;
    lengthSq: number;
    length: number;
    unit_dir: Vector3;
    weight_p1: number;
    c0: number;
    c1: number;
    increase_unit_dir: Vector3;
    p_min: Vector3;
    weight_min: number;
    inv_weight_min: number;
    unit_delta_weight: number;
    maxbound: number;
    maxboundSq: number;
    cyl_bd0: number;
    cyl_bd1: number;
    f0f1f2: Vector3;
    tmpVec1: Vector3;
    tmpVec2: Vector3;
    /**
     *  @param v0 First vertex for the segment
     *  @param v1 Second vertex for the segment
     *  @param volType Volume type, can be ScalisPrimitive.CONVOL
     *                 (homothetic convolution surfaces, Zanni and al), or
     *                 ScalisPrimitive.DIST (classic weighted distance field)
     *  @param density Density is another constant to modulate the implicit
     *                  field. Used only for DIST voltype.
     *  @param mats Material for this primitive.
     *              Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
     */
    constructor(v0: ScalisVertex, v1: ScalisVertex, volType: ScalisPrimitiveVolType, density: number, mats: Material[]);
    getType(): ScalisSegmentType;
    toJSON(): ScalisSegmentJSON;
    mutableVolType(): boolean;
    /**
     *  @param d The new density
     */
    setDensity(d: number): void;
    /**
     *  @return The current density
     */
    getDensity(): number;
    /**
     *  [Abstract] See Primitive.setVolType for more details.
     *  @param vt New VolType to set (Only for SCALIS primitives)
     */
    setVolType(vt: ScalisPrimitiveVolType): void;
    getVolType(): ScalisPrimitiveVolType;
    prepareForEval(): void;
    getAreas(): {
        aabb: Box3;
        bv: AreaScalisSeg;
        obj: ScalisSegment;
    }[];
    computeHelpVariables(): void;
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  value function for Distance volume type (distance field).
     */
    evalDist: (this: ScalisSegment, p: Vector3, res: ValueResultType) => void;
    /**
     *
     * @param p Evaluation point
     * @param res Resulting material will be in res.m
    */
    evalMat(p: Vector3, res: ValueResultType): void;
    /**
     *  @param w special_coeff
     */
    HomotheticClippingSpecial(w: Vector3): boolean;
    heuristicStepWithin(): number;
    /**
     *  value function for Convol volume type (Homothetic convolution).
     */
    evalConvol(p: Vector3, res: ValueResultType): void;
    /**
     *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
     *  @return Clamped value
     *  Author: Jakub Korzeniowski
     *  Agency: Softhis
     *  http://www.softhis.com
     */
    clamp(a: number, b: number, c: number): number;
    distanceTo: (this: ScalisSegment, p: Vector3) => number;
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @return the value
     */
    HomotheticCompactPolynomial_segment_F_i6(l: number, d: number, w: {
        x: number;
        y: number;
        z: number;
    }): number;
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).
     *  (Approximation? Faster?).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     */
    HomotheticCompactPolynomial_approx_segment_F_i6(l: number, d: number, q: number, w: {
        x: number;
        y: number;
        z: number;
    }): number;
    /**
     *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  Result is stored in this.f0f1f2
     */
    HomotheticCompactPolynomial_segment_FGradF_i6(l: number, d: number, w: {
        x: number;
        y: number;
        z: number;
    }): void;
    /**
     *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  Result is stored in this.f0f1f2
     */
    HomotheticCompactPolynomial_approx_segment_FGradF_i6(l: number, d: number, q: number, w: {
        x: number;
        y: number;
        z: number;
    }): void;
}

type ProjResultType = {
    proj_to_p: Vector3;
    weight_proj: number;
    t: number;
    sqrdist?: number;
    ratio?: number;
};
type ScalisTriangleJSON = ScalisPrimitiveJSON;
/**
 * This class implements a ScalisTriangle primitive.
 *  CONVOL Evaluation is not exact so we use simpsons numerical integration.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
declare class ScalisTriangle extends ScalisPrimitive {
    static type: ScalisTriangleType;
    static fromJSON(json: ScalisTriangleJSON): ScalisTriangle;
    v: [ScalisVertex, ScalisVertex, ScalisVertex];
    min_thick: number;
    max_thick: number;
    res_gseg: ProjResultType;
    tmp_res_gseg: ProjResultType;
    p0p1: Vector3;
    p1p2: Vector3;
    p2p0: Vector3;
    unit_normal: Vector3;
    unit_p0p1: Vector3;
    unit_p1p2: Vector3;
    unit_p2p0: Vector3;
    length_p0p1: number;
    length_p1p2: number;
    length_p2p0: number;
    diffThick_p0p1: number;
    diffThick_p0p2: number;
    diffThick_p1p2: number;
    diffThick_p2p0: number;
    main_dir: Vector3;
    point_iso_zero: Vector3;
    ortho_dir: Vector3;
    unsigned_ortho_dir: Vector3;
    proj_dir: Vector3;
    equal_weights: boolean;
    coord_max: number;
    coord_middle: number;
    unit_delta_weight: number;
    longest_dir_special: Vector3;
    max_seg_length: number;
    half_dir_1: Vector3;
    point_half: Vector3;
    half_dir_2: Vector3;
    point_min: Vector3;
    weight_min: number;
    valid_aabb: boolean;
    /**
     *  @param v the 3 vertices for the triangle
     *  @param volType Volume type, can be ScalisPrimitive.CONVOL
     *                 (homothetic convolution surfaces, Zanni and al), or
     *                 ScalisPrimitive.DIST (classic weighted distance field)
     *  @param density Density is another constant to modulate the implicit
     *                  field. Used only for DIST voltype.
     *  @param mats Material for this primitive.
     *                                  Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
     *
     */
    constructor(v: [ScalisVertex, ScalisVertex, ScalisVertex], volType: ScalisPrimitiveVolType, density: number, mats: Material[]);
    getType(): ScalisTriangleType;
    toJSON(): ScalisTriangleJSON;
    prepareForEval(): void;
    getAreas(): {
        aabb: Box3;
        bv: AreaScalisTri;
        obj: ScalisTriangle;
    }[];
    computeHelpVariables(): void;
    mutableVolType(): boolean;
    setVolType(vt: ScalisPrimitiveVolType): void;
    getVolType(): ScalisPrimitiveVolType;
    /**
     *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
     *  @return Clamped value
     *  Author: Jakub Korzeniowski
     *  Agency: Softhis
     *  http://www.softhis.com
     */
    clamp(a: number, b: number, c: number): number;
    distanceTo: (this: ScalisTriangle, p: Vector3) => number;
    heuristicStepWithin(): number;
    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  value function for Distance volume type (distance field).
     */
    evalDist: (this: ScalisTriangle, p: Vector3, res: ValueResultType) => void;
    /**
     *
     *  Segment computations used in Distance triangle evaluation.
     *
     *  @param  point Point where value is wanted, as a Vector3
     *  @param  p1 Segment first point, as a Vector3
     *  @param  p1p2 Segment first to second point, as a Vector3
     *  @param  length Length of the segment
     *  @param  sqr_length Squared length of the segment
     *  @param  weight_1 Weight for the first point of the segment
     *  @param  delta_weight weight_2 - weight_1
     *  @param  res {proj_to_p, weight_proj}
     *
     */
    GenericSegmentComputation(point: Vector3, p1: Vector3, p1p2: Vector3, sqr_length: number, weight_1: number, delta_weight: number, // = weight_2-weight_1
    res: {
        proj_to_p: Vector3;
        weight_proj: number;
        t: number;
    }): {
        proj_to_p: Vector3;
        weight_proj: number;
        t: number;
    };
    /**
     *  value function for Distance volume type (distance field).
     *
     *  @param {Vector3} p
     *  @param {ValueResultType} res
     */
    evalConvol: (this: ScalisTriangle, p: Vector3, res: ValueResultType) => void;
    /**
     *  @return Warped value
     */
    warpAbscissa(t: number): number;
    /**
     *  @return Unwarped value
     */
    unwarpAbscissa(t: number): number;
    /**
     *  @param  t
     *  @param  p point, as a Vector3
     *  @param  res result containing the wanted elements like res.v for the value, res.g for the gradient, res.m for the material.
     *  @return the res parameter, filled with proper values
     */
    computeLineIntegral(t: number, p: Vector3, res: ValueResultType): ValueResultType;
    /**
     * "Select" the part of a segment that is inside (in the homothetic space) of a clipping "sphere".
     *          This function use precomputed values given as parameter (prevent redundant computation during convolution
     *          computation for instance)
     *          This function is used in Eval function of CompactPolynomial kernel which use a different parametrization for a greater stability.
     *
     *
     *  @param w special_coeff, x, y and z attributes must be defined
     *  @param length
     *  @param clipped Result if clipping occured, in l1 and l2, returned
     *                           values are between 0.0 and length/weight_min
     *
     *  @return  true if clipping occured
     *
     *  @protected
     */
    homotheticClippingSpecial(w: Vector3, length: number, clipped: {
        l1: number;
        l2: number;
    }): boolean;
    /**
     *  @param point
     *  @return Object defining v attribute with the computed value
     *
     *  @protected
     */
    consWeightEvalForSeg(p_1: Vector3, w_1: number, unit_dir: Vector3, length: number, point: Vector3, res: ValueResultType): ValueResultType | 0;
    /**
     *  @return  Object defining v attribute with the computed value
     *  @protected
     */
    consWeightEvalGradForSeg(p_1: Vector3, w_1: number, unit_dir: Vector3, length: number, point: Vector3, res: ValueResultType): ValueResultType;
    /**
     *  @param  point the point of evaluation, as a Vector3
     *  @param  clipped Result if clipping occured, in l1 and l2, returned
     *                           values are between 0.0 and length/weight_min
     *  @return  true if clipping occured
     */
    ComputeTParam(point: Vector3, clipped: {
        l1: number;
        l2: number;
    }): boolean;
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param w Some coefficient, as a Vector3
     *  @return  the value
     */
    homotheticCompactPolynomial_segment_F_i6_cste(l: number, w: Vector3): number;
    /**
     *  Sub-function for optimized convolution for segment of constant weight,
     *  value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param  l
     *  @param  res result in a Vector3
     *  @param  w a Vector3
     *
     */
    homotheticCompactPolynomial_segment_FGradF_i6_cste(l: number, w: Vector3, res: Vector3): void;
}

type DistanceFunctorJSON = {
    type: string;
};
type Poly6DistanceFunctorType = "Poly6DistanceFunctor";
type DistanceFunctorType = "DistanceFunctor" | Poly6DistanceFunctorType;
/**
 *  A superclass for Node and Primitive in the blobtree.
 */
declare abstract class DistanceFunctor {
    static type: DistanceFunctorType;
    /**
     *  @abstract
     *  @param json Json description of the object
     */
    static fromJSON(json: DistanceFunctorJSON): DistanceFunctor;
    /**
     *  @return Type of the element
     */
    getType(): DistanceFunctorType;
    /**
     *  @abstract
     *  Return a Javscript Object respecting JSON convention and can be used to serialize the functor.
     */
    toJSON(): DistanceFunctorJSON;
    /**
     *  @abstract
     *  @param d The distance to be considered.
     *  @return Scalar field value according to given distance d.
     */
    abstract value(d: number): number;
    /**
     *  Perform a numerical approximation of the gradient according to epsilon.
     *  @param d The distance to be considered.
     *  @param epsilon The numerical step for this gradient computation. Default to 0.00001.
     */
    numericalGradient(d: number, epsilon?: number): number;
    /**
     *  Compute the gradient. Should be reimplemented in most cases.
     *  By default, this function returns a numerical gradient with epsilon at 0.00001.
     *  @return One-dimensional gradient at d.
     */
    gradient(d: number): number;
    /**
     *  @returns Distance above which all values will be 0. Should be reimplemented and defaults to infinity.
     */
    getSupport(): number;
}

type Poly6DistanceFunctorJSON = {
    scale: number;
} & DistanceFunctorJSON;
/**
 *  Specialised Distance Functor using a 6 degree polynomial function.
 *  This is the function similar to the one used in SCALIS primitives.
 *  @constructor
 */
declare class Poly6DistanceFunctor extends DistanceFunctor {
    static type: Poly6DistanceFunctorType;
    scale: number;
    fromJSON(json: Poly6DistanceFunctorJSON): Poly6DistanceFunctor;
    /**
     * This is the standard 6 degree polynomial function used for implicit modeling.
     * At 0, its value is 1 with a zero derivative.
     * At 1, its value is 0 with a zero derivative.
     */
    static evalStandard(d: number): number;
    constructor(scale: number);
    /**
     *  @return Type of the element
     */
    getType(): Poly6DistanceFunctorType;
    /**
     *  @return Json description of this functor.
     */
    toJSON(): Poly6DistanceFunctorJSON;
    /**
     * @link DistanceFunctor.value for a complete description.
     * @param d The distance to be considered.
     * @returns Scalar field value according to given distance d.
     */
    value(d: number): number;
    /**
     * @returns dimensional gradient at d.
     */
    gradient(d: number): number;
    /**
     * @link DistanceFunctor.getSupport for a complete description.
     */
    getSupport(): number;
}

type SDFPrimitiveJSON = ElementJSON;
type SDFPointType = "SDFPoint";
type SDFCapsuleType = "SDFCapsule";
type SDFSegmentType = "SDFSegment";
type SDFSphereType = "SDFSphere";
type SDFPrimitiveType = "SDFPrimitive" | SDFPointType | SDFCapsuleType | SDFSegmentType | SDFSphereType;
/**
 *  This class implements an abstract primitive class for signed distance field.
 *  SDFPrimitive subclasses must define a scalar field being the distance to a geometry.
 *  @constructor
 *  @extends {Element}
 */
declare abstract class SDFPrimitive extends Element {
    static type: SDFPrimitiveType;
    constructor();
    /**
     * @return Type of the element
     */
    getType(): SDFPrimitiveType;
    /**
     * @link Element.computeAABB for a complete description.
     */
    computeAABB(): void;
    /**
     * Return the bounding box of the node for a given maximum distance.
     * Ie, the distance field is greater than d everywhere outside the returned box.
     * @param d Distance
     * @abstract
     */
    abstract computeDistanceAABB(d: number): Box3;
    getAreas(): {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     * @param d Distance to consider for the area computation.
     */
    abstract getDistanceAreas(d: number): {
        aabb: Box3;
        bv: Area;
        obj: SDFPrimitive;
    }[];
    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     *
     * @param p
     */
    distanceTo: (this: SDFPrimitive, p: Vector3) => number;
    /**
     * @link see Element.heuristicStepWithin for a complete description.
     */
    heuristicStepWithin(): number;
    destroy(): void;
}

type SDFCapsuleJSON = {
    p1: {
        x: number;
        y: number;
        z: number;
    };
    r1: number;
    p2: {
        x: number;
        y: number;
        z: number;
    };
    r2: number;
} & SDFPrimitiveJSON;
/**
 *  This primitive implements a distance field to an extended "capsule geometry", which is actually a weighted segment.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @constructor
 *  @extends SDFPrimitive
 */
declare class SDFCapsule extends SDFPrimitive {
    static type: SDFCapsuleType;
    fromJSON(json: SDFCapsuleJSON): SDFCapsule;
    p1: Vector3;
    p2: Vector3;
    r1: number;
    r2: number;
    rdiff: number;
    unit_dir: Vector3;
    lengthSq: number;
    length: number;
    /**
     *  @param p1 Position of the first segment extremity
     *  @param p2 Position of the second segment extremity
     *  @param r1 Radius of the sphere centered in p1
     *  @param r2 Radius of the sphere centered in p2
     */
    constructor(p1: Vector3, p2: Vector3, r1: number, r2: number);
    /**
     *  @return Type of the element
     */
    getType(): SDFCapsuleType;
    toJSON(): SDFCapsuleJSON;
    /**
     *  @param r1 The new radius at p1
     */
    setRadius1(r1: number): void;
    /**
     *  @param r2 The new radius at p2
     */
    setRadius2(r2: number): void;
    /**
     *  @return Current radius at p1
     */
    getRadius1(): number;
    /**
     *  @return Current radius at p2
     */
    getRadius2(): number;
    /**
     *  @param p1 The new position of the first segment point.
     */
    setPosition1(p1: Vector3): void;
    /**
     *  @param p2 The new position of the second segment point
     */
    setPosition2(p2: Vector3): void;
    /**
     *  @return Current position of the first segment point
     */
    getPosition1(): Vector3;
    /**
     *  @return Current position of the second segment point
     */
    getPosition2(): Vector3;
    computeDistanceAABB(d: number): Box3;
    /**
     * @link Element.prepareForEval for a complete description
     */
    prepareForEval(): void;
    /**
     * @return The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d: number): {
        aabb: Box3;
        bv: AreaCapsule;
        obj: SDFCapsule;
    }[];
    /**
     *  @link Element.value for a complete description
     */
    value: (this: SDFCapsule, p: Vector3, res: ValueResultType) => void;
}

type SDFNodeJSON = NodeJSON;
/**
 *  This class implements an abstract Node class for Signed Distance Field.
 *  The considered primitive is at distance = 0.
 *  Convention is : negative value inside the surface, positive value outside.
 *  @constructor
 *  @extends {Node}
 */
declare class SDFNode extends Node {
    static type: SDFNodeType;
    children: (SDFNode | SDFPrimitive)[];
    constructor();
    getType(): SDFNodeType;
    computeAABB(): void;
    /**
     *  Return the bounding box of the node for a given maximum distance.
     *  Ie, the distance field is greater than d everywhere outside the returned box.
     *  @abstract
     *  @param d Distance
     */
    computeDistanceAABB(d: number): Box3;
    addChild(c: SDFNode | SDFPrimitive): this;
    /**
     *  SDF Field are infinite, so Areas do not make sense except for the SDFRoot, which will
     *  usually apply a compact kernel to the distance field.
     *  @abstract
     */
    getAreas(): {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     * @param d Distance to consider for the area computation.
     */
    getDistanceAreas(d: number): {
        aabb: Box3;
        bv: Area;
        obj: SDFPrimitive;
    }[];
    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     * @param _p Point
     */
    distanceTo(_p: Vector3): number;
    heuristicStepWithin(): number;
    prepareForEval(): void;
    value(_p: Vector3, _res: ValueResultType): void;
}

type SDFPointJSON = {
    p: {
        x: number;
        y: number;
        z: number;
    };
    acc: number;
} & SDFPrimitiveJSON;
declare class SDFPoint extends SDFPrimitive {
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

type SDFRootNodeJSON = {
    f: DistanceFunctorJSON;
    sdfRoot: SDFNodeJSON;
} & PrimitiveJSON;
type SDFRootNodeType = "SDFRootNode";
/**
 *  This class implements a SDF Root Node, which is basically a Signed Distance Field
 *  made of some node combination, on which is applied a compact support function.
 *  For now SDF nodes do not have materials. A unique material is defined in the SDFRootNode.
 */
declare class SDFRootNode extends Primitive {
    static type: SDFRootNodeType;
    f: DistanceFunctor;
    sdfRoot: SDFNode;
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    static fromJSON(json: SDFRootNodeJSON): SDFRootNode;
    /**
     * @param f The distance function to be applied to the distance field.
     * It must respect the Blobtree convention, which is : positive everywhere, with a finite support.
     * @param material The material for this node.
     * @param sdfRoot The child containing the complete SDF. SDFRootNode can have only one child.
     */
    constructor(f: DistanceFunctor, material?: Material, sdfRoot?: SDFNode | SDFPrimitive);
    getType(): SDFRootNodeType;
    addChild(c: SDFNode | SDFPrimitive): void;
    removeChild(c: SDFNode | SDFPrimitive): void;
    toJSON(): SDFRootNodeJSON;
    prepareForEval(): void;
    /**
     *  @link Element.getAreas for a complete description
     *
     *  This function is an attempt to have SDFRootNode behave like a Primitive in the normal Blobtree.
     */
    getAreas(): {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     *  @link Node.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
    computeHelpVariables(): void;
    heuristicStepWithin(): number;
}

type SDFSegmentJSON = {
    p1: {
        x: number;
        y: number;
        z: number;
    };
    p2: {
        x: number;
        y: number;
        z: number;
    };
    acc: number;
} & SDFPrimitiveJSON;
declare class SDFSegment extends SDFPrimitive {
    static type: SDFSegmentType;
    static fromJSON(json: SDFSegmentJSON): SDFSegment;
    p1: Vector3;
    p2: Vector3;
    acc: number;
    l: Line3;
    /**
    *  @param p1 Position of the first segment extremity
    *  @param p2 Position of the second segment extremity
    *  @param acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
    */
    constructor(p1: Vector3, p2: Vector3, acc: number);
    getType(): SDFSegmentType;
    toJSON(): SDFSegmentJSON;
    /**
     *  @param acc The new accuracy factor
     */
    setAccuracy(acc: number): void;
    /**
     *  @return Current accuracy factor
     */
    getAccuracy(): number;
    /**
     *  @param  p1 The new position of the first segment point.
     */
    setPosition1(p1: Vector3): void;
    /**
     *  @param p2 The new position of the second segment point
     */
    setPosition2(p2: Vector3): void;
    /**
     *  @return Current position of the first segment point
     */
    getPosition1(): Vector3;
    /**
     *  @return Current position of the second segment point
     */
    getPosition2(): Vector3;
    computeDistanceAABB(d: number): Box3;
    prepareForEval(): void;
    /**
     * @return The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d: number): {
        aabb: Box3;
        bv: AreaCapsule;
        obj: SDFSegment;
    }[];
    /**
     *  @link Element.value for a complete description
     */
    value: (this: SDFSegment, p: Vector3, res: ValueResultType) => void;
}

type SDFSphereJSON = {
    p: {
        x: number;
        y: number;
        z: number;
    };
    r: number;
} & SDFPrimitiveJSON;
declare class SDFSphere extends SDFPrimitive {
    static type: SDFSphereType;
    static fromJSON(json: SDFSphereJSON): SDFSphere;
    p: Vector3;
    r: number;
    /**
     *  @param  p Position (ie center) of the sphere
     *  @param  r Radius of the sphere
     */
    constructor(p: Vector3, r: number);
    getType(): SDFSphereType;
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

type PrimitiveJSON = {
    materials: MaterialJSON[];
} & ElementJSON;
type PrimitiveType = "Primitive" | ScalisPrimitiveType | SDFRootNodeType;
/**
 *  Represent a blobtree primitive.
 *
 *  @constructor
 *  @extends {Element}
 */
declare abstract class Primitive extends Element {
    static type: PrimitiveType;
    static fromJSON(_json: PrimitiveJSON): void;
    materials: Material[];
    constructor();
    toJSON(): PrimitiveJSON;
    /**
     *  @param  mats Array of materials to set. they will be copied to the primitive materials
     */
    setMaterials(mats: Material[]): void;
    /**
     *  @return Current primitive materials
     */
    getMaterials(): Material[];
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB(): void;
    /**
     *  @abstract
     *  Destroy the current primitive and remove it from the blobtree (basically
     *  clean up the links between blobtree elements).
     */
    destroy(): void;
    /**
     * @abstract
     */
    getAreas(): {
        aabb: THREE.Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     * @abstract
     * Compute variables to help with value computation.
     */
    abstract computeHelpVariables(): void;
    /**
     * @abstract
     * Compute variables to help with value computation.
     * @param cls The class to count. Primitives have no children so no complexty here.
     */
    count(cls: Function): 1 | 0;
}

type ScalisPrimitiveVolType = "dist" | "convol";
type ScalisPrimitiveJSON = {
    v: Array<ScalisVertexJSON>;
    volType: ScalisPrimitiveVolType;
} & PrimitiveJSON;
type ScalisPointType = "ScalisPoint";
type ScalisSegmentType = "ScalisSegment";
type ScalisTriangleType = "ScalisTriangle";
type ScalisPrimitiveType = "ScalisPrimitive" | ScalisPointType | ScalisSegmentType | ScalisTriangleType;
/**
 *  Represent an implicit primitive respecting the SCALIS model developed by Cedric Zanni
 *
 *  @constructor
 *  @extends {Primitive}
 */
declare abstract class ScalisPrimitive extends Primitive {
    static type: ScalisPrimitiveType;
    static DIST: "dist";
    static CONVOL: "convol";
    volType: ScalisPrimitiveVolType;
    v: ScalisVertex[];
    constructor();
    /**
     *  @return Type of the element
     */
    getType(): ScalisPrimitiveType;
    /**
     *  @return {ScalisPrimitiveJSON}
     */
    toJSON(): ScalisPrimitiveJSON;
    /**
     *  @abstract Specify if the voltype can be changed
     *  @return True if and only if the VolType can be changed.
     */
    mutableVolType(): boolean;
    /**
     *  @param vt New VolType to set (Only for SCALIS primitives)
     */
    setVolType(vt: "dist" | "convol"): void;
    /**
     *  @return  Current volType
     */
    getVolType(): ScalisPrimitiveVolType;
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB(): void;
}

type SegParam = {
    norm: number;
    diffThick: number;
    dir: Vector3;
    v: [ScalisVertex, ScalisVertex];
    ortho_vec_x: number;
    ortho_vec_y: number;
};
type ScalisVertexJSON = {
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
declare class ScalisVertex {
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

/**
 *  Bounding area for the triangle.
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere for now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 *  @extends {Area}
 */
declare class AreaScalisTri extends Area {
    tmpVect: Vector3;
    min_thick: number;
    max_thick: number;
    v: [ScalisVertex, ScalisVertex, ScalisVertex];
    p0p1: Vector3;
    p2p0: Vector3;
    unit_normal: Vector3;
    main_dir: Vector3;
    equal_weights: boolean;
    segParams: SegParam[];
    segAttr: {
        p0_to_p: Vector3;
        p0_to_p_sqrnorm: number;
        x_p_2D: number;
        y_p_2D: number;
        y_p_2DSq: number;
        p_proj_x: number;
    };
    planeParams: {
        orig: Vector3;
        n: Vector3;
    }[];
    segAreas: AreaScalisSeg[];
    /**
     *  @param v Array or vertices
     *  @param unit_normal Normal to the plane made by the 3 vertices, as a Vector3
     *  @param main_dir Main direction depending on thicknesses
     *  @param min_thick Minimum thickness in the Triangle
     *  @param max_thick Maximum thickness in the triangle
     */
    constructor(v: [ScalisVertex, ScalisVertex, ScalisVertex], unit_normal: Vector3, main_dir: Vector3, segParams: SegParam[], min_thick: number, max_thick: number);
    /**
     *  Compute projection (used in other functions)
     *  @param p Point to proj
     *  @param segParams A seg param object
     *
     *  @protected
     */
    protected proj_computation(p: Vector3, segParams: SegParam): void;
    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @return true if the sphere and the area intersect
     */
    sphereIntersect(sphere: AreaSphereParam$2): boolean;
    /**
     *  Adapted from the segment sphere intersection. Could be factorised!
     *  @return true if the sphere and the area intersect
     *
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param segParams A segParams object containing data for a segment
     *  @param KS Kernel Scale, ie ScalisMath.KS (Why is it a parameter, its global!?)
     *
     */
    sphereIntersectSegment(sphere: AreaSphereParam$2, segParams: any, KS: number): boolean;
    /**
     * @link Area.contains for a complete description
     * @param p
     */
    contains: (this: AreaScalisTri, p: Vector3) => boolean;
    /**
     *  Copied from AreaSeg.getAcc
     *
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param segParams A segParams object containing data for a segment area
     *
     *  @return Object containing intersect (boolean) and currAcc (number) attributes
     */
    getAccSegment(sphere: AreaSphereParam$2, segParams: any): {
        intersect: boolean;
        currAcc: number;
    };
    /**
     *  Get accuracy for the inner triangle (do not consider segment edges)
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     */
    getAccTri(sphere: AreaSphereParam$2): number;
    /**
     *  @link Area.getAcc for a complete description
     *
     *  @return the accuracy needed in the intersection zone
     *
     *  @param sphere  A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor  the ratio to determine the wanted accuracy.
     *
     *  @todo Check the Maths
     */
    getAcc(sphere: AreaSphereParam$2, factor: number): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere: AreaSphereParam$2): number;
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere: AreaSphereParam$2): number;
    /**
     *  @link Area.getRawAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere: AreaSphereParam$2): number;
    /**
     * @link Area.getMinAcc
     */
    getMinAcc(): number;
    /**
     * @link Area.getMinRawAcc
     * @return number
     */
    getMinRawAcc: () => number;
    /**
     *  Return the minimum accuracy required at some point on the given axis.
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis: Coordinate, t: number): number;
}

/**
 * Computed values will be stored here. Each values should exist and be allocated already.
 * @property v Value, must be defined
 * @property m Material, must be allocated and defined if wanted
 * @property g Gradient, must be allocated and defined if wanted
 * @property step ??? Not sure, probably a "safe" step for raymarching
 * @property stepOrtho ??? Same as step but in orthogonal direction ?
 */
type ValueResultType = {
    v: number;
    m?: Material | null;
    g?: Vector3 | null;
    step?: number;
    stepOrtho?: number;
};
type ElementType = "Element" | NodeType | PrimitiveType | SDFPrimitiveType;
type ElementJSON = {
    type: string;
};
/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @class
 *  @constructor
 */
declare abstract class Element {
    static type: ElementType;
    static fromJSON(_json: ElementJSON): void;
    id: number;
    aabb: Box3;
    valid_aabb: boolean;
    parentNode: Node | null;
    constructor();
    /**
     *  Return a Javscript Object respecting JSON convention.
     *  All classes must defined it.
     */
    toJSON(): ElementJSON;
    /**
     *  Clone the object.
     */
    clone(): Element;
    /**
     *  @return The parent node of this primitive.
     */
    getParentNode(): Node | null;
    /**
     *  @return Type of the element
     */
    getType(): ElementType;
    /**
     *  Perform precomputation that will help to reduce future processing time,
     *  especially on calls to value.
     *  @protected
     */
    computeHelpVariables(): void;
    /**
     *  @abstract
     *  Compute the Axis Aligned Bounding Box (AABB) for the current primitive.
     *  By default, the AABB returned is the unionns of all vertices AABB (This is
     *  good for almost all basic primitives).
     */
    abstract computeAABB(): void;
    /**
     *  @return The AABB of this Element (primitive or node). WARNING : call
     *  isValidAABB before to ensure the current AABB does correspond to the primitive
     *  settings.
     */
    getAABB(): Box3;
    /**
     *  @return True if the current aabb is valid, ie it does
     *  correspond to the internal primitive parameters.
     */
    isValidAABB(): boolean;
    /**
     *  Invalid the bounding boxes recursively up to the root
     */
    invalidAABB(): void;
    /**
     *  Note : This function was made for Node to recursively invalidate
     *  children AABB. Default is to invalidate only this AABB.
     */
    invalidAll(): void;
    /**
     *  @abstract
     *  Prepare the element for a call to value.
     *  Important note: For now, a primitive is considered prepared for eval if and only
     *                  if its bounding box is valid (valid_aabb is true).
     */
    abstract prepareForEval(): void;
    /**
     *  @abstract
     *  Compute the value and/or gradient and/or material
     *  of the element at position p in space. return computations in res (see below)
     *
     *  @param p Point where we want to evaluate the primitive field
     */
    abstract value(p: Vector3, res: ValueResultType): void;
    /**
     * @param p The point where we want the numerical gradient
     * @param res The resulting gradient
     * @param epsilon The step value for the numerical evaluation
     */
    numericalGradient: (this: Element, p: Vector3, res: Vector3, epsilon: number) => void;
    /**
     *  @abstract
     *  Get the Area object.
     *  Area objects do provide methods useful when rasterizing, raytracing or polygonizing
     *  the area (intersections with other areas, minimum level of detail needed to
     *  capture the feature nicely, etc etc...).
     *  @returns The Areas object corresponding to the node/primitive, in an array
     */
    getAreas(): {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     *  @abstract
     *  This function is called when a point is outside of the potential influence of a primitive/node.
     *  @param  _p
     *  @return  The next step length to do with respect to this primitive/node
     */
    distanceTo(_p: Vector3): number;
    /**
     *  @abstract
     *  This function is called when a point is within the potential influence of a primitive/node.
     *  @return The next step length to do with respect to this primitive/node.
     */
    abstract heuristicStepWithin(): number;
    /**
     *  Trim the tree to keep only nodes influencing a given bounding box.
     *  The tree must be prepared for eval for this process to be working.
     *  Default behaviour is doing nothing, leaves cannot be sub-trimmed, only nodes.
     *  Note : only the root can untrim
     *
     *  @param _aabb
     *  @param _trimmed Array of trimmed Elements
     *  @param _parents Array of fathers from which each trimmed element has been removed.
     */
    trim(_aabb: Box3, _trimmed: Element[], _parents: Node[]): void;
    /**
     *  count the number of elements of class cls in this node and subnodes
     *  @param  _cls the class of the elements we want to count
     *  @return  The number of element of class cls
     */
    count(_cls: Function): number;
    abstract destroy(): void;
}

type NodeJSON = {
    children: ElementJSON[];
} & ElementJSON;
type RicciNodeType = "RicciNode";
type RootNodeType = "RootNode";
type ScaleNodeType = "ScaleNode";
type TwistNodeType = "TwistNode";
type DifferenceNodeType = "DifferenceNode";
type MaxNodeType = "MaxNode";
type MinNodeType = "MinNode";
type SDFNodeType = "SDFNode";
type NodeType = "Node" | RicciNodeType | RootNodeType | ScaleNodeType | TwistNodeType | DifferenceNodeType | MaxNodeType | MinNodeType | SDFNodeType;
/**
 *  This class implements an abstract Node class for implicit blobtree.
 *  @constructor
 *  @extends {Element}
 */
declare abstract class Node extends Element {
    children: Element[];
    static type: NodeType;
    static fromJSON(_json: NodeJSON): Node;
    constructor();
    getType(): NodeType;
    toJSON(): NodeJSON;
    /**
     *  Clone current node and its hierarchy
     */
    clone(): this;
    /**
     *  @link Element.prepareForEval
     */
    abstract prepareForEval(): void;
    /**
     *  Invalid the bounding boxes recursively down for all children
     */
    invalidAll(): void;
    /**
     *  Destroy the node and its children. The node is removed from the blobtree
     *  (basically clean up the links between blobtree elements).
     */
    destroy(): void;
    /**
     *  Only works with nary nodes, otherwise a set function would be more appropriate.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  If c already belongs to the tree, it is removed from its current parent
     *  children list before anything (ie it is "moved").
     *
     *  @param c The child to add.
     */
    addChild(c: Element): this;
    /**
     *  Only works with n-ary nodes, otherwise order matters and we therefore
     *  have to set "null" and node cannot be evaluated.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  WARNING:
     *      Should only be called when a Primitive is deleted.
     *      Otherwise :
     *          To move a node to another parent : use addChild.
     *  @param c The child to remove.
     */
    removeChild(c: Element): void;
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB(): void;
    /**
     *  @link Element.getAreas for a complete description
     *  @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas(): {
        aabb: Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     * @link Element.distanceTo for a complete description
     */
    distanceTo(p: Vector3): number;
    /**
     * @returns
     */
    heuristicStepWithin(): number;
    /**
     *  @link Element.trim for a complete description.
     */
    trim(aabb: Box3, trimmed: Element[], parents: Node[]): void;
    /**
     *  @link Element.count for a complete description.
     */
    count(cls: Function): number;
}

type DifferenceNodeJSON = {
    alpha: number;
} & NodeJSON;
/**
 *  This class implement a difference blending node.
 *  The scalar field of the second child of this node will be substracted to the first node field.
 *  The result is clamped to 0 to always keep a positive field value.
 *  @constructor
 *  @extends Node
 */
declare class DifferenceNode extends Node {
    alpha: number;
    clamped: number;
    tmp_res0: ValueResultType;
    tmp_res1: ValueResultType;
    g0: Vector3;
    m0: Material;
    g1: Vector3;
    m1: Material;
    tmp_v_arr: Float32Array;
    tmp_m_arr: [Material | null, Material | null];
    static type: DifferenceNodeType;
    static fromJSON(json: DifferenceNodeJSON): DifferenceNode;
    /**
     *
     *  @param node0 The first node
     *  @param node1 The second node, its value will be substracted to the node 0 value.
     *  @param alpha Power of the second field : the greater alpha the sharper the difference. Default is 1, must be > 1.
     */
    constructor(node0: Node, node1: Node, alpha: number);
    getAlpha(): number;
    setAlpha(alpha: number): void;
    toJSON(): DifferenceNodeJSON;
    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval(): void;
    /**
     *  Compute the value and/or gradient and/or material
     *  of the element at position p in space. return computations in res (see below)
     *
     *  @param p Point where we want to evaluate the primitive field
     *  @param res Computed values will be stored here. Each values should exist and
     *                       be allocated already.
     *  @param res.v Value, must be defined
     *  @param res.m Material, must be allocated and defined if wanted
     *  @param res.g Gradient, must be allocated and defined if wanted
     *  @param res.step The next step we can safely walk without missing the iso (0). Mostly used for convergence function or ray marching.
     *  @param res.stepOrtho
     */
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  @link Element.trim for a complete description.
     *
     *  Trim must be redefined for DifferenceNode since in this node we cannot trim one of the 2 nodes without trimming the other.
     */
    trim(aabb: Box3, trimmed: Element[], parents: Node[]): void;
}

type MaxNodeJSON = NodeJSON;
/**
 *  This class implement a Max node.
 *  It will return the maximum value of the field of each primitive.
 *  Return 0 in region were no primitive is present.
 *  @class MaxNode
 *  @extends Node
 */
declare class MaxNode extends Node {
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;
    static type: MaxNodeType;
    static fromJSON(json: MaxNodeJSON): MaxNode;
    /**
     *  @constructor
     *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
     */
    constructor(children?: Node[]);
    getType(): MaxNodeType;
    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval(): void;
    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
}

type MinNodeJSON = NodeJSON;
/**
 *  This class implement a Min node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
declare class MinNode extends Node {
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;
    static type: MinNodeType;
    static fromJSON(json: MinNodeJSON): MinNode;
    /**
    *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children?: Node[]);
    getType(): MinNodeType;
    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval(): void;
    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  @link Element.trim for a complete description.
     */
    trim(aabb: Box3, trimmed: Element[], parents: Node[]): void;
}

type RicciNodeJSON = {
    ricci_n: number;
} & NodeJSON;
/**
 *  This class implement a n-ary blend node which use a Ricci Blend.
 *  Ricci blend is : v = k-root( Sum(c.value^k) ) for all c in node children.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
declare class RicciNode extends Node {
    ricci_n: number;
    tmp_v_arr: Float32Array;
    tmp_m_arr: Material[];
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;
    static type: RicciNodeType | RootNodeType;
    /**
     *  @param ricci_n The value for ricci
     *  @param children The children to add to this node. Just a convenient parameter, you can do it manually using addChild
     */
    constructor(ricci_n: number, children?: Node[]);
    /**
     * @link Node.getType
     */
    getType(): RicciNodeType | RootNodeType;
    /**
     * @link Node.toJSON
     */
    toJSON(): RicciNodeJSON;
    /**
     * @link Node.fromJSON
     */
    static fromJSON(json: RicciNodeJSON): RicciNode;
    /**
     * @link Node.prepareForEval
     */
    prepareForEval(): void;
    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
    setRicciN(n: number): void;
    getRicciN(): number;
}

type RootNodeJSON = {
    iso: number;
} & RicciNodeJSON;
interface IntersectionResult {
    distance?: number;
    point: Vector3;
    g?: Vector3;
}
/**
 *  The root of any implicit blobtree. Does behave computationaly like a RicciNode with n = 64.
 *  The RootNode is the only node to be its own parent.
 *  @constructor
 *  @extends RicciNode
 */
declare class RootNode extends RicciNode {
    iso_value: number;
    trimmed: Element[];
    trim_parents: Node[];
    static type: RootNodeType;
    static fromJSON(json: RootNodeJSON): RootNode;
    constructor();
    /**
     * @link Node.getType
     */
    getType(): RootNodeType;
    /**
     * @link RicciNode.toJSON
     */
    toJSON(): RootNodeJSON;
    getIsoValue(): number;
    setIsoValue(v: number): void;
    /**
     *  @return The neutral value of this tree, ie the value of the field in empty region of space.
     *                   This is an API for external use and future development. For now it is hard set to 0.
     */
    getNeutralValue(): number;
    /**
     * @link Node.invalidAABB for a complete description
     */
    invalidAABB(): void;
    /**
     *  Basically perform a trim but keep track of trimmed elements.
     *  This is usefull if you want to trim, then untrim, then trim, etc...
     *  For example, this is very useful for evaluation optimization.
     */
    internalTrim(aabb: Box3): void;
    /**
     *  Wrapper for trim, will help programmers to make the difference between
     *  internal and external trim.
     *  @param trimmed Array of trimmed Elements
     *  @param parents Array of fathers from which each trimmed element has been removed.
     */
    externalTrim(aabb: Box3, trimmed: Element[], parents: Node[]): void;
    /**
     *  Reset the full blobtree
     */
    internalUntrim(): void;
    /**
     *  Reset the full blobtree given previous trimming data.
     *  Note : don't forget to recall prepareForEval if you want to perform evaluation.
     *  @param trimmed Array of trimmed Elements
     *  @param parents Array of fathers from which each trimmed element has been removed.
     */
    untrim(trimmed: Element[], parents: Node[]): void;
    /**
     *  Tell if the blobtree is empty
     *  @return true if blobtree is empty
     */
    isEmpty(): boolean;
    intersectRayBlob: (this: RootNode, ray: Ray, res: IntersectionResult, maxDistance: number, _precision: number) => boolean;
    /**
     *  Kaiser function for some intersection and raycasting...
     *  Undocumented.
     *  TODO : check, it is probably an optimized intersection for blob intersection
     *         in X, Y or Z directions.
     */
    intersectOrthoRayBlob: (this: RootNode, wOffset: number, hOffset: number, res: IntersectionResult[], dim: {
        axis: {
            x: boolean;
            y: boolean;
            z: boolean;
        };
        get: (v: Vector3) => number;
        add: (v: Vector3, s: number) => void;
        divide: (v: Vector3, s: number) => void;
    }) => void;
}

type ScaleNodeJSON = {
    scale_x: number;
    scale_y: number;
    scale_z: number;
} & NodeJSON;
/**
 *  This class implement a ScaleNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
declare class ScaleNode extends Node {
    _scale: Vector3;
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;
    static type: ScaleNodeType;
    /**
    *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children?: Node[]);
    /**
    * @link Node.toJSON
    */
    toJSON(): ScaleNodeJSON;
    /**
     * @link Node.fromJSON
     */
    static fromJSON(json: ScaleNodeJSON): ScaleNode;
    /**
     * @link ScaleNode.setScale
     */
    setScale(scale: Vector3): void;
    /**
     * @link Node.getType
     */
    getType(): ScaleNodeType;
    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval(): void;
    /**
    * @link Element.computeAABB for a complete description
    */
    computeAABB(): void;
    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  @link Element.trim for a complete description.
     */
    trim(aabb: Box3, trimmed: Element[], parents: Node[]): void;
}

type TwistNodeJSON = {
    twist_amount: number;
    axis_x: number;
    axis_y: number;
    axis_z: number;
} & NodeJSON;
/**
 *  This class implement a TwistNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
declare class TwistNode extends Node {
    _twist_amount: number;
    _twist_axis: Vector3;
    _twist_axis_mat: Matrix4;
    _twist_axis_mat_inv: Matrix4;
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;
    static type: TwistNodeType;
    /**
    *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children?: Node[]);
    /**
    * @link Node.toJSON
    */
    toJSON(): TwistNodeJSON;
    /**
     *@link Node.fromJSON
     */
    static fromJSON(json: TwistNodeJSON): TwistNode;
    setTwistAmount(amount: number): void;
    setTwistAxis(axis: Vector3): void;
    _computeTransforms(): void;
    getType(): TwistNodeType;
    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval(): void;
    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
    /**
     *  @link Element.trim for a complete description.
     */
    trim(aabb: Box3, trimmed: Element[], parents: Node[]): void;
}

type Types = {
    types: {
        [key: string]: {
            fromJSON: Function;
        };
    };
    register(name: string, cls: {
        fromJSON: Function;
    }): void;
    fromJSON(json: {
        type: string;
        [key: string]: any;
    }): any;
};
/**
 *  Keep track of all Types added to the Blobtree library.
 *  For now just a list of strings registered by the classes.
 */
declare const Types: Types;

/**
 * Accuracies Contains the accuracies needed in Areas. Can be changed when importing blobtree.js.
 * For classic segments and sphere, we setteled for a raw accuracy being proportional to
 * the radii. 1/3 of the radius is considered nice, 1 radius is considered raw.
 * For new primitives, feel free to create your own accuracies factors depending on the features.
 */
declare const Accuracies: {
    /**
     * Factor for the nice accuracy needed to represent the features nicely
     * @type {number}
     */
    nice: number;
    /**
     * Factor for the raw accuracy needed to represent the features roughly
     * @type {number}
     */
    raw: number;
    /**
     * Current accuracy factor, should be between Accuracies.nice and Accuracies.raw.
     * It will be the one used by rendering algorithms to decide to stop even if nice accuracy has not been reached.
     * @type {number}
     *
     */
    curr: number;
};

/**
 * @typedef {0|1|2|3|4|5|6|7} EdgeIndex
 * @typedef {[EdgeIndex, EdgeIndex]} EdgeIndexPair
 * @typedef {0|1} TopoValue
 * @typedef {[TopoValue, TopoValue, TopoValue]} TopoTriple
 */
type EdgeIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type EdgeIndexPair = [EdgeIndex, EdgeIndex];
type TopoValue = 0 | 1;
type TopoTriple = [TopoValue, TopoValue, TopoValue];
type MarchinCubeTables = {
    EdgeVMap: EdgeIndexPair[];
    VertexTopo: TopoTriple[];
};
/**
 * Tables for Marching Cube
 */
declare const Tables: MarchinCubeTables;

interface SMCParams {
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
interface ConvergenceParams {
    /**
     * A ratio of a the marching cube grid size defining the wanted geometrical accuracy.
     * Must be lower than 1, default is 0.01.
     */
    ratio: number;
    /**
     * The newton process will stop either when the threshold of ratio*cube_size is matched,
     * or the number of steps allowed has been reached. Default is 10.
     */
    step: number;
}
interface VertexData {
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
interface ResultingGeometry {
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
declare class SlidingMarchingCubes {
    blobtree: RootNode;
    uniformZ: boolean;
    detail_ratio: number;
    convergence: ConvergenceParams | null;
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

/**
 * Parameters for the subpolygonizer to use.
 * Contain a className which will be mapped to a constructor, and parameters related to that polygonizer
 */
type SubPolygonizerParams = {
    className: "SlidingMarchingCubes";
    smcParams: SMCParams;
};
type SplitMaxPolygonizerParams = {
    subPolygonizer?: SubPolygonizerParams;
    uniformRes?: boolean;
    progress?: (percent: number) => void;
    ricciThreshold?: number;
};
/**
 *  This class will polygonize nodes independantly when they blend with a MaxNode or a RicciNode
 *  (for RicciNode, only if the coefficient of at least "ricciThreshold", threshold being a parameter).
 *  It will create a mesh made of several shells but intersections will be better looking than with some
 *  global polygonizers like MarchingCubes.
 */
declare class SplitMaxPolygonizer {
    private blobtree;
    private uniformRes;
    private min_acc;
    private minAccs;
    private subPolygonizer;
    readonly ricciThreshold: number;
    private progress;
    private subtrees;
    private progCoeff;
    private totalCoeff;
    constructor(blobtree: RootNode, smpParams: SplitMaxPolygonizerParams);
    setBlobtree(blobtree: RootNode): void;
    compute(): three.BufferGeometry;
}

/**
 * metaBlobtree is The blobtree from which normals will be computed.
 * Usually a blobtree containing blobtree.
 */
interface SplitSMCParams extends SMCParams {
    metaBlobtree: RootNode;
}
/**
 *  A special SlidingMarchingCubes with a different function
 *  to compute vertex normal in a cell.
 *  In this polygnizer, we suppose the blobtree used for marching
 *  is not the complete blobtree and we want to use the normal from
 *  the complete blobtree.
 */
declare class SplitSMC extends SlidingMarchingCubes {
    metaBlobtree: RootNode;
    constructor(blobtree: RootNode, params: SplitSMCParams);
    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex: (this: SlidingMarchingCubes) => void;
}

/**
 * @author Maxime Quiblier
 */

type SafeNewton1DResult = {
    p: Vector3;
    g: Vector3;
    p_absc: number;
};
type Convergence = {
    last_mov_pt: Vector3;
    grad: Vector3;
    eval_res_g: Vector3;
    eval_res: ValueResultType;
    vec: Vector3;
    safeNewton3D(pot: Element, starting_point: Vector3, value: number, epsilon: number, n_max_step: number, r_max: number, res: Vector3): void;
    safeNewton1D(pot: Element, origin: Vector3, search_dir_unit: Vector3, min_absc_inside: number, max_absc_outside: number, starting_point_absc: number, value: number, epsilon: number, n_max_step: number, res: SafeNewton1DResult): void;
    dichotomy1D(pot: Element, origin: Vector3, search_dir_unit: Vector3, startStepLength: number, value: number, epsilon: number, n_max_step: number, res: SafeNewton1DResult): void;
};
declare const Convergence: Convergence;

interface VertexLike {
    getPos: () => Vector3;
    getThickness: () => number;
}
interface TriangleLike extends TriangleComputedAttributes {
    v: VertexLike[];
}
interface TriangleComputedAttributes {
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
interface TriangleLikeDeprecated {
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
declare const TriangleUtils: {
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

declare const version = "1.0.0";

export { Accuracies, Area, AreaCapsule, AreaScalisSeg, AreaScalisTri, AreaSphere, type AreaSphereParam$2 as AreaSphereParam, Convergence, type ConvergenceParams, type Coordinate, DifferenceNode, type DifferenceNodeType, DistanceFunctor, type DistanceFunctorJSON, Element, type ElementJSON, Material, type MaterialJSON, MaxNode, type MaxNodeType, MinNode, type MinNodeType, Node, type NodeJSON, type NodeType, Poly6DistanceFunctor, type Poly6DistanceFunctorJSON, type Poly6DistanceFunctorType, Primitive, type PrimitiveJSON, type PrimitiveType, type ResultingGeometry, RicciNode, type RicciNodeJSON, type RicciNodeType, RootNode, type RootNodeType, SDFCapsule, type SDFCapsuleJSON, type SDFCapsuleType, SDFNode, type SDFNodeJSON, type SDFNodeType, SDFPoint, type SDFPointJSON, type SDFPointType, SDFPrimitive, type SDFPrimitiveJSON, type SDFPrimitiveType, SDFRootNode, type SDFRootNodeJSON, type SDFRootNodeType, SDFSegment, type SDFSegmentJSON, type SDFSegmentType, SDFSphere, type SDFSphereJSON, type SDFSphereType, type SMCParams, ScaleNode, type ScaleNodeType, ScalisMath, ScalisPoint, type ScalisPointJSON, type ScalisPointType, ScalisPrimitive, type ScalisPrimitiveJSON, type ScalisPrimitiveType, type ScalisPrimitiveVolType, ScalisSegment, type ScalisSegmentJSON, type ScalisSegmentType, ScalisTriangle, type ScalisTriangleJSON, type ScalisTriangleType, ScalisVertex, type ScalisVertexJSON, type SegParam, SlidingMarchingCubes, SplitMaxPolygonizer, type SplitMaxPolygonizerParams, SplitSMC, type SplitSMCParams, Tables, type TriangleComputedAttributes, type TriangleLike, type TriangleLikeDeprecated, TriangleUtils, TwistNode, type TwistNodeType, Types, type ValueResultType, type VertexData, version };

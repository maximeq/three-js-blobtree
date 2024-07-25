import { Vector3 } from "three";
import { Area } from "./Area";
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
export declare class AreaScalisSeg extends Area {
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
export {};
//# sourceMappingURL=AreaScalisSeg.d.ts.map
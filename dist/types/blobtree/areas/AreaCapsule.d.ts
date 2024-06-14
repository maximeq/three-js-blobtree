import { Vector3 } from "three";
import { Area, type Coordinate } from "./Area";
interface AreaSphereParam {
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
export declare class AreaCapsule extends Area {
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
    sphereIntersect(sphere: AreaSphereParam): boolean;
    /**
     * @link Area.contains for a complete description
     * @param p
     */
    contains(p: Vector3): boolean;
    /**
     *  @link Area.getAcc for a complete description
     *  @return the accuracy needed in the intersection zone
     *  @param sphere  A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor  the ratio to determine the wanted accuracy.
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
     *  @link Area.getCurrAcc for a complete description
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
export {};
//# sourceMappingURL=AreaCapsule.d.ts.map
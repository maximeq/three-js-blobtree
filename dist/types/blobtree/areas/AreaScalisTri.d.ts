import { Vector3 } from "three";
import { Area, type AreaSphereParam, type Coordinate } from "./Area";
import { AreaScalisSeg } from "./AreaScalisSeg";
import { ScalisVertex } from "../scalis/ScalisVertex";
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
export declare class AreaScalisTri extends Area {
    tmpVect: Vector3;
    min_thick: number;
    max_thick: number;
    v: [ScalisVertex, ScalisVertex, ScalisVertex];
    p0p1: Vector3;
    p2p0: Vector3;
    unit_normal: Vector3;
    main_dir: Vector3;
    equal_weights: boolean;
    segParams: any;
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
    constructor(v: [ScalisVertex, ScalisVertex, ScalisVertex], unit_normal: Vector3, main_dir: Vector3, segParams: any, min_thick: number, max_thick: number);
    /**
     *  Compute projection (used in other functions)
     *  @param p Point to proj
     *  @param segParams A seg param object
     *
     *  @protected
     */
    protected proj_computation(p: Vector3, segParams: any): void;
    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @param sphere
     * @

return true if the sphere and the area intersect
     */
    sphereIntersect(sphere: AreaSphereParam): boolean;
    /**
     *  Adapted from the segment sphere intersection. Could be factorised!
     *  @return true if the sphere and the area intersect
     *
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param segParams A segParams object containing data for a segment
     *  @param KS Kernel Scale, ie ScalisMath.KS (Why is it a parameter, its global!?)
     *
     */
    sphereIntersectSegment(sphere: AreaSphereParam, segParams: any, KS: number): boolean;
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
    getAccSegment(sphere: AreaSphereParam, segParams: any): {
        intersect: boolean;
        currAcc: number;
    };
    /**
     *  Get accuracy for the inner triangle (do not consider segment edges)
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     */
    getAccTri(sphere: AreaSphereParam): number;
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
     * @return number
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
//# sourceMappingURL=AreaScalisTri.d.ts.map
import { Vector3 } from "three";
import { Area, type AreaSphereParam, type Coordinate } from "./Area";
/**
 *  AreaSphere is a general representation of a spherical area.
 *  See Primitive.getArea for more details.
 *
 *  @extends {Area}
 */
export declare class AreaSphere extends Area {
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
    getAcc(_sphere: AreaSphereParam, factor: number): number;
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
//# sourceMappingURL=AreaSphere.d.ts.map
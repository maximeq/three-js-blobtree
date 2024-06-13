import type { Vector3 } from 'three';

export type AreaSphereParam = {
    radius: number;
    center: Vector3;
}

export type Coordinate = 'x' | 'y' | 'z';

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
export abstract class Area {

    /**
     *  @abstract
     *  Test intersection of the shape with a sphere
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return true if the sphere and the area intersect
     */
    abstract sphereIntersect(sphere: AreaSphereParam): boolean;

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
    abstract getAcc(sphere: AreaSphereParam, factor: number): number;

    /**
     *  @abstract
     *  Convenience function, just call getAcc with Nice Accuracy parameters.
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    abstract getNiceAcc(sphere: AreaSphereParam): number;

    /**
     *  @abstract
     *  Convenience function, just call getAcc with Current Accuracy parameters.
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Current accuracy needed in the intersection zone
     */
    abstract getCurrAcc(sphere: AreaSphereParam): number;

    /**
     *  @abstract
     *  Convenience function, just call getAcc with Raw Accuracy parameters.
     *  @param _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    abstract getRawAcc(sphere: AreaSphereParam): number;

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

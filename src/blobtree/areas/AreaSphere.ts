import { Vector3 } from "three";
import { Area, type AreaSphereParam, type Coordinate } from "./Area";
import { Accuracies } from "../accuracies/Accuracies";

/**
 *  AreaSphere is a general representation of a spherical area.
 *  See Primitive.getArea for more details.
 *
 *  @extends {Area}
 */
export class AreaSphere extends Area {
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
    constructor(p: Vector3, r: number, accFactor?: number) {
        super();
        this.p = new Vector3(p.x, p.y, p.z);
        this.r = r;
        this.accFactor = accFactor || 1.0;
    }

    /**
     *  Test intersection of the shape with a sphere
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return true if the sphere and the area intersect
     */
    sphereIntersect = (function () {
        const v = new Vector3();
        return function (this: AreaSphere, sphere: { radius: number, center: Vector3 }): boolean {
            let self = this;
            v.subVectors(sphere.center, self.p);
            const tmp = sphere.radius + self.r;
            return v.lengthSq() < tmp * tmp;
        };
    })();

    /**
     * @link Area.contains for a complete description
     * @param p A point in space, must comply to Vector3 API.
     * @return true if the point is within the area
     */
    contains = (function () {
        const v = new Vector3();
        return function (this: AreaSphere, p: Vector3): boolean {
            let self = this;
            v.subVectors(p, self.p);
            return v.lengthSq() < self.r * self.r;
        };
    })();

    /**
     *  @link Area.getAcc for a complete description
     *  @param _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor The ratio to determine the wanted accuracy.
     *  @return the accuracy needed in the intersection zone
     */
    getAcc(_sphere: AreaSphereParam, factor: number): number {
        return this.r * factor;
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere: AreaSphereParam): number {
        return this.getAcc(sphere, Accuracies.nice * this.accFactor);
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere: AreaSphereParam): number {
        return this.getAcc(sphere, Accuracies.curr * this.accFactor);
    }

    /**
     *  @link Area.getRawAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere: AreaSphereParam): number {
        return this.getAcc(sphere, Accuracies.raw * this.accFactor);
    }

    /**
     * @link Area.getMinAcc
     * @return the minimum accuracy needed in the area
     */
    getMinAcc(): number {
        return Accuracies.curr * this.r * this.accFactor;
    }

    /**
     * @link Area.getMinRawAcc
     * @return the minimum raw accuracy needed in the area
     */
    getMinRawAcc(): number {
        return Accuracies.raw * this.r * this.accFactor;
    }

    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis: Coordinate, t: number): number {
        let step = 100000000;
        const diff = t - this.p[axis];
        if (diff < -2 * this.r) {
            step = Math.min(
                step,
                Math.max(
                    Math.abs(diff + this.r),
                    Accuracies.curr * this.r * this.accFactor
                )
            );
        } else if (diff < 2 * this.r) {
            step = Math.min(
                step,
                Accuracies.curr * this.r * this.accFactor
            );
        }
        return step;
    }
}

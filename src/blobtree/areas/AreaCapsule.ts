import { Vector3 } from "three";
import { Area, type Coordinate } from "./Area";
import { Accuracies } from "../accuracies/Accuracies";

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
export class AreaCapsule extends Area {

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
    constructor(p1: Vector3, p2: Vector3, r1: number, r2: number, accFactor1: number = 1, accFactor2: number = 1) {
        super();
        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.r1 = r1;
        this.r2 = r2;

        this.accFactor1 = accFactor1;
        this.accFactor2 = accFactor2;

        this.unit_dir = new Vector3().subVectors(p2, p1);
        this.length = this.unit_dir.length();
        this.unit_dir.normalize();

        // tmp var for functions below
        this.vector = new Vector3();
        this.p1_to_p = this.vector; // basically the same as above + smart name
        this.p1_to_p_sqrnorm = 0;
        this.x_p_2D = 0;
        this.y_p_2D = 0;
        this.y_p_2DSq = 0;
        this.ortho_vec_x = this.r1 - this.r2; // direction orthogonal to the "line" getting from one weight to the other. Precomputed
        this.ortho_vec_y = this.length;
        this.p_proj_x = 0;
        this.p_proj_y = 0;

        this.abs_diff_thick = Math.abs(this.ortho_vec_x);
    }

    /**
     * Compute some of the tmp variables. Used to factorized other functions code.
     * @param p A point as a Vector3
     * @protected
     */
    proj_computation(p: Vector3): void {
        this.p1_to_p = this.vector;
        this.p1_to_p.subVectors(p, this.p1);
        this.p1_to_p_sqrnorm = this.p1_to_p.lengthSq();
        this.x_p_2D = this.p1_to_p.dot(this.unit_dir);
        // pythagore inc.
        this.y_p_2DSq = this.p1_to_p_sqrnorm - this.x_p_2D * this.x_p_2D;
        this.y_p_2D = this.y_p_2DSq > 0 ? Math.sqrt(this.y_p_2DSq) : 0; // because of rounded errors tmp can be <0 and this causes the next sqrt to return NaN...

        const t = -this.y_p_2D / this.ortho_vec_y;
        // P proj is the point at the intersection of:
        //              - the local X axis (computation in the unit_dir basis)
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        this.p_proj_x = this.x_p_2D + t * this.ortho_vec_x;
        this.p_proj_y = 0.0;
    };

    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @param sphere
     * @return true if the sphere and the area intersect
     */
    sphereIntersect(sphere: AreaSphereParam): boolean {
        this.proj_computation(sphere.center);

        if (this.p_proj_x < 0.0) {
            return (Math.sqrt(this.p1_to_p_sqrnorm) - sphere.radius < this.r1);
        } else {
            if (this.p_proj_x > this.length) {
                this.vector.subVectors(sphere.center, this.p2);
                return (Math.sqrt(this.vector.lengthSq()) - sphere.radius < this.r2);
            } else {
                const sub1 = this.x_p_2D - this.p_proj_x;
                const dist = sub1 * sub1 + this.y_p_2DSq;
                const tt = this.p_proj_x / this.length;
                const inter_w = this.r1 * (1.0 - tt) + tt * this.r2;
                const tmp = sphere.radius + inter_w;
                return (dist < tmp * tmp);
            }
        }
    }

    /**
     * @link Area.contains for a complete description
     */
    contains(p: Vector3): boolean {
        this.proj_computation(p);
        // P proj is the point at the intersection of:
        //              - the X axis
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        if (this.p_proj_x < 0.0) {
            // Proj is before the line segment beginning defined by P0: spherical containment
            return this.p1_to_p_sqrnorm < this.r1 * this.r1;
        } else {
            if (this.p_proj_x > this.length) {
                // Proj is after the line segment beginning defined by P1: spherical containment
                this.vector.subVectors(p, this.p2);
                return this.vector.lengthSq() < this.r2 * this.r2;
            } else {
                // Proj is in between the line segment P1-P0: Linear kind of containment
                const sub1 = this.x_p_2D - this.p_proj_x;
                const sub2 = this.y_p_2D - this.p_proj_y;
                const dist2 = sub1 * sub1 + sub2 * sub2;
                const tt = this.p_proj_x / this.length;
                const inter_w = this.r1 * (1.0 - tt) + tt * this.r2;
                return dist2 < inter_w * inter_w;
            }
        }
    }

    /**
     *  @link Area.getAcc for a complete description
     *  @return the accuracy needed in the intersection zone
     *  @param sphere  A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor  the ratio to determine the wanted accuracy.
     *  @todo Check the Maths
     */
    getAcc(sphere: AreaSphereParam, factor: number): number {
        this.proj_computation(sphere.center);

        const tmp = this.abs_diff_thick / this.length;
        const half_delta = sphere.radius * Math.sqrt(1 + tmp * tmp) * 0.5;

        // we check only the direction where the weight is minimum since
        // we will return minimum accuracy needed in the area.
        let absc = this.p_proj_x;
        absc += this.r1 > this.r2 ? half_delta : -half_delta;

        if (absc < 0.0) {
            return this.r1 * this.accFactor1 * factor;
        } else if (absc > this.length) {
            return this.r2 * this.accFactor2 * factor;
        } else {
            const tt = absc / this.length;
            const inter_w = this.r1 * this.accFactor1 * (1.0 - tt) + tt * this.r2 * this.accFactor2;
            return inter_w * factor;
        }
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere: AreaSphereParam): number {
        return this.getAcc(sphere, Accuracies.nice);
    }

    /**
     *  @link Area.getCurrAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere: AreaSphereParam): number {
        return this.getAcc(sphere, Accuracies.curr);
    }

    /**
     *  @link Area.getRawAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere: AreaSphereParam): number {
        return this.getAcc(sphere, Accuracies.raw);
    }

    /**
     * @link Area.getMinAcc
     * @return
     */
    getMinAcc(): number {
        return Accuracies.curr * Math.min(this.r1 * this.accFactor1, this.r2 * this.accFactor2);
    }

    /**
     * @link Area.getMinRawAcc
     * @return
     */
    getMinRawAcc(): number {
        return Accuracies.raw * Math.min(this.r1 * this.accFactor1, this.r2 * this.accFactor2);
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
        let step = Number.MAX_VALUE;
        const p1 = this.p1[axis] < this.p2[axis] ? this.p1 : this.p2;
        let p2: Vector3, r1: number, r2: number;
        if (p1 === this.p1) {
            p2 = this.p2;
            r1 = this.r1 * this.accFactor1;
            r2 = this.r2 * this.accFactor2;
        } else {
            p2 = this.p1;
            r1 = this.r2;
            r2 = this.r1 * this.accFactor1;
        }

        let diff = t - p1[axis];
        if (diff < -2 * r1) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * r1), Accuracies.curr * r1));
        } else if (diff < 2 * r1) {
            step = Math.min(step, Accuracies.curr * r1);
        }
        diff = t - p2[axis];
        if (diff < -2 * r2) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * r2), Accuracies.curr * r2));
        } else if (diff < 2 * r2) {
            step = Math.min(step, Accuracies.curr * r2);
        }

        const tbis = t - p1[axis];
        const axis_l = p2[axis] - p1[axis];
        if (tbis > 0 && tbis < axis_l && axis_l !== 0) {
            step = Math.min(step, Accuracies.curr * (r1 + (tbis / axis_l) * (r2 - r1)));
        }

        return step;
    }
}

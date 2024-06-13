import { Vector3 } from "three";
import { ScalisMath } from "../scalis/ScalisMath";
import { Area } from "./Area";
import { Accuracies } from "../accuracies/Accuracies";

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
export class AreaScalisSeg extends Area {
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
    constructor(p0: Vector3, p1: Vector3, thick0: number, thick1: number) {
        super();

        this.p0 = new Vector3(p0.x, p0.y, p0.z);
        this.p1 = new Vector3(p1.x, p1.y, p1.z);
        this.thick0 = thick0;
        this.thick1 = thick1;

        this.unit_dir = new Vector3().subVectors(p1, p0);
        this.length = this.unit_dir.length();
        this.unit_dir.normalize();

        // tmp var for functions below
        this.vector = new Vector3();
        this.p0_to_p = this.vector; // basically the same as above + smart name
        this.p0_to_p_sqrnorm = 0;
        this.x_p_2D = 0;
        this.y_p_2D = 0;
        this.y_p_2DSq = 0;
        this.ortho_vec_x = this.thick0 - this.thick1; // direction orthogonal to the "line" getting from one weight to the other. Precomputed
        this.ortho_vec_y = this.length;
        this.p_proj_x = 0;
        this.p_proj_y = 0;

        this.abs_diff_thick = Math.abs(this.ortho_vec_x);
    }

    /**
    * Compute some of the tmp variables.Used to factorized other functions code.
    * @param p A point as a Vector3
    *
    * @protected
    */
    protected proj_computation(p: Vector3): void {
        this.p0_to_p = this.vector;
        this.p0_to_p.subVectors(p, this.p0);
        this.p0_to_p_sqrnorm = this.p0_to_p.lengthSq();
        this.x_p_2D = this.p0_to_p.dot(this.unit_dir);
        // pythagore inc.
        this.y_p_2DSq = this.p0_to_p_sqrnorm - this.x_p_2D * this.x_p_2D;
        this.y_p_2D = this.y_p_2DSq > 0 ? Math.sqrt(this.y_p_2DSq) : 0; // because of rounded errors tmp can be <0 and this causes the next sqrt to return NaN...

        const t = -this.y_p_2D / this.ortho_vec_y;
        // P proj is the point at the intersection of:
        //              - the local X axis (computation in the unit_dir basis)
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        this.p_proj_x = this.x_p_2D + t * this.ortho_vec_x;
        this.p_proj_y = 0.0;
    }

    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @return true if the sphere and the area intersect
     */
    sphereIntersect(sphere: AreaSphereParam): boolean {
        this.proj_computation(sphere.center);

        if (this.p_proj_x < 0.0) {
            return (Math.sqrt(this.p0_to_p_sqrnorm) - sphere.radius < this.thick0 * ScalisMath.KS);
        } else {
            if (this.p_proj_x > this.length) {
                this.vector.subVectors(sphere.center, this.p1);
                return (Math.sqrt(this.vector.lengthSq()) - sphere.radius < this.thick1 * ScalisMath.KS);
            } else {
                const sub1 = this.x_p_2D - this.p_proj_x;
                const dist = sub1 * sub1 + this.y_p_2DSq;
                const tt = this.p_proj_x / this.length;
                const inter_w = this.thick0 * (1.0 - tt) + tt * this.thick1;
                const tmp = sphere.radius + inter_w * ScalisMath.KS;
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
            return this.p0_to_p_sqrnorm < this.thick0 * this.thick0 * ScalisMath.KS2;
        } else {
            if (this.p_proj_x > this.length) {
                // Proj is after the line segment beginning defined by P1: spherical containment
                this.vector.subVectors(p, this.p1);
                return this.vector.lengthSq() < this.thick1 * this.thick1 * ScalisMath.KS2;
            } else {
                // Proj is in between the line segment P1-P0: Linear kind of containment
                const sub1 = this.x_p_2D - this.p_proj_x;
                const sub2 = this.y_p_2D - this.p_proj_y;
                const dist2 = sub1 * sub1 + sub2 * sub2;
                const tt = this.p_proj_x / this.length;
                const inter_w = this.thick0 * (1.0 - tt) + tt * this.thick1;
                return dist2 < inter_w * inter_w * ScalisMath.KS2;
            }
        }
    }

    /**
     *  @link Area.getAcc for a complete description
     *
     *  @param sphere  A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor  the ratio to determine the wanted accuracy.
     *
     *  @return the accuracy needed in the intersection zone
     *  @todo Check the Maths
     */
    getAcc(sphere: AreaSphereParam, factor: number): number {
        this.proj_computation(sphere.center);
        const tmp = this.abs_diff_thick / this.length;
        const half_delta = sphere.radius * Math.sqrt(1 + tmp * tmp) * 0.5;

        // we check only the direction where the weight is minimum since
        // we will return minimum accuracy needed in the area.
        let absc = this.p_proj_x;
        absc += this.thick0 > this.thick1 ? half_delta : -half_delta;

        if (absc < 0.0) {
            return this.thick0 * factor;
        } else if (absc > this.length) {
            return this.thick1 * factor;
        } else {
            const tt = absc / this.length;
            const inter_w = this.thick0 * (1.0 - tt) + tt * this.thick1;
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
     *  @link Area.getNiceAcc for a complete description
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
     */
    getMinAcc(): number {
        return Accuracies.curr * Math.min(this.thick0, this.thick1);
    }

    /**
     * @link Area.getMinRawAcc
     */
    getMinRawAcc(): number {
        return Accuracies.raw * Math.min(this.thick0, this.thick1);
    }

    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis: 'x' | 'y' | 'z', t: number): number {
        let step = Number.MAX_VALUE;
        const p0 = this.p0[axis] < this.p1[axis] ? this.p0 : this.p1;
        let p1, thick0, thick1;
        if (p0 === this.p0) {
            p1 = this.p1;
            thick0 = this.thick0;
            thick1 = this.thick1;
        } else {
            p1 = this.p0;
            thick0 = this.thick1;
            thick1 = this.thick0;
        }

        let diff = t - p0[axis];
        if (diff < -2 * thick0) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * thick0), Accuracies.curr * thick0));
        } else if (diff < 2 * thick0) {
            step = Math.min(step, Accuracies.curr * thick0);
        }
        diff = t - p1[axis];
        if (diff < -2 * thick1) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * thick1), Accuracies.curr * thick1));
        } else if (diff < 2 * thick1) {
            step = Math.min(step, Accuracies.curr * thick1);
        }

        const tbis = t - p0[axis];
        const axis_l = p1[axis] - p0[axis];
        if (tbis > 0 && tbis < axis_l && axis_l !== 0) {
            step = Math.min(step, Accuracies.curr * (thick0 + (tbis / axis_l) * (thick1 - thick0)));
        }

        return step;
    }
}

import { Vector3 } from "three";
import { ScalisMath } from "../scalis/ScalisMath";
import { Area, type AreaSphereParam, type Coordinate } from "./Area";
import { TriangleUtils } from "../../utils/TriangleUtils";
import { Accuracies } from "../accuracies/Accuracies";
import { AreaScalisSeg } from "./AreaScalisSeg";
import { ScalisVertex, type SegParam } from "../scalis/ScalisVertex";

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
export class AreaScalisTri extends Area {
    tmpVect: Vector3 = new Vector3();
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
    planeParams: { orig: Vector3; n: Vector3 }[];
    segAreas: AreaScalisSeg[];

    /**
     *  @param v Array or vertices
     *  @param unit_normal Normal to the plane made by the 3 vertices, as a Vector3
     *  @param main_dir Main direction depending on thicknesses
     *  @param min_thick Minimum thickness in the Triangle
     *  @param max_thick Maximum thickness in the triangle
     */
    constructor(
        v: [ScalisVertex, ScalisVertex, ScalisVertex],
        unit_normal: Vector3,
        main_dir: Vector3,
        segParams: SegParam[],
        min_thick: number,
        max_thick: number
    ) {
        super();

        this.min_thick = min_thick;
        this.max_thick = max_thick;
        this.v = v;
        this.p0p1 = this.tmpVect.clone().subVectors(this.v[1].getPos(), this.v[0].getPos());
        this.p2p0 = this.tmpVect.clone().subVectors(this.v[0].getPos(), this.v[2].getPos());
        this.unit_normal = unit_normal; // Normal computed from crossVectors of p0p1 and P2p1
        this.main_dir = main_dir;
        const delta_1 = Math.abs(this.v[0].getThickness() - this.v[1].getThickness());
        const delta_2 = Math.abs(this.v[1].getThickness() - this.v[2].getThickness());
        this.equal_weights =
            delta_1 / Math.abs(this.v[0].getThickness() + this.v[1].getThickness()) < 0.001 &&
            delta_2 / Math.abs(this.v[1].getThickness() + this.v[2].getThickness()) < 0.001;
        /* segParams is defined as: (e.g for segment p0p1)
        segParams.push({"norm":         this.length_p0p1,
                        "diffThick":    this.diffThick_p0p1,
                        "dir":          this.unit_p0p1,
                        "v":            [this.v[0], this.v[1]],
                        "ortho_vec_x":  this.v[0].getThickness() - this.v[1].getThickness(),
                        "ortho_vec_y":  this.length_p0p1});
        */
        this.segParams = segParams;

        this.segAttr = {
            p0_to_p: new Vector3(),
            p0_to_p_sqrnorm: 0,
            x_p_2D: 0,
            y_p_2D: 0,
            y_p_2DSq: 0,
            p_proj_x: 0,
        };

        // Construct the triangular prism going through each vertices
        const n1 = this.tmpVect.clone().crossVectors(this.segParams[0].dir, this.unit_normal).normalize();
        const n2 = this.tmpVect.clone().crossVectors(this.segParams[1].dir, this.unit_normal).normalize();
        const n3 = this.tmpVect.clone().crossVectors(this.segParams[2].dir, this.unit_normal).normalize();
        // Compute the prism vertices
        this.tmpVect.copy(this.unit_normal);
        const pri: Vector3[] = [];
        pri.push(
            this.tmpVect.clone().addVectors(
                this.v[0].getPos(),
                this.tmpVect.multiplyScalar(this.v[0].getThickness() * ScalisMath.KS)
            )
        );
        this.tmpVect.copy(this.unit_normal);
        pri.push(
            this.tmpVect.clone().addVectors(
                this.v[1].getPos(),
                this.tmpVect.multiplyScalar(this.v[1].getThickness() * ScalisMath.KS)
            )
        );
        this.tmpVect.copy(this.unit_normal);
        pri.push(
            this.tmpVect.clone().addVectors(
                this.v[2].getPos(),
                this.tmpVect.multiplyScalar(this.v[2].getThickness() * ScalisMath.KS)
            )
        );
        this.tmpVect.copy(this.unit_normal);
        pri.push(
            this.tmpVect.clone().addVectors(
                this.v[0].getPos(),
                this.tmpVect.multiplyScalar(-this.v[0].getThickness() * ScalisMath.KS)
            )
        );
        this.tmpVect.copy(this.unit_normal);
        pri.push(
            this.tmpVect.clone().addVectors(
                this.v[1].getPos(),
                this.tmpVect.multiplyScalar(-this.v[1].getThickness() * ScalisMath.KS)
            )
        );
        this.tmpVect.copy(this.unit_normal);
        pri.push(
            this.tmpVect.clone().addVectors(
                this.v[2].getPos(),
                this.tmpVect.multiplyScalar(-this.v[2].getThickness() * ScalisMath.KS)
            )
        );
        // Compute the normals of top and bottom faces of the prism
        const tmp2 = new Vector3();
        this.tmpVect.subVectors(pri[1], pri[0]);
        tmp2.subVectors(pri[2], pri[0]);
        const n4 = this.tmpVect.clone().crossVectors(this.tmpVect, tmp2).normalize();
        this.tmpVect.subVectors(pri[5], pri[3]);
        tmp2.subVectors(pri[4], pri[3]);
        const n5 = this.tmpVect.clone().crossVectors(this.tmpVect, tmp2).normalize();

        // planeParams contains the definition of the prism 5 faces {normal, orig}
        this.planeParams = [];
        this.planeParams.push({ orig: this.v[0].getPos(), n: n1 });
        this.planeParams.push({ orig: this.v[1].getPos(), n: n2 });
        this.planeParams.push({ orig: this.v[2].getPos(), n: n3 });
        this.planeParams.push({ orig: pri[0], n: n4 });
        this.planeParams.push({ orig: pri[3], n: n5 });

        // use segments areas to factorize some code.
        this.segAreas = [];
        for (let i = 0; i < 3; ++i) {
            this.segAreas.push(
                new AreaScalisSeg(
                    this.segParams[i].v[0].getPos(),
                    this.segParams[i].v[1].getPos(),
                    this.segParams[i].v[0].getThickness(),
                    this.segParams[i].v[1].getThickness()
                )
            );
        }
    }

    /**
     *  Compute projection (used in other functions)
     *  @param p Point to proj
     *  @param segParams A seg param object
     *
     *  @protected
     */
    protected proj_computation(p: Vector3, segParams: SegParam): void {
        this.segAttr.p0_to_p.subVectors(p, segParams.v[0].getPos());
        this.segAttr.p0_to_p_sqrnorm = this.segAttr.p0_to_p.lengthSq();
        this.segAttr.x_p_2D = this.segAttr.p0_to_p.dot(segParams.dir);
        // pythagore inc.
        this.segAttr.y_p_2DSq = this.segAttr.p0_to_p_sqrnorm - this.segAttr.x_p_2D * this.segAttr.x_p_2D;
        this.segAttr.y_p_2D = this.segAttr.y_p_2DSq > 0 ? Math.sqrt(this.segAttr.y_p_2DSq) : 0; // because of rounded errors tmp can be <0 and this causes the next sqrt to return NaN...

        const t = -this.segAttr.y_p_2D / segParams.ortho_vec_y;
        // P proj is the point at the intersection of:
        //              - the local X axis (computation in the unit_dir basis)
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        this.segAttr.p_proj_x = this.segAttr.x_p_2D + t * segParams.ortho_vec_x;
        //this.segAttr.p_proj_y = 0.0;
    }

    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @return true if the sphere and the area intersect
     */
    sphereIntersect(sphere: AreaSphereParam): boolean {
        // First: Test the intersection of the sphere to all three segments as they are included in the triangle bv
        for (let i = 0; i < 3; i++) {
            const intersectSeg = this.sphereIntersectSegment(sphere, this.segParams[i], ScalisMath.KS);
            // The sphere intersecting ones the angle means the sphere intersect the Bounding Volume
            if (intersectSeg) { return true; }
        }
        // Second: Test the intersection of the sphere with the triangular prism defined by
        // the 2D triangle constructed from the vertices and of half heights Ti*KS along the unit_normal for each vertices Vi
        let inside = true;
        for (let i = 0; i < 5; i++) {
            this.tmpVect.subVectors(sphere.center, this.planeParams[i].orig);
            // Get the signed dist to the plane
            const dist = this.tmpVect.dot(this.planeParams[i].n);
            // if the dist to the plane is positive, we are in the part where the normal is
            inside = inside && (dist + sphere.radius > 0); // Modulation by the sphere radius
        }
        // If the sphere is outside one of the plane-> BLAM OUTSIDE SON
        return inside;
    }

    /**
     *  Adapted from the segment sphere intersection. Could be factorised!
     *  @return true if the sphere and the area intersect
     *
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param segParams A segParams object containing data for a segment
     *  @param KS Kernel Scale, ie ScalisMath.KS (Why is it a parameter, its global!?)
     *
     */
    sphereIntersectSegment(sphere: AreaSphereParam, segParams: any, KS: number): boolean {
        this.proj_computation(sphere.center, segParams);

        const thick0 = segParams.v[0].getThickness();
        const thick1 = segParams.v[1].getThickness();
        if (this.segAttr.p_proj_x < 0.0) {
            return (Math.sqrt(this.segAttr.p0_to_p_sqrnorm) - sphere.radius < thick0 * KS);
        } else {
            if (this.segAttr.p_proj_x > segParams.norm) {
                this.segAttr.p0_to_p.subVectors(sphere.center, segParams.v[1].getPos());
                return this.segAttr.p0_to_p.length() - sphere.radius < thick1 * KS;
            } else {
                const sub1 = this.segAttr.x_p_2D - this.segAttr.p_proj_x;
                const dist = sub1 * sub1 + this.segAttr.y_p_2DSq;
                const tt = this.segAttr.p_proj_x / segParams.norm;
                const inter_w = thick0 * (1.0 - tt) + tt * thick1;
                const tmp = sphere.radius + inter_w * KS;
                return (dist < tmp * tmp);
            }
        }
    }

    /**
     * @link Area.contains for a complete description
     * @param p
     */
    contains = (function () {
        const sphere = { radius: 0, center: new Vector3() };
        /**
         * @param p
         */
        return function (this: AreaScalisTri, p: Vector3) {
            sphere.center.copy(p);
            return this.sphereIntersect(sphere);
        }
    })();

    /**
     *  Copied from AreaSeg.getAcc
     *
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param segParams A segParams object containing data for a segment area
     *
     *  @return Object containing intersect (boolean) and currAcc (number) attributes
     */
    getAccSegment(sphere: AreaSphereParam, segParams: any): { intersect: boolean; currAcc: number } {
        const allReturn = { intersect: false, currAcc: Accuracies.nice * this.min_thick };
        if (this.sphereIntersectSegment(sphere, segParams, 1)) {
            const tmp = Math.abs(segParams.diffThick) / segParams.norm;
            const half_delta = sphere.radius * Math.sqrt(1 + tmp * tmp) * 0.5;

            const thick0 = segParams.v[0].getThickness();
            const thick1 = segParams.v[1].getThickness();
            // we check only the direction where the weight is minimum since
            // we will return minimum accuracy needed in the area.
            let absc = this.segAttr.p_proj_x;
            absc += thick0 > thick1 ? half_delta : -half_delta;

            if (absc <= 0.0) {
                allReturn.currAcc = thick0;
            } else if (absc >= segParams.norm) {
                allReturn.currAcc = thick1;
            } else {
                const tt = absc / segParams.norm;
                allReturn.currAcc = thick0 * (1.0 - tt) + tt * thick1;
            }
            allReturn.intersect = true;
        }
        return allReturn;
    }

    /**
     *  Get accuracy for the inner triangle (do not consider segment edges)
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     */
    getAccTri(sphere: AreaSphereParam): number {
        // Inequal thickness triangle case:
        if (!this.equal_weights) {
            const v0 = this.v[0].getPos(); // Should be the min thickness point on the triangle
            // Get the main dir furthest point
            const main_dir_point = this.tmpVect.addVectors(sphere.center, this.main_dir.clone().multiplyScalar(sphere.radius));
            // Get the proj of this point
            // 1/ get the ortho coord 2D wise
            this.tmpVect.subVectors(main_dir_point, v0);
            const distLineSq = this.tmpVect.lengthSq();
            // Get the dist to the plane (signed)
            const y_p_2D = this.tmpVect.dot(this.unit_normal); // Should do some test here to know if we are above or below the plane
            const x_p_2D = Math.sqrt(distLineSq - y_p_2D * y_p_2D);
            // Get the ortho proj point in the triangle plane
            // Cf. http://geomalgorithms.com/a04-_planes.html
            const proj_ortho_point = this.tmpVect.clone().addVectors(sphere.center, this.unit_normal.clone().multiplyScalar(-y_p_2D));
            // Get the thickness at this point
            let params = TriangleUtils.getTriBaryCoord(this.p0p1, this.p2p0, this.v[0].getPos(), proj_ortho_point);
            let thick_ortho_point = TriangleUtils.getMeanThick(this, params.u, params.v);
            // Ortho vector to the weight varies along where the sphere is relative to the plane
            thick_ortho_point = y_p_2D >= 0 ? thick_ortho_point : -thick_ortho_point;
            const ortho_vec_x = this.v[0].getThickness() - thick_ortho_point;
            const ortho_vec_y = x_p_2D;
            const t = -y_p_2D / ortho_vec_y;
            // P proj is the point at the intersection of:
            //              - the local X axis (computation in the unit_dir basis)
            //                  and
            //              - the line defined by P and the vector orthogonal to the weight line
            const p_proj_x = x_p_2D + t * ortho_vec_x;

            const dirVect = this.tmpVect.subVectors(v0, proj_ortho_point).normalize();
            const p_proj = this.tmpVect.addVectors(proj_ortho_point, dirVect.multiplyScalar(x_p_2D - p_proj_x));
            // Get the barycentric parameters of the non orthogonal point
            params = TriangleUtils.getTriBaryCoord(this.p0p1, this.p2p0, this.v[0].getPos(), p_proj);
            if (params.u <= 1 && params.v <= 1 && params.u + params.v <= 1 && params.u >= 0 && params.v >= 0) {
                // Return the barycentered thickness (yes barycentered is a proper english terminology)
                return TriangleUtils.getMeanThick(this, params.u, params.v);
            } else {
                return this.max_thick * 10000;
            }
        } else {
            // Case of equal weights
            return this.min_thick;
        }
    }

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
    getAcc(sphere: AreaSphereParam, factor: number): number {
        // First: Test the intersection of the sphere to all three segments to get the min Acc for segments
        let minForSeg = this.max_thick * 100000;
        for (let i = 0; i < 3; i++) {
            const intersectSeg = this.getAccSegment(sphere, this.segParams[i]);
            // The sphere intersecting ones the angle means the sphere intersect the Bounding Volume
            if (intersectSeg.intersect) {
                minForSeg = Math.min(minForSeg, intersectSeg.currAcc);
            }
        }
        // Second: Test the inner triangle
        let minForTri = this.max_thick * 100000;
        if (minForSeg !== this.min_thick) {
            minForTri = this.getAccTri(sphere);
        }

        const minThick = Math.min(minForSeg, minForTri);
        if (minThick !== this.max_thick * 100000) {
            return minThick * factor;
        } else {
            // Sphere does not intersect with the segments, or the inner triangle
            return this.max_thick * factor;
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
        return Accuracies.curr * this.min_thick;
    }

    /**
     * @link Area.getMinRawAcc
     * @return number
     */
    getMinRawAcc = (): number => {
        return Accuracies.raw * this.min_thick;
    }

    /**
     *  Return the minimum accuracy required at some point on the given axis.
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis: Coordinate, t: number): number {
        let step = Number.MAX_VALUE;
        for (let i = 0; i < 3; ++i) {
            step = Math.min(step, this.segAreas[i].getAxisProjectionMinStep(axis, t));
        }
        return step;
    }
}

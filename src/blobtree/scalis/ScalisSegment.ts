import { Box3, Vector3 } from "three";
import { Types } from "../Types";
import { Material } from "../Material";
import { ScalisPrimitive, type ScalisPrimitiveJSON, type ScalisPrimitiveVolType, type ScalisSegmentType } from "./ScalisPrimitive";
import { ScalisVertex } from "./ScalisVertex";
import { ScalisMath } from "./ScalisMath";
import { AreaScalisSeg } from "../areas/AreaScalisSeg";
import type { ValueResultType } from "../Element";

export type ScalisSegmentJSON = { density: number } & ScalisPrimitiveJSON;

/**
 *  Implicit segment class in the blobtree.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
export class ScalisSegment extends ScalisPrimitive {

    static override type: ScalisSegmentType = "ScalisSegment" as const;

    static override fromJSON(json: ScalisSegmentJSON): ScalisSegment {
        const v0 = ScalisVertex.fromJSON(json.v[0]);
        const v1 = ScalisVertex.fromJSON(json.v[1]);
        const m = [
            Material.fromJSON(json.materials[0]),
            Material.fromJSON(json.materials[1])
        ];
        return new ScalisSegment(v0, v1, json.volType, json.density, m);
    }

    density: number;

    // Temporary for eval
    // TODO: should be wrapped in the eval function scope if possible (ie not precomputed)
    // CONVOL
    clipped_l1 = 1.0;
    clipped_l2 = 0.0;
    vector = new Vector3();
    cycle = new Vector3();
    proj = new Vector3();

    // helper attributes
    v0_p: Vector3;
    v1_p: Vector3;
    dir = new Vector3();
    lengthSq = 0;
    length = 0;
    unit_dir = new Vector3();

    // weight_p1 is convol's weight_p2 ( >_< )
    weight_p1 = 0;
    // c0 and c1 are convol's weight_coeff
    c0 = 0;
    c1 = 0;

    increase_unit_dir = new Vector3();
    p_min = new Vector3();
    weight_min = 0;
    inv_weight_min = 0;
    unit_delta_weight = 0;

    maxbound = 0;
    maxboundSq = 0;
    cyl_bd0 = 0;
    cyl_bd1 = 0;
    f0f1f2 = new Vector3();

    tmpVec1 = new Vector3();
    tmpVec2 = new Vector3();

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
    constructor(v0: ScalisVertex, v1: ScalisVertex, volType: ScalisPrimitiveVolType, density: number, mats: Material[]) {
        super();

        this.v.length = 2;
        this.v[0] = v0;
        this.v[1] = v1;
        v0.setPrimitive(this);
        v1.setPrimitive(this);

        this.volType = volType;
        this.density = density;
        this.materials = mats;

        // helper attributes
        this.v0_p = this.v[0].getPos();
        this.v1_p = this.v[1].getPos(); // this one is probably useless to be kept for eval since not used....

        this.computeHelpVariables();
    }

    override getType(): ScalisSegmentType {
        return ScalisSegment.type;
    }

    override toJSON(): ScalisSegmentJSON {
        return {
            ...super.toJSON(),
            density: this.density
        };
    }

    override mutableVolType(): boolean {
        return true;
    }

    /**
     *  @param d The new density
     */
    setDensity(d: number): void {
        this.density = d;
        this.invalidAABB();
    }

    /**
     *  @return The current density
     */
    getDensity(): number {
        return this.density;
    }

    /**
     *  [Abstract] See Primitive.setVolType for more details.
     *  @param vt New VolType to set (Only for SCALIS primitives)
     */
    override setVolType(vt: ScalisPrimitiveVolType): void {
        if (!(vt == ScalisPrimitive.CONVOL || vt == ScalisPrimitive.DIST)) {
            throw "[ScalisSegment] setVolType: volType must be set to ScalisPrimitive.CONVOL or ScalisPrimitive.DIST";
        }

        if (this.volType != vt) {
            this.volType = vt;
            this.invalidAABB();
        }
    }

    // [Abstract] See Primitive.getVolType for more details
    override getVolType(): ScalisPrimitiveVolType {
        return this.volType;
    }

    // [Abstract] See Primitive.prepareForEval for more details
    prepareForEval(): void {
        if (!this.valid_aabb) {
            this.computeHelpVariables();
            this.valid_aabb = true;
        }
    }

    // [Abstract] See Primtive.getArea for more details
    override getAreas(): {
        aabb: Box3,
        bv: AreaScalisSeg,
        obj: ScalisSegment,
    }[] {
        if (!this.valid_aabb) {
            console.error("[ScalisSegment] getAreas : Cannot get area of invalid primitive");
            return [];
        } else {
            return [{
                aabb: this.aabb,
                bv: new AreaScalisSeg(
                    this.v[0].getPos(),
                    this.v[1].getPos(),
                    this.v[0].getThickness(),
                    this.v[1].getThickness()
                ),
                obj: this
            }];
        }
    }

    // [Abstract] See Primitive.computeHelpVariables for more details
    computeHelpVariables(): void {
        this.v0_p = this.v[0].getPos();
        this.v1_p = this.v[1].getPos(); // this one is probably useless to be kept for eval since not used....

        this.dir.subVectors(this.v1_p, this.v0_p);
        this.lengthSq = this.dir.lengthSq();
        this.length = Math.sqrt(this.lengthSq);
        this.unit_dir.copy(this.dir).normalize();

        this.weight_p1 = this.v[1].getThickness();
        this.c0 = this.v[0].getThickness();
        this.c1 = this.v[1].getThickness() - this.v[0].getThickness();

        // Bounding property
        // bounding box is axis aligned so the bounding is not very tight.
        const bound_supp0 = this.v[0].getThickness() * ScalisMath.KS;
        const bound_supp1 = this.v[1].getThickness() * ScalisMath.KS;

        this.maxbound = Math.max(bound_supp0, bound_supp1);
        this.maxboundSq = this.maxbound * this.maxbound;

        // Speed up const for cylinder bounding
        // Used only in evalConvol
        this.cyl_bd0 = Math.min(-bound_supp0, this.length - bound_supp1);
        this.cyl_bd1 = Math.max(this.length + bound_supp1, bound_supp0);

        this.increase_unit_dir.copy(this.unit_dir);
        // weight help varables
        if (this.c1 < 0) {
            this.p_min.copy(this.v1_p);
            this.weight_min = this.weight_p1;
            this.inv_weight_min = 1 / this.weight_p1;
            this.increase_unit_dir.negate();
            this.unit_delta_weight = -this.c1 / this.length;
        } else {
            this.p_min.copy(this.v0_p);
            // weight_p0 is c0
            this.weight_min = this.c0;
            this.inv_weight_min = 1 / this.c0;
            this.unit_delta_weight = this.c1 / this.length;
        }

        this.computeAABB();
    }

    // [Abstract] See Primitive.value for more details
    value(p: Vector3, res: ValueResultType) {
        switch (this.volType) {
            case ScalisPrimitive.DIST:
                this.evalDist(p, res);
                break;
            case ScalisPrimitive.CONVOL:
                this.evalConvol(p, res);
                break;
            default:
                throw "[ScalisSegment] value : Unknown volType, cannot evaluate.";
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // Distance Evaluation functions and auxiliaary functions
    // Note : for the mech primitive we use a CompactPolynomial6 kernel.
    //        TODO : the orga should use the same for better smoothness

    /**
     *  value function for Distance volume type (distance field).
     */

    evalDist = (function () {
        const ev_eps = { v: 0 };
        const p_eps = new Vector3();

        return function (this: ScalisSegment, p: Vector3, res: ValueResultType) {
            const p0_to_p = this.vector;
            p0_to_p.subVectors(p, this.v[0].getPos());

            // Documentation : see DistanceHomothetic.pdf in convol/Documentation/Convol-Core/
            const orig_p_scal_dir = p0_to_p.dot(this.dir);
            const orig_p_sqr = p0_to_p.lengthSq();

            const denum = this.lengthSq * this.c0 + orig_p_scal_dir * this.c1;
            let t = (this.c1 < 0) ? 0 : 1;
            if (denum > 0.0) {
                t = orig_p_scal_dir * this.c0 + orig_p_sqr * this.c1;
                t = (t < 0.0) ? 0.0 : ((t > denum) ? 1.0 : t / denum); // clipping (nearest point on segment not line)
            }

            // Optim the below code... But keep the old code it's more understandable
            const proj_p_l = Math.sqrt(t * (t * this.lengthSq - 2 * orig_p_scal_dir) + orig_p_sqr);
            //const proj_to_point = this.proj;
            //proj_to_point.set(
            //    t*this.dir.x - p0_to_p.x,
            //    t*this.dir.y - p0_to_p.y,
            //    t*this.dir.z - p0_to_p.z
            //);
            //const proj_p_l = proj_to_point.length();

            const weight_proj = this.c0 + t * this.c1;
            res.v = this.density * ScalisMath.Poly6Eval(proj_p_l / weight_proj) * ScalisMath.Poly6NF0D;

            ///////////////////////////////////////////////////////////////////////
            // Material computation : by orthogonal projection
            if (res.m) {
                this.evalMat(p, res);
            }

            // IMPORTANT NOTE :
            // We should use an analytical gradient here. It should be possible to
            // compute.
            if (res.g) {
                const epsilon = 0.00001;
                const d_over_eps = this.density / epsilon;
                p_eps.copy(p);
                p_eps.x += epsilon;
                this.evalDist(p_eps, ev_eps);
                res.g.x = d_over_eps * (ev_eps.v - res.v);
                p_eps.x -= epsilon;

                p_eps.y += epsilon;
                this.evalDist(p_eps, ev_eps);
                res.g.y = d_over_eps * (ev_eps.v - res.v);
                p_eps.y -= epsilon;

                p_eps.z += epsilon;
                this.evalDist(p_eps, ev_eps);
                res.g.z = d_over_eps * (ev_eps.v - res.v);
            }
        };
    })();

    /**
     *
     * @param p Evaluation point
     * @param res Resulting material will be in res.m
    */    
    evalMat(p: Vector3, res: ValueResultType): void {
        const p0_to_p = this.vector;
        p0_to_p.subVectors(p, this.v[0].getPos());
        const udir_dot = this.unit_dir.dot(p0_to_p);
        const s = (udir_dot / this.length);
        if (!res.m)
            throw "[ScalisSegment] evalMat: res.m should be defined here.";
        if (s > 1.0) {
            res.m.copy(this.materials[1]);
        } else if (s <= 0.0) {
            res.m.copy(this.materials[0]);
        } else {
            if (s <= 0.0) {
                res.m.copy(this.materials[0]);
            }
            else {
                // (1-s)*m0 + s*m1
                res.m.copy(this.materials[0]);
                res.m.lerp(this.materials[1], s);
            }
        }
    };

    /**
     *  @param w special_coeff
     */
    HomotheticClippingSpecial(w: Vector3): boolean {
        // we search solution t \in [0,1] such that at^2-2bt+c<=0 
        const a = -w.z;
        const b = -w.y;
        const c = -w.x;

        const delta = b * b - a * c;
        if (delta >= 0.0) {            const b_p_sqrt_delta = b + Math.sqrt(delta);
            if ((b_p_sqrt_delta < 0.0) || (this.length * b_p_sqrt_delta < c)) {
                return false;
            } else {
                const main_root = c / b_p_sqrt_delta;
                this.clipped_l1 = (main_root < 0.0) ? 0.0 : main_root;                const a_r = a * main_root;
                this.clipped_l2 = (2.0 * b < a_r + a * this.length) ? c / (a_r) : this.length;
                return true;
            }
        }
        return false;
    }

    // [Abstract] see ScalisPrimitive.heuristicStepWithin
    heuristicStepWithin(): number {
        return this.weight_min / 3;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Convolution Evaluation functions and auxiliaary functions
    /**
     *  value function for Convol volume type (Homothetic convolution).
     */
    evalConvol(p: Vector3, res: ValueResultType): void {
        if (!this.valid_aabb) {
            throw "[ScalisSegment] evalConvol : prepareForEval should have been called";
        }

        if (res.g) res.g.set(0, 0, 0);
        res.v = 0;

        const p_min_to_point = this.tmpVec1;
        p_min_to_point.subVectors(p, this.p_min);

        const uv = this.increase_unit_dir.dot(p_min_to_point);
        const d2 = p_min_to_point.lengthSq();

        const special_coeff = this.tmpVec2;
        special_coeff.set(
            this.weight_min * this.weight_min - ScalisMath.KIS2 * d2,
            -this.unit_delta_weight * this.weight_min - ScalisMath.KIS2 * uv,
            this.unit_delta_weight * this.unit_delta_weight - ScalisMath.KIS2
        );

        // clipped_l1, clipped_l2 are members of segment
        if (this.HomotheticClippingSpecial(special_coeff)) {
            const inv_local_min_weight = 1.0 / (this.weight_min + this.clipped_l1 * this.unit_delta_weight);
            special_coeff.x = 1.0 - ScalisMath.KIS2 * (this.clipped_l1 * (this.clipped_l1 - 2.0 * uv) + d2) * inv_local_min_weight * inv_local_min_weight;
            special_coeff.y = -this.unit_delta_weight - ScalisMath.KIS2 * (uv - this.clipped_l1) * inv_local_min_weight;

            if (res.g) //both grad and value
            {
                if (this.unit_delta_weight >= 0.06) { // ensure a maximum relative error of ??? (for degree i up to 8)
                    this.HomotheticCompactPolynomial_segment_FGradF_i6((this.clipped_l2 - this.clipped_l1) *
                        inv_local_min_weight,
                        this.unit_delta_weight,
                        special_coeff
                    );
                } else {
                    this.HomotheticCompactPolynomial_approx_segment_FGradF_i6(
                        (this.clipped_l2 - this.clipped_l1) * inv_local_min_weight,
                        this.unit_delta_weight,
                        this.inv_weight_min,
                        special_coeff
                    );
                }

                res.v = ScalisMath.Poly6NF1D * this.f0f1f2.x;
                this.f0f1f2.y *= inv_local_min_weight;
                res.g
                    .copy(this.increase_unit_dir)
                    .multiplyScalar(this.f0f1f2.z + this.clipped_l1 * this.f0f1f2.y)
                    .sub(p_min_to_point.multiplyScalar(this.f0f1f2.y))
                    .multiplyScalar(ScalisMath.Poly6NF1D * 6.0 * ScalisMath.KIS2 * inv_local_min_weight);
            }
            else //value only
            {
                if (this.unit_delta_weight >= 0.06) { // ensure a maximum relative error of ??? (for degree i up to 8)
                    res.v = ScalisMath.Poly6NF1D *
                        this.HomotheticCompactPolynomial_segment_F_i6(
                            (this.clipped_l2 - this.clipped_l1) * inv_local_min_weight,
                            this.unit_delta_weight,
                            special_coeff
                        );
                } else {
                    res.v = ScalisMath.Poly6NF1D *
                        this.HomotheticCompactPolynomial_approx_segment_F_i6(
                            (this.clipped_l2 - this.clipped_l1) * inv_local_min_weight,
                            this.unit_delta_weight,
                            inv_local_min_weight,
                            special_coeff
                        );
                }
            }

            if (res.m) {
                this.evalMat(p, res);
            }
        }
    };

    /**
     *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
     *  @return Clamped value
     *  Author: Jakub Korzeniowski
     *  Agency: Softhis
     *  http://www.softhis.com
     */
    clamp(a: number, b: number, c: number): number { return Math.max(b, Math.min(c, a)); };

    override distanceTo = (function () {
        const tmpVector = new Vector3();
        const tmpVectorProj = new Vector3();
        return function (this: ScalisSegment, p: Vector3): number {
            const self = this;

            // return distance point/segment
            // don't take thickness into account
            let t = tmpVector.subVectors(p, self.v[0].getPos())
                .dot(self.dir) / self.lengthSq;

            // clamp is our own function declared there
            t = self.clamp(t, 0, 1);
            tmpVectorProj.copy(self.dir)
                .multiplyScalar(t)
                .add(self.v[0].getPos());
            return p.distanceTo(tmpVectorProj);
        };
    })();

    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @return the value
     */
    HomotheticCompactPolynomial_segment_F_i6(l: number, d: number, w: { x: number, y: number, z: number }): number {
        const t6247 = d * l + 0.1e1;
        const t6241 = 0.1e1 / t6247;
        const t6263 = t6247 * t6247;
        const t2 = t6263 * t6263;
        const t6244 = 0.1e1 / t2;
        const t6252 = w.y;
        const t6249 = t6252 * t6252;
        const t6273 = 0.12e2 * t6249;
        const t6258 = 0.1e1 / d;
        const t6271 = t6252 * t6258;
        const t6264 = t6247 * t6263;
        const t6257 = l * l;
        const t6260 = t6257 * t6257;
        const t6259 = l * t6257;
        const t6254 = l * t6260;
        const t6253 = w.x;
        const t6251 = w.z;
        const t6250 = t6253 * t6253;
        const t6248 = t6251 * t6251;
        const t3 = t6264 * t6264;
        const t6246 = 0.1e1 / t3;
        const t6245 = t6241 * t6244;
        const t6243 = 0.1e1 / t6264;
        const t6242 = 0.1e1 / t6263;
        const t71 = Math.log(t6247);
        const t93 = t6259 * t6259;
        return -t6248 * (((((-(t6241 - 0.1e1) * t6258 - l * t6242) * t6258 - t6257 * t6243) * t6258 - t6259 * t6244) * t6258 - t6260 * t6245) * t6258 - t6254 * t6246) * t6271 + (-t6253 * (t6246 - 0.1e1) * t6258 / 0.6e1 - (-(t6245 - 0.1e1) * t6258 / 0.5e1 - l * t6246) * t6271) * t6250 + ((t6253 * t6273 + 0.3e1 * t6251 * t6250) * (0.2e1 / 0.5e1 * (-(t6244 - 0.1e1) * t6258 / 0.4e1 - l * t6245) * t6258 - t6257 * t6246) + (0.3e1 * t6248 * t6253 + t6251 * t6273) * (0.4e1 / 0.5e1 * (0.3e1 / 0.4e1 * (0.2e1 / 0.3e1 * (-(t6242 - 0.1e1) * t6258 / 0.2e1 - l * t6243) * t6258 - t6257 * t6244) * t6258 - t6259 * t6245) * t6258 - t6260 * t6246) + t6251 * t6248 * (0.6e1 / 0.5e1 * (0.5e1 / 0.4e1 * (0.4e1 / 0.3e1 * (0.3e1 / 0.2e1 * (0.2e1 * (t71 * t6258 - l * t6241) * t6258 - t6257 * t6242) * t6258 - t6259 * t6243) * t6258 - t6260 * t6244) * t6258 - t6254 * t6245) * t6258 - t93 * t6246) + (-0.12e2 * t6251 * t6253 - 0.8e1 * t6249) * (0.3e1 / 0.5e1 * ((-(t6243 - 0.1e1) * t6258 / 0.3e1 - l * t6244) * t6258 / 0.2e1 - t6257 * t6245) * t6258 - t6259 * t6246) * t6252) * t6258 / 0.6e1;
    }

    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).
     *  (Approximation? Faster?).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     */
    HomotheticCompactPolynomial_approx_segment_F_i6(l: number, d: number, q: number, w: { x: number, y: number, z: number }) {
        const t6386 = q * d;
        const t6361 = t6386 + 0.1e1;
        const t6387 = 0.1e1 / t6361;
        const t1 = t6361 * t6361;
        const t2 = t1 * t1;
        const t6359 = t6387 / t2 / t1;
        const t6363 = w.z;
        const t6364 = w.y;
        const t6365 = w.x;
        const t6366 = l * l;
        const t6356 = t6363 * t6366 - 0.2e1 * t6364 * l + t6365;
        const t9 = t6364 * t6364;
        const t6357 = t6363 * t6365 - t9;
        const t6358 = t6363 * l - t6364;
        const t6377 = t6365 * t6365;
        const t6381 = t6364 * t6377;
        const t6369 = t6356 * t6356;
        const t6383 = t6358 * t6369;
        const t6362 = 0.1e1 / t6363;
        const t6384 = t6357 * t6362;
        const t6385 = 0.6e1 / 0.35e2 * (0.4e1 / 0.3e1 * (0.2e1 * t6357 * l + t6358 * t6356 + t6364 * t6365) * t6384 + t6383 + t6381) * t6384 + t6356 * t6383 / 0.7e1 + t6365 * t6381 / 0.7e1;
        const t6380 = t6362 * t6385;
        const t6360 = t6387 * t6359;
        const t6355 = t6369 * t6369;
        const t27 = t6377 * t6377;
        const t6353 = t6364 * t6380 + t6355 / 0.8e1 - t27 / 0.8e1;
        // eslint-disable-next-line no-loss-of-precision
        const t6352 = -l * t6355 + (-0.10e2 * t6364 * t6353 + t6365 * t6385) * t6362;
        const t65 = q * q;
        return t6380 - 0.7e1 * d * t6353 * t6362 + (-0.1111111111e0 * (0.3e1 * t6359 - 0.300e1 + 0.7e1 * (0.2e1 + t6360) * t6386) * t6352 - 0.1000000000e0 * (0.2e1 - 0.200e1 * t6359 - 0.7e1 * (0.1e1 + t6360) * t6386) / q * (-0.1e1 * t6366 * t6355 + (0.1333333333e1 * t6364 * t6352 + 0.2e1 * t6365 * t6353) * t6362)) * t6362 / t65;
    }

    /**
     *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  Result is stored in this.f0f1f2
     */
    HomotheticCompactPolynomial_segment_FGradF_i6(l: number, d: number, w: { x: number, y: number, z: number }) {
        const t6320 = d * l + 0.1e1;
        const t6314 = 0.1e1 / t6320;
        const t6336 = t6320 * t6320;
        const t2 = t6336 * t6336;
        const t6317 = 0.1e1 / t2;
        const t6325 = w.y;
        const t6322 = t6325 * t6325;
        const t6351 = 0.2e1 * t6322;
        const t6324 = w.z;
        const t6326 = w.x;
        const t6350 = t6324 * t6326 / 0.3e1 + 0.2e1 / 0.3e1 * t6322;
        const t6321 = t6324 * t6324;
        const t6349 = t6321 / 0.6e1;
        const t6348 = -0.2e1 / 0.3e1 * t6324;
        const t6337 = t6320 * t6336;
        const t6316 = 0.1e1 / t6337;
        const t6318 = t6314 * t6317;
        const t7 = t6337 * t6337;
        const t6319 = 0.1e1 / t7;
        const t6330 = l * l;
        const t6331 = 0.1e1 / d;
        const t6332 = l * t6330;
        const t6309 = 0.3e1 / 0.5e1 * ((-(t6316 - 0.1e1) * t6331 / 0.3e1 - l * t6317) * t6331 / 0.2e1 - t6330 * t6318) * t6331 - t6332 * t6319;
        const t6347 = t6309 * t6325;
        const t6311 = -(t6318 - 0.1e1) * t6331 / 0.5e1 - l * t6319;
        const t6323 = t6326 * t6326;
        const t6346 = t6323 * t6311;
        const t6310 = 0.2e1 / 0.5e1 * (-(t6317 - 0.1e1) * t6331 / 0.4e1 - l * t6318) * t6331 - t6330 * t6319;
        const t6345 = t6326 * t6310;
        const t6344 = -t6323 * (t6319 - 0.1e1) / 0.6e1;
        const t6333 = t6330 * t6330;
        const t6327 = l * t6333;
        const t6315 = 0.1e1 / t6336;
        const t6308 = 0.4e1 / 0.5e1 * (0.3e1 / 0.4e1 * (0.2e1 / 0.3e1 * (-(t6315 - 0.1e1) * t6331 / 0.2e1 - l * t6316) * t6331 - t6330 * t6317) * t6331 - t6332 * t6318) * t6331 - t6333 * t6319;
        const t6307 = ((((-(t6314 - 0.1e1) * t6331 - l * t6315) * t6331 - t6330 * t6316) * t6331 - t6332 * t6317) * t6331 - t6333 * t6318) * t6331 - t6327 * t6319;
        const t81 = t6332 * t6332;
        const t92 = Math.log(t6320);
        this.f0f1f2.x = (t6326 * t6344 - t6325 * t6346 + t6345 * t6351 - 0.4e1 / 0.3e1 * t6322 * t6347 + (t6323 * t6310 / 0.2e1 + t6308 * t6351 - 0.2e1 * t6326 * t6347) * t6324 + (t6326 * t6308 / 0.2e1 - t6325 * t6307 + (-t81 * t6319 / 0.6e1 + (-t6327 * t6318 / 0.5e1 + (-t6333 * t6317 / 0.4e1 + (-t6332 * t6316 / 0.3e1 + (-t6330 * t6315 / 0.2e1 + (t92 * t6331 - l * t6314) * t6331) * t6331) * t6331) * t6331) * t6331) * t6324) * t6321) * t6331;
        this.f0f1f2.y = (t6344 + t6310 * t6350 + t6308 * t6349 + (-0.2e1 / 0.3e1 * t6326 * t6311 + t6309 * t6348) * t6325) * t6331;
        this.f0f1f2.z = (t6346 / 0.6e1 + t6309 * t6350 + t6307 * t6349 + (-0.2e1 / 0.3e1 * t6345 + t6308 * t6348) * t6325) * t6331;
    }

    /**
     *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  Result is stored in this.f0f1f2
     */
    HomotheticCompactPolynomial_approx_segment_FGradF_i6(l: number, d: number, q: number, w: { x: number, y: number, z: number }) {
        const t6478 = q * d;
        const t6443 = t6478 + 0.1e1;
        const t6479 = 0.1e1 / t6443;
        const t1 = q * q;
        const t6449 = 0.1e1 / t1;
        const t2 = t6443 * t6443;
        const t3 = t2 * t2;
        const t6441 = t6479 / t3 / t2;
        const t6448 = w.x;
        const t6477 = 0.2e1 * t6448;
        const t6446 = w.z;
        const t6444 = 0.1e1 / t6446;
        const t6476 = d * t6444;
        const t6447 = w.y;
        const t6451 = l * l;
        const t6438 = t6446 * t6451 - 0.2e1 * t6447 * l + t6448;
        const t6455 = t6438 * t6438;
        const t6437 = t6438 * t6455;
        const t6463 = t6448 * t6448;
        const t6445 = t6448 * t6463;
        const t10 = t6447 * t6447;
        const t6439 = t6446 * t6448 - t10;
        const t6440 = t6446 * l - t6447;
        const t6470 = t6439 * t6444;
        const t6433 = 0.4e1 / 0.3e1 * (0.2e1 * t6439 * l + t6440 * t6438 + t6447 * t6448) * t6470 + t6440 * t6455 + t6447 * t6463;
        const t6473 = t6433 / 0.5e1;
        const t6432 = t6447 * t6444 * t6473 + t6437 / 0.6e1 - t6445 / 0.6e1;
        const t6429 = -l * t6437 + (-0.8e1 * t6447 * t6432 + t6448 * t6473) * t6444;
        const t6469 = t6451 * t6437;
        // eslint-disable-next-line no-loss-of-precision
        const t6427 = -t6469 + (0.10e2 / 0.7e1 * t6447 * t6429 + t6432 * t6477) * t6444;
        const t6475 = -t6427 / 0.8e1;
        const t6474 = 0.6e1 / 0.35e2 * t6433 * t6470 + t6440 * t6437 / 0.7e1 + t6447 * t6445 / 0.7e1;
        const t6442 = t6479 * t6441;
        const t6472 = (0.3e1 * t6441 - 0.300e1 + 0.7e1 * (0.2e1 + t6442) * t6478) * t6449;
        const t6471 = (0.2e1 - 0.200e1 * t6441 - 0.7e1 * (0.1e1 + t6442) * t6478) / q * t6449;
        const t6468 = t6444 * t6472;
        const t6467 = t6444 * t6471;
        const t6466 = t6444 * t6474;
        const t6436 = t6455 * t6455;
        const t57 = t6463 * t6463;
        const t6430 = t6447 * t6466 + t6436 / 0.8e1 - t57 / 0.8e1;
        // eslint-disable-next-line no-loss-of-precision
        const t6428 = -l * t6436 + (-0.10e2 * t6447 * t6430 + t6448 * t6474) * t6444;
        // eslint-disable-next-line no-loss-of-precision
        this.f0f1f2.x = t6466 - 0.7e1 * t6430 * t6476 - t6428 * t6468 / 0.9e1 - (-t6451 * t6436 + (0.4e1 / 0.3e1 * t6447 * t6428 + t6430 * t6477) * t6444) * t6467 / 0.10e2;
        this.f0f1f2.y = (t6473 - 0.7e1 * d * t6432 - t6429 * t6472 / 0.7e1 + t6471 * t6475) * t6444;
        this.f0f1f2.z = t6432 * t6444 + t6429 * t6476 + t6468 * t6475 - (-l * t6469 + (0.3e1 / 0.2e1 * t6447 * t6427 - 0.3e1 / 0.7e1 * t6448 * t6429) * t6444) * t6467 / 0.9e1;
    };
    // End of organic evaluation functions
    ////////////////////////////////////////////////////////////////////////////
}

Types.register(ScalisSegment.type, ScalisSegment);
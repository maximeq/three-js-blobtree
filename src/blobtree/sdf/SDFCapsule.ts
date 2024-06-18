import { Vector3, Box3, MathUtils } from "three";
import { Types } from "../Types";
import { SDFPrimitive, type SDFPrimitiveJSON, type SDFCapsuleType } from "./SDFPrimitive";
import { AreaCapsule } from "../areas/AreaCapsule";
import type { ValueResultType } from "../Element";

export type SDFCapsuleJSON = { p1: { x: number, y: number, z: number }, r1: number, p2: { x: number, y: number, z: number }, r2: number } & SDFPrimitiveJSON;

/**
 *  This primitive implements a distance field to an extended "capsule geometry", which is actually a weighted segment.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @constructor
 *  @extends SDFPrimitive
 */
export class SDFCapsule extends SDFPrimitive {

    static override type: SDFCapsuleType = "SDFCapsule" as const;

    fromJSON(json: SDFCapsuleJSON): SDFCapsule {
        return new SDFCapsule(
            new Vector3(json.p1.x, json.p1.y, json.p1.z),
            new Vector3(json.p2.x, json.p2.y, json.p2.z),
            json.r1,
            json.r2
        );
    }

    p1: Vector3;
    p2: Vector3;
    r1: number;
    r2: number;
    rdiff: number;
    unit_dir: Vector3;
    lengthSq: number;
    length: number;

    /**
     *  @param p1 Position of the first segment extremity
     *  @param p2 Position of the second segment extremity
     *  @param r1 Radius of the sphere centered in p1
     *  @param r2 Radius of the sphere centered in p2
     */
    constructor(p1: Vector3, p2: Vector3, r1: number, r2: number) {
        super();

        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.r1 = r1;
        this.r2 = r2;

        // Helper for evaluation
        this.rdiff = this.r2 - this.r1;
        this.unit_dir = new Vector3().subVectors(this.p2, this.p1);
        this.lengthSq = this.unit_dir.lengthSq();
        this.length = this.unit_dir.length();
        this.unit_dir.normalize();
    }

    /**
     *  @return Type of the element
     */
    override getType(): SDFCapsuleType {
        return SDFCapsule.type;
    }

    override toJSON(): SDFCapsuleJSON {
        return {
            ...super.toJSON(),
            p1: {
                x: this.p1.x,
                y: this.p1.y,
                z: this.p1.z
            },
            r1: this.r1,
            p2: {
                x: this.p2.x,
                y: this.p2.y,
                z: this.p2.z
            },
            r2: this.r2
        };
    }

    /**
     *  @param r1 The new radius at p1
     */
    setRadius1(r1: number): void {
        this.r1 = r1;
        this.invalidAABB();
    }

    /**
     *  @param r2 The new radius at p2
     */
    setRadius2(r2: number): void {
        this.r2 = r2;
        this.invalidAABB();
    }

    /**
     *  @return Current radius at p1
     */
    getRadius1(): number {
        return this.r1;
    }

    /**
     *  @return Current radius at p2
     */
    getRadius2(): number {
        return this.r2;
    }

    /**
     *  @param p1 The new position of the first segment point.
     */
    setPosition1(p1: Vector3): void {
        this.p1.copy(p1);
        this.invalidAABB();
    }

    /**
     *  @param p2 The new position of the second segment point
     */
    setPosition2(p2: Vector3): void {
        this.p2.copy(p2);
        this.invalidAABB();
    }

    /**
     *  @return Current position of the first segment point
     */
    getPosition1(): Vector3 {
        return this.p1;
    }

    /**
     *  @return Current position of the second segment point
     */
    getPosition2(): Vector3 {
        return this.p2;
    }

    override computeDistanceAABB(d: number): Box3 {
        const b1 = new Box3(
            this.p1.clone().add(new Vector3(-this.r1 - d, -this.r1 - d, -this.r1 - d)),
            this.p1.clone().add(new Vector3(this.r1 + d, this.r1 + d, this.r1 + d))
        );
        const b2 = new Box3(
            this.p2.clone().add(new Vector3(-this.r2 - d, -this.r2 - d, -this.r2 - d)),
            this.p2.clone().add(new Vector3(this.r2 + d, this.r2 + d, this.r2 + d))
        );
        return b1.union(b2);
    }

    /**
     * @link Element.prepareForEval for a complete description
     */
    prepareForEval(): void {
        if (!this.valid_aabb) {
            this.valid_aabb = true;
        }
    }

    /**
     * @return The Areas object corresponding to the node/primitive, in an array
     */
    override getDistanceAreas(d: number): {
        aabb: Box3,
        bv: AreaCapsule,
        obj: SDFCapsule
    }[] {
        if (!this.valid_aabb) {
            throw "ERROR: Cannot get area of invalid primitive";
        } else {
            return [{
                aabb: this.computeDistanceAABB(d),
                bv: new AreaCapsule(
                    this.p1,
                    this.p2,
                    this.r1 + d,
                    this.r2 + d,
                    this.r1 / (this.r1 + d), // Adjust accuracy factor according to the radius and not only to the required d
                    this.r2 / (this.r2 + d)
                ),
                obj: this
            }];
        }
    }

    /**
     *  @link Element.value for a complete description
     */
    value = (function () {
        const v = new Vector3();
        const proj = new Vector3();
        /**
         *  @param p
         *  @param res
         */
        return function (this: SDFCapsule, p: Vector3, res: ValueResultType): void {
            const self = this as SDFCapsule;
            v.subVectors(p, self.p1);
            const p1p_sqrl = v.lengthSq();

            // In unit_dir basis, vector (this.r1-this.r2, this.length) is normal to the "weight line"
            // We need a projection in this direction up to the segment line to know in which case we fall.

            const x_p_2D = v.dot(self.unit_dir);
            // pythagore inc.
            const y_p_2D = Math.sqrt(
                Math.max( // Necessary because of rounded errors, pyth result can be <0 and this causes sqrt to return NaN...
                    0.0, p1p_sqrl - x_p_2D * x_p_2D // =  y_p_2D² by pythagore
                )
            );
            const t = -y_p_2D / self.length;

            const proj_x = x_p_2D + t * (self.r1 - self.r2);
            // var proj_y = 0.0; // by construction

            // Easy way to compute the distance now that we have the projection on the segment
            const a = MathUtils.clamp(proj_x / self.length, 0, 1.0);
            proj.copy(self.p1).lerp(self.p2, a); // compute the actual 3D projection
            const l = v.subVectors(p, proj).length();
            res.v = l - (a * self.r2 + (1.0 - a) * self.r1);
            if (res.g) {
                res.g.copy(v).divideScalar(l);
            }
        };
    })();
}

Types.register(SDFCapsule.type, SDFCapsule);

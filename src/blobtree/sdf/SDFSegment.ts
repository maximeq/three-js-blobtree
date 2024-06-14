import { Vector3, Line3, Box3 } from "three"
import { Types } from "../Types.js";
import { SDFPrimitive, type SDFPrimitiveJSON } from "./SDFPrimitive.js";
import { AreaCapsule } from "../areas/AreaCapsule.js";
import type { ValueResultType } from "../Element.js";

export type SDFSegmentJSON = { p1: { x: number, y: number, z: number }, p2: { x: number, y: number, z: number }, acc: number } & SDFPrimitiveJSON

export class SDFSegment extends SDFPrimitive {

    static override type = "SDFSegment";

    static override fromJSON(json: SDFSegmentJSON): SDFSegment {
        return new SDFSegment(
            new Vector3(json.p1.x, json.p1.y, json.p1.z),
            new Vector3(json.p2.x, json.p2.y, json.p2.z),
            json.acc
        );
    };

    p1: Vector3
    p2: Vector3
    acc: number

    // Helper for evaluation
    l: Line3

    /**
    *  @param p1 Position of the first segment extremity
    *  @param p2 Position of the second segment extremity
    *  @param acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
    */
    constructor(p1: Vector3, p2: Vector3, acc: number) {
        super();

        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.acc = acc || 1.0;
        this.l = new Line3(this.p1, this.p2);
    }

    override getType(): string {
        return SDFSegment.type;
    };

    override toJSON(): SDFSegmentJSON {
        return {
            ...super.toJSON(),
            p1: {
                x: this.p1.x,
                y: this.p1.y,
                z: this.p1.z
            },
            p2: {
                x: this.p2.x,
                y: this.p2.y,
                z: this.p2.z
            },
            acc: this.acc
        }
    };

    /**
     *  @param acc The new accuracy factor
     */
    setAccuracy(acc: number): void {
        this.acc = acc;
        this.invalidAABB();
    };

    /**
     *  @return Current accuracy factor
     */
    getAccuracy(): number {
        return this.acc;
    };

    /**
     *  @param  p1 The new position of the first segment point.
     */
    setPosition1(p1: Vector3): void {
        this.p1.copy(p1);
        this.invalidAABB();
    };
    /**
     *  @param p2 The new position of the second segment point
     */
    setPosition2(p2: Vector3): void {
        this.p2.copy(p2);
        this.invalidAABB();
    };

    /**
     *  @return Current position of the first segment point
     */
    getPosition1(): Vector3 {
        return this.p1;
    };
    /**
     *  @return Current position of the second segment point
     */
    getPosition2(): Vector3 {
        return this.p2;
    };

    // [Abstract]
    computeDistanceAABB(d: number): Box3 {
        var b1 = new Box3(
            this.p1.clone().add(new Vector3(-d, -d, -d)),
            this.p1.clone().add(new Vector3(d, d, d))
        );
        var b2 = new Box3(
            this.p2.clone().add(new Vector3(-d, -d, -d)),
            this.p2.clone().add(new Vector3(d, d, d))
        );
        return b1.union(b2);
    };
    // [Abstract]
    prepareForEval(): void {
        if (!this.valid_aabb) {
            this.l.set(this.p1, this.p2);
            this.valid_aabb = true;
        }
    };

    /**
     * @return The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d: number): {
        aabb: Box3,
        bv: AreaCapsule,
        obj: SDFSegment
    }[] {
        if (!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid primitive";
        } else {
            return [{
                aabb: this.computeDistanceAABB(d),
                bv: new AreaCapsule(
                    this.p1,
                    this.p2,
                    d,
                    d,
                    this.acc,
                    this.acc
                ),
                obj: this
            }];
        }
    };

    /**
     *  @link Element.value for a complete description
     */
    value = (function () {
        var v = new Vector3();
        var lc = new Vector3();
        /**
         *  @param {Vector3} p
         *  @param {ValueResultType} res
         */
        return function (this: SDFSegment, p: Vector3, res: ValueResultType): void {
            this.l.closestPointToPoint(p, true, v);
            res.v = lc.subVectors(p, v).length();
            if (res.g) {
                res.g.copy(lc).divideScalar(res.v);
            }
        };
    })();

};


Types.register(SDFSegment.type, SDFSegment);
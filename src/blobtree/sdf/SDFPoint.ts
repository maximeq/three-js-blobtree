import { Vector3, Box3 } from "three"
import { Types } from "../Types.js";
import { SDFPrimitive, type SDFPrimitiveJSON } from "./SDFPrimitive.js";
import { AreaSphere } from "../areas/AreaSphere.js";
import type { Area } from "../areas/Area.js";
import type { ValueResultType } from "../Element.js";

export type SDFPointJSON = { p: { x: number, y: number, z: number }, acc: number } & SDFPrimitiveJSON

export class SDFPoint extends SDFPrimitive {

    static type = "SDFPoint";

    static fromJSON(json: SDFPointJSON): SDFPoint {
        return new SDFPoint(new Vector3(json.p.x, json.p.y, json.p.z), json.acc);
    };

    p: Vector3;
    acc: number;

    /**
     *  @param p Position (ie center) of the point
     *  @param acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
     */
    constructor(p: Vector3, acc?: number) {
        super();

        this.p = p.clone();
        this.acc = acc || 1.0;
    }


    getType() {
        return SDFPoint.type;
    };

    toJSON(): SDFPointJSON {
        return {
            ...super.toJSON(),
            p: {
                x: this.p.x,
                y: this.p.y,
                z: this.p.z
            },
            acc: this.acc
        };
    };

    /**
     *  @param acc The new accuracy factor
     */
    setAccuracy(acc: number) {
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
     *  @param p The new position (ie center)
     */
    setPosition(p: Vector3) {
        this.p.copy(p);
        this.invalidAABB();
    };

    /**
     *  @return Current position (ie center)
     */
    getPosition(): Vector3 {
        return this.p;
    };

    // [Abstract]
    computeDistanceAABB(d: number) {
        return new Box3(
            this.p.clone().add(new Vector3(-d, -d, -d)),
            this.p.clone().add(new Vector3(d, d, d))
        );
    };
    // [Abstract]
    prepareForEval(): void {
        if (!this.valid_aabb) {
            this.valid_aabb = true;
        }
    };

    /**
     * @link SDFPrimitive.getDistanceAreas
     * @param d Distance to consider for the area computation.
     * @returns {Array.<>}
     */
    getDistanceAreas(d: number): { aabb: Box3, bv: Area, obj: SDFPoint }[] {
        if (!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid primitive";
        } else {
            return [{
                aabb: this.computeDistanceAABB(d),
                bv: new AreaSphere(
                    this.p,
                    d,
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

        return function (p: Vector3, res: ValueResultType) {
            if (!this.valid_aabb) {
                throw "Error : PrepareForEval should have been called";
            }

            v.subVectors(p, this.p);
            var l = v.length();
            res.v = l;
            if (res.g) {
                res.g.copy(v).multiplyScalar(1 / l);
            }
        };
    })();


};


Types.register(SDFPoint.type, SDFPoint);
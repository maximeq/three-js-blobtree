import { Vector3, Box3 } from "three"
import { Types } from "../Types.js";
import { SDFPrimitive, type SDFPrimitiveJSON } from "./SDFPrimitive.js";
import { AreaSphere } from "../areas/AreaSphere.js";
import type { ValueResultType } from "../Element.js";

export type SDFSphereJSON = { p: { x: number, y: number, z: number }, r: number } & SDFPrimitiveJSON

export class SDFSphere extends SDFPrimitive {

    static type = "SDFSphere";

    static fromJSON(json: SDFSphereJSON): SDFSphere {
        return new SDFSphere(new Vector3(json.p.x, json.p.y, json.p.z), json.r);
    };

    p: Vector3;
    r: number;

    /**
     *  @param  p Position (ie center) of the sphere
     *  @param  r Radius of the sphere
     */
    constructor(p: Vector3, r: number) {
        super();

        this.p = p.clone();
        this.r = r;
    }

    getType() {
        return SDFSphere.type;
    };

    toJSON(): SDFSphereJSON {
        return {
            ...super.toJSON(),
            p: {
                x: this.p.x,
                y: this.p.y,
                z: this.p.z
            },
            r: this.r
        };
    };

    /**
     *  @param r The new radius
     */
    setRadius(r: number) {
        this.r = r;
        this.invalidAABB();
    };

    /**
     *  @return Current radius
     */
    getRadius(): number {
        return this.r;
    };

    /**
     *  @param p The new position (ie center)
     */
    setPosition(p: Vector3) {
        this.p.copy(p);
        this.invalidAABB();
    };

    /**
     *  @return  Current position (ie center)
     */
    getPosition(): Vector3 {
        return this.p;
    };

    // [Abstract]
    computeDistanceAABB(d: number): Box3 {
        return new Box3(
            this.p.clone().add(new Vector3(-this.r - d, -this.r - d, -this.r - d)),
            this.p.clone().add(new Vector3(this.r + d, this.r + d, this.r + d))
        );
    };

    // [Abstract]
    prepareForEval(): void {
        if (!this.valid_aabb) {
            this.valid_aabb = true;
        }
    };

    /**
     * @param {number} d
     * @return {Object} The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d: number): {
        aabb: Box3,
        bv: AreaSphere,
        obj: SDFSphere
    }[] {
        if (!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid primitive";
        } else {
            return [{
                aabb: this.computeDistanceAABB(d),
                bv: new AreaSphere(
                    this.p,
                    this.r + d,
                    this.r / (this.r + d) // Adjust accuray factor according to the radius and not only to the required d
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
        /**
         *  @param {Vector3} p
         *  @param {ValueResultType} res
         */
        return function (p: Vector3, res: ValueResultType) {
            /** @type {SDFSphere} */
            let self = this;

            if (!self.valid_aabb) {
                throw "Error : PrepareForEval should have been called";
            }

            v.subVectors(p, self.p);
            var l = v.length();
            res.v = l - self.r;
            if (res.g) {
                res.g.copy(v).multiplyScalar(1 / l);
            }
        };
    })();
};

Types.register(SDFSphere.type, SDFSphere);
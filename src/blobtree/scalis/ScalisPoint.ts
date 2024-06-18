import { Box3, Vector3 } from "three";
import { Types } from "../Types";
import { Material } from "../Material";
import { ScalisPrimitive, type ScalisPrimitiveJSON, type ScalisPrimitiveVolType, type ScalisPointType } from "./ScalisPrimitive";
import { ScalisVertex } from "./ScalisVertex";
import { ScalisMath } from "./ScalisMath";
import { AreaSphere } from "../areas/AreaSphere";
import type { ValueResultType } from "../Element";

// AreaScalisPoint is deprecated since the more general AreaSphere is now supposed to do the job.
// Uncomment if you see any difference.
// const AreaScalisPoint = require("../areas/deprecated/AreaScalisPoint");

export type ScalisPointJSON = { density: number } & ScalisPrimitiveJSON;
export class ScalisPoint extends ScalisPrimitive {
    static override type: ScalisPointType = "ScalisPoint";

    static override fromJSON(json: ScalisPointJSON): ScalisPoint {
        const v = ScalisVertex.fromJSON(json.v[0]);
        const m = Material.fromJSON(json.materials[0]);
        return new ScalisPoint(v, json.volType, json.density, m);
    }

    density: number;
    v_to_p: Vector3 = new Vector3();

    /**
     * @param vertex The vertex with point parameters.
     * @param volType The volume type wanted for this primitive.
     *                 Note: "convolution" does not make sense for a point, so technically,
     *                 ScalisPrimitive.DIST or ScalisPrimitive.CONVOL will give the same results.
     *                 However, since this may be a simple way of sorting for later blending,
     *                 you can still choose between the 2 options.
     * @param density Implicit field density.
     *                 Gives a finer control of the created implicit field.
     * @param mat Material for the point
     */
    constructor(vertex: ScalisVertex, volType: ScalisPrimitiveVolType, density: number, mat: Material) {
        super();

        this.v.push(vertex);
        this.v[0].setPrimitive(this);

        this.volType = volType;
        this.density = density;
        this.materials.push(mat);
    }

    override getType(): ScalisPointType {
        return ScalisPoint.type;
    }

    override toJSON(): ScalisPointJSON {
        return {
            ...super.toJSON(),
            density: this.density
        };
    }

    /**
     * @param d New density to set
     */
    setDensity(d: number): void {
        this.density = d;
        this.invalidAABB();
    }

    /**
     * @return Current density
     */
    getDensity(): number {
        return this.density;
    }

    /**
     * Set material for this point
     * @param m Material
     */
    setMaterial(m: Material): void {
        this.materials[0].copy(m);
        this.invalidAABB();
    }

    /**
     * @link Primitive.computeHelpVariables
     */
    computeHelpVariables(): void {
        this.computeAABB();
    }

    /**
     * @link Element.prepareForEval
     */
    prepareForEval(): void {
        if (!this.valid_aabb) {
            this.computeHelpVariables();
            this.valid_aabb = true;
        }
    }

    override getAreas(): { aabb: Box3, bv: AreaSphere, obj: ScalisPoint }[] {
        if (!this.valid_aabb) {
            console.error("ERROR: Cannot get area of invalid primitive");
            return [];
        } else {
            return [{
                aabb: this.aabb,
                bv: new AreaSphere(this.v[0].getPos(), ScalisMath.KS * this.v[0].getThickness(), ScalisMath.KIS),
                // AreaScalisPoint is deprecated and AreaSphere should be used instead. Uncomment if you notice accuracy issues.
                // bv: new AreaScalisPoint(this.v[0].getPos(), this.v[0].getThickness()),
                obj: this
            }];
        }
    }

    /**
     * @link Element.heuristicStepWithin
     * @return The next step length to do with respect to this primitive/node.
     */
    heuristicStepWithin(): number {
        return this.v[0].getThickness() / 3;
    }

    /**
     * @link Element.value
     *
     * @param p Point where we want to evaluate the primitive field
     * @param res ValueResultType
     */
    value(p: Vector3, res: ValueResultType): void {
        if (!this.valid_aabb) {
            throw "Error: PrepareForEval should have been called";
        }

        const thickness = this.v[0].getThickness();

        // Eval itself
        this.v_to_p.subVectors(p, this.v[0].getPos());
        const r2 = this.v_to_p.lengthSq() / (thickness * thickness);
        const tmp = 1.0 - ScalisMath.KIS2 * r2;
        if (tmp > 0.0) {
            res.v = this.density * tmp * tmp * tmp * ScalisMath.Poly6NF0D;

            if (res.g) {
                // Gradient computation is easy since the
                // gradient is radial. We use the analytical solution
                // to directional gradient (differential in this.v_to_p length)
                const tmp2 = -this.density * ScalisMath.KIS2 * 6.0 * this.v_to_p.length() * tmp * tmp * ScalisMath.Poly6NF0D / (thickness * thickness);
                res.g.copy(this.v_to_p).normalize().multiplyScalar(tmp2);
            }
            if (res.m) { res.m.copy(this.materials[0]); }
        } else {
            res.v = 0.0;
            if (res.g) { res.g.set(0, 0, 0); }
            if (res.m) { res.m.copy(Material.defaultMaterial); }
        }
    }

    override distanceTo(p: Vector3): number {
        // return distance point/segment
        // don't take thickness into account
        return p.distanceTo(this.v[0].getPos());
        // return p.distanceTo(this.v[0].getPos()) - this.v[0].getThickness();
    }
}

Types.register(ScalisPoint.type, ScalisPoint);

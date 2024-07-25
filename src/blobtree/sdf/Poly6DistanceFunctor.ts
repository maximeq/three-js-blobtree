import { Types } from "../Types";
import { DistanceFunctor, type DistanceFunctorJSON, type Poly6DistanceFunctorType } from "./DistanceFunctor";

export type Poly6DistanceFunctorJSON = { scale: number } & DistanceFunctorJSON;

/**
 *  Specialised Distance Functor using a 6 degree polynomial function.
 *  This is the function similar to the one used in SCALIS primitives.
 *  @constructor
 */
export class Poly6DistanceFunctor extends DistanceFunctor {
    static override type: Poly6DistanceFunctorType = "Poly6DistanceFunctor";
    scale: number;

    fromJSON(json: Poly6DistanceFunctorJSON): Poly6DistanceFunctor {
        return new Poly6DistanceFunctor(json.scale);
    }

    /**
     * This is the standard 6 degree polynomial function used for implicit modeling.
     * At 0, its value is 1 with a zero derivative.
     * At 1, its value is 0 with a zero derivative.
     */
    static evalStandard(d: number): number {
        if (d < 0.0) {
            return 1.0;
        }
        const aux = 1.0 - d * d;

        if (aux > 0.0) {
            return aux * aux * aux;
        } else {
            return 0.0;
        }
    }

    constructor(scale: number) {
        super();
        this.scale = scale || 1.0;
    }

    /**
     *  @return Type of the element
     */
    override getType(): Poly6DistanceFunctorType {
        return Poly6DistanceFunctor.type;
    }

    /**
     *  @return Json description of this functor.
     */
    override toJSON(): Poly6DistanceFunctorJSON {
        return {
            ...super.toJSON(),
            scale: this.scale
        };
    }

    /**
     * @link DistanceFunctor.value for a complete description.
     * @param d The distance to be considered.
     * @returns Scalar field value according to given distance d.
     */
    value(d: number): number {
        let dp = d / (2 * this.scale); // ensure the support fits the scale.
        dp = dp + 0.5;
        return Poly6DistanceFunctor.evalStandard(dp) / Poly6DistanceFunctor.evalStandard(0.5);
    }

    /**
     * @returns dimensional gradient at d.
     */
    override gradient(d: number): number {
        const ds = d / (2 * this.scale) + 0.5;
        let res = 1 - ds * ds;
        res = -(6 / (2 * this.scale)) * ds * res * res / Poly6DistanceFunctor.evalStandard(0.5);
        return res;
    }

    /**
     * @link DistanceFunctor.getSupport for a complete description.
     */
    override getSupport(): number {
        return this.scale;
    }
}

Types.register(Poly6DistanceFunctor.type, Poly6DistanceFunctor);

import { DistanceFunctor, type DistanceFunctorJSON } from "./DistanceFunctor";
export type Poly6DistanceFunctorJSON = {
    scale: number;
} & DistanceFunctorJSON;
/**
 *  Specialised Distance Functor using a 6 degree polynomial function.
 *  This is the function similar to the one used in SCALIS primitives.
 *  @constructor
 */
export declare class Poly6DistanceFunctor extends DistanceFunctor {
    static type: string;
    scale: number;
    fromJSON(json: Poly6DistanceFunctorJSON): Poly6DistanceFunctor;
    /**
     * This is the standard 6 degree polynomial function used for implicit modeling.
     * At 0, its value is 1 with a zero derivative.
     * At 1, its value is 0 with a zero derivative.
     */
    evalStandard(d: number): number;
    constructor(scale: number);
    /**
     *  @return Type of the element
     */
    getType(): string;
    /**
     *  @return Json description of this functor.
     */
    toJSON(): Poly6DistanceFunctorJSON;
    /**
     * @link DistanceFunctor.value for a complete description.
     * @param d The distance to be considered.
     * @returns Scalar field value according to given distance d.
     */
    value(d: number): number;
    /**
     * @returns dimensional gradient at d.
     */
    gradient(d: number): number;
    /**
     * @link DistanceFunctor.getSupport for a complete description.
     */
    getSupport(): number;
}
//# sourceMappingURL=Poly6DistanceFunctor.d.ts.map
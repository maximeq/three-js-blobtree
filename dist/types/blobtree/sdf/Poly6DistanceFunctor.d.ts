import { DistanceFunctor } from "./DistanceFunctor";
/** @typedef {import('./DistanceFunctor').DistanceFunctorJSON} DistanceFunctorJSON */
/** @typedef {{scale:number} & DistanceFunctorJSON} Poly6DistanceFunctorJSON */
/**
 *  Specialised Distance Functor using a 6 degree polynomial function.
 *  This is the function similar to the one used in SCALIS primitives.
 *  @constructor
 */
export declare class Poly6DistanceFunctor extends DistanceFunctor {
    static type: string;
    /**
     * @param {Poly6DistanceFunctorJSON} json
     */
    static fromJSON(json: any): Poly6DistanceFunctor;
    /**
     * This is the standard 6 degree polynomial function used for implicit modeling.
     * At 0, its value is 1 with a zero derivative.
     * At 1, its value is 0 with a zero derivative.
     * @param {number} d
     */
    static evalStandard(d: any): number;
    /**
     * @param {number} scale
     */
    constructor(scale: any);
    /**
     *  @return {string} Type of the element
     */
    getType(): string;
    /**
     *  @return {Object} Json description of this functor.
     */
    toJSON(): {
        scale: any;
        type: string;
    };
    /**
     * @link DistanceFunctor.value for a complete description.
     * @param {number} d The distance to be considered.
     * @returns {number} Scalar field value according to given distance d.
     */
    value(d: any): number;
    /**
     * @param {number} d
     * @returns {number} dimensional gradient at d.
     */
    gradient(d: any): number;
    /**
     * @link DistanceFunctor.getSupport for a complete description.
     * @returns
     */
    getSupport(): any;
}
//# sourceMappingURL=Poly6DistanceFunctor.d.ts.map
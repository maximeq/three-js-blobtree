export = Poly6DistanceFunctor;
/** @typedef {import('./DistanceFunctor').DistanceFunctorJSON} DistanceFunctorJSON */
/** @typedef {{scale:number} & DistanceFunctorJSON} Poly6DistanceFunctorJSON */
/**
 *  Specialised Distance Functor using a 6 degree polynomial function.
 *  This is the function similar to the one used in SCALIS primitives.
 *  @constructor
 */
declare class Poly6DistanceFunctor extends DistanceFunctor {
    /**
     * @param {Poly6DistanceFunctorJSON} json
     */
    static fromJSON(json: Poly6DistanceFunctorJSON): import("./Poly6DistanceFunctor.js");
    /**
     * This is the standard 6 degree polynomial function used for implicit modeling.
     * At 0, its value is 1 with a zero derivative.
     * At 1, its value is 0 with a zero derivative.
     * @param {number} d
     */
    static evalStandard(d: number): number;
    /**
     * @param {number} scale
     */
    constructor(scale: number);
    scale: number;
    /**
     *  @return {Object} Json description of this functor.
     */
    toJSON(): any;
    /**
     * @param {number} d
     * @returns {number} dimensional gradient at d.
     */
    gradient(d: number): number;
}
declare namespace Poly6DistanceFunctor {
    export { DistanceFunctorJSON, Poly6DistanceFunctorJSON };
}
import DistanceFunctor = require("./DistanceFunctor.js");
type Poly6DistanceFunctorJSON = {
    scale: number;
} & DistanceFunctorJSON;
type DistanceFunctorJSON = import('./DistanceFunctor').DistanceFunctorJSON;
//# sourceMappingURL=Poly6DistanceFunctor.d.ts.map
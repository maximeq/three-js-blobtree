export = DistanceFunctor;
/** @typedef {*} Json */
/**
 * @typedef {{type:string}} DistanceFunctorJSON
 */
/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @constructor
 */
declare class DistanceFunctor {
    static type: string;
    /**
     *  @abstract
     *  @param {DistanceFunctorJSON} json Json description of the object
     */
    static fromJSON(json: DistanceFunctorJSON): any;
    /**
     *  @return {string} Type of the element
     */
    getType(): string;
    /**
     *  @abstract
     *  Return a Javscript Object respecting JSON convention and can be used to serialize the functor.
     *  @returns {DistanceFunctorJSON}
     */
    toJSON(): DistanceFunctorJSON;
    /**
     *  @abstract
     *  @param {number} _d The distance to be considered.
     *  @return {number} Scalar field value according to given distance d.
     */
    value(_d: number): number;
    /**
     *  Perform a numerical approximation of the gradient according to epsilon.
     *  @param {number} d The distance to be considered.
     *  @param {number} epsilon The numerica step for this gradient computation. Default to 0.00001.
     */
    numericalGradient(d: number, epsilon: number): number;
    /**
     *  Compute the gradient. Should be reimplemented in most cases.
     *  By default, this function return a numerical gradient with epsilon at 0.00001.
     *  @return {number} One dimensional gradient at d.
     */
    gradient(d: any): number;
    /**
     *  @returns {number} Distance above which all values will be 0. Should be reimplemented and default to infinity.
     */
    getSupport(): number;
}
declare namespace DistanceFunctor {
    export { Json, DistanceFunctorJSON };
}
type DistanceFunctorJSON = {
    type: string;
};
type Json = any;
//# sourceMappingURL=DistanceFunctor.d.ts.map
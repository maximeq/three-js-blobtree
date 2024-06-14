export type DistanceFunctorJSON = {
    type: string;
};
/**
 *  A superclass for Node and Primitive in the blobtree.
 */
export declare abstract class DistanceFunctor {
    static type: string;
    /**
     *  @abstract
     *  @param json Json description of the object
     */
    static fromJSON(json: DistanceFunctorJSON): DistanceFunctor;
    /**
     *  @return Type of the element
     */
    getType(): string;
    /**
     *  @abstract
     *  Return a Javscript Object respecting JSON convention and can be used to serialize the functor.
     */
    toJSON(): DistanceFunctorJSON;
    /**
     *  @abstract
     *  @param d The distance to be considered.
     *  @return Scalar field value according to given distance d.
     */
    abstract value(d: number): number;
    /**
     *  Perform a numerical approximation of the gradient according to epsilon.
     *  @param d The distance to be considered.
     *  @param epsilon The numerical step for this gradient computation. Default to 0.00001.
     */
    numericalGradient(d: number, epsilon?: number): number;
    /**
     *  Compute the gradient. Should be reimplemented in most cases.
     *  By default, this function returns a numerical gradient with epsilon at 0.00001.
     *  @return One-dimensional gradient at d.
     */
    gradient(d: number): number;
    /**
     *  @returns Distance above which all values will be 0. Should be reimplemented and defaults to infinity.
     */
    getSupport(): number;
}
//# sourceMappingURL=DistanceFunctor.d.ts.map
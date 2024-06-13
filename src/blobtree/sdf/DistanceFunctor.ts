import { Types } from "../Types";

export type DistanceFunctorJSON = { type: string };

/**
 *  A superclass for Node and Primitive in the blobtree.
 */
export abstract class DistanceFunctor {
    static type = "DistanceFunctor" as const;

    /**
     *  @abstract
     *  @param json Json description of the object
     */
    static fromJSON(json: DistanceFunctorJSON): DistanceFunctor {
        return Types.fromJSON(json);
    }

    /**
     *  @return Type of the element
     */
    getType(): string {
        return DistanceFunctor.type;
    }

    /**
     *  @abstract
     *  Return a Javscript Object respecting JSON convention and can be used to serialize the functor.
     */
    toJSON(): DistanceFunctorJSON {
        return {
            type: this.getType()
        };
    };

    /**
     *  @abstract
     *  @param _d The distance to be considered.
     *  @return Scalar field value according to given distance d.
     */
    abstract value(_d: number): number;

    /**
     *  Perform a numerical approximation of the gradient according to epsilon.
     *  @param d The distance to be considered.
     *  @param epsilon The numerical step for this gradient computation. Default to 0.00001.
     */
    numericalGradient(d: number, epsilon: number = 0.00001): number {
        return (this.value(d + epsilon) - this.value(d - epsilon)) / (2 * epsilon);
    }

    /**
     *  Compute the gradient. Should be reimplemented in most cases.
     *  By default, this function returns a numerical gradient with epsilon at 0.00001.
     *  @return One-dimensional gradient at d.
     */
    gradient(d: number): number {
        return this.numericalGradient(d, 0.00001);
    }

    /**
     *  @returns Distance above which all values will be 0. Should be reimplemented and defaults to infinity.
     */
    getSupport(): number {
        return Infinity;
    }
}

Types.register(DistanceFunctor.type, DistanceFunctor);

'use strict';

const Types = require("../Types.js");

/** @typedef {*} Json */

/**
 * @typedef {{type:string}} DistanceFunctorJSON
 */

/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @constructor
 */
class DistanceFunctor {

    static type = "DistanceFunctor";

    /**
     *  @abstract
     *  @param {DistanceFunctorJSON} json Json description of the object
     */
    static fromJSON(json) {
        return Types.fromJSON(json);
    };

    /**
     *  @return {string} Type of the element
     */
    getType() {
        return DistanceFunctor.type;
    };

    /**
     *  @abstract
     *  Return a Javscript Object respecting JSON convention and can be used to serialize the functor.
     *  @returns {DistanceFunctorJSON}
     */
    toJSON() {
        return {
            type: this.getType()
        };
    };

    /**
     *  @abstract
     *  @param {number} _d The distance to be considered.
     *  @return {number} Scalar field value according to given distance d.
     */
    value(_d) {
        throw "Error : not implemented. Must be reimplemented in children classes.";
    };

    /**
     *  Perform a numerical approximation of the gradient according to epsilon.
     *  @param {number} d The distance to be considered.
     *  @param {number} epsilon The numerica step for this gradient computation. Default to 0.00001.
     */
    numericalGradient(d, epsilon) {
        var eps = epsilon ? epsilon : 0.00001;
        return (this.value(d + eps) - this.value(d - eps)) / (2 * eps);
    };

    /**
     *  Compute the gradient. Should be reimplemented in most cases.
     *  By default, this function return a numerical gradient with epsilon at 0.00001.
     *  @return {number} One dimensional gradient at d.
     */
    gradient(d) {
        return this.numericalGradient(d, 0.00001);
    };

    /**
     *  @returns {number} Distance above which all values will be 0. Should be reimplemented and default to infinity.
     */
    getSupport() {
        return Infinity;
    };


};

Types.register(DistanceFunctor.type, DistanceFunctor);

module.exports = DistanceFunctor;



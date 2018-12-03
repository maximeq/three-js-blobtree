'use strict';

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("../Types.js");

/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @constructor
 */
var DistanceFunctor = function () {
};

DistanceFunctor.prototype.constructor = DistanceFunctor;

DistanceFunctor.type = "DistanceFunctor";
Types.register(DistanceFunctor.type, DistanceFunctor);
/**
 *  @return {string} Type of the element
 */
DistanceFunctor.prototype.getType = function() {
    return DistanceFunctor.type;
};

/**
 *  @abstract
 *  Return a Javscript Object respecting JSON convention.
 */
DistanceFunctor.prototype.toJSON = function(){
    return {
        type:this.getType()
    };
};
/**
 *  @abstract
 *  @param {Object} json Json description of the object
 */
DistanceFunctor.prototype.fromJSON = function(json){
    return Types.fromJSON(json);
};

/**
 *  @param {number} d The distance to be considered.
 *  @return {number} Scalar field value according to given distance d.
 */
DistanceFunctor.prototype.value = function(d) {
    throw "Error : not implemented. Must be reimplemented in children classes.";
};

DistanceFunctor.prototype.value = function(d) {
    throw "Error : not implemented. Must be reimplemented in children classes.";
};

/**
 *  Perform a numerical approximation of the gradient according to epsilon.
 *  @param {number} d The distance to be considered.
 *  @param {number} epsilon The numerica step for this gradient computation. Default to 0.00001.
 */
DistanceFunctor.prototype.numericalGradient = function(d,epsilon){
    var eps = epsilon ? epsilon : 0.00001;
    return (this.value(d+eps)-this.value(d-eps))/(2*eps);
};

/**
 *  Compute the gradient. Should be reimplemented in most cases.
 *  By default, this function return a numerical gradient with epsilon at 0.00001.
 *  @return {number} One dimensional gradient at d.
 *
 */
DistanceFunctor.prototype.gradient = function(d){
    return this.numericalGradient(d,0.00001);
};

/**
 *  @return {number} Distance above which all values will be 0. Should be reimplemented and default to infinity.
 *
 */
DistanceFunctor.prototype.getSupport = function(d){
    return Infinity;
};


module.exports = DistanceFunctor;



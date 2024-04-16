'use strict';

/**
 *  @constructor
 *
 *  @param {function(number)} f A distance function
 *  @param {support} support The support of the function, ie d such that f(d>=support) = 0;
 */
var SimpleFunctor = function (f, support) {
    this.f = f;
    this.support = support;
};

SimpleFunctor.prototype = Object.create(Blobtree.DistanceFunctor.prototype);
SimpleFunctor.prototype.constructor = SimpleFunctor;

SimpleFunctor.type = "SimpleFunctor";
Blobtree.Types.register(SimpleFunctor.type, SimpleFunctor);

SimpleFunctor.prototype.value = function(d) {
    return this.f(d);
};

SimpleFunctor.prototype.getSupport = function(d){
    return this.support;
};
'use strict';

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("../Types.js");
const DistanceFunctor = require("./DistanceFunctor.js");

/**
 *  Specialised Distance Functor using a 6 degree polynomial function.
 *  This is the function similar to the one used in SCALIS primitives.
 *  @constructor
 */
var Poly6DistanceFunctor = function (scale) {
    this.scale = scale || 1.0;
};

Poly6DistanceFunctor.prototype = Object.create(DistanceFunctor.prototype);
Poly6DistanceFunctor.prototype.constructor = Poly6DistanceFunctor;

Poly6DistanceFunctor.type = "Poly6DistanceFunctor";
Types.register(Poly6DistanceFunctor.type, Poly6DistanceFunctor);

/**
 *  @return {string} Type of the element
 */
Poly6DistanceFunctor.prototype.getType = function() {
    return Poly6DistanceFunctor.type;
};

/**
 *  @return {Object} Json description of this functor.
 */
Poly6DistanceFunctor.prototype.toJSON = function() {
    var json = Blobtree.DistanceFunctor.prototype.toJSON.call(this,c);
    json.scale = this.scale;
    return json;
};

// This is the standard 6 degree polynomial function used for implicit modeling.
// At 0, its value is 1 with a zero derivative.
// at 1, its value is 0 with a zero derivative.
Poly6DistanceFunctor.evalStandard = function(d) {
    if(d<0.0){
        return 1.0;
    }
    var aux = 1.0-d*d;

    if(aux > 0.0)
    {
        return aux*aux*aux;
    }else{
        return 0.0;
    }
};
// [Abstract]
Poly6DistanceFunctor.prototype.value = function(d) {
    var dp = d/(2*this.scale); // ensure the support fits the scale.
    dp = dp + 0.5;
    return Poly6DistanceFunctor.evalStandard(dp)/Poly6DistanceFunctor.evalStandard(0.5);
};

// [Abstract] Re-implementation is  optional, numerical computation can be used.
Poly6DistanceFunctor.prototype.gradient = function(d){
    var ds = d/(2*this.scale) + 0.5;
    var res = (1-ds*ds);
    res = -(6/(2*this.scale))*ds*res*res/Poly6DistanceFunctor.evalStandard(0.5);
    return res;
};

// [Abstract]
Poly6DistanceFunctor.prototype.getSupport = function(d){
    return this.scale;
};

module.exports = Poly6DistanceFunctor;



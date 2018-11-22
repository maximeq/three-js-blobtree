'use strict';

const Element = require('../Element.js');
const Types = require("../Types.js");

/**
 *  This class implements an abstract primitve class for signed distance field.
 *  SDFPrimitive subclasses must define a scalar field being the distance to a geometry.
 *  @constructor
 *  @extends {Element}
 */
var SDFPrimitive = function ()
{
    Element.call(this);

    // Default bounding box for a SDF is infinite.
    this.aabb.set(
        new THREE.Vector3( - Infinity, - Infinity, - Infinity ),
        new THREE.Vector3( + Infinity, + Infinity, + Infinity )
    );
};

SDFPrimitive.prototype = Object.create(Element.prototype);
SDFPrimitive.prototype.constructor = SDFPrimitive;

SDFPrimitive.type = "SDFPrimitive";
Types.register(SDFPrimitive.type, SDFPrimitive);

SDFPrimitive.prototype.SDFPrimitive = function(){
    return SDFPrimitive.type;
};

// Abstract
SDFPrimitive.prototype.computeAABB = function() {
    // Nothing to do, SDF have infinite bounding box
};

/**
 *  Return the bounding box of the node for a given maximum distance.
 *  Ie, the distance field is greater than d everywhere outside the returned box.
 *  @param {number} d Distance
 *  @abstract
 */
SDFPrimitive.prototype.computeDistanceAABB = function(d) {
    throw "computeDistanceAABB is an abstract function of SDFPrimitive. Please reimplement it in children classes.";
};

/**
 *  SDF Field are infinite, so Areas do not make sens.
 */
SDFPrimitive.prototype.getAreas = function() {
    throw "No Areas for SDFPrimitive.";
};

/**
 *  Since SDF Nodes are distance function, this function will return
 *  an accurate distance to the surface.
 *  @abstract
 */
SDFPrimitive.prototype.distanceTo = (function(){
    var res = {v:0};
    return function(p) {
        this.value(p,res);
        return res.v;
    };
})();

// Abstract
SDFPrimitive.prototype.heuristicStepWithin = function() {
    throw "Not implemented";
};

module.exports = SDFPrimitive;



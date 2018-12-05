'use strict';

const Types = require("../Types.js");
const Primitive = require("../Primitive.js");

/**
 *  Represent an implicit primitive respecting the SCALIS model developped by Cedrric Zanni
 *
 *  @constructor
 *  @extends {Primitive}
 */
var ScalisPrimitive = function() {
    Primitive.call(this);

    // Type of volume (convolution or distance funtion)
    this.volType = ScalisPrimitive.DIST;

    /** @type {!Array.<!ScalisVertex>}
     *  @private
     */
    this.v = []; // vertex array
};

ScalisPrimitive.DIST = "dist";
ScalisPrimitive.CONVOL = "convol";

ScalisPrimitive.prototype = Object.create(Primitive.prototype);
ScalisPrimitive.prototype.constructor = ScalisPrimitive;

ScalisPrimitive.type = "ScalisPrimitive";
Types.register(ScalisPrimitive.type, ScalisPrimitive);

ScalisPrimitive.prototype.getType = function(){
    return ScalisPrimitive.type;
};

ScalisPrimitive.prototype.toJSON= function() {
    var res = Primitive.prototype.toJSON.call(this);
    res.v = [];
    res.volType = this.volType;
    for(var i=0; i<this.v.length; ++i){
        res.v.push(this.v[i].toJSON());
    }
    return res;
};

/**
 *  @abstract Specify if the voltype can be changed
 *  @return {boolean} True if and only if the VolType can be changed.
 */
ScalisPrimitive.prototype.mutableVolType = function() {
    return false;
};

/**
 *  @param {string} vt New VolType to set (Only for SCALIS primitives)
 */
ScalisPrimitive.prototype.setVolType = function(vt) {
    if(vt !== this.volType){
        this.volType = vt;
        this.invalidAABB();
    }
};
/**
 *  @return {string} Current volType
 */
ScalisPrimitive.prototype.getVolType = function() {
    return this.volType;
};

// Abstract : default AABB computation for ScalisPrimitive
ScalisPrimitive.prototype.computeAABB = function() {
    this.aabb.makeEmpty();
    for (var i=0; i<this.v.length; i++) {
        this.aabb.union(this.v[i].getAABB());
    }
};

module.exports = ScalisPrimitive;





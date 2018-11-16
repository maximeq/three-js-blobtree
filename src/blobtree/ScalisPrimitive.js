'use strict';

const Types = require("./Types.js");
const Primitive = require("./Primitive.js");
const EvalTags = require("./EvalTags.js");

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

/**
 *  Set the position of a specific vertex in the primitive.
 *  @param {number} i Index of the vertex concerned
 *  @param {!THREE.Vector3} pos The new position to set
 */
ScalisPrimitive.prototype.setVPos = function(i, pos) {
    if(i>=this.v.length){
        throw "ScalisVertex index invalid";
    }

    this.v[i].setPos(pos);
    this.invalidAABB();
};

/**
 *  Set the thickness of a specific vertex in the primitive.
 *  @param {number} i Index of the vertex concerned
 *  @param {number} thick The thickness to set
 */
ScalisPrimitive.prototype.setVThickness = function(i, thick) {
    if(i>=this.v.length){
        throw "ScalisVertex index invalid";
    }

    this.v[i].setThickness(thick);
    this.invalidAABB();
};

/**
 *  Set both position and thickness for a specific vertex in the primitive.
 *  @param {number} i Index of the vertex concerned
 *  @param {!THREE.Vector3} pos The new position to set
 *  @param {number} thick The thickness to set
 */
ScalisPrimitive.prototype.setVAll = function(i, pos, thick) {
    if(i>=this.v.length){
        throw "ScalisVertex index invalid";
    }

    this.v[i].setAll(pos, thick);
    this.invalidAABB();
};

/**
 *  Get the thickness of a specific vertex in the primitive.
 *  @param {number} i Index of the vertex concerned
 *  @return {THREE.Vector3} The position of the i-th vertex
 */
ScalisPrimitive.prototype.getVPos = function(i, pos) {
    return this.v[i].getPos();
};

/**
 *  Get the thickness of a specific vertex in the primitive.
 *  @param {number} i Index of the vertex concerned
 *  @return {number} The thickness of the i-th vertex
 */
ScalisPrimitive.prototype.getVThickness = function(i) {
    return this.v[i].getThickness();
};

// Abstract : default AABB computation for ScalisPrimitive
ScalisPrimitive.prototype.computeAABB = function() {
    this.aabb.makeEmpty();
    for (var i=0; i<this.v.length; i++) {
        this.aabb.union(this.v[i].getAABB());
    }
};

module.exports = ScalisPrimitive;





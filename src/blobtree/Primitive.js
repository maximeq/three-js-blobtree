'use strict';

const Element = require("./Element.js");
const EvalTags = require("./EvalTags.js");

/** @const {string} */
var primitiveType = "primitive";

/**
 *  Represent a blobtree primitive.
 *
 *  @constructor
 *  @extends {Element}
 */
var Primitive = function() {
    Element.call(this);
    this.type       = primitiveType;

    /** @type {!Array.<!Material>} */
    this.materials = [];
};

Primitive.prototype = Object.create(Element.prototype);
Primitive.prototype.constructor = Primitive;

Primitive.type = primitiveType;

Primitive.prototype.toJSON= function(mats) {
    var res = Element.prototype.toJSON.call(this);
    res.materials = [];
    for(var i=0; i<this.materials.length; ++i){
        res.materials.push(this.materials[i].toJSON());
    }
    return res;
}

/**
*  @param {Array.<!Material>} mats Array of materials to set. they will be copied to the primitive materials
*/
Primitive.prototype.setMaterials = function(mats) {
    if(mats.length !== this.materials.length){
        throw "Error : trying to set " + mats.length + " materials on a primitive with only " + this.materials.length;
    }
    for(var i=0; i<mats.length; ++i) {
        if (!mats[i].equals(this.materials[i])) {
            this.materials[i].copy(mats[i]);
            this.invalidAABB();
        }
    }
};

/**
*  @return {Array.<!Material>} Current primitive materials
*/
Primitive.prototype.getMaterials = function() {
     return this.materials;
};

/**
 *  Note : This function was made for Node to recursively invalidate
 *  children AABB. Here there is only this AABB to invalidate.
 */
Primitive.prototype.invalidAll = function() {
    this.invalidAABB();
};

/**
 *  Invalidate the current AABB, and recursively invalidate parents AABB.
 *  this protected function MUST be called each times the primitive is modified.
 */
Primitive.prototype.invalidAABB = function() {
    this.valid_aabb = false;
    if(this.parentNode !== null){
        this.parentNode.invalidAABB();
    }
};

/**
 *  @return {boolean} True if the current aabb is valid, ie it does
 *  correspond to the internal primitive parameters.
 */
Primitive.prototype.isValidAABB = function() {
    return this.valid_aabb;
};

// Abstract : default AABB computation for primitive
Primitive.prototype.computeAABB = function() {
    throw "Primitive.prototype.computeAABB  Must be reimplemented in all inherited class.";
};

/**
 *  [Abstract]
 *  Destroy the current primitive and remove it from the blobtree (basically
 *  clean up the links between blobtree elements).
 */
Primitive.prototype.destroy = function() {
    if(this.parentNode !== null){
        this.parentNode.removeChild(this);
    }
};

/**
 *  [Abstract]
 *  Compute the value and/or gradient and/or material
 *  of the primitive at position p in space. return computations in res (see below)
 *
 *  @param {!THREE.Vector3} p Point where we want to evaluate the primitive field
 *  @param {EvalTags} req  Mask of required computation, see EvalTags constants
 *                       Note : EvalTags.Grad, EvalTags.GradMat and EvalTags.Mat are not
 *                       implemented here, value must always be computed.
 *  @param {!Object} res  Computed values will be stored here :
 *              res = {v: value, m: material, g: gradient}
 *              res.v/m/g should exist if wanted and be allocated already.
 */
Primitive.prototype.value = function(p,req,res) {
    throw "ERROR : value is a virtual function, should be re-implemented in all primitives(error occured in " + this.type + " primitive)";
    return 0.0;
};

// Abstract
Primitive.prototype.getAreas = function() {
    throw "ERROR : getAreas is a virtual function, should be re-implemented in all primitives(error occured in " + this.type + " primitive)";
    return [];
};

// Abstract
Primitive.prototype.computeHelpVariables = function() {
    throw "ERROR : computeHelpVariables is a virtual function, should be re-implemented in all primitives(error occured in " + this.type + " primitive)";
}; // to override

/**
 *  [Abstract]
 *  Prepare the primitive for a call to value.
 *  Important note: For now, a primitive is considered prepared for eval if and only
 *                  if its bounding box is valid (valid_aabb is true).
 *
 */
Primitive.prototype.prepareForEval = function() {
    var res = {del_obj:[], new_areas:[]};
    throw "ERROR : prepareForEval is a virtual function, should be re-implemented in all primitives(error occured in " + this.type + " primitive)";
    return res;
};

// [Abstract]
Primitive.prototype.count = function(cls){
    return this instanceof cls ? 1 : 0;
};

module.exports = Primitive;



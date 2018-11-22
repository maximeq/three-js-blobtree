'use strict';

const Element = require("./Element.js");
const Types = require("./Types.js");

/**
 *  Represent a blobtree primitive.
 *
 *  @constructor
 *  @extends {Element}
 */
var Primitive = function() {
    Element.call(this);

    /** @type {!Array.<!Material>} */
    this.materials = [];
};

Primitive.prototype = Object.create(Element.prototype);
Primitive.prototype.constructor = Primitive;

Primitive.type = "Primitive";
Types.register(Primitive.type, Primitive);

Primitive.prototype.toJSON= function(mats) {
    var res = Element.prototype.toJSON.call(this);
    res.materials = [];
    for(var i=0; i<this.materials.length; ++i){
        res.materials.push(this.materials[i].toJSON());
    }
    return res;
};

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

// Abstract : default AABB computation for primitive
Primitive.prototype.computeAABB = function() {
    throw "Primitive.prototype.computeAABB  Must be reimplemented in all inherited class.";
};

/**
 *  @abstract
 *  Destroy the current primitive and remove it from the blobtree (basically
 *  clean up the links between blobtree elements).
 */
Primitive.prototype.destroy = function() {
    if(this.parentNode !== null){
        this.parentNode.removeChild(this);
    }
};

// Abstract
Primitive.prototype.getAreas = function() {
    throw "ERROR : getAreas is an abstract function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)";
    return [];
};

// Abstract
Primitive.prototype.computeHelpVariables = function() {
    throw "ERROR : computeHelpVariables is a virtual function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)";
}; // to override

// [Abstract]
Primitive.prototype.count = function(cls){
    return this instanceof cls ? 1 : 0;
};

module.exports = Primitive;



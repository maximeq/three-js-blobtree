'use strict';

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("./Types.js");

var elementIds = 0;

/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @constructor
 */
var Element = function () {

    this.id = elementIds++;

    this.aabb = new THREE.Box3();
    this.valid_aabb = false;

    /** @type {Blobtree.Node} */
    this.parentNode = null;
};

Element.prototype.constructor = Element;

Element.type = "Element";
Types.register(Element.type, Element);

/**
 *  @abstract
 *  Return a Javscript Object respecting JSON convention.
 *  All classes must
 */
Element.prototype.toJSON = function(){
    return {
        type:this.getType()
    };
};
/**
 *  @abstract
 *  Clone the object.
 */
Element.prototype.clone = function(){
    return Types.fromJSON(this.toJSON());
};


/**
 *  @return {Blobtree.Node} The parent node of this primitive.
 */
Element.prototype.getParentNode = function() {
    return this.parentNode;
};
/**
 *  @return {string} Type of the element
 */
Element.prototype.getType = function() {
    return Element.type;
};

/**
 *  Perform precomputation that will help to reduce future processing time,
 *  especially on calls to value.
 *  @protected
 *  @abstract
 */
Element.prototype.computeHelpVariables = function() {
    this.computeAABB();
};

/**
 *  @abstract
 *  Compute the Axis Aligned Bounding Box (AABB) for the current primitive.
 *  By default, the AABB returned is the unionns of all vertices AABB (This is
 *  good for almost all basic primitives).
 */
Element.prototype.computeAABB = function() {
    throw "Error : computeAABB is abstract, should have been overwritten";
};

/**
 *  @return {THREE.Box3} The AABB of this Element (primitive or node). WARNING : call
 *  isValidAABB before to ensure the current AABB does correspond to the primitive
 *  settings.
 */
Element.prototype.getAABB = function() {
    return this.aabb;
};

/**
 *  @return {boolean} True if the current aabb is valid, ie it does
 *  correspond to the internal primitive parameters.
 */
Element.prototype.isValidAABB = function() {
    return this.valid_aabb;
};

/**
 *  Invalid the bounding boxes recursively up to the root
 */
Element.prototype.invalidAABB = function()
{
    this.valid_aabb = false;
    if(this.parentNode !== null && this.parentNode.isValidAABB()){
        this.parentNode.invalidAABB();
    }
};

/**
 *  Note : This function was made for Node to recursively invalidate
 *  children AABB. Default is to invalidate only this AABB.
 */
Element.prototype.invalidAll = function() {
    this.invalidAABB();
};

/**
 *  @abstract
 *  Prepare the element for a call to value.
 *  Important note: For now, a primitive is considered prepared for eval if and only
 *                  if its bounding box is valid (valid_aabb is true).
 *
 */
Element.prototype.prepareForEval = function() {
    var res = {del_obj:[], new_areas:[]};
    throw "ERROR : prepareForEval is a virtual function, should be re-implemented in all element(error occured in Element.js";
    return res;
};

/**
 *  @abstract
 *  Compute the value and/or gradient and/or material
 *  of the element at position p in space. return computations in res (see below)
 *
 *  @param {!THREE.Vector3} p Point where we want to evaluate the primitive field
 *  @param {!Object} res Computed values will be stored here. Each values should exist and
 *                       be allocated already.
 *  @param {number} res.v Value, must be defined
 *  @param {Material} res.m Material, must be allocated and defined if wanted
 *  @param {THREE.Vector3} res.g Gradient, must be allocated and defined if wanted
 */
Element.prototype.value = function(p,res) {
    throw "ERROR : value is an abstract function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)";
    return 0.0;
};

Element.prototype.numericalGradient = (function(){
    var tmp = {v:0};
    var coord = ['x','y','z'];
    return function(p, res, epsilon) {
        var eps = epsilon || 0.00001;

        for(var i=0; i<3; ++i){
            p[coord[i]] = p[coord[i]]+eps;
            this.value(p,tmp);
            res[coord[i]] = tmp.v;
            p[coord[i]] = p[coord[i]]-2*eps;
            this.value(p,tmp);
            res[coord[i]] = (res[coord[i]]-tmp.v)/(2*eps);
            p[coord[i]] = p[coord[i]]+eps; // reset p
        }
    }
})();

/**
 *  @abstract
 *  Get the Area object.
 *  Area objects do provide methods useful when rasterizing, raytracing or polygonizing
 *  the area (intersections with other areas, minimum level of detail needed to
 *  capture the feature nicely, etc etc...).
 *  @return {Array.<Object>} The Areas object corresponding to the node/primitive, in an array
 *
 */
Element.prototype.getAreas = function() {
    return [];
};

/**
 *  @abstract
 *  This function is called when a point is outside of the potential influence of a primitive/node.
 *  @return {number} The next step length to do with respect to this primitive/node
 */
Element.prototype.distanceTo = function(p) {
    throw "ERROR : distanceTo is a virtual function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)";
    return 0.5;
};

/**
 *  @abstract
 *  This function is called when a point is within the potential influence of a primitive/node.
 *  @return {number} The next step length to do with respect to this primitive/node.
 */
Element.prototype.heuristicStepWithin = function() {
    throw "ERROR : heuristicStepWithin is a virtual function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)";
    return 0.1;
};

/**
 *  Trim the tree to keep only nodes influencing a given bounding box.
 *  The tree must be prepared for eval for this process to be working.
 *  Default behaviour is doing nothing, leaves cannot be sub-trimmed, only nodes.
 *  Note : only the root can untrim
 *
 *  @param {THREE.Box3} aabb
 *  @param {Array.<Blobtree.Element>} trimmed Array of trimmed Elements
 *  @param {Array.<Blobtree.Node>} parents Array of fathers from which each trimmed element has been removed.
 */
Element.prototype.trim = function(aabb, trimmed, parents){

};

/**
 *  count the number of elements of class cls in this node and subnodes
 *  @param {Object} cls the class of the elements we want to count
 *  @return {number}
 */
Element.prototype.count = function(cls){
    return 0;
};

module.exports = Element;



'use strict';

const Element = require('./Element.js');
const Types = require("./Types.js");

/**
 *  This class implements an abstract Node class for implicit blobtree.
 *  @constructor
 *  @extends {Element}
 */
var Node = function ()
{
    Element.call(this);

    /** @type {Array.<!Element>} */
    this.children = [];
};

Node.prototype = Object.create(Element.prototype);
Node.prototype.constructor = Node;

Node.type = "Node";
Types.register(Node.type, Node);

Node.prototype.getType = function(){
    return Node.type;
};

Node.prototype.toJSON = function(){
    var res = Element.prototype.toJSON.call(this);
    res.children = [];
    for(var i=0; i<this.children.length; ++i){
        res.children.push(this.children[i].toJSON());
    }
    return res;
};

/**
 *  Clone current node and itss hierarchy
 */
Node.prototype.clone = function(){
    return Types.fromJSON(this.toJSON());
};

/**
 *  @abstract
 *  Prepare the node and all its children for evaluation.
 *  That means setup all necessary elements for an incoming call to eval.
 *  Important note: For now, a node is considered prepared for eval if and only
 *                  if its bounding box is valid (valid_aabb is true).
 *
 */
Node.prototype.prepareForEval = function()
{
    console.error("prepareForEval is a pure virtual function, should be reimplemented in every node class");
};

/**
 *  Invalid the bounding boxes recursively down for all children
 */
Node.prototype.invalidAll = function() {
    this.invalidAABB();
    if( this.children ) {
        for(var i=0; i<this.children.length; i++) {
            this.children[i].invalidAll();
        }
    }
};

/**
 *  Destroy the node and its children. The node is removed from the blobtree
 *  (basically clean up the links between blobtree elements).
 */
Node.prototype.destroy = function() {
    // need to Copy the array since indices will change.
    var arr_c = this.children.slice(0,this.children.length);
    for(var i=0; i<arr_c.length; i++) {
        arr_c[i].destroy();
    }
    if(this.children.length !== 0){
        throw "Error : children length should be 0";
    }
    if(this.parentNode !== null){
        this.parentNode.removeChild(this);
    }
    if(this.parentNode !== null){
        throw "Error : parent node should be null at this point";
    }
    this.children.length = 0;
};

/**
 *  Only works with nary nodes, otherwise a set function would be more appropriate.
 *  -> TODO : check that if we have something else than n-ary nodes one day...
 *  If c already belongs to the tree, it is removed from its current parent
 *  children list before anything (ie it is "moved").
 *
 *  @param {Element} c The child to add.
 */
Node.prototype.addChild = function(c)
{
    if(c.parentNode !== null){
        c.parentNode.removeChild(c);
    }
    // TODO should ckeck that the node does not already belong to the children list
    this.children.push(c);
    c.parentNode = this;

    this.invalidAABB();
};

/**
 *  Only works with n-ary nodes, otherwise order matters and we therefore
 *  have to set "null" and node cannot be evaluated.
 *  -> TODO : check that if we have something else than n-ary nodes one day...
 *  WARNING:
 *      Should only be called when a Primitive is deleted.
 *      Otherwise :
 *          To move a node to another parent : use addChild.
 *  @param {Element} c The child to remove.
 */
Node.prototype.removeChild = function(c)
{
    var i=0;
    var cdn = this.children; // minimize the code

    // Note : if this becomes too long, sort this.children using ids
    while(cdn[i]!==c && i<cdn.length) ++i;

    if(i != cdn.length){
        cdn[i] = cdn[cdn.length-1];
        cdn.pop();
    }else{
        throw "c does not belong to the children of this node";
    }

    this.invalidAABB();

    c.parentNode = null;
};

// Abstract
Node.prototype.computeAABB = function() {
    this.aabb.makeEmpty();
    for (var i=0; i<this.children.length; i++) {
        this.children[i].computeAABB();
        this.aabb.union(this.children[i].getAABB());
    }
};

// Abstract
Node.prototype.getAreas = function() {
    if(!this.valid_aabb){
        throw "Error : cannot call getAreas on a not prepared for eval nod, please call PrepareForEval first. Node concerned is a " + this.getType();
    }
    var res = [];
    for (var i=0; i<this.children.length; i++) {
        res.push.apply(res,this.children[i].getAreas());
    }
    return res;
};

// Abstract
Node.prototype.distanceTo = function(p) {
    var res = 10000000;
    for (var i=0; i<this.children.length; i++) {
        res = Math.min(res,this.children[i].distanceTo(p));
    }
    return res;
};

// Abstract
Node.prototype.heuristicStepWithin = function() {
    var res = 10000000;
    for (var i=0; i<this.children.length; i++) {
        res = Math.min(res,this.children[i].heuristicStepWithin());
    }
    return res;
};

// [Abstract]
Node.prototype.trim = function(aabb, trimmed, parents)
{
    var idx = trimmed.length;
    for (var i=0; i<this.children.length; i++) {
        if(!this.children[i].getAABB().intersectsBox(aabb)){
            // trim the node
            trimmed.push(this.children[i]);
            parents.push(this);
        }
    }
    for(var i=idx; i<trimmed.length; ++i){
        this.removeChild(trimmed[i]);
    }
    // Trim remaining nodes
    for (var i=0; i<this.children.length; i++) {
        this.children[i].trim(aabb,trimmed,parents);
    }
};

// [Abstract]
Node.prototype.count = function(cls){
    var count = 0;

    if( this instanceof cls ) {
        count++;
    }

    for (var i=0; i<this.children.length; i++) {
        count += this.children[i].count(cls);
    }

    return count;
};

module.exports = Node;



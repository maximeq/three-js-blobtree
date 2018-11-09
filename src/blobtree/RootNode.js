"use strict";

const Types = require("./Types.js");
const RicciNode = require("./RicciNode.js");

/**
 *  The root of any implicit blobtree. Does behave computationaly like a RicciNode with n = 64.
 *  The RootNode is the only node to be its own parent.
 *  @constructor
 *  @extends RicciNode
 */
var RootNode = function() {
    // Default RootNode is a riccinode with ricci_n = 64 (almost a max)
    RicciNode.call(this, 64);

    this.type = RootNode.type;

    this.valid_aabb = true;

    // Defauylt iso value, value where the surface is present
    this.iso_value = 1.0;

    // Neutral value is the value of space where no primitive is present.
    this.neutral_value = 0.0;

    // Set some nodes as "trimmed", so they are not evaluated.
    this.trimmed = [];
    this.trim_parents = [];

};

RootNode.prototype = Object.create(RicciNode.prototype);
RootNode.prototype.constructor = RootNode;

RootNode.type = "RootNode";
Types.register(RootNode.type, RootNode);

RootNode.prototype.toJSON = function(){
    var res = RicciNode.prototype.toJSON.call(this);
    res.iso = this.iso_value;
    return res;
};
RootNode.fromJSON = function(json){
    var res = new RootNode(json.ricci);
    for(var i=0; i<json.children.length; ++i){
        res.addChild(Types.fromJSON(json.children[i]));
    }
    return res;
};

RootNode.prototype.getIsoValue = function() {
    return this.iso_value;
};
RootNode.prototype.setIsoValue = function(v) {
    this.iso_value = v;
};
RootNode.prototype.getNeutralValue = function() {
    return this.neutral_value;
};
RootNode.prototype.setNeutralValue = function(v) {
    this.neutral_value = v;
};

// [Abstract] see Node.invalidAABB
RootNode.prototype.invalidAABB = function() {
    this.valid_aabb = false;
};

/**
 *  Basically perform a trim but keep track of trimmed elements.
 *  This is usefull if you want to trim, then untrim, then trim, etc...
 *  For example, this is very useful for evaluation optim
 *  @param {THREE.Box3} aabb
 */
RootNode.prototype.internalTrim = function(aabb)
{
    if( !(this.trimmed.length === 0 && this.trim_parents.length === 0) ){
        throw "Error : you should not call internal trim if you have not untrimmed before. Call untrim or use externalTrim";
    }
    this.trim(aabb, this.trimmed, this.trim_parents);
};

/**
 *  Wrapper for trim, will help programmers to make the difference between
 *  internal and external trim.
 *  @param {THREE.Box3} aabb
 *  @param {Array.<Element>} trimmed Array of trimmed Elements
 *  @param {Array.<Node>} parents Array of fathers from which each trimmed element has been removed.
 */
RootNode.prototype.externalTrim = function(aabb, trimmed, parents){
    this.trim(aabb, trimmed, parents);
};

/**
 *  Reset the full blobtree
 */
RootNode.prototype.internalUntrim = function(){
    this.untrim(this.trimmed, this.trim_parents);
    this.trimmed.length = 0;
    this.trim_parents.length = 0;
};

/**
 *  Reset the full blobtree given previous trimming data.
 *  Note : don't forget to recall prepareForEval if you want to perform evaluation.
 *  @param {Array.<Element>} trimmed Array of trimmed Elements
 *  @param {Array.<Node>} parents Array of fathers from which each trimmed element has been removed.
 */
RootNode.prototype.untrim = function(trimmed, parents){
    if( !(trimmed.length === parents.length) ){
        throw "Error : trimmed and parents arrays should have the same length";
    }
    for(var i=0; i<trimmed.length; ++i){
        parents[i].addChild(trimmed[i]);
    }
};

/**
 *  Tell if the blobtree is empty
 *  @return true if blobtree is empty
 */
RootNode.prototype.isEmpty = function(){
    return this.children.length == 0;
};

module.exports = RootNode;

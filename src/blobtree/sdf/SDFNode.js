'use strict';

const Node = require('../Node.js');
const Types = require("../Types.js");

/**
 *  This class implements an abstract Node class for Signed Distance Field.
 *  The considered primtive is at distance = 0.
 *  Convention is : negative value inside the surface, positive value outside.
 *  @constructor
 *  @extends {Node}
 */
var SDFNode = function ()
{
    Node.call(this);

    // Default bounding box for a SDF is infinite.
    this.aabb.set(
        new THREE.Vector3( - Infinity, - Infinity, - Infinity ),
        new THREE.Vector3( + Infinity, + Infinity, + Infinity )
    );
};

SDFNode.prototype = Object.create(Node.prototype);
SDFNode.prototype.constructor = SDFNode;

SDFNode.type = "SDFNode";
Types.register(SDFNode.type, SDFNode);

SDFNode.prototype.getType = function(){
    return SDFNode.type;
};

// Abstract
SDFNode.prototype.computeAABB = function() {
    // Nothing to do, SDF have infinite bounding box
};

/**
 *  Return the bounding box of the node for a given maximum distance.
 *  Ie, the distance field is greater than d everywhere outside the returned box.
 *  @param {number} d Distance
 *  @abstract
 */
SDFNode.prototype.computeDistanceAABB = function(d) {
    throw "computeDistanceAABB is an abstract function of SDFNode. Please reimplement it in children classes.";
};

/**
 *  SDF Field are infinite, so Areas do not make sens except for the SDFRoot, which will
 *  usually apply a compact kernel to the distance field.
 *  @abstract
 */
SDFNode.prototype.getAreas = function() {
    throw "No Areas for SDFNode, except for the SDFRootNode.";
};

/**
 *  Since SDF Nodes are distance function, this function will return
 *  an accurate distance to the surface.
 *  @abstract
 */
SDFNode.prototype.distanceTo = function(p) {
    throw "distanceTo should be reimplemented in every children classes of SDFNode.";
};

// Abstract
SDFNode.prototype.heuristicStepWithin = function() {
    throw "heuristicStepWithin may not make sens for all SDFNode, except for the SDFRootNode.";
};

module.exports = SDFNode;



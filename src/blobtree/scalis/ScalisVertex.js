"use strict";

const THREE = require("three-full/builds/Three.cjs.js");

const ScalisMath = require("./ScalisMath.js");

var verticesIds = 0;

/**
 *  A scalis ScalisVertex. Basically a point and a wanted thickness.
 *  @constructor
 *  @param {!THREE.Vector3} pos A position in space, as a THREE.Vector3
 *  @param {number} thickness Wanted thickness at this point. Misnamed parameter : this is actually half the thickness.
 */
var ScalisVertex = function(pos, thickness) {
    this.pos       = pos.clone();
    this.thickness = thickness;

    // Only used for quick fix Zanni Correction. Should be removed as soon as it's not useful anymore.
    this.id = verticesIds++;

    // The primitive using this vertex
    this.prim = null;

    this.aabb = new THREE.Box3();
    this.valid_aabb = false;
};

/**
 *  Set an internal pointer to the primitive using this vertex.
 *  Should be called from primitive constructor.
 */
ScalisVertex.prototype.setPrimitive = function(prim){
    if(this.prim === null){
        this.prim = prim;
    }
};

ScalisVertex.prototype.toJSON = function() {
    return {
        position:{
            x:this.pos.x,
            y:this.pos.y,
            z:this.pos.z
        },
        thickness:this.thickness
    };
};
ScalisVertex.fromJSON = function(json) {
    return new ScalisVertex(new THREE.Vector3(json.position.x,json.position.y,json.position.z), json.thickness);
};

/**
 *  Set a new position.
 *  @param {!THREE.Vector3} pos A position in space, as a THREE.Vector3
 */
ScalisVertex.prototype.setPos = function(pos) {
    this.valid_aabb = false;
    this.pos.copy(pos);
    this.prim.invalidAABB();
};

/**
 *  Set a new thickness
 *  @param {number} thickness The new thickness
 */
ScalisVertex.prototype.setThickness = function(thickness) {
    this.valid_aabb = false;
    this.thickness = thickness;
    this.prim.invalidAABB();
};

/**
 *  Set a both position and thickness
 *  @param {number} thickness The new thickness
 *  @param {!THREE.Vector3} pos A position in space, as a THREE.Vector3
 */
ScalisVertex.prototype.setAll = function(pos, thickness)
{
    this.valid_aabb = false;
    this.pos = pos;
    this.thickness = thickness;
    this.prim.invalidAABB();
};

/**
 *  Get the current position
 *  @return {!THREE.Vector3} Current position, as a THREE.Vector3
 */
ScalisVertex.prototype.getPos = function() {
    return this.pos;
};

/**
 *  Get the current Thickness
 *  @return {number} Current Thickness
 */
ScalisVertex.prototype.getThickness = function() {
    return this.thickness;
};

/**
 *  Get the current AxisAlignedBoundingBox
 *  @return {THREE.Box3} The AABB of this vertex.
 */
ScalisVertex.prototype.getAABB = function() {
    if (!this.valid_aabb) {
        this.computeAABB();
        this.valid_aabb = true;
    }
    return this.aabb;
};

/**
 *  Compute the current AABB.
 *  @protected
 */
ScalisVertex.prototype.computeAABB = function() {
    var pos = this.getPos();
    var boundSupport = this.getThickness()*ScalisMath.KS;
    this.aabb.set(new THREE.Vector3(
                    pos.x-boundSupport,
                    pos.y-boundSupport,
                    pos.z-boundSupport
                  ),
                  new THREE.Vector3(
                      pos.x+boundSupport,
                      pos.y+boundSupport,
                      pos.z+boundSupport
                  )
    );
};

/**
 *  Check equality between 2 vertices
 *  @return {boolean}
 */
ScalisVertex.prototype.equals = function(other) {
    return this.pos.equals(other.pos) && this.thickness === other.thickness;
};

module.exports = ScalisVertex;


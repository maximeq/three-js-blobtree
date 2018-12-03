"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("../Types.js");
const SDFPrimitive = require("./SDFPrimitive.js");
const AreaCapsule = require("../areas/AreaCapsule.js");

/**
 *
 *  @constructor
 *  @extends SDFPrimitive
 *
 *  @param {THREE.Vector3} p1 Position of the first segment extremity
 *  @param {THREE.Vector3} p2 Position of the second segment extremity
 *  @param {number} acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
 */
var SDFSegment = function(p1, p2, acc) {
    SDFPrimitive.call(this);

    this.p1 = p1.clone();
    this.p2 = p2.clone();
    this.acc = acc || 1.0;

    // Helper for evaluation
    this.l = new THREE.Line3(this.p1, this.p2);
};

SDFSegment.prototype = Object.create(SDFPrimitive.prototype);
SDFSegment.prototype.constructor = SDFSegment;

SDFSegment.type = "SDFSegment";
Types.register(SDFSegment.type, SDFSegment);

SDFSegment.prototype.getType = function(){
    return SDFSegment.type;
};

SDFSegment.prototype.toJSON = function() {
    var res = SDFPrimitive.prototype.toJSON.call(this);
    res.p1 = {
        x:this.p1.x,
        y:this.p1.y,
        z:this.p1.z
    };
    res.p2 = {
        x:this.p2.x,
        y:this.p2.y,
        z:this.p2.z
    };
    res.acc = this.acc;
    return res;
};
SDFSegment.fromJSON = function(json){
    var v = ScalisVertex.fromJSON(json.v[0]);
    return new SDFSegment(
        new THREE.Vector3(json.p1.x,json.p1.y, json.p1.z),
        new THREE.Vector3(json.p2.x,json.p2.y, json.p2.z),
        json.acc
    );
};

/**
 *  @param {number} acc The new accuracy factor
 */
SDFSegment.prototype.setAccuracy = function(acc) {
    this.acc = acc;
    this.invalidAABB();
};

/**
 *  @return {number} Current accuracy factor
 */
SDFSegment.prototype.getAccuracy = function() {
    return this.acc;
};

/**
 *  @param {THREE.Vector3} p1 The new position of the first segment point.
 */
SDFSegment.prototype.setPosition1 = function(p1) {
    this.p1.copy(p1);
    this.invalidAABB();
};
/**
 *  @param {THREE.Vector3} p2 The new position of the second segment point
 */
SDFSegment.prototype.setPosition2 = function(p2) {
    this.p2.copy(p2);
    this.invalidAABB();
};

/**
 *  @return {THREE.Vector3} Current position of the first segment point
 */
SDFSegment.prototype.getPosition1 = function() {
    return this.p1;
};
/**
 *  @return {THREE.Vector3} Current position of the second segment point
 */
SDFSegment.prototype.getPosition2 = function() {
    return this.p2;
};

// [Abstract]
SDFSegment.prototype.computeDistanceAABB = function(d) {
    var b1 = new THREE.Box3(
        this.p1.clone().add(new THREE.Vector3(-d,-d,-d)),
        this.p1.clone().add(new THREE.Vector3(d,d,d))
    );
    var b2 = new THREE.Box3(
        this.p2.clone().add(new THREE.Vector3(-d,-d,-d)),
        this.p2.clone().add(new THREE.Vector3(d,d,d))
    );
    return b1.union(b2);
};
// [Abstract]
SDFSegment.prototype.prepareForEval = function() {
    if(!this.valid_aabb)
    {
        this.l.set(this.p1,this.p2);
        this.valid_aabb = true;
    }
};

// [Abstract] see ScalisPrimitive.getArea
SDFSegment.prototype.getAreas = function(d) {
    if(!this.valid_aabb) {
        throw "ERROR : Cannot get area of invalid primitive";
        return [];
    }else{
        return [{
            aabb:this.computeDistanceAABB(d),
            bv: new AreaCapsule(
                this.p1,
                this.p2,
                d,
                d,
                this.acc,
                this.acc
            ),
            obj: this
        }];
    }
};

// [Abstract] see SDFPrimitive.value
SDFSegment.prototype.value = (function(){
    var v = new THREE.Vector3();
    var lc = new THREE.Vector3();
    return function(p,res) {
        this.l.closestPointToPoint(p,true,v);
        res.v = lc.subVectors(p,v).length();
        if(res.g){
            res.g.copy(lc).divideScalar(res.v);
        }
    };
})();

module.exports = SDFSegment;

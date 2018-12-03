"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("../Types.js");
const SDFPrimitive = require("./SDFPrimitive.js");
const AreaSphere = require("../areas/AreaSphere.js");

/**
 *  @constructor
 *  @extends SDFPrimitive
 *
 *  @param {THREE.Vector3} p Position (ie center) of the point
 *  @param {number} acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
 */
var SDFPoint = function(p, acc) {
    SDFPrimitive.call(this);

    this.p = p.clone();
    this.acc = acc || 1.0;
};

SDFPoint.prototype = Object.create(SDFPrimitive.prototype);
SDFPoint.prototype.constructor = SDFPoint;

SDFPoint.type = "SDFPoint";
Types.register(SDFPoint.type, SDFPoint);

SDFPoint.prototype.getType = function(){
    return SDFPoint.type;
};

SDFPoint.prototype.toJSON = function() {
    var res = SDFPrimitive.prototype.toJSON.call(this);
    res.p = {
        x:this.p.x,
        y:this.p.y,
        z:this.p.z
    };
    res.acc = this.acc;
    return res;
};
SDFPoint.fromJSON = function(json){
    return new SDFPoint(new THREE.Vector3(json.p.x,json.p.y, json.p.z), json.acc);
};

/**
 *  @param {number} acc The new accuracy factor
 */
SDFPoint.prototype.setAccuracy = function(acc) {
    this.acc = acc;
    this.invalidAABB();
};

/**
 *  @return {number} Current accuracy factor
 */
SDFPoint.prototype.getAccuracy = function() {
    return this.acc;
};

/**
 *  @param {THREE.Vector3} p The new position (ie center)
 */
SDFPoint.prototype.setPosition = function(p) {
    this.p.copy(p);
    this.invalidAABB();
};

/**
 *  @return {THREE.Vector3} Current position (ie center)
 */
SDFPoint.prototype.getPosition = function() {
    return this.p;
};

// [Abstract]
SDFPoint.prototype.computeDistanceAABB = function(d) {
    return new THREE.Box3(
        this.p.clone().add(new THREE.Vector3(-d,-d,-d)),
        this.p.clone().add(new THREE.Vector3(d,d,d))
    );
};
// [Abstract]
SDFPoint.prototype.prepareForEval = function() {
    if(!this.valid_aabb)
    {
        this.valid_aabb = true;
    }
};

// [Abstract] see ScalisPrimitive.getArea
SDFPoint.prototype.getAreas = function(d) {
    if(!this.valid_aabb) {
        throw "ERROR : Cannot get area of invalid primitive";
        return [];
    }else{
        return [{
            aabb:this.computeDistanceAABB(d),
            bv: new AreaSphere(
                this.p,
                d,
                this.acc
            ),
            obj: this
        }];
    }
};

// [Abstract] see SDFPrimitive.value
SDFPoint.prototype.value = (function(){
    var v = new THREE.Vector3();

    return function(p,res) {
        if(!this.valid_aabb){
            throw "Error : PrepareForEval should have been called";
        }

        v.subVectors(p,this.p);
        var l = v.length();
        res.v = l;
        if(res.g)
        {
            res.g.copy(v).multiplyScalar(1/l);
        }
    };
})();

module.exports = SDFPoint;

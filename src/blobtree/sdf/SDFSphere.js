"use strict";

const THREE = require("three");
const Types = require("../Types.js");
const SDFPrimitive = require("./SDFPrimitive.js");
const AreaSphere = require("../areas/AreaSphere.js");

/**
 *  @constructor
 *  @extends SDFPrimitive
 *
 *  @param {THREE.Vector3} p Position (ie center) of the sphere
 *  @param {number} r Radius of the sphere
 */
var SDFSphere = function(p, r) {
    SDFPrimitive.call(this);

    this.p = p.clone();
    this.r = r;
};

SDFSphere.prototype = Object.create(SDFPrimitive.prototype);
SDFSphere.prototype.constructor = SDFSphere;

SDFSphere.type = "SDFSphere";
Types.register(SDFSphere.type, SDFSphere);

SDFSphere.prototype.getType = function(){
    return SDFSphere.type;
};

SDFSphere.prototype.toJSON = function() {
    var res = SDFPrimitive.prototype.toJSON.call(this);
    res.p = {
        x:this.p.x,
        y:this.p.y,
        z:this.p.z
    };
    res.r = this.r;
    return res;
};
SDFSphere.fromJSON = function(json){
    return new SDFSphere(new THREE.Vector3(json.p.x,json.p.y, json.p.z), json.r);
};

/**
 *  @param {number} r The new radius
 */
SDFSphere.prototype.setRadius = function(r) {
    this.r = r;
    this.invalidAABB();
};

/**
 *  @return {number} Current radius
 */
SDFSphere.prototype.getRadius = function() {
    return this.r;
};

/**
 *  @param {THREE.Vector3} p The new position (ie center)
 */
SDFSphere.prototype.setPosition = function(p) {
    this.p.copy(p);
    this.invalidAABB();
};

/**
 *  @return {THREE.Vector3} Current position (ie center)
 */
SDFSphere.prototype.getPosition = function() {
    return this.p;
};

// [Abstract]
SDFSphere.prototype.computeDistanceAABB = function(d) {
    return new THREE.Box3(
        this.p.clone().add(new THREE.Vector3(-this.r-d,-this.r-d,-this.r-d)),
        this.p.clone().add(new THREE.Vector3(this.r+d,this.r+d,this.r+d))
    );
};
// [Abstract]
SDFSphere.prototype.prepareForEval = function() {
    if(!this.valid_aabb)
    {
        this.valid_aabb = true;
    }
};

// [Abstract] see ScalisPrimitive.getArea
SDFSphere.prototype.getAreas = function(d) {
    if(!this.valid_aabb) {
        throw "ERROR : Cannot get area of invalid primitive";
        return [];
    }else{
        return [{
            aabb:this.computeDistanceAABB(d),
            bv: new AreaSphere(
                this.p,
                this.r+d,
                this.r/(this.r+d) // Adjust accuray factor according to the radius and not only to the required d
            ),
            obj: this
        }];
    }
};

// [Abstract] see SDFPrimitive.value
SDFSphere.prototype.value = (function(){
    var v = new THREE.Vector3();

    return function(p,res) {
        if(!this.valid_aabb){
            throw "Error : PrepareForEval should have been called";
        }

        v.subVectors(p,this.p);
        var l = v.length();
        res.v = l - this.r;
        if(res.g)
        {
            res.g.copy(v).multiplyScalar(1/l);
        }
    };
})();

module.exports = SDFSphere;

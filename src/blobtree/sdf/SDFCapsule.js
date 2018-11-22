"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("../Types.js");
const SDFPrimitive = require("./SDFPrimitive.js");
const AreaCapsule = require("../areas/AreaCapsule.js");

/**
 *  This primitive implements a distance field to an extanded "capsule geometry", which is actually a weighted segment.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @constructor
 *  @extends SDFPrimitive
 *
 *  @param {THREE.Vector3} p1 Position of the first segment extremity
 *  @param {THREE.Vector3} p2 Position of the second segment extremity
 *  @param {number} r1 Radius of the sphere centered in p1
 *  @param {number} r2 Radius of the sphere centered in p2
 */
var SDFCapsule = function(p1, p2, r1, r2) {
    SDFPrimitive.call(this);

    this.p1 = p1.clone();
    this.p2 = p2.clone();
    this.r1 = r1;
    this.r2 = r2;

    // Helper for evaluation
    this.r1 = this.r1;
    this.rdiff = this.r2 - this.r1;
    this.unit_dir = new THREE.Vector3().subVectors(this.p2, this.p1);
    this.lengthSq = this.unit_dir.lengthSq();
    this.length = this.unit_dir.length();
    this.unit_dir.normalize();
};

SDFCapsule.prototype = Object.create(SDFPrimitive.prototype);
SDFCapsule.prototype.constructor = SDFCapsule;

SDFCapsule.type = "SDFCapsule";
Types.register(SDFCapsule.type, SDFCapsule);

SDFCapsule.prototype.getType = function(){
    return SDFCapsule.type;
};

SDFCapsule.prototype.toJSON = function() {
    var res = SDFPrimitive.prototype.toJSON.call(this);
    res.p1 = {
        x:this.p1.x,
        y:this.p1.y,
        z:this.p1.z
    };
    res.r1 = this.r1;
    res.p2 = {
        x:this.p2.x,
        y:this.p2.y,
        z:this.p2.z
    };
    res.r2 = this.r2;
    return res;
};
SDFCapsule.fromJSON = function(json){
    var v = ScalisVertex.fromJSON(json.v[0]);
    return new SDFCapsule(
        new THREE.Vector3(json.p1.x,json.p1.y, json.p1.z),
        new THREE.Vector3(json.p2.x,json.p2.y, json.p2.z),
        json.r1,
        json.r2
    );
};

/**
 *  @param {number} r1 The new radius at p1
 */
SDFCapsule.prototype.setRadius1 = function(r1) {
    this.r1 = r1;
    this.invalidAABB();
};
/**
 *  @param {number} r2 The new radius at p2
 */
SDFCapsule.prototype.setRadius2 = function(r1) {
    this.r1 = r1;
    this.invalidAABB();
};

/**
 *  @return {number} Current radius at p1
 */
SDFCapsule.prototype.getRadius1 = function() {
    return this.r1;
};
/**
 *  @return {number} Current radius at p2
 */
SDFCapsule.prototype.getRadius2 = function() {
    return this.r2;
};

/**
 *  @param {THREE.Vector3} p1 The new position of the first segment point.
 */
SDFCapsule.prototype.setPosition1 = function(p1) {
    this.p1.copy(p1);
    this.invalidAABB();
};
/**
 *  @param {THREE.Vector3} p2 The new position of the second segment point
 */
SDFCapsule.prototype.setPosition2 = function(p2) {
    this.p2.copy(p2);
    this.invalidAABB();
};

/**
 *  @return {THREE.Vector3} Current position of the first segment point
 */
SDFCapsule.prototype.getPosition1 = function() {
    return this.p1;
};
/**
 *  @return {THREE.Vector3} Current position of the second segment point
 */
SDFCapsule.prototype.getPosition2 = function() {
    return this.p2;
};

// [Abstract]
SDFCapsule.prototype.computeDistanceAABB = function(d) {
    var b1 = new THREE.Box3(
        this.p1.clone().add(new THREE.Vector3(-this.r1-d,-this.r1-d,-this.r1-d)),
        this.p1.clone().add(new THREE.Vector3(this.r1+d,this.r1+d,this.r1+d))
    );
    var b2 = new THREE.Box3(
        this.p2.clone().add(new THREE.Vector3(-this.r2-d,-this.r2-d,-this.r2-d)),
        this.p2.clone().add(new THREE.Vector3(this.r2+d,this.r2+d,this.r2+d))
    );
    return b1.union(b2);
};
// [Abstract]
SDFCapsule.prototype.prepareForEval = function() {
    if(!this.valid_aabb)
    {
        this.valid_aabb = true;
    }
};

// [Abstract] see ScalisPrimitive.getArea
SDFCapsule.prototype.getAreas = function(d) {
    if(!this.valid_aabb) {
        throw "ERROR : Cannot get area of invalid primitive";
        return [];
    }else{
        return [{
            aabb:this.computeDistanceAABB(d),
            bv: new AreaCapsule(
                this.p1,
                this.p2,
                this.r1+d,
                this.r2+d,
                this.r1/(this.r1+d), // Adjust accuray factor according to the radius and not only to the required d
                this.r2/(this.r2+d)
            ),
            obj: this
        }];
    }
};

// [Abstract] see SDFPrimitive.value
SDFCapsule.prototype.value = (function(){
    var v = new THREE.Vector3();
    var proj = new THREE.Vector3();

    return function(p,res) {
        v.subVectors(p,this.p1);
        var p1p_sqrl = v.lengthSq();
        var p1p_l = Math.sqrt(p1p_sqrl);

        // In unit_dir basis, vector (this.r1-this.r2, this.length) is normal to the "weight line"
        // We need a projection in this direction up to the segment line to know in which case we fall.

        var x_p_2D = v.dot(this.unit_dir);
        // pythagore inc.
        var y_p_2D = Math.sqrt(
            Math.max( // Necessary because of rounded errors, pyth result can be <0 and this causes sqrt to return NaN...
                0.0, p1p_sqrl - x_p_2D*x_p_2D // =  y_p_2D² by pythagore
            )
        );
        var t = -y_p_2D/this.length;

        var proj_x = x_p_2D + t*(this.r1 - this.r2);
        // var proj_y = 0.0; // by construction

        // Easy way to compute the distance now that we ave the projection on the segment
        var a = THREE._Math.clamp(proj_x/this.length,0,1.0);
        proj.copy(this.p1).lerp(this.p2,a); // compute the actual 3D projection
        var l = v.subVectors(p,proj).length();
        res.v = l - (a*this.r2+(1.0-a)*this.r1);
        if(res.g){
            res.g.copy(v).divideScalar(l);
        }
    };
})();

module.exports = SDFCapsule;

"use strict";

const THREE = require("three");
const Types = require("../Types.js");
const SDFPrimitive = require("./SDFPrimitive.js");
const AreaCapsule = require("../areas/AreaCapsule.js");

/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./SDFPrimitive').SDFPrimitiveJSON} SDFPrimitiveJSON */

/**
 * @typedef {{p1:{x:number,y:number,z:number},p2:{x:number,y:number,z:number}, acc:number} & SDFPrimitiveJSON} SDFSegmentJSON
 */

/**
 *
 *  @constructor
 *  @extends SDFPrimitive
 *
 *  @param {THREE.Vector3} p1 Position of the first segment extremity
 *  @param {THREE.Vector3} p2 Position of the second segment extremity
 *  @param {number} acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
 */
class SDFSegment extends SDFPrimitive  {

    static type = "SDFSegment";

    /**
     * @param {SDFSegmentJSON} json
     * @returns SDFSegment
     */
    static fromJSON(json) {
        return new SDFSegment(
            new THREE.Vector3(json.p1.x, json.p1.y, json.p1.z),
            new THREE.Vector3(json.p2.x, json.p2.y, json.p2.z),
            json.acc
        );
    };

    /**
     *
     * @param {THREE.Vector3} p1
     * @param {THREE.Vector3} p2
     * @param {number} acc
     */
    constructor(p1, p2, acc)
    {
        super();

        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.acc = acc || 1.0;

        // Helper for evaluation
        /** @type {THREE.Line3} */
        this.l = new THREE.Line3(this.p1, this.p2);
    }

    getType(){
        return SDFSegment.type;
    };

    /**
     *
     * @returns {SDFSegmentJSON}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            p1: {
                x: this.p1.x,
                y: this.p1.y,
                z: this.p1.z
            },
            p2: {
                x: this.p2.x,
                y: this.p2.y,
                z: this.p2.z
            },
            acc: this.acc
        }
    };

    /**
     *  @param {number} acc The new accuracy factor
     */
    setAccuracy(acc) {
        this.acc = acc;
        this.invalidAABB();
    };

    /**
     *  @return {number} Current accuracy factor
     */
    getAccuracy() {
        return this.acc;
    };

    /**
     *  @param {THREE.Vector3} p1 The new position of the first segment point.
     */
    setPosition1(p1) {
        this.p1.copy(p1);
        this.invalidAABB();
    };
    /**
     *  @param {THREE.Vector3} p2 The new position of the second segment point
     */
    setPosition2(p2) {
        this.p2.copy(p2);
        this.invalidAABB();
    };

    /**
     *  @return {THREE.Vector3} Current position of the first segment point
     */
    getPosition1() {
        return this.p1;
    };
    /**
     *  @return {THREE.Vector3} Current position of the second segment point
     */
    getPosition2() {
        return this.p2;
    };

    // [Abstract]
    computeDistanceAABB(d) {
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
    prepareForEval() {
        if(!this.valid_aabb)
        {
            this.l.set(this.p1,this.p2);
            this.valid_aabb = true;
        }
    };

    /**
     * @param {number} d
     * @return {Object} The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d) {
        if(!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid primitive";
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

    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value = (function(){
        var v = new THREE.Vector3();
        var lc = new THREE.Vector3();
        /**
         *  @param {THREE.Vector3} p
         *  @param {ValueResultType} res
         */
        return function(p,res) {
            this.l.closestPointToPoint(p,true,v);
            res.v = lc.subVectors(p,v).length();
            if(res.g){
                res.g.copy(lc).divideScalar(res.v);
            }
        };
    })();

};


Types.register(SDFSegment.type, SDFSegment);


module.exports = SDFSegment;

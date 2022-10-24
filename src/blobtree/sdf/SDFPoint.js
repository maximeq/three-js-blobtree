"use strict";

const THREE = require("three");
const Types = require("../Types.js");
const SDFPrimitive = require("./SDFPrimitive.js");
const AreaSphere = require("../areas/AreaSphere.js");

/** @typedef {import('../areas/Area')} Area */
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./SDFPrimitive').SDFPrimitiveJSON} SDFPrimitiveJSON */

/**
 * @typedef {{p:{x:number,y:number,z:number},acc:number} & SDFPrimitiveJSON} SDFPointJSON
 */

/**
 *  @constructor
 *  @extends SDFPrimitive
 *s
 */
class SDFPoint extends SDFPrimitive {

    static type = "SDFPoint";

    /**
     * @param {SDFPointJSON} json
     * @returns {SDFPoint}
     */
    static fromJSON(json) {
        return new SDFPoint(new THREE.Vector3(json.p.x, json.p.y, json.p.z), json.acc);
    };

    /**
     *
     *  @param {THREE.Vector3} p Position (ie center) of the point
     *  @param {number} acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
     */
    constructor(p, acc)
    {
        super();

        this.p = p.clone();
        this.acc = acc || 1.0;
    }


    getType(){
        return SDFPoint.type;
    };

    /**
     * @returns {SDFPointJSON}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            p: {
                x: this.p.x,
                y: this.p.y,
                z: this.p.z
            },
            acc: this.acc
        };
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
     *  @param {THREE.Vector3} p The new position (ie center)
     */
    setPosition(p) {
        this.p.copy(p);
        this.invalidAABB();
    };

    /**
     *  @return {THREE.Vector3} Current position (ie center)
     */
    getPosition() {
        return this.p;
    };

    // [Abstract]
    computeDistanceAABB(d) {
        return new THREE.Box3(
            this.p.clone().add(new THREE.Vector3(-d,-d,-d)),
            this.p.clone().add(new THREE.Vector3(d,d,d))
        );
    };
    // [Abstract]
    prepareForEval() {
        if(!this.valid_aabb)
        {
            this.valid_aabb = true;
        }
    };

    /**
     * @link SDFPrimitive.getDistanceAreas
     * @param {number} d Distance to consider for the area computation.
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:SDFPrimitive}>}
     */
    getDistanceAreas(d) {
        if(!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid primitive";
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

    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value = (function(){
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


};


Types.register(SDFPoint.type, SDFPoint);


module.exports = SDFPoint;

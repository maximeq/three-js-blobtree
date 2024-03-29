"use strict";

const THREE = require("three");
const Types = require("../Types.js");
const SDFPrimitive = require("./SDFPrimitive.js");
const AreaSphere = require("../areas/AreaSphere.js");

/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./SDFPrimitive').SDFPrimitiveJSON} SDFPrimitiveJSON */

/**
 * @typedef {{p:{x:number,y:number,z:number}, r:number} & SDFPrimitiveJSON} SDFSphereJSON
 */

/**
 *  @constructor
 *  @extends SDFPrimitive
 *
 *  @param {THREE.Vector3} p Position (ie center) of the sphere
 *  @param {number} r Radius of the sphere
 */
class SDFSphere extends SDFPrimitive {

    static type = "SDFSphere";

    /**
     * @param {SDFSphereJSON} json
     * @returns
     */
    static fromJSON(json) {
        return new SDFSphere(new THREE.Vector3(json.p.x, json.p.y, json.p.z), json.r);
    };

    /**
     *
     * @param {THREE.Vector3} p
     * @param {number} r The radius of the sphere
     */
    constructor(p, r)
    {
        super();

        this.p = p.clone();
        this.r = r;
    }

    getType(){
        return SDFSphere.type;
    };

    /**
     *
     * @returns {SDFSphereJSON}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            p: {
                x: this.p.x,
                y: this.p.y,
                z: this.p.z
            },
            r: this.r
        };
    };

    /**
     *  @param {number} r The new radius
     */
    setRadius(r) {
        this.r = r;
        this.invalidAABB();
    };

    /**
     *  @return {number} Current radius
     */
    getRadius() {
        return this.r;
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
            this.p.clone().add(new THREE.Vector3(-this.r-d,-this.r-d,-this.r-d)),
            this.p.clone().add(new THREE.Vector3(this.r+d,this.r+d,this.r+d))
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
     * @param {number} d
     * @return {Object} The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d) {
        if(!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid primitive";
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

    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value = (function(){
        var v = new THREE.Vector3();
        /**
         *  @param {THREE.Vector3} p
         *  @param {ValueResultType} res
         */
        return function (p, res) {
            /** @type {SDFSphere} */
            let self = this;

            if (!self.valid_aabb){
                throw "Error : PrepareForEval should have been called";
            }

            v.subVectors(p, self.p);
            var l = v.length();
            res.v = l - self.r;
            if(res.g)
            {
                res.g.copy(v).multiplyScalar(1/l);
            }
        };
    })();
};

Types.register(SDFSphere.type, SDFSphere);


module.exports = SDFSphere;

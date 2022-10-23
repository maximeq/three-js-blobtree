"use strict";

const THREE = require("three");
const Types = require("../Types.js");
const SDFPrimitive = require("./SDFPrimitive.js");
const AreaCapsule = require("../areas/AreaCapsule.js");

/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./SDFPrimitive').SDFPrimitiveJSON} SDFPrimitiveJSON */

/**
 * @typedef {{p1:{x:number,y:number,z:number},r1:number,p2:{x:number,y:number,z:number},r2:number} & SDFPrimitiveJSON} SDFCapsuleJSON
 */

/**
 *  This primitive implements a distance field to an extanded "capsule geometry", which is actually a weighted segment.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @constructor
 *  @extends SDFPrimitive
 *
 */
class SDFCapsule extends SDFPrimitive {

    static type = "SDFCapsule";

    /**
     * @param {SDFCapsuleJSON} json
     * @returns {SDFCapsule}
     */
    static fromJSON(json) {
        //var v = ScalisVertex.fromJSON(json.v[0]);
        return new SDFCapsule(
            new THREE.Vector3(json.p1.x, json.p1.y, json.p1.z),
            new THREE.Vector3(json.p2.x, json.p2.y, json.p2.z),
            json.r1,
            json.r2
        );
    };

    /**
     *
     *  @param {THREE.Vector3} p1 Position of the first segment extremity
     *  @param {THREE.Vector3} p2 Position of the second segment extremity
     *  @param {number} r1 Radius of the sphere centered in p1
     *  @param {number} r2 Radius of the sphere centered in p2
     */
    constructor(p1, p2, r1, r2) {
        super();

        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.r1 = r1;
        this.r2 = r2;

        // Helper for evaluation
        this.rdiff = this.r2 - this.r1;
        this.unit_dir = new THREE.Vector3().subVectors(this.p2, this.p1);
        this.lengthSq = this.unit_dir.lengthSq();
        this.length = this.unit_dir.length();
        this.unit_dir.normalize();
    }

    /**
     *  @return {string} Type of the element
     */
    getType() {
        return SDFCapsule.type;
    };

    /**
     * @returns {SDFCapsuleJSON}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            p1: {
                x: this.p1.x,
                y: this.p1.y,
                z: this.p1.z
            },
            r1: this.r1,
            p2: {
                x: this.p2.x,
                y: this.p2.y,
                z: this.p2.z
            },
            r2: this.r2
        };
    }

    /**
     *  @param {number} r1 The new radius at p1
     */
    setRadius1(r1) {
        this.r1 = r1;
        this.invalidAABB();
    };

    /**
     *  @param {number} r2 The new radius at p2
     */
    setRadius2(r2) {
        this.r2 = r2;
        this.invalidAABB();
    };

    /**
     *  @return {number} Current radius at p1
     */
    getRadius1() {
        return this.r1;
    };

    /**
     *  @return {number} Current radius at p2
     */
    getRadius2() {
        return this.r2;
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

    computeDistanceAABB(d) {
        var b1 = new THREE.Box3(
            this.p1.clone().add(new THREE.Vector3(-this.r1 - d, -this.r1 - d, -this.r1 - d)),
            this.p1.clone().add(new THREE.Vector3(this.r1 + d, this.r1 + d, this.r1 + d))
        );
        var b2 = new THREE.Box3(
            this.p2.clone().add(new THREE.Vector3(-this.r2 - d, -this.r2 - d, -this.r2 - d)),
            this.p2.clone().add(new THREE.Vector3(this.r2 + d, this.r2 + d, this.r2 + d))
        );
        return b1.union(b2);
    };

    /**
     * @link Element.prepareForEval for a complete description
     */
    prepareForEval() {
        if (!this.valid_aabb) {
            this.valid_aabb = true;
        }
    };

    /**
     * @param {number} d
     * @return {Object} The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d) {
        if (!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid primitive";
        } else {
            return [{
                aabb: this.computeDistanceAABB(d),
                bv: new AreaCapsule(
                    this.p1,
                    this.p2,
                    this.r1 + d,
                    this.r2 + d,
                    this.r1 / (this.r1 + d), // Adjust accuray factor according to the radius and not only to the required d
                    this.r2 / (this.r2 + d)
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
    value = (function () {
        var v = new THREE.Vector3();
        var proj = new THREE.Vector3();
        /**
         *  @param {THREE.Vector3} p
         *  @param {ValueResultType} res
         */
        return function (p, res) {
            /** @type {SDFCapsule} */
            let self = this;
            v.subVectors(p, self.p1);
            var p1p_sqrl = v.lengthSq();

            // In unit_dir basis, vector (this.r1-this.r2, this.length) is normal to the "weight line"
            // We need a projection in this direction up to the segment line to know in which case we fall.

            var x_p_2D = v.dot(self.unit_dir);
            // pythagore inc.
            var y_p_2D = Math.sqrt(
                Math.max( // Necessary because of rounded errors, pyth result can be <0 and this causes sqrt to return NaN...
                    0.0, p1p_sqrl - x_p_2D * x_p_2D // =  y_p_2D² by pythagore
                )
            );
            var t = -y_p_2D / self.length;

            var proj_x = x_p_2D + t * (self.r1 - self.r2);
            // var proj_y = 0.0; // by construction

            // Easy way to compute the distance now that we ave the projection on the segment
            var a = THREE.MathUtils.clamp(proj_x / self.length, 0, 1.0);
            proj.copy(self.p1).lerp(self.p2, a); // compute the actual 3D projection
            var l = v.subVectors(p, proj).length();
            res.v = l - (a * self.r2 + (1.0 - a) * self.r1);
            if (res.g) {
                res.g.copy(v).divideScalar(l);
            }
        };
    })();
};

Types.register(SDFCapsule.type, SDFCapsule);



module.exports = SDFCapsule;

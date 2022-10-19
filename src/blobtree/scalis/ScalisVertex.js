"use strict";

const THREE = require("three");

const ScalisMath = require("./ScalisMath.js");

/** @typedef {import('./ScalisPrimitive')} ScalisPrimitive */
/** @typedef {import('../Element.js').Json} Json */

/**
 * @typedef {Object} ScalisVertexJSON
 * @property {Object} position
 * @property {number} position.x
 * @property {number} position.y
 * @property {number} position.z
 * @property {number} thickness
 */

var verticesIds = 0;

/**
 *  A scalis ScalisVertex. Basically a point and a wanted thickness.
 */
class ScalisVertex {

    static fromJSON(json) {
        return new ScalisVertex(new THREE.Vector3(json.position.x, json.position.y, json.position.z), json.thickness);
    }

    /**
     *  @param {!THREE.Vector3} pos A position in space, as a THREE.Vector3
     *  @param {number} thickness Wanted thickness at this point. Misnamed parameter : this is actually half the thickness.
     */
    constructor(pos, thickness) {
        this.pos = pos.clone();
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
     * @param {ScalisPrimitive} prim
     */
    setPrimitive(prim) {
        if (this.prim === null) {
            this.prim = prim;
        }
    }

    /**
     * @returns {ScalisVertexJSON}
     */
    toJSON() {
        return {
            position: {
                x: this.pos.x,
                y: this.pos.y,
                z: this.pos.z
            },
            thickness: this.thickness
        };
    }

    /**
     *  Set a new position.
     *  @param {!THREE.Vector3} pos A position in space, as a THREE.Vector3
     */
    setPos(pos) {
        this.valid_aabb = false;
        this.pos.copy(pos);
        this.prim.invalidAABB();
    }

    /**
     *  Set a new thickness
     *  @param {number} thickness The new thickness
     */
    setThickness(thickness) {
        this.valid_aabb = false;
        this.thickness = thickness;
        this.prim.invalidAABB();
    }

    /**
     *  Set a both position and thickness
     *  @param {number} thickness The new thickness
     *  @param {!THREE.Vector3} pos A position in space, as a THREE.Vector3
     */
    setAll(pos, thickness) {
        this.valid_aabb = false;
        this.pos = pos;
        this.thickness = thickness;
        this.prim.invalidAABB();
    }

    /**
     *  Get the current position
     *  @return {!THREE.Vector3} Current position, as a THREE.Vector3
     */
    getPos() {
        return this.pos;
    }

    /**
     *  Get the current Thickness
     *  @return {number} Current Thickness
     */
    getThickness() {
        return this.thickness;
    };

    /**
     *  Get the current AxisAlignedBoundingBox
     *  @return {THREE.Box3} The AABB of this vertex.
     */
    getAABB() {
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
    computeAABB() {
        var pos = this.getPos();
        var boundSupport = this.getThickness() * ScalisMath.KS;
        this.aabb.set(new THREE.Vector3(
            pos.x - boundSupport,
            pos.y - boundSupport,
            pos.z - boundSupport
        ),
            new THREE.Vector3(
                pos.x + boundSupport,
                pos.y + boundSupport,
                pos.z + boundSupport
            )
        );
    }

    /**
     *  Check equality between 2 vertices
     *  @param {ScalisVertex} other
     *  @return {boolean}
     */
    equals(other) {
        return this.pos.equals(other.pos) && this.thickness === other.thickness;
    }
}



module.exports = ScalisVertex;


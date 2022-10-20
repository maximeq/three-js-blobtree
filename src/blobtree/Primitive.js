'use strict';

const Element = require("./Element.js");
const Types = require("./Types.js");

/**
 * @typedef {import('./Material.js')} Material
 * @typedef {import('./Material.js').MaterialJSON} MaterialJSON
 * @typedef {import('./Element.js').ElementJSON} ElementJSON
 * @typedef {import('./Element.js').Json} Json
 *
 * @typedef {import('./areas/Area.js')} Area
 */

/**
 * @typedef {{materials:Array<MaterialJSON>} & ElementJSON} PrimitiveJSON
 */

/**
 *  Represent a blobtree primitive.
 *
 *  @constructor
 *  @extends {Element}
 */
class Primitive extends Element {

    static type = "Primitive";

    constructor() {
        super();
        /** @type {!Array.<!Material>} */
        this.materials = [];
    }

    /**
     * @returns {PrimitiveJSON}
     */
    toJSON() {
        var res = { ...super.toJSON(), materials: [] };
        res.materials = [];
        for (var i = 0; i < this.materials.length; ++i) {
            res.materials.push(this.materials[i].toJSON());
        }
        return res;
    };

    /**
     *  @param {Array.<!Material>} mats Array of materials to set. they will be copied to the primitive materials
     */
    setMaterials(mats) {
        if (mats.length !== this.materials.length) {
            throw "Error : trying to set " + mats.length + " materials on a primitive with only " + this.materials.length;
        }
        for (var i = 0; i < mats.length; ++i) {
            if (!mats[i].equals(this.materials[i])) {
                this.materials[i].copy(mats[i]);
                this.invalidAABB();
            }
        }
    };

    /**
     *  @return {Array.<!Material>} Current primitive materials
     */
    getMaterials = function () {
        return this.materials;
    };

    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB() {
        throw "Primitive.prototype.computeAABB  Must be reimplemented in all inherited class.";
    };

    /**
     *  @abstract
     *  Destroy the current primitive and remove it from the blobtree (basically
     *  clean up the links between blobtree elements).
     */
    destroy() {
        if (this.parentNode !== null) {
            this.parentNode.removeChild(this);
        }
    };

    /**
     * @abstract
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas () {
        console.error("ERROR : getAreas is an abstract function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)");
        return [];
    };

    /**
     * @abstract
     * Compute variables to help with value computation.
     */
    computeHelpVariables() {
        throw "ERROR : computeHelpVariables is a virtual function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)";
    };

    /**
     * @abstract
     * Compute variables to help with value computation.
     * @param {*} cls The class to count. Primitives have no children so no complexty here.
     */
    count(cls) {
        return this instanceof cls ? 1 : 0;
    };

};

Types.register(Primitive.type, Primitive);

module.exports = Primitive;



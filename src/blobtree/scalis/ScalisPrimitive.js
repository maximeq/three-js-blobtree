'use strict';

const Types = require("../Types.js");
const Primitive = require("../Primitive.js");

/** @typedef {import('../Element.js')} Element */
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('./ScalisVertex')} ScalisVertex */
/** @typedef {import('./ScalisVertex').ScalisVertexJSON} ScalisVertexJSON */

/**
 *  Represent an implicit primitive respecting the SCALIS model developped by Cedrric Zanni
 *
 *  @constructor
 *  @extends {Primitive}
 */
class ScalisPrimitive extends Primitive {

    static type = "ScalisPrimitive"

    static DIST = "dist";
    static CONVOL = "convol";

    constructor() {
        super();

        // Type of volume (convolution or distance funtion)
        this.volType = ScalisPrimitive.DIST;

        /**
         * @type {!Array.<!ScalisVertex>}
         * @protected
         */
        this.v = []; // vertex array
    }

    /**
     *  @return {string} Type of the element
     */
    getType() {
        return ScalisPrimitive.type;
    }

    /**
     *  @return {{v:Array<ScalisVertexJSON>, volType: string} & Json}
     */
    toJSON() {
        var res = Primitive.prototype.toJSON.call(this);
        res.v = [];
        res.volType = this.volType;
        for (var i = 0; i < this.v.length; ++i) {
            res.v.push(this.v[i].toJSON());
        }
        return res;
    }

    /**
     *  @abstract Specify if the voltype can be changed
     *  @return {boolean} True if and only if the VolType can be changed.
     */
    mutableVolType() {
        return false;
    }

    /**
     *  @param {string} vt New VolType to set (Only for SCALIS primitives)
     */
    setVolType(vt) {
        if (vt !== this.volType) {
            this.volType = vt;
            this.invalidAABB();
        }
    }

    /**
     *  @return {string} Current volType
     */
    getVolType() {
        return this.volType;
    }

    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB() {
        this.aabb.makeEmpty();
        for (var i = 0; i < this.v.length; i++) {
            this.aabb.union(this.v[i].getAABB());
        }
    }
};

Types.register(ScalisPrimitive.type, ScalisPrimitive);

module.exports = ScalisPrimitive;





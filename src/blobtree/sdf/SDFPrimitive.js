'use strict';

const THREE = require("three");

const Element = require('../Element.js');
const Types = require("../Types.js");

/** @typedef {import('../areas/Area')} Area */
/** @typedef {import('../Element').ElementJSON} ElementJSON */
/** @typedef {import('../Primitive')} Primitive */

/**
 * @typedef {ElementJSON} SDFPrimitiveJSON
 */

/**
 *  This class implements an abstract primitve class for signed distance field.
 *  SDFPrimitive subclasses must define a scalar field being the distance to a geometry.
 *  @constructor
 *  @extends {Element}
 */
class SDFPrimitive extends Element {

    static type = "SDFPrimitive";

    constructor() {
        super();
        // Default bounding box for a SDF is infinite.
        this.aabb.set(
            new THREE.Vector3(- Infinity, - Infinity, - Infinity),
            new THREE.Vector3(+ Infinity, + Infinity, + Infinity)
        );
    }

    /**
     * @return {string} Type of the element
     */
    getType() {
        return SDFPrimitive.type;
    }

    /**
     * @link Element.computeAABB for a completve description.
     */
    computeAABB() {
        // Nothing to do, SDF have infinite bounding box
    }

    /**
     * Return the bounding box of the node for a given maximum distance.
     * Ie, the distance field is greater than d everywhere outside the returned box.
     * @param {number} _d Distance
     * @abstract
     * @return {THREE.Box3}
     */
    computeDistanceAABB(_d) {
        console.error("computeDistanceAABB is an abstract function of SDFPrimitive. Please reimplement it in children classes.");
        return (new THREE.Box3()).makeEmpty()
    }

    /**
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas() {
        throw "No Areas for SDFPrimitive.";
    }

    /**
     * @param {number} _d Distance to consider for the area computation.
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:SDFPrimitive}>}
     */
    getDistanceAreas(_d) {
        console.error("getDistanceAreas is an abstract function of SDFPrimitive. Please reimplement in children classes");
        return [];
    }

    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     *
     * @param {THREE.Vector3} p
     */
    distanceTo = (function () {
        var res = { v: 0 };
        /**
         * @param {THREE.Vector3} p
         */
        return (p) => {
            /** @type {SDFPrimitive} */
            let self = this;

            self.value(p, res);
            return res.v;
        };
    })();

    /**
     * @link see Element.heuristicStepWithin for a det
     */
    heuristicStepWithin() {
        console.error("SDFPrimitive.heuristicStepWithin is Not implemented");
        return 1;
    };
}

Types.register(SDFPrimitive.type, SDFPrimitive);



module.exports = SDFPrimitive;



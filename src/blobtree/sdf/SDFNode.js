'use strict';

const THREE = require("three");
const Node = require('../Node.js');
const Types = require("../Types.js");

/** @typedef {import('../areas/Area')} Area */
/** @typedef {import('./SDFPrimitive')} SDFPrimitive */

/** @typedef {import('../Node').NodeJSON} NodeJSON */

/** @typedef {NodeJSON} SDFNodeJSON */


/**
 *  This class implements an abstract Node class for Signed Distance Field.
 *  The considered primtive is at distance = 0.
 *  Convention is : negative value inside the surface, positive value outside.
 *  @constructor
 *  @extends {Node}
 */
class SDFNode extends Node
{

    static type = "SDFNode";

    constructor(){
        super();

        // Default bounding box for a SDF is infinite.
        this.aabb.set(
            new THREE.Vector3( - Infinity, - Infinity, - Infinity ),
            new THREE.Vector3( + Infinity, + Infinity, + Infinity )
        );

        /** @type {Array<SDFNode|SDFPrimitive>} */
        this.children;
    }

    getType(){
        return SDFNode.type;
    };

    // Abstract
    computeAABB() {
        // Nothing to do, SDF have infinite bounding box
    };

    /**
     *  Return the bounding box of the node for a given maximum distance.
     *  Ie, the distance field is greater than d everywhere outside the returned box.
     *  @abstract
     *  @param {number} d Distance
     *  @return {THREE.Box3}
     *
     */
    computeDistanceAABB(d) {
        let res = new THREE.Box3();
        for (let i = 0; i < this.children.length; ++i){
            res.union(this.children[i].computeDistanceAABB(d));
        }
        return res;
    };

    /**
     *
     * @param {SDFNode | SDFPrimitive} c
     */
    addChild(c) {
        return super.addChild(c);
    }

    /**
     *  SDF Field are infinite, so Areas do not make sens except for the SDFRoot, which will
     *  usually apply a compact kernel to the distance field.
     *  @abstract
     *  @return {Object}
     */
    getAreas() {
        throw "No Areas for SDFNode, except for the SDFRootNode.";
    };

    /**
     * @param {number} d Distance to consider for the area computation.
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:SDFPrimitive}>}
     */
    getDistanceAreas(d) {
        // By default return areas of all children
        let res = [];
        for (let i = 0; i < this.children.length; ++i){
            let c = this.children[i];
            res.push(...c.getDistanceAreas(d));
        }
        return res;
    }

    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     * @param {THREE.Vector3} _p Point
     * @return {number}
     */
    distanceTo(_p) {
        throw "distanceTo should be reimplemented in every children classes of SDFNode.";
    };

    // Abstract
    /**
     * @abstract
     * @return {number}
     */
    heuristicStepWithin() {
        throw "heuristicStepWithin may not make sens for all SDFNode, except for the SDFRootNode.";
    };
};

Types.register(SDFNode.type, SDFNode);


module.exports = SDFNode;



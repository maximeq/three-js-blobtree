'use strict';

const THREE = require("three");
const Node = require('../Node.js');
const Types = require("../Types.js");

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
     *  @param {number} _d Distance
     *  
     */
    computeDistanceAABB(_d) {
        throw "computeDistanceAABB is an abstract function of SDFNode. Please reimplement it in children classes.";
    };

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
     *  Since SDF Nodes are distance function, this function will return
     *  an accurate distance to the surface.
    *  @abstract
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



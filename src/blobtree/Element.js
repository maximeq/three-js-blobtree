'use strict';

const THREE = require("three");
const Types = require("./Types.js");

// Types
/** @typedef {import('./Material.js')} Material */
/** @typedef {import('./Node.js')} Node */
/** @typedef {*} Json */

let elementIds = 0;

/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @class
 *  @constructor
 */
class Element {

    static type = "Element";

    constructor() {
        this.id = elementIds++;

        this.aabb = new THREE.Box3();
        this.valid_aabb = false;

        /** @type {Node} */
        this.parentNode = null;
    }

    /**
     *  Return a Javscript Object respecting JSON convention.
     *  All classes must defined it.
     *  @return {{type:string} & Json}
     */
    toJSON () {
        return {
            type: this.getType()
        };
    }

    /**
     *  Clone the object.
     * @return {Element}
     */
    clone () {
        return Types.fromJSON(this.toJSON());
    }

    /**
     *  @return {Node} The parent node of this primitive.
     */
    getParentNode () {
        return this.parentNode;
    }

    /**
     *  @return {string} Type of the element
     */
    getType () {
        return Element.type;
    }

    /**
     *  Perform precomputation that will help to reduce future processing time,
     *  especially on calls to value.
     *  @protected
     */
    computeHelpVariables () {
        this.computeAABB();
    }

    /**
     *  @abstract
     *  Compute the Axis Aligned Bounding Box (AABB) for the current primitive.
     *  By default, the AABB returned is the unionns of all vertices AABB (This is
     *  good for almost all basic primitives).
     */
    computeAABB () {
        throw "Error : computeAABB is abstract, should have been overwritten";
    }

    /**
     *  @return {THREE.Box3} The AABB of this Element (primitive or node). WARNING : call
     *  isValidAABB before to ensure the current AABB does correspond to the primitive
     *  settings.
     */
    getAABB () {
        return this.aabb;
    }

    /**
     *  @return {boolean} True if the current aabb is valid, ie it does
     *  correspond to the internal primitive parameters.
     */
    isValidAABB () {
        return this.valid_aabb;
    }

    /**
     *  Invalid the bounding boxes recursively up to the root
     */
    invalidAABB () {
        this.valid_aabb = false;
        if (this.parentNode !== null && this.parentNode.isValidAABB()) {
            this.parentNode.invalidAABB();
        }
    }

    /**
     *  Note : This function was made for Node to recursively invalidate
     *  children AABB. Default is to invalidate only this AABB.
     */
    invalidAll () {
        this.invalidAABB();
    }

    /**
     *  @abstract
     *  Prepare the element for a call to value.
     *  Important note: For now, a primitive is considered prepared for eval if and only
     *                  if its bounding box is valid (valid_aabb is true).
     */
    prepareForEval() {
        console.error("Blobtree.Element: prepareForEval is a virtual function, should be re-implemented in all element(error occured in Element.js");
        // Possible improvement: return the list of deleted objects and new ares,
        // for example to launch a Marching Cube in the changed area only
        // @return {{del_obj:Array<Object>, new_areas:Array<Object>}}
        // return {del_obj:[], new_areas:[]};
    }

    /**
     *  @abstract
     *  Compute the value and/or gradient and/or material
     *  of the element at position p in space. return computations in res (see below)
     *
     *  @param {THREE.Vector3} _p Point where we want to evaluate the primitive field
     *  @param {Object} _res Computed values will be stored here. Each values should exist and
     *                       be allocated already.
     *  @param {number} _res.v Value, must be defined
     *  @param {Material} _res.m Material, must be allocated and defined if wanted
     *  @param {THREE.Vector3} _res.g Gradient, must be allocated and defined if wanted
     */
    value (_p, _res) {
        throw new Error("ERROR : value is an abstract function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)");
    };

    /**
     * @param {THREE.Vector3} p The point where we want the numerical gradient
     * @param {THREE.Vector3} res The resulting gradient
     * @param {number} epsilon The step value for the numerical evaluation
     */
    numericalGradient = (function () {
        let tmp = { v: 0 };
        let coord = ['x', 'y', 'z'];
        /**
         * @param {THREE.Vector3} p
         * @param {THREE.Vector3} res
         * @param {number} epsilon
         */
        return function (p, res, epsilon) {
            let eps = epsilon || 0.00001;

            for (let i = 0; i < 3; ++i) {
                p[coord[i]] = p[coord[i]] + eps;
                this.value(p, tmp);
                res[coord[i]] = tmp.v;
                p[coord[i]] = p[coord[i]] - 2 * eps;
                this.value(p, tmp);
                res[coord[i]] = (res[coord[i]] - tmp.v) / (2 * eps);
                p[coord[i]] = p[coord[i]] + eps; // reset p
            }
        }
    })()

    /**
     *  @abstract
     *  Get the Area object.
     *  Area objects do provide methods useful when rasterizing, raytracing or polygonizing
     *  the area (intersections with other areas, minimum level of detail needed to
     *  capture the feature nicely, etc etc...).
     *  @return {Array.<Object>} The Areas object corresponding to the node/primitive, in an array
     *
     */
    getAreas () {
        return [];
    }

    /**
     *  @abstract
     *  This function is called when a point is outside of the potential influence of a primitive/node.
     *  @param {THREE.Vector3} _p
     *  @return {number} The next step length to do with respect to this primitive/node
     */
    distanceTo (_p) {
        throw new Error("ERROR : distanceTo is a virtual function, should be reimplemented in all classes extending Element. Concerned type: " + this.getType() + ".");
    }

    /**
     *  @abstract
     *  This function is called when a point is within the potential influence of a primitive/node.
     *  @return {number} The next step length to do with respect to this primitive/node.
     */
    heuristicStepWithin () {
        throw new Error("ERROR : heuristicStepWithin is a virtual function, should be reimplemented in all classes extending Element. Concerned type: " + this.getType() + ".");
    };

    /**
     *  Trim the tree to keep only nodes influencing a given bounding box.
     *  The tree must be prepared for eval for this process to be working.
     *  Default behaviour is doing nothing, leaves cannot be sub-trimmed, only nodes.
     *  Note : only the root can untrim
     *
     *  @param {THREE.Box3} _aabb
     *  @param {Array.<Element>} _trimmed Array of trimmed Elements
     *  @param {Array.<Node>} _parents Array of fathers from which each trimmed element has been removed.
     */
    trim (_aabb, _trimmed, _parents) {
        // Do nothing by default
    };

    /**
     *  count the number of elements of class cls in this node and subnodes
     *  @param {Function} _cls the class of the elements we want to count
     *  @return {number} The number of element of class cls
     */
    count (_cls) {
        return 0;
    }

    destroy() {
        console.error("Blobtree.Element: destroy is a virtual function, should be reimplemented in all classes extending Element.");
    }

};

Types.register(Element.type, Element);

module.exports = Element;



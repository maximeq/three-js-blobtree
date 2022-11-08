'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var require$$0 = require('three');
var require$$0$1 = require('three/examples/jsm/utils/BufferGeometryUtils');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
var require$$0__default$1 = /*#__PURE__*/_interopDefaultLegacy(require$$0$1);

function checkDependancy(packageName, dependancyName, dependancy) {
    try {
        if (THREE[dependancyName] === undefined) {
            THREE[dependancyName] = dependancy;
            return;
        }

        if (THREE[dependancyName] !== dependancy) {
            throw new Error(`${packageName}: ${dependancyName} is duplicated. Your bundle includes ${dependancyName} twice. Please repair your bundle.`);
        }
    } catch (error) {
        if (!error.message.match(/is duplicated/)) {
            console.warn(
                `${packageName}: Duplication check unavailable. ${error}`
            );
        } else {
            throw error;
        }
    }
}

function checkThreeRevision(packageName, revision) {
    try {
        if (THREE.REVISION != revision) {
            throw new Error(`${packageName} depends on THREE revision ${revision}, but current revision is ${THREE.REVISION}.`)
        }
    } catch (error) {
        if (!error.message.match(/depends on THREE revision/)) {
            console.warn(
                `${packageName}: Revision check unavailable. ${error}`
            );
        } else {
            throw error;
        }
    }
}

/**
 *  Keep track of all Types added to the Blobtree library.
 *  For now just a list of strings registered by the classes.
 */
var Types$n = {
    /**
     * @type {Object<string,{fromJSON:Function}>}
     */
    types: {},
    /**
     *  Register a type in the list.
     *  @param {string} name The name of the type.
     *  @param {{fromJSON:Function}} cls The class of the registered type.
     */
    register(name, cls) {
        if (this.types[name]) {
            throw "Error : cannot register type " + name + ", this name is already registered.";
        }
        this.types[name] = cls;
    },
    /**
     *  Parse a JSON recursively to return a Blobtree or a blobtree element.
     *  @param {Object} json A javascript Object resulting from a JSON interpretation.
     *  @return {any}
     */
    fromJSON(json) {
        var cls = this.types[json.type];
        if (!cls) {
            throw "Error : type found in JSON (" + json.type + " is not registered in the Blobtree library.";
        }
        return cls.fromJSON(json);
    }
};

var Types_1 = Types$n;

const THREE$s = require$$0__default["default"];
const Types$m = Types_1;

// Types
/** @typedef {import('./Material.js')} Material */
/** @typedef {import('./Node.js')} Node */
/** @typedef {import('./Primitive')} Primitive */
/** @typedef {*} Json */
/** @typedef {import('./areas/Area')} Area */

/**
 * @typedef {{type:string}} ElementJSON
 */

/**
 * @typedef {Object} ValueResultType Computed values will be stored here. Each values should exist and
 *                    be allocated already.
 * @property {number} v Value, must be defined
 * @property {Material=} m Material, must be allocated and defined if wanted
 * @property {THREE.Vector3=} g Gradient, must be allocated and defined if wanted
 * @property {number=} step ??? Not sure, probably a "safe" step for raymarching
 * @property {number=} stepOrtho ??? Same as step but in orthogonal direction ?
 */

let elementIds = 0;

/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @class
 *  @constructor
 */
class Element$3 {

    static type = "Element";

    /**
     * @param {ElementJSON} _json
     */
    static fromJSON(_json) {
        throw new Error("Element.fromJSON should never be called as Element is abstract.");
    }

    constructor() {
        this.id = elementIds++;

        this.aabb = new THREE$s.Box3();
        this.valid_aabb = false;

        /** @type {Node} */
        this.parentNode = null;
    }

    /**
     *  Return a Javscript Object respecting JSON convention.
     *  All classes must defined it.
     *  @return {ElementJSON}
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
    clone() {
        return Types$m.fromJSON(this.toJSON());
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
        return Element$3.type;
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
    invalidAll() {
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
     *  @param {ValueResultType} _res
     */
    value(_p, _res) {
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

                /** @type Element */
                let self = this;

                let eps = epsilon || 0.00001;

                for (let i = 0; i < 3; ++i) {
                    p[coord[i]] = p[coord[i]] + eps;
                    self.value(p, tmp);
                    res[coord[i]] = tmp.v;
                    p[coord[i]] = p[coord[i]] - 2 * eps;
                    self.value(p, tmp);
                    res[coord[i]] = (res[coord[i]] - tmp.v) / (2 * eps);
                    p[coord[i]] = p[coord[i]] + eps; // reset p
                }
            }
        }
    )()

    /**
     *  @abstract
     *  Get the Area object.
     *  Area objects do provide methods useful when rasterizing, raytracing or polygonizing
     *  the area (intersections with other areas, minimum level of detail needed to
     *  capture the feature nicely, etc etc...).
     *  @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>} The Areas object corresponding to the node/primitive, in an array
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

}
Types$m.register(Element$3.type, Element$3);

var Element_1 = Element$3;

const Element$2 = Element_1;
const Types$l = Types_1;

// Types
/**
 * @typedef {import('./Element.js').Json} Json
 * @typedef {import('./Element.js').ElementJSON} ElementJSON
 * @typedef {import('./Primitive.js')} Primitive
 * @typedef {import('./areas/Area')} Area
 */

/** @typedef {{children:Array<{ElementJSON}>} & ElementJSON} NodeJSON*/

/**
 *  This class implements an abstract Node class for implicit blobtree.
 *  @constructor
 *  @extends {Element}
 */
class Node$7 extends Element$2 {

    static type = "Node";

    /**
     * @param {NodeJSON} _json
     */
    static fromJSON(_json) {
        throw new Error("Node.fromJSON should never be called as Node is abstract.");
    }

    constructor() {
        super();

        /** @type {Array.<!Element>} */
        this.children = [];
    }

    getType () {
        return Node$7.type;
    }

    /**
     * @return {NodeJSON}
     */
    toJSON () {
        var res = {
            ...super.toJSON(),
            children: []
        };
        for (var i = 0; i < this.children.length; ++i) {
            res.children.push(this.children[i].toJSON());
        }
        return res;
    }

    /**
     *  Clone current node and itss hierarchy
     */
    clone () {
        return Types$l.fromJSON(this.toJSON());
    }

    /**
     *  @link Element.prepareForEval
     */
    prepareForEval () {
        console.error("Blobtree.Node: prepareForEval is a pure abstract function, should be reimplemented in every node class.");
        return super.prepareForEval();
    }

    /**
     *  Invalid the bounding boxes recursively down for all children
     */
    invalidAll () {
        this.invalidAABB();
        if (this.children) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].invalidAll();
            }
        }
    };

    /**
     *  Destroy the node and its children. The node is removed from the blobtree
     *  (basically clean up the links between blobtree elements).
     */
    destroy () {
        // need to Copy the array since indices will change.
        var arr_c = this.children.slice(0, this.children.length);
        for (var i = 0; i < arr_c.length; i++) {
            arr_c[i].destroy();
        }
        if (this.children.length !== 0) {
            throw "Error : children length should be 0";
        }
        if (this.parentNode !== null) {
            this.parentNode.removeChild(this);
        }
        if (this.parentNode !== null) {
            throw "Error : parent node should be null at this point";
        }
        this.children.length = 0;
    };

    /**
     *  Only works with nary nodes, otherwise a set function would be more appropriate.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  If c already belongs to the tree, it is removed from its current parent
     *  children list before anything (ie it is "moved").
     *
     *  @param {Element} c The child to add.
     */
    addChild (c) {
        if (c.parentNode !== null) {
            c.parentNode.removeChild(c);
        }
        // TODO should ckeck that the node does not already belong to the children list
        this.children.push(c);
        c.parentNode = this;

        this.invalidAABB();

        return this;
    };

    /**
     *  Only works with n-ary nodes, otherwise order matters and we therefore
     *  have to set "null" and node cannot be evaluated.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  WARNING:
     *      Should only be called when a Primitive is deleted.
     *      Otherwise :
     *          To move a node to another parent : use addChild.
     *  @param {Element} c The child to remove.
     */
    removeChild (c) {
        var i = 0;
        var cdn = this.children; // minimize the code

        // Note : if this becomes too long, sort this.children using ids
        while (cdn[i] !== c && i < cdn.length) ++i;

        if (i != cdn.length) {
            cdn[i] = cdn[cdn.length - 1];
            cdn.pop();
        } else {
            throw "c does not belong to the children of this node";
        }

        this.invalidAABB();

        c.parentNode = null;
    }

    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB () {
        this.aabb.makeEmpty();
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].computeAABB();
            this.aabb.union(this.children[i].getAABB());
        }
    }

    /**
     *  @link Element.getAreas for a complete description
     *  @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas () {
        if (!this.valid_aabb) {
            throw "Error : cannot call getAreas on a not prepared for eval nod, please call PrepareForEval first. Node concerned is a " + this.getType();
        }
        var res = [];
        for (var i = 0; i < this.children.length; i++) {
            res.push.apply(res, this.children[i].getAreas());
        }
        return res;
    };

    /**
     * @link Element.distanceTo for a complete description
     * @param {THREE.Vector3} p
     * @returns {number}
     */
    distanceTo(p) {
        var res = 10000000;
        for (var i = 0; i < this.children.length; i++) {
            res = Math.min(res, this.children[i].distanceTo(p));
        }
        return res;
    };

    /**
     * @returns
     */
    heuristicStepWithin() {
        var res = 10000000;
        for (var i = 0; i < this.children.length; i++) {
            res = Math.min(res, this.children[i].heuristicStepWithin());
        }
        return res;
    };

    /**
     *  @link Element.trim for a complete description.
     *
     *  @param {THREE.Box3} aabb
     *  @param {Array.<Element>} trimmed
     *  @param {Array.<Node>} parents
     */
    trim(aabb, trimmed, parents) {
        let idx = trimmed.length;
        for (let i = 0; i < this.children.length; i++) {
            if (!this.children[i].getAABB().intersectsBox(aabb)) {
                // trim the node
                trimmed.push(this.children[i]);
                parents.push(this);
            }
        }
        for (let i = idx; i < trimmed.length; ++i) {
            this.removeChild(trimmed[i]);
        }
        // Trim remaining nodes
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    };

    /**
     *  @link Element.count for a complete description.
     *
     *  @param {Function} cls
     *  @return {number}
     */
    count(cls) {
        var count = 0;

        if (this instanceof cls) {
            count++;
        }

        for (var i = 0; i < this.children.length; i++) {
            count += this.children[i].count(cls);
        }

        return count;
    };

}
Types$l.register(Node$7.type, Node$7);

var Node_1 = Node$7;

const THREE$r = require$$0__default["default"];

/**
 * @typedef {Object} MaterialJSON
 * @property {string} color
 * @property {number} roughness
 * @property {number} metalness
 * @property {string} emissive
 */

/**
 *  Material object for blobtree. It is an internal material, that should especially
 *  be used in implicit elements. It is the internal representation of the material,
 *  not the openGL material that will be used for display.
 *  @constructor
 *
 *  @param {!Object} params Parameters for the material. As a dictionary to be easily extended later.
 *
 *  @param {THREE.Color?}   params.color        Base diffuse color for the material.
 *                                              Defaults to #aaaaaa
 *
 *  @param {number?}        params.roughness    Roughness for the material.
 *                                              Defaults to 0.
 *
 *  @param {number?}        params.metalness    Metalness aspect of the material, 1 for metalness, 0 for dielectric.
 *                                              Defaults to 0.
 *
 *  @param {THREE.Color?} params.emissive       Emissive color for the material.
 *                                              Defaults to pitch black. (no light emission)
 */
class Material$d {

    static defaultMaterial = new Material$d();

    // Other static functions
    /**
     *  Compare arrays of materials.
     *
     *  @deprecated
     *
     *  @param {Array.<Material>} arr1
     *  @param {Array.<Material>} arr2
     *  @param {Array.<Material>=} arr3
     *  @param {Array.<Material>=} arr4
     *  @param {Array.<Material>=} arr5
     *
     *  @return {boolean} true if and only if all arguments are arrays of the same length and containing the same material values.
     */
    static areEqualsArrays (arr1) {

        console.warn("Material.areEqualsArrays is deprecated, please use your own comparison function using Material.equals.");

        let  res = true;
        // check for nullity
        for (let i = 1; i < arguments.length; i++) {
            res = res && ((arr1 === null && arguments[i] === null) || (arr1 !== null && arguments[i] !== null));
        }
        if (!res) { return res; } // Case : at least one arr is null but not all

        if (arr1 === null) { return true; } // case all null

        for (let i = 1; i < arguments.length; i++) {
            let  equals = true;
            if (arguments[i].length !== arr1.length) {
                return false;
            }
            for (let k = 0; k < arr1.length; ++k) {
                equals = equals && arr1[k].equals(arguments[i][k]);
            }
            res = res && equals;
        }
        return res;
    };

    static fromJSON(json) {
        return new Material$d({
            color: new THREE$r.Color(json.color),
            roughness: json.roughness,
            metalness: json.metalness,
            emissive: json.emissive, // If undefined, will default to pitch black. If not, will load the hex string.
        });
    }

    /**
    *  @constructor
    *
    *  @param { !Object } params Parameters for the material.As a dictionary to be easily extended later.
    *
    *  @param { THREE.Color ?} params.color Base diffuse color for the material. Defaults to #aaaaaa
    *
    *  @param { number ?} params.roughness Roughness for the material. Defaults to 0.
    *
    *  @param { number ?} params.metalness Metalness aspect of the material, 1 for metalness, 0 for dielectric. Defaults to 0.
    *
    *  @param { THREE.Color ?} params.emissive Emissive color for the material. Defaults to pitch black. (no light emission)
    */
    constructor(params) {
        params = params || {};

        if (arguments[1] !== undefined) {
            throw "Error : Blobtree Material now takes only 1 argument.";
        }

        this.color = new THREE$r.Color(params.color !== undefined ? params.color : 0xaaaaaa);
        this.roughness = params.roughness !== undefined ? params.roughness : 0;
        this.metalness = params.metalness !== undefined ? params.metalness : 0;
        this.emissive = new THREE$r.Color(params.emissive !== undefined ? params.emissive : 0x000000);
    }

    toJSON () {
        return {
            color: "#" + this.color.getHexString(),
            roughness: this.roughness,
            metalness: this.metalness,
            emissive: `#${this.emissive.getHexString()}`
        };
    }

    /**
     *  Return a clone of the material
     *  @return {!Material} The new material
     */
    clone () {
        return new Material$d({
            color: this.color,
            roughness: this.roughness,
            metalness: this.metalness,
            emissive: this.emissive,
        });
    }

    /**
     *  Copy the given material parameters
     *  @param {!Material} mat Material to be copied
     */
    copy (mat) {
        this.color.copy(mat.color);
        this.roughness = mat.roughness;
        this.metalness = mat.metalness;
        this.emissive.copy(mat.emissive);
    }

    /**
     *  @deprecated Use setParams instead
     *  Set Material parameters at once. DEPRECATED. Use setParams
     *  @param {THREE.Color!} c Color
     *  @param {number!} r roughness
     *  @param {number!} m Metalness
     */
    set (c, r, m) {
        this.color.copy(c);
        this.roughness = r;
        this.metalness = m;
    }

    /**
     *  Set Material parameters (all or just some)
     *
     *  @param {Object} params Parameters for the material. As a dictionary to be easily extended later.
     *  @param {THREE.Color?}   params.color        Base diffuse color for the material.
     *  @param {number?}        params.roughness    Roughness for the material.
     *  @param {number?}        params.metalness    Metalness aspect of the material, 1 for metalness, 0 for dielectric.
     *  @param {THREE.Color?} params.emissive       Emissive color for the material.
     */
    setParams (params) {
        this.color.copy(params.color ? params.color : this.color);
        this.roughness = params.roughness !== undefined ? params.roughness : this.roughness;
        this.metalness = params.metalness !== undefined ? params.metalness : this.metalness;
        this.emissive.copy(params.emissive !== undefined ? params.emissive : this.emissive);
    }

    /** @return {THREE.Color} */
    getColor () { return this.color; };

    /** @return {number} */
    getRoughness () { return this.roughness; };

    /** @return {number} */
    getMetalness = function () { return this.metalness; };

    /** @return {THREE.Color} */
    getEmissive () { return this.emissive; }


    equals (m) {
        return this.color.equals(m.color) &&
            this.metalness === m.metalness &&
            this.roughness === m.roughness &&
            this.emissive.equals(m.emissive);
    }

    /**
     *  Perform a linear interpolation between this material and a given other.
     * (1-s)*this + s*m = this +(m1-this)*s
     *  @param {!Material} m The material to interpolate with this
     *  @param {number} s the interpolation coefficient
     */
    lerp (m, s) {
        this.color.lerp(m.color, s);
        this.roughness = (1 - s) * this.roughness + s * m.roughness;
        this.metalness = (1 - s) * this.metalness + s * m.metalness;
        this.emissive.lerp(m.emissive, s);
    };
    /**
     *  Used in triangles (ok it's specific, still we need it :)
     *  Linear interpolation over a triangle? Store the result in this
     *  @param {!Material} m1 The material of first corner
     *  @param {!Material} m2 The material of second corner
     *  @param {!Material} m3 The material of third corner
     *  @param {number} a1 the interpolation coefficient 1
     *  @param {number} a2 the interpolation coefficient 2
     *  @param {number} a3 the interpolation coefficient 3
     *  @param {number} denum Normalizing the result (division)
     *  @return {Material} this
     */
    triMean (m1, m2, m3, a1, a2, a3, denum) {
        this.color.r = (a1 * m1.color.r + a2 * m2.color.r + a3 * m3.color.r) / denum;
        this.color.g = (a1 * m1.color.g + a2 * m2.color.g + a3 * m3.color.g) / denum;
        this.color.b = (a1 * m1.color.b + a2 * m2.color.b + a3 * m3.color.b) / denum;

        this.roughness = (a1 * m1.roughness + a2 * m2.roughness + a3 * m3.roughness) / denum;

        this.metalness = (a1 * m1.metalness + a2 * m2.metalness + a3 * m3.metalness) / denum;

        this.emissive.r = (a1 * m1.emissive.r + a2 * m2.emissive.r + a3 * m3.emissive.r) / denum;
        this.emissive.g = (a1 * m1.emissive.g + a2 * m2.emissive.g + a3 * m3.emissive.g) / denum;
        this.emissive.b = (a1 * m1.emissive.b + a2 * m2.emissive.b + a3 * m3.emissive.b) / denum;

        return this;
    }

    /**
     *  Perform a weighted mean over several materials and set to this.
     *  Note that m_arr.length must equals v_arr.length
     *  @param {Array.<!Material>} m_arr Array of materials
     *  @param {Array.<number>|Float32Array} v_arr Array of values being the corresponding weights
     *  @param {number=} n Can be set if you want to mean only the n first element of the arrays
     */
    weightedMean (m_arr, v_arr, n) {
        this.color.setRGB(0, 0, 0);
        this.roughness = 0;
        this.metalness = 0;
        this.emissive.setScalar(0);
        const l = (n === undefined) ? m_arr.length : n;
        let sum_v = 0.0;

        for (let i = 0; i < l; ++i) {

            this.color.r += v_arr[i] * m_arr[i].color.r;
            this.color.g += v_arr[i] * m_arr[i].color.g;
            this.color.b += v_arr[i] * m_arr[i].color.b;
            this.roughness += v_arr[i] * m_arr[i].roughness;
            this.metalness += v_arr[i] * m_arr[i].metalness;
            this.emissive.r += v_arr[i] * m_arr[i].emissive.r;
            this.emissive.g += v_arr[i] * m_arr[i].emissive.g;
            this.emissive.b += v_arr[i] * m_arr[i].emissive.b;
            sum_v += v_arr[i];

        }

        if (sum_v !== 0) {
            this.color.r /= sum_v;
            this.color.g /= sum_v;
            this.color.b /= sum_v;
            this.roughness /= sum_v;
            this.metalness /= sum_v;
            this.emissive.r /= sum_v;
            this.emissive.g /= sum_v;
            this.emissive.b /= sum_v;
        } else {
            this.color.setScalar(0);
            this.roughness = 0;
            this.metalness = 0;
            this.emissive.setScalar(0);
        }

        return this;
    }

}
var Material_1 = Material$d;

const THREE$q = require$$0__default["default"];
const Types$k = Types_1;
const Node$6 = Node_1;
const Material$c = Material_1;

/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */

/**
 * @typedef {{ricci_n:number} & NodeJSON} RicciNodeJSON
 */

/**
 *  This class implement a n-ary blend node which use a Ricci Blend.
 *  Ricci blend is : v = k-root( Sum(c.value^k) ) for all c in node children.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
class RicciNode$2 extends Node$6 {

    static type = "RicciNode";

    /**
     *  @param {number} ricci_n The value for ricci
     *  @param {Array<Node>=} children The children to add to this node. Just a convenient parameter, you can do it manually using addChild
     */
    constructor(ricci_n, children) {
        super();

        /** @type {number} */
        this.ricci_n = ricci_n;

        if (children) {
            let self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }

        // Tmp vars to speed up computation (no reallocations)
        /** @type {Float32Array} */
        this.tmp_v_arr = new Float32Array(0);
        /** @type {Array<Material>} */
        this.tmp_m_arr = [];

        // temp vars to speed up evaluation by avoiding allocations
        /** @type {{v:number, g: THREE.Vector3, m:Material}} */
        this.tmp_res = { v: 0, g: null, m: null };
        /** @type {THREE.Vector3} */
        this.tmp_g = new THREE$q.Vector3();
        /** @type {Material} */
        this.tmp_m = new Material$c();
    }

    /**
     * @link Node.getType
     * @returns {string}
     */
    getType() {
        return RicciNode$2.type;
    };

    /**
     * @link Node.toJSON
     * @returns {RicciNodeJSON}
     */
    toJSON() {
        let res = {
            ...super.toJSON(),
            ricci_n: this.ricci_n
        };

        return res;
    };

    /**
     * @link Node.fromJSON
     * @param {Json} json
     * @returns
     */
    static fromJSON(json) {
        let res = new RicciNode$2(json.ricci_n);
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types$k.fromJSON(json.children[i]));
        }
        return res;
    };

    /**
     * @link Node.prepareForEval
     */
    prepareForEval() {
        if (!this.valid_aabb) {
            this.aabb = new THREE$q.Box3();  // Create empty BBox
            for (let i = 0; i < this.children.length; ++i) {
                let c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB());     // new aabb is computed according to remaining children aabb
            }

            this.valid_aabb = true;

            // Prepare tmp arrays
            if (this.tmp_v_arr.length < this.children.length) {
                this.tmp_v_arr = new Float32Array(this.children.length * 2);
                this.tmp_m_arr.length = this.children.length * 2;
                for (let i = 0; i < this.tmp_m_arr.length; ++i) {
                    this.tmp_m_arr[i] = new Material$c({ roughness: 0, metalness: 0 });
                }
            }
        }
    };

    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value(p, res) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)
        let l = this.children.length;
        let tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;

        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material$c.defaultMaterial);
        } if (res.g) {
            res.g.set(0, 0, 0);
        } else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }

        if (this.aabb.containsPoint(p) && l !== 0) {
            // arrays used for material mean
            let v_arr = this.tmp_v_arr;
            let m_arr = this.tmp_m_arr;
            let mv_arr_n = 0;

            // tmp let to compute the powered sum before the n-root
            // Kept for gradient computation
            let res_vv = 0;
            for (let i = 0; i < l; ++i) {
                if (this.children[i].aabb.containsPoint(p)) {

                    this.children[i].value(p, tmp);
                    if (tmp.v > 0) // actually just !=0 should be enough but for stability reason...
                    {
                        let v_pow = Math.pow(tmp.v, this.ricci_n - 1.0);
                        res_vv += tmp.v * v_pow;

                        // gradient if needed
                        if (res.g) {
                            tmp.g.multiplyScalar(v_pow);
                            res.g.add(tmp.g);
                        }
                        // material if needed
                        if (res.m) {
                            v_arr[mv_arr_n] = tmp.v * v_pow;
                            m_arr[mv_arr_n].copy(tmp.m);
                            mv_arr_n++;
                        }
                        // within primitive potential
                        if (res.step || res.stepOrtho) {
                            // we have to compute next step or nextStep z
                            res.step = Math.min(res.step, this.children[i].heuristicStepWithin());
                        }

                    }
                    // outside of the potential for this box, but within the box
                    else {
                        if (res.step !== undefined) {
                            res.step = Math.min(res.step,
                                this.children[i].distanceTo(p));
                        }

                    }
                }
                else if (res.step || res.stepOrtho) {
                    res.step = Math.min(res.step,
                        this.children[i].distanceTo(p));
                }
            }

            // compute final result using ricci power function
            res.v = Math.pow(res_vv, 1 / this.ricci_n);

            if (res.v !== 0) {
                if (res.g) {
                    res.g.multiplyScalar(res.v / res_vv);
                }
                if (res.m) {
                    res.m.weightedMean(m_arr, v_arr, mv_arr_n);
                }
            }
            // else the default values should be OK.
        } else if (res.step !== undefined) {
            if (this.children.length !== 0) {
                let add = this.children[0].heuristicStepWithin();
                for (let i = 1; i < this.children.length; ++i) {
                    add = Math.min(add, this.children[i].heuristicStepWithin());
                }
                // return distance to aabb such that next time we'll hit from within the aabbb
                res.step = this.aabb.distanceToPoint(p) + add;
            }
        }

        if (res.stepOrtho !== undefined) {
            res.stepOrtho = res.step;
        }
    };

    /**
     * @param {number} n
     */
    setRicciN (n) {
        if (this.ricci_n != n) {
            this.ricci_n = n;
            this.invalidAABB();
        }
    };

    /**
     * @returns {number}
     */
    getRicciN = function () {
        return this.ricci_n;
    };

}
Types$k.register(RicciNode$2.type, RicciNode$2);

var RicciNode_1 = RicciNode$2;

/**
 * @author Maxime Quiblier
 *
 */

const THREE$p = require$$0__default["default"];

const Convergence$3 = {};

// Limitations: 3D only, but can easily be rewritten for nD
// The algorithm stops when :
// - 2 consecutive steps are smaller than epsilon
// - OR n_max_step is reached
// Optimization roads :
//      - 2 small steps may be too much, only 1 could be enough in most cases isn't it?
// @todo write documentation to talk about failure cases.
//
// Variable used in function. This avoid reallocation.
    Convergence$3.last_mov_pt = new THREE$p.Vector3();
    Convergence$3.grad = new THREE$p.Vector3();
    Convergence$3.eval_res_g = new THREE$p.Vector3(0, 0, 0);
    /** @type {{v:number, m:Material, g:THREE.Vector3}} */
    Convergence$3.eval_res = {v:0, m:null, g:null};
    Convergence$3.vec = new THREE$p.Vector3();

/**
 * @param {BlobtreeElement} pot
 * @param {THREE.Vector3} starting_point
 * @param {number} value
 * @param {number} epsilon
 * @param {number} n_max_step
 * @param {number} r_max
 * @param {THREE.Vector3} res
 * @returns
 */
Convergence$3.safeNewton3D = function(    pot,              // Scalar Field to eval
                                        starting_point,   // 3D point where we start, must comply to THREE.Vector3 API
                                        value,            // iso value we are looking for
                                        epsilon,          // Geometrical limit to stop
                                        n_max_step,       // limit of number of step
                                        r_max,            // max distance where we look for the iso
                                        //bounding_v,       // Bounding volume inside which we look for the iso, getting out will make the process stop.
                                        res               // the resulting point
                                        )
{
        res.copy(starting_point);

        var i = 1;
        var consecutive_small_steps = 0;
        var broken = false;
        while( consecutive_small_steps != 2 && i<=n_max_step && !broken)
        {
            this.last_mov_pt.copy(res);

            this.eval_res.g = this.eval_res_g; // active gradient computation
            pot.value(res,this.eval_res) ;

            this.grad.copy(this.eval_res.g);
            if(this.grad.x !== 0.0 || this.grad.y !== 0.0 || this.grad.z !== 0.0 )
            {
                var g_l = this.grad.length();
                var step = (value-this.eval_res.v)/g_l;
                if(step < epsilon && step > -epsilon)
                {
                    if(step>0.0)
                    {
                        step = epsilon/g_l;
                    }
                    else
                    {
                        step = -epsilon/g_l;
                    }
                    consecutive_small_steps++;
                }
                else
                {
                    consecutive_small_steps = 0;
                }
                this.grad.normalize().multiplyScalar(step);
                res.add(this.grad);

                // If the newton step took us out of the bounding volume, we have to stop
                //if(!bounding_v.containsPoint(res))
                if( this.vec.subVectors(res,starting_point).lengthSq() > r_max*r_max)
                {
                    res.copy(starting_point);
                    return;
                }

                /*
                if( this.vec.subVectors(res,starting_point).lengthSq() > r_max*r_max)
                {
                    this.eval_res.g = null; // deactive gradient computation
                    var current_val = this.eval_res.v;
                    pot.value(res,this.eval_res);
                    if( (this.eval_res.v-value)*(current_val-value) < 0.0)   // can only use dichotomy if one point is inside and one outside among (res and last_mov_pt)
                    {
                        res.add(this.last_mov_pt);
                        res.multiplyScalar(0.5);
                    }
                    else
                    {
                        // In this case we have no clue what to do, so just break...
                        broken = true;
                    }
                }
                */
            }
            else
            {
                broken = true;
            }

            ++i;
        }

        if(broken){
            // return strating_point
            res.copy(starting_point);
            return;
        }

        /*
        if(broken){

            this.eval_res.g = null; // deactive gradient computation

            // Check the point between last_moving_point and starting_point which is closest to the surface and return it.
            pot.value(this.last_mov_pt,this.eval_res);
            var ev_last_mov_pt = this.eval_res.v;
            pot.value(starting_point,this.eval_res);
            var ev_st_pt = this.eval_res.v;
            if( Math.abs(ev_last_mov_pt-value) > Math.abs(starting_point-value) )
            {
                res.copy(starting_point);
                return;
            }
            else
            {
                res.copy(this.last_mov_pt);
                return;
            }
        }
        */
};

/**
 *
 * @typedef {Object} safeNewton1DResult
 * @property {THREE.Vector3} p
 * @property {THREE.Vector3} g
 * @property {number} p_absc
 *
 */

/** This algorithm uses Newton convergence to find a point epsilon close to
*        a point "p" such that the given potential "pot" evaluated at "p" is "value".
*        The search is constrained on line defined by (origin, search_dir), and between bounds
*        defined by min_absc and max_absc which are the abscissae on the line with respect
*        to origin and search_dir. search_dir should be normalized.
*        The starting point is given with an abscissa : origin + starting_point_absc*search_dir
*
*   @param {BlobtreeElement} pot
*   @param {THREE.Vector3} origin Point choosen as origin in the search line frame.
*   @param {THREE.Vector3} search_dir_unit unit vector that, together with origin, defines the searching line. Should be normalized
*   @param {number} min_absc_inside Minimum abscissa on the line : the algorithm will not search for a point below this abscissa.
*   @param {number} max_absc_outside Maximum abscissa on the line : the algorithm will not search for a point above this abscissa.
*   @param {number} starting_point_absc Abscissa of the starting point, with respect to the search dir.
*   @param {number} value The potential value we are looking for on the line with respect to pot.Eval(..)
*   @param {number} epsilon We want the result to be at least epsilon close to the surface with respect to the
*                   distance Vector.norm(), we suppose this norm to be the one associated with the dot product Vector.operator |
*   @param {number} n_max_step Maximum of newton step before giving up.
*
*   @param {safeNewton1DResult} res
*
*
*   @todo write documentation to talk about failure cases.
*   @todo Should not normalise search_dir. Change that here and in all part of code where this is used.
*/
Convergence$3.safeNewton1D = function(
                                        pot,
                                        origin,
                                        search_dir_unit,
                                        min_absc_inside,
                                        max_absc_outside,
                                        starting_point_absc,
                                        value,
                                        epsilon,
                                        n_max_step,
                                        res // resulting point res.p and gradient res.g (if res.g defined) resulting absc in res.p_absc
                                        )
{
    this.eval_res.g = this.eval_res_g; // active gradient computation

    if( !(search_dir_unit.x !== 0.0 || search_dir_unit.y !== 0.0 || search_dir_unit.z !== 0.0) ){
        throw "Error : search direction is null";
    }
    if(epsilon<=0){
        throw "Error: epsilon <= 0, convergence will nuke your face or loop";
    }
    if(starting_point_absc<min_absc_inside || starting_point_absc>max_absc_outside){
        throw "Error : starting absc is not in boundaries";
    }

    var curr_point_absc = starting_point_absc;
    var eval_pt = new THREE$p.Vector3();

    // Newton step until we overpass the surface
    // the minimum step is set to epsilon, that ensure we will cross the surface.
    var grad = 0;
    var step = 0;
    var i = 0;
    while( max_absc_outside - min_absc_inside > epsilon && i < n_max_step)
    {
        // curr_point_absc is guaranteed inside [min_absc_inside,max_absc_outside]
        pot.value(  eval_pt.copy(search_dir_unit).multiplyScalar(curr_point_absc).add(origin),
                    this.eval_res) ;
        // update bounding absc
        if(this.eval_res.v > value)
        {
            min_absc_inside = curr_point_absc;
        }
        else
        {
            max_absc_outside = curr_point_absc;
        }

        // Analytical gradient evaluation + dot product should be less than 2 evaluations in cost.
        grad = this.eval_res.g.dot(search_dir_unit);
        if(grad !== 0.0)
        {
            step = (value-this.eval_res.v)/grad;
            curr_point_absc += step;

            // Dichotomy step
            if(curr_point_absc >= max_absc_outside || curr_point_absc <= min_absc_inside)
            {
                curr_point_absc = (max_absc_outside+min_absc_inside)*0.5;
            }

        }
        else
        {
            // Dichotomy step
            curr_point_absc = (max_absc_outside+min_absc_inside)*0.5;
        }

        ++i;
    }

    res.p_absc = (max_absc_outside+min_absc_inside)*0.5; // approximate
    res.p.copy(search_dir_unit).multiplyScalar(curr_point_absc).add(origin);
    if(res.g !== undefined){
        if(i===0){
            pot.value(  res.p,
                        this.eval_res) ;
        }
        res.g.copy(this.eval_res.g);
    }
};

Convergence$3.dichotomy1D = function(
                                        pot,
                                        origin,
                                        search_dir_unit,
                                        startStepLength,
                                        value,
                                        epsilon,
                                        n_max_step, // TODO : Useless, since dichotomia is absolutely determinist, n step is startStepLength/(2^n) accuracy...
                                                    //        OR epsilon is the one useless...
                                        res // resulting point res.p and gradient res.g (if res.g defined) resulting absc in res.p_absc
                                        )
{

    this.eval_res.g = null; // deactive gradient computation

    var previousPos = new THREE$p.Vector3().copy(origin);
    var currentStep = new THREE$p.Vector3();
    // intersection
    // dichotomia: first step is going back half of the previous distance
    startStepLength /= 2;
    var dist = -startStepLength;
    var previousDist = dist;
    origin.sub(
        currentStep.copy(search_dir_unit)
            .multiplyScalar(startStepLength));
    var nstep = 0;
    while((startStepLength > epsilon) && (nstep < n_max_step))
    {
        nstep++;
        previousPos.copy(origin);
        previousDist=dist;

        startStepLength/=2;
        // not asking for the next step, which is always half of previous
        pot.value(
            origin,
            this.eval_res);

        if (this.eval_res.v < value)
        {
            // before the surface: go forward
            origin.add(
                currentStep.copy(search_dir_unit)
                    .multiplyScalar(startStepLength));
            dist+=startStepLength;
        }
        else
        {
            // after the surface: go backward
            origin.sub(
                currentStep.copy(search_dir_unit)
                    .multiplyScalar(startStepLength));
            dist-=startStepLength;
        }
    }
    // linear interpolation with previous pos
    res.p.copy(origin.add(previousPos).divideScalar(2));
    res.p_absc = (previousDist + dist)/2;

    // linear interpolation with previous pos
    res.p.copy(origin);
    res.p_absc = dist;

    // test wether the caller wanted to compute the gradient
    // (we assume that if res.g is defined, it's a request)
    if (res.g)
    {
        this.eval_res.g = this.eval_res_g; // active gradient computation
        pot.value(
            res.p,
            this.eval_res);
        res.g.copy(this.eval_res.g);
    }

};

var Convergence_1 = Convergence$3;

const THREE$o = require$$0__default["default"];
const Types$j = Types_1;
const RicciNode$1 = RicciNode_1;

const Convergence$2 = Convergence_1;

/** @typedef {import('./Element')} Element */
/** @typedef {import('./Node')} Node */
/** @typedef {import('./Material')} Material */
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./RicciNode').RicciNodeJSON} RicciNodeJSON */

/**
 * @typedef {{iso:number} & RicciNodeJSON} RootNodeJSON
 */


/**
 * @typedef {Object} IntersectionResult The result of the intersection
 * @property {number=} distance distance from ray.origin to intersection point,
 * @property {THREE.Vector3} point: intersection point,
 * @property {THREE.Vector3} g: gradient at intersection, if required.
 */

/**
 *  The root of any implicit blobtree. Does behave computationaly like a RicciNode with n = 64.
 *  The RootNode is the only node to be its own parent.
 *  @constructor
 *  @extends RicciNode
 */
class RootNode$1 extends RicciNode$1 {

    static type = "RootNode";

    /**
     * @param {RootNodeJSON} json
     * @returns {RootNode}
     */
    static fromJSON(json) {
        var res = new RootNode$1();
        for (var i = 0; i < json.children.length; ++i) {
            res.addChild(Types$j.fromJSON(json.children[i]));
        }
        return res;
    };

    constructor() {
        // Default RootNode is a riccinode with ricci_n = 64 (almost a max)
        super(64);

        this.valid_aabb = true;

        // Default iso value, value where the surface is present
        /** @type {number} */
        this.iso_value = 1.0;

        // Set some nodes as "trimmed", so they are not evaluated.
        /** @type {Array<Element>} */
        this.trimmed = [];
        /** @type {Array<Node>} */
        this.trim_parents = [];
    }

    /**
     * @link Node.getType
     * @returns {string}
     */
    getType() {
        return RootNode$1.type;
    };

    /**
     * @link RicciNode.toJSON
     * @returns {RootNodeJSON}
     */
    toJSON() {
        var res = {
            ...super.toJSON(),
            iso: this.iso_value
        };
        return res;
    };

    /**
     * @returns {number}
     */
    getIsoValue() {
        return this.iso_value;
    };
    /**
     * @param {number} v
     */
    setIsoValue(v) {
        this.iso_value = v;
    };

    /**
     *  @return {number} The neutral value of this tree, ie the value of the field in empty region of space.
     *                   This is an API for external use and future development. For now it is hard set to 0.
     */
    getNeutralValue() {
        return 0;
    };

    /**
     * @link Node.invalidAABB for a complete description
     */
    invalidAABB() {
        this.valid_aabb = false;
    };

    /**
     *  Basically perform a trim but keep track of trimmed elements.
     *  This is usefull if you want to trim, then untrim, then trim, etc...
     *  For example, this is very useful for evaluation optim
     *  @param {THREE.Box3} aabb
     */
    internalTrim(aabb) {
        if (!(this.trimmed.length === 0 && this.trim_parents.length === 0)) {
            throw "Error : you should not call internal trim if you have not untrimmed before. Call untrim or use externalTrim";
        }
        this.trim(aabb, this.trimmed, this.trim_parents);
    };

    /**
     *  Wrapper for trim, will help programmers to make the difference between
     *  internal and external trim.
     *  @param {THREE.Box3} aabb
     *  @param {Array.<Element>} trimmed Array of trimmed Elements
     *  @param {Array.<Node>} parents Array of fathers from which each trimmed element has been removed.
     */
    externalTrim(aabb, trimmed, parents) {
        this.trim(aabb, trimmed, parents);
    };

    /**
     *  Reset the full blobtree
     */
    internalUntrim() {
        this.untrim(this.trimmed, this.trim_parents);
        this.trimmed.length = 0;
        this.trim_parents.length = 0;
    };

    /**
     *  Reset the full blobtree given previous trimming data.
     *  Note : don't forget to recall prepareForEval if you want to perform evaluation.
     *  @param {Array.<Element>} trimmed Array of trimmed Elements
     *  @param {Array.<Node>} parents Array of fathers from which each trimmed element has been removed.
     */
    untrim(trimmed, parents) {
        if (!(trimmed.length === parents.length)) {
            throw "Error : trimmed and parents arrays should have the same length";
        }
        for (var i = 0; i < trimmed.length; ++i) {
            parents[i].addChild(trimmed[i]);
        }
    };

    /**
     *  Tell if the blobtree is empty
     *  @return true if blobtree is empty
     */
    isEmpty = function () {
        return this.children.length == 0;
    };


    intersectRayBlob = function () {
        var curPos = new THREE$o.Vector3();
        var marchingVector = new THREE$o.Vector3();
        var currentStep = new THREE$o.Vector3();

        /** @type {ValueResultType} */
        var tmp_res = {
            v: 0,
            g: new THREE$o.Vector3(),
            step: 0
        };
        var conv_res = {
            p: new THREE$o.Vector3(),
            g: new THREE$o.Vector3(),
            p_absc: 0.0
        };
        var previousStepLength = 0;
        var previousValue = 0; // used for linear interp for a better guess
        var dist = 0;
        /**
         * @this RootNode
         *  @param {!THREE.Ray} ray Ray to cast for which intersection is seeked.
         *
         *  @param {IntersectionResult} res
         *  @param {number} maxDistance If the intersection is not located at a distance
         *                              lower than maxDistance, it will not be considered.
         *                              The smaller this is, the faster the casting will be.
         *  @param {number} _precision Distance to the intersection under which we will
         *                            consider to be on the intersection point.
         *
         *  @return {boolean} True if an intersection has been found.
         */
        return function (ray, res, maxDistance, _precision) {
            curPos.copy(ray.origin);
            marchingVector.copy(ray.direction);

            marchingVector.normalize();
            dist = 0;
            // compute first value to have next step length
            tmp_res.g = null;
            this.value(curPos, tmp_res);

            // march
            while ((tmp_res.v < this.iso_value) && (dist < maxDistance)) {
                curPos.add(
                    currentStep.copy(marchingVector).multiplyScalar(tmp_res.step)
                );
                dist += tmp_res.step;

                previousStepLength = tmp_res.step;
                previousValue = tmp_res.v;

                this.value(
                    curPos,
                    tmp_res);
            }
            if (tmp_res.v >= this.iso_value) {
                // Convergence.dichotomy1D(
                // this,
                // curPos,
                // marchingVector,
                // previousStepLength,
                // iso_value,
                // previousStepLength/512.0,
                // 10,
                // conv_res
                // );
                // res.distance = dist + conv_res.absc;

                Convergence$2.safeNewton1D(
                    this,
                    curPos,
                    marchingVector.multiplyScalar(-1.0),
                    0.0,
                    previousStepLength,
                    previousStepLength * (this.iso_value - tmp_res.v) / (previousValue - tmp_res.v), // linear approx of the first position
                    this.iso_value,
                    previousStepLength / 512.0, //deltaPix*(dist-previousStepLength), // should be the size of a pixel at the previous curPos BROKEN?
                    10,
                    conv_res
                );
                res.distance = dist - conv_res.p_absc;

                res.point = conv_res.p.clone();

                // test wether the caller wanted to compute the gradient
                // (we assume that if res.g is defined, it's a request)
                if (res.g) {
                    res.g.copy(conv_res.g);
                }

                return true;
            }
            else {
                // no intersection
                return false;
            }
        };
    }();


    /**
     *  Kaiser function for some intersection and raycasting...
     *  Undocumented.
     *  TODO : check, it is probably an optimized intersection for blob intersection
     *         in X, Y or Z directions.
     */
    intersectOrthoRayBlob = function () {
        // curpos and marching vector are only instanciated once,
        // we are using closure method
        var curPos = new THREE$o.Vector3();
        var resumePos = new THREE$o.Vector3();
        /** @type {ValueResultType} */
        var tmp_res = {
            v: 0,
            step: 0
        };
        var g = new THREE$o.Vector3();
        /** @type {ValueResultType} */
        var dicho_res = {
            v: 0
        };
        var previousStepLength = 0;
        var previousDist = 0;
        // to ensure that we're within the aabb
        var epsilon = 0.0000001;
        var within = -1;
        /**
         * @this {RootNode}
         * @param {number} wOffset
         * @param {number} hOffset
         * @param {Array<IntersectionResult>} res
         * @param {Object} dim ???
         */
        return function (wOffset, hOffset, res, dim) {

            if (dim.axis.x) {
                curPos.set(this.aabb.min.x + wOffset,
                    this.aabb.min.y + hOffset,
                    this.aabb.min.z + epsilon);
            } else if (dim.axis.y) {
                curPos.set(this.aabb.min.x + wOffset,
                    this.aabb.min.y + epsilon,
                    this.aabb.min.z + hOffset);
            } else if (dim.axis.z) {
                curPos.set(this.aabb.min.x + epsilon,
                    this.aabb.min.y + wOffset,
                    this.aabb.min.z + hOffset);
            }

            // max depth step we can do (has to be set)
            tmp_res.step = dim.get(this.aabb.max) - dim.get(this.aabb.min);

            this.value(curPos, tmp_res);

            previousStepLength = epsilon;

            within = -1;

            // we're looking for all intersection, we won't stop before that
            while (dim.get(curPos) < dim.get(this.aabb.max)) {
                // march
                // the '=0' case is important, otherwise there's an infinite loop
                while (((tmp_res.v - 1) * within >= 0) && (dim.get(curPos) < dim.get(this.aabb.max))) {
                    // orthographic march
                    // our tmp_res.step is valid as we know it's within the aabb
                    dim.add(curPos, tmp_res.step);

                    previousStepLength = tmp_res.step;

                    // max depth step we can do (has to be set)
                    tmp_res.step = dim.get(this.aabb.max) - dim.get(curPos);
                    this.value(
                        curPos,
                        tmp_res);
                }
                // either a sign difference or we're out
                if (dim.get(curPos) < dim.get(this.aabb.max)) {
                    // we ain't out, so it was a sign difference
                    within *= -1;
                    // keep track of our current position in order to resume marching later
                    resumePos.copy(curPos);
                    previousDist = dim.get(curPos);

                    // compute intersection
                    // dichotomia: first step is going back half of the previous distance
                    previousStepLength /= 2;

                    dim.add(curPos, -previousStepLength);

                    // we use dicho_res instead of tmp_res because we need
                    // to keep track of previous results in order to resume later

                    // dynamic number of dichotomia step
                    dicho_res.g = null;
                    while (previousStepLength > 0.1) {
                        previousDist = dim.get(curPos);
                        previousStepLength /= 2;
                        // not asking for the next step, which is always half of previous
                        this.value(curPos, dicho_res);

                        if ((dicho_res.v - 1) * within < 0)
                            // forward
                            dim.add(curPos, previousStepLength);
                        else
                            // backward
                            dim.add(curPos, -previousStepLength);
                    }
                    // linear interpolation with previous dist
                    dim.add(curPos, previousDist);
                    dim.divide(curPos, 2);
                    // get the gradient
                    dicho_res.g = g;
                    this.value(curPos, dicho_res);
                    res.push({
                        point: curPos.clone(),
                        g: dicho_res.g.clone()
                    });
                    // set variable in order to resume to where we were
                    curPos.copy(resumePos);
                }
            }
        };
    }();

}
Types$j.register(RootNode$1.type, RootNode$1);

var RootNode_1 = RootNode$1;

const THREE$n = require$$0__default["default"];
const Types$i = Types_1;
const Node$5 = Node_1;
const Material$b = Material_1;

/**
 * @typedef {import('./Element.js')} Element
 * @typedef {import('./Element.js').Json} Json
 * @typedef {import('./Node.js').NodeJSON} NodeJSON
 */

/**
 * @typedef {{alpha:number} & NodeJSON} DifferenceNodeJSON
 */


/**
 *  This class implement a difference blending node.
 *  The scalar field of the second child of this node will be substracted to the first node field.
 *  The result is clamped to 0 to always keep a positive field value.
 *  @constructor
 *  @extends Node
 */
class DifferenceNode extends Node$5 {

    static type = "DifferenceNode";

    /**
     * @param {DifferenceNodeJSON} json
     * @returns {DifferenceNode}
     */
    static fromJSON(json) {
        return new DifferenceNode(Types$i.fromJSON(json.children[0]), Types$i.fromJSON(json.children[1]), json.alpha);
    };

    /**
     *
     *  @param {!Node} node0 The first node
     *  @param {!Node} node1 The second node, its value will be substracted to the node 0 value.
     *  @param {number} alpha Power of the second field : the greater alpha the sharper the difference. Default is 1, must be > 1.
     */
    constructor(node0, node1, alpha){
        super();
        this.addChild(node0);
        this.addChild(node1);

        /** @type {number} */
        this.alpha = alpha || 1;

        /**
         * For now, this field value is clamped to 0
         * @type {number}
         */
        this.clamped = 0.0;

        // Tmp vars to speed up computation (no reallocations)
        /** @type {{v:number, g:THREE.Vector3, m:Material}} */
        this.tmp_res0 = { v: 0, g: new THREE$n.Vector3(0, 0, 0), m: new Material$b() };

        /** @type {{v:number, g:THREE.Vector3, m:Material}} */
        this.tmp_res1 = { v: 0, g: new THREE$n.Vector3(0, 0, 0), m: new Material$b() };

        /** @type {THREE.Vector3} */
        this.g0 = new THREE$n.Vector3();
        /** @type {Material} */
        this.m0 = new Material$b();
        /** @type {THREE.Vector3} */
        this.g1 = new THREE$n.Vector3();
        /** @type {Material} */
        this.m1 = new Material$b();

        /** @type {Float32Array} */
        this.tmp_v_arr = new Float32Array(2);
        /** @type {Array<Material|null>} */
        this.tmp_m_arr = [
            null,
            null
        ];
    }

    /**
     * @returns {number}
     */
    getAlpha() {
        return this.alpha;
    };

    /**
     * @param {number} alpha
     */
    setAlpha(alpha) {
        if (this.alpha != alpha) {
            this.alpha = alpha;
            this.invalidAABB();
        }
    };

    /**
     * @returns {DifferenceNodeJSON}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            alpha: this.alpha
        };
    };

    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval() {
        if (!this.valid_aabb) {
            this.children[0].prepareForEval();
            this.children[1].prepareForEval();
            // Bounding box of this node is the same as the one of the positive children,
            // Since negative values will be clamped to 0.
            this.aabb.copy(this.children[0].getAABB());

            this.valid_aabb = true;
        }
    };

    /**
     *  Compute the value and/or gradient and/or material
     *  of the element at position p in space. return computations in res (see below)
     *
     *  @param {THREE.Vector3} p Point where we want to evaluate the primitive field
     *  @param {Object} res Computed values will be stored here. Each values should exist and
     *                       be allocated already.
     *  @param {number} res.v Value, must be defined
     *  @param {Material} res.m Material, must be allocated and defined if wanted
     *  @param {THREE.Vector3} res.g Gradient, must be allocated and defined if wanted
     *  @param {number=} res.step The next step we can safely walk without missing the iso (0). Mostly used for convergence function or ray marching.
     *  @param {number=} res.stepOrtho
     */
    value(p, res) {
        var v_arr = this.tmp_v_arr;
        var m_arr = this.tmp_m_arr;

        var tmp0 = this.tmp_res0;
        var tmp1 = this.tmp_res1;

        tmp0.g = res.g ? this.g0 : null;
        tmp0.m = res.m ? this.m0 : null;
        tmp1.g = res.g ? this.g1 : null;
        tmp1.m = res.m ? this.m1 : null;

        // Init res
        res.v = 0;
        tmp1.v = 0;
        tmp0.v = 0;
        if (res.m) {
            res.m.copy(Material$b.defaultMaterial);
            tmp1.m.copy(Material$b.defaultMaterial);
            tmp0.m.copy(Material$b.defaultMaterial);
        } if (res.g) {
            res.g.set(0, 0, 0);
            tmp1.g.set(0, 0, 0);
            tmp0.g.set(0, 0, 0);
        } else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }

        if (this.aabb.containsPoint(p)) {
            if (this.children[0].aabb.containsPoint(p)) {
                this.children[0].value(p, tmp0);
                if (this.children[1].aabb.containsPoint(p)) {
                    this.children[1].value(p, tmp1);
                }
                if (tmp1.v === 0) {
                    res.v = tmp0.v;
                    if (res.g) {
                        res.g.copy(tmp0.g);
                    }
                    if (res.m) {
                        res.m.copy(tmp0.m);
                    }
                } else {
                    var v_pow = Math.pow(tmp1.v, this.alpha);
                    res.v = Math.max(this.clamped, tmp0.v - tmp1.v * Math.pow(tmp1.v, this.alpha - 1.0));
                    if (res.g) {
                        if (res.v === this.clamped) {
                            res.g.set(0, 0, 0);
                        } else {
                            tmp1.g.multiplyScalar(v_pow);
                            res.g.subVectors(tmp0.g, tmp1.g);
                        }
                    }
                    if (res.m) {
                        v_arr[0] = tmp0.v;
                        v_arr[1] = tmp1.v;
                        m_arr[0] = tmp0.m;
                        m_arr[1] = tmp1.m;
                        res.m.weightedMean(m_arr, v_arr, 2);
                    }
                }
            }
        }
        else if (res.step !== undefined) {
            // return distance to aabb such that next time we'll hit from within the aabbb
            res.step = this.aabb.distanceToPoint(p) + 0.3;
        }
    };

    /**
     *  @link Element.trim for a complete description.
     *
     *  Trim must be redefined for DifferenceNode since in this node we cannot trim one of the 2 nodes without trimming the other.
     *
     *  @param {THREE.Box3} aabb
     *  @param {Array.<Element>} trimmed
     *  @param {Array.<Node>} parents
     */
    trim(aabb, trimmed, parents) {
        // Trim remaining nodes
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    };
}
Types$i.register(DifferenceNode.type, DifferenceNode);

var DifferenceNode_1 = DifferenceNode;

const THREE$m = require$$0__default["default"];
const Types$h = Types_1;
const Node$4 = Node_1;
const Material$a = Material_1;

/** @typedef {import('./Element.js')} Element */
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */

/**
 * @typedef {NodeJSON} MinNodeJSON
 */

/**
 *  This class implement a Min node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
class MinNode extends Node$4 {

    static type = "MinNode";

    /**
     *
     * @param {MinNodeJSON} json
     * @returns {MinNode}
     */
    static fromJSON(json) {
        var res = new MinNode();
        for (var i = 0; i < json.children.length; ++i) {
            res.addChild(Types$h.fromJSON(json.children[i]));
        }
        return res;
    }

    /**
    *  @param {Array.<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children) {

        super();

        if (children) {
            var self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }

        // temp vars to speed up evaluation by avoiding allocations
        /** @type {{v:number, g:THREE.Vector3, m:Material}} */
        this.tmp_res = { v: 0, g: null, m: null };
        /** @type {THREE.Vector3} */
        this.tmp_g = new THREE$m.Vector3();
        /** @type {Material} */
        this.tmp_m = new Material$a();

    }

    getType () {
        return MinNode.type;
    }

    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval () {
        if (!this.valid_aabb) {
            this.aabb = new THREE$m.Box3();  // Create empty BBox
            for (var i = 0; i < this.children.length; ++i) {
                var c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB());     // new aabb is computed according to remaining children aabb
            }

            this.valid_aabb = true;
        }
    };

    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value (p, res) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)

        var l = this.children.length;
        var tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;

        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material$a.defaultMaterial);
        } if (res.g) {
            res.g.set(0, 0, 0);
        } else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }

        if (this.aabb.containsPoint(p) && l !== 0) {
            res.v = Number.MAX_VALUE;
            for (var i = 0; i < l; ++i) {
                this.children[i].value(p, tmp);
                if (tmp.v < res.v) {
                    res.v = tmp.v;
                    if (res.g) {
                        res.g.copy(tmp.g);
                    }
                    if (res.m) {
                        res.m.copy(tmp.m);
                    }
                    // within primitive potential
                    if (res.step || res.stepOrtho) {
                        throw "Not implemented";
                    }
                }
                res.v = Math.min(res.v, tmp.v);
            }
        }
        else if (res.step || res.stepOrtho) {
            throw "Not implemented";
        }
    }

    /**
     *  @link Element.trim for a complete description.
     *
     *  @param {THREE.Box3} aabb
     *  @param {Array<Element>} trimmed
     *  @param {Array<Node>} parents
     */
    trim(aabb, trimmed, parents) {
        // Trim remaining nodes
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    };
}

Types$h.register(MinNode.type, MinNode);

var MinNode_1 = MinNode;

const THREE$l = require$$0__default["default"];
const Types$g = Types_1;
const Node$3 = Node_1;
const Material$9 = Material_1;

/** @typedef {import('./Element.js')} Element */
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */

/**
 * @typedef { {twist_amout:number} & {axis_x:number} & {axis_y:number} & {axis_z:number} & NodeJSON} TwistNodeJSON
 */

/**
 *  This class implement a TwistNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
class TwistNode extends Node$3 {

    static type = "TwistNode";

    /**
    *  @param {Array.<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children) {

        super();

        if (children) {
            var self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }

        // temp vars to speed up evaluation by avoiding allocations
        /** @type {{v:number, g:THREE.Vector3, m:Material}} */
        this.tmp_res = { v: 0, g: null, m: null };
        /** @type {THREE.Vector3} */
        this.tmp_g = new THREE$l.Vector3();
        /** @type {Material} */
        this.tmp_m = new Material$9();

        this._twist_amout = 1.0;
        this._twist_axis = new THREE$l.Vector3(0.0,1.0,0.0);
        this._twist_axis_mat = new THREE$l.Matrix4();
        this._twist_axis_mat_inv = new THREE$l.Matrix4();

    }

    
     /**
     * @link Node.toJSON
     * @returns {TwistNodeJSON}
     */
      toJSON() {
        let res = {
            ...super.toJSON(),
            twist_amout: this._twist_amout,
            axis_x: this._twist_axis.x,
            axis_y: this._twist_axis.y,
            axis_z: this._twist_axis.z,
        };

        return res;
    };

    /**
     *@link Node.fromJSON
     * 
     * @param {TwistNodeJSON} json
     * @returns {TwistNode}
     */
     static fromJSON(json) {
        var res = new TwistNode();
        res.setTwistAmount(json.twist_amout);
        res.setTwistAxis(new THREE$l.Vector3(json.axis_x
                                            ,json.axis_y
                                            ,json.axis_z));
        for (var i = 0; i < json.children.length; ++i) {
            res.addChild(Types$g.fromJSON(json.children[i]));
        }
        return res;
    }

    setTwistAmount(amount)
    {
        this._twist_amout = amount;
    }

    setTwistAxis(axis)
    {
        this._twist_axis = axis;
        this._computeTransforms();
    }

    _computeTransforms()
    {
        let r_angle = Math.acos(this._twist_axis.dot(new THREE$l.Vector3(0,1,0)));
        if(Math.abs(r_angle) > 0.0001)
        {   
            let t_axis = this._twist_axis.clone();
            let rot_axis = t_axis.cross(new THREE$l.Vector3(0,1,0));
            rot_axis.normalize();            
            this._twist_axis_mat.makeRotationAxis(rot_axis,r_angle);
        }
        else
        {
            this._twist_axis_mat.identity();
        }
        this._twist_axis_mat_inv = this._twist_axis_mat.clone();
        this._twist_axis_mat_inv.invert();      
    }

    getType () {
        return TwistNode.type;
    }

    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval () {
        if (!this.valid_aabb) {
            this.aabb = new THREE$l.Box3();  // Create empty BBox
            for (var i = 0; i < this.children.length; ++i) {
                var c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB());     // new aabb is computed according to remaining children aabb
            }

            this.valid_aabb = true;
        }
    };

    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value (p, res) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)

        var l = this.children.length;
        var tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;

        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material$9.defaultMaterial);
        } if (res.g) {
            res.g.set(0, 0, 0);
        } else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }



        if (this.aabb.containsPoint(p) && l !== 0) {
         

            let center = new THREE$l.Vector3();
            this.aabb.getCenter(center);            
          
            //Center the input point
            let t_p =  new THREE$l.Vector3(p.x - center.x
                                        ,p.y - center.y
                                        ,p.z - center.z);

            //Rotate towards twist axis space
            t_p.applyMatrix4(this._twist_axis_mat);

            //Twist          
            let c_twist = Math.cos(this._twist_amout*t_p.y);
            let s_twist = Math.sin(this._twist_amout*t_p.y);
        
            //Revert to world space
            let q = new THREE$l.Vector3(c_twist*t_p.x - s_twist*t_p.z,
                                     t_p.y,
                                     s_twist*t_p.x + c_twist*t_p.z);
            
            q.applyMatrix4(this._twist_axis_mat_inv);

            let t_q = new THREE$l.Vector3(q.x + center.x
                ,q.y + center.y
                ,q.z + center.z);
                                
            res.v = Number.MAX_VALUE;
            for (var i = 0; i < l; ++i) {
                this.children[i].value(t_q, tmp);
                res.v = tmp.v;

                if (res.g) {
                    res.g.copy(tmp.g);
                }
                if (res.m) {
                    res.m.copy(tmp.m);
                }
                // within primitive potential
                if (res.step || res.stepOrtho) {
                    throw "Not implemented";
                }
            }
        }
        else if (res.step || res.stepOrtho) {
            throw "Not implemented";
        }
    }

    /**
     *  @link Element.trim for a complete description.
     *
     *  @param {THREE.Box3} aabb
     *  @param {Array<Element>} trimmed
     *  @param {Array<Node>} parents
     */
    trim(aabb, trimmed, parents) {
        // Trim remaining nodes
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    };
}

Types$g.register(TwistNode.type, TwistNode);

var TwistNode_1 = TwistNode;

const THREE$k = require$$0__default["default"];
const Types$f = Types_1;
const Node$2 = Node_1;
const Material$8 = Material_1;

/** @typedef {import('./Element.js')} Element */
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */

/**
 * @typedef { {scale_x:number} & {scale_y:number} & {scale_z:number} & NodeJSON} ScaleNodeJSON
 */

/**
 *  This class implement a ScaleNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
class ScaleNode extends Node$2 {

    static type = "ScaleNode";
 
    /**
    *  @param {Array.<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children) {

        super();

        if (children) {
            var self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }

        // temp vars to speed up evaluation by avoiding allocations
        /** @type {{v:number, g:THREE.Vector3, m:Material}} */
        this.tmp_res = { v: 0, g: null, m: null };
        /** @type {THREE.Vector3} */
        this.tmp_g = new THREE$k.Vector3();
        /** @type {Material} */
        this.tmp_m = new Material$8();

        this._scale = new THREE$k.Vector3(1,1,1);

    }



     /**
     * @link Node.toJSON
     * @returns {ScaleNodeJSON}
     */
      toJSON() {
        let res = {
            ...super.toJSON(),
            scale_x: this._scale.x,
            scale_y: this._scale.y,
            scale_z: this._scale.z,
        };

        return res;
    };

    /**
     * @link Node.fromJSON
     * 
     * @param {ScaleNodeJSON} json
     * @returns {ScaleNode}
     */
    static fromJSON(json) {
    var res = new ScaleNode();
    res.setScale(new THREE$k.Vector3(json.scale_x
                                    ,json.scale_y
                                    ,json.scale_z));
    for (var i = 0; i < json.children.length; ++i) {
        res.addChild(Types$f.fromJSON(json.children[i]));
    }
    return res;
    }

    /**
     * @link ScaleNode.setScale
     */
    setScale(scale)
    {
        this._scale = scale;
        this.invalidAABB();
    }

    /**
     * @link Node.getType
     */
    getType () {
        return ScaleNode.type;
    }

    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval () {
        if (!this.valid_aabb) {
            this.aabb = new THREE$k.Box3();  // Create empty BBox
            for (var i = 0; i < this.children.length; ++i) {
                var c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB());    // new aabb is computed according to remaining children aabb
            }

            let bb_size = new THREE$k.Vector3();
            this.aabb.clone().getSize(bb_size);
            let x_scale = bb_size.x*(this._scale.x - 1.0);
            let y_scale = bb_size.y*(this._scale.y - 1.0);
            let z_scale = bb_size.z*(this._scale.z - 1.0);
    
            this.aabb.expandByVector(new THREE$k.Vector3(x_scale,y_scale,z_scale));
            this.valid_aabb = true;
        }
    };

     /**
     * @link Element.computeAABB for a complete description
     */
      computeAABB () {
        this.aabb.makeEmpty();
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].computeAABB();
            this.aabb.union( this.children[i].getAABB());
        }

        let bb_size = new THREE$k.Vector3();
        this.aabb.clone().getSize(bb_size);
        let x_scale = bb_size.x*(this._scale.x - 1.0);
        let y_scale = bb_size.y*(this._scale.y - 1.0);
        let z_scale = bb_size.z*(this._scale.z - 1.0);

        this.aabb.expandByVector(new THREE$k.Vector3(x_scale,y_scale,z_scale));
    }

    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value (p, res) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)

        var l = this.children.length;
        var tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;

        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material$8.defaultMaterial);
        } if (res.g) {
            res.g.set(0, 0, 0);
        } else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }


        if (this.aabb.containsPoint(p) && l !== 0) {
         

            let center = new THREE$k.Vector3();
            this.aabb.getCenter(center);
          
            let st_p =  new THREE$k.Vector3((p.x - center.x)/this._scale.x + center.x
                                        ,(p.y - center.y)/ this._scale.y + center.y
                                        ,(p.z - center.z)/ this._scale.z + center.z);
                                
            res.v = Number.MAX_VALUE;
            for (var i = 0; i < l; ++i) {
                this.children[i].value(st_p, tmp);
                res.v = tmp.v;
                if (res.g) {
                    res.g.copy(tmp.g);
                }
                if (res.m) {
                    res.m.copy(tmp.m);
                }
                // within primitive potential
                if (res.step || res.stepOrtho) {
                    throw "Not implemented";
                }
            }
        }
        else if (res.step || res.stepOrtho) {
            throw "Not implemented";
        }
    }

    /**
     *  @link Element.trim for a complete description.
     *
     *  @param {THREE.Box3} aabb
     *  @param {Array<Element>} trimmed
     *  @param {Array<Node>} parents
     */
    trim(aabb, trimmed, parents) {
        // Trim remaining nodes
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    };
}

Types$f.register(ScaleNode.type, ScaleNode);

var ScaleNode_1 = ScaleNode;

const Element$1 = Element_1;
const Types$e = Types_1;

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
class Primitive$2 extends Element$1 {

    static type = "Primitive";

    /**
     * @param {PrimitiveJSON} _json
     */
    static fromJSON(_json) {
        throw new Error("Primitibe.fromJSON should never be called as Primitibe is abstract.");
    }

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
        throw "Primitive.computeAABB  Must be reimplemented in all inherited class.";
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

}
Types$e.register(Primitive$2.type, Primitive$2);

var Primitive_1 = Primitive$2;

let KS = 2.0;
let KIS = 1 / KS;
let KS2 = 4.0;
let KIS2 = 1 / (KS * KS);

/**
 *  Compute the iso value at a given distance for a given polynomial degree
 *  and scale in 0 dimension (point)
 *
 *  @param {number} degree  Polynomial degree of the kernel
 *  @param {number} scale   Kernel scale
 *  @param {number} dist    Distance
 *  @return {number} The iso value at a given distance for a given polynomial degree and scale
 */
let GetIsoValueAtDistanceGeom0D = function (degree, scale, dist) {
    if (degree % 2 !== 0) {
        throw "degree should be even";
    }

    if (dist < scale) {
        var func_dist_scale = 1.0 - (dist * dist) / (scale * scale);
        return Math.pow(func_dist_scale, degree / 2.0);
    }
    else {
        return 0.0;
    }
};

/**
 *  Compute the iso value at a given distance for a given polynomial degree
 *  and scale in 1 dimension
 *
 *  @param {number} degree  Polynomial degree of the kernel
 *  @param {number} scale   Kernel scale
 *  @param {number} dist    Distance
 *  @return {number} The iso value at a given distance for a given polynomial degree and scale
 */
let GetIsoValueAtDistanceGeom1D = function (degree, scale, dist) {
    if (degree % 2 !== 0) {
        throw "degree should be even";
    }

    if (dist < scale) {
        var func_dist_scale = 1.0 - (dist * dist) / (scale * scale);
        var iso_for_dist = 2.0 * scale * Math.sqrt(func_dist_scale);
        var k = 0;
        while (k != degree) {
            k += 2;
            iso_for_dist *= k / (1.0 + k) * func_dist_scale;
        }
        return iso_for_dist;
    }
    else {
        return 0.0;
    }
};

/**
 *  Compute the iso value at a given distance for a given polynomial degree
 *  and scale in 2 dimensions
 *
 *  @param {number} degree  Polynomial degree of the kernel
 *  @param {number} scale   Kernel scale
 *  @param {number} dist    Distance
 *  @return {number} The iso value at a given distance for a given polynomial degree and scale
 */
let GetIsoValueAtDistanceGeom2D = function (degree, scale, dist) {
    if (dist < scale) {
        var i_p_2 = degree + 2;
        var func_dist_scale = 1.0 - (dist * dist) / (scale * scale);
        return (2.0 * Math.PI / i_p_2) * scale * scale * Math.pow(func_dist_scale, i_p_2 * 0.5);
    }
    else {
        return 0.0;
    }
};

var ScalisMath$6 = {
    KS: KS,
    KIS: KIS,
    KS2: KS2,
    KIS2: KIS2,
    /**
     *  Compact Polynomial of degree 6 evaluation function
     *  @param {number} r Radius (ie distance)
     */
    Poly6Eval: function (r) {
        var aux = 1.0 - KIS2 * r * r;

        if (aux > 0.0) {
            return aux * aux * aux;
        } else {
            return 0.0;
        }
    },
    /**
     *  Compact Polynomial of degree 6 evaluation function from a squared radius.
     *  (avoid square roots in some cases)
     *  @param {number} r2 Radius squared (ie distance squared)
     */
    Poly6EvalSq: function (r2) {
        var aux = 1.0 - KIS2 * r2;

        if (aux > 0.0) {
            return aux * aux * aux;
        } else {
            return 0.0;
        }
    },
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 0 dimension (point)
     *
     *  @param {number} degree  Polynomial degree of the kernel
     *  @param {number} scale   Kernel scale
     *  @param {number} dist    Distance
     *  @return {number} The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom0D: GetIsoValueAtDistanceGeom0D,
    /**
     * @type {number} Normalization Factor for polynomial 4 in 0 dimension
     * @const
     */
    Poly4NF0D: 1.0 / GetIsoValueAtDistanceGeom0D(4, KS, 1.0),
    /**
     * @type {number} Normalization Factor for polynomial 6 in 0 dimension
     * @const
     */
    Poly6NF0D: 1.0 / GetIsoValueAtDistanceGeom0D(6, KS, 1.0),
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 1 dimension
     *
     *  @param {number} degree  Polynomial degree of the kernel
     *  @param {number} scale   Kernel scale
     *  @param {number} dist    Distance
     *  @return {number} The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom1D: GetIsoValueAtDistanceGeom1D,
    /**
     * @type {number} Normalization Factor for polynomial 4 in 1 dimension
     * @const
     */
    Poly4NF1D: 1.0 / GetIsoValueAtDistanceGeom1D(4, KS, 1.0),
    /**
     * @type {number} Normalization Factor for polynomial 6 in 1 dimension
     * @const
     */
    Poly6NF1D: 1.0 / GetIsoValueAtDistanceGeom1D(6, KS, 1.0),
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 2 dimensions
     *
     *  @param {number} degree  Polynomial degree of the kernel
     *  @param {number} scale   Kernel scale
     *  @param {number} dist    Distance
     *  @return {number} The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom2D: GetIsoValueAtDistanceGeom2D,
    /**
     * @type {number} Normalization Factor for polynomial 4 in 2 dimension
     * @const
     */
    Poly4NF2D: 1.0 / GetIsoValueAtDistanceGeom2D(4, KS, 1.0),
    /**
     * @type {number} Normalization Factor for polynomial 6 in 2 dimension
     * @const
     */
    Poly6NF2D: 1.0 / GetIsoValueAtDistanceGeom2D(6, KS, 1.0)
};

var ScalisMath_1 = ScalisMath$6;

const Types$d = Types_1;
const Primitive$1 = Primitive_1;

/** @typedef {import('../Element.js')} Element */
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ElementJSON} ElementJSON */
/** @typedef {import('../Primitive.js').PrimitiveJSON} PrimitiveJSON */
/** @typedef {import('./ScalisVertex')} ScalisVertex */
/** @typedef {import('./ScalisVertex').ScalisVertexJSON} ScalisVertexJSON */

/**
 * @typedef {{v:Array<ScalisVertexJSON>, volType:string} & PrimitiveJSON} ScalisPrimitiveJSON
 */

/**
 *  Represent an implicit primitive respecting the SCALIS model developped by Cedrric Zanni
 *
 *  @constructor
 *  @extends {Primitive}
 */
class ScalisPrimitive$3 extends Primitive$1 {

    static type = "ScalisPrimitive"

    static DIST = "dist";
    static CONVOL = "convol";

    constructor() {
        super();

        // Type of volume (convolution or distance funtion)
        this.volType = ScalisPrimitive$3.DIST;

        /**
         * @type {!Array.<!ScalisVertex>}
         */
        this.v = []; // vertex array
    }

    /**
     *  @return {string} Type of the element
     */
    getType() {
        return ScalisPrimitive$3.type;
    }

    /**
     *  @return {ScalisPrimitiveJSON}
     */
    toJSON() {
        var res = {
            ...super.toJSON(),
            v: [],
            volType: this.volType
        };
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
}
Types$d.register(ScalisPrimitive$3.type, ScalisPrimitive$3);

var ScalisPrimitive_1 = ScalisPrimitive$3;

const THREE$j = require$$0__default["default"];

const ScalisMath$5 = ScalisMath_1;

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
class ScalisVertex$3 {

    static fromJSON(json) {
        return new ScalisVertex$3(new THREE$j.Vector3(json.position.x, json.position.y, json.position.z), json.thickness);
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

        this.aabb = new THREE$j.Box3();
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
        var boundSupport = this.getThickness() * ScalisMath$5.KS;
        this.aabb.set(new THREE$j.Vector3(
            pos.x - boundSupport,
            pos.y - boundSupport,
            pos.z - boundSupport
        ),
            new THREE$j.Vector3(
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



var ScalisVertex_1 = ScalisVertex$3;

/**
 * @typedef {Object} AreaSphereParam
 * @property {number} radius
 * @property {THREE.Vector3} center
 */

/**
 *  Bounding area for a primitive
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere for now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 */
class Area$4 {

    /**
     *  @abstract
     *  Test intersection of the shape with a sphere
     *  @param {AreaSphereParam} _sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {boolean} true if the sphere and the area intersect
     */
    sphereIntersect(_sphere) {
        throw "Error : sphereIntersect is abstract, should have been overwritten";
    }

    /**
     * @abstract
     * Test if p is in the area.
     * @param {!THREE.Vector3} _p A point in space
     * @return {boolean} true if p is in the area, false otherwise.
     */
    contains(_p) {
        throw "Error : contains is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  Return the minimum accuracy needed in the intersection of the sphere and the area.
     *  This function is a generic function used in both getNiceAcc and getRawAcc.
     *
     *  @param {AreaSphereParam}  _sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {number}  _factor  the ratio to determine the wanted accuracy.
     *                   Example : for an AreaScalisSeg, if thick0 is 1 and thick1 is 2, a sphere
     *                      centered at (p0+p1)/2 and of radius 0.2
     *                      will show its minimum accuracy at p0+0.3*unit_dir.
     *                      The linear interpolation of weights at this position
     *                      will give a wanted radius of 1.3
     *                      This function will return factor*1.3
     *  @return {number} the accuracy needed in the intersection zone, as a ratio of the linear variation
     *         of the radius along (this.p0,this.p1)
     */
    getAcc(_sphere, _factor) {
        throw "Error : getAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  Convenience function, just call getAcc with Nice Accuracy parameters.
     *  @param {AreaSphereParam} _sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(_sphere) {
        throw "Error : getNiceAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  Convenience function, just call getAcc with Current Accuracy parameters.
     *  @param {AreaSphereParam} _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Current accuracy needed in the intersection zone
     */
    getCurrAcc(_sphere) {
        throw "Error : getCurrAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  Convenience function, just call getAcc with Raw Accuracy parameters.
     *  @param {AreaSphereParam} _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The raw accuracy needed in the intersection zone
     */
    getRawAcc (_sphere) {
        throw "Error : getRawAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  @return {number} the minimum accuracy needed in the whole area
     */
    getMinAcc() {
        throw "Error : getRawAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  @return {number} the minimum raw accuracy needed in the whole area
     */
    getMinRawAcc() {
        throw "Error : getRawAcc is abstract, should have been overwritten";
    }

    /**
     *  @abstract
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param {string} _axis x, y or z
     *  @param {number} _t Coordinate on the axis
     *  @return {number} The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(_axis, _t) {
        console.error("Area.getAxisProjectionMinStep is a pure virtual function, please reimplement");
        return 1;
    }
}
var Area_1 = Area$4;

/**
 * Accuracies Contains the accuracies needed in Areas. Can be changed when importing blobtree.js.
 * For classic segments and sphere, we setteled for a raw accuracy being proportional to
 * the radii. 1/3 of the radius is considered nice, 1 radius is considered raw.
 * For new primitives, feel free to create your own accuracies factors depending on the features.
 */
var Accuracies$4 = {
    /**
     * Factor for the nice accuracy needed to represent the features nicely
     * @type {number}
     */
    nice: 0.3,
    /**
     * Factor for the raw accuracy needed to represent the features roughly
     * @type {number}
     */
    raw: 1.0,
    /**
     * Current accuracy factor, should be between Accuracies.nice and Accuracies.raw.
     * It will be the one used by rendering algorithms to decide to stop even if nice accuracy has not been reached.
     * @type {number}
     *
     */
    curr: 0.3
};

var Accuracies_1 = Accuracies$4;

const THREE$i = require$$0__default["default"];
const Area$3 = Area_1;
const Accuracies$3 = Accuracies_1;

/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */

/**
 *  AreaSphere is a general representation of a spherical area.
 *  See Primitive.getArea for more details.
 *
 *  @extends {Area}
 */
class AreaSphere$3 extends Area$3 {
    /**
     *  @param {!THREE.Vector3} p Point to locate the area
     *  @param {number} r Radius of the area
     *  @param {number=} accFactor Accuracy factor. By default SphereArea will use global Accuracies parameters. However, you can setup a accFactor.
     *                            to change that. You will usually want to have accFactor between 0 (excluded) and 1. Default to 1.0.
     *                            Be careful not to set it too small as it can increase the complexity of some algorithms up to the crashing point.
     */
    constructor(p, r, accFactor) {
        super();

        this.p = new THREE$i.Vector3(p.x, p.y, p.z);
        this.r = r;

        this.accFactor = accFactor || 1.0;
    }

    /**
     *  Test intersection of the shape with a sphere
     *  @return {boolean} true if the sphere and the area intersect
     *
     *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     */
    sphereIntersect = (function () {
        var v = new THREE$i.Vector3();
        return (sphere) => {
            /** @type {AreaSphere} */
            let self = this;

            v.subVectors(sphere.center, self.p);
            var tmp = sphere.radius + self.r;
            return v.lengthSq() < tmp * tmp;
        };
    })();

    /**
     * @link Area.contains for a complete description
     * @param {THREE.Vector3} p
     * @return {boolean}
     */
    contains = (function () {
        var v = new THREE$i.Vector3();
        /**
         *  @param {!THREE.Vector3} p A point in space, must comply to THREE.Vector3 API.
         *
         */
        return (p) => {
            /** @type {AreaSphere} */
            let self = this;

            v.subVectors(p, self.p);
            return v.lengthSq() < self.r * self.r;
        };
    })();

    /**
     *  @link Area.getAcc for a complete description
     *
     *  @return {number} the accuracy needed in the intersection zone
     *
     *  @param {AreaSphereParam} _sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {number}  factor  the ratio to determine the wanted accuracy.
     *
     */
    getAcc(_sphere, factor) {
        return this.r * factor;
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere) {
        return this.getAcc(sphere, Accuracies$3.nice * this.accFactor);
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere) {
        return this.getAcc(sphere, Accuracies$3.curr * this.accFactor);
    }

    /**
     *  @link Area.getRawAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere) {
        return this.getAcc(sphere, Accuracies$3.raw * this.accFactor);
    }

    /**
     * @link Area.getMinAcc
     * @return {number}
     */
    getMinAcc() {
        return Accuracies$3.curr * this.r * this.accFactor;
    }

    /**
     * @link Area.getMinRawAcc
     * @return {number}
     */
    getMinRawAcc() {
        return Accuracies$3.raw * this.r * this.accFactor;
    }

    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param {string} axis x, y or z
     *  @param {number} t Coordinate on the axis
     *  @return {number} The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis, t) {
        var step = 100000000;
        var diff = t - this.p[axis];
        if (diff < -2 * this.r) {
            step = Math.min(
                step,
                Math.max(
                    Math.abs(diff + this.r),
                    Accuracies$3.curr * this.r * this.accFactor
                )
            );
        } else if (diff < 2 * this.r) {
            step = Math.min(
                step,
                Accuracies$3.curr * this.r * this.accFactor
            );
        }// else the area is behind us
        return step;
    };
}

var AreaSphere_1 = AreaSphere$3;

const THREE$h = require$$0__default["default"];
const Types$c = Types_1;
const Material$7 = Material_1;
const ScalisPrimitive$2 = ScalisPrimitive_1;
const ScalisVertex$2 = ScalisVertex_1;
const ScalisMath$4 = ScalisMath_1;
const AreaSphere$2 = AreaSphere_1;

// AreaScalisPoint is deprecated since the more genreal AreaSphere is now supposed to do the job.
// Uncomment if you see any difference.
// const AreaScalisPoint = require("../areas/deprecated/AreaScalisPoint.js");

/** @typedef {import('../Element.js')} Element */
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./ScalisVertex').ScalisVertexJSON} ScalisVertexJSON */
/** @typedef {import('./ScalisPrimitive').ScalisPrimitiveJSON} ScalisPrimitiveJSON */

/**
 * @typedef {{density:number} & ScalisPrimitiveJSON} ScalisPointJSON
 */

class ScalisPoint$1 extends ScalisPrimitive$2  {

    static type = "ScalisPoint";

    /**
     * @param {ScalisPointJSON} json
     * @returns
     */
    static fromJSON(json) {
        var v = ScalisVertex$2.fromJSON(json.v[0]);
        var m = Material$7.fromJSON(json.materials[0]);
        return new ScalisPoint$1(v, json.volType, json.density, m);
    };

    /**
     *  @param {!ScalisVertex} vertex The vertex with point parameters.
     *  @param {string} volType The volume type wanted for this primitive.
     *                          Note : "convolution" does not make sens for a point, so technically,
     *                                 ScalisPrimitive.DIST or ScalisPrimitive.CONVOL will give the same results.
     *                                 However, since this may be a simple way of sorting for later blending,
     *                                 you can still choose between the 2 options.
     *  @param {number} density Implicit field density.
     *                          Gives afiner control of the created implicit field.
     *  @param {!Material} mat Material for the point
     */
    constructor(vertex, volType, density, mat) {
        super();

        this.v.push(vertex);
        this.v[0].setPrimitive(this);

        this.volType = volType;
        this.density = density;
        this.materials.push(mat);

        // Temporary for eval
        // TODO : should be wrapped in the eval function scope if possible (ie not precomputed)
        this.v_to_p = new THREE$h.Vector3();
    }

    getType() {
        return ScalisPoint$1.type;
    };

    toJSON() {
        return {
            ...super.toJSON(),
            density: this.density
        }
    };

    /**
     *  @param {number} d New density to set
     */
    setDensity(d) {
        this.density = d;
        this.invalidAABB();
    }

    /**
     *  @return {number} Current density
     */
    getDensity() {
        return this.density;
    }

    /**
     *  Set material for this point
     *  @param {!Material} m
     */
    setMaterial(m) {
        this.materials[0].copy(m);
        this.invalidAABB();
    }

    /**
     * @link Primitive.computeHelpVariables
     */
    computeHelpVariables() {
        this.computeAABB();
    }

    /**
     * @link Element.prepareForEval
     */
    prepareForEval() {
        if (!this.valid_aabb) {
            this.computeHelpVariables();
            this.valid_aabb = true;
        }
    };

    getAreas() {
        if (!this.valid_aabb) {
            console.error("ERROR : Cannot get area of invalid primitive");
            return [];
        } else {
            return [{
                aabb: this.aabb,
                bv: new AreaSphere$2(this.v[0].getPos(), ScalisMath$4.KS * this.v[0].getThickness(), ScalisMath$4.KIS),
                // AreaScalisPoint is deprecated and AreaSphere should be used instead. Uncomment if you notice accuracy issues.
                // bv: new AreaScalisPoint(this.v[0].getPos(),this.v[0].getThickness()),
                obj: this
            }];
        }
    };

    /**
     * @link Element.heuristicStepWithin
     * @return {number} The next step length to do with respect to this primitive/node.
     */
    heuristicStepWithin() {
        return this.v[0].getThickness() / 3;
    }

    /**
     *  @link Element.value
     *
     *  @param {THREE.Vector3} p Point where we want to evaluate the primitive field
     *  @param {ValueResultType} res
     */
    value(p, res) {
        if (!this.valid_aabb) {
            throw "Error : PrepareForEval should have been called";
        }

        var thickness = this.v[0].getThickness();

        // Eval itself
        this.v_to_p.subVectors(p, this.v[0].getPos());
        var r2 = this.v_to_p.lengthSq() / (thickness * thickness);
        var tmp = 1.0 - ScalisMath$4.KIS2 * r2;
        if (tmp > 0.0) {
            res.v = this.density * tmp * tmp * tmp * ScalisMath$4.Poly6NF0D;

            if (res.g) {
                // Gradient computation is easy since the
                // gradient is radial. We use the analitical solution
                // to directionnal gradient (differential in this.v_to_p length)
                var tmp2 = -this.density * ScalisMath$4.KIS2 * 6.0 * this.v_to_p.length() * tmp * tmp * ScalisMath$4.Poly6NF0D / (thickness * thickness);
                res.g.copy(this.v_to_p).normalize().multiplyScalar(tmp2);
            }
            if (res.m) { res.m.copy(this.materials[0]); }
        }
        else {
            res.v = 0.0;
            if (res.g) { res.g.set(0, 0, 0); }
            if (res.m) { res.m.copy(Material$7.defaultMaterial); }
        }

    }

    /**
     *  @param {THREE.Vector3} p
     *  @return {number}
     */
    distanceTo(p) {
        // return distance point/segment
        // don't take thickness into account
        return p.distanceTo(this.v[0].getPos());
        // return p.distanceTo(this.v[0].getPos()) - this.v[0].getThickness();
    }
}

Types$c.register(ScalisPoint$1.type, ScalisPoint$1);


var ScalisPoint_1 = ScalisPoint$1;

const THREE$g = require$$0__default["default"];
const ScalisMath$3 = ScalisMath_1;
const Area$2 = Area_1;
const Accuracies$2 = Accuracies_1;

/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */

/**
 *  Bounding area for the segment.
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *  The resulting volume is a clipped cone with spherical extremities, wich is
 *  actually the support of the primitive.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere fr now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 *  @extends {Area}
 *  @todo should be possible to replace with an AreaCapsule
 *
 */
class AreaScalisSeg$2 extends Area$2 {

    /**
     * @param {!THREE.Vector3} p0 first point of the shape
     * @param {!THREE.Vector3} p1 second point of the shape
     * @param {number} thick0 radius at p0
     * @param {number} thick1 radius at p1
     */
    constructor(p0, p1, thick0, thick1) {
        super();

        this.p0 = new THREE$g.Vector3(p0.x, p0.y, p0.z);
        this.p1 = new THREE$g.Vector3(p1.x, p1.y, p1.z);
        this.thick0 = thick0;
        this.thick1 = thick1;

        this.unit_dir = new THREE$g.Vector3().subVectors(p1, p0);
        this.length = this.unit_dir.length();
        this.unit_dir.normalize();

        // tmp var for functions below
        this.vector = new THREE$g.Vector3();
        this.p0_to_p = this.vector; // basically the same as above + smart name
        this.p0_to_p_sqrnorm = 0;
        this.x_p_2D = 0;
        this.y_p_2D = 0;
        this.y_p_2DSq = 0;
        this.ortho_vec_x = this.thick0 - this.thick1; // direction orthogonal to the "line" getting from one weight to the other. Precomputed
        this.ortho_vec_y = this.length;
        this.p_proj_x = 0;
        this.p_proj_y = 0;

        this.abs_diff_thick = Math.abs(this.ortho_vec_x);
    }

    /**
    * Compute some of the tmp variables.Used to factorized other functions code.
    * @param { !THREE.Vector3 } p A point as a THREE.Vector3
    *
    * @protected
    */
    proj_computation(p) {
        this.p0_to_p = this.vector;
        this.p0_to_p.subVectors(p, this.p0);
        this.p0_to_p_sqrnorm = this.p0_to_p.lengthSq();
        this.x_p_2D = this.p0_to_p.dot(this.unit_dir);
        // pythagore inc.
        this.y_p_2DSq = this.p0_to_p_sqrnorm - this.x_p_2D * this.x_p_2D;
        this.y_p_2D = this.y_p_2DSq > 0 ? Math.sqrt(this.y_p_2DSq) : 0; // because of rounded errors tmp can be <0 and this causes the next sqrt to return NaN...

        var t = -this.y_p_2D / this.ortho_vec_y;
        // P proj is the point at the intersection of:
        //              - the local X axis (computation in the unit_dir basis)
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        this.p_proj_x = this.x_p_2D + t * this.ortho_vec_x;
        this.p_proj_y = 0.0;
    }

    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @param {AreaSphereParam} sphere
     * @return {boolean} true if the sphere and the area intersect
     */
    sphereIntersect(sphere) {
        this.proj_computation(sphere.center);

        if (this.p_proj_x < 0.0) {
            return (Math.sqrt(this.p0_to_p_sqrnorm) - sphere.radius < this.thick0 * ScalisMath$3.KS);
        } else {
            if (this.p_proj_x > this.length) {
                this.vector.subVectors(sphere.center, this.p1);
                return (Math.sqrt(this.vector.lengthSq()) - sphere.radius < this.thick1 * ScalisMath$3.KS);
            } else {
                var sub1 = this.x_p_2D - this.p_proj_x;
                //var sub2 = this.y_p_2D-this.p_proj_y; //this.p_proj_y is set at 0 by definition
                //var dist = Math.sqrt(sub1*sub1 +this.y_p_2DSq);//sub2*sub2);
                var dist = sub1 * sub1 + this.y_p_2DSq;//sub2*sub2);
                var tt = this.p_proj_x / this.length;
                var inter_w = this.thick0 * (1.0 - tt) + tt * this.thick1;
                var tmp = sphere.radius + inter_w * ScalisMath$3.KS;
                //return (dist-sphere.radius < inter_w*ScalisMath.KS);
                return (dist < tmp * tmp);
            }
        }
    }

    /**
     * @link Area.contains for a complete description
     * @param {THREE.Vector3} p
     */
    contains(p) {
        this.proj_computation(p);
        // P proj is the point at the intersection of:
        //              - the X axis
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        if (this.p_proj_x < 0.0) {
            // Proj is before the line segment beginning defined by P0: spherical containment
            return this.p0_to_p_sqrnorm < this.thick0 * this.thick0 * ScalisMath$3.KS2;
        } else {
            if (this.p_proj_x > this.length) {
                // Proj is after the line segment beginning defined by P1: spherical containment
                this.vector.subVectors(p, this.p1);
                return this.vector.lengthSq() < this.thick1 * this.thick1 * ScalisMath$3.KS2;
            } else {
                // Proj is in between the line segment P1-P0: Linear kind of containment
                var sub1 = this.x_p_2D - this.p_proj_x;
                var sub2 = this.y_p_2D - this.p_proj_y;
                var dist2 = sub1 * sub1 + sub2 * sub2;
                var tt = this.p_proj_x / this.length;
                var inter_w = this.thick0 * (1.0 - tt) + tt * this.thick1;
                return dist2 < inter_w * inter_w * ScalisMath$3.KS2;
            }
        }
    };

    /**
     *  @link Area.getAcc for a complete description
     *
     *  @return {number} the accuracy needed in the intersection zone
     *
     *  @param {AreaSphereParam} sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {number}  factor  the ratio to determine the wanted accuracy.
     *
     *  @todo Check the Maths
     */
    getAcc(sphere, factor) {
        this.proj_computation(sphere.center);
        /*
            // Following is a modified bit that improves acc computation outside of segments.
            // However, it appears that we are losing some quality in the models
            // (as the other computation gives a lower min acc bound by design)
            // TODO: decide if we uncomment or delete this

            // Get the point at the intersection of the line defined by the center of the sphere and of vector dir orthovec
            // and the weight line going through (0,thick0)  and orthogonal to orthovec
            var t = (thick0*this.ortho_vec_y - this.p_proj_x*this.ortho_vec_x)/(this.ortho_vec_x*this.ortho_vec_x+this.ortho_vec_y*this.ortho_vec_y);
            var inter_proj_x = this.p_proj_x +t*this.ortho_vec_x;
            var inter_proj_y = t*this.ortho_vec_y;
            // If inside the min acc is found according to the sphere normal radius
            var newR = sphere.radius;
            if (this.y_p_2D > inter_proj_y){
                // If we are outside the segment, the sphere intersection with the weight line is computed
                var sub1 = this.x_p_2D-inter_proj_x;
                var sub2 = this.y_p_2D-inter_proj_y;
                var dist = Math.sqrt(sub1*sub1 +sub2*sub2);
                // Pythagore this
                newR = Math.sqrt(sphere.radius*sphere.radius-dist*dist);
            }
            var tmp = this.abs_diff_thick/this.length;
            var half_delta = newR*Math.sqrt(1+tmp*tmp)*0.5;
        */
        // Thales between two triangles that have the same angles gives us the dist of:
        // side A = sphere.radius*this.abs_diff_thick/this.length;
        // Then pythagore this shit up as A² + sphere.radius² = delta²
        // i.e delta² = (sphere.radius*this.abs_diff_thick/this.length)² + sphere.radius²
        // <=> delta = sphere.radius*Math.sqrt(1+(this.abs_diff_thick/this.length)²);

        var tmp = this.abs_diff_thick / this.length;
        var half_delta = sphere.radius * Math.sqrt(1 + tmp * tmp) * 0.5;

        // we check only the direction where the weight is minimum since
        // we will return minimum accuracy needed in the area.
        var absc = this.p_proj_x;
        absc += this.thick0 > this.thick1 ? half_delta : -half_delta;

        if (absc < 0.0) {
            return this.thick0 * factor;
        } else if (absc > this.length) {
            return this.thick1 * factor;
        } else {

            var tt = absc / this.length;
            var inter_w = this.thick0 * (1.0 - tt) + tt * this.thick1;
            return inter_w * factor;
        }
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere) {
        return this.getAcc(sphere, Accuracies$2.nice);
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Curr accuracy needed in the intersection zone
     */
    getCurrAcc = function (sphere) {
        return this.getAcc(sphere, Accuracies$2.curr);
    }

    /**
     *  @link Area.getRawAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere) {
        return this.getAcc(sphere, Accuracies$2.raw);
    }

    /**
     * @link Area.getMinAcc
     * @return {number}
     */
    getMinAcc() {
        return Accuracies$2.curr * Math.min(this.thick0, this.thick1);
    }

    /**
     * @link Area.getMinRawAcc
     * @return {number}
     */
    getMinRawAcc() {
        return Accuracies$2.raw * Math.min(this.thick0, this.thick1);
    }

    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param {string} axis x, y or z
     *  @param {number} t Coordinate on the axis
     *  @return {number} The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis, t) {
        var step = Number.MAX_VALUE;
        var p0 = this.p0[axis] < this.p1[axis] ? this.p0 : this.p1;
        var p1, thick0, thick1;
        if (p0 === this.p0) {
            p1 = this.p1;
            thick0 = this.thick0;
            thick1 = this.thick1;
        } else {
            p1 = this.p0;
            thick0 = this.thick1;
            thick1 = this.thick0;
        }

        var diff = t - p0[axis];
        if (diff < -2 * thick0) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * thick0), Accuracies$2.curr * thick0));
        } else if (diff < 2 * thick0) {
            step = Math.min(step, Accuracies$2.curr * thick0);
        }// else the vertex is behind us
        diff = t - p1[axis];
        if (diff < -2 * thick1) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * thick1), Accuracies$2.curr * thick1));
        } else if (diff < 2 * thick1) {
            step = Math.min(step, Accuracies$2.curr * thick1);
        }// else the vertex is behind us

        var tbis = t - p0[axis];
        var axis_l = p1[axis] - p0[axis];
        if (tbis > 0 && tbis < axis_l && axis_l !== 0) {
            // t is in p0p1
            step = Math.min(step, Accuracies$2.curr * (thick0 + (tbis / axis_l) * (thick1 - thick0)));
        }

        return step;
    }
}



var AreaScalisSeg_1 = AreaScalisSeg$2;

const THREE$f = require$$0__default["default"];
const Types$b = Types_1;
const Material$6 = Material_1;
const ScalisPrimitive$1 = ScalisPrimitive_1;
const ScalisVertex$1 = ScalisVertex_1;
const ScalisMath$2 = ScalisMath_1;
const AreaScalisSeg$1 = AreaScalisSeg_1;

/** @typedef {import('./ScalisPrimitive').ScalisPrimitiveJSON} ScalisPrimitiveJSON */

/**
 * @typedef {{density:number} & ScalisPrimitiveJSON} ScalisSegmentJSON
 */

/**
 *  Implicit segment class in the blobtree.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
class ScalisSegment$1 extends ScalisPrimitive$1 {

    static type = "ScalisSegment";

    /**
     * @param {ScalisSegmentJSON} json
     * @returns {ScalisSegment}
     */
    static fromJSON(json) {
        var v0 = ScalisVertex$1.fromJSON(json.v[0]);
        var v1 = ScalisVertex$1.fromJSON(json.v[1]);
        var m = [
            Material$6.fromJSON(json.materials[0]),
            Material$6.fromJSON(json.materials[1])
        ];
        return new ScalisSegment$1(v0, v1, json.volType, json.density, m);
    };

    /**
     *  @param {!ScalisVertex} v0 First vertex for the segment
     *  @param {!ScalisVertex} v1 Second vertex for the segment
     *  @param {!string} volType Volume type, can be ScalisPrimitive.CONVOL
     *                 (homothetic convolution surfaces, Zanni and al), or
     *                 ScalisPrimitive.DIST (classic weighted distance field)
     *  @param {number} density Density is another constant to modulate the implicit
     *                  field. Used only for DIST voltype.
     *  @param {!Array.<Material>} mats Material for this primitive.
     *                                  Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
     *
     */
    constructor(v0, v1, volType, density, mats) {
        super();

        this.v.length = 2;
        this.v[0] = v0;
        this.v[1] = v1;
        v0.setPrimitive(this);
        v1.setPrimitive(this);

        this.volType = volType;
        this.density = density;
        this.materials = mats;

        // Temporary for eval
        // TODO : should be wrapped in the eval function scope if possible (ie not precomputed)
        // CONVOL
        this.clipped_l1 = 1.0;
        this.clipped_l2 = 0.0;
        this.vector = new THREE$f.Vector3();
        this.cycle = new THREE$f.Vector3();
        this.proj = new THREE$f.Vector3();
        // helper attributes
        this.v0_p = this.v[0].getPos();
        this.v1_p = this.v[1].getPos(); // this one is probably useless to be kept for eval since not used....
        this.dir = new THREE$f.Vector3();
        this.lengthSq = 0;
        this.length = 0;
        this.unit_dir = new THREE$f.Vector3();
        // weight_p1 is convol's weight_p2 ( >_< )
        this.weight_p1 = 0;
        // c0 and c1 are convol's weight_coeff
        this.c0 = 0;
        this.c1 = 0;

        this.increase_unit_dir = new THREE$f.Vector3();
        this.p_min = new THREE$f.Vector3();
        this.weight_min = 0;
        this.inv_weight_min = 0;
        this.unit_delta_weight = 0;

        this.maxbound = 0;
        this.maxboundSq = 0;
        this.cyl_bd0 = 0;
        this.cyl_bd1 = 0;
        this.f0f1f2 = new THREE$f.Vector3();

        this.tmpVec1 = new THREE$f.Vector3();
        this.tmpVec2 = new THREE$f.Vector3();

        this.computeHelpVariables();
    }

    getType() {
        return ScalisSegment$1.type;
    };

    /**
     * @returns {ScalisSegmentJSON}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            density: this.density
        };
    };

    mutableVolType() {
        return true;
    };

    /**
     *  @param {number} d The new density
     */
    setDensity(d) {
        this.density = d;
        this.invalidAABB();
    };

    /**
     *  @return {number} The current density
     */
    getDensity() {
        return this.density;
    };

    // [Abstract] See Primitive.setVolType for more details
    setVolType(vt) {
        if (!(vt == ScalisPrimitive$1.CONVOL || vt == ScalisPrimitive$1.DIST)) {
            throw "ERROR : volType must be set to ScalisPrimitive.CONVOL or ScalisPrimitive.DIST";
        }

        if (this.volType != vt) {
            this.volType = vt;
            this.invalidAABB();
        }
    };

    // [Abstract] See Primitive.getVolType for more details
    getVolType() {
        return this.volType;
    };

    // [Abstract] See Primitive.prepareForEval for more details
    prepareForEval() {
        if (!this.valid_aabb) {
            this.computeHelpVariables();
            this.valid_aabb = true;
        }
    };

    // [Abstract] See Primtive.getArea for more details
    getAreas() {
        if (!this.valid_aabb) {
            console.error("ERROR : Cannot get area of invalid primitive");
            return [];
        } else {
            return [{
                aabb: this.aabb,
                //new THREE.Box3(-256, -256, -256, 256,256,256),
                //new THREE.Box3(this.aabb.min_x-min_thick,this.aabb.min_y-min_thick,this.aabb.min_z-min_thick,
                //this.aabb.max_x+min_thick,this.aabb.max_y+min_thick,this.aabb.max_z+min_thick),
                bv: new AreaScalisSeg$1(
                    this.v[0].getPos(),
                    this.v[1].getPos(),
                    this.v[0].getThickness(),
                    this.v[1].getThickness()
                ),
                obj: this
            }];
        }
    };

    // [Abstract] See Primitive.computeHelpVariables for more details
    computeHelpVariables() {
        this.v0_p = this.v[0].getPos();
        this.v1_p = this.v[1].getPos(); // this one is probably useless to be kept for eval since not used....

        this.dir.subVectors(this.v1_p, this.v0_p);
        this.lengthSq = this.dir.lengthSq();
        this.length = Math.sqrt(this.lengthSq);
        this.unit_dir.copy(this.dir).normalize();

        this.weight_p1 = this.v[1].getThickness();
        this.c0 = this.v[0].getThickness();
        this.c1 = this.v[1].getThickness() - this.v[0].getThickness();

        // Bounding property
        // bounding box is axis aligned so the bounding is not very tight.
        var bound_supp0 = this.v[0].getThickness() * ScalisMath$2.KS;
        var bound_supp1 = this.v[1].getThickness() * ScalisMath$2.KS;

        this.maxbound = Math.max(bound_supp0, bound_supp1);
        this.maxboundSq = this.maxbound * this.maxbound;

        // Speed up var for cylinder bounding
        // Used only in evalConvol
        this.cyl_bd0 = Math.min(-bound_supp0, this.length - bound_supp1);
        this.cyl_bd1 = Math.max(this.length + bound_supp1, bound_supp0);

        this.increase_unit_dir.copy(this.unit_dir);
        // weight help variables
        if (this.c1 < 0) {
            this.p_min.copy(this.v1_p);
            this.weight_min = this.weight_p1;
            this.inv_weight_min = 1 / this.weight_p1;
            this.increase_unit_dir.negate();
            this.unit_delta_weight = -this.c1 / this.length;
        }
        else {
            this.p_min.copy(this.v0_p);
            // weight_p0 is c0
            this.weight_min = this.c0;
            this.inv_weight_min = 1 / this.c0;
            this.unit_delta_weight = this.c1 / this.length;
        }

        this.computeAABB();
    };

    // [Abstract] See Primitive.value for more details
    value(p, res) {
        switch (this.volType) {
            case ScalisPrimitive$1.DIST:
                this.evalDist(p, res);
                break;
            case ScalisPrimitive$1.CONVOL:
                this.evalConvol(p, res);
                break;
            default:
                throw "Unknown volType, cannot evaluate.";
        }
    };

    ///////////////////////////////////////////////////////////////////////////
    // Distance Evaluation functions and auxiliaary functions
    // Note : for the mech primitive we use a CompactPolynomial6 kernel.
    //        TODO : the orga should use the same for better smoothness

    /**
     *  value function for Distance volume type (distance field).
     */
    evalDist = (function () {
        var ev_eps = { v: 0 };
        var p_eps = new THREE$f.Vector3();
        return function (p, res) {

            var p0_to_p = this.vector;
            p0_to_p.subVectors(p, this.v[0].getPos());

            // Documentation : see DistanceHomothetic.pdf in convol/Documentation/Convol-Core/
            var orig_p_scal_dir = p0_to_p.dot(this.dir);
            var orig_p_sqr = p0_to_p.lengthSq();

            var denum = this.lengthSq * this.c0 + orig_p_scal_dir * this.c1;
            var t = (this.c1 < 0) ? 0 : 1;
            if (denum > 0.0) {
                t = orig_p_scal_dir * this.c0 + orig_p_sqr * this.c1;
                t = (t < 0.0) ? 0.0 : ((t > denum) ? 1.0 : t / denum); // clipping (nearest point on segment not line)
            }

            // Optim the below code... But keep the old code it's more understandable
            var proj_p_l = Math.sqrt(t * (t * this.lengthSq - 2 * orig_p_scal_dir) + orig_p_sqr);
            //var proj_to_point = this.proj;
            //proj_to_point.set(
            //    t*this.dir.x - p0_to_p.x,
            //    t*this.dir.y - p0_to_p.y,
            //    t*this.dir.z - p0_to_p.z
            //);
            //var proj_p_l = proj_to_point.length();

            var weight_proj = this.c0 + t * this.c1;
            res.v = this.density * ScalisMath$2.Poly6Eval(proj_p_l / weight_proj) * ScalisMath$2.Poly6NF0D;

            ///////////////////////////////////////////////////////////////////////
            // Material computation : by orthogonal projection
            if (res.m) {
                this.evalMat(p, res);
            }

            // IMPORTANT NOTE :
            // We should use an analytical gradient here. It should be possible to
            // compute.
            if (res.g) {
                var epsilon = 0.00001;
                var d_over_eps = this.density / epsilon;
                p_eps.copy(p);
                p_eps.x += epsilon;
                this.evalDist(p_eps, ev_eps);
                res.g.x = d_over_eps * (ev_eps.v - res.v);
                p_eps.x -= epsilon;

                p_eps.y += epsilon;
                this.evalDist(p_eps, ev_eps);
                res.g.y = d_over_eps * (ev_eps.v - res.v);
                p_eps.y -= epsilon;

                p_eps.z += epsilon;
                this.evalDist(p_eps, ev_eps);
                res.g.z = d_over_eps * (ev_eps.v - res.v);
            }
        };
    })();

/**
 *
 * @param {THREE.Vector3} p Evaluation point
 * @param {Object} res Resulting material will be in res.m
 */
    evalMat(p, res) {
        var p0_to_p = this.vector;
        p0_to_p.subVectors(p, this.v[0].getPos());
        var udir_dot = this.unit_dir.dot(p0_to_p);
        var s = (udir_dot / this.length);

        // Material interpolation
        if (s > 1.0) {
            res.m.copy(this.materials[1]);
        }
        else {
            if (s <= 0.0) {
                res.m.copy(this.materials[0]);
            }
            else {
                // (1-s)*m0 + s*m1
                res.m.copy(this.materials[0]);
                res.m.lerp(this.materials[1], s);
            }
        }
    };

/**
 *  @param {!THREE.Vector3} w special_coeff
 *  @return {boolean}
 */
    HomotheticClippingSpecial(w) {
        // we search solution t \in [0,1] such that at^2-2bt+c<=0
        var a = -w.z;
        var b = -w.y;
        var c = -w.x;

        var delta = b * b - a * c;
        if (delta >= 0.0) {
            var b_p_sqrt_delta = b + Math.sqrt(delta);
            if ((b_p_sqrt_delta < 0.0) || (this.length * b_p_sqrt_delta < c)) {
                return false;
            }
            else {
                var main_root = c / b_p_sqrt_delta;
                this.clipped_l1 = (main_root < 0.0) ? 0.0 : main_root;
                var a_r = a * main_root;
                this.clipped_l2 = (2.0 * b < a_r + a * this.length) ? c / (a_r) : this.length;
                return true;
            }
        }
        return false;
    };

// [Abstract] see ScalisPrimitive.heuristicStepWithin
    heuristicStepWithin() {
        return this.weight_min / 3;
    };

///////////////////////////////////////////////////////////////////////////
// Convolution Evaluation functions and auxiliaary functions
/**
 *  value function for Convol volume type (Homothetic convolution).
 */
    evalConvol(p, res) {
        if (!this.valid_aabb) {
            throw "Error : prepareForEval should have been called";
        }
        // init
        if (res.g)
            res.g.set(0, 0, 0);
        res.v = 0;

        var p_min_to_point = this.tmpVec1;
        p_min_to_point.subVectors(p, this.p_min);

        var uv = this.increase_unit_dir.dot(p_min_to_point);
        var d2 = p_min_to_point.lengthSq();

        var special_coeff = this.tmpVec2;
        special_coeff.set(
            this.weight_min * this.weight_min - ScalisMath$2.KIS2 * d2,
            -this.unit_delta_weight * this.weight_min - ScalisMath$2.KIS2 * uv,
            this.unit_delta_weight * this.unit_delta_weight - ScalisMath$2.KIS2);

        // clipped_l1, clipped_l2 are members of segment
        if (this.HomotheticClippingSpecial(special_coeff)) {
            var inv_local_min_weight = 1.0 / (this.weight_min + this.clipped_l1 * this.unit_delta_weight);
            special_coeff.x = 1.0 - ScalisMath$2.KIS2 * (this.clipped_l1 * (this.clipped_l1 - 2.0 * uv) + d2) * inv_local_min_weight * inv_local_min_weight;
            special_coeff.y = - this.unit_delta_weight - ScalisMath$2.KIS2 * (uv - this.clipped_l1) * inv_local_min_weight;

            if (res.g) //both grad and value
            {
                if (this.unit_delta_weight >= 0.06) { // ensure a maximum relative error of ??? (for degree i up to 8)
                    this.HomotheticCompactPolynomial_segment_FGradF_i6((this.clipped_l2 - this.clipped_l1) *
                        inv_local_min_weight,
                        this.unit_delta_weight,
                        special_coeff);
                } else {
                    this.HomotheticCompactPolynomial_approx_segment_FGradF_i6((this.clipped_l2 - this.clipped_l1) *
                        inv_local_min_weight,
                        this.unit_delta_weight,
                        this.inv_weight_min,
                        special_coeff);
                }


                res.v = ScalisMath$2.Poly6NF1D * this.f0f1f2.x;
                this.f0f1f2.y *= inv_local_min_weight;
                res.g
                    .copy(this.increase_unit_dir)
                    .multiplyScalar(this.f0f1f2.z + this.clipped_l1 * this.f0f1f2.y)
                    .sub(p_min_to_point.multiplyScalar(this.f0f1f2.y))
                    .multiplyScalar(ScalisMath$2.Poly6NF1D * 6.0 * ScalisMath$2.KIS2 * inv_local_min_weight);
            }
            else //value only
            {
                if (this.unit_delta_weight >= 0.06) { // ensure a maximum relative error of ??? (for degree i up to 8)
                    res.v = ScalisMath$2.Poly6NF1D *
                        this.HomotheticCompactPolynomial_segment_F_i6((this.clipped_l2 - this.clipped_l1) *
                            inv_local_min_weight,
                            this.unit_delta_weight,
                            special_coeff);
                } else {
                    res.v = ScalisMath$2.Poly6NF1D *
                        this.HomotheticCompactPolynomial_approx_segment_F_i6((this.clipped_l2 - this.clipped_l1) *
                            inv_local_min_weight,
                            this.unit_delta_weight,
                            inv_local_min_weight,
                            special_coeff);
                }
            }

            if (res.m) {
                this.evalMat(p, res);
            }
        }
    };

/**
 *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
 *  @param {number} a
 *  @param {number} b
 *  @param {number} c
 *  @return {number} Clamped value
 *  Author: Jakub Korzeniowski
 *  Agency: Softhis
 *  http://www.softhis.com
 */
    clamp(a, b, c) { return Math.max(b, Math.min(c, a)); };

// [Abstract] see ScalisPrimitive.distanceTo
    distanceTo = (function() {
        var tmpVector = new THREE$f.Vector3();
        var tmpVectorProj = new THREE$f.Vector3();
        return function (p) {
            /** @type {ScalisSegment} */
            let self = this;
            // var thickness = Math.min(this.c0,this.c0+this.c1);

            // return distance point/segment
            // don't take thickness into account
            var t = tmpVector.subVectors(p, self.v[0].getPos())
                .dot(self.dir) / self.lengthSq;

            // clamp is our own function declared there
            t = self.clamp(t, 0, 1);
            tmpVectorProj.copy(self.dir)
                .multiplyScalar(t)
                .add(self.v[0].getPos());
            return p.distanceTo(tmpVectorProj);
        };
    })();

/**
 *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
 *  Function designed by Cedric Zanni, optimized for C++ using matlab.
 *  @param {number} l
 *  @param {number} d
 *  @param {!Object} w
 *  @return {number} the value
 */
    HomotheticCompactPolynomial_segment_F_i6(l, d, w) {
        var t6247 = d * l + 0.1e1;
        var t6241 = 0.1e1 / t6247;
        var t6263 = t6247 * t6247;
        var t2 = t6263 * t6263;
        var t6244 = 0.1e1 / t2;
        var t6252 = w.y;
        var t6249 = t6252 * t6252;
        var t6273 = 0.12e2 * t6249;
        var t6258 = 0.1e1 / d;
        var t6271 = t6252 * t6258;
        var t6264 = t6247 * t6263;
        var t6257 = l * l;
        var t6260 = t6257 * t6257;
        var t6259 = l * t6257;
        var t6254 = l * t6260;
        var t6253 = w.x;
        var t6251 = w.z;
        var t6250 = t6253 * t6253;
        var t6248 = t6251 * t6251;
        var t3 = t6264 * t6264;
        var t6246 = 0.1e1 / t3;
        var t6245 = t6241 * t6244;
        var t6243 = 0.1e1 / t6264;
        var t6242 = 0.1e1 / t6263;
        var t71 = Math.log(t6247);
        var t93 = t6259 * t6259;
        return -t6248 * (((((-(t6241 - 0.1e1) * t6258 - l * t6242) * t6258 - t6257 * t6243) * t6258 - t6259 * t6244) * t6258 - t6260 * t6245) * t6258 - t6254 * t6246) * t6271 + (-t6253 * (t6246 - 0.1e1) * t6258 / 0.6e1 - (-(t6245 - 0.1e1) * t6258 / 0.5e1 - l * t6246) * t6271) * t6250 + ((t6253 * t6273 + 0.3e1 * t6251 * t6250) * (0.2e1 / 0.5e1 * (-(t6244 - 0.1e1) * t6258 / 0.4e1 - l * t6245) * t6258 - t6257 * t6246) + (0.3e1 * t6248 * t6253 + t6251 * t6273) * (0.4e1 / 0.5e1 * (0.3e1 / 0.4e1 * (0.2e1 / 0.3e1 * (-(t6242 - 0.1e1) * t6258 / 0.2e1 - l * t6243) * t6258 - t6257 * t6244) * t6258 - t6259 * t6245) * t6258 - t6260 * t6246) + t6251 * t6248 * (0.6e1 / 0.5e1 * (0.5e1 / 0.4e1 * (0.4e1 / 0.3e1 * (0.3e1 / 0.2e1 * (0.2e1 * (t71 * t6258 - l * t6241) * t6258 - t6257 * t6242) * t6258 - t6259 * t6243) * t6258 - t6260 * t6244) * t6258 - t6254 * t6245) * t6258 - t93 * t6246) + (-0.12e2 * t6251 * t6253 - 0.8e1 * t6249) * (0.3e1 / 0.5e1 * ((-(t6243 - 0.1e1) * t6258 / 0.3e1 - l * t6244) * t6258 / 0.2e1 - t6257 * t6245) * t6258 - t6259 * t6246) * t6252) * t6258 / 0.6e1;
    };

/**
 *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).
 *  (Approximation? Faster?).
 *  Function designed by Cedric Zanni, optimized for C++ using matlab.
 *  @param {number} l
 *  @param {number} d
 *  @param {number} q
 *  @param {!Object} w
 */
    HomotheticCompactPolynomial_approx_segment_F_i6(l, d, q, w) {
        var t6386 = q * d;
        var t6361 = t6386 + 0.1e1;
        var t6387 = 0.1e1 / t6361;
        var t1 = t6361 * t6361;
        var t2 = t1 * t1;
        var t6359 = t6387 / t2 / t1;
        var t6363 = w.z;
        var t6364 = w.y;
        var t6365 = w.x;
        var t6366 = l * l;
        var t6356 = t6363 * t6366 - 0.2e1 * t6364 * l + t6365;
        var t9 = t6364 * t6364;
        var t6357 = t6363 * t6365 - t9;
        var t6358 = t6363 * l - t6364;
        var t6377 = t6365 * t6365;
        var t6381 = t6364 * t6377;
        var t6369 = t6356 * t6356;
        var t6383 = t6358 * t6369;
        var t6362 = 0.1e1 / t6363;
        var t6384 = t6357 * t6362;
        var t6385 = 0.6e1 / 0.35e2 * (0.4e1 / 0.3e1 * (0.2e1 * t6357 * l + t6358 * t6356 + t6364 * t6365) * t6384 + t6383 + t6381) * t6384 + t6356 * t6383 / 0.7e1 + t6365 * t6381 / 0.7e1;
        var t6380 = t6362 * t6385;
        var t6360 = t6387 * t6359;
        var t6355 = t6369 * t6369;
        var t27 = t6377 * t6377;
        var t6353 = t6364 * t6380 + t6355 / 0.8e1 - t27 / 0.8e1;
        // eslint-disable-next-line no-loss-of-precision
        var t6352 = -l * t6355 + (-0.10e2 * t6364 * t6353 + t6365 * t6385) * t6362;
        var t65 = q * q;
        return t6380 - 0.7e1 * d * t6353 * t6362 + (-0.1111111111e0 * (0.3e1 * t6359 - 0.300e1 + 0.7e1 * (0.2e1 + t6360) * t6386) * t6352 - 0.1000000000e0 * (0.2e1 - 0.200e1 * t6359 - 0.7e1 * (0.1e1 + t6360) * t6386) / q * (-0.1e1 * t6366 * t6355 + (0.1333333333e1 * t6364 * t6352 + 0.2e1 * t6365 * t6353) * t6362)) * t6362 / t65;
    };

/**
 *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
 *  Function designed by Cedric Zanni, optimized for C++ using matlab.
 *  Result is stored in this.f0f1f2
 *  @param {number} l
 *  @param {number} d
 *  @param {!Object} w
 *
 */
    HomotheticCompactPolynomial_segment_FGradF_i6(l, d, w) {
        var t6320 = d * l + 0.1e1;
        var t6314 = 0.1e1 / t6320;
        var t6336 = t6320 * t6320;
        var t2 = t6336 * t6336;
        var t6317 = 0.1e1 / t2;
        var t6325 = w.y;
        var t6322 = t6325 * t6325;
        var t6351 = 0.2e1 * t6322;
        var t6324 = w.z;
        var t6326 = w.x;
        var t6350 = t6324 * t6326 / 0.3e1 + 0.2e1 / 0.3e1 * t6322;
        var t6321 = t6324 * t6324;
        var t6349 = t6321 / 0.6e1;
        var t6348 = -0.2e1 / 0.3e1 * t6324;
        var t6337 = t6320 * t6336;
        var t6316 = 0.1e1 / t6337;
        var t6318 = t6314 * t6317;
        var t7 = t6337 * t6337;
        var t6319 = 0.1e1 / t7;
        var t6330 = l * l;
        var t6331 = 0.1e1 / d;
        var t6332 = l * t6330;
        var t6309 = 0.3e1 / 0.5e1 * ((-(t6316 - 0.1e1) * t6331 / 0.3e1 - l * t6317) * t6331 / 0.2e1 - t6330 * t6318) * t6331 - t6332 * t6319;
        var t6347 = t6309 * t6325;
        var t6311 = -(t6318 - 0.1e1) * t6331 / 0.5e1 - l * t6319;
        var t6323 = t6326 * t6326;
        var t6346 = t6323 * t6311;
        var t6310 = 0.2e1 / 0.5e1 * (-(t6317 - 0.1e1) * t6331 / 0.4e1 - l * t6318) * t6331 - t6330 * t6319;
        var t6345 = t6326 * t6310;
        var t6344 = -t6323 * (t6319 - 0.1e1) / 0.6e1;
        var t6333 = t6330 * t6330;
        var t6327 = l * t6333;
        var t6315 = 0.1e1 / t6336;
        var t6308 = 0.4e1 / 0.5e1 * (0.3e1 / 0.4e1 * (0.2e1 / 0.3e1 * (-(t6315 - 0.1e1) * t6331 / 0.2e1 - l * t6316) * t6331 - t6330 * t6317) * t6331 - t6332 * t6318) * t6331 - t6333 * t6319;
        var t6307 = ((((-(t6314 - 0.1e1) * t6331 - l * t6315) * t6331 - t6330 * t6316) * t6331 - t6332 * t6317) * t6331 - t6333 * t6318) * t6331 - t6327 * t6319;
        var t81 = t6332 * t6332;
        var t92 = Math.log(t6320);
        this.f0f1f2.x = (t6326 * t6344 - t6325 * t6346 + t6345 * t6351 - 0.4e1 / 0.3e1 * t6322 * t6347 + (t6323 * t6310 / 0.2e1 + t6308 * t6351 - 0.2e1 * t6326 * t6347) * t6324 + (t6326 * t6308 / 0.2e1 - t6325 * t6307 + (-t81 * t6319 / 0.6e1 + (-t6327 * t6318 / 0.5e1 + (-t6333 * t6317 / 0.4e1 + (-t6332 * t6316 / 0.3e1 + (-t6330 * t6315 / 0.2e1 + (t92 * t6331 - l * t6314) * t6331) * t6331) * t6331) * t6331) * t6331) * t6324) * t6321) * t6331;
        this.f0f1f2.y = (t6344 + t6310 * t6350 + t6308 * t6349 + (-0.2e1 / 0.3e1 * t6326 * t6311 + t6309 * t6348) * t6325) * t6331;
        this.f0f1f2.z = (t6346 / 0.6e1 + t6309 * t6350 + t6307 * t6349 + (-0.2e1 / 0.3e1 * t6345 + t6308 * t6348) * t6325) * t6331;
    };

/**
 *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
 *  Function designed by Cedric Zanni, optimized for C++ using matlab.
 *  Result is stored in this.f0f1f2
 *  @param {number} l
 *  @param {number} d
 *  @param {!Object} w
 */
    HomotheticCompactPolynomial_approx_segment_FGradF_i6(l, d, q, w) {
        var t6478 = q * d;
        var t6443 = t6478 + 0.1e1;
        var t6479 = 0.1e1 / t6443;
        var t1 = q * q;
        var t6449 = 0.1e1 / t1;
        var t2 = t6443 * t6443;
        var t3 = t2 * t2;
        var t6441 = t6479 / t3 / t2;
        var t6448 = w.x;
        var t6477 = 0.2e1 * t6448;
        var t6446 = w.z;
        var t6444 = 0.1e1 / t6446;
        var t6476 = d * t6444;
        var t6447 = w.y;
        var t6451 = l * l;
        var t6438 = t6446 * t6451 - 0.2e1 * t6447 * l + t6448;
        var t6455 = t6438 * t6438;
        var t6437 = t6438 * t6455;
        var t6463 = t6448 * t6448;
        var t6445 = t6448 * t6463;
        var t10 = t6447 * t6447;
        var t6439 = t6446 * t6448 - t10;
        var t6440 = t6446 * l - t6447;
        var t6470 = t6439 * t6444;
        var t6433 = 0.4e1 / 0.3e1 * (0.2e1 * t6439 * l + t6440 * t6438 + t6447 * t6448) * t6470 + t6440 * t6455 + t6447 * t6463;
        var t6473 = t6433 / 0.5e1;
        var t6432 = t6447 * t6444 * t6473 + t6437 / 0.6e1 - t6445 / 0.6e1;
        var t6429 = -l * t6437 + (-0.8e1 * t6447 * t6432 + t6448 * t6473) * t6444;
        var t6469 = t6451 * t6437;
        // eslint-disable-next-line no-loss-of-precision
        var t6427 = -t6469 + (0.10e2 / 0.7e1 * t6447 * t6429 + t6432 * t6477) * t6444;
        var t6475 = -t6427 / 0.8e1;
        var t6474 = 0.6e1 / 0.35e2 * t6433 * t6470 + t6440 * t6437 / 0.7e1 + t6447 * t6445 / 0.7e1;
        var t6442 = t6479 * t6441;
        var t6472 = (0.3e1 * t6441 - 0.300e1 + 0.7e1 * (0.2e1 + t6442) * t6478) * t6449;
        var t6471 = (0.2e1 - 0.200e1 * t6441 - 0.7e1 * (0.1e1 + t6442) * t6478) / q * t6449;
        var t6468 = t6444 * t6472;
        var t6467 = t6444 * t6471;
        var t6466 = t6444 * t6474;
        var t6436 = t6455 * t6455;
        var t57 = t6463 * t6463;
        var t6430 = t6447 * t6466 + t6436 / 0.8e1 - t57 / 0.8e1;
        // eslint-disable-next-line no-loss-of-precision
        var t6428 = -l * t6436 + (-0.10e2 * t6447 * t6430 + t6448 * t6474) * t6444;
        // eslint-disable-next-line no-loss-of-precision
        this.f0f1f2.x = t6466 - 0.7e1 * t6430 * t6476 - t6428 * t6468 / 0.9e1 - (-t6451 * t6436 + (0.4e1 / 0.3e1 * t6447 * t6428 + t6430 * t6477) * t6444) * t6467 / 0.10e2;
        this.f0f1f2.y = (t6473 - 0.7e1 * d * t6432 - t6429 * t6472 / 0.7e1 + t6471 * t6475) * t6444;
        this.f0f1f2.z = t6432 * t6444 + t6429 * t6476 + t6468 * t6475 - (-l * t6469 + (0.3e1 / 0.2e1 * t6447 * t6427 - 0.3e1 / 0.7e1 * t6448 * t6429) * t6444) * t6467 / 0.9e1;
    };
    // End of organic evaluation functions
    ////////////////////////////////////////////////////////////////////////////
}

Types$b.register(ScalisSegment$1.type, ScalisSegment$1);

var ScalisSegment_1 = ScalisSegment$1;

const THREE$e = require$$0__default["default"];

const Material$5 = Material_1;


const EPSILON = 0.000001;

const TriangleUtils$2 = {};

/*
  ! Triangle extends Primitive and must have the following properties in constructor: !

    this.p0p1  = new THREE.Vector3();
    this.p1p2 = new THREE.Vector3();
    this.p2p0 = new THREE.Vector3();
    this.unit_normal = new THREE.Vector3();
    this.unit_p0p1 = new THREE.Vector3();
    this.unit_p1p2 = new THREE.Vector3();
    this.unit_p2p0 = new THREE.Vector3();
    this.length_p0p1 = 0;
    this.length_p1p2 = 0;
    this.length_p2p0 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p0p1 = 0;
    this.main_dir = new THREE.Vector3();
    this.point_iso_zero = new THREE.Vector3();
    this.ortho_dir      = new THREE.Vector3();
    this.unsigned_ortho_dir = new THREE.Vector3();
    this.proj_dir       = new THREE.Vector3();
    this.equal_weights = false; // Use to skip computations for a specific case

    this.coord_max           = 0;
    this.coord_middle        = 0;
    this.unit_delta_weight   = 0;
    this.longest_dir_special = 0;
    this.max_seg_length      = 0;
    this.half_dir_1 = new THREE.Vector3();
    this.point_half = new THREE.Vector3();
    this.half_dir_2 = new THREE.Vector3();
    this.point_min = new THREE.Vector3();
    this.weight_min = 0;

*/

/**
 * intermediary functions used in computeVectorsDirs
 * @param {number} ind
 * @param {number} lengthArray
 * @return {number}
 */
let cleanIndex = function(ind, lengthArray) {
    let res = ind;
    if (lengthArray === 0) {
        throw new Error("Lenght of the array should not be 0");
    }
    if (lengthArray === 1) {
        return 0;
    }
    // negative index are looped back at the end of the array
    if (ind < 0) res = (lengthArray+ind) % lengthArray;
    // index greater than the array length are looped back at the beginning
    if (ind >= lengthArray) {
        res = ind % lengthArray;
    }
    return res;
};

/**
 * A number, or a string containing a number.
 * @typedef {Object} VertexLike
 * @property {() => THREE.Vector3} getPos
 * @property {() => number} getThickness
 */

/**
 * A number, or a string containing a number.
 * @typedef {Object} TriangleLike
 * @property {Array<VertexLike>} v
 * @property {THREE.Vector3} p0p1
 * @property {THREE.Vector3} p1p2
 * @property {THREE.Vector3} p2p0
 * @property {THREE.Vector3} unit_p0p1
 * @property {THREE.Vector3} unit_p1p2
 * @property {THREE.Vector3} unit_p2p0
 * @property {THREE.Vector3} unit_normal
 * @property {number} length_p0p1
 * @property {number} length_p1p2
 * @property {number} length_p2p0
 * @property {THREE.Vector3} unit_p0p1
 * @property {number} diffThick_p0p1
 * @property {number} diffThick_p1p2
 * @property {number} diffThick_p2p0
 * @property {THREE.Vector3} ortho_dir
 * @property {THREE.Vector3} point_min
 * @property {number} weight_min
 * @property {THREE.Vector3} main_dir
 * @property {THREE.Vector3} point_iso_zero
 * @property {THREE.Vector3} proj_dir
 * @property {boolean} equal_weights
 * @property {THREE.Vector3} half_dir_1
 * @property {THREE.Vector3} point_half
 * @property {THREE.Vector3} half_dir_2
 * @property {number} coord_max
 * @property {number} coord_middle
 * @property {number} unit_delta_weight
 * @property {THREE.Vector3} longest_dir_special
 * @property {number} max_seg_length = tmp.length();
 * @property {THREE.Vector3} unsigned_ortho_dir = triangle.ortho_dir.clone();
 */

/**
 *  Compute some internal vars for triangle
 *  @param {TriangleLike} triangle The triangle to compute vars for (blobtree or skel)
 */
TriangleUtils$2.computeVectorsDirs = function(triangle){

    let v0_p = triangle.v[0].getPos();
    let v1_p = triangle.v[1].getPos();
    let v2_p = triangle.v[2].getPos();

    triangle.p0p1.subVectors(v1_p,v0_p);
    triangle.p1p2.subVectors(v2_p,v1_p);
    triangle.p2p0.subVectors(v0_p,v2_p);

    //triangle.unit_normal.crossVectors(triangle.p0p1,triangle.p1p2);
    triangle.unit_normal.crossVectors(triangle.p0p1,triangle.p2p0);
    triangle.unit_normal.normalize();

    triangle.length_p0p1 = triangle.p0p1.length();
    triangle.unit_p0p1.copy(triangle.p0p1);
    triangle.unit_p0p1.divideScalar(triangle.length_p0p1);
    triangle.diffThick_p0p1 = triangle.v[0].getThickness()-triangle.v[1].getThickness();

    triangle.length_p1p2 = triangle.p1p2.length();
    triangle.unit_p1p2.copy(triangle.p1p2);
    triangle.unit_p1p2.divideScalar(triangle.length_p1p2);
    triangle.diffThick_p1p2 = triangle.v[1].getThickness() - triangle.v[2].getThickness();

    triangle.length_p2p0 = triangle.p2p0.length();
    triangle.unit_p2p0.copy(triangle.p2p0);
    triangle.unit_p2p0.divideScalar(triangle.length_p2p0);
    triangle.diffThick_p2p0 = triangle.v[2].getThickness()-triangle.v[0].getThickness();

    // Precomputation Used in mech computation
    // So we first find the direction of maximum weight variation.

    /** @type Array<{vert: THREE.Vector3, thick: number, idx: number}> */
    let sortingArr = [];
    sortingArr.push({ vert: triangle.v[0].getPos(), thick: triangle.v[0].getThickness(), idx:0});
    sortingArr.push({ vert: triangle.v[1].getPos(), thick: triangle.v[1].getThickness(), idx:1});
    sortingArr.push({ vert: triangle.v[2].getPos(), thick: triangle.v[2].getThickness(), idx: 2 });

    // sort by the min thickness
    sortingArr.sort(function(a, b) { return a.thick - b.thick;});
    triangle.point_min = sortingArr[0].vert;
    triangle.weight_min = sortingArr[0].thick;
    // Cycle throught the other points
    let idx = cleanIndex(sortingArr[0].idx+1,3);
    let point_1 = triangle.v[idx].getPos();
    let weight_1 = triangle.v[idx].getThickness();
    idx = cleanIndex(sortingArr[0].idx+2,3);
    let point_2 = triangle.v[idx].getPos();
    let weight_2 = triangle.v[idx].getThickness();
    let dir_1 = new THREE$e.Vector3();
    dir_1 = dir_1.subVectors(point_1, triangle.point_min);
    let dir_2 = new THREE$e.Vector3();
    dir_2 = dir_2.subVectors(point_2, triangle.point_min);
    let delta_1 = weight_1 - triangle.weight_min;
    let delta_2 = weight_2 - triangle.weight_min;
    if(delta_1 < EPSILON || delta_2 < EPSILON)
    {
        if(delta_1 < delta_2)
        { //delta_1 is closer to 0
            triangle.ortho_dir = dir_1.clone();
            triangle.ortho_dir.normalize();

            // direction of fastest variation of weight
            triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
            triangle.main_dir.normalize();
            if( (triangle.main_dir.dot(dir_2)) < 0.0) {
                triangle.main_dir.multiplyScalar( -1.0);
            }
            let coord_iso_zero_dir = - triangle.weight_min / delta_2;
            triangle.point_iso_zero = new THREE$e.Vector3( triangle.point_min.x + coord_iso_zero_dir*dir_2.x,
                                                triangle.point_min.y + coord_iso_zero_dir*dir_2.y,
                                                triangle.point_min.z + coord_iso_zero_dir*dir_2.z);
        }
        else
        { //delta_2 is closer to 0
            triangle.ortho_dir = dir_2.clone();
            triangle.ortho_dir.normalize();

            // direction of fastest variation of weight
            triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
            triangle.main_dir.normalize();
            if( (triangle.main_dir.dot(dir_1)) < 0.0) {
                triangle.main_dir.multiplyScalar( -1.0);
            }
            let coord_iso_zero_dir = - triangle.weight_min / delta_1;
            triangle.point_iso_zero = new THREE$e.Vector3(triangle.point_min.x + coord_iso_zero_dir*dir_1.x,
                                                triangle.point_min.y + coord_iso_zero_dir*dir_1.y,
                                                triangle.point_min.z + coord_iso_zero_dir*dir_1.z);
        }
        if(Math.abs(delta_1-delta_2)< EPSILON) {
            triangle.proj_dir = triangle.unit_normal.clone().multiplyScalar(-1);
            triangle.equal_weights = true;
        }
    }
    else
    { // WARNING : numerically instable if delta_ close to zero !
        // find the point were weight equal zero along the two edges that leave from point_min
        let coord_iso_zero_dir1 = - triangle.weight_min / delta_1;
        let point_iso_zero1 = new THREE$e.Vector3(triangle.point_min.x + coord_iso_zero_dir1*dir_1.x,
                                            triangle.point_min.y + coord_iso_zero_dir1*dir_1.y,
                                            triangle.point_min.z + coord_iso_zero_dir1*dir_1.z);
        triangle.point_iso_zero = point_iso_zero1;
        let coord_iso_zero_dir2 = - triangle.weight_min / delta_2;
        let point_iso_zero2 = new THREE$e.Vector3(triangle.point_min.x + coord_iso_zero_dir2*dir_2.x,
                                            triangle.point_min.y + coord_iso_zero_dir2*dir_2.y,
                                            triangle.point_min.z + coord_iso_zero_dir2*dir_2.z);

        // along ortho_dir the weight are const
        triangle.ortho_dir.subVectors(point_iso_zero2, point_iso_zero1);
        triangle.ortho_dir.normalize();

        // direction of fastest variation of weight
        triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
        triangle.main_dir.normalize();
        if( (triangle.main_dir.dot(dir_1)) < 0.0 || (triangle.main_dir.dot(dir_2)) < 0.0) {
            triangle.main_dir.multiplyScalar( -1.0);
        }
    }

    let coord_1 = dir_1.dot(triangle.main_dir);    // not normalized !
    let coord_2 = dir_2.dot(triangle.main_dir);    // not normalized !

    // due to previous approximation for stability
    coord_1 = (coord_1<0.0) ? 0.0 : coord_1;
    coord_2 = (coord_2<0.0) ? 0.0 : coord_2;

    let longest_dir = null;
    if(coord_1 > coord_2)
    {
        longest_dir = dir_1;

        triangle.half_dir_1 = dir_2;
        triangle.point_half = point_2;
        triangle.half_dir_2 = point_1.clone().subVectors(point_1,point_2);

        triangle.coord_max = coord_1;
        triangle.coord_middle = (coord_2/coord_1) * triangle.coord_max;

        triangle.unit_delta_weight = delta_1 / triangle.coord_max;
    }
    else
    {
        longest_dir = dir_2;

        triangle.half_dir_1 = dir_1;
        triangle.point_half = point_1;
        triangle.half_dir_2 = point_2.clone().subVectors(point_2,point_1);

        triangle.coord_max = coord_2;
        triangle.coord_middle = (coord_1/coord_2) * triangle.coord_max;

        triangle.unit_delta_weight = delta_2 / triangle.coord_max;
    }

    triangle.longest_dir_special = longest_dir.divideScalar(triangle.coord_max);

    // Length of the longest segment during numerical integration
    let tmp = new THREE$e.Vector3();
    tmp.subVectors(triangle.half_dir_1, triangle.longest_dir_special.clone().multiplyScalar(triangle.coord_middle));
    triangle.max_seg_length = tmp.length();
    triangle.unsigned_ortho_dir = triangle.ortho_dir.clone();
    if( (triangle.ortho_dir.dot(tmp)) < 0.0 ) {
        triangle.ortho_dir.multiplyScalar(-1.0);
    }
};

/**
 *  @param {!Object} triangle
 *     u parametrisation of the point to compute along the axis V0->V1
 *     v parametrisation of the point to compute along the axis V0->V2
 *  @return {{pos:!THREE.Vector3, thick:number}} An object with the computed pos and thickness
 */
TriangleUtils$2.getParametrisedVertexAttr = function(triangle, u, v){
    let meanThick = TriangleUtils$2.getMeanThick(triangle, u, v);
    // create new point
    let pos = new THREE$e.Vector3();
    let uAdd = pos.subVectors(triangle.v[1].getPos(), triangle.v[0].getPos()).multiplyScalar(u);
    let vAdd = pos.clone().subVectors(triangle.v[2].getPos(), triangle.v[0].getPos()).multiplyScalar(v);
    pos.addVectors(triangle.v[0].getPos(), uAdd);
    pos.addVectors(pos, vAdd);

    return {"pos": pos, "thick": meanThick};
};

/**
 *  @param {!Object} triangle The concerned triangle
 *  @param {number} u u coordinate
 *  @param {number} v v coordinate
 *  @return {number}
 */
TriangleUtils$2.getMeanThick = function(triangle, u, v){
    return triangle.v[0].getThickness()*(1-u-v) + triangle.v[1].getThickness()*u + triangle.v[2].getThickness()*v;
};

/**
 *  @param {!Object} triangle The concerned triangle
 *  @param {number} u u coordinate
 *  @param {number} v v coordinate
 *  @return {!Material} Interpolated material
 */
TriangleUtils$2.getMeanMat = function(triangle, u, v){
    let res = new Material$5();
    let m_arr = triangle.materials === null?
        [triangle.v[0].getMaterial(),triangle.v[0].getMaterial(),triangle.v[0].getMaterial()] :
        [triangle.materials[0],triangle.materials[1],triangle.materials[2]];
    res.weightedMean(
        m_arr,
        [1-u-v,u,v]
    );
    return res;
};


/*  Cf. http://math.stackexchange.com/questions/148199/equation-for-non-orthogonal-projection-of-a-point-onto-two-vectors-representing
    eq1: W=uU+vV with u and v the parametrisation and V and U the basis vectors
     -> eq 1.dot(U) gives us eq A/   and eq 1.dot(V) gives us eq B/

    A/ u(U⋅U)+v(U⋅V)=W⋅U
    B/ u(V⋅U)+v(V⋅V)=W⋅V
    <=>
    u*a + v*b = c;
    u*d + v*e = f;
    <=>
    v = (f-d*(c/a))*(1/(e-d*b/a));
    u = (c-v*b)/a;
    with:
    a = U.lengthSq();
    b = U.dot(V);
    c = p.dot(U);
    d = V.dot(U);
    e = V.lengthSq();
    f = W.dot(V);
*/
/**
 *  Get the triangle barycenter coordinates. The projection is non orthogonal.
 *  WTF is that? Barycentirc coordinates are 3 components, not 2 !
 *  @param {!THREE.Vector3} p0p1 Vector from p0 to p1
 *  @param {!THREE.Vector3} p2p0 Vector from p2 to p0
 *  @param {!THREE.Vector3} p0 Point 0 in triangle
 *  @param {!THREE.Vector3} p Point in space
 *
 *  @return {{u:number,v:number}} Coordinate of barycenter
 */
TriangleUtils$2.getTriBaryCoord = function(p0p1, p2p0, p0, p){
    let U = p0p1;
    let V = p2p0.clone().multiplyScalar(-1);
    let W = new THREE$e.Vector3().subVectors(p, p0);

    // b == d
    let a = U.lengthSq();
    let b = U.dot(V);
    let c = W.dot(U);
    let d = V.lengthSq();
    let e = W.dot(V);
    let v = (a*e-b*c)/(a*d-b*b);
    let u = (c-v*b)/a;
    return {"u":u, "v":v};
};

TriangleUtils$2.getUVCoord = function(U, V, p0, p){
    let W = new THREE$e.Vector3();
    W.crossVectors(U,V);
    let mat = new THREE$e.Matrix4();
    mat.set(U.x, V.x, W.x,0,
            U.y, V.y, W.y,0,
            U.z, V.z, W.z,0,
              0,   0,   0,1);
    let mat1 = new THREE$e.Matrix4();
    mat1.copy(mat).invert();
    let vec = new THREE$e.Vector3().subVectors(p, p0);
    vec.applyMatrix4(mat1);

    return {u:vec.x,v:vec.y};
};

var TriangleUtils_1 = TriangleUtils$2;

const THREE$d = require$$0__default["default"];
const ScalisMath$1 = ScalisMath_1;
const Area$1 = Area_1;
const TriangleUtils$1 = TriangleUtils_1;
const Accuracies$1 = Accuracies_1;
const AreaScalisSeg = AreaScalisSeg_1;

/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */
/** @typedef {import('../scalis/ScalisVertex')} ScalisVertex */

/**
 *  Bounding area for the triangle.
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere fr now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 *  @extends {Area}
 */
class AreaScalisTri$1 extends Area$1 {
    /**
     *  @param { Array.< !ScalisVertex >} v Array or vertices
     *  @param {!THREE.Vector3} unit_normal Normal to the plane made by the 3 vertices, as a THREE.Vector3
     *  @param {!THREE.Vector3} main_dir Main direction dependeing on thicknesses
     * @param {!Object}  segParams
     *  @param {number}  min_thick Minimum thickness in the Triangle
     *  @param {number} max_thick Maximum thickness in the triangle
     */
    constructor(v, unit_normal, main_dir, segParams, min_thick, max_thick) {
        super();

        this.tmpVect = new THREE$d.Vector3();
        this.min_thick = min_thick;
        this.max_thick = max_thick;
        this.v = v;
        this.p0p1 = this.tmpVect.clone().subVectors(this.v[1].getPos(), this.v[0].getPos());
        this.p2p0 = this.tmpVect.clone().subVectors(this.v[0].getPos(), this.v[2].getPos());
        this.unit_normal = unit_normal; // Normal computed from crossVectors of p0p1 and P2p1
        this.main_dir = main_dir;
        var delta_1 = Math.abs(this.v[0].getThickness() - this.v[1].getThickness());
        var delta_2 = Math.abs(this.v[1].getThickness() - this.v[2].getThickness());
        this.equal_weights = (delta_1 / Math.abs(this.v[0].getThickness() + this.v[1].getThickness()) < 0.001
            && delta_2 / Math.abs(this.v[1].getThickness() + this.v[2].getThickness()) < 0.001);
        /* segParams is defined as: (e.g for segment p0p1)
        segParams.push({"norm":         this.length_p0p1,
                        "diffThick":    this.diffThick_p0p1,
                        "dir":          this.unit_p0p1,
                        "v":            [this.v[0], this.v[1]],
                        "ortho_vec_x":  this.v[0].getThickness() - this.v[1].getThickness(),
                        "ortho_vec_y":  this.length_p0p1});
        */
        this.segParams = segParams;

        // Store tmp computation parameters when doing computation on one segment of the triangle
        this.segAttr = {
            p0_to_p: new THREE$d.Vector3(),
            p0_to_p_sqrnorm: 0,
            x_p_2D: 0,
            y_p_2D: 0,
            y_p_2DSq: 0,
            p_proj_x: 0
        };

        // Construct the triangular prism going through each vertices
        var n1 = this.tmpVect.clone().crossVectors(this.segParams[0].dir, this.unit_normal).normalize();
        var n2 = this.tmpVect.clone().crossVectors(this.segParams[1].dir, this.unit_normal).normalize();
        var n3 = this.tmpVect.clone().crossVectors(this.segParams[2].dir, this.unit_normal).normalize();
        // Compute the prism vertices
        this.tmpVect.copy(this.unit_normal);
        var pri = [];
        pri.push(this.tmpVect.clone().addVectors(this.v[0].getPos(), this.tmpVect.multiplyScalar(this.v[0].getThickness() * ScalisMath$1.KS)));
        this.tmpVect.copy(this.unit_normal);
        pri.push(this.tmpVect.clone().addVectors(this.v[1].getPos(), this.tmpVect.multiplyScalar(this.v[1].getThickness() * ScalisMath$1.KS)));
        this.tmpVect.copy(this.unit_normal);
        pri.push(this.tmpVect.clone().addVectors(this.v[2].getPos(), this.tmpVect.multiplyScalar(this.v[2].getThickness() * ScalisMath$1.KS)));
        this.tmpVect.copy(this.unit_normal);
        pri.push(this.tmpVect.clone().addVectors(this.v[0].getPos(), this.tmpVect.multiplyScalar(-this.v[0].getThickness() * ScalisMath$1.KS)));
        this.tmpVect.copy(this.unit_normal);
        pri.push(this.tmpVect.clone().addVectors(this.v[1].getPos(), this.tmpVect.multiplyScalar(-this.v[1].getThickness() * ScalisMath$1.KS)));
        this.tmpVect.copy(this.unit_normal);
        pri.push(this.tmpVect.clone().addVectors(this.v[2].getPos(), this.tmpVect.multiplyScalar(-this.v[2].getThickness() * ScalisMath$1.KS)));
        // Compute the normals of top and bottom faces of the prism
        var tmp2 = new THREE$d.Vector3();
        this.tmpVect.subVectors(pri[1], pri[0]);
        tmp2.subVectors(pri[2], pri[0]);
        var n4 = this.tmpVect.clone().crossVectors(this.tmpVect, tmp2).normalize();
        this.tmpVect.subVectors(pri[5], pri[3]);
        tmp2.subVectors(pri[4], pri[3]);
        var n5 = this.tmpVect.clone().crossVectors(this.tmpVect, tmp2).normalize();

        // planeParams contains the definition of the prism 5 faces {normal, orig}
        this.planeParams = [];
        this.planeParams.push({ "orig": this.v[0].getPos(), "n": n1 });
        this.planeParams.push({ "orig": this.v[1].getPos(), "n": n2 });
        this.planeParams.push({ "orig": this.v[2].getPos(), "n": n3 });
        this.planeParams.push({ "orig": pri[0], "n": n4 });
        this.planeParams.push({ "orig": pri[3], "n": n5 });

        // use segments areas to factoirize some code.
        this.segAreas = [];
        for (var i = 0; i < 3; ++i) {
            this.segAreas.push(
                new AreaScalisSeg(
                    this.segParams[i].v[0].getPos(), this.segParams[i].v[1].getPos(),
                    this.segParams[i].v[0].getThickness(), this.segParams[i].v[1].getThickness()
                )
            );
        }
    };

    /**
     *  Compute projection (used in other functions)
     *  @param {!THREE.Vector3} p Point to proj
     *  @param {!Object} segParams A seg param object @todo clarify this parameter
     *
     *  @protected
     */
    proj_computation(p, segParams) {
        this.segAttr.p0_to_p.subVectors(p, segParams.v[0].getPos());
        this.segAttr.p0_to_p_sqrnorm = this.segAttr.p0_to_p.lengthSq();
        this.segAttr.x_p_2D = this.segAttr.p0_to_p.dot(segParams.dir);
        // pythagore inc.
        this.segAttr.y_p_2DSq = this.segAttr.p0_to_p_sqrnorm - this.segAttr.x_p_2D * this.segAttr.x_p_2D;
        this.segAttr.y_p_2D = this.segAttr.y_p_2DSq > 0 ? Math.sqrt(this.segAttr.y_p_2DSq) : 0; // because of rounded errors tmp can be <0 and this causes the next sqrt to return NaN...

        var t = -this.segAttr.y_p_2D / segParams.ortho_vec_y;
        // P proj is the point at the intersection of:
        //              - the local X axis (computation in the unit_dir basis)
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        this.segAttr.p_proj_x = this.segAttr.x_p_2D + t * segParams.ortho_vec_x;
        //this.segAttr.p_proj_y = 0.0;
    }

    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @param {AreaSphereParam} sphere
     * @return {boolean} true if the sphere and the area intersect
     */
    sphereIntersect(sphere) {
        // First: Test the intersection of the sphere to all three segments as they are included in the triangle bv
        for (let i = 0; i < 3; i++) {
            let intersectSeg = this.sphereIntersectSegment(sphere, this.segParams[i], ScalisMath$1.KS);
            // The sphere intersecting ones the angle means the sphere intersect the Bounding Volume
            if (intersectSeg) { return true; }
        }
        // Second: Test the intersection of the sphere with the triangular prism defined by
        // the 2D triangle constructed from the vertices and of half heights Ti*KS along the unit_normal for each vertices Vi
        let inside = true;
        for (let i = 0, inside = true; i < 5; i++) {
            this.tmpVect.subVectors(sphere.center, this.planeParams[i].orig);
            // Get the signed dist to the plane
            let dist = this.tmpVect.dot(this.planeParams[i].n);
            // if the dist to the plane is positive, we are in the part where the normal is
            inside = inside && (dist + sphere.radius > 0); // Modulation by the sphere radius
        }
        // If the sphere is outside one of the plane-> BLAM OUTSIDE SON
        return inside;
    }

    /**
     *  Adapted from the segment sphere intersection. Could be factorised!
     *  @return {boolean} true if the sphere and the area intersect
     *
     *  @param {AreaSphereParam} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {!Object} segParams A segParams object containing data for a segment
     *  @param {number} KS Kernel Scale, ie ScalisMath.KS (Why is it a parameter, its global!?)
     *
     */
    sphereIntersectSegment(sphere, segParams, KS) {
        this.proj_computation(sphere.center, segParams);

        var thick0 = segParams.v[0].getThickness();
        var thick1 = segParams.v[1].getThickness();
        if (this.segAttr.p_proj_x < 0.0) {
            return (Math.sqrt(this.segAttr.p0_to_p_sqrnorm) - sphere.radius < thick0 * KS);
        } else {
            if (this.segAttr.p_proj_x > segParams.norm) {
                this.segAttr.p0_to_p.subVectors(sphere.center, segParams.v[1].getPos());
                return this.segAttr.p0_to_p.length() - sphere.radius < thick1 * KS;
            } else {
                var sub1 = this.segAttr.x_p_2D - this.segAttr.p_proj_x;
                var dist = sub1 * sub1 + this.segAttr.y_p_2DSq;
                var tt = this.segAttr.p_proj_x / segParams.norm;
                var inter_w = thick0 * (1.0 - tt) + tt * thick1;
                var tmp = sphere.radius + inter_w * KS;
                return (dist < tmp * tmp);
            }
        }
    }

    /**
     * @link Area.contains for a complete description
     * @param {THREE.Vector3} p
     */
    contains = (function () {
        let sphere = { radius: 0, center: new THREE$d.Vector3() };
        /**
         * @param {THREE.Vector3} p
         */
        return (p) => {
            /** @type {AreaScalisTri} */
            let self = this;

            sphere.center.copy(p);
            return self.sphereIntersect(sphere);
        }
    })();

    /**
     *  Copied from AreaSeg.getAcc
     *
     *  @param {AreaSphereParam} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {!Object} segParams A segParams object containing data for a segment area
     *
     *  @return {!Object} Object containing intersect (boolean) and currAcc (number) attributes
     */
    getAccSegment(sphere, segParams) {
        var allReturn = { intersect: false, currAcc: Accuracies$1.nice * this.min_thick };
        if (this.sphereIntersectSegment(sphere, segParams, 1)) {
            // Thales between two triangles that have the same angles gives us the dist of:
            // side A = sphere.r*this.abs_diff_thick/this.length;
            // Then pythagore this shit up as A² + sphere.r² = delta²
            // i.e delta² = (sphere.r*this.abs_diff_thick/this.length)² + sphere.r²
            // <=> delta = sphere.r*Math.sqrt(1+(this.abs_diff_thick/this.length)²);
            var tmp = Math.abs(segParams.diffThick) / segParams.norm;
            var half_delta = sphere.radius * Math.sqrt(1 + tmp * tmp) * 0.5;

            var thick0 = segParams.v[0].getThickness();
            var thick1 = segParams.v[1].getThickness();
            // we check only the direction where the weight is minimum since
            // we will return minimum accuracy needed in the area.
            var absc = this.segAttr.p_proj_x;
            absc += thick0 > thick1 ? half_delta : -half_delta;

            if (absc <= 0.0) {
                allReturn.currAcc = thick0;
            } else if (absc >= segParams.norm) {
                allReturn.currAcc = thick1;
            } else {
                var tt = absc / segParams.norm;
                allReturn.currAcc = thick0 * (1.0 - tt) + tt * thick1;
            }
            allReturn.intersect = true;
        }
        return allReturn;
    };

    /**
     *  Get accuracy for the inner triangle (do not consider segment edges)
     *  @param {AreaSphereParam} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     */
    getAccTri(sphere) {
        // Inequal thickness triangle case:
        if (!this.equal_weights) {
            var v0 = this.v[0].getPos(); // Should be the min thickness point on the triangle
            // Get the main dir furthest point
            var main_dir_point = this.tmpVect.addVectors(sphere.center, this.main_dir.clone().multiplyScalar(sphere.radius));
            // Get the proj of this point
            // 1/ get the ortho coord 2D wise
            this.tmpVect.subVectors(main_dir_point, v0);
            var distLineSq = this.tmpVect.lengthSq();
            // Get the dist to the plane (signed)
            var y_p_2D = this.tmpVect.dot(this.unit_normal); // Should do some test here to know if we are above or below the plane
            var x_p_2D = Math.sqrt(distLineSq - y_p_2D * y_p_2D);
            // Get the ortho proj point in the triangle plane
            // Cf. http://geomalgorithms.com/a04-_planes.html
            var proj_ortho_point = this.tmpVect.clone().addVectors(sphere.center, this.unit_normal.clone().multiplyScalar(-y_p_2D));
            // Get the thickness at this point
            var params = TriangleUtils$1.getTriBaryCoord(this.p0p1, this.p2p0, this.v[0].getPos(), proj_ortho_point);
            var thick_ortho_point = TriangleUtils$1.getMeanThick(this, params.u, params.v);
            // Ortho vector to the weight varies along where the sphere is relative to the plane
            thick_ortho_point = y_p_2D >= 0 ? thick_ortho_point : -thick_ortho_point;
            var ortho_vec_x = this.v[0].getThickness() - thick_ortho_point;
            var ortho_vec_y = x_p_2D;
            var t = -y_p_2D / ortho_vec_y;
            // P proj is the point at the intersection of:
            //              - the local X axis (computation in the unit_dir basis)
            //                  and
            //              - the line defined by P and the vector orthogonal to the weight line
            var p_proj_x = x_p_2D + t * ortho_vec_x;

            var dirVect = this.tmpVect.subVectors(v0, proj_ortho_point).normalize();
            var p_proj = this.tmpVect.addVectors(proj_ortho_point, dirVect.multiplyScalar(x_p_2D - p_proj_x));
            // Get the barycentric parameters of the non orthogonal point
            params = TriangleUtils$1.getTriBaryCoord(this.p0p1, this.p2p0, this.v[0].getPos(), p_proj);
            if (params.u <= 1 && params.v <= 1 && params.u + params.v <= 1 && params.u >= 0 && params.v >= 0) {
                // Return the barycentered thickness (yes barycentered is a proper english terminology)
                return TriangleUtils$1.getMeanThick(this, params.u, params.v);
            } else {
                return this.max_thick * 10000;
            }
        } else {
            // Case of equal weights
            return this.min_thick;
        }
    };

    /**
     *  @link Area.getAcc for a complete description
     *
     *  @return {number} the accuracy needed in the intersection zone
     *
     *  @param {AreaSphereParam} sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {number}  factor  the ratio to determine the wanted accuracy.
     *
     *  @todo Check the Maths
     */
    getAcc(sphere, factor) {

        // First: Test the intersection of the sphere to all three segments to get the min Acc for segments
        for (var i = 0, minForSeg = this.max_thick * 100000; i < 3; i++) {
            var intersectSeg = this.getAccSegment(sphere, this.segParams[i]);
            // The sphere intersecting ones the angle means the sphere intersect the Bounding Volume
            if (intersectSeg.intersect) {
                minForSeg = minForSeg > intersectSeg.currAcc ? intersectSeg.currAcc : minForSeg;
            }
        }
        // Second: Test the inner triangle
        var minForTri = this.max_thick * 100000;
        if (minForSeg !== this.min_thick) {
            minForTri = this.getAccTri(sphere);
        }

        var minThick = Math.min(minForSeg, minForTri);
        if (minThick !== this.max_thick * 100000) {
            //minThick = Math.min(Math.max(minThick, this.min_thick), this.max_thick);
            return minThick * factor;
        } else {
            // Sphere does not intersect with the segments, or the inner triangle
            return this.max_thick * factor;
        }

        //return this.min_thick*factor;
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere) {
        return this.getAcc(sphere, Accuracies$1.nice);
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere) {
        return this.getAcc(sphere, Accuracies$1.curr);
    }

    /**
     *  @link Area.getRawAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere) {
        return this.getAcc(sphere, Accuracies$1.raw);
    }

    /**
     * @link Area.getMinAcc
     * @return {number}
     */
    getMinAcc() {
        return Accuracies$1.curr * this.min_thick;
    }

    /**
     * @link Area.getMinRawAcc
     * @return {number}
     */
    getMinRawAcc = function () {
        return Accuracies$1.raw * this.min_thick;
    }

    /**
     *  Return the minimum accuracy required at some point on the given axis.
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param {string} axis x, y or z
     *  @param {number} t Coordinate on the axis
     *  @return {number} The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis, t) {
        var step = Number.MAX_VALUE;
        for (var i = 0; i < 3; ++i) {
            step = Math.min(step, this.segAreas[i].getAxisProjectionMinStep(axis, t));
        }
        return step;
    }
}

var AreaScalisTri_1 = AreaScalisTri$1;

const THREE$c = require$$0__default["default"];
const Types$a = Types_1;
const Material$4 = Material_1;
const ScalisPrimitive = ScalisPrimitive_1;
const ScalisVertex = ScalisVertex_1;
const ScalisMath = ScalisMath_1;
const AreaScalisTri = AreaScalisTri_1;

const TriangleUtils = TriangleUtils_1;

// Number of sample in the Simpsons integration.
var sampleNumber = 10;

/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./ScalisPrimitive').ScalisPrimitiveJSON} ScalisPrimitiveJSON */

/**
 * @typedef {ScalisPrimitiveJSON} ScalisTriangleJSON
 */


/**
 * This class implements a ScalisTriangle primitive.
 *  CONVOL Evaluation is not exact so we use simpsons numerical integration.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
class ScalisTriangle$1 extends ScalisPrimitive {

    /** @type {"ScalisTriangle"} */
    static type = "ScalisTriangle";

    /**
     * @param {ScalisTriangleJSON} json
     * @returns
     */
    static fromJSON(json) {
        var v = [
            ScalisVertex.fromJSON(json.v[0]),
            ScalisVertex.fromJSON(json.v[1]),
            ScalisVertex.fromJSON(json.v[2])
        ];
        var m = [
            Material$4.fromJSON(json.materials[0]),
            Material$4.fromJSON(json.materials[1]),
            Material$4.fromJSON(json.materials[2])
        ];
        return new ScalisTriangle$1(v, json.volType, 1.0, m);
    };

    /**
     *  @param {!Array.<ScalisVertex>} v the 3 vertices for the triangle
     *  @param {!string} volType Volume type, can be ScalisPrimitive.CONVOL
     *                 (homothetic convolution surfaces, Zanni and al), or
     *                 ScalisPrimitive.DIST (classic weighted distance field)
     *  @param {number} density Density is another constant to modulate the implicit
     *                  field. Used only for DIST voltype.
     *  @param {!Array.<Material>} mats Material for this primitive.
     *                                  Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
     *
     */
    constructor(v, volType, density, mats) {
    super();

    if(density !== 1.0){
        throw "Error in ScalisTriangle : cannot use a density different from 1.0, not implemented.";
    }

    this.volType = volType;
    this.materials     = mats !== null? mats : [Material$4.defaultMaterial.clone(), Material$4.defaultMaterial.clone(), Material$4.defaultMaterial.clone()];

    this.v = v;
    this.v[0].setPrimitive(this);
    this.v[1].setPrimitive(this);
    this.v[2].setPrimitive(this);
    this.min_thick = Math.min(this.v[0].getThickness(), this.v[1].getThickness(), this.v[2].getThickness());
    this.max_thick = Math.max(this.v[0].getThickness(), this.v[1].getThickness(), this.v[2].getThickness());

    // Temporary for eval
    // TODO : should be wrapped in the eval function scope if possible (ie not precomputed)
    this.res_gseg = {};
    this.tmp_res_gseg = {};

    this.p0p1  = new THREE$c.Vector3();
    this.p1p2 = new THREE$c.Vector3();
    this.p2p0 = new THREE$c.Vector3();
    this.unit_normal = new THREE$c.Vector3();
    this.unit_p0p1 = new THREE$c.Vector3();
    this.unit_p1p2 = new THREE$c.Vector3();
    this.unit_p2p0 = new THREE$c.Vector3();
    this.length_p0p1 = 0;
    this.length_p1p2 = 0;
    this.length_p2p0 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p1p2 = 0;
    this.diffThick_p2p0 = 0;
    this.main_dir       = new THREE$c.Vector3();
    this.point_iso_zero = new THREE$c.Vector3();
    this.ortho_dir      = new THREE$c.Vector3();
    this.unsigned_ortho_dir= new THREE$c.Vector3();
    this.proj_dir       = new THREE$c.Vector3();
    this.equal_weights = false; // Use to skip computations for a specific case

    this.coord_max           = 0;
    this.coord_middle        = 0;
    this.unit_delta_weight   = 0;
    this.longest_dir_special = new THREE$c.Vector3();
    this.max_seg_length      = 0;
    this.half_dir_1 = new THREE$c.Vector3();
    this.point_half = new THREE$c.Vector3();
    this.half_dir_2 = new THREE$c.Vector3();
    this.point_min = new THREE$c.Vector3();
    this.weight_min = 0;

    this.valid_aabb = false;

    }

    getType(){
        return ScalisTriangle$1.type;
    }

    /**
     *
     * @returns {ScalisTriangleJSON}
     */
    toJSON() {
        return {
            ...super.toJSON()
        };
    }

    // [Abstract] See Primitive.prepareForEval for more details
    prepareForEval() {
        if(!this.valid_aabb)
        {
            this.computeHelpVariables();
            this.valid_aabb = true;
        }
    }


    // [Abstract] See Primtive.getArea for more details
    getAreas() {
        if(!this.valid_aabb){
            console.log("ERROR : Cannot get area of invalid primitive");
            return [];
        }else {
            var segParams = [];
            segParams.push({"norm":         this.length_p0p1,
                            "diffThick":    this.diffThick_p0p1,
                            "dir":          this.unit_p0p1,
                            "v":            [this.v[0], this.v[1]],
                            "ortho_vec_x":  this.v[0].getThickness() - this.v[1].getThickness(),
                            "ortho_vec_y":  this.length_p0p1});
            segParams.push({"norm":         this.length_p1p2,
                            "diffThick":    this.diffThick_p1p2,
                            "dir":          this.unit_p1p2,
                            "v":            [this.v[1], this.v[2]],
                            "ortho_vec_x":  this.v[1].getThickness() - this.v[2].getThickness(),
                            "ortho_vec_y":  this.length_p1p2});
            segParams.push({"norm":         this.length_p2p0,
                            "diffThick":    this.diffThick_p2p0,
                            "dir":          this.unit_p2p0,
                            "v":            [this.v[2], this.v[0]],
                            "ortho_vec_x":  this.v[2].getThickness() - this.v[0].getThickness(),
                            "ortho_vec_y":  this.length_p2p0});
            return [{
                aabb:this.aabb,
                bv: new AreaScalisTri(this.v,
                                    this.unit_normal,
                                    this.main_dir,
                                    segParams,
                                    this.min_thick,
                                    this.max_thick),
                obj: this
            }];
        }
    }

    // [Abstract] See Primitive.computeHelpVariables for more details
    computeHelpVariables() {
        TriangleUtils.computeVectorsDirs(this);
        // Compute the AABB from the union of the BBox of the vertices
        this.computeAABB();
    }

    // [Abstract] See ScalisPrimitive.mutableVolType for more details
    mutableVolType() {
        return true;
    }

    // [Abstract] See Primitive.setVolType for more details
    setVolType(vt)
    {
        if( !(vt == ScalisPrimitive.CONVOL || vt == ScalisPrimitive.DIST) ){
            throw "ERROR : volType must be set to ScalisPrimitive.CONVOL or ScalisPrimitive.DIST";
        }

        if(this.volType != vt){
            this.volType = vt;
            this.invalidAABB();
        }
    }

    // [Abstract] See Primitive.getVolType for more details
    getVolType()
    {
        return this.volType;
    }

    /**
     *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
     *  @param {number} a
     *  @param {number} b
     *  @param {number} c
     *  @return {number} Clamped value
     *  Author: Jakub Korzeniowski
     *  Agency: Softhis
     *  http://www.softhis.com
     */
    clamp(a,b,c){
        return Math.max(b,Math.min(c,a));
    }

    // [Abstract] See Primitive.distanceTo for more details
    distanceTo = (function() {
        var p0p = new THREE$c.Vector3();
        var p1p = new THREE$c.Vector3();
        var p2p = new THREE$c.Vector3();
        var tmp = new THREE$c.Vector3();
        return function (p) {

            /** @type {ScalisTriangle} */
            let self = this;

            p0p.subVectors(p, self.v[0].getPos());
            p1p.subVectors(p, self.v[1].getPos());
            p2p.subVectors(p, self.v[2].getPos());
            if (tmp.crossVectors(self.p0p1, p0p).dot(self.unit_normal)>0 &&
                tmp.crossVectors(self.p1p2, p1p).dot(self.unit_normal)>0 &&
                tmp.crossVectors(self.p2p0, p2p).dot(self.unit_normal)>0)
            {
                // p is in the triangle
                return Math.abs(p0p.dot(self.unit_normal));
            }else {
                var t0 = p0p.dot(self.p0p1) / self.length_p0p1;
                // clamp is our own function declared there
                t0 = self.clamp(t0,0,1);
                tmp.copy(self.p0p1)
                    .multiplyScalar(t0)
                    .add(self.v[0].getPos());
                t0 = p.distanceToSquared(tmp);

                var t1 = p1p.dot(self.p1p2) / self.length_p1p2;
                // clamp is our own function declared there
                t1 = self.clamp(t1,0,1);
                tmp.copy(self.p1p2)
                    .multiplyScalar(t1)
                    .add(self.v[1].getPos());
                t1 = p.distanceToSquared(tmp);

                var t2 = p2p.dot(self.p2p0) / self.length_p2p0;
                // clamp is our own function declared there
                t2 = self.clamp(t2,0,1);
                tmp.copy(self.p2p0)
                    .multiplyScalar(t2)
                    .add(self.v[2].getPos());
                t2 = p.distanceToSquared(tmp);

                return Math.sqrt(Math.min(Math.min(t0,t1),t2));
            }
        };
    })();

    // [Abstract] See Primitive.heuristicStepWithin for more details
    heuristicStepWithin() {
        return this.weight_min/3;
    };
    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value(p,res) {
        switch(this.volType){
            case ScalisPrimitive.DIST:
                return this.evalDist(p,res);
            case ScalisPrimitive.CONVOL:
                // for now rings are just evaluated as distance surface
                return this.evalConvol(p,res);
            default:
                throw "Unknown volType, use Orga";
        }
    }

    /**
     *  value function for Distance volume type (distance field).
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    evalDist = (function() {

        var ev_eps = {v:0};
        var p_eps = new THREE$c.Vector3();
        /**
         *  value function for Distance volume type (distance field).
         *
         *  @param {THREE.Vector3} p
         *  @param {ValueResultType} res
         */
        return function (p, res) {
            /** @type {ScalisTriangle} */
            let self = this;
            /*
                // bounding box check (could/should be done in the node ?)
                if( p.x > this.aabb.min_x && p.x < this.aabb.max_x &&
                    p.y > this.aabb.min_y && p.y < this.aabb.max_y &&
                    p.z > this.aabb.min_z && p.z < this.aabb.max_z
                    )
                {
            */
            // First compute the distance to the triangle and find the nearest point
            // Code taken from EuclideanDistance functor, can be optimized.
            var p0_to_p = new THREE$c.Vector3();
            p0_to_p.subVectors(p,self.v[0].getPos());
            var normal_inv = self.unit_normal.clone().multiplyScalar(-1);
            ///////////////////////////////////////////////////////////////////////
            // We must generalize the principle used for the segment
            if(!self.equal_weights){

                // Now look for the point equivalent to the Z point for the segment.
                // This point Z is the intersection of 3 orthogonal planes :
                //      plane 1 : triangle plane
                //      plane 2 : n = ortho_dir, passing through point
                //      plane 3 : n = main_dir, passing through point_iso_zero_dir1 and point_iso_zero_dir2
                // Formula for a unique intersection of 3 planes : http://geomalgorithms.com/a05-_intersect-1.html
                //  Plane equation from a normal n and a point p0 : <n.(x,y,z)> - <n.p0> = 0
                //
                // TODO : this formula can probably be optimized :
                //        - some elements can be stored
                //        - some assertion are verified and may help to simplify the computation, for example : n3 = n2%n1
                var n1 = normal_inv;
                var n2 = self.unsigned_ortho_dir;
                var n3 = self.main_dir.clone().multiplyScalar(-1);
                var d1 = -self.v[0].getPos().dot(n1);
                var d2 = -p.dot(n2);
                var d3 = -self.point_iso_zero.dot(n3);

                var d1n2n3 = new THREE$c.Vector3();
                d1n2n3.crossVectors(n2,n3);
                d1n2n3.multiplyScalar(-d1);
                var d2n3n1 = new THREE$c.Vector3();
                d2n3n1.crossVectors(n3,n1);
                d2n3n1.multiplyScalar(-d2);
                var d3n1n2 = new THREE$c.Vector3();
                d3n1n2.crossVectors(n1,n2);
                d3n1n2.multiplyScalar(-d3);
                var n2cn3 = new THREE$c.Vector3();
                n2cn3.crossVectors(n2,n3);
                var Z = new THREE$c.Vector3(  d1n2n3.x+d2n3n1.x+d3n1n2.x,
                                            d1n2n3.y+d2n3n1.y+d3n1n2.y,
                                            d1n2n3.z+d2n3n1.z+d3n1n2.z);
                Z.divideScalar(n1.dot(n2cn3));

                // Now we want to project in the direction orthogonal to (pZ) and ortho_dir
                var pz = new THREE$c.Vector3(Z.x-p.x,Z.y-p.y,Z.z-p.z);

                // set proj_dir
                self.proj_dir = new THREE$c.Vector3();
                self.proj_dir.crossVectors(pz,self.unsigned_ortho_dir);
                self.proj_dir.normalize(); // should be useless
            }

            // Project along the given direction
            var non_ortho_proj = new THREE$c.Vector3();
            non_ortho_proj.copy(self.proj_dir);
            non_ortho_proj.multiplyScalar( -p0_to_p.dot(normal_inv)/self.proj_dir.dot(normal_inv));
            non_ortho_proj.add(p);

            var tmp_vec = new THREE$c.Vector3();
            var tmp_vec0 = new THREE$c.Vector3();
            var tmp_vec1 = new THREE$c.Vector3();
            var tmp_vec2 = new THREE$c.Vector3();
            tmp_vec0.subVectors(non_ortho_proj,self.v[0].getPos());
            tmp_vec1.subVectors(non_ortho_proj,self.v[1].getPos());
            tmp_vec2.subVectors(non_ortho_proj,self.v[2].getPos());

            if( tmp_vec.crossVectors(self.unit_p0p1,tmp_vec0).dot(normal_inv) > 0.0 &&
                tmp_vec.crossVectors(self.unit_p1p2,tmp_vec1).dot(normal_inv) > 0.0 &&
                tmp_vec.crossVectors(self.unit_p2p0,tmp_vec2).dot(normal_inv) > 0.0)
            {
                tmp_vec.subVectors(p,non_ortho_proj);
                res.v = tmp_vec.lengthSq();

                // get barycentric coordinates of nearest_point (which is necessarily in the triangle
                var p0 = self.v[0].getPos();
                var p1 = self.v[1].getPos();
                var p2 = self.v[2].getPos();

                var tmp_vec_bis = new THREE$c.Vector3();
                tmp_vec.subVectors(p1,p0);
                tmp_vec_bis.subVectors(p2,p0);
                var n = new THREE$c.Vector3();
                n.crossVectors(tmp_vec,tmp_vec_bis);
                tmp_vec.subVectors(p2,p1);
                var nv1 = new THREE$c.Vector3();
                nv1.crossVectors(tmp_vec,tmp_vec1);
                tmp_vec.subVectors(p0,p2);
                var nv2 = new THREE$c.Vector3();
                nv2.crossVectors(tmp_vec,tmp_vec2);
                tmp_vec.subVectors(p1,p0);
                var nv3 = new THREE$c.Vector3();
                nv3.crossVectors(tmp_vec,tmp_vec0);

                var nsq = n.lengthSq();
                var a1 = n.dot(nv1);
                var a2 = n.dot(nv2);
                var a3 = n.dot(nv3);

                var inter_weight = (a1*self.v[0].getThickness()+a2*self.v[1].getThickness()+a3*self.v[2].getThickness())/nsq;

                res.v = ScalisMath.Poly6Eval(Math.sqrt(res.v)/inter_weight)*ScalisMath.Poly6NF0D;

                if(res.m){
                    res.m.triMean(self.materials[0],self.materials[1],self.materials[2],a1,a2,a3,nsq);
                }
            }
            else
            {
                // Use to keep the case selected in case we need to compute the material
                var seg_case = 0;
                // do the same as for a segment on all triangle sides
                self.GenericSegmentComputation(
                    p,
                    self.v[0].getPos(),
                    self.p0p1,
                    self.length_p0p1,
                    self.length_p0p1*self.length_p0p1,
                    self.v[0].getThickness(),
                    self.v[1].getThickness()-self.v[0].getThickness(),
                    self.res_gseg
                );

                self.res_gseg.sqrdist = self.res_gseg.proj_to_p.lengthSq();
                self.res_gseg.ratio = self.res_gseg.sqrdist/(self.res_gseg.weight_proj*self.res_gseg.weight_proj);

                self.GenericSegmentComputation(
                    p,
                    self.v[1].getPos(),
                    self.p1p2,
                    self.length_p1p2,
                    self.length_p1p2*self.length_p1p2,
                    self.v[1].getThickness(),
                    self.v[2].getThickness()-self.v[1].getThickness(),
                    self.tmp_res_gseg
                );
                self.tmp_res_gseg.sqrdist = self.tmp_res_gseg.proj_to_p.lengthSq();
                self.tmp_res_gseg.ratio = self.tmp_res_gseg.sqrdist/(self.tmp_res_gseg.weight_proj*self.tmp_res_gseg.weight_proj);
                if(self.res_gseg.ratio > self.tmp_res_gseg.ratio){
                    self.res_gseg.sqrdist         = self.tmp_res_gseg.sqrdist;
                    self.res_gseg.proj_to_p       = self.tmp_res_gseg.proj_to_p;
                    self.res_gseg.weight_proj     = self.tmp_res_gseg.weight_proj;
                    self.res_gseg.ratio           = self.tmp_res_gseg.ratio;
                    self.res_gseg.t               = self.tmp_res_gseg.t;
                    seg_case = 1;
                }

                self.GenericSegmentComputation(
                    p,
                    self.v[2].getPos(),
                    self.p2p0,
                    self.length_p2p0,
                    self.length_p2p0*self.length_p2p0,
                    self.v[2].getThickness(),
                    self.v[0].getThickness()-self.v[2].getThickness(),
                    self.tmp_res_gseg
                );
                self.tmp_res_gseg.sqrdist = self.tmp_res_gseg.proj_to_p.lengthSq();
                self.tmp_res_gseg.ratio = self.tmp_res_gseg.sqrdist/(self.tmp_res_gseg.weight_proj*self.tmp_res_gseg.weight_proj);
                if(self.res_gseg.ratio > self.tmp_res_gseg.ratio){
                    self.res_gseg.sqrdist         = self.tmp_res_gseg.sqrdist;
                    self.res_gseg.proj_to_p       = self.tmp_res_gseg.proj_to_p;
                    self.res_gseg.weight_proj     = self.tmp_res_gseg.weight_proj;
                    self.res_gseg.ratio           = self.tmp_res_gseg.ratio;
                    self.res_gseg.t               = self.tmp_res_gseg.t;
                    seg_case = 2;
                }

                res.v = ScalisMath.Poly6Eval(Math.sqrt(self.res_gseg.sqrdist)/self.res_gseg.weight_proj)*ScalisMath.Poly6NF0D;

                ////////////////////////////////////////////////////////////////
                // Material computation
                if(res.m){
                    switch(seg_case){
                        case 0:
                            res.m.copy(self.materials[0]);
                            res.m.lerp(self.materials[1], self.res_gseg.t);
                        break;
                        case 1:
                            res.m.copy(self.materials[1]);
                            res.m.lerp(self.materials[2], self.res_gseg.t);
                        break;
                        case 2:
                            res.m.copy(self.materials[2]);
                            res.m.lerp(self.materials[0], self.res_gseg.t);
                        break;
                        default:
                            throw "Error : seg_case unknown";
                    }
                }
                //////////////////////////////////////////////////////////////
            }
            // IMPORTANT NOTE :
            // We should use an analytical gradient here. It should be possible to
            // compute.
            if(res.g)
            {
                var epsilon = 0.00001;
                p_eps.copy(p);
                p_eps.x += epsilon;
                self.evalDist(p_eps, ev_eps);
                res.g.x = (ev_eps.v-res.v)/epsilon;
                p_eps.x -= epsilon;

                p_eps.y += epsilon;
                self.evalDist(p_eps, ev_eps);
                res.g.y = (ev_eps.v-res.v)/epsilon;
                p_eps.y -= epsilon;

                p_eps.z += epsilon;
                self.evalDist(p_eps, ev_eps);
                res.g.z = (ev_eps.v-res.v)/epsilon;
            }
    /*
        }else{
            res.v = 0;
        }
    */
        };
    })();


    /**
     *
     *  Segment computations used in Distance triangle evaluation.
     *
     *  @param {!THREE.Vector3} point Point where value is wanted, as a THREE.Vector3
     *  @param {!THREE.Vector3} p1 Segment first point, as a THREE.Vector3
     *  @param {!THREE.Vector3} p1p2 Segment first to second point, as a THREE.Vector3
     *  @param {number} length Length of the segment
     *  @param {number} sqr_length Squared length of the segment
     *  @param {number} weight_1 Weight for the first point of the segment
     *  @param {number} delta_weight weight_2 - weight_1
     *  @param {!Object} res {proj_to_p, weight_proj}
     *
     */
    GenericSegmentComputation(  point,
                                p1,
                                p1p2,
                                length,
                                sqr_length,
                                weight_1,
                                delta_weight, // = weight_2-weight_1
                                res)
    {
        var origin_to_p = new THREE$c.Vector3();
        origin_to_p.subVectors(point,p1);

        var orig_p_scal_dir = origin_to_p.dot(p1p2);
        var orig_p_sqr = origin_to_p.lengthSq();

        var denum = sqr_length * weight_1 + orig_p_scal_dir * delta_weight;
        var t = (delta_weight<0.0) ? 0.0 : 1.0;
        if(denum > 0.0)
        {
            t = (orig_p_scal_dir * weight_1 + orig_p_sqr * delta_weight) /denum;
            t = (t<0.0) ? 0.0 : ((t>1.0) ? 1.0 : t) ; // clipping (nearest point on segment not line)
        }

        res.proj_to_p = new THREE$c.Vector3(  t*p1p2.x - origin_to_p.x,
                                            t*p1p2.y - origin_to_p.y,
                                            t*p1p2.z - origin_to_p.z);
        res.weight_proj = weight_1 + t*delta_weight;

        res.t = t;

        return res;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Convolution Evaluation functions and auxiliaary functions

    /**
     *  value function for Distance volume type (distance field).
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    evalConvol = (function() {

        var g = new THREE$c.Vector3();
        var m = new Material$4();
        var tmpRes = {v:0,g:null,m:null};
        var g2 = new THREE$c.Vector3();
        var m2 = new Material$4();
        var tmpRes2 = {v:0,g:null,m:null};
        /**
         *  @param {THREE.Vector3} p
         *  @param {ValueResultType} res
         */
        return function (p, res) {

            /** @type {ScalisTriangle} */
            let self = this;

            tmpRes.g = res.g ? g : null;
            tmpRes.m = res.m ? m : null;

            // Compute closest point (t parameter) on the triangle in "warped space" as well as clipping
            var clipped = {l1: 0, l2: 0};
            if (self.ComputeTParam(p, clipped)) {
                var t_low = clipped.l1;
                var t_high = clipped.l2;
                // Compute local warp coordinates
                var w_local = self.weight_min + t_low * self.unit_delta_weight;
                var local_t_max = self.warpAbscissa((t_high - t_low) / w_local);

                // Compute the required number of sample
                var nb_samples = 2 * (0.5 * sampleNumber * local_t_max + 1.0);
                var d_step_size = local_t_max / nb_samples;

                // Perform Simpson scheme
                var t = d_step_size;
                d_step_size *= 2.0;
                var res_odd = 0.0;
                var grad_odd = new THREE$c.Vector3();

                for (var i = 1; i < nb_samples; i += 2) {
                    self.computeLineIntegral(self.unwarpAbscissa(t) * w_local + t_low, p, tmpRes);
                    res_odd += tmpRes.v;
                    if (res.g) {
                        grad_odd.addVectors(grad_odd, tmpRes.g);
                    }
                    t += d_step_size;
                }

                var res_even = 0.0;
                var grad_even = new THREE$c.Vector3();
                t = 0.0;
                for (var j = 2; j < nb_samples; j += 2) {
                    t += d_step_size;
                    self.computeLineIntegral(self.unwarpAbscissa(t) * w_local + t_low, p, tmpRes);
                    if (res.g) {
                        grad_even.addVectors(grad_even, tmpRes.g);
                    }
                    res_even += tmpRes.v;
                }

                tmpRes2.g = res.g ? g2 : null;
                tmpRes2.m = res.m ? m2 : null;

                var res_low = self.computeLineIntegral(t_low, p, tmpRes);
                var res_high = self.computeLineIntegral(t_high, p, tmpRes2);

                res.v = res_low.v + 4.0 * res_odd + 2.0 * res_even + res_low.v;
                var factor = ( local_t_max / (3.0 * (nb_samples)) ) * ScalisMath.Poly6NF2D;
                res.v *= factor;
                if (res.g) {
                    var grad_res = new THREE$c.Vector3();
                    grad_res.addVectors(grad_res, res_low.g);
                    grad_res.addVectors(grad_res, grad_odd.multiplyScalar(4.0));
                    grad_res.addVectors(grad_res, grad_even.multiplyScalar(2.0));
                    grad_res.addVectors(grad_res, res_high.g);
                    res.g = grad_res.multiplyScalar(factor);
                }
            } else {
                res.v = 0.0;
                res.g = new THREE$c.Vector3();
            }
            if (res.m) {
                tmpRes.g = null;
                self.evalDist(p, tmpRes);
                res.m.copy(tmpRes.m);
            }
        };
    })();
    /**
     *  @param {number} t
     *  @return {number} Warped value
     */
   warpAbscissa(t) {
        // Compute approx of ln(d*l+1)/d
        var dt = t * this.unit_delta_weight;
        var inv_dtp2 = 1.0 / (dt + 2.0);
        var sqr_dt_divdlp2 = dt * inv_dtp2;
        sqr_dt_divdlp2 *= sqr_dt_divdlp2;
        var serie_approx = 1.0 + sqr_dt_divdlp2*(
                                       (1.0/3.0) + sqr_dt_divdlp2*(
                                            (1.0/5.0) + sqr_dt_divdlp2*(
                                                (1.0/7.0) + sqr_dt_divdlp2*(
                                                    (1.0/9.0) + sqr_dt_divdlp2*(
                                                        (1.0/11.0) + sqr_dt_divdlp2*(1.0/13.0) )))));
        return 2.0 * t * inv_dtp2 * serie_approx;
    }

    /**
     *  @param {number} t
     *  @return {number} Unwarped value
     */
    unwarpAbscissa(t) {
        // Compute approx of (exp(d*l)-1)/d
        var dt = t * this.unit_delta_weight;
        return t * ( 1.0 + dt *( 1.0/2.0 + dt * ( 1.0/6.0 + dt * ( 1.0/24.0 + dt * ( 1.0/120.0 + dt * 1.0/720.0 ))))) ;
    }

    /**
     *  @param {number} t
     *  @param {!THREE.Vector3} p point, as a THREE.Vector3
     *  @param {Object} res result containing the wanted elements like res.v for the value, res.g for the gradient, res.m for the material.
     *  @return the res parameter, filled with proper values
     */
    computeLineIntegral(t, p, res) {

        var weight = this.weight_min + t * this.unit_delta_weight;
        var p_1 = new THREE$c.Vector3();
        p_1.addVectors(this.point_min, this.longest_dir_special.clone().multiplyScalar(t));

        var length = (t<this.coord_middle) ? (t/this.coord_middle) * this.max_seg_length
                                               : ((this.coord_max-t)/(this.coord_max - this.coord_middle)) * this.max_seg_length;
        if (res.g) {
            this.consWeightEvalGradForSeg( p_1, weight, this.ortho_dir, length, p, res);
        } else {
            this.consWeightEvalForSeg( p_1, weight, this.ortho_dir, length, p, res);
        }

        return res;
    }


    /**
     * "Select" the part of a segment that is inside (in the homothetic space) of a clipping "sphere".
     *          This function use precomputed values given as parameter (prevent redundant computation during convolution
     *          computation for instance)
     *          This function is used in Eval function of CompactPolynomial kernel which use a different parametrization for a greater stability.
     *
     *
     *  @param {!THREE.Vector3} w special_coeff, x, y and z attributes must be defined
     *  @param {number} length
     *  @param {!Object} clipped Result if clipping occured, in l1 and l2, returned
     *                           values are between 0.0 and length/weight_min
     *
     *  @return {boolean} true if clipping occured
     *
     *  @protected
     */
    homotheticClippingSpecial(w, length, clipped)
    {
        // we search solution t \in [0,1] such that at^2-2bt+c<=0
        var a = -w.z;
        var b = -w.y;
        var c = -w.x;

        var delta = b*b - a*c;
        if(delta>=0.0)
        {
            var b_p_sqrt_delta = b+Math.sqrt(delta);
            if( (b_p_sqrt_delta<0.0) || (length*b_p_sqrt_delta<c) )
            {
                return false;
            }
            else
            {
                var main_root = c / b_p_sqrt_delta;
                clipped.l1 = (main_root<0.0) ? 0.0 : main_root;
                var a_r = a*main_root;
                clipped.l2 = (2.0*b<a_r+a*length) ? c/(a_r) : length;
                return true;
            }
        }
        return false;
    }

    /**
     *  @param {!THREE.Vector3} p_1
     *  @param {number} w_1
     *  @param {!THREE.Vector3} unit_dir
     *  @param {number} length
     *  @param {!THREE.Vector3} point
     *  @return {!Object} Object defining v attribute with the computed value
     *
     *  @protected
     */
    consWeightEvalForSeg( p_1, w_1, unit_dir, length, point, res) {
        var p_min_to_point = new THREE$c.Vector3();
        p_min_to_point.subVectors( point, p_1 );
        var uv = unit_dir.dot(p_min_to_point);
        var d2 = p_min_to_point.lengthSq();

        var special_coeff = new THREE$c.Vector3();
        special_coeff.set( w_1*w_1  - ScalisMath.KIS2 * d2,
                           - ScalisMath.KIS2 * uv,
                           - ScalisMath.KIS2 );
        var clipped = {l1: 0, l2:0};
        if(this.homotheticClippingSpecial(special_coeff, length, clipped))
        {
            var inv_local_min_weight = 1.0 / w_1;
            special_coeff.x = 1.0 - ScalisMath.KIS2 * ( clipped.l1*(clipped.l1-2.0*uv) + d2 ) * inv_local_min_weight*inv_local_min_weight;
            special_coeff.y = - ScalisMath.KIS2*(uv-clipped.l1) * inv_local_min_weight;

            res.v = this.homotheticCompactPolynomial_segment_F_i6_cste( (clipped.l2-clipped.l1) * inv_local_min_weight,
                                                                                                      special_coeff );
        }else {
            res = 0;
        }

        return res;
    }

    /**
     *  @param {!THREE.Vector3} p_1
     *  @param {number} w_1
     *  @param {!THREE.Vector3} unit_dir
     *  @param {number} length
     *  @param {!THREE.Vector3} point
     *  @return {!Object} Object defining v attribute with the computed value
     *
     *  @protected
     */
    consWeightEvalGradForSeg( p_1, w_1, unit_dir, length, point, res) {

        var p_min_to_point = new THREE$c.Vector3();
        p_min_to_point.subVectors( point, p_1 );
        var uv = unit_dir.dot(p_min_to_point);
        var d2 = p_min_to_point.lengthSq();

        var special_coeff = new THREE$c.Vector3();
        special_coeff.set( w_1*w_1  - ScalisMath.KIS2 * d2 ,
                           - ScalisMath.KIS2 * uv ,
                           - ScalisMath.KIS2 );
        var clipped = {l1: 0, l2:0};
        if(this.homotheticClippingSpecial(special_coeff, length, clipped))
        {
            var inv_local_min_weight = 1.0 / w_1;
            special_coeff.x = 1.0 - ScalisMath.KIS2 * ( clipped.l1*(clipped.l1-2.0*uv) + d2 ) * inv_local_min_weight*inv_local_min_weight;
            special_coeff.y = - ScalisMath.KIS2*(uv-clipped.l1) * inv_local_min_weight;

            var F0F1F2 = new THREE$c.Vector3();
            this.homotheticCompactPolynomial_segment_FGradF_i6_cste( (clipped.l2-clipped.l1) * inv_local_min_weight,
                                                                                                    special_coeff, F0F1F2);
            res.v = F0F1F2.x;
            F0F1F2.y *= inv_local_min_weight;
            var vect = unit_dir.clone();
            vect.multiplyScalar( F0F1F2.z + clipped.l1 * F0F1F2.y);
            p_min_to_point.multiplyScalar(- F0F1F2.y);
            p_min_to_point.addVectors(p_min_to_point,vect);
            res.g =  p_min_to_point.multiplyScalar(6.0*ScalisMath.KIS2*inv_local_min_weight);
        }else {
            res.v = 0;
            res.g.set(0,0,0);
        }

        return res;
    }

    /**
     *  @param {!THREE.Vector3} point the point of evaluation, as a THREE.Vector3
     *  @param {!Object} clipped Result if clipping occured, in l1 and l2, returned
     *                           values are between 0.0 and length/weight_min
     *  @return {boolean} true if clipping occured
     */
    ComputeTParam(point, clipped) {
        var p_min_to_point = new THREE$c.Vector3();
        p_min_to_point.subVectors( point, this.point_min );

        var coord_main_dir = p_min_to_point.dot(this.main_dir);
        var coord_normal   = p_min_to_point.dot(this.unit_normal);

        //WARNING : Assume that the compact support is defined in the same way as HomotheticCompactPolynomial kernels
        var dist_sqr = coord_main_dir*coord_main_dir + coord_normal*coord_normal;

        var special_coeff = new THREE$c.Vector3();
        special_coeff.set( this.weight_min*this.weight_min - ScalisMath.KIS2 * dist_sqr,
                          -this.unit_delta_weight*this.weight_min - ScalisMath.KIS2 * coord_main_dir,
                           this.unit_delta_weight*this.unit_delta_weight - ScalisMath.KIS2);

        return this.homotheticClippingSpecial(special_coeff, this.coord_max, clipped);
    }

    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param {number} l
     *  @param {!THREE.Vector3} w Some coefficient, as a THREE.Vector3
     *  @return {number} the value
     */
    homotheticCompactPolynomial_segment_F_i6_cste(l, w) {
        var t7068 = w.z;
        var t7078 = t7068 * l;
        var t7069 = w.y;
        var t7070 = w.x;
        var t2 = t7069 * t7069;
        var t7065 = t7068 * t7070 - t2;
        var t7067 = 0.1e1 / t7068;
        var t7077 = t7065 * t7067;
        var t7064 = t7070 + (-0.2e1 * t7069 + t7078) * l;
        var t7066 = t7078 - t7069;
        var t6 = t7064 * t7064;
        var t7076 = t7066 * t6;
        var t7 = t7070 * t7070;
        var t7075 = t7069 * t7;
        return  (0.6e1 / 0.5e1 * (0.4e1 / 0.3e1 * (0.2e1 * t7065 * l + t7066 * t7064 + t7069 * t7070) * t7077 + t7076 + t7075) * t7077 + t7064 * t7076 + t7070 * t7075) * t7067 / 0.7e1;
    }

    // optimized function for segment of constant weight
    // computes value and grad
    /**
     *  Sub-function for optimized convolution for segment of constant weight,
     *  value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param {number} l
     *  @param {!THREE.Vector3} res result in a THREE.Vector3
     *  @param {!THREE.Vector3} w a THREE.Vector3
     *
     */
    homotheticCompactPolynomial_segment_FGradF_i6_cste(l, w, res) {
        var t7086 = w.z;
        var t7095 = t7086 * l;
        var t7087 = w.y;
        var t7088 = w.x;
        var t2 = t7087 * t7087;
        var t7082 = t7086 * t7088 - t2;
        var t7084 = 0.1e1 / t7086;
        var t7094 = t7082 * t7084;
        var t7081 = t7088 + (-0.2e1 * t7087 + t7095) * l;
        var t7083 = t7095 - t7087;
        var t7089 = t7081 * t7081;
        var t7091 = t7088 * t7088;
        var t7079 = 0.4e1 / 0.3e1 * (0.2e1 * t7082 * l + t7083 * t7081 + t7087 * t7088) * t7094 + t7083 * t7089 + t7087 * t7091;
        var t7093 = t7079 * t7084 / 0.5e1;
        var t7085 = t7088 * t7091;
        var t7080 = t7081 * t7089;
        res.x = (0.6e1 / 0.5e1 * t7079 * t7094 + t7083 * t7080 + t7087 * t7085) * t7084 / 0.7e1;
        res.y = t7093;
        res.z = (t7087 * t7093 + t7080 / 0.6e1 - t7085 / 0.6e1) * t7084;
    }
}
Types$a.register(ScalisTriangle$1.type, ScalisTriangle$1);

var ScalisTriangle_1 = ScalisTriangle$1;

const Types$9 = Types_1;

/** @typedef {*} Json */

/**
 * @typedef {{type:string}} DistanceFunctorJSON
 */

/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @constructor
 */
class DistanceFunctor$2 {

    static type = "DistanceFunctor";

    /**
     *  @abstract
     *  @param {DistanceFunctorJSON} json Json description of the object
     */
    static fromJSON(json) {
        return Types$9.fromJSON(json);
    };

    /**
     *  @return {string} Type of the element
     */
    getType() {
        return DistanceFunctor$2.type;
    };

    /**
     *  @abstract
     *  Return a Javscript Object respecting JSON convention and can be used to serialize the functor.
     *  @returns {DistanceFunctorJSON}
     */
    toJSON() {
        return {
            type: this.getType()
        };
    };

    /**
     *  @abstract
     *  @param {number} _d The distance to be considered.
     *  @return {number} Scalar field value according to given distance d.
     */
    value(_d) {
        throw "Error : not implemented. Must be reimplemented in children classes.";
    };

    /**
     *  Perform a numerical approximation of the gradient according to epsilon.
     *  @param {number} d The distance to be considered.
     *  @param {number} epsilon The numerica step for this gradient computation. Default to 0.00001.
     */
    numericalGradient(d, epsilon) {
        var eps = epsilon ? epsilon : 0.00001;
        return (this.value(d + eps) - this.value(d - eps)) / (2 * eps);
    };

    /**
     *  Compute the gradient. Should be reimplemented in most cases.
     *  By default, this function return a numerical gradient with epsilon at 0.00001.
     *  @return {number} One dimensional gradient at d.
     */
    gradient(d) {
        return this.numericalGradient(d, 0.00001);
    };

    /**
     *  @returns {number} Distance above which all values will be 0. Should be reimplemented and default to infinity.
     */
    getSupport() {
        return Infinity;
    };


}
Types$9.register(DistanceFunctor$2.type, DistanceFunctor$2);

var DistanceFunctor_1 = DistanceFunctor$2;

const Types$8 = Types_1;
const DistanceFunctor$1 = DistanceFunctor_1;

/** @typedef {import('./DistanceFunctor').DistanceFunctorJSON} DistanceFunctorJSON */

/** @typedef {{scale:number} & DistanceFunctorJSON} Poly6DistanceFunctorJSON */

/**
 *  Specialised Distance Functor using a 6 degree polynomial function.
 *  This is the function similar to the one used in SCALIS primitives.
 *  @constructor
 */
class Poly6DistanceFunctor extends DistanceFunctor$1 {

    static type = "Poly6DistanceFunctor";

    /**
     * @param {Poly6DistanceFunctorJSON} json
     */
    static fromJSON(json) {
        return new Poly6DistanceFunctor(json.scale);
    }

    /**
     * This is the standard 6 degree polynomial function used for implicit modeling.
     * At 0, its value is 1 with a zero derivative.
     * At 1, its value is 0 with a zero derivative.
     * @param {number} d
     */
    static evalStandard(d) {
        if (d < 0.0) {
            return 1.0;
        }
        var aux = 1.0 - d * d;

        if (aux > 0.0) {
            return aux * aux * aux;
        } else {
            return 0.0;
        }
    }

    /**
     * @param {number} scale
     */
    constructor(scale) {
        super();
        this.scale = scale || 1.0;
    }

    /**
     *  @return {string} Type of the element
     */
    getType() {
        return Poly6DistanceFunctor.type;
    }

    /**
     *  @return {Object} Json description of this functor.
     */
    toJSON() {
        return {
            ...super.toJSON(),
            scale: this.scale
        };
    }

    /**
     * @link DistanceFunctor.value for a complete description.
     * @param {number} d The distance to be considered.
     * @returns {number} Scalar field value according to given distance d.
     */
    value(d) {
        var dp = d / (2 * this.scale); // ensure the support fits the scale.
        dp = dp + 0.5;
        return Poly6DistanceFunctor.evalStandard(dp) / Poly6DistanceFunctor.evalStandard(0.5);
    }

    /**
     * @param {number} d
     * @returns {number} dimensional gradient at d.
     */
    gradient(d) {
        var ds = d / (2 * this.scale) + 0.5;
        var res = (1 - ds * ds);
        res = -(6 / (2 * this.scale)) * ds * res * res / Poly6DistanceFunctor.evalStandard(0.5);
        return res;
    }

    /**
     * @link DistanceFunctor.getSupport for a complete description.
     * @returns
     */
    getSupport() {
        return this.scale;
    }
}
Types$8.register(Poly6DistanceFunctor.type, Poly6DistanceFunctor);

var Poly6DistanceFunctor_1 = Poly6DistanceFunctor;

const THREE$b = require$$0__default["default"];
const Node$1 = Node_1;
const Types$7 = Types_1;

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
class SDFNode$1 extends Node$1
{

    static type = "SDFNode";

    constructor(){
        super();

        // Default bounding box for a SDF is infinite.
        this.aabb.set(
            new THREE$b.Vector3( - Infinity, - Infinity, - Infinity ),
            new THREE$b.Vector3( + Infinity, + Infinity, + Infinity )
        );

        /** @type {Array<SDFNode|SDFPrimitive>} */
        this.children;
    }

    getType(){
        return SDFNode$1.type;
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
        let res = new THREE$b.Box3();
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
}
Types$7.register(SDFNode$1.type, SDFNode$1);


var SDFNode_1 = SDFNode$1;

const THREE$a = require$$0__default["default"];

const Element = Element_1;
const Types$6 = Types_1;

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
class SDFPrimitive$5 extends Element {

    static type = "SDFPrimitive";

    constructor() {
        super();
        // Default bounding box for a SDF is infinite.
        this.aabb.set(
            new THREE$a.Vector3(- Infinity, - Infinity, - Infinity),
            new THREE$a.Vector3(+ Infinity, + Infinity, + Infinity)
        );
    }

    /**
     * @return {string} Type of the element
     */
    getType() {
        return SDFPrimitive$5.type;
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
        return (new THREE$a.Box3()).makeEmpty()
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

Types$6.register(SDFPrimitive$5.type, SDFPrimitive$5);



var SDFPrimitive_1 = SDFPrimitive$5;

const THREE$9 = require$$0__default["default"];
const Types$5 = Types_1;
const SDFNode = SDFNode_1;
const Primitive = Primitive_1;
const Material$3 = Material_1;
const DistanceFunctor = DistanceFunctor_1;
const SDFPrimitive$4 = SDFPrimitive_1;

/** @typedef {import('../areas/Area')} Area */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('../Primitive.js').PrimitiveJSON} PrimitiveJSON */

/** @typedef {import('./SDFNode').SDFNodeJSON} SDFNodeJSON */
/** @typedef {import('./DistanceFunctor').DistanceFunctorJSON} DistanceFunctorJSON */


/** @typedef {{f:DistanceFunctorJSON, sdfRoot:SDFNodeJSON} & PrimitiveJSON} SDFRootNodeJSON */

/**
 *  This class implements a SDF Root Node, which is basically a Signed Distance Field
 *  made of some noe combination, on which is applied a compact support function.
 *  For now SDF nodes do not have materials. A unique material is defined in the SDFRootNode.
 *
 */
class SDFRootNode extends Primitive {

    static type = "SDFRootNode";

    /**
     *
     * @param {SDFRootNodeJSON} json
     * @returns
     */
    static fromJSON(json) {
        let f = Types$5.fromJSON(json.f);
        let material = Material$3.fromJSON(json.materials[0]);
        let sdfRoot = Types$5.fromJSON(json.sdfRoot);
        if (!(f instanceof DistanceFunctor)) {
            throw new Error("SDFRootNode parsing resulted in the wrong type of object for parameter f.");
        }
        if (!(material instanceof Material$3)) {
            console.error("SDFRootNode parsing resulted in the wrong type of object for parameter material, using default.");
            material = null;
        }
        if (!(sdfRoot instanceof SDFNode || sdfRoot instanceof SDFPrimitive$4)) {
            console.error("SDFRootNode parsing resulted in the wrong type of object for parameter sdfRoot, using default.");
            sdfRoot = null;
        }
        var res = new SDFRootNode(f, material, sdfRoot);
        return res;
    }

    /**
     *
     * @param {DistanceFunctor} f The distance function to be applied to the distance field.
     * It must respect the Blobtree convention, which is : positive everywhere, with a finite support.
     * @param {Material} material
     * @param {SDFNode | SDFPrimitive=} sdfRoot The child containng the complete SDF. SDFRootNode can have only one child.
     */
    constructor(f, material, sdfRoot)
    {
        super();

        this.f = f;

        this.materials.push(material ? material.clone() : new Material$3());

        this.sdfRoot = sdfRoot ?
            (sdfRoot instanceof SDFNode ? sdfRoot : new SDFNode().addChild(sdfRoot)) : new SDFNode();

        // Tmp vars to speed up computation (no reallocations)
        // TODO : should be pushed in the function static variables since there can be no SDFRoot below the SDFRoot.
        this.tmp_res = {v:0, g:null};
        this.tmp_g = new THREE$9.Vector3(0,0,0);
    }

    getType(){
        return SDFRootNode.type;
    };

    /**
     * @param {SDFNode | SDFPrimitive} c
     */
    addChild(c){
        if (this.sdfRoot.children.length === 0){
            this.sdfRoot.addChild.call(this,c);
        }else {
            throw "Error : SDFRootNode can have only one child.";
        }
    };

    /**
     * @param {SDFNode | SDFPrimitive} c
     */
    removeChild(c) {
        this.sdfRoot.removeChild(c);
    }

    /**
     * @returns {SDFRootNodeJSON}
     */
    toJSON(){
        var res = {
            ...super.toJSON(),
            f: this.f.toJSON(),
            sdfRoot: this.sdfRoot.toJSON()
        };
        return res;
    };

    prepareForEval()
    {
        if(!this.valid_aabb){
            this.aabb = new THREE$9.Box3();  // Create empty BBox
            for (let i = 0; i < this.sdfRoot.children.length; ++i){
                let c = this.sdfRoot.children[i];
                c.prepareForEval();
                this.aabb.union(
                    c.computeDistanceAABB(this.f.getSupport())
                );     // new aabb is computed according to remaining children aabb
            }

            this.valid_aabb = true;
        }
    };

    /**
     *  @link Element.getAreas for a complete description
     *
     *  This function is an attempt to have SDFRootNode behave like a Primitive in the normal Blobtree.
     *
     *  @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas() {
        if(!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid node";
        } else {
            let distAreas = this.sdfRoot.getDistanceAreas(this.f.getSupport());
            let res = [];
            distAreas.forEach((area) => {
                res.push({
                    aabb: area.aabb,
                    bv: area.bv,
                    obj: this
                });
            });
            return res;
        }
    };

    /**
     *  @link Node.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value(p,res)
    {
        var tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;

        // Init res
        res.v = 0;
        if(res.m)  {
            res.m.copy(Material$3.defaultMaterial);
        }if(res.g) ;else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that won't miss any 'min'
            res.step = 1000000000;
        }

        if(this.aabb.containsPoint(p)){
            this.sdfRoot.children[0].value(p,tmp);

            res.v = this.f.value(tmp.v);
            if(res.g){
                res.g.copy(tmp.g).multiplyScalar(this.f.gradient(res.v));
            }
            if(res.m){
                res.m.copy(this.materials[0]);
            }
        }
        else if (res.step !== undefined) {
            // return distance to aabb such that next time we'll hit from within the aabbb
            res.step = this.aabb.distanceToPoint(p) + 0.3;
        }
    };
}
Types$5.register(SDFRootNode.type, SDFRootNode);

var SDFRootNode_1 = SDFRootNode;

const THREE$8 = require$$0__default["default"];
const Types$4 = Types_1;
const SDFPrimitive$3 = SDFPrimitive_1;
const AreaSphere$1 = AreaSphere_1;

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
class SDFPoint extends SDFPrimitive$3 {

    static type = "SDFPoint";

    /**
     * @param {SDFPointJSON} json
     * @returns {SDFPoint}
     */
    static fromJSON(json) {
        return new SDFPoint(new THREE$8.Vector3(json.p.x, json.p.y, json.p.z), json.acc);
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
        return new THREE$8.Box3(
            this.p.clone().add(new THREE$8.Vector3(-d,-d,-d)),
            this.p.clone().add(new THREE$8.Vector3(d,d,d))
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
        }else {
            return [{
                aabb:this.computeDistanceAABB(d),
                bv: new AreaSphere$1(
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
        var v = new THREE$8.Vector3();

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


}

Types$4.register(SDFPoint.type, SDFPoint);


var SDFPoint_1 = SDFPoint;

const THREE$7 = require$$0__default["default"];
const Area = Area_1;
const Accuracies = Accuracies_1;

/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */

/**
 *  General representation of a "Capsule" area, ie, 2 sphere connected by a cone.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @extends {Area}
 *
 * @constructor
 */
class AreaCapsule$2 extends Area {

    /**
     *
     *  @param {!THREE.Vector3} p1     First point of the shape
     *  @param {!THREE.Vector3} p2     Second point of the shape
     *  @param {number}  r1 radius at p1
     *  @param {number}  r2 radius at p2
     *  @param {number}  accFactor1 Apply an accuracy factor to the standard one, around p1. Default to 1.
     *  @param {number}  accFactor2 Apply an accuracy factor to the standard one, around p2. Default to 1.
     *
     */
    constructor(p1, p2, r1, r2, accFactor1, accFactor2) {
        super();
        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.r1 = r1;
        this.r2 = r2;

        this.accFactor1 = accFactor1 || 1.0;
        this.accFactor2 = accFactor2 || 1.0;

        this.unit_dir = new THREE$7.Vector3().subVectors(p2, p1);
        this.length = this.unit_dir.length();
        this.unit_dir.normalize();

        // tmp var for functions below
        this.vector = new THREE$7.Vector3();
        this.p1_to_p = this.vector; // basically the same as above + smart name
        this.p1_to_p_sqrnorm = 0;
        this.x_p_2D = 0;
        this.y_p_2D = 0;
        this.y_p_2DSq = 0;
        this.ortho_vec_x = this.r1 - this.r2; // direction orthogonal to the "line" getting from one weight to the other. Precomputed
        this.ortho_vec_y = this.length;
        this.p_proj_x = 0;
        this.p_proj_y = 0;

        this.abs_diff_thick = Math.abs(this.ortho_vec_x);
    }

    /**
     * Compute some of the tmp variables.Used to factorized other functions code.
     * @param { !THREE.Vector3 } p A point as a THREE.Vector3
     *
     * @protected
     */
    proj_computation(p) {
        this.p1_to_p = this.vector;
        this.p1_to_p.subVectors(p, this.p1);
        this.p1_to_p_sqrnorm = this.p1_to_p.lengthSq();
        this.x_p_2D = this.p1_to_p.dot(this.unit_dir);
        // pythagore inc.
        this.y_p_2DSq = this.p1_to_p_sqrnorm - this.x_p_2D * this.x_p_2D;
        this.y_p_2D = this.y_p_2DSq > 0 ? Math.sqrt(this.y_p_2DSq) : 0; // because of rounded errors tmp can be <0 and this causes the next sqrt to return NaN...

        var t = -this.y_p_2D / this.ortho_vec_y;
        // P proj is the point at the intersection of:
        //              - the local X axis (computation in the unit_dir basis)
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        this.p_proj_x = this.x_p_2D + t * this.ortho_vec_x;
        this.p_proj_y = 0.0;
    };

    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @param {AreaSphereParam} sphere
     * @return {boolean} true if the sphere and the area intersect
     */
    sphereIntersect(sphere) {
        this.proj_computation(sphere.center);

        if (this.p_proj_x < 0.0) {
            return (Math.sqrt(this.p1_to_p_sqrnorm) - sphere.radius < this.r1);
        } else {
            if (this.p_proj_x > this.length) {
                this.vector.subVectors(sphere.center, this.p2);
                return (Math.sqrt(this.vector.lengthSq()) - sphere.radius < this.r2);
            } else {
                var sub1 = this.x_p_2D - this.p_proj_x;
                //var sub2 = this.y_p_2D-this.p_proj_y; //this.p_proj_y is set at 0 by definition
                //var dist = Math.sqrt(sub1*sub1 +this.y_p_2DSq);//sub2*sub2);
                var dist = sub1 * sub1 + this.y_p_2DSq;//sub2*sub2);
                var tt = this.p_proj_x / this.length;
                var inter_w = this.r1 * (1.0 - tt) + tt * this.r2;
                var tmp = sphere.radius + inter_w;
                //return (dist-sphere.radius < inter_w);
                return (dist < tmp * tmp);
            }
        }
    }

    /**
     * @link Area.contains for a complete description
     * @param {THREE.Vector3} p
     */
    contains(p) {
        this.proj_computation(p);
        // P proj is the point at the intersection of:
        //              - the X axis
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        if (this.p_proj_x < 0.0) {
            // Proj is before the line segment beginning defined by P0: spherical containment
            return this.p1_to_p_sqrnorm < this.r1 * this.r1;
        } else {
            if (this.p_proj_x > this.length) {
                // Proj is after the line segment beginning defined by P1: spherical containment
                this.vector.subVectors(p, this.p2);
                return this.vector.lengthSq() < this.r2 * this.r2;
            } else {
                // Proj is in between the line segment P1-P0: Linear kind of containment
                var sub1 = this.x_p_2D - this.p_proj_x;
                var sub2 = this.y_p_2D - this.p_proj_y;
                var dist2 = sub1 * sub1 + sub2 * sub2;
                var tt = this.p_proj_x / this.length;
                var inter_w = this.r1 * (1.0 - tt) + tt * this.r2;
                return dist2 < inter_w * inter_w;
            }
        }
    }

    /**
     *  @link Area.getAcc for a complete description
     *
     *  @return {number} the accuracy needed in the intersection zone
     *
     *  @param {AreaSphereParam} sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {number}  factor  the ratio to determine the wanted accuracy.
     *
     *  @todo Check the Maths
     */
    getAcc(sphere, factor) {
        this.proj_computation(sphere.center);

        // Thales between two triangles that have the same angles gives us the dist of:
        // side A = sphere.radius*this.abs_diff_thick/this.length;
        // Then pythagore this shit up as A² + sphere.radius² = delta²
        // i.e delta² = (sphere.radius*this.abs_diff_thick/this.length)² + sphere.radius²
        // <=> delta = sphere.radius*Math.sqrt(1+(this.abs_diff_thick/this.length)²);

        var tmp = this.abs_diff_thick / this.length;
        var half_delta = sphere.radius * Math.sqrt(1 + tmp * tmp) * 0.5;

        // we check only the direction where the weight is minimum since
        // we will return minimum accuracy needed in the area.
        var absc = this.p_proj_x;
        absc += this.r1 > this.r2 ? half_delta : -half_delta;

        if (absc < 0.0) {
            return this.r1 * this.accFactor1 * factor;
        } else if (absc > this.length) {
            return this.r2 * this.accFactor2 * factor;
        } else {

            var tt = absc / this.length;
            var inter_w = this.r1 * this.accFactor1 * (1.0 - tt) + tt * this.r2 * this.accFactor2;
            return inter_w * factor;
        }
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere) {
        return this.getAcc(sphere, Accuracies.nice);
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere) {
        return this.getAcc(sphere, Accuracies.curr);
    }

    /**
     *  @link Area.getRawAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere) {
        return this.getAcc(sphere, Accuracies.raw);
    }

    /**
     * @link Area.getMinAcc
     * @return {number}
     */
    getMinAcc() {
        return Accuracies.curr * Math.min(this.r1 * this.accFactor1, this.r2 * this.accFactor2);
    }

    /**
     * @link Area.getMinRawAcc
     * @return {number}
     */
    getMinRawAcc() {
        return Accuracies.raw * Math.min(this.r1 * this.accFactor1, this.r2 * this.accFactor2);
    }

    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param {string} axis x, y or z
     *  @param {number} t Coordinate on the axis
     *  @return {number} The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis, t) {
        var step = Number.MAX_VALUE;
        var p1 = this.p1[axis] < this.p2[axis] ? this.p1 : this.p2;
        var p2, r1, r2;
        if (p1 === this.p1) {
            p2 = this.p2;
            r1 = this.r1 * this.accFactor1;
            r2 = this.r2 * this.accFactor2;
        } else {
            p2 = this.p1;
            r1 = this.r2;
            r2 = this.r1 * this.accFactor1;
        }

        var diff = t - p1[axis];
        if (diff < -2 * r1) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * r1), Accuracies.curr * r1));
        } else if (diff < 2 * r1) {
            step = Math.min(step, Accuracies.curr * r1);
        }// else the sphere is behind us
        diff = t - p2[axis];
        if (diff < -2 * r2) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * r2), Accuracies.curr * r2));
        } else if (diff < 2 * r2) {
            step = Math.min(step, Accuracies.curr * r2);
        }// else the sphere is behind us

        var tbis = t - p1[axis];
        var axis_l = p2[axis] - p1[axis];
        if (tbis > 0 && tbis < axis_l && axis_l !== 0) {
            // t is in p1p2
            step = Math.min(step, Accuracies.curr * (r1 + (tbis / axis_l) * (r2 - r1)));
        }

        return step;
    }
}

var AreaCapsule_1 = AreaCapsule$2;

const THREE$6 = require$$0__default["default"];
const Types$3 = Types_1;
const SDFPrimitive$2 = SDFPrimitive_1;
const AreaCapsule$1 = AreaCapsule_1;

/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./SDFPrimitive').SDFPrimitiveJSON} SDFPrimitiveJSON */

/**
 * @typedef {{p1:{x:number,y:number,z:number},p2:{x:number,y:number,z:number}, acc:number} & SDFPrimitiveJSON} SDFSegmentJSON
 */

/**
 *
 *  @constructor
 *  @extends SDFPrimitive
 *
 *  @param {THREE.Vector3} p1 Position of the first segment extremity
 *  @param {THREE.Vector3} p2 Position of the second segment extremity
 *  @param {number} acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
 */
class SDFSegment extends SDFPrimitive$2  {

    static type = "SDFSegment";

    /**
     * @param {SDFSegmentJSON} json
     * @returns SDFSegment
     */
    static fromJSON(json) {
        return new SDFSegment(
            new THREE$6.Vector3(json.p1.x, json.p1.y, json.p1.z),
            new THREE$6.Vector3(json.p2.x, json.p2.y, json.p2.z),
            json.acc
        );
    };

    /**
     *
     * @param {THREE.Vector3} p1
     * @param {THREE.Vector3} p2
     * @param {number} acc
     */
    constructor(p1, p2, acc)
    {
        super();

        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.acc = acc || 1.0;

        // Helper for evaluation
        /** @type {THREE.Line3} */
        this.l = new THREE$6.Line3(this.p1, this.p2);
    }

    getType(){
        return SDFSegment.type;
    };

    /**
     *
     * @returns {SDFSegmentJSON}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            p1: {
                x: this.p1.x,
                y: this.p1.y,
                z: this.p1.z
            },
            p2: {
                x: this.p2.x,
                y: this.p2.y,
                z: this.p2.z
            },
            acc: this.acc
        }
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

    // [Abstract]
    computeDistanceAABB(d) {
        var b1 = new THREE$6.Box3(
            this.p1.clone().add(new THREE$6.Vector3(-d,-d,-d)),
            this.p1.clone().add(new THREE$6.Vector3(d,d,d))
        );
        var b2 = new THREE$6.Box3(
            this.p2.clone().add(new THREE$6.Vector3(-d,-d,-d)),
            this.p2.clone().add(new THREE$6.Vector3(d,d,d))
        );
        return b1.union(b2);
    };
    // [Abstract]
    prepareForEval() {
        if(!this.valid_aabb)
        {
            this.l.set(this.p1,this.p2);
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
        }else {
            return [{
                aabb:this.computeDistanceAABB(d),
                bv: new AreaCapsule$1(
                    this.p1,
                    this.p2,
                    d,
                    d,
                    this.acc,
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
        var v = new THREE$6.Vector3();
        var lc = new THREE$6.Vector3();
        /**
         *  @param {THREE.Vector3} p
         *  @param {ValueResultType} res
         */
        return function(p,res) {
            this.l.closestPointToPoint(p,true,v);
            res.v = lc.subVectors(p,v).length();
            if(res.g){
                res.g.copy(lc).divideScalar(res.v);
            }
        };
    })();

}

Types$3.register(SDFSegment.type, SDFSegment);


var SDFSegment_1 = SDFSegment;

const THREE$5 = require$$0__default["default"];
const Types$2 = Types_1;
const SDFPrimitive$1 = SDFPrimitive_1;
const AreaSphere = AreaSphere_1;

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
class SDFSphere extends SDFPrimitive$1 {

    static type = "SDFSphere";

    /**
     * @param {SDFSphereJSON} json
     * @returns
     */
    static fromJSON(json) {
        return new SDFSphere(new THREE$5.Vector3(json.p.x, json.p.y, json.p.z), json.r);
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
        return new THREE$5.Box3(
            this.p.clone().add(new THREE$5.Vector3(-this.r-d,-this.r-d,-this.r-d)),
            this.p.clone().add(new THREE$5.Vector3(this.r+d,this.r+d,this.r+d))
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
        }else {
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
        var v = new THREE$5.Vector3();
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
}
Types$2.register(SDFSphere.type, SDFSphere);


var SDFSphere_1 = SDFSphere;

const THREE$4 = require$$0__default["default"];
const Types$1 = Types_1;
const SDFPrimitive = SDFPrimitive_1;
const AreaCapsule = AreaCapsule_1;

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
            new THREE$4.Vector3(json.p1.x, json.p1.y, json.p1.z),
            new THREE$4.Vector3(json.p2.x, json.p2.y, json.p2.z),
            json.r1,
            json.r2
        );
    }

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
        this.unit_dir = new THREE$4.Vector3().subVectors(this.p2, this.p1);
        this.lengthSq = this.unit_dir.lengthSq();
        this.length = this.unit_dir.length();
        this.unit_dir.normalize();
    }

    /**
     *  @return {string} Type of the element
     */
    getType() {
        return SDFCapsule.type;
    }

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
    }

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
        var b1 = new THREE$4.Box3(
            this.p1.clone().add(new THREE$4.Vector3(-this.r1 - d, -this.r1 - d, -this.r1 - d)),
            this.p1.clone().add(new THREE$4.Vector3(this.r1 + d, this.r1 + d, this.r1 + d))
        );
        var b2 = new THREE$4.Box3(
            this.p2.clone().add(new THREE$4.Vector3(-this.r2 - d, -this.r2 - d, -this.r2 - d)),
            this.p2.clone().add(new THREE$4.Vector3(this.r2 + d, this.r2 + d, this.r2 + d))
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
        var v = new THREE$4.Vector3();
        var proj = new THREE$4.Vector3();
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
            var a = THREE$4.MathUtils.clamp(proj_x / self.length, 0, 1.0);
            proj.copy(self.p1).lerp(self.p2, a); // compute the actual 3D projection
            var l = v.subVectors(p, proj).length();
            res.v = l - (a * self.r2 + (1.0 - a) * self.r1);
            if (res.g) {
                res.g.copy(v).divideScalar(l);
            }
        };
    })();
}
Types$1.register(SDFCapsule.type, SDFCapsule);



var SDFCapsule_1 = SDFCapsule;

/**
 * @typedef {0|1|2|3|4|5|6|7} EdgeIndex
 * @typedef {[EdgeIndex, EdgeIndex]} EdgeIndexPair
 * @typedef {0|1} TopoValue
 * @typedef {[TopoValue, TopoValue, TopoValue]} TopoTriple
 */

/**
 * Tables for Marching Cube
 */
var Tables$2 = {
    //
    /**
     * edgevmap[i][0] = first vertex index of the ith edge of a cube
     * edgevmap[i][0] = second vertex index of the ith edge of a cube
     * @type {[
    *   EdgeIndexPair, EdgeIndexPair, EdgeIndexPair, EdgeIndexPair,
    *   EdgeIndexPair, EdgeIndexPair, EdgeIndexPair, EdgeIndexPair,
    *   EdgeIndexPair, EdgeIndexPair, EdgeIndexPair, EdgeIndexPair
     * ]}
     */
    EdgeVMap: [
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],

        [0, 2],
        [1, 3],
        [4, 6],
        [5, 7],

        [0, 1],
        [2, 3],
        [4, 5],
        [6, 7],
    ],

    /**
     * @type {[TopoTriple,TopoTriple,TopoTriple,TopoTriple,TopoTriple,TopoTriple,TopoTriple,TopoTriple]}
     */
    VertexTopo: [
        [0, 0, 0], //0 (MC = 0)
        [0, 0, 1], //1 (MC = 4)
        [0, 1, 0], //2 (MC = 3)
        [0, 1, 1], //3 (MC = 7)
        [1, 0, 0], //4 (MC = 1)
        [1, 0, 1], //5 (MC = 5)
        [1, 1, 0], //6 (MC = 2)
        [1, 1, 1]  //7 (MC = 6)
    ]
};

var MCTables = Tables$2;

const { Box2 } = require$$0__default["default"];
const THREE$3 = require$$0__default["default"];
const Material$2 = Material_1;
const Convergence$1 = Convergence_1;

const Tables$1 = MCTables;

/**
 * @typedef {import('../blobtree/RootNode')} RootNode
 */

/**
 * @typedef {Object} ConvergenceParams
 * @property {number=} ratio A ratio of a the marching cube grid size defining the wanted geometrical accuracy.
 *                           Must be lower than 1, default is 0.01 The maximum number of newton steps, default is 10.
 * @property {number=} step The newton process will stop either when the threshold of ratio*cube_size is matched, or the number of steps allowed has been reached.
 */

/**
 * @typedef {Object} VertexData
 * @property {Object} p
 * @property {number} p.x
 * @property {number} p.y
 * @property {number} p.z
 * @property {Object} n
 * @property {number} n.x
 * @property {number} n.y
 * @property {number} n.z
 * @property {Object} c
 * @property {number} c.r
 * @property {number} c.g
 * @property {number} c.b
 * @property {number} r
 * @property {number} m
 */

/**
 * @typedef {Object} ResultingGeometry
 * @property {Array<number>} position,
 * @property {Array<number>} normal
 * @property {Array<number>} color
 * @property {Array<number>} metalness
 * @property {Array<number>} roughness
 * @property {number} nVertices
 * @property {Array<number>} faces
 * @property {number} nFaces
 * @property {(data:VertexData) => void} addVertex
 * @property {(a:number, b:number, c:number) => void} addFace
 */

/**
 *  Axis Aligned Bounding Box in 2D carrying accuracy data
 *  @constructor
 *  @extends THREE.Box2
 */


class Box2Acc extends Box2 {

    /**
     *  @param {THREE.Vector2=} min Minimum x,y coordinate of the box
     *  @param {THREE.Vector2=} max Maximum x,y coordinate of the box
     *  @param {number=} nice_acc Nice accuracy in this box
     *  @param {number=} raw_acc Raw accuracy in this box
     */
    constructor(min, max, nice_acc, raw_acc) {
        super(min, max);

        var s = Math.max(this.max.x - this.min.x, this.max.y - this.min.y);

        /** @type {number} */
        this.nice_acc = 10000000;

        // Can nice_acc be 0 ? if yes we can simplify the next line
        if (nice_acc === undefined || nice_acc === null && s > 0) {
            this.nice_acc = s;
        } else {
            this.nice_acc = nice_acc;
        }
        this.raw_acc = this.raw_acc ? this.nice_acc : raw_acc;
         
    }
    /**
     *
     * @param {Box2Acc} box
     */
    unionWithAcc(box) {
        super.union(box);
        // Union of 2 boxes get the min acc for both
        this.raw_acc = Math.min(box.raw_acc, this.raw_acc);
        this.nice_acc = Math.min(box.nice_acc, this.nice_acc);
    }

    getRawAcc () {
        return this.raw_acc;
    };

    getNiceAcc () {
        return this.nice_acc;
    };

    setRawAcc (raw_acc) {
        this.raw_acc = Math.max(0, raw_acc);
    };

    setNiceAcc (nice_acc) {
        this.nice_acc = Math.max(0, nice_acc);
    };

    toString () {
        return (
            "(" +
            this.min.x.toFixed(2) +
            ", " +
            this.min.y.toFixed(2) +
            ") -> (" +
            this.max.x.toFixed(2) +
            ", " +
            this.max.y.toFixed(2) +
            ") "
        );
    };

    /**
     *  @param {number} min_x
     *  @param {number} min_y
     *  @param {number} max_x
     *  @param {number} max_y
     *  @param {number=} nice_acc
     *  @param {number=} raw_acc
     */
    setWithAcc(min_x, min_y, max_x, max_y, nice_acc, raw_acc) {
        this.min.set(min_x, min_y);
        this.max.set(max_x, max_y);
        if (nice_acc !== undefined) {
            this.nice_acc = nice_acc;
        }
        if (raw_acc !== undefined) {
            this.raw_acc = raw_acc;
        }
    };

    /**
     *  Get corner with the minimum coordinates
     *  @return {THREE.Vector2}
     */
    getMinCorner () {
        return this.min;
    };
}

/**
*  @typedef {Object} SMCParams Parameters and option for this polygonizer.
*  @property {string=} zResolution Defines how the stepping in z occurs. Options are :
*                                  "adaptive" (default) steps are computed according to local minimum accuracy.
*                                  "uniform" steps are uniform along z, according to the global minimum accuracy.
*  @property {number=} detailRatio The blobtree defines some needed accuracies for polygonizing.
*                                  However, if you want more details, you can set this to less than 1.
*                                  Note that this is limited to 0.01, which will already increase your model complexity by a 10 000 factor.
*  @property {(percent:number) => void=} progress Progress callback, taling a percentage as parameter.
*  @property {ConvergenceParams=} convergence Add newton convergence steps to position each vertex.
*  @property {number=} dichotomy NOT YET IMPLEMENTED Add dichotomy steps to position each vertex. Usually using convergence is better, except if the implicit
*                                field is such that congerging is not possible (for example, null gradients on large areas)
*/

/**
 *  Class for a dual marching cube using 2 sliding arrays.

 *  @constructor
 */

class SlidingMarchingCubes$2 {
    /**
     *  @param {RootNode} blobtree A blobtree to polygonize.
     *  @param {SMCParams} smcParams Parameters and option for this polygonizer
     */
    constructor(blobtree, smcParams) {
        if (!smcParams) {
            throw new Error("smcParams must be provided for SlidingMarchingCubes, to use all default values, please use {}");
        }

        /**
         * @type {RootNode}
         */
        this.blobtree = blobtree;

        /** @type {boolean} */
        this.uniformZ = smcParams.zResolution === "uniform" ? true : false;

        this.detail_ratio = smcParams.detailRatio
            ? Math.max(0.01, smcParams.detailRatio)
            : 1.0;

        if (smcParams.convergence) {
            this.convergence = smcParams.convergence;
            this.convergence.ratio = this.convergence.ratio || 0.01;
            this.convergence.step = this.convergence.step || 10;
        } else {
            this.convergence = null;
        }

        /** @type {(percent:number) => void} */
        this.progress = smcParams.progress
            ? smcParams.progress
            : function (_percent) {
                //console.log(percent);
            };

        /** @type {Int32Array} */
        this.reso = new Int32Array(3);
        /**
         * @type {{x:Float32Array, y:Float32Array, z:Float32Array}}
         */
        this.steps = {
            x: null,
            y: null,
            z: null
        };
        /** @type {!{x:number,y:number,z:number}} */
        this.curr_steps = {
            x: 0,
            y: 0,
            z: 0
        };
        // = this.curr_steps.x*this.curr_steps.y*this.curr_steps.z
        /** @type {number} */
        this.curr_step_vol = 0;

        /**
         *  Sliding values array
         *  @type {[Float32Array, Float32Array]}
         */
        this.values_xy = [null, null];
        /**
         *  Sliding values array
         *  @type {!Array.<Int32Array>}
         */
        this.vertices_xy = [null, null];
        this.areas = [];
        this.min_acc = 1;

        // Processing vars
        /** @type {Array<number>} */
        this.values = new Array(8);
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.mask = 0;
        /** @type {Array<boolean>} */
        this.edge_cross = [
            false, // Tables.EdgeVMap[0], x=1
            false,
            false,
            false,
            false, // edge 2 : Tables.EdgeVMap[4], y=1
            false,
            false,
            false,
            false, // edge 3 : Tables.EdgeVMap[8], z=1
            false,
            false,
            false
        ];

        /** @type {THREE.Vector3} */
        this.vertex = new THREE$3.Vector3(0, 0, 0); // vertex associated to the cell if any
        /** @type {THREE.Vector3} */
        this.vertex_n = new THREE$3.Vector3(0, 0, 0); // vertex normal
        /** @type {Material} */
        this.vertex_m = new Material$2(); // vertex material

        // Vars and tmp vars for extension checks
        /** @type {boolean} */
        this.extended = false;
        /** @type {THREE.Box3} */
        this.dis_o_aabb = new THREE$3.Box3();
        /** @type {THREE.Vector3} */
        this.ext_p = new THREE$3.Vector3();


   

        /**
         * Resulting mesh data
         * @type {ResultingGeometry}
         */
        this.geometry = null;


        // Ensure triangulation along min curvature edge 
        /** @type {boolean} */
        this.minCurvOrient = true;


        // Returns true if 123/143 split is along min curvature 
        /** @type {(v1:number,v2:number,v3:number,v4:number) => boolean} */
        this._isMinCurvatureTriangulation =  
        (function () 
        {     
            //Var and tmp var pre allocated and Scoped 
            //for optimization of triangulation criteria
            //assuming a v1v2v3v4 quad
            /** @type {THREE.Vector3} */
            let p1 = new THREE$3.Vector3(); //v1 position
            /** @type {THREE.Vector3} */
            let p2 = new THREE$3.Vector3(); //v2 position
            /** @type {THREE.Vector3} */
            let p3 = new THREE$3.Vector3(); //v3 position
            /** @type {THREE.Vector3} */
            let p4 = new THREE$3.Vector3(); //v4 position
            //Edges from v2
            /** @type {THREE.Vector3} */
            let pp_2_1 = new THREE$3.Vector3(); //v2v1 edge
            /** @type {THREE.Vector3} */                
            let pp_2_3 = new THREE$3.Vector3(); //v2v3 edge
            /** @type {THREE.Vector3} */                        
            let pp_2_4 = new THREE$3.Vector3(); //v2v4 edge
            //Edges from v4
            /** @type {THREE.Vector3} */
            let pp_4_1 = new THREE$3.Vector3(); //v4v1 edge
            /** @type {THREE.Vector3} */
            let pp_4_3 = new THREE$3.Vector3(); //v3v1 edge
            /** @type {THREE.Vector3} */
            let n_2 = new THREE$3.Vector3(); //123 normal
            /** @type {THREE.Vector3} */
            let n_4 = new THREE$3.Vector3(); //341 normal
            /** @type {THREE.Vector3} */
            let n_23 = new THREE$3.Vector3(); //234 normal
            /** @type {THREE.Vector3} */
            let n_42 = new THREE$3.Vector3(); //412 normal

            return function(v1,v2,v3,v4)
            {
                //Quad opposes v1 and v3 and v2 and v4
                //check min curvature
                p1.x = this.geometry.position[v1*3];
                p1.y = this.geometry.position[v1*3+ 1];             
                p1.z = this.geometry.position[v1*3 + 2];

                p2.x = this.geometry.position[v2*3];
                p2.y = this.geometry.position[v2*3+ 1]; 
                p2.z = this.geometry.position[v2*3+ 2];
            
                p3.x = this.geometry.position[v3*3];
                p3.y =this.geometry.position[v3*3+ 1]; 
                p3.z = this.geometry.position[v3*3+ 2];
                
                p4.x = this.geometry.position[v4*3];
                p4.y = this.geometry.position[v4*3+ 1]; 
                p4.z = this.geometry.position[v4*3+ 2];

                //Edges from v2        
                pp_2_1.subVectors(p1,p2);        
                pp_2_3.subVectors(p3,p2);
                pp_2_4.subVectors(p4,p2);

                //Edges from v4
                pp_4_1.subVectors(p1,p4);        
                pp_4_3.subVectors(p3,p4);

                //normal of 123 triangle
                n_2.copy(pp_2_3);
                n_2.cross(pp_2_1).normalize();

                //normal of 143 triangle
                n_4.copy(pp_4_1);
                n_4.cross(pp_4_3).normalize();

                //normal of 234 triangle 
                n_23.copy(pp_2_3);
                n_23.cross(pp_2_4).normalize();

                //normal of 214 triangle
                n_42.copy(pp_4_1);
                n_42.cross(pp_2_4.multiplyScalar(-1.0)).normalize();

                let dot_24 = n_2.dot(n_4);
                let dot_31 = n_23.dot(n_42);

                return dot_31  < dot_24;
            }
        })();
    }

    /**
     *  Initialize the internal Geometry structure.
     *  @private
     */
    initGeometry () {
        this.geometry = {
            position: [],
            normal: [],
            color: [],
            metalness: [],
            roughness: [],
            nVertices: 0,
            faces: [],
            nFaces: 0,
            addVertex: function (data) {
                this.position.push(data.p.x, data.p.y, data.p.z);
                this.normal.push(data.n.x, data.n.y, data.n.z);
                this.color.push(data.c.r, data.c.g, data.c.b);
                this.roughness.push(data.r);
                this.metalness.push(data.m);
                this.nVertices++;
            },
            addFace: function (a, b, c) {
                this.faces.push(a, b, c);
                this.nFaces++;
            }
        };
    }

    /**
     *  Build the resulting BufferGeometry from current values in this.geometry.
     *  used in compute function.
     *  @private
     */
    buildResultingBufferGeometry () {
        var res = new THREE$3.BufferGeometry();
        res.setAttribute(
            "position",
            new THREE$3.BufferAttribute(new Float32Array(this.geometry.position), 3)
        );
        res.setAttribute(
            "normal",
            new THREE$3.BufferAttribute(new Float32Array(this.geometry.normal), 3)
        );
        res.setAttribute(
            "color",
            new THREE$3.BufferAttribute(new Float32Array(this.geometry.color), 3)
        );
        res.setAttribute(
            "roughness",
            new THREE$3.BufferAttribute(new Float32Array(this.geometry.roughness), 1)
        );
        res.setAttribute(
            "metalness",
            new THREE$3.BufferAttribute(new Float32Array(this.geometry.metalness), 1)
        );

        res.setIndex(
            new THREE$3.BufferAttribute(
                this.geometry.nVertices > 65535
                    ? new Uint32Array(this.geometry.faces)
                    : new Uint16Array(this.geometry.faces),
                1
            )
        );

        return res;
    }

    /**
     *  Set values in this.values_xy[1] to 0
     *  @private
     */
    setFrontToZero () {
        // init to 0, can be omptim later
        for (let i = 0; i < this.values_xy[1].length; ++i) {
            this.values_xy[1][i] = 0;
        }
    }

    /**
     *  Set values in this.values_xy[1] to -1.
     *  -1 is a marker to state the value has not been computed nor interpolated
     *  @private
     */
    setFrontToMinus() {
        // init to 0, can be omptim later
        for (let i = 0; i < this.values_xy[1].length; ++i) {
            this.values_xy[1][i] = -1;
        }
    }

    /**
     *  Set values in this.values_xy[1] to 0 wherever it is -1.
     *  @private
     */
    setFrontToZeroIfMinus() {
        // init to 0, can be omptim later
        for (let i = 0; i < this.values_xy[1].length; ++i) {
            if (this.values_xy[1][i] === -1) {
                this.values_xy[1][i] = 0;
            }
        }
    }

    /**
     *  Perform bilinear interpolation in a given 2D box to set values in front array
     *
     *  @param {number} cx Coordinate x of bottom left corner of the front array
     *  @param {number} cy Coordinate x of bottom left corner of the front array
     *  @param {number} cz Coordinate x of bottom left corner of the front array
     *
     *  @param {number} x0 Lower x box osition in the array
     *  @param {number} x1 Upper x box position in the array
     *  @param {number} y0 Lower y box position in the array
     *  @param {number} y1 Upper y box position in the array
     *
     *  @private
     */
    interpolateInBox(
        cx,
        cy,
        cz,
        x0,
        x1,
        y0,
        y1
    ) {
        let varr = this.values_xy[1];

        let nx = x1 - x0;
        let ny = y1 - y0;

        /*
        this.computeFrontValAtBoxCorners(cx,cy,cz, new THREE.Vector2(x0,y0), new THREE.Vector2(x1,y1));
        var mask = this.computeBoxMask(new THREE.Vector2(x0,y0), new THREE.Vector2(x1,y1));
        if(!(mask === 0xf || mask === 0x0)){
            throw "Error bad mask when interpolating";
        }
        */

        if (nx > 1) {
            // must interpolate
            let line = y0 * this.reso[0];
            let val0 = varr[line + x0];
            let v_step = (varr[line + x1] - val0) / nx;
            for (var i = 1; i < nx; ++i) {
                if (varr[line + x0 + i] === -1) {
                    varr[line + x0 + i] = val0 + i * v_step;
                    //this.computeFrontValAt(cx,cy,cz,x0+i,y0);
                }
            }
        }

        if (ny > 1) {
            // compute upper line
            let line = y1 * this.reso[0];
            let val0 = varr[line + x0];
            let v_step = (varr[line + x1] - val0) / nx;
            for (let i = 1; i < nx; ++i) {
                if (varr[line + x0 + i] === -1) {
                    varr[line + x0 + i] = val0 + i * v_step;
                    //this.computeFrontValAt(cx,cy,cz,x0+i,y1);
                }
            }

            for (let i = 0; i <= nx; ++i) {
                val0 = varr[y0 * this.reso[0] + x0 + i];
                v_step = (varr[y1 * this.reso[0] + x0 + i] - val0) / ny;
                for (var k = 1; k < ny; ++k) {
                    if (varr[(y0 + k) * this.reso[0] + x0 + i] === -1) {
                        varr[(y0 + k) * this.reso[0] + x0 + i] = val0 + k * v_step;
                        //if(i===0 || i==nx){
                        //    this.computeFrontValAt(cx,cy,cz,x0+i,(y0+k));
                        //}
                    }
                }
            }
        }
    }

    /**
     *  Compute blobtree value at a given position in the front sliding array.
     *
     *  @param {number} cx Coordinate x of bottom left corner of the front array
     *  @param {number} cy Coordinate x of bottom left corner of the front array
     *  @param {number} cz Coordinate x of bottom left corner of the front array
     *
     *  @param {number} x X position in the array
     *  @param {number} y Y position in the array
     *
     *  @private
     */
    computeFrontValAt(cx, cy, cz, x, y) {
        this.computeFrontValAtClosure(cx, cy, cz, x, y);
    };

    /**
     *  Function using closure to have static variable. Wrapped in computeFrontValAt
     *  for profiling purpose.
     */
    computeFrontValAtClosure = (function () {
        var eval_res = { v: 0 };
        var p = new THREE$3.Vector3();
        return function (cx, cy, cz, x, y) {
            /** @type {SlidingMarchingCubes} */
            let self = this;
            var index = y * self.reso[0] + x;
            eval_res.v = self.blobtree.getNeutralValue();
            if (self.values_xy[1][index] === -1) {
                p.set(cx + x * self.min_acc, cy + y * self.min_acc, cz);
                self.blobtree.value(p, eval_res);
                self.values_xy[1][index] = eval_res.v;
            }
        };
    })();

    /**
     *  Compute corner values in the front buffer in 2D box defined by min,max
     *  @param {number} cx X coordinate of the front buffer corner
     *  @param {number} cy Y coordinate of the front buffer corner
     *  @param {number} cz Z coordinate of the front buffer corner
     *  @param {!THREE.Vector2} min 2D box min
     *  @param {!THREE.Vector2} max 2D box max
     */
    computeFrontValAtBoxCorners (
        cx,
        cy,
        cz,
        min,
        max
    ) {
        this.computeFrontValAt(cx, cy, cz, min.x, min.y);
        this.computeFrontValAt(cx, cy, cz, min.x, max.y);
        this.computeFrontValAt(cx, cy, cz, max.x, min.y);
        this.computeFrontValAt(cx, cy, cz, max.x, max.y);
    };

    /**
     *  Compute all values in the front buffer in 2D box defined by min,max
     *  @param {number} cx X coordinate of the front buffer corner
     *  @param {number} cy Y coordinate of the front buffer corner
     *  @param {number} cz Z coordinate of the front buffer corner
     *  @param {!THREE.Vector2} min 2D box min
     *  @param {!THREE.Vector2} max 2D box max
     */
    computeFrontValInBox(
        cx,
        cy,
        cz,
        min,
        max
    ) {
        for (var xx = min.x; xx <= max.x; ++xx) {
            for (var yy = min.y; yy <= max.y; ++yy) {
                this.computeFrontValAt(cx, cy, cz, xx, yy);
            }
        }
    };

    /**
     *  Set all values in 2D box min,max at 0.
     *  @param {!THREE.Vector2} min 2D box min
     *  @param {!THREE.Vector2} max 2D box max
     */
    setFrontValZeroInBox(min, max) {
        for (var ix = min.x; ix <= max.x; ++ix) {
            for (var iy = min.y; iy <= max.y; ++iy) {
                this.values_xy[1][iy * this.reso[0] + ix] = 0;
            }
        }
    };

    /**
     *  Compute 2D mask of a given 2D box. Mask is an hex integer unique for each
     *  combination of iso value crossing (like in 3D marching cubes, but in 2D).
     *  @param {!THREE.Vector2} min 2D box min
     *  @param {!THREE.Vector2} max 2D box max
     *  @return {number} The mask
     */
    computeBoxMask(min, max) {
        var mask = 0;
        mask |=
            this.values_xy[1][min.y * this.reso[0] + min.x] >
                this.blobtree.getIsoValue()
                ? 1 << 0
                : 0;
        mask |=
            this.values_xy[1][min.y * this.reso[0] + max.x] >
                this.blobtree.getIsoValue()
                ? 1 << 1
                : 0;
        mask |=
            this.values_xy[1][max.y * this.reso[0] + max.x] >
                this.blobtree.getIsoValue()
                ? 1 << 2
                : 0;
        mask |=
            this.values_xy[1][max.y * this.reso[0] + min.x] >
                this.blobtree.getIsoValue()
                ? 1 << 3
                : 0;
        return mask;
    };

    /**
     *  Return 0 if and only if all coners value of 2D box min,max are 0
     *  @param {!THREE.Vector2} min 2D box min
     *  @param {!THREE.Vector2} max 2D box max
     *  @return {number}
     */
    checkZeroBox(min, max) {
        return (
            this.values_xy[1][min.y * this.reso[0] + min.x] +
            this.values_xy[1][min.y * this.reso[0] + max.x] +
            this.values_xy[1][max.y * this.reso[0] + max.x] +
            this.values_xy[1][max.y * this.reso[0] + min.x]
        );
    };

    /**
     *  Recursive function computing values in the given 2D box (which is a subbox
     *  of the whole front buffer), by cuting in 2 at each step. This function is
     *  "smart", since computed boxes are buid with their scalar field accuracy.
     *  Depending on the accuracy, scalar field values may be computed from the
     *  blobtree or interpolated (linear).
     *  @param {number} cx X coordinate of the front buffer corner
     *  @param {number} cy Y coordinate of the front buffer corner
     *  @param {number} cz Z coordinate of the front buffer corner
     *  @param {!Array.<!Box2Acc>} boxes2D 2D boxes intersecting box. Used to compute accuracy for split boxes.
     *  @param {!Box2Acc} box The 2D box in which we compute values
     */
    recursiveBoxComputation(
        cx,
        cy,
        cz,
        box,
        boxes2D
    ) {
        // split the current box in 2 boxes in the largest dimension

        var new_boxes = null;
        var diff = new THREE$3.Vector2(
            Math.round(box.max.x - box.min.x),
            Math.round(box.max.y - box.min.y)
        );

        if (diff.x > 1 && diff.x >= diff.y) {
            // cut in x
            var x_cut = box.min.x + Math.floor(diff.x / 2);
            new_boxes = [
                new Box2Acc(
                    box.min,
                    new THREE$3.Vector2(x_cut, box.max.y),
                    10000,
                    10000
                ),
                new Box2Acc(
                    new THREE$3.Vector2(x_cut, box.min.y),
                    box.max,
                    10000,
                    10000
                )
            ];
            this.computeFrontValAt(cx, cy, cz, x_cut, box.min.y);
            this.computeFrontValAt(cx, cy, cz, x_cut, box.max.y);
            //this.computeFrontValAt(cx,cy,cz, x_cut+1, box.min.y);
            //this.computeFrontValAt(cx,cy,cz, x_cut+1, box.max.y);
        } else {
            // cut in y
            if (diff.y > 1) {
                var y_cut = box.min.y + Math.floor(diff.y / 2);
                new_boxes = [
                    new Box2Acc(
                        box.min,
                        new THREE$3.Vector2(box.max.x, y_cut),
                        10000,
                        10000
                    ),
                    new Box2Acc(
                        new THREE$3.Vector2(box.min.x, y_cut),
                        box.max,
                        10000,
                        10000
                    )
                ];
                this.computeFrontValAt(cx, cy, cz, box.min.x, y_cut);
                this.computeFrontValAt(cx, cy, cz, box.max.x, y_cut);
                //this.computeFrontValAt(cx,cy,cz, box.min.x, y_cut+1);
                //this.computeFrontValAt(cx,cy,cz, box.max.x, y_cut+1);
            } else {
                // the box is 1 in size, so we stop
                return;
            }
        }
        /*
        if(new_boxes[0].intersectsBox(new_boxes[1])){
            console.log("Fucking shit");
        }
        */

        // Compute accuracies for each box
        var boxes2D_rec = [[], []];
        for (var i = 0; i < boxes2D.length; ++i) {
            for (var k = 0; k < new_boxes.length; ++k) {
                if (new_boxes[k].intersectsBox(boxes2D[i])) {
                    new_boxes[k].setRawAcc(
                        Math.min(new_boxes[k].getRawAcc(), boxes2D[i].getRawAcc())
                    );
                    new_boxes[k].setNiceAcc(
                        Math.min(new_boxes[k].getNiceAcc(), boxes2D[i].getNiceAcc())
                    );
                    boxes2D_rec[k].push(boxes2D[i]);
                }
            }
        }

        for (let k = 0; k < new_boxes.length; ++k) {
            let b = new_boxes[k];

            let bsize = b.getSize(new THREE$3.Vector2());

            if (boxes2D_rec[k].length === 0) {
                this.setFrontValZeroInBox(b.min, b.max);
            } else {
                if (bsize.x <= b.getRawAcc() && bsize.y <= b.getRawAcc()) {
                    // We reach the raw level
                    let mask = this.computeBoxMask(b.min, b.max);
                    if (mask === 0xf || mask === 0x0) {
                        // all points are inside, since we reached raw, we can interpolate
                        // Note when all values are very close to 0, it's useless to interpolate, setting 0 can do.
                        this.interpolateInBox(
                            cx,
                            cy,
                            cz,
                            b.min.x,
                            b.max.x,
                            b.min.y,
                            b.max.y
                        );

                        // OR just compute all values.
                        // this.computeFrontValInBox(cx,cy,cz,b.min,b.max);
                    } else {
                        //Surface is crossed, must go down to the nice
                        if (
                            bsize.x <= b.getNiceAcc() &&
                            bsize.y <= b.getNiceAcc()
                        ) {
                            // We are under nice acc, just interpolate
                            this.interpolateInBox(
                                cx,
                                cy,
                                cz,
                                b.min.x,
                                b.max.x,
                                b.min.y,
                                b.max.y
                            );

                            // OR just compute all values.
                            // this.computeFrontValInBox(cx,cy,cz,b.min,b.max);
                        } else {
                            this.recursiveBoxComputation(
                                cx,
                                cy,
                                cz,
                                b,
                                boxes2D_rec[k]
                            );
                            //console.log("going down in " + b.toString());
                        }
                    }
                } else {
                    // we did not reach the raw level, so we must cut again
                    this.recursiveBoxComputation(cx, cy, cz, b, boxes2D_rec[k]);
                }
            }
        }
    };

    /**
     *  Compute all values in the front buffer.
     *  @param {number} cx X coordinate of the front buffer corner
     *  @param {number} cy Y coordinate of the front buffer corner
     *  @param {number} cz Z coordinate of the front buffer corner
     */
    computeFrontValues(cx, cy, cz) {
        this.setFrontToMinus();

        var areas = this.blobtree.getAreas();
        var bigbox = new Box2Acc();
        bigbox.makeEmpty();
        var boxes2D = [];
        for (var i = 0; i < areas.length; ++i) {
            var raw_acc = Math.round(
                (areas[i].bv.getMinRawAcc() * this.detail_ratio) / this.min_acc
            );
            var nice_acc = Math.round(
                (areas[i].bv.getMinAcc() * this.detail_ratio) / this.min_acc
            );
            var x_min = Math.max(
                0,
                Math.floor((areas[i].aabb.min.x - cx) / this.min_acc)
            );
            var y_min = Math.max(
                0,
                Math.floor((areas[i].aabb.min.y - cy) / this.min_acc)
            );
            var x_max = Math.min(
                this.reso[0] - 1,
                Math.ceil((areas[i].aabb.max.x - cx) / this.min_acc)
            );
            var y_max = Math.min(
                this.reso[1] - 1,
                Math.ceil((areas[i].aabb.max.y - cy) / this.min_acc)
            );
            boxes2D.push(
                new Box2Acc(
                    new THREE$3.Vector2(x_min, y_min),
                    new THREE$3.Vector2(x_max, y_max),
                    nice_acc,
                    raw_acc
                )
            );
            bigbox.unionWithAcc(boxes2D[boxes2D.length - 1]);
        }

        bigbox.intersect(
            new Box2Acc(
                new THREE$3.Vector2(0, 0),
                new THREE$3.Vector2(this.reso[0], this.reso[1]),
                bigbox.getNiceAcc(),
                bigbox.getRawAcc()
            )
        );

        this.computeFrontValAtBoxCorners(cx, cy, cz, bigbox.min, bigbox.max);
        this.recursiveBoxComputation(cx, cy, cz, bigbox, boxes2D);

        this.setFrontToZeroIfMinus();
    };

    /**
     *   get the min accuracy needed for this zone
     *   @param {THREE.Box3} bbox the zone for which we want the minAcc
     *   @return {number} the min acc for this zone
     */
    getMinAcc(bbox) {
        var areas = this.blobtree.getAreas();
        var minAcc = Number.MAX_VALUE;

        for (var i = 0; i < areas.length; i++) {
            var area = areas[i];
            if (area.aabb.intersectsBox(bbox)) {
                if (area.bv) {
                    // it's a new area, we can get the min acc
                    var areaMinAcc = area.bv.getMinAcc();
                    if (areaMinAcc < minAcc) {
                        minAcc = areaMinAcc;
                    }
                }
            }
        }
        return minAcc * this.detail_ratio;
    };

    /**
     *   get the max accuracy needed for this zone
     *   @param {THREE.Box3} bbox the zone for which we want the minAcc
     *   @return {number} the max acc for this zone
     */
    getMaxAcc(bbox) {
        var areas = this.blobtree.getAreas();
        var maxAcc = 0;

        for (var i = 0; i < areas.length; i++) {
            var area = areas[i];
            if (area.aabb.intersectsBox(bbox)) {
                if (area.bv) {
                    // it's a new area, we can get the min acc
                    var areaMaxAcc = area.bv.getMinAcc();
                    if (areaMaxAcc > maxAcc) {
                        maxAcc = areaMaxAcc;
                    }
                }
            }
        }
        return maxAcc * this.detail_ratio;
    }

    /**
     *  Note : returned mesh data will be accurate only if extened AABB difference
     *  with o_aabb is small. compared to o_aabb size.
     *  @param {THREE.Box3} o_aabb The aabb where to compute the surface, if null, the blobtree AABB will be used
     *  @param {boolean=} extended True if we want the agorithm to extend the computation zone
     *                            to ensure overlap with a mesh resulting from a computation
     *                            in a neighbouring aabb (Especially usefull for parallelism).
     */
    compute(o_aabb, extended) {
        this.initGeometry();

        var timer_begin = new Date().getTime();

        this.blobtree.prepareForEval();
        var aabb = null;
        if (o_aabb) {
            aabb = o_aabb.clone();
        } else {
            aabb = this.blobtree.getAABB();
        }

        this.extended = extended !== undefined ? extended : false;

        if (this.extended) {
            let adims = aabb.getSize(new THREE$3.Vector3());
            let minAcc = Math.min(
                Math.min(this.getMinAcc(aabb), adims[0]),
                Math.min(adims[1], adims[2])
            );
            let acc_box = aabb.clone();
            let final_bbox = aabb.clone();
            let axis = ["x", "y", "z"];
            for (let k = 0; k < axis.length; ++k) {
                acc_box.max[axis[k]] = aabb.min[axis[k]] + minAcc;
                let slice_max = this.getMaxAcc(acc_box);
                if (slice_max !== 0) {
                    final_bbox.min[axis[k]] = final_bbox.min[axis[k]] - slice_max;
                }
                acc_box.max[axis[k]] = aabb.max[axis[k]] - minAcc;
                slice_max = this.getMaxAcc(acc_box);
                if (slice_max !== 0) {
                    final_bbox.max[axis[k]] = final_bbox.max[axis[k]] + slice_max;
                }
            }
            aabb.copy(final_bbox);
        }

        var aabb_trim = [];
        var aabb_trim_parents = [];
        if (o_aabb) {
            this.blobtree.externalTrim(aabb, aabb_trim, aabb_trim_parents);
            this.blobtree.prepareForEval();
        }

        this.areas = this.blobtree.getAreas();

        // if no areas, blobtree is empty so stop and send an empty mesh.
        if (this.areas.length === 0) {
            this.progress(100);
            return new THREE$3.BufferGeometry();
        }

        this.min_acc = this.areas.length !== 0 ? this.areas[0].bv.getMinAcc() : 1;
        for (let i = 0; i < this.areas.length; ++i) {
            if (this.areas[i].bv.getMinAcc() < this.min_acc) {
                this.min_acc = this.areas[i].bv.getMinAcc();
            }
        }
        this.min_acc = this.min_acc * this.detail_ratio;

        var corner = aabb.min;
        var dims = aabb.getSize(new THREE$3.Vector3());

        this.steps.z = new Float32Array(Math.ceil(dims.z / this.min_acc) + 2);
        this.steps.z[0] = corner.z;
        var index = 1;
        var areas = this.blobtree.getAreas();
        while (this.steps.z[index - 1] < corner.z + dims.z) {
            var min_step = dims.z;
            // If uniformZ is true, we do not adapt z stepping to local slice accuracy.
            if (this.uniformZ) {
                min_step = this.min_acc;
            } else {
                // find minimum accuracy needed in this slice.
                for (let i = 0; i < areas.length; ++i) {
                    min_step = Math.min(
                        min_step,
                        areas[i].bv.getAxisProjectionMinStep(
                            "z",
                            this.steps.z[index - 1]
                        ) * this.detail_ratio
                    );
                }
            }
            this.steps.z[index] = this.steps.z[index - 1] + min_step;
            index++;
        }
        this.reso[2] = index;

        this.reso[0] = Math.ceil(dims.x / this.min_acc) + 2;
        this.reso[1] = Math.ceil(dims.y / this.min_acc) + 2;

        // If necessary, set this.dis_o_aabb
        // Reminder : dis_o_aabb is the discret o_aabb, ie indices for which we are in the o_aabb.
        if (this.extended) {
            var i = 0;
            this.dis_o_aabb.set(
                new THREE$3.Vector3(-1, -1, -1),
                new THREE$3.Vector3(-1, -1, -1)
            );
            while (i < this.reso[2] && this.dis_o_aabb.min.z === -1) {
                if (this.steps.z[i] >= o_aabb.min.z) {
                    this.dis_o_aabb.min.z = i;
                }
                i++;
            }
            if (i > this.reso[2] - 1) {
                this.dis_o_aabb.min.z = this.reso[2] - 1;
            } // should never happen

            i = this.reso[2] - 1;
            while (i >= 0 && this.dis_o_aabb.max.z === -1) {
                if (this.steps.z[i] < o_aabb.max.z) {
                    this.dis_o_aabb.max.z = i;
                }
                i--;
            }
            if (i < 0) {
                this.dis_o_aabb.max.z = 0;
            } // should never happen

            this.dis_o_aabb.min.x = Math.round(
                (o_aabb.min.x - aabb.min.x) / this.min_acc
            );
            this.dis_o_aabb.min.y = Math.round(
                (o_aabb.min.y - aabb.min.y) / this.min_acc
            );
            this.dis_o_aabb.max.x =
                this.reso[0] -
                2 -
                Math.round((aabb.max.x - o_aabb.max.x) / this.min_acc);
            this.dis_o_aabb.max.y =
                this.reso[1] -
                2 -
                Math.round((aabb.max.y - o_aabb.max.y) / this.min_acc);
        }
        // Back values
        this.values_xy[0] = new Float32Array(this.reso[0] * this.reso[1]);
        // Front values
        this.values_xy[1] = new Float32Array(this.reso[0] * this.reso[1]);

        this.vertices_xy[0] = new Int32Array(this.reso[0] * this.reso[1]);
        this.vertices_xy[1] = new Int32Array(this.reso[0] * this.reso[1]);

        // Aabb for trimming the blobtree
        var trim_aabb = new THREE$3.Box3();
        this.computeFrontValues(corner.x, corner.y, corner.z);

        var percent = 0;

        for (var iz = 0; iz < this.reso[2] - 1; ++iz) {
            // Switch the 2 arrays, and fill the one in front
            let valuesSwitcher = this.values_xy[0];
            this.values_xy[0] = this.values_xy[1];
            this.values_xy[1] = valuesSwitcher;
            let verticesSwitcher = this.vertices_xy[0];
            this.vertices_xy[0] = this.vertices_xy[1];
            this.vertices_xy[1] = verticesSwitcher;

            var z1 = this.steps.z[iz + 1];
            trim_aabb.set(
                new THREE$3.Vector3(corner.x, corner.y, z1 - this.min_acc / 64),
                new THREE$3.Vector3(
                    corner.x + this.reso[0] * this.min_acc,
                    corner.y + this.reso[1] * this.min_acc,
                    z1 + this.min_acc / 64
                )
            );
            this.blobtree.internalTrim(trim_aabb);
            this.blobtree.prepareForEval();
            this.computeFrontValues(corner.x, corner.y, z1);
            this.blobtree.internalUntrim();
            this.blobtree.prepareForEval();

            this.z = this.steps.z[iz];

            this.curr_steps.z = this.steps.z[iz + 1] - this.steps.z[iz];
            this.curr_steps.x = this.min_acc;
            this.curr_steps.y = this.min_acc;
            this.curr_step_vol =
            this.curr_steps.x * this.curr_steps.y * this.curr_steps.z;
                        
            for (var iy = 0; iy < this.reso[1] - 1; ++iy) {
                for (var ix = 0; ix < this.reso[0] - 1; ++ix) {
                    this.y = corner.y + iy * this.min_acc;
                    this.fetchAndTriangulate(ix, iy, iz, corner);
                }
            }

            if (Math.round((100 * iz) / this.reso[2]) > percent) {
                percent = Math.round((100 * iz) / this.reso[2]);
                this.progress(percent);
            }
        }

        if (o_aabb) {
            this.blobtree.untrim(aabb_trim, aabb_trim_parents);
            this.blobtree.prepareForEval();
        }

        var timer_end = new Date().getTime();
        console.log(
            "Sliding Marching Cubes computed in " + (timer_end - timer_begin) + "ms"
        );

        // Clear memory, in case this object is kept alive
        this.values_xy[0] = null;
        this.values_xy[1] = null;
        this.vertices_xy[0] = null;
        this.vertices_xy[1] = null;

        this.progress(100);

        return this.buildResultingBufferGeometry();
    };

    /**
     *  Check values for cube at x, y. Ie get values front front and back arrays,
     *  compute marching cube mask, build the resulting vertex and faces if necessary.
     *  @param {number} x
     *  @param {number} y
     *  @param {THREE.Vector3} corner Bottom left corner of front array.
     */
    fetchAndTriangulate(x, y, z, corner) {
        var idx_y_0 = y * this.reso[0] + x;
        var idx_y_1 = (y + 1) * this.reso[0] + x;
        this.values[0] = this.values_xy[0][idx_y_0]; //v_000;
        this.values[1] = this.values_xy[1][idx_y_0]; //v_001;
        this.values[2] = this.values_xy[0][idx_y_1]; //v_010;
        this.values[3] = this.values_xy[1][idx_y_1]; //v_011;
        this.values[4] = this.values_xy[0][idx_y_0 + 1]; //v_100;
        this.values[5] = this.values_xy[1][idx_y_0 + 1]; //v_101;
        this.values[6] = this.values_xy[0][idx_y_1 + 1]; //v_110;
        this.values[7] = this.values_xy[1][idx_y_1 + 1]; //v_111;

        this.computeMask();
        if (this.mask !== 0x0) {
            if (this.mask !== 0xff) {
                this.x = corner.x + x * this.min_acc;
                this.computeVertex();
                this.geometry.addVertex({
                    p: this.vertex,
                    n: this.vertex_n,
                    c: this.vertex_m.getColor(),
                    r: this.vertex_m.getRoughness(),
                    m: this.vertex_m.getMetalness()
                });
                this.vertices_xy[1][idx_y_0] = this.geometry.nVertices - 1;
                this.triangulate(x, y, z);
            }
        }
    };

    /**
     *  Push 2 faces in direct order (right handed).
     *  @param {number} v1 Index of vertex 1 in this.geometry
     *  @param {number} v2 Index of vertex 2 in this.geometry
     *  @param {number} v3 Index of vertex 3 in this.geometry
     *  @param {number} v4 Index of vertex 4 in this.geometry
     */
    pushDirectFaces(v1, v2, v3, v4) {
        this.geometry.addFace(v1, v2, v3);
        this.geometry.addFace(v3, v4, v1);
    };
    /**
     *  Push 2 faces in undirect order (left handed).
     *  @param {number} v1 Index of vertex 1 in this.geometry
     *  @param {number} v2 Index of vertex 2 in this.geometry
     *  @param {number} v3 Index of vertex 3 in this.geometry
     *  @param {number} v4 Index of vertex 4 in this.geometry
     */
    pushUndirectFaces(v1, v2, v3, v4) {
        this.geometry.addFace(v3, v2, v1);
        this.geometry.addFace(v1, v4, v3);
    };


    /**
     *  Compute and add faces depending on current cell crossing mask
     *  @param {number} x Current cell x coordinate in the grid (integer)
     *  @param {number} y Current cell y coordinate in the grid (integer)
     *  @param {number} z Current cell z coordinate in the grid (integer)
     */
    triangulate(x, y, z) {
        let idx_y_0 = y * this.reso[0] + x;
        if (this.edge_cross[0] && y !== 0 && z !== 0) {
            // x edge is crossed
            // Check orientation
            let v1 = this.vertices_xy[1][idx_y_0];
            let v2 = this.vertices_xy[1][(y - 1) * this.reso[0] + x];
            let v3 = this.vertices_xy[0][(y - 1) * this.reso[0] + x];
            let v4 = this.vertices_xy[0][idx_y_0];

            
            if(this.minCurvOrient)
            {
                let switch_edge = !this._isMinCurvatureTriangulation(v1, v2, v3, v4);
                if(switch_edge)
                {
                    let tmp = v1;
                    v1 = v2;
                    v2 = v3;
                    v3 = v4;
                    v4 = tmp;
                }
            }

            if (this.mask & 0x1) {
                this.pushDirectFaces(v1, v2, v3, v4);
            } else {
                this.pushUndirectFaces(v1, v2, v3, v4);
            }
        }
        if (this.edge_cross[4] && x !== 0 && z !== 0) {
            // y edge is crossed
            // Check orientation
            let v1 = this.vertices_xy[1][idx_y_0];
            let v2 = this.vertices_xy[0][idx_y_0];
            let v3 = this.vertices_xy[0][idx_y_0 - 1];
            let v4 = this.vertices_xy[1][idx_y_0 - 1];

            if(this.minCurvOrient)
            {
                let switch_edge = !this._isMinCurvatureTriangulation(v1, v2, v3, v4);
                if(switch_edge)
                {
                    let tmp = v1;
                    v1 = v2;
                    v2 = v3;
                    v3 = v4;
                    v4 = tmp;
                }
            }
            if (this.mask & 0x1) {
                this.pushDirectFaces(v1, v2, v3, v4);
            } else {
                this.pushUndirectFaces(v1, v2, v3, v4);
            }
        }
        if (this.edge_cross[8] && x !== 0 && y !== 0) {
            // z edge is crossed
            // Check orientation
            let v1 = this.vertices_xy[1][idx_y_0];
            let v2 = this.vertices_xy[1][idx_y_0 - 1];
            let v3 = this.vertices_xy[1][(y - 1) * this.reso[0] + x - 1];
            let v4 = this.vertices_xy[1][(y - 1) * this.reso[0] + x];

            if(this.minCurvOrient)
            {
                let switch_edge = !this._isMinCurvatureTriangulation(v1, v2, v3, v4);
                if(switch_edge)
                {
                    let tmp = v1;
                    v1 = v2;
                    v2 = v3;
                    v3 = v4;
                    v4 = tmp;
                }
            }
            if (this.mask & 0x1) {
                this.pushDirectFaces(v1, v2, v3, v4);
            } else {
                this.pushUndirectFaces(v1, v2, v3, v4);
            }
        }
    };

    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex = (function () {
        // Function static variable
        var eval_res = {
            v: null,
            g: new THREE$3.Vector3(0, 0, 0),
            m: new Material$2()
        };
        var conv_res = new THREE$3.Vector3();

        return function () {
            eval_res.v = this.blobtree.getNeutralValue();

            // Optimization note :
            //      Here I dont use tables but performances may be improved
            //      by using tables. See marching cube and surface net for examples

            // Average edge intersection
            var e_count = 0;

            this.vertex.set(0, 0, 0);

            //For every edge of the cube...
            for (var i = 0; i < 12; ++i) {
                // --> the following code does not seem to work. Tables.EdgeCross may be broken
                //Use edge mask to check if it is crossed
                // if(!(edge_mask & (1<<i))) {
                //     continue;
                // }

                //Now find the point of intersection
                var e0 = Tables$1.EdgeVMap[i][0]; //Unpack vertices
                var e1 = Tables$1.EdgeVMap[i][1];
                var p0 = Tables$1.VertexTopo[e0];
                var p1 = Tables$1.VertexTopo[e1];
                var g0 = this.values[e0]; //Unpack grid values
                var g1 = this.values[e1];

                // replace the mask check with that. Slower.
                this.edge_cross[i] =
                    g0 > this.blobtree.getIsoValue() !==
                    g1 > this.blobtree.getIsoValue();
                if (!this.edge_cross[i]) {
                    continue;
                }
                //If it did, increment number of edge crossings
                ++e_count;

                var d = g1 - g0;
                var t = 0; //Compute point of intersection
                if (Math.abs(d) > 1e-6) {
                    t = (this.blobtree.getIsoValue() - g0) / d;
                } else {
                    continue;
                }

                this.vertex.x += (1.0 - t) * p0[0] + t * p1[0];
                this.vertex.y += (1.0 - t) * p0[1] + t * p1[1];
                this.vertex.z += (1.0 - t) * p0[2] + t * p1[2];
            }

            this.vertex.x = this.x + (this.curr_steps.x * this.vertex.x) / e_count;
            this.vertex.y = this.y + (this.curr_steps.y * this.vertex.y) / e_count;
            this.vertex.z = this.z + (this.curr_steps.z * this.vertex.z) / e_count;

            // now make some convergence step
            // Note : it cost 15 to 20% performance lost
            //        and the result does not seem 15 et 20% better...
            if (this.convergence) {
                Convergence$1.safeNewton3D(
                    this.blobtree, // Scalar Field to eval
                    this.vertex, // 3D point where we start, must comply to THREE.Vector3 API
                    this.blobtree.getIsoValue(), // iso value we are looking for
                    this.min_acc * this.convergence.ratio, // Geometrical limit to stop
                    this.convergence.step, // limit of number of step
                    this.min_acc, // Bounding volume inside which we look for the iso, getting out will make the process stop.
                    conv_res // the resulting point
                );
                this.vertex.copy(conv_res);
            }

            this.blobtree.value(this.vertex, eval_res);

            eval_res.g.normalize();
            this.vertex_n.copy(eval_res.g).multiplyScalar(-1);
            this.vertex_m.copy(eval_res.m);
        };
    })();

    /**
     *  Compute mask of the current cube.
     *  Use this.values, set this.mask
     */
    computeMask() {
        this.mask = 0;

        //For each this, compute cube mask
        for (var i = 0; i < 8; ++i) {
            var s = this.values[i];
            this.mask |= s > this.blobtree.getIsoValue() ? 1 << i : 0;
        }
    }
}
var SlidingMarchingCubes_1 = SlidingMarchingCubes$2;

const THREE$2 = require$$0__default["default"];
const Types = Types_1;
const Node = Node_1;
const Material$1 = Material_1;

/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */

/**
 * @typedef {NodeJSON} MaxNodeJSON
 */

/**
 *  This class implement a Max node.
 *  It will return the maximum value of the field of each primitive.
 *  Return 0 in region were no primitive is present.
 *  @class MaxNode
 *  @extends Node
 */
class MaxNode$1 extends Node {

    static type = "MaxNode";

    /**
     *
     * @param {Json} json
     * @returns
     */
    static fromJSON(json) {
        var res = new MaxNode$1();
        for (var i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }

    /**
     *  @constructor
     *  @param {Array<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
     */
    constructor(children) {
        super();
        if (children) {
            var self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }

        // temp vars to speed up evaluation by avoiding allocations
        /** @type {{v:number, g:THREE.Vector3, m:Material}} */
        this.tmp_res = { v: 0, g: null, m: null };
        /** @type {THREE.Vector3} */
        this.tmp_g = new THREE$2.Vector3();
        /** @type {Material} */
        this.tmp_m = new Material$1();
    }

    /**
     * @returns {string}
     */
    getType = function () {
        return MaxNode$1.type;
    }

    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval () {
        if (!this.valid_aabb) {
            this.aabb = new THREE$2.Box3();  // Create empty BBox
            for (var i = 0; i < this.children.length; ++i) {
                var c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB());     // new aabb is computed according to remaining children aabb
            }

            this.valid_aabb = true;
        }
    }

    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value (p, res) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)

        var l = this.children.length;
        var tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;

        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material$1.defaultMaterial);
        } if (res.g) {
            res.g.set(0, 0, 0);
        } else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }

        if (this.aabb.containsPoint(p) && l !== 0) {
            res.v = Number.MAX_VALUE;
            for (var i = 0; i < l; ++i) {
                this.children[i].value(p, tmp);
                if (tmp.v > res.v) {
                    res.v = tmp.v;
                    if (res.g) {
                        res.g.copy(tmp.g);
                    }
                    if (res.m) {
                        res.m.copy(tmp.m);
                    }
                    // within primitive potential
                    if (res.step || res.stepOrtho) {
                        throw "Not implemented";
                    }
                }
                res.v = Math.max(res.v, tmp.v);
            }
        }
        else if (res.step || res.stepOrtho) {
            throw "Not implemented";
        }
    }

}
Types.register(MaxNode$1.type, MaxNode$1);

var MaxNode_1 = MaxNode$1;

const { BufferGeometryUtils } = require$$0__default$1["default"];

// Does not work yet, so just suppose that Blobtree is defined externally
// const Blobtree = require('three-js-blobtree");

const RootNode = RootNode_1;
const RicciNode = RicciNode_1;
const MaxNode = MaxNode_1;
const ScalisPoint = ScalisPoint_1;
const ScalisSegment = ScalisSegment_1;
const ScalisTriangle = ScalisTriangle_1;

const SlidingMarchingCubes$1 = SlidingMarchingCubes_1;

/**
 * @typedef {import('./SlidingMarchingCubes').SMCParams} SMCParams
 */

/**
 * @typedef {SMCParams & {class: any}} SubPolygonizerParams
 */

/**
 * @typedef {Object} SplitMaxPolygonizerParams
 * @property {SubPolygonizerParams=} subPolygonizer Parameters for the subpolygonizer to use.
 *                                           Must contain all parameters for the given subPolygonizer (like detailRatio, etc...)
 *                                           The class of the subpolygonizer (default to SlidingMarchingCubes) is in additional parameter class
 * @property {Boolean=} smpParams.uniformRes If true, uniform resolution will be used on all primitives, according to the minimum accuracy in the blobtree.
 * @property {Function=} smpParams.progress Progress callback, taking a percentage as parameter.
 * @property {Number=} smpParams.ricciThreshold The RicciNode coefficient above which it will be considered like a MaxNode.
 */

/**
 *  This class will polygonize nodes independantly when they blend with a MaxNode or a RicciNode
 *  (for RicciNode, only if the coefficient of at least "ricciThreshold", threshold being a parameter).
 *  It will create a mesh made of several shells but intersections will be better looking than with some
 *  global polygonizers like MarchingCubes.
 */
class SplitMaxPolygonizer {
    /**
     *  @param {SplitMaxPolygonizerParams=} smpParams Parameters and option for this polygonizer.
     */
    constructor(blobtree, smpParams) {
        var params = smpParams || {};

        this.blobtree = blobtree;

        this.uniformRes = params.uniformRes || false;
        this.min_acc = null;
        this.minAccs = [];

        /** @type {SubPolygonizerParams} */
        this.subPolygonizer = params.subPolygonizer ? params.subPolygonizer : {
            class: SlidingMarchingCubes$1,
            detailRatio: 1.0
        };

        this.ricciThreshold = params.ricciThreshold || 64;

        this.progress = params.progress ? params.progress : function (_percent) {
            //console.log(percent);
        };

        // Now we need to parse the blobtree and split it according to the different ways of
        // generating each groups.
        // Since we do not wantto alterate the original blobtree, for now we will use cloning.
        // (to be changed if it is too slow)
        this.subtrees = []; // Blobtrees created for primitives which must be generated with SMC
        this.progCoeff = []; // progress coefficient, mainly depends on the total number of primitives in the node.
        this.totalCoeff = 0;

        this.setBlobtree(blobtree);
    }

}
SplitMaxPolygonizer.prototype.constructor = SplitMaxPolygonizer;

SplitMaxPolygonizer.prototype.setBlobtree = function(blobtree){

    this.blobtree = blobtree;
    this.blobtree.prepareForEval();

    var getBlobtreeMinAcc = function(btree){
        var areas = btree.getAreas();
        var min_acc = areas.length !== 0 ? areas[0].bv.getMinAcc() : null;
        for(var i=0; i<areas.length; ++i){
            if(areas[i].bv.getMinAcc()<min_acc){
                min_acc = areas[i].bv.getMinAcc();
            }
        }
        return min_acc;
    };
    this.min_acc = getBlobtreeMinAcc(this.blobtree);

    this.subtrees = [];
        this.progCoeff = [];
        this.totalCoeff = 0;

    var self = this;
    var addToSubtrees = function(n){
        var subtree = null;
        if(n instanceof RootNode){
            subtree = n.clone();
        }else {
            subtree = new RootNode();
            subtree.addChild(n.clone());
        }
        self.subtrees.push(subtree);
        subtree.prepareForEval();
        self.minAccs.push(getBlobtreeMinAcc(subtree));
        self.progCoeff.push(
            subtree.count(ScalisPoint) + subtree.count(ScalisSegment) + subtree.count(ScalisTriangle)
        );
        self.totalCoeff += self.progCoeff[self.progCoeff.length-1];
    };

    var recurse = function(n){
        if(n instanceof RicciNode){
            if(n.getRicciN() < self.ricciThreshold){
                // This node must be copied and generated using SMC
                if(n.children.length !== 0){
                    addToSubtrees(n);
                }
            }else {
                for(var i=0; i<n.children.length; ++i){
                    recurse(n.children[i]);
                }
            }
        }else if(n instanceof MaxNode){
            for (let i = 0; i < n.children.length; ++i) {
                recurse(n.children[i]);
            }
        }else if(n instanceof ScalisPoint){
            addToSubtrees(n);
        }else if(n instanceof ScalisSegment){
            addToSubtrees(n);
        }else if(n instanceof ScalisTriangle){
            addToSubtrees(n);
        }else {
            addToSubtrees(n);
        }
    };

    recurse(this.blobtree);
};

SplitMaxPolygonizer.prototype.compute = function() {

    if(!this.blobtree.isValidAABB()){
        this.setBlobtree(this.blobtree);
    }

    var self = this;
    this.progress(0);
    var prog = 0;
    var geometries = [];
    for(var i=0; i<this.subtrees.length; ++i){

        var prev_detailRatio = this.subPolygonizer.detailRatio || 1.0;
        if(this.uniformRes && this.min_acc){
            this.subPolygonizer.detailRatio = prev_detailRatio*this.min_acc/this.minAccs[i];
        }

        this.subPolygonizer.progress = function(percent){
            self.progress(100*(prog + (percent/100)*self.progCoeff[i])/self.totalCoeff);
        };
        var polygonizer = new this.subPolygonizer.class(
            this.subtrees[i],
            this.subPolygonizer
        );
        geometries.push(polygonizer.compute());

        this.subPolygonizer.detailRatio = prev_detailRatio;

        prog += this.progCoeff[i];
    }

    var res = BufferGeometryUtils.mergeBufferGeometries(geometries);

    this.progress(100);

    return res;
};

var SplitMaxPolygonizer_1 = SplitMaxPolygonizer;

const THREE$1 = require$$0__default["default"];

const Material = Material_1;
const Tables = MCTables;
const Convergence = Convergence_1;

const SlidingMarchingCubes = SlidingMarchingCubes_1;

/**
 * @typedef {import('../blobtree/RootNode')} RootNode
 * @typedef {import('./SlidingMarchingCubes')} SMCParams
 */


/**
 * metaBlobtree is The blobtree from which normals will be computed.
 * Usually a blobtree containing blobtree.
 * @typedef {{metaBlobtree: RootNode} & SMCParams} SplitSMCParams
 */

/**
 *  A special SlidingMarchingCubes with a different function
 *  to compute vertex normal in a cell.
 *  In this polygnizer, we suppose the blobtree used for marching
 *  is not the complete blobtree and we want to use the normal from
 *  the complete blobtree.
 */
class SplitSMC extends SlidingMarchingCubes {

    /**
     *  @param {RootNode} blobtree
     *  @param {SplitSMCParams} params
     */
    constructor(blobtree, params) {
        super(blobtree, params);

        if (params.metaBlobtree) {
            this.metaBlobtree = params.metaBlobtree;
            this.metaBlobtree.prepareForEval();
        } else {
            throw "Error : SplitSMC needs a meta blobtree in params (from which normals will be computed).";
        }
    }

    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex = (function () {
        // Function static variable
        var eval_res = { v: null, g: new THREE$1.Vector3(0, 0, 0), m: new Material() };
        var conv_res = new THREE$1.Vector3();

        return function () {

            /** @type {SplitSMC} */
            let self = this;

            eval_res.v = self.blobtree.getNeutralValue();

            // Optimization note :
            //      Here I dont use tables but performances may be improved
            //      by using tables. See marching cube and surface net for examples

            // Average edge intersection
            let e_count = 0;

            self.vertex.set(0, 0, 0);

            //For every edge of the cube...
            for (let i = 0; i < 12; ++i) {

                // --> the following code does not seem to work. Tables.EdgeCross may be broken
                //Use edge mask to check if it is crossed
                // if(!(edge_mask & (1<<i))) {
                //     continue;
                // }

                //Now find the point of intersection
                var e0 = Tables.EdgeVMap[i][0];       //Unpack vertices
                var e1 = Tables.EdgeVMap[i][1];
                var p0 = Tables.VertexTopo[e0];
                var p1 = Tables.VertexTopo[e1];
                var g0 = self.values[e0];                //Unpack grid values
                var g1 = self.values[e1];

                // replace the mask check with that. Slower.
                self.edge_cross[i] = ((g0 > self.blobtree.getIsoValue()) !== (g1 > self.blobtree.getIsoValue()));
                if (!self.edge_cross[i]) {
                    continue;
                }
                //If it did, increment number of edge crossings
                ++e_count;

                var d = (g1 - g0);
                var t = 0;  //Compute point of intersection
                if (Math.abs(d) > 1e-6) {
                    t = (self.blobtree.getIsoValue() - g0) / d;
                } else {
                    continue;
                }

                self.vertex.x += (1.0 - t) * p0[0] + t * p1[0];
                self.vertex.y += (1.0 - t) * p0[1] + t * p1[1];
                self.vertex.z += (1.0 - t) * p0[2] + t * p1[2];
            }

            self.vertex.x = self.x + self.curr_steps.x * self.vertex.x / e_count;
            self.vertex.y = self.y + self.curr_steps.y * self.vertex.y / e_count;
            self.vertex.z = self.z + self.curr_steps.z * self.vertex.z / e_count;

            // now make some convergence step
            // Note : it cost 15 to 20% performance lost
            //        and the result does not seem 15 et 20% better...
            if (self.convergence) {
                Convergence.safeNewton3D(
                    self.blobtree,      // Scalar Field to eval
                    self.vertex,                  // 3D point where we start, must comply to THREE.Vector3 API
                    self.blobtree.getIsoValue(),               // iso value we are looking for
                    self.min_acc * self.convergence.ratio,               // Geometrical limit to stop
                    self.convergence.step,                           // limit of number of step
                    self.min_acc,                     // Bounding volume inside which we look for the iso, getting out will make the process stop.
                    conv_res                          // the resulting point
                );
                self.vertex.copy(conv_res);
            }

            self.metaBlobtree.value(self.vertex, eval_res);

            eval_res.g.normalize();
            self.vertex_n.copy(eval_res.g).multiplyScalar(-1);
            self.vertex_m.copy(eval_res.m);
        };
    })();
}


var SplitSMC_1 = SplitSMC;

const version = "1.0.0";

var Blobtree = /*#__PURE__*/Object.freeze({
    __proto__: null,
    version: version,
    Types: Types_1,
    Element: Element_1,
    Node: Node_1,
    RootNode: RootNode_1,
    RicciNode: RicciNode_1,
    DifferenceNode: DifferenceNode_1,
    MinNode: MinNode_1,
    MaxNode: MinNode_1,
    TwistNode: TwistNode_1,
    ScaleNode: ScaleNode_1,
    Primitive: Primitive_1,
    ScalisMath: ScalisMath_1,
    ScalisPrimitive: ScalisPrimitive_1,
    ScalisPoint: ScalisPoint_1,
    ScalisSegment: ScalisSegment_1,
    ScalisTriangle: ScalisTriangle_1,
    ScalisVertex: ScalisVertex_1,
    DistanceFunctor: DistanceFunctor_1,
    Poly6DistanceFunctor: Poly6DistanceFunctor_1,
    SDFRootNode: SDFRootNode_1,
    SDFPrimitive: SDFPrimitive_1,
    SDFPoint: SDFPoint_1,
    SDFSegment: SDFSegment_1,
    SDFSphere: SDFSphere_1,
    SDFCapsule: SDFCapsule_1,
    Material: Material_1,
    Accuracies: Accuracies_1,
    Area: Area_1,
    AreaScalisSeg: AreaScalisSeg_1,
    AreaScalisTri: AreaScalisTri_1,
    AreaSphere: AreaSphere_1,
    AreaCapsule: AreaCapsule_1,
    SlidingMarchingCubes: SlidingMarchingCubes_1,
    SplitMaxPolygonizer: SplitMaxPolygonizer_1,
    SplitSMC: SplitSMC_1
});

const PACKAGE_NAME = "three-js-blobtree";

checkThreeRevision(PACKAGE_NAME, 130);
checkDependancy(PACKAGE_NAME, "BufferGeometryUtils", require$$0$1.BufferGeometryUtils);
checkDependancy(PACKAGE_NAME, "Blobtree", Blobtree);

exports.Accuracies = Accuracies_1;
exports.Area = Area_1;
exports.AreaCapsule = AreaCapsule_1;
exports.AreaScalisSeg = AreaScalisSeg_1;
exports.AreaScalisTri = AreaScalisTri_1;
exports.AreaSphere = AreaSphere_1;
exports.DifferenceNode = DifferenceNode_1;
exports.DistanceFunctor = DistanceFunctor_1;
exports.Element = Element_1;
exports.Material = Material_1;
exports.MaxNode = MinNode_1;
exports.MinNode = MinNode_1;
exports.Node = Node_1;
exports.Poly6DistanceFunctor = Poly6DistanceFunctor_1;
exports.Primitive = Primitive_1;
exports.RicciNode = RicciNode_1;
exports.RootNode = RootNode_1;
exports.SDFCapsule = SDFCapsule_1;
exports.SDFPoint = SDFPoint_1;
exports.SDFPrimitive = SDFPrimitive_1;
exports.SDFRootNode = SDFRootNode_1;
exports.SDFSegment = SDFSegment_1;
exports.SDFSphere = SDFSphere_1;
exports.ScaleNode = ScaleNode_1;
exports.ScalisMath = ScalisMath_1;
exports.ScalisPoint = ScalisPoint_1;
exports.ScalisPrimitive = ScalisPrimitive_1;
exports.ScalisSegment = ScalisSegment_1;
exports.ScalisTriangle = ScalisTriangle_1;
exports.ScalisVertex = ScalisVertex_1;
exports.SlidingMarchingCubes = SlidingMarchingCubes_1;
exports.SplitMaxPolygonizer = SplitMaxPolygonizer_1;
exports.SplitSMC = SplitSMC_1;
exports.TwistNode = TwistNode_1;
exports.Types = Types_1;
exports.version = version;

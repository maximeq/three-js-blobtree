import { Box3, Color, Vector3, Matrix4, MathUtils, Line3, BufferGeometry, BufferAttribute, Vector2, Box2 } from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 *  Keep track of all Types added to the Blobtree library.
 *  For now just a list of strings registered by the classes.
 */
const Types = {
    types: {},
    /**
     *  Register a type in the list.
     *  @param name The name of the type.
     *  @param cls The class of the registered type.
     */
    register(name, cls) {
        if (this.types[name]) {
            throw "Error : cannot register type " + name + ", this name is already registered.";
        }
        this.types[name] = cls;
    },
    /**
     *  Parse a JSON recursively to return a Blobtree or a blobtree element.
     *  @param json A javascript Object resulting from a JSON interpretation.
     */
    fromJSON(json) {
        const cls = this.types[json.type];
        if (!cls) {
            throw "Error : type found in JSON (" + json.type + " is not registered in the Blobtree library.";
        }
        return cls.fromJSON(json);
    }
};

let elementIds = 0;
/**
 *  A superclass for Node and Primitive in the blobtree.
 *  @class
 *  @constructor
 */
class Element {
    static type = "Element";
    static fromJSON(_json) {
        throw new Error("Element.fromJSON should never be called as Element is abstract.");
    }
    id;
    aabb = new Box3();
    valid_aabb = false;
    parentNode = null;
    constructor() {
        this.id = elementIds++;
    }
    /**
     *  Return a Javscript Object respecting JSON convention.
     *  All classes must defined it.
     */
    toJSON() {
        return {
            type: this.getType()
        };
    }
    /**
     *  Clone the object.
     */
    clone() {
        return Types.fromJSON(this.toJSON());
    }
    /**
     *  @return The parent node of this primitive.
     */
    getParentNode() {
        return this.parentNode;
    }
    /**
     *  @return Type of the element
     */
    getType() {
        return Element.type;
    }
    /**
     *  Perform precomputation that will help to reduce future processing time,
     *  especially on calls to value.
     *  @protected
     */
    computeHelpVariables() {
        this.computeAABB();
    }
    /**
     *  @return The AABB of this Element (primitive or node). WARNING : call
     *  isValidAABB before to ensure the current AABB does correspond to the primitive
     *  settings.
     */
    getAABB() {
        return this.aabb;
    }
    /**
     *  @return True if the current aabb is valid, ie it does
     *  correspond to the internal primitive parameters.
     */
    isValidAABB() {
        return this.valid_aabb;
    }
    /**
     *  Invalid the bounding boxes recursively up to the root
     */
    invalidAABB() {
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
     * @param p The point where we want the numerical gradient
     * @param res The resulting gradient
     * @param epsilon The step value for the numerical evaluation
     */
    numericalGradient = (function () {
        let tmp = { v: 0, m: null, g: null };
        let coord = ['x', 'y', 'z'];
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
        };
    })();
    /**
     *  @abstract
     *  Get the Area object.
     *  Area objects do provide methods useful when rasterizing, raytracing or polygonizing
     *  the area (intersections with other areas, minimum level of detail needed to
     *  capture the feature nicely, etc etc...).
     *  @returns The Areas object corresponding to the node/primitive, in an array
     */
    getAreas() {
        return [];
    }
    /**
     *  @abstract
     *  This function is called when a point is outside of the potential influence of a primitive/node.
     *  @param  _p
     *  @return  The next step length to do with respect to this primitive/node
     */
    distanceTo(_p) {
        throw new Error("ERROR : distanceTo is a virtual function, should be reimplemented in all classes extending Element. Concerned type: " + this.getType() + ".");
    }
    /**
     *  Trim the tree to keep only nodes influencing a given bounding box.
     *  The tree must be prepared for eval for this process to be working.
     *  Default behaviour is doing nothing, leaves cannot be sub-trimmed, only nodes.
     *  Note : only the root can untrim
     *
     *  @param _aabb
     *  @param _trimmed Array of trimmed Elements
     *  @param _parents Array of fathers from which each trimmed element has been removed.
     */
    trim(_aabb, _trimmed, _parents) {
        // Do nothing by default
    }
    ;
    /**
     *  count the number of elements of class cls in this node and subnodes
     *  @param  _cls the class of the elements we want to count
     *  @return  The number of element of class cls
     */
    count(_cls) {
        return 0;
    }
}
Types.register(Element.type, Element);

/**
 *  Material object for blobtree. It is an internal material, that should especially
 *  be used in implicit elements. It is the internal representation of the material,
 *  not the openGL material that will be used for display.
 */
class Material {
    color;
    roughness;
    metalness;
    emissive;
    static defaultMaterial = new Material();
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
     *  @return true if and only if all arguments are arrays of the same length and containing the same material values.
     */
    static areEqualsArrays(arr1) {
        console.warn("Material.areEqualsArrays is deprecated, please use your own comparison function using Material.equals.");
        let res = true;
        // check for nullity
        for (let i = 1; i < arguments.length; i++) {
            res = res && ((arr1 === null && arguments[i] === null) || (arr1 !== null && arguments[i] !== null));
        }
        if (!res) {
            return res;
        } // Case : at least one arr is null but not all
        if (arr1 === null) {
            return true;
        } // case all null
        for (let i = 1; i < arguments.length; i++) {
            let equals = true;
            if (arguments[i].length !== arr1.length) {
                return false;
            }
            for (let k = 0; k < arr1.length; ++k) {
                equals = equals && arr1[k].equals(arguments[i][k]);
            }
            res = res && equals;
        }
        return res;
    }
    ;
    static fromJSON(json) {
        return new Material({
            color: new Color(json.color),
            roughness: json.roughness,
            metalness: json.metalness,
            emissive: new Color(json.emissive ? json.emissive : 0), // If undefined, will default to pitch black. If not, will load the hex string.
        });
    }
    /**
    *  @constructor
    *
    *  @param params Parameters for the material.As a dictionary to be easily extended later.
    *
    *  @param params.color Base diffuse color for the material. Defaults to #aaaaaa
    *
    *  @param params.roughness Roughness for the material. Defaults to 0.
    *
    *  @param params.metalness Metalness aspect of the material, 1 for metalness, 0 for dielectric. Defaults to 0.
    *
    *  @param params.emissive Emissive color for the material. Defaults to pitch black. (no light emission)
    */
    constructor(params) {
        params = params || {};
        if (arguments[1] !== undefined) {
            throw "Error : Blobtree Material now takes only 1 argument.";
        }
        this.color = new Color(params.color !== undefined ? params.color : 0xaaaaaa);
        this.roughness = params.roughness !== undefined ? params.roughness : 0;
        this.metalness = params.metalness !== undefined ? params.metalness : 0;
        this.emissive = new Color(params.emissive !== undefined ? params.emissive : 0x000000);
    }
    toJSON() {
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
    clone() {
        return new Material({
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
    copy(mat) {
        this.color.copy(mat.color);
        this.roughness = mat.roughness;
        this.metalness = mat.metalness;
        this.emissive.copy(mat.emissive);
    }
    /**
     *  @deprecated Use setParams instead
     *  Set Material parameters at once. DEPRECATED. Use setParams
     *  @param {Color!} c Color
     *  @param {number!} r roughness
     *  @param {number!} m Metalness
     */
    set(c, r, m) {
        this.color.copy(c);
        this.roughness = r;
        this.metalness = m;
    }
    /**
     *  Set Material parameters (all or just some)
     *
     *  @param params Parameters for the material. As a dictionary to be easily extended later.
     *  @param params.color        Base diffuse color for the material.
     *  @param params.roughness    Roughness for the material.
     *  @param params.metalness    Metalness aspect of the material, 1 for metalness, 0 for dielectric.
     *  @param params.emissive       Emissive color for the material.
     */
    setParams(params) {
        this.color.copy(params.color ? params.color : this.color);
        this.roughness = params.roughness !== undefined ? params.roughness : this.roughness;
        this.metalness = params.metalness !== undefined ? params.metalness : this.metalness;
        this.emissive.copy(params.emissive !== undefined ? params.emissive : this.emissive);
    }
    getColor() { return this.color; }
    ;
    getRoughness() { return this.roughness; }
    ;
    getMetalness = function () { return this.metalness; };
    getEmissive() { return this.emissive; }
    equals(m) {
        return this.color.equals(m.color) &&
            this.metalness === m.metalness &&
            this.roughness === m.roughness &&
            this.emissive.equals(m.emissive);
    }
    /**
     *  Perform a linear interpolation between this material and a given other.
     * (1-s)*this + s*m = this +(m1-this)*s
     *  @param m The material to interpolate with this
     *  @param s the interpolation coefficient
     */
    lerp(m, s) {
        this.color.lerp(m.color, s);
        this.roughness = (1 - s) * this.roughness + s * m.roughness;
        this.metalness = (1 - s) * this.metalness + s * m.metalness;
        this.emissive.lerp(m.emissive, s);
    }
    ;
    /**
     *  Used in triangles (ok it's specific, still we need it :)
     *  Linear interpolation over a triangle? Store the result in this
     *  @param m1 The material of first corner
     *  @param m2 The material of second corner
     *  @param m3 The material of third corner
     *  @param a1 the interpolation coefficient 1
     *  @param a2 the interpolation coefficient 2
     *  @param a3 the interpolation coefficient 3
     *  @param denum Normalizing the result (division)
     *  @return this
     */
    triMean(m1, m2, m3, a1, a2, a3, denum) {
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
     *  @param m_arr Array of materials
     *  @param v_arr Array of values being the corresponding weights
     *  @param n Can be set if you want to mean only the n first element of the arrays
     */
    weightedMean(m_arr, v_arr, n) {
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
        }
        else {
            this.color.setScalar(0);
            this.roughness = 0;
            this.metalness = 0;
            this.emissive.setScalar(0);
        }
        return this;
    }
}

/**
 *  Represent a blobtree primitive.
 *
 *  @constructor
 *  @extends {Element}
 */
class Primitive extends Element {
    static type = "Primitive";
    static fromJSON(_json) {
        throw new Error("Primitibe.fromJSON should never be called as Primitibe is abstract.");
    }
    materials = [];
    constructor() {
        super();
    }
    toJSON() {
        const res = { ...super.toJSON(), materials: [] };
        res.materials = [];
        for (let i = 0; i < this.materials.length; ++i) {
            res.materials.push(this.materials[i].toJSON());
        }
        return res;
    }
    ;
    /**
     *  @param  mats Array of materials to set. they will be copied to the primitive materials
     */
    setMaterials(mats) {
        if (mats.length !== this.materials.length) {
            throw "Error : trying to set " + mats.length + " materials on a primitive with only " + this.materials.length;
        }
        for (let i = 0; i < mats.length; ++i) {
            if (!mats[i].equals(this.materials[i])) {
                this.materials[i].copy(mats[i]);
                this.invalidAABB();
            }
        }
    }
    ;
    /**
     *  @return Current primitive materials
     */
    getMaterials() {
        return this.materials;
    }
    ;
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB() {
        throw "Primitive.computeAABB  Must be reimplemented in all inherited class.";
    }
    ;
    /**
     *  @abstract
     *  Destroy the current primitive and remove it from the blobtree (basically
     *  clean up the links between blobtree elements).
     */
    destroy() {
        if (this.parentNode !== null) {
            this.parentNode.removeChild(this);
        }
    }
    ;
    /**
     * @abstract
     */
    getAreas() {
        console.error("ERROR : getAreas is an abstract function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)");
        return [];
    }
    ;
    /**
     * @abstract
     * Compute constiables to help with value computation.
     * @param cls The class to count. Primitives have no children so no complexty here.
     */
    count(cls) {
        return this instanceof cls ? 1 : 0;
    }
    ;
}
Types.register(Primitive.type, Primitive);

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
class Area {
}

/**
 *  This class implements an abstract Node class for implicit blobtree.
 *  @constructor
 *  @extends {Element}
 */
class Node extends Element {
    children;
    static type = "Node";
    static fromJSON(_json) {
        throw new Error("Node.fromJSON should never be called as Node is abstract.");
    }
    constructor() {
        super();
        this.children = [];
    }
    getType() {
        return Node.type;
    }
    toJSON() {
        const res = {
            ...super.toJSON(),
            children: []
        };
        for (let i = 0; i < this.children.length; ++i) {
            res.children.push(this.children[i].toJSON());
        }
        return res;
    }
    /**
     *  Clone current node and itss hierarchy
     */
    clone() {
        return Types.fromJSON(this.toJSON());
    }
    /**
     *  Invalid the bounding boxes recursively down for all children
     */
    invalidAll() {
        this.invalidAABB();
        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].invalidAll();
            }
        }
    }
    ;
    /**
     *  Destroy the node and its children. The node is removed from the blobtree
     *  (basically clean up the links between blobtree elements).
     */
    destroy() {
        // need to Copy the array since indices will change.
        const arr_c = this.children.slice(0, this.children.length);
        for (let i = 0; i < arr_c.length; i++) {
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
    }
    ;
    /**
     *  Only works with nary nodes, otherwise a set function would be more appropriate.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  If c already belongs to the tree, it is removed from its current parent
     *  children list before anything (ie it is "moved").
     *
     *  @param c The child to add.
     */
    addChild(c) {
        if (c.parentNode !== null) {
            c.parentNode.removeChild(c);
        }
        // TODO should ckeck that the node does not already belong to the children list
        this.children.push(c);
        c.parentNode = this;
        this.invalidAABB();
        return this;
    }
    ;
    /**
     *  Only works with n-ary nodes, otherwise order matters and we therefore
     *  have to set "null" and node cannot be evaluated.
     *  -> TODO : check that if we have something else than n-ary nodes one day...
     *  WARNING:
     *      Should only be called when a Primitive is deleted.
     *      Otherwise :
     *          To move a node to another parent : use addChild.
     *  @param c The child to remove.
     */
    removeChild(c) {
        let i = 0;
        const cdn = this.children; // minimize the code
        // Note : if this becomes too long, sort this.children using ids
        while (cdn[i] !== c && i < cdn.length)
            ++i;
        if (i != cdn.length) {
            cdn[i] = cdn[cdn.length - 1];
            cdn.pop();
        }
        else {
            throw "c does not belong to the children of this node";
        }
        this.invalidAABB();
        c.parentNode = null;
    }
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB() {
        this.aabb.makeEmpty();
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].computeAABB();
            this.aabb.union(this.children[i].getAABB());
        }
    }
    /**
     *  @link Element.getAreas for a complete description
     *  @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas() {
        if (!this.valid_aabb) {
            throw "Error : cannot call getAreas on a not prepared for eval nod, please call PrepareForEval first. Node concerned is a " + this.getType();
        }
        const res = [];
        for (let i = 0; i < this.children.length; i++) {
            res.push.apply(res, this.children[i].getAreas());
        }
        return res;
    }
    ;
    /**
     * @link Element.distanceTo for a complete description
     */
    distanceTo(p) {
        let res = 10000000;
        for (let i = 0; i < this.children.length; i++) {
            res = Math.min(res, this.children[i].distanceTo(p));
        }
        return res;
    }
    ;
    /**
     * @returns
     */
    heuristicStepWithin() {
        let res = 10000000;
        for (let i = 0; i < this.children.length; i++) {
            res = Math.min(res, this.children[i].heuristicStepWithin());
        }
        return res;
    }
    ;
    /**
     *  @link Element.trim for a complete description.
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
    }
    ;
    /**
     *  @link Element.count for a complete description.
     */
    count(cls) {
        let count = 0;
        if (this instanceof cls) {
            count++;
        }
        for (let i = 0; i < this.children.length; i++) {
            count += this.children[i].count(cls);
        }
        return count;
    }
    ;
}
Types.register(Node.type, { fromJSON: () => null });

/**
 *  This class implement a difference blending node.
 *  The scalar field of the second child of this node will be substracted to the first node field.
 *  The result is clamped to 0 to always keep a positive field value.
 *  @constructor
 *  @extends Node
 */
class DifferenceNode extends Node {
    alpha;
    clamped;
    tmp_res0;
    tmp_res1;
    g0;
    m0;
    g1;
    m1;
    tmp_v_arr;
    tmp_m_arr;
    static type = "DifferenceNode";
    static fromJSON(json) {
        return new DifferenceNode(Types.fromJSON(json.children[0]), Types.fromJSON(json.children[1]), json.alpha);
    }
    ;
    /**
     *
     *  @param node0 The first node
     *  @param node1 The second node, its value will be substracted to the node 0 value.
     *  @param alpha Power of the second field : the greater alpha the sharper the difference. Default is 1, must be > 1.
     */
    constructor(node0, node1, alpha) {
        super();
        this.addChild(node0);
        this.addChild(node1);
        this.alpha = alpha || 1;
        /**
         * For now, this field value is clamped to 0
         */
        this.clamped = 0.0;
        // Tmp vars to speed up computation (no reallocations)
        this.tmp_res0 = { v: 0, g: new Vector3(0, 0, 0), m: new Material() };
        this.tmp_res1 = { v: 0, g: new Vector3(0, 0, 0), m: new Material() };
        this.g0 = new Vector3();
        this.m0 = new Material();
        this.g1 = new Vector3();
        this.m1 = new Material();
        /** @type {Float32Array} */
        this.tmp_v_arr = new Float32Array(2);
        /** @type {Array<Material|null>} */
        this.tmp_m_arr = [
            null,
            null
        ];
    }
    getAlpha() {
        return this.alpha;
    }
    ;
    setAlpha(alpha) {
        if (this.alpha != alpha) {
            this.alpha = alpha;
            this.invalidAABB();
        }
    }
    ;
    toJSON() {
        return {
            ...super.toJSON(),
            alpha: this.alpha
        };
    }
    ;
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
    }
    ;
    /**
     *  Compute the value and/or gradient and/or material
     *  of the element at position p in space. return computations in res (see below)
     *
     *  @param p Point where we want to evaluate the primitive field
     *  @param res Computed values will be stored here. Each values should exist and
     *                       be allocated already.
     *  @param res.v Value, must be defined
     *  @param res.m Material, must be allocated and defined if wanted
     *  @param res.g Gradient, must be allocated and defined if wanted
     *  @param res.step The next step we can safely walk without missing the iso (0). Mostly used for convergence function or ray marching.
     *  @param res.stepOrtho
     */
    value(p, res) {
        const v_arr = this.tmp_v_arr;
        const m_arr = this.tmp_m_arr;
        const tmp0 = this.tmp_res0;
        const tmp1 = this.tmp_res1;
        tmp0.g = res.g ? this.g0 : null;
        tmp0.m = res.m ? this.m0 : null;
        tmp1.g = res.g ? this.g1 : null;
        tmp1.m = res.m ? this.m1 : null;
        // Init res
        res.v = 0;
        tmp1.v = 0;
        tmp0.v = 0;
        if (res.m && tmp0.m && tmp1.m) {
            res.m.copy(Material.defaultMaterial);
            tmp1.m.copy(Material.defaultMaterial);
            tmp0.m.copy(Material.defaultMaterial);
        }
        if (res.g && tmp0.g && tmp1.g) {
            res.g.set(0, 0, 0);
            tmp1.g.set(0, 0, 0);
            tmp0.g.set(0, 0, 0);
        }
        else if (res.step !== undefined) {
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
                    if (res.g && tmp0.g) {
                        res.g.copy(tmp0.g);
                    }
                    if (res.m && tmp0.m) {
                        res.m.copy(tmp0.m);
                    }
                }
                else {
                    const v_pow = Math.pow(tmp1.v, this.alpha);
                    res.v = Math.max(this.clamped, tmp0.v - tmp1.v * Math.pow(tmp1.v, this.alpha - 1.0));
                    if (res.g && tmp1.g && tmp0.g) {
                        if (res.v === this.clamped) {
                            res.g.set(0, 0, 0);
                        }
                        else {
                            tmp1.g.multiplyScalar(v_pow);
                            res.g.subVectors(tmp0.g, tmp1.g);
                        }
                    }
                    if (res.m && tmp0.m && tmp1.m) {
                        v_arr[0] = tmp0.v;
                        v_arr[1] = tmp1.v;
                        m_arr[0] = tmp0.m;
                        m_arr[1] = tmp1.m;
                        if (m_arr[0] === null && m_arr[1] === null)
                            throw "[DifferenceNode] value: m_arr[0] and m_arr[1] are both null. This is not possible here.";
                        res.m.weightedMean(m_arr, v_arr, 2);
                    }
                }
            }
        }
        else if (res.step !== undefined) {
            // return distance to aabb such that next time we'll hit from within the aabbb
            res.step = this.aabb.distanceToPoint(p) + 0.3;
        }
    }
    ;
    /**
     *  @link Element.trim for a complete description.
     *
     *  Trim must be redefined for DifferenceNode since in this node we cannot trim one of the 2 nodes without trimming the other.
     */
    trim(aabb, trimmed, parents) {
        // Trim remaining nodes
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    }
    ;
}
Types.register(DifferenceNode.type, DifferenceNode);

/**
 *  This class implement a Max node.
 *  It will return the maximum value of the field of each primitive.
 *  Return 0 in region were no primitive is present.
 *  @class MaxNode
 *  @extends Node
 */
class MaxNode extends Node {
    tmp_res;
    tmp_g;
    tmp_m;
    static type = "MaxNode";
    static fromJSON(json) {
        const res = new MaxNode();
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }
    /**
     *  @constructor
     *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
     */
    constructor(children) {
        super();
        if (children) {
            const self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }
        // temp consts to speed up evaluation by avoiding allocations
        this.tmp_res = { v: 0, g: null, m: null };
        this.tmp_g = new Vector3();
        this.tmp_m = new Material();
    }
    getType() {
        return MaxNode.type;
    }
    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval() {
        if (!this.valid_aabb) {
            this.aabb = new Box3(); // Create empty BBox
            for (let i = 0; i < this.children.length; ++i) {
                const c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB()); // new aabb is computed according to remaining children aabb
            }
            this.valid_aabb = true;
        }
    }
    /**
     *  @link Element.value for a complete description
     */
    value(p, res) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)
        const l = this.children.length;
        const tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;
        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material.defaultMaterial);
        }
        if (res.g) {
            res.g.set(0, 0, 0);
        }
        else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }
        if (this.aabb.containsPoint(p) && l !== 0) {
            res.v = Number.MAX_VALUE;
            for (let i = 0; i < l; ++i) {
                this.children[i].value(p, tmp);
                if (tmp.v > res.v) {
                    res.v = tmp.v;
                    if (res.g && tmp.g) {
                        res.g.copy(tmp.g);
                    }
                    if (res.m && tmp.m) {
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
Types.register(MaxNode.type, MaxNode);

/**
 *  This class implement a Min node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
class MinNode extends Node {
    tmp_res;
    tmp_g;
    tmp_m;
    static type = "MinNode";
    fromJSON(json) {
        const res = new MinNode();
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }
    /**
    *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children) {
        super();
        if (children) {
            const self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }
        // temp consts to speed up evaluation by avoiding allocations
        this.tmp_res = { v: 0, g: null, m: null };
        this.tmp_g = new Vector3();
        this.tmp_m = new Material();
    }
    getType() {
        return MinNode.type;
    }
    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval() {
        if (!this.valid_aabb) {
            this.aabb = new Box3(); // Create empty BBox
            for (let i = 0; i < this.children.length; ++i) {
                const c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB()); // new aabb is computed according to remaining children aabb
            }
            this.valid_aabb = true;
        }
    }
    ;
    /**
     *  @link Element.value for a complete description
     */
    value(p, res) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)
        const l = this.children.length;
        const tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;
        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material.defaultMaterial);
        }
        if (res.g) {
            res.g.set(0, 0, 0);
        }
        else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }
        if (this.aabb.containsPoint(p) && l !== 0) {
            res.v = Number.MAX_VALUE;
            for (let i = 0; i < l; ++i) {
                this.children[i].value(p, tmp);
                if (tmp.v < res.v) {
                    res.v = tmp.v;
                    if (res.g && tmp.g) {
                        res.g.copy(tmp.g);
                    }
                    if (res.m && tmp.m) {
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
     */
    trim(aabb, trimmed, parents) {
        // Trim remaining nodes
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    }
    ;
}
Types.register(MinNode.type, { fromJSON: (new MinNode()).fromJSON });

/**
 *  This class implement a n-ary blend node which use a Ricci Blend.
 *  Ricci blend is : v = k-root( Sum(c.value^k) ) for all c in node children.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
class RicciNode extends Node {
    ricci_n;
    tmp_v_arr;
    tmp_m_arr;
    tmp_res;
    tmp_g;
    tmp_m;
    static type = "RicciNode";
    /**
     *  @param ricci_n The value for ricci
     *  @param children The children to add to this node. Just a convenient parameter, you can do it manually using addChild
     */
    constructor(ricci_n, children) {
        super();
        this.ricci_n = ricci_n;
        if (children) {
            let self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }
        // Tmp consts to speed up computation (no reallocations)
        this.tmp_v_arr = new Float32Array(0);
        this.tmp_m_arr = [];
        // temp consts to speed up evaluation by avoiding allocations
        this.tmp_res = { v: 0, g: null, m: null };
        this.tmp_g = new Vector3();
        this.tmp_m = new Material();
    }
    /**
     * @link Node.getType
     */
    getType() {
        return RicciNode.type;
    }
    ;
    /**
     * @link Node.toJSON
     */
    toJSON() {
        let res = {
            ...super.toJSON(),
            ricci_n: this.ricci_n
        };
        return res;
    }
    ;
    /**
     * @link Node.fromJSON
     */
    fromJSON(json) {
        let res = new RicciNode(json.ricci_n);
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }
    ;
    /**
     * @link Node.prepareForEval
     */
    prepareForEval() {
        if (!this.valid_aabb) {
            this.aabb = new Box3(); // Create empty BBox
            for (let i = 0; i < this.children.length; ++i) {
                let c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB()); // new aabb is computed according to remaining children aabb
            }
            this.valid_aabb = true;
            // Prepare tmp arrays
            if (this.tmp_v_arr.length < this.children.length) {
                this.tmp_v_arr = new Float32Array(this.children.length * 2);
                this.tmp_m_arr.length = this.children.length * 2;
                for (let i = 0; i < this.tmp_m_arr.length; ++i) {
                    this.tmp_m_arr[i] = new Material({ roughness: 0, metalness: 0 });
                }
            }
        }
    }
    ;
    /**
     *  @link Element.value for a complete description
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
            res.m.copy(Material.defaultMaterial);
        }
        if (res.g) {
            res.g.set(0, 0, 0);
        }
        else if (res.step !== undefined) {
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
                        if (res.g && tmp.g) {
                            tmp.g.multiplyScalar(v_pow);
                            res.g.add(tmp.g);
                        }
                        // material if needed
                        if (res.m && tmp.m) {
                            v_arr[mv_arr_n] = tmp.v * v_pow;
                            m_arr[mv_arr_n].copy(tmp.m);
                            mv_arr_n++;
                        }
                        // within primitive potential
                        if (res.step || res.stepOrtho) {
                            // we have to compute next step or nextStep z
                            res.step = Math.min((res.step ? res.step : res.stepOrtho), this.children[i].heuristicStepWithin());
                        }
                    }
                    // outside of the potential for this box, but within the box
                    else {
                        if (res.step !== undefined) {
                            res.step = Math.min(res.step, this.children[i].distanceTo(p));
                        }
                    }
                }
                else if (res.step || res.stepOrtho) {
                    res.step = Math.min((res.step ? res.step : res.stepOrtho), this.children[i].distanceTo(p));
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
        }
        else if (res.step !== undefined) {
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
    }
    ;
    setRicciN(n) {
        if (this.ricci_n != n) {
            this.ricci_n = n;
            this.invalidAABB();
        }
    }
    ;
    getRicciN() {
        return this.ricci_n;
    }
    ;
}
Types.register(RicciNode.type, { fromJSON: (new RicciNode(0)).fromJSON });

/**
 * @author Maxime Quiblier
 */
const Convergence = {
    // Limitations: 3D only, but can easily be rewritten for nD
    // The algorithm stops when :
    // - 2 consecutive steps are smaller than epsilon
    // - OR n_max_step is reached
    // Optimization roads :
    //      - 2 small steps may be too much, only 1 could be enough in most cases isn't it?
    // @todo write documentation to talk about failure cases.
    //
    // Variable used in function. This avoid reallocation.
    last_mov_pt: new Vector3(),
    grad: new Vector3(),
    eval_res_g: new Vector3(0, 0, 0),
    eval_res: { v: 0, m: null, g: null },
    vec: new Vector3(),
    safeNewton3D(pot, // Scalar Field to eval
    starting_point, // 3D point where we start, must comply to Vector3 API
    value, // iso value we are looking for
    epsilon, // Geometrical limit to stop
    n_max_step, // limit of number of step
    r_max, // max distance where we look for the iso
    //bounding_v,       // Bounding volume inside which we look for the iso, getting out will make the process stop.
    res // the resulting point
    ) {
        res.copy(starting_point);
        let i = 1;
        let consecutive_small_steps = 0;
        let broken = false;
        while (consecutive_small_steps != 2 && i <= n_max_step && !broken) {
            this.last_mov_pt.copy(res);
            this.eval_res.g = this.eval_res_g; // active gradient computation
            pot.value(res, this.eval_res);
            this.grad.copy(this.eval_res.g);
            if (this.grad.x !== 0.0 || this.grad.y !== 0.0 || this.grad.z !== 0.0) {
                const g_l = this.grad.length();
                let step = (value - this.eval_res.v) / g_l;
                if (step < epsilon && step > -epsilon) {
                    if (step > 0.0) {
                        step = epsilon / g_l;
                    }
                    else {
                        step = -epsilon / g_l;
                    }
                    consecutive_small_steps++;
                }
                else {
                    consecutive_small_steps = 0;
                }
                this.grad.normalize().multiplyScalar(step);
                res.add(this.grad);
                // If the newton step took us out of the bounding volume, we have to stop
                //if(!bounding_v.containsPoint(res))
                if (this.vec.subVectors(res, starting_point).lengthSq() > r_max * r_max) {
                    res.copy(starting_point);
                    return;
                }
            }
            else {
                broken = true;
            }
            ++i;
        }
        if (broken) {
            // return strating_point
            res.copy(starting_point);
            return;
        }
    },
    /** This algorithm uses Newton convergence to find a point epsilon close to
    *        a point "p" such that the given potential "pot" evaluated at "p" is "value".
    *        The search is constrained on line defined by (origin, search_dir), and between bounds
    *        defined by min_absc and max_absc which are the abscissae on the line with respect
    *        to origin and search_dir. search_dir should be normalized.
    *        The starting point is given with an abscissa : origin + starting_point_absc*search_dir
    *
    *   @param origin Point choosen as origin in the search line frame.
    *   @param search_dir_unit unit vector that, together with origin, defines the searching line. Should be normalized
    *   @param min_absc_inside Minimum abscissa on the line : the algorithm will not search for a point below this abscissa.
    *   @param max_absc_outside Maximum abscissa on the line : the algorithm will not search for a point above this abscissa.
    *   @param starting_point_absc Abscissa of the starting point, with respect to the search dir.
    *   @param value The potential value we are looking for on the line with respect to pot.Eval(..)
    *   @param epsilon We want the result to be at least epsilon close to the surface with respect to the
    *          distance Vector.norm(), we suppose this norm to be the one associated with the dot product Vector.operator |
    *   @param n_max_step Maximum of newton step before giving up.
    *
    *   @todo write documentation to talk about failure cases.
    *   @todo Should not normalise search_dir. Change that here and in all part of code where this is used.
    */
    safeNewton1D(pot, origin, search_dir_unit, min_absc_inside, max_absc_outside, starting_point_absc, value, epsilon, n_max_step, res // resulting point res.p and gradient res.g (if res.g defined) resulting absc in res.p_absc
    ) {
        this.eval_res.g = this.eval_res_g; // active gradient computation
        if (!(search_dir_unit.x !== 0.0 || search_dir_unit.y !== 0.0 || search_dir_unit.z !== 0.0)) {
            throw "Error : search direction is null";
        }
        if (epsilon <= 0) {
            throw "Error: epsilon <= 0, convergence will nuke your face or loop";
        }
        if (starting_point_absc < min_absc_inside || starting_point_absc > max_absc_outside) {
            throw "Error : starting absc is not in boundaries";
        }
        let curr_point_absc = starting_point_absc;
        const eval_pt = new Vector3();
        // Newton step until we overpass the surface
        // the minimum step is set to epsilon, that ensure we will cross the surface.
        let grad = 0;
        let step = 0;
        let i = 0;
        while (max_absc_outside - min_absc_inside > epsilon && i < n_max_step) {
            // curr_point_absc is guaranteed inside [min_absc_inside,max_absc_outside]
            pot.value(eval_pt.copy(search_dir_unit).multiplyScalar(curr_point_absc).add(origin), this.eval_res);
            // update bounding absc
            if (this.eval_res.v > value) {
                min_absc_inside = curr_point_absc;
            }
            else {
                max_absc_outside = curr_point_absc;
            }
            // Analytical gradient evaluation + dot product should be less than 2 evaluations in cost.
            grad = this.eval_res.g.dot(search_dir_unit);
            if (grad !== 0.0) {
                step = (value - this.eval_res.v) / grad;
                curr_point_absc += step;
                // Dichotomy step
                if (curr_point_absc >= max_absc_outside || curr_point_absc <= min_absc_inside) {
                    curr_point_absc = (max_absc_outside + min_absc_inside) * 0.5;
                }
            }
            else {
                // Dichotomy step
                curr_point_absc = (max_absc_outside + min_absc_inside) * 0.5;
            }
            ++i;
        }
        res.p_absc = (max_absc_outside + min_absc_inside) * 0.5; // approximate
        res.p.copy(search_dir_unit).multiplyScalar(curr_point_absc).add(origin);
        if (res.g !== undefined) {
            if (i === 0) {
                pot.value(res.p, this.eval_res);
            }
            res.g.copy(this.eval_res.g);
        }
    },
    dichotomy1D(pot, origin, search_dir_unit, startStepLength, value, epsilon, n_max_step, // TODO : Useless, since dichotomia is absolutely deterministic, n step is startStepLength/(2^n) accuracy...
    //        OR epsilon is the uselss one...
    res // resulting point res.p and gradient res.g (if res.g defined) resulting absc in res.p_absc
    ) {
        this.eval_res.g = null; // deactive gradient computation
        let previousPos = new Vector3().copy(origin);
        let currentStep = new Vector3();
        // intersection
        // dichotomia: first step is going back half of the previous distance
        startStepLength /= 2;
        let dist = -startStepLength;
        let previousDist = dist;
        origin.sub(currentStep.copy(search_dir_unit)
            .multiplyScalar(startStepLength));
        let nstep = 0;
        while ((startStepLength > epsilon) && (nstep < n_max_step)) {
            nstep++;
            previousPos.copy(origin);
            previousDist = dist;
            startStepLength /= 2;
            // not asking for the next step, which is always half of previous
            pot.value(origin, this.eval_res);
            if (this.eval_res.v < value) {
                // before the surface: go forward
                origin.add(currentStep.copy(search_dir_unit)
                    .multiplyScalar(startStepLength));
                dist += startStepLength;
            }
            else {
                // after the surface: go backward
                origin.sub(currentStep.copy(search_dir_unit)
                    .multiplyScalar(startStepLength));
                dist -= startStepLength;
            }
        }
        // linear interpolation with previous pos
        res.p.copy(origin.add(previousPos).divideScalar(2));
        res.p_absc = (previousDist + dist) / 2;
        // linear interpolation with previous pos
        res.p.copy(origin);
        res.p_absc = dist;
        // test wether the caller wanted to compute the gradient
        // (we assume that if res.g is defined, it's a request)
        if (res.g) {
            this.eval_res.g = this.eval_res_g; // active gradient computation
            pot.value(res.p, this.eval_res);
            res.g.copy(this.eval_res.g);
        }
    }
};

/**
 *  The root of any implicit blobtree. Does behave computationaly like a RicciNode with n = 64.
 *  The RootNode is the only node to be its own parent.
 *  @constructor
 *  @extends RicciNode
 */
class RootNode extends RicciNode {
    iso_value;
    trimmed;
    trim_parents;
    static type = "RootNode";
    static fromJSON(json) {
        const res = new RootNode();
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }
    ;
    constructor() {
        // Default RootNode is a riccinode with ricci_n = 64 (almost a max)
        super(64);
        this.valid_aabb = true;
        // Default iso value, value where the surface is present
        this.iso_value = 1.0;
        // Set some nodes as "trimmed", so they are not evaluated.
        this.trimmed = [];
        this.trim_parents = [];
    }
    /**
     * @link Node.getType
     */
    getType() {
        return RootNode.type;
    }
    ;
    /**
     * @link RicciNode.toJSON
     */
    toJSON() {
        const res = {
            ...super.toJSON(),
            iso: this.iso_value
        };
        return res;
    }
    ;
    getIsoValue() {
        return this.iso_value;
    }
    ;
    setIsoValue(v) {
        this.iso_value = v;
    }
    ;
    /**
     *  @return The neutral value of this tree, ie the value of the field in empty region of space.
     *                   This is an API for external use and future development. For now it is hard set to 0.
     */
    getNeutralValue() {
        return 0;
    }
    ;
    /**
     * @link Node.invalidAABB for a complete description
     */
    invalidAABB() {
        this.valid_aabb = false;
    }
    ;
    /**
     *  Basically perform a trim but keep track of trimmed elements.
     *  This is usefull if you want to trim, then untrim, then trim, etc...
     *  For example, this is very useful for evaluation optimization.
     */
    internalTrim(aabb) {
        if (!(this.trimmed.length === 0 && this.trim_parents.length === 0)) {
            throw "Error : you should not call internal trim if you have not untrimmed before. Call untrim or use externalTrim";
        }
        this.trim(aabb, this.trimmed, this.trim_parents);
    }
    ;
    /**
     *  Wrapper for trim, will help programmers to make the difference between
     *  internal and external trim.
     *  @param trimmed Array of trimmed Elements
     *  @param parents Array of fathers from which each trimmed element has been removed.
     */
    externalTrim(aabb, trimmed, parents) {
        this.trim(aabb, trimmed, parents);
    }
    ;
    /**
     *  Reset the full blobtree
     */
    internalUntrim() {
        this.untrim(this.trimmed, this.trim_parents);
        this.trimmed.length = 0;
        this.trim_parents.length = 0;
    }
    ;
    /**
     *  Reset the full blobtree given previous trimming data.
     *  Note : don't forget to recall prepareForEval if you want to perform evaluation.
     *  @param trimmed Array of trimmed Elements
     *  @param parents Array of fathers from which each trimmed element has been removed.
     */
    untrim(trimmed, parents) {
        if (!(trimmed.length === parents.length)) {
            throw "Error : trimmed and parents arrays should have the same length";
        }
        for (let i = 0; i < trimmed.length; ++i) {
            parents[i].addChild(trimmed[i]);
        }
    }
    ;
    /**
     *  Tell if the blobtree is empty
     *  @return true if blobtree is empty
     */
    isEmpty() {
        return this.children.length == 0;
    }
    ;
    intersectRayBlob = function () {
        const curPos = new Vector3();
        const marchingVector = new Vector3();
        const currentStep = new Vector3();
        const tmp_res = {
            v: 0,
            g: new Vector3(),
            m: null,
            step: 0
        };
        const conv_res = {
            p: new Vector3(),
            g: new Vector3(),
            p_absc: 0.0
        };
        let previousStepLength = 0;
        let previousValue = 0; // used for linear interp for a better guess
        let dist = 0;
        /**
         *  @param ray Ray to cast for which intersection is seeked.
         *
         *  @param maxDistance If the intersection is not located at a distance
         *                              lower than maxDistance, it will not be considered.
         *                              The smaller this is, the faster the casting will be.
         *  @param _precision Distance to the intersection under which we will
         *                            consider to be on the intersection point.
         *
         *  @return True if an intersection has been found.
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
            if (tmp_res.step === undefined)
                throw "[RootNode] intersectRayBlob: step is not defined in the value result. This cannot happen.";
            while ((tmp_res.v < this.iso_value) && (dist < maxDistance)) {
                curPos.add(currentStep.copy(marchingVector).multiplyScalar(tmp_res.step));
                dist += tmp_res.step;
                previousStepLength = tmp_res.step;
                previousValue = tmp_res.v;
                this.value(curPos, tmp_res);
            }
            if (tmp_res.v >= this.iso_value) {
                Convergence.safeNewton1D(this, curPos, marchingVector.multiplyScalar(-1.0), 0.0, previousStepLength, previousStepLength * (this.iso_value - tmp_res.v) / (previousValue - tmp_res.v), // linear approx of the first position
                this.iso_value, previousStepLength / 512.0, //deltaPix*(dist-previousStepLength), // should be the size of a pixel at the previous curPos BROKEN?
                10, conv_res);
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
        const curPos = new Vector3();
        const resumePos = new Vector3();
        const tmp_res = {
            v: 0,
            m: null,
            g: null,
            step: 0
        };
        const g = new Vector3();
        const dicho_res = {
            v: 0,
            m: null,
            g: null
        };
        let previousStepLength = 0;
        let previousDist = 0;
        // to ensure that we're within the aabb
        const epsilon = 0.0000001;
        let within = -1;
        return function (wOffset, hOffset, res, dim) {
            if (dim.axis.x) {
                curPos.set(this.aabb.min.x + wOffset, this.aabb.min.y + hOffset, this.aabb.min.z + epsilon);
            }
            else if (dim.axis.y) {
                curPos.set(this.aabb.min.x + wOffset, this.aabb.min.y + epsilon, this.aabb.min.z + hOffset);
            }
            else if (dim.axis.z) {
                curPos.set(this.aabb.min.x + epsilon, this.aabb.min.y + wOffset, this.aabb.min.z + hOffset);
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
                    this.value(curPos, tmp_res);
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
                    // set constiable in order to resume to where we were
                    curPos.copy(resumePos);
                }
            }
        };
    }();
}
Types.register(RootNode.type, RootNode);

/**
 *  This class implement a ScaleNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
class ScaleNode extends Node {
    _scale;
    tmp_res;
    tmp_g;
    tmp_m;
    static type = "ScaleNode";
    /**
    *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children) {
        super();
        if (children) {
            const self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }
        // temp consts to speed up evaluation by avoiding allocations
        this.tmp_res = { v: 0, g: null, m: null };
        this.tmp_g = new Vector3();
        this.tmp_m = new Material();
        this._scale = new Vector3(1, 1, 1);
    }
    /**
    * @link Node.toJSON
    */
    toJSON() {
        let res = {
            ...super.toJSON(),
            scale_x: this._scale.x,
            scale_y: this._scale.y,
            scale_z: this._scale.z,
        };
        return res;
    }
    ;
    /**
     * @link Node.fromJSON
     */
    static fromJSON(json) {
        const res = new ScaleNode();
        res.setScale(new Vector3(json.scale_x, json.scale_y, json.scale_z));
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }
    /**
     * @link ScaleNode.setScale
     */
    setScale(scale) {
        this._scale.copy(scale);
        this.invalidAABB();
    }
    /**
     * @link Node.getType
     */
    getType() {
        return ScaleNode.type;
    }
    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval() {
        if (!this.valid_aabb) {
            this.aabb = new Box3(); // Create empty BBox
            for (let i = 0; i < this.children.length; ++i) {
                const c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB()); // new aabb is computed according to remaining children aabb
            }
            let bb_size = new Vector3();
            this.aabb.clone().getSize(bb_size);
            let x_scale = bb_size.x * (this._scale.x - 1.0);
            let y_scale = bb_size.y * (this._scale.y - 1.0);
            let z_scale = bb_size.z * (this._scale.z - 1.0);
            this.aabb.expandByVector(new Vector3(x_scale, y_scale, z_scale));
            this.valid_aabb = true;
        }
    }
    ;
    /**
    * @link Element.computeAABB for a complete description
    */
    computeAABB() {
        this.aabb.makeEmpty();
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].computeAABB();
            this.aabb.union(this.children[i].getAABB());
        }
        let bb_size = new Vector3();
        this.aabb.clone().getSize(bb_size);
        let x_scale = bb_size.x * (this._scale.x - 1.0);
        let y_scale = bb_size.y * (this._scale.y - 1.0);
        let z_scale = bb_size.z * (this._scale.z - 1.0);
        this.aabb.expandByVector(new Vector3(x_scale, y_scale, z_scale));
    }
    /**
     *  @link Element.value for a complete description
     */
    value(p, res) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)
        const l = this.children.length;
        const tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;
        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material.defaultMaterial);
        }
        if (res.g) {
            res.g.set(0, 0, 0);
        }
        else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }
        if (this.aabb.containsPoint(p) && l !== 0) {
            let center = new Vector3();
            this.aabb.getCenter(center);
            let st_p = new Vector3((p.x - center.x) / this._scale.x + center.x, (p.y - center.y) / this._scale.y + center.y, (p.z - center.z) / this._scale.z + center.z);
            res.v = Number.MAX_VALUE;
            for (let i = 0; i < l; ++i) {
                this.children[i].value(st_p, tmp);
                res.v = tmp.v;
                if (res.g && tmp.g) {
                    res.g.copy(tmp.g);
                }
                if (res.m && tmp.m) {
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
     */
    trim(aabb, trimmed, parents) {
        // Trim remaining nodes
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    }
    ;
}
Types.register(ScaleNode.type, ScaleNode);

/**
 *  This class implement a TwistNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
class TwistNode extends Node {
    _twist_amount;
    _twist_axis;
    _twist_axis_mat;
    _twist_axis_mat_inv;
    tmp_res;
    tmp_g;
    tmp_m;
    static type = "TwistNode";
    /**
    *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children) {
        super();
        if (children) {
            const self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }
        // temp consts to speed up evaluation by avoiding allocations
        /** @type {{v:number, g:Vector3, m:Material}} */
        this.tmp_res = { v: 0, g: null, m: null };
        /** @type {Vector3} */
        this.tmp_g = new Vector3();
        /** @type {Material} */
        this.tmp_m = new Material();
        this._twist_amount = 1.0;
        this._twist_axis = new Vector3(0.0, 1.0, 0.0);
        this._twist_axis_mat = new Matrix4();
        this._twist_axis_mat_inv = new Matrix4();
    }
    /**
    * @link Node.toJSON
    * @returns {TwistNodeJSON}
    */
    toJSON() {
        let res = {
            ...super.toJSON(),
            twist_amount: this._twist_amount,
            axis_x: this._twist_axis.x,
            axis_y: this._twist_axis.y,
            axis_z: this._twist_axis.z,
        };
        return res;
    }
    ;
    /**
     *@link Node.fromJSON
     *
     * @param {TwistNodeJSON} json
     * @returns {TwistNode}
     */
    static fromJSON(json) {
        const res = new TwistNode();
        res.setTwistAmount(json.twist_amount);
        res.setTwistAxis(new Vector3(json.axis_x, json.axis_y, json.axis_z));
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }
    setTwistAmount(amount) {
        this._twist_amount = amount;
    }
    setTwistAxis(axis) {
        this._twist_axis = axis;
        this._computeTransforms();
    }
    _computeTransforms() {
        let r_angle = Math.acos(this._twist_axis.dot(new Vector3(0, 1, 0)));
        if (Math.abs(r_angle) > 0.0001) {
            let t_axis = this._twist_axis.clone();
            let rot_axis = t_axis.cross(new Vector3(0, 1, 0));
            rot_axis.normalize();
            this._twist_axis_mat.makeRotationAxis(rot_axis, r_angle);
        }
        else {
            this._twist_axis_mat.identity();
        }
        this._twist_axis_mat_inv = this._twist_axis_mat.clone();
        this._twist_axis_mat_inv.invert();
    }
    getType() {
        return TwistNode.type;
    }
    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval() {
        if (!this.valid_aabb) {
            this.aabb = new Box3(); // Create empty BBox
            for (let i = 0; i < this.children.length; ++i) {
                const c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB()); // new aabb is computed according to remaining children aabb
            }
            this.valid_aabb = true;
        }
    }
    ;
    /**
     *  @link Element.value for a complete description
     */
    value(p, res) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)
        const l = this.children.length;
        const tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;
        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material.defaultMaterial);
        }
        if (res.g) {
            res.g.set(0, 0, 0);
        }
        else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }
        if (this.aabb.containsPoint(p) && l !== 0) {
            let center = new Vector3();
            this.aabb.getCenter(center);
            //Center the input point
            let t_p = new Vector3(p.x - center.x, p.y - center.y, p.z - center.z);
            //Rotate towards twist axis space
            t_p.applyMatrix4(this._twist_axis_mat);
            //Twist          
            let c_twist = Math.cos(this._twist_amount * t_p.y);
            let s_twist = Math.sin(this._twist_amount * t_p.y);
            //Revert to world space
            let q = new Vector3(c_twist * t_p.x - s_twist * t_p.z, t_p.y, s_twist * t_p.x + c_twist * t_p.z);
            q.applyMatrix4(this._twist_axis_mat_inv);
            let t_q = new Vector3(q.x + center.x, q.y + center.y, q.z + center.z);
            res.v = Number.MAX_VALUE;
            for (let i = 0; i < l; ++i) {
                this.children[i].value(t_q, tmp);
                res.v = tmp.v;
                if (res.g && tmp.g) {
                    res.g.copy(tmp.g);
                }
                if (res.m && tmp.m) {
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
     */
    trim(aabb, trimmed, parents) {
        // Trim remaining nodes
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    }
    ;
}
Types.register(TwistNode.type, TwistNode);

/**
 * Accuracies Contains the accuracies needed in Areas. Can be changed when importing blobtree.js.
 * For classic segments and sphere, we setteled for a raw accuracy being proportional to
 * the radii. 1/3 of the radius is considered nice, 1 radius is considered raw.
 * For new primitives, feel free to create your own accuracies factors depending on the features.
 */
const Accuracies = {
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

/**
 *  General representation of a "Capsule" area, ie, 2 sphere connected by a cone.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @extends {Area}
 *
 * @constructor
 */
class AreaCapsule extends Area {
    p1;
    p2;
    r1;
    r2;
    accFactor1;
    accFactor2;
    unit_dir;
    length;
    vector;
    p1_to_p;
    p1_to_p_sqrnorm;
    x_p_2D;
    y_p_2D;
    y_p_2DSq;
    ortho_vec_x;
    ortho_vec_y;
    p_proj_x;
    p_proj_y;
    abs_diff_thick;
    /**
     *  @param p1 First point of the shape
     *  @param p2 Second point of the shape
     *  @param r1 radius at p1
     *  @param r2 radius at p2
     *  @param accFactor1 Apply an accuracy factor to the standard one, around p1. Default to 1.
     *  @param accFactor2 Apply an accuracy factor to the standard one, around p2. Default to 1.
     */
    constructor(p1, p2, r1, r2, accFactor1 = 1, accFactor2 = 1) {
        super();
        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.r1 = r1;
        this.r2 = r2;
        this.accFactor1 = accFactor1;
        this.accFactor2 = accFactor2;
        this.unit_dir = new Vector3().subVectors(p2, p1);
        this.length = this.unit_dir.length();
        this.unit_dir.normalize();
        // tmp var for functions below
        this.vector = new Vector3();
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
     * Compute some of the tmp variables. Used to factorized other functions code.
     * @param p A point as a Vector3
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
        const t = -this.y_p_2D / this.ortho_vec_y;
        // P proj is the point at the intersection of:
        //              - the local X axis (computation in the unit_dir basis)
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        this.p_proj_x = this.x_p_2D + t * this.ortho_vec_x;
        this.p_proj_y = 0.0;
    }
    ;
    /**
     * @link Area.sphereIntersect for a complete description
     * @todo Check the Maths (Ask Cedric Zanni?)
     * @param sphere
     * @return true if the sphere and the area intersect
     */
    sphereIntersect(sphere) {
        this.proj_computation(sphere.center);
        if (this.p_proj_x < 0.0) {
            return (Math.sqrt(this.p1_to_p_sqrnorm) - sphere.radius < this.r1);
        }
        else {
            if (this.p_proj_x > this.length) {
                this.vector.subVectors(sphere.center, this.p2);
                return (Math.sqrt(this.vector.lengthSq()) - sphere.radius < this.r2);
            }
            else {
                const sub1 = this.x_p_2D - this.p_proj_x;
                const dist = sub1 * sub1 + this.y_p_2DSq;
                const tt = this.p_proj_x / this.length;
                const inter_w = this.r1 * (1.0 - tt) + tt * this.r2;
                const tmp = sphere.radius + inter_w;
                return (dist < tmp * tmp);
            }
        }
    }
    /**
     * @link Area.contains for a complete description
     * @param p
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
        }
        else {
            if (this.p_proj_x > this.length) {
                // Proj is after the line segment beginning defined by P1: spherical containment
                this.vector.subVectors(p, this.p2);
                return this.vector.lengthSq() < this.r2 * this.r2;
            }
            else {
                // Proj is in between the line segment P1-P0: Linear kind of containment
                const sub1 = this.x_p_2D - this.p_proj_x;
                const sub2 = this.y_p_2D - this.p_proj_y;
                const dist2 = sub1 * sub1 + sub2 * sub2;
                const tt = this.p_proj_x / this.length;
                const inter_w = this.r1 * (1.0 - tt) + tt * this.r2;
                return dist2 < inter_w * inter_w;
            }
        }
    }
    /**
     *  @link Area.getAcc for a complete description
     *  @return the accuracy needed in the intersection zone
     *  @param sphere  A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor  the ratio to determine the wanted accuracy.
     *  @todo Check the Maths
     */
    getAcc(sphere, factor) {
        this.proj_computation(sphere.center);
        const tmp = this.abs_diff_thick / this.length;
        const half_delta = sphere.radius * Math.sqrt(1 + tmp * tmp) * 0.5;
        // we check only the direction where the weight is minimum since
        // we will return minimum accuracy needed in the area.
        let absc = this.p_proj_x;
        absc += this.r1 > this.r2 ? half_delta : -half_delta;
        if (absc < 0.0) {
            return this.r1 * this.accFactor1 * factor;
        }
        else if (absc > this.length) {
            return this.r2 * this.accFactor2 * factor;
        }
        else {
            const tt = absc / this.length;
            const inter_w = this.r1 * this.accFactor1 * (1.0 - tt) + tt * this.r2 * this.accFactor2;
            return inter_w * factor;
        }
    }
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere) {
        return this.getAcc(sphere, Accuracies.nice);
    }
    /**
     *  @link Area.getCurrAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere) {
        return this.getAcc(sphere, Accuracies.curr);
    }
    /**
     *  @link Area.getRawAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere) {
        return this.getAcc(sphere, Accuracies.raw);
    }
    /**
     * @link Area.getMinAcc
     * @return
     */
    getMinAcc() {
        return Accuracies.curr * Math.min(this.r1 * this.accFactor1, this.r2 * this.accFactor2);
    }
    /**
     * @link Area.getMinRawAcc
     * @return
     */
    getMinRawAcc() {
        return Accuracies.raw * Math.min(this.r1 * this.accFactor1, this.r2 * this.accFactor2);
    }
    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis, t) {
        let step = Number.MAX_VALUE;
        const p1 = this.p1[axis] < this.p2[axis] ? this.p1 : this.p2;
        let p2, r1, r2;
        if (p1 === this.p1) {
            p2 = this.p2;
            r1 = this.r1 * this.accFactor1;
            r2 = this.r2 * this.accFactor2;
        }
        else {
            p2 = this.p1;
            r1 = this.r2;
            r2 = this.r1 * this.accFactor1;
        }
        let diff = t - p1[axis];
        if (diff < -2 * r1) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * r1), Accuracies.curr * r1));
        }
        else if (diff < 2 * r1) {
            step = Math.min(step, Accuracies.curr * r1);
        }
        diff = t - p2[axis];
        if (diff < -2 * r2) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * r2), Accuracies.curr * r2));
        }
        else if (diff < 2 * r2) {
            step = Math.min(step, Accuracies.curr * r2);
        }
        const tbis = t - p1[axis];
        const axis_l = p2[axis] - p1[axis];
        if (tbis > 0 && tbis < axis_l && axis_l !== 0) {
            step = Math.min(step, Accuracies.curr * (r1 + (tbis / axis_l) * (r2 - r1)));
        }
        return step;
    }
}

let KS = 2.0;
let KIS = 1 / KS;
let KS2 = 4.0;
let KIS2 = 1 / (KS * KS);
/**
 *  Compute the iso value at a given distance for a given polynomial degree
 *  and scale in 0 dimension (point)
 *
 *  @param degree  Polynomial degree of the kernel
 *  @param scale   Kernel scale
 *  @param dist    Distance
 *  @return The iso value at a given distance for a given polynomial degree and scale
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
 *  @param degree  Polynomial degree of the kernel
 *  @param scale   Kernel scale
 *  @param dist    Distance
 *  @return The iso value at a given distance for a given polynomial degree and scale
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
 *  @param degree  Polynomial degree of the kernel
 *  @param scale   Kernel scale
 *  @param dist    Distance
 *  @return The iso value at a given distance for a given polynomial degree and scale
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
const ScalisMath = {
    KS: KS,
    KIS: KIS,
    KS2: KS2,
    KIS2: KIS2,
    /**
     *  Compact Polynomial of degree 6 evaluation function
     *  @param r Radius (ie distance)
     */
    Poly6Eval: function (r) {
        var aux = 1.0 - KIS2 * r * r;
        if (aux > 0.0) {
            return aux * aux * aux;
        }
        else {
            return 0.0;
        }
    },
    /**
     *  Compact Polynomial of degree 6 evaluation function from a squared radius.
     *  (avoid square roots in some cases)
     *  @param r2 Radius squared (ie distance squared)
     */
    Poly6EvalSq: function (r2) {
        var aux = 1.0 - KIS2 * r2;
        if (aux > 0.0) {
            return aux * aux * aux;
        }
        else {
            return 0.0;
        }
    },
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 0 dimension (point)
     *
     *  @param degree  Polynomial degree of the kernel
     *  @param scale   Kernel scale
     *  @param dist    Distance
     *  @return The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom0D: GetIsoValueAtDistanceGeom0D,
    /**
     * Normalization Factor for polynomial 4 in 0 dimension
     * @const
     */
    Poly4NF0D: 1.0 / GetIsoValueAtDistanceGeom0D(4, KS, 1.0),
    /**
     * Normalization Factor for polynomial 6 in 0 dimension
     * @const
     */
    Poly6NF0D: 1.0 / GetIsoValueAtDistanceGeom0D(6, KS, 1.0),
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 1 dimension
     *
     *  @param degree  Polynomial degree of the kernel
     *  @param scale   Kernel scale
     *  @param dist    Distance
     *  @return The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom1D: GetIsoValueAtDistanceGeom1D,
    /**
     * Normalization Factor for polynomial 4 in 1 dimension
     * @const
     */
    Poly4NF1D: 1.0 / GetIsoValueAtDistanceGeom1D(4, KS, 1.0),
    /**
     * Normalization Factor for polynomial 6 in 1 dimension
     * @const
     */
    Poly6NF1D: 1.0 / GetIsoValueAtDistanceGeom1D(6, KS, 1.0),
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 2 dimensions
     *
     *  @param degree  Polynomial degree of the kernel
     *  @param scale   Kernel scale
     *  @param dist    Distance
     *  @return The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom2D: GetIsoValueAtDistanceGeom2D,
    /**
     * Normalization Factor for polynomial 4 in 2 dimension
     * @const
     */
    Poly4NF2D: 1.0 / GetIsoValueAtDistanceGeom2D(4, KS, 1.0),
    /**
     * Normalization Factor for polynomial 6 in 2 dimension
     * @const
     */
    Poly6NF2D: 1.0 / GetIsoValueAtDistanceGeom2D(6, KS, 1.0)
};

/**
 *  Bounding area for the segment.
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *  The resulting volume is a clipped cone with spherical extremities, which is
 *  actually the support of the primitive.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere for now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 *  @extends {Area}
 *  @todo should be possible to replace with an AreaCapsule
 *
 */
class AreaScalisSeg extends Area {
    p0;
    p1;
    thick0;
    thick1;
    unit_dir;
    length;
    vector;
    p0_to_p;
    p0_to_p_sqrnorm;
    x_p_2D;
    y_p_2D;
    y_p_2DSq;
    ortho_vec_x;
    ortho_vec_y;
    p_proj_x;
    p_proj_y;
    abs_diff_thick;
    /**
     * @param p0 first point of the shape
     * @param p1 second point of the shape
     * @param thick0 radius at p0
     * @param thick1 radius at p1
     */
    constructor(p0, p1, thick0, thick1) {
        super();
        this.p0 = new Vector3(p0.x, p0.y, p0.z);
        this.p1 = new Vector3(p1.x, p1.y, p1.z);
        this.thick0 = thick0;
        this.thick1 = thick1;
        this.unit_dir = new Vector3().subVectors(p1, p0);
        this.length = this.unit_dir.length();
        this.unit_dir.normalize();
        // tmp var for functions below
        this.vector = new Vector3();
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
    * @param p A point as a Vector3
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
        const t = -this.y_p_2D / this.ortho_vec_y;
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
     * @return true if the sphere and the area intersect
     */
    sphereIntersect(sphere) {
        this.proj_computation(sphere.center);
        if (this.p_proj_x < 0.0) {
            return (Math.sqrt(this.p0_to_p_sqrnorm) - sphere.radius < this.thick0 * ScalisMath.KS);
        }
        else {
            if (this.p_proj_x > this.length) {
                this.vector.subVectors(sphere.center, this.p1);
                return (Math.sqrt(this.vector.lengthSq()) - sphere.radius < this.thick1 * ScalisMath.KS);
            }
            else {
                const sub1 = this.x_p_2D - this.p_proj_x;
                const dist = sub1 * sub1 + this.y_p_2DSq;
                const tt = this.p_proj_x / this.length;
                const inter_w = this.thick0 * (1.0 - tt) + tt * this.thick1;
                const tmp = sphere.radius + inter_w * ScalisMath.KS;
                return (dist < tmp * tmp);
            }
        }
    }
    /**
     * @link Area.contains for a complete description
     */
    contains(p) {
        this.proj_computation(p);
        // P proj is the point at the intersection of:
        //              - the X axis
        //                  and
        //              - the line defined by P and the vector orthogonal to the weight line
        if (this.p_proj_x < 0.0) {
            // Proj is before the line segment beginning defined by P0: spherical containment
            return this.p0_to_p_sqrnorm < this.thick0 * this.thick0 * ScalisMath.KS2;
        }
        else {
            if (this.p_proj_x > this.length) {
                // Proj is after the line segment beginning defined by P1: spherical containment
                this.vector.subVectors(p, this.p1);
                return this.vector.lengthSq() < this.thick1 * this.thick1 * ScalisMath.KS2;
            }
            else {
                // Proj is in between the line segment P1-P0: Linear kind of containment
                const sub1 = this.x_p_2D - this.p_proj_x;
                const sub2 = this.y_p_2D - this.p_proj_y;
                const dist2 = sub1 * sub1 + sub2 * sub2;
                const tt = this.p_proj_x / this.length;
                const inter_w = this.thick0 * (1.0 - tt) + tt * this.thick1;
                return dist2 < inter_w * inter_w * ScalisMath.KS2;
            }
        }
    }
    /**
     *  @link Area.getAcc for a complete description
     *
     *  @param sphere  A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor  the ratio to determine the wanted accuracy.
     *
     *  @return the accuracy needed in the intersection zone
     *  @todo Check the Maths
     */
    getAcc(sphere, factor) {
        this.proj_computation(sphere.center);
        const tmp = this.abs_diff_thick / this.length;
        const half_delta = sphere.radius * Math.sqrt(1 + tmp * tmp) * 0.5;
        // we check only the direction where the weight is minimum since
        // we will return minimum accuracy needed in the area.
        let absc = this.p_proj_x;
        absc += this.thick0 > this.thick1 ? half_delta : -half_delta;
        if (absc < 0.0) {
            return this.thick0 * factor;
        }
        else if (absc > this.length) {
            return this.thick1 * factor;
        }
        else {
            const tt = absc / this.length;
            const inter_w = this.thick0 * (1.0 - tt) + tt * this.thick1;
            return inter_w * factor;
        }
    }
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere) {
        return this.getAcc(sphere, Accuracies.nice);
    }
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere) {
        return this.getAcc(sphere, Accuracies.curr);
    }
    /**
     *  @link Area.getRawAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere) {
        return this.getAcc(sphere, Accuracies.raw);
    }
    /**
     * @link Area.getMinAcc
     */
    getMinAcc() {
        return Accuracies.curr * Math.min(this.thick0, this.thick1);
    }
    /**
     * @link Area.getMinRawAcc
     */
    getMinRawAcc() {
        return Accuracies.raw * Math.min(this.thick0, this.thick1);
    }
    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis, t) {
        let step = Number.MAX_VALUE;
        const p0 = this.p0[axis] < this.p1[axis] ? this.p0 : this.p1;
        let p1, thick0, thick1;
        if (p0 === this.p0) {
            p1 = this.p1;
            thick0 = this.thick0;
            thick1 = this.thick1;
        }
        else {
            p1 = this.p0;
            thick0 = this.thick1;
            thick1 = this.thick0;
        }
        let diff = t - p0[axis];
        if (diff < -2 * thick0) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * thick0), Accuracies.curr * thick0));
        }
        else if (diff < 2 * thick0) {
            step = Math.min(step, Accuracies.curr * thick0);
        }
        diff = t - p1[axis];
        if (diff < -2 * thick1) {
            step = Math.min(step, Math.max(Math.abs(diff + 2 * thick1), Accuracies.curr * thick1));
        }
        else if (diff < 2 * thick1) {
            step = Math.min(step, Accuracies.curr * thick1);
        }
        const tbis = t - p0[axis];
        const axis_l = p1[axis] - p0[axis];
        if (tbis > 0 && tbis < axis_l && axis_l !== 0) {
            step = Math.min(step, Accuracies.curr * (thick0 + (tbis / axis_l) * (thick1 - thick0)));
        }
        return step;
    }
}

const EPSILON = 0.000001;
const TriangleUtils = {
    /*
      ! Triangle extends Primitive and must have the following properties in constructor: !
    
        this.p0p1  = new Vector3();
        this.p1p2 = new Vector3();
        this.p2p0 = new Vector3();
        this.unit_normal = new Vector3();
        this.unit_p0p1 = new Vector3();
        this.unit_p1p2 = new Vector3();
        this.unit_p2p0 = new Vector3();
        this.length_p0p1 = 0;
        this.length_p1p2 = 0;
        this.length_p2p0 = 0;
        this.diffThick_p0p1 = 0;
        this.diffThick_p0p1 = 0;
        this.diffThick_p0p1 = 0;
        this.main_dir = new Vector3();
        this.point_iso_zero = new Vector3();
        this.ortho_dir      = new Vector3();
        this.unsigned_ortho_dir = new Vector3();
        this.proj_dir       = new Vector3();
        this.equal_weights = false; // Use to skip computations for a specific case
    
        this.coord_max           = 0;
        this.coord_middle        = 0;
        this.unit_delta_weight   = 0;
        this.longest_dir_special = 0;
        this.max_seg_length      = 0;
        this.half_dir_1 = new Vector3();
        this.point_half = new Vector3();
        this.half_dir_2 = new Vector3();
        this.point_min = new Vector3();
        this.weight_min = 0;
    
    */
    /**
     * intermediary functions used in computeVectorsDirs
     */
    cleanIndex(ind, lengthArray) {
        let res = ind;
        if (lengthArray === 0) {
            throw new Error("Lenght of the array should not be 0");
        }
        if (lengthArray === 1) {
            return 0;
        }
        // negative index are looped back at the end of the array
        if (ind < 0)
            res = (lengthArray + ind) % lengthArray;
        // index greater than the array length are looped back at the beginning
        if (ind >= lengthArray) {
            res = ind % lengthArray;
        }
        return res;
    },
    /**
     * Updates the cached values of the triangle
     * @param triangle The triangles who's internal values need to be updated
     */
    updateComputedAttributes(triangle) {
        let v0_p = triangle.v[0].getPos();
        let v1_p = triangle.v[1].getPos();
        let v2_p = triangle.v[2].getPos();
        triangle.p0p1 ? triangle.p0p1.subVectors(v1_p, v0_p) : null;
        triangle.p1p2 ? triangle.p1p2.subVectors(v2_p, v1_p) : null;
        triangle.p2p0 ? triangle.p2p0.subVectors(v0_p, v2_p) : null;
        if (triangle.unit_normal && triangle.p0p1 && triangle.p2p0) {
            // triangle.unit_normal.crossVectors(triangle.p0p1,triangle.p1p2);
            triangle.unit_normal.crossVectors(triangle.p0p1, triangle.p2p0);
            triangle.unit_normal.normalize();
        }
        if (triangle.p0p1 && triangle.unit_p0p1) {
            triangle.length_p0p1 = triangle.p0p1.length();
            triangle.unit_p0p1.copy(triangle.p0p1);
            triangle.unit_p0p1.divideScalar(triangle.length_p0p1);
            triangle.diffThick_p0p1 = triangle.v[0].getThickness() - triangle.v[1].getThickness();
        }
        if (triangle.p1p2 && triangle.unit_p1p2) {
            triangle.length_p1p2 = triangle.p1p2.length();
            triangle.unit_p1p2.copy(triangle.p1p2);
            triangle.unit_p1p2.divideScalar(triangle.length_p1p2);
            triangle.diffThick_p1p2 = triangle.v[1].getThickness() - triangle.v[2].getThickness();
        }
        if (triangle.p2p0 && triangle.unit_p2p0) {
            triangle.length_p2p0 = triangle.p2p0.length();
            triangle.unit_p2p0.copy(triangle.p2p0);
            triangle.unit_p2p0.divideScalar(triangle.length_p2p0);
            triangle.diffThick_p2p0 = triangle.v[2].getThickness() - triangle.v[0].getThickness();
        }
        // Precomputation Used in mech computation
        // So we first find the direction of maximum weight constiation.
        let sortingArr = [];
        sortingArr.push({ vert: triangle.v[0].getPos(), thick: triangle.v[0].getThickness(), idx: 0 });
        sortingArr.push({ vert: triangle.v[1].getPos(), thick: triangle.v[1].getThickness(), idx: 1 });
        sortingArr.push({ vert: triangle.v[2].getPos(), thick: triangle.v[2].getThickness(), idx: 2 });
        // sort by the min thickness
        sortingArr.sort(function (a, b) { return a.thick - b.thick; });
        triangle.point_min = sortingArr[0].vert;
        triangle.weight_min = sortingArr[0].thick;
        // Cycle throught the other points
        let idx = TriangleUtils.cleanIndex(sortingArr[0].idx + 1, 3);
        let point_1 = triangle.v[idx].getPos();
        let weight_1 = triangle.v[idx].getThickness();
        idx = TriangleUtils.cleanIndex(sortingArr[0].idx + 2, 3);
        let point_2 = triangle.v[idx].getPos();
        let weight_2 = triangle.v[idx].getThickness();
        let dir_1 = new Vector3();
        dir_1 = dir_1.subVectors(point_1, triangle.point_min);
        let dir_2 = new Vector3();
        dir_2 = dir_2.subVectors(point_2, triangle.point_min);
        let delta_1 = weight_1 - triangle.weight_min;
        let delta_2 = weight_2 - triangle.weight_min;
        if (delta_1 < EPSILON || delta_2 < EPSILON) {
            if (delta_1 < delta_2) { //delta_1 is closer to 0
                triangle.ortho_dir = dir_1.clone();
                triangle.ortho_dir.normalize();
                // direction of fastest constiation of weight
                if (triangle.main_dir && triangle.unit_normal) {
                    triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
                    triangle.main_dir.normalize();
                    if ((triangle.main_dir.dot(dir_2)) < 0.0) {
                        triangle.main_dir.multiplyScalar(-1.0);
                    }
                }
                let coord_iso_zero_dir = -triangle.weight_min / delta_2;
                triangle.point_iso_zero = new Vector3(triangle.point_min.x + coord_iso_zero_dir * dir_2.x, triangle.point_min.y + coord_iso_zero_dir * dir_2.y, triangle.point_min.z + coord_iso_zero_dir * dir_2.z);
            }
            else { //delta_2 is closer to 0
                triangle.ortho_dir = dir_2.clone();
                triangle.ortho_dir.normalize();
                if (triangle.main_dir && triangle.unit_normal) {
                    // direction of fastest constiation of weight
                    triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
                    triangle.main_dir.normalize();
                    if ((triangle.main_dir.dot(dir_1)) < 0.0) {
                        triangle.main_dir.multiplyScalar(-1.0);
                    }
                }
                let coord_iso_zero_dir = -triangle.weight_min / delta_1;
                triangle.point_iso_zero = new Vector3(triangle.point_min.x + coord_iso_zero_dir * dir_1.x, triangle.point_min.y + coord_iso_zero_dir * dir_1.y, triangle.point_min.z + coord_iso_zero_dir * dir_1.z);
            }
            if (Math.abs(delta_1 - delta_2) < EPSILON) {
                if (triangle.unit_normal)
                    triangle.proj_dir = triangle.unit_normal.clone().multiplyScalar(-1);
                triangle.equal_weights = true;
            }
        }
        else { // WARNING : numerically instable if delta_ close to zero !
            // find the point were weight equal zero along the two edges that leave from point_min
            let coord_iso_zero_dir1 = -triangle.weight_min / delta_1;
            let point_iso_zero1 = new Vector3(triangle.point_min.x + coord_iso_zero_dir1 * dir_1.x, triangle.point_min.y + coord_iso_zero_dir1 * dir_1.y, triangle.point_min.z + coord_iso_zero_dir1 * dir_1.z);
            triangle.point_iso_zero = point_iso_zero1;
            let coord_iso_zero_dir2 = -triangle.weight_min / delta_2;
            let point_iso_zero2 = new Vector3(triangle.point_min.x + coord_iso_zero_dir2 * dir_2.x, triangle.point_min.y + coord_iso_zero_dir2 * dir_2.y, triangle.point_min.z + coord_iso_zero_dir2 * dir_2.z);
            // along ortho_dir the weight are const
            if (triangle.ortho_dir) {
                triangle.ortho_dir.subVectors(point_iso_zero2, point_iso_zero1);
                triangle.ortho_dir.normalize();
            }
            // direction of fastest constiation of weight
            if (triangle.main_dir && triangle.ortho_dir && triangle.unit_normal) {
                triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
                triangle.main_dir.normalize();
                if ((triangle.main_dir.dot(dir_1)) < 0.0 || (triangle.main_dir.dot(dir_2)) < 0.0) {
                    triangle.main_dir.multiplyScalar(-1.0);
                }
            }
        }
        if (triangle.main_dir) {
            let coord_1 = dir_1.dot(triangle.main_dir); // not normalized !
            let coord_2 = dir_2.dot(triangle.main_dir); // not normalized !
            // due to previous approximation for stability
            coord_1 = (coord_1 < 0.0) ? 0.0 : coord_1;
            coord_2 = (coord_2 < 0.0) ? 0.0 : coord_2;
            let longest_dir = null;
            if (coord_1 > coord_2) {
                longest_dir = dir_1;
                triangle.half_dir_1 = dir_2;
                triangle.point_half = point_2;
                triangle.half_dir_2 = point_1.clone().subVectors(point_1, point_2);
                triangle.coord_max = coord_1;
                triangle.coord_middle = (coord_2 / coord_1) * triangle.coord_max;
                triangle.unit_delta_weight = delta_1 / triangle.coord_max;
            }
            else {
                longest_dir = dir_2;
                triangle.half_dir_1 = dir_1;
                triangle.point_half = point_1;
                triangle.half_dir_2 = point_2.clone().subVectors(point_2, point_1);
                triangle.coord_max = coord_2;
                triangle.coord_middle = (coord_1 / coord_2) * triangle.coord_max;
                triangle.unit_delta_weight = delta_2 / triangle.coord_max;
            }
            triangle.longest_dir_special = longest_dir.divideScalar(triangle.coord_max);
        }
        // Length of the longest segment during numerical integration
        let tmp = new Vector3();
        if (triangle.half_dir_1 && triangle.longest_dir_special && triangle.coord_middle && triangle.ortho_dir) {
            tmp.subVectors(triangle.half_dir_1, triangle.longest_dir_special.clone().multiplyScalar(triangle.coord_middle));
            triangle.max_seg_length = tmp.length();
            triangle.unsigned_ortho_dir = triangle.ortho_dir.clone();
            if ((triangle.ortho_dir.dot(tmp)) < 0.0) {
                triangle.ortho_dir.multiplyScalar(-1.0);
            }
        }
    },
    /**
     *  Compute some internal consts for triangle
     *  @param triangle The triangle to compute consts for (blobtree or skel)
     *  @deprecated Please use updateComputedAtrributes instead
     */
    computeVectorsDirs(triangle) {
        let v0_p = triangle.v[0].getPos();
        let v1_p = triangle.v[1].getPos();
        let v2_p = triangle.v[2].getPos();
        triangle.p0p1.subVectors(v1_p, v0_p);
        triangle.p1p2.subVectors(v2_p, v1_p);
        triangle.p2p0.subVectors(v0_p, v2_p);
        //triangle.unit_normal.crossVectors(triangle.p0p1,triangle.p1p2);
        triangle.unit_normal.crossVectors(triangle.p0p1, triangle.p2p0);
        triangle.unit_normal.normalize();
        triangle.length_p0p1 = triangle.p0p1.length();
        triangle.unit_p0p1.copy(triangle.p0p1);
        triangle.unit_p0p1.divideScalar(triangle.length_p0p1);
        triangle.diffThick_p0p1 = triangle.v[0].getThickness() - triangle.v[1].getThickness();
        triangle.length_p1p2 = triangle.p1p2.length();
        triangle.unit_p1p2.copy(triangle.p1p2);
        triangle.unit_p1p2.divideScalar(triangle.length_p1p2);
        triangle.diffThick_p1p2 = triangle.v[1].getThickness() - triangle.v[2].getThickness();
        triangle.length_p2p0 = triangle.p2p0.length();
        triangle.unit_p2p0.copy(triangle.p2p0);
        triangle.unit_p2p0.divideScalar(triangle.length_p2p0);
        triangle.diffThick_p2p0 = triangle.v[2].getThickness() - triangle.v[0].getThickness();
        // Precomputation Used in mech computation
        // So we first find the direction of maximum weight constiation.
        /** @type Array<{vert: Vector3, thick: number, idx: number}> */
        let sortingArr = [];
        sortingArr.push({ vert: triangle.v[0].getPos(), thick: triangle.v[0].getThickness(), idx: 0 });
        sortingArr.push({ vert: triangle.v[1].getPos(), thick: triangle.v[1].getThickness(), idx: 1 });
        sortingArr.push({ vert: triangle.v[2].getPos(), thick: triangle.v[2].getThickness(), idx: 2 });
        // sort by the min thickness
        sortingArr.sort(function (a, b) { return a.thick - b.thick; });
        triangle.point_min = sortingArr[0].vert;
        triangle.weight_min = sortingArr[0].thick;
        // Cycle throught the other points
        let idx = TriangleUtils.cleanIndex(sortingArr[0].idx + 1, 3);
        let point_1 = triangle.v[idx].getPos();
        let weight_1 = triangle.v[idx].getThickness();
        idx = TriangleUtils.cleanIndex(sortingArr[0].idx + 2, 3);
        let point_2 = triangle.v[idx].getPos();
        let weight_2 = triangle.v[idx].getThickness();
        let dir_1 = new Vector3();
        dir_1 = dir_1.subVectors(point_1, triangle.point_min);
        let dir_2 = new Vector3();
        dir_2 = dir_2.subVectors(point_2, triangle.point_min);
        let delta_1 = weight_1 - triangle.weight_min;
        let delta_2 = weight_2 - triangle.weight_min;
        if (delta_1 < EPSILON || delta_2 < EPSILON) {
            if (delta_1 < delta_2) { //delta_1 is closer to 0
                triangle.ortho_dir = dir_1.clone();
                triangle.ortho_dir.normalize();
                // direction of fastest constiation of weight
                triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
                triangle.main_dir.normalize();
                if ((triangle.main_dir.dot(dir_2)) < 0.0) {
                    triangle.main_dir.multiplyScalar(-1.0);
                }
                let coord_iso_zero_dir = -triangle.weight_min / delta_2;
                triangle.point_iso_zero = new Vector3(triangle.point_min.x + coord_iso_zero_dir * dir_2.x, triangle.point_min.y + coord_iso_zero_dir * dir_2.y, triangle.point_min.z + coord_iso_zero_dir * dir_2.z);
            }
            else { //delta_2 is closer to 0
                triangle.ortho_dir = dir_2.clone();
                triangle.ortho_dir.normalize();
                // direction of fastest constiation of weight
                triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
                triangle.main_dir.normalize();
                if ((triangle.main_dir.dot(dir_1)) < 0.0) {
                    triangle.main_dir.multiplyScalar(-1.0);
                }
                let coord_iso_zero_dir = -triangle.weight_min / delta_1;
                triangle.point_iso_zero = new Vector3(triangle.point_min.x + coord_iso_zero_dir * dir_1.x, triangle.point_min.y + coord_iso_zero_dir * dir_1.y, triangle.point_min.z + coord_iso_zero_dir * dir_1.z);
            }
            if (Math.abs(delta_1 - delta_2) < EPSILON) {
                triangle.proj_dir = triangle.unit_normal.clone().multiplyScalar(-1);
                triangle.equal_weights = true;
            }
        }
        else { // WARNING : numerically instable if delta_ close to zero !
            // find the point were weight equal zero along the two edges that leave from point_min
            let coord_iso_zero_dir1 = -triangle.weight_min / delta_1;
            let point_iso_zero1 = new Vector3(triangle.point_min.x + coord_iso_zero_dir1 * dir_1.x, triangle.point_min.y + coord_iso_zero_dir1 * dir_1.y, triangle.point_min.z + coord_iso_zero_dir1 * dir_1.z);
            triangle.point_iso_zero = point_iso_zero1;
            let coord_iso_zero_dir2 = -triangle.weight_min / delta_2;
            let point_iso_zero2 = new Vector3(triangle.point_min.x + coord_iso_zero_dir2 * dir_2.x, triangle.point_min.y + coord_iso_zero_dir2 * dir_2.y, triangle.point_min.z + coord_iso_zero_dir2 * dir_2.z);
            // along ortho_dir the weight are const
            triangle.ortho_dir.subVectors(point_iso_zero2, point_iso_zero1);
            triangle.ortho_dir.normalize();
            // direction of fastest constiation of weight
            triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
            triangle.main_dir.normalize();
            if ((triangle.main_dir.dot(dir_1)) < 0.0 || (triangle.main_dir.dot(dir_2)) < 0.0) {
                triangle.main_dir.multiplyScalar(-1.0);
            }
        }
        let coord_1 = dir_1.dot(triangle.main_dir); // not normalized !
        let coord_2 = dir_2.dot(triangle.main_dir); // not normalized !
        // due to previous approximation for stability
        coord_1 = (coord_1 < 0.0) ? 0.0 : coord_1;
        coord_2 = (coord_2 < 0.0) ? 0.0 : coord_2;
        let longest_dir = null;
        if (coord_1 > coord_2) {
            longest_dir = dir_1;
            triangle.half_dir_1 = dir_2;
            triangle.point_half = point_2;
            triangle.half_dir_2 = point_1.clone().subVectors(point_1, point_2);
            triangle.coord_max = coord_1;
            triangle.coord_middle = (coord_2 / coord_1) * triangle.coord_max;
            triangle.unit_delta_weight = delta_1 / triangle.coord_max;
        }
        else {
            longest_dir = dir_2;
            triangle.half_dir_1 = dir_1;
            triangle.point_half = point_1;
            triangle.half_dir_2 = point_2.clone().subVectors(point_2, point_1);
            triangle.coord_max = coord_2;
            triangle.coord_middle = (coord_1 / coord_2) * triangle.coord_max;
            triangle.unit_delta_weight = delta_2 / triangle.coord_max;
        }
        triangle.longest_dir_special = longest_dir.divideScalar(triangle.coord_max);
        // Length of the longest segment during numerical integration
        let tmp = new Vector3();
        tmp.subVectors(triangle.half_dir_1, triangle.longest_dir_special.clone().multiplyScalar(triangle.coord_middle));
        triangle.max_seg_length = tmp.length();
        triangle.unsigned_ortho_dir = triangle.ortho_dir.clone();
        if ((triangle.ortho_dir.dot(tmp)) < 0.0) {
            triangle.ortho_dir.multiplyScalar(-1.0);
        }
    },
    /**
     *  @param triangle
     *     u parametrisation of the point to compute along the axis V0->V1
     *     v parametrisation of the point to compute along the axis V0->V2
     *  @return An object with the computed pos and thickness
     */
    getParametrisedVertexAttr(triangle, u, v) {
        let meanThick = TriangleUtils.getMeanThick(triangle, u, v);
        // create new point
        let pos = new Vector3();
        let uAdd = pos.subVectors(triangle.v[1].getPos(), triangle.v[0].getPos()).multiplyScalar(u);
        let vAdd = pos.clone().subVectors(triangle.v[2].getPos(), triangle.v[0].getPos()).multiplyScalar(v);
        pos.addVectors(triangle.v[0].getPos(), uAdd);
        pos.addVectors(pos, vAdd);
        return { "pos": pos, "thick": meanThick };
    },
    /**
     *  @param triangle The concerned triangle
     *  @param u u coordinate
     *  @param v v coordinate
     */
    getMeanThick(triangle, u, v) {
        return triangle.v[0].getThickness() * (1 - u - v) + triangle.v[1].getThickness() * u + triangle.v[2].getThickness() * v;
    },
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
     *  @param p0p1 Vector from p0 to p1
     *  @param p2p0 Vector from p2 to p0
     *  @param p0 Point 0 in triangle
     *  @param p Point in space
     *
     *  @return {{u:number,v:number}} Coordinate of barycenter
     */
    getTriBaryCoord(p0p1, p2p0, p0, p) {
        let U = p0p1;
        let V = p2p0.clone().multiplyScalar(-1);
        let W = new Vector3().subVectors(p, p0);
        // b == d
        let a = U.lengthSq();
        let b = U.dot(V);
        let c = W.dot(U);
        let d = V.lengthSq();
        let e = W.dot(V);
        let v = (a * e - b * c) / (a * d - b * b);
        let u = (c - v * b) / a;
        return { "u": u, "v": v };
    },
    getUVCoord(U, V, p0, p) {
        let W = new Vector3();
        W.crossVectors(U, V);
        let mat = new Matrix4();
        mat.set(U.x, V.x, W.x, 0, U.y, V.y, W.y, 0, U.z, V.z, W.z, 0, 0, 0, 0, 1);
        let mat1 = new Matrix4();
        mat1.copy(mat).invert();
        let vec = new Vector3().subVectors(p, p0);
        vec.applyMatrix4(mat1);
        return { u: vec.x, v: vec.y };
    }
};

var verticesIds = 0;
/**
 *  A scalis ScalisVertex. Basically a point and a wanted thickness.
 */
class ScalisVertex {
    static fromJSON(json) {
        return new ScalisVertex(new Vector3(json.position.x, json.position.y, json.position.z), json.thickness);
    }
    pos;
    thickness;
    id;
    prim = null; // The primitive using this vertex
    aabb = new Box3();
    valid_aabb = false;
    /**
     *  @param  pos A position in space, as a Vector3
     *  @param  thickness Wanted thickness at this point. Misnamed parameter : this is actually half the thickness.
     */
    constructor(pos, thickness) {
        this.pos = pos.clone();
        this.thickness = thickness;
        // Only used for quick fix Zanni Correction. Should be removed as soon as it's not useful anymore.
        this.id = verticesIds++;
    }
    ;
    /**
     *  Set an internal pointer to the primitive using this vertex.
     *  Should be called from primitive constructor.
     * @param prim
     */
    setPrimitive(prim) {
        if (this.prim === null) {
            this.prim = prim;
        }
    }
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
     *  @param pos A position in space, as a Vector3
     */
    setPos(pos) {
        this.valid_aabb = false;
        this.pos.copy(pos);
        this.prim?.invalidAABB();
    }
    /**
     *  Set a new thickness
     *  @param thickness The new thickness
     */
    setThickness(thickness) {
        this.valid_aabb = false;
        this.thickness = thickness;
        this.prim?.invalidAABB();
    }
    /**
     *  Set a both position and thickness
     *  @param thickness The new thickness
     *  @param pos A position in space, as a Vector3
     */
    setAll(pos, thickness) {
        this.valid_aabb = false;
        this.pos = pos;
        this.thickness = thickness;
        this.prim?.invalidAABB();
    }
    /**
     *  Get the current position
     *  @return Current position, as a Vector3
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
    }
    ;
    /**
     *  Get the current AxisAlignedBoundingBox
     *  @return The AABB of this vertex.
     */
    getAABB() {
        if (!this.valid_aabb) {
            this.computeAABB();
            this.valid_aabb = true;
        }
        return this.aabb;
    }
    ;
    /**
     *  Compute the current AABB.
     *  @protected
     */
    computeAABB() {
        var pos = this.getPos();
        var boundSupport = this.getThickness() * ScalisMath.KS;
        this.aabb.set(new Vector3(pos.x - boundSupport, pos.y - boundSupport, pos.z - boundSupport), new Vector3(pos.x + boundSupport, pos.y + boundSupport, pos.z + boundSupport));
    }
    /**
     *  Check equality between 2 vertices
     */
    equals(other) {
        return this.pos.equals(other.pos) && this.thickness === other.thickness;
    }
}

/**
 *  Bounding area for the triangle.
 *  It is the same for DIST and CONVOL primitives since the support of the convolution
 *  kernel is the same as the support for the distance field.
 *
 *  The Area must be able to return accuracy needed in a given zone (Sphere for now,
 *  since box intersections with such a complex shape are not trivial), and also
 *  propose an intersection test.
 *
 *  @extends {Area}
 */
class AreaScalisTri extends Area {
    tmpVect;
    min_thick;
    max_thick;
    v;
    p0p1;
    p2p0;
    unit_normal;
    main_dir;
    equal_weights;
    segParams; // Define type for segParams as per your actual structure
    segAttr;
    planeParams;
    segAreas;
    /**
     *  @param v Array or vertices
     *  @param unit_normal Normal to the plane made by the 3 vertices, as a Vector3
     *  @param main_dir Main direction depending on thicknesses
     *  @param min_thick Minimum thickness in the Triangle
     *  @param max_thick Maximum thickness in the triangle
     */
    constructor(v, unit_normal, main_dir, segParams, min_thick, max_thick) {
        super();
        this.tmpVect = new Vector3();
        this.min_thick = min_thick;
        this.max_thick = max_thick;
        this.v = v;
        this.p0p1 = this.tmpVect.clone().subVectors(this.v[1].getPos(), this.v[0].getPos());
        this.p2p0 = this.tmpVect.clone().subVectors(this.v[0].getPos(), this.v[2].getPos());
        this.unit_normal = unit_normal; // Normal computed from crossVectors of p0p1 and P2p1
        this.main_dir = main_dir;
        const delta_1 = Math.abs(this.v[0].getThickness() - this.v[1].getThickness());
        const delta_2 = Math.abs(this.v[1].getThickness() - this.v[2].getThickness());
        this.equal_weights =
            delta_1 / Math.abs(this.v[0].getThickness() + this.v[1].getThickness()) < 0.001 &&
                delta_2 / Math.abs(this.v[1].getThickness() + this.v[2].getThickness()) < 0.001;
        /* segParams is defined as: (e.g for segment p0p1)
        segParams.push({"norm":         this.length_p0p1,
                        "diffThick":    this.diffThick_p0p1,
                        "dir":          this.unit_p0p1,
                        "v":            [this.v[0], this.v[1]],
                        "ortho_vec_x":  this.v[0].getThickness() - this.v[1].getThickness(),
                        "ortho_vec_y":  this.length_p0p1});
        */
        this.segParams = segParams;
        this.segAttr = {
            p0_to_p: new Vector3(),
            p0_to_p_sqrnorm: 0,
            x_p_2D: 0,
            y_p_2D: 0,
            y_p_2DSq: 0,
            p_proj_x: 0,
        };
        // Construct the triangular prism going through each vertices
        const n1 = this.tmpVect.clone().crossVectors(this.segParams[0].dir, this.unit_normal).normalize();
        const n2 = this.tmpVect.clone().crossVectors(this.segParams[1].dir, this.unit_normal).normalize();
        const n3 = this.tmpVect.clone().crossVectors(this.segParams[2].dir, this.unit_normal).normalize();
        // Compute the prism vertices
        this.tmpVect.copy(this.unit_normal);
        const pri = [];
        pri.push(this.tmpVect.clone().addVectors(this.v[0].getPos(), this.tmpVect.multiplyScalar(this.v[0].getThickness() * ScalisMath.KS)));
        this.tmpVect.copy(this.unit_normal);
        pri.push(this.tmpVect.clone().addVectors(this.v[1].getPos(), this.tmpVect.multiplyScalar(this.v[1].getThickness() * ScalisMath.KS)));
        this.tmpVect.copy(this.unit_normal);
        pri.push(this.tmpVect.clone().addVectors(this.v[2].getPos(), this.tmpVect.multiplyScalar(this.v[2].getThickness() * ScalisMath.KS)));
        this.tmpVect.copy(this.unit_normal);
        pri.push(this.tmpVect.clone().addVectors(this.v[0].getPos(), this.tmpVect.multiplyScalar(-this.v[0].getThickness() * ScalisMath.KS)));
        this.tmpVect.copy(this.unit_normal);
        pri.push(this.tmpVect.clone().addVectors(this.v[1].getPos(), this.tmpVect.multiplyScalar(-this.v[1].getThickness() * ScalisMath.KS)));
        this.tmpVect.copy(this.unit_normal);
        pri.push(this.tmpVect.clone().addVectors(this.v[2].getPos(), this.tmpVect.multiplyScalar(-this.v[2].getThickness() * ScalisMath.KS)));
        // Compute the normals of top and bottom faces of the prism
        const tmp2 = new Vector3();
        this.tmpVect.subVectors(pri[1], pri[0]);
        tmp2.subVectors(pri[2], pri[0]);
        const n4 = this.tmpVect.clone().crossVectors(this.tmpVect, tmp2).normalize();
        this.tmpVect.subVectors(pri[5], pri[3]);
        tmp2.subVectors(pri[4], pri[3]);
        const n5 = this.tmpVect.clone().crossVectors(this.tmpVect, tmp2).normalize();
        // planeParams contains the definition of the prism 5 faces {normal, orig}
        this.planeParams = [];
        this.planeParams.push({ orig: this.v[0].getPos(), n: n1 });
        this.planeParams.push({ orig: this.v[1].getPos(), n: n2 });
        this.planeParams.push({ orig: this.v[2].getPos(), n: n3 });
        this.planeParams.push({ orig: pri[0], n: n4 });
        this.planeParams.push({ orig: pri[3], n: n5 });
        // use segments areas to factorize some code.
        this.segAreas = [];
        for (let i = 0; i < 3; ++i) {
            this.segAreas.push(new AreaScalisSeg(this.segParams[i].v[0].getPos(), this.segParams[i].v[1].getPos(), this.segParams[i].v[0].getThickness(), this.segParams[i].v[1].getThickness()));
        }
    }
    /**
     *  Compute projection (used in other functions)
     *  @param p Point to proj
     *  @param segParams A seg param object
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
        const t = -this.segAttr.y_p_2D / segParams.ortho_vec_y;
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
     * @param sphere
     * @

return true if the sphere and the area intersect
     */
    sphereIntersect(sphere) {
        // First: Test the intersection of the sphere to all three segments as they are included in the triangle bv
        for (let i = 0; i < 3; i++) {
            const intersectSeg = this.sphereIntersectSegment(sphere, this.segParams[i], ScalisMath.KS);
            // The sphere intersecting ones the angle means the sphere intersect the Bounding Volume
            if (intersectSeg) {
                return true;
            }
        }
        // Second: Test the intersection of the sphere with the triangular prism defined by
        // the 2D triangle constructed from the vertices and of half heights Ti*KS along the unit_normal for each vertices Vi
        let inside = true;
        for (let i = 0; i < 5; i++) {
            this.tmpVect.subVectors(sphere.center, this.planeParams[i].orig);
            // Get the signed dist to the plane
            const dist = this.tmpVect.dot(this.planeParams[i].n);
            // if the dist to the plane is positive, we are in the part where the normal is
            inside = inside && (dist + sphere.radius > 0); // Modulation by the sphere radius
        }
        // If the sphere is outside one of the plane-> BLAM OUTSIDE SON
        return inside;
    }
    /**
     *  Adapted from the segment sphere intersection. Could be factorised!
     *  @return true if the sphere and the area intersect
     *
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param segParams A segParams object containing data for a segment
     *  @param KS Kernel Scale, ie ScalisMath.KS (Why is it a parameter, its global!?)
     *
     */
    sphereIntersectSegment(sphere, segParams, KS) {
        this.proj_computation(sphere.center, segParams);
        const thick0 = segParams.v[0].getThickness();
        const thick1 = segParams.v[1].getThickness();
        if (this.segAttr.p_proj_x < 0.0) {
            return (Math.sqrt(this.segAttr.p0_to_p_sqrnorm) - sphere.radius < thick0 * KS);
        }
        else {
            if (this.segAttr.p_proj_x > segParams.norm) {
                this.segAttr.p0_to_p.subVectors(sphere.center, segParams.v[1].getPos());
                return this.segAttr.p0_to_p.length() - sphere.radius < thick1 * KS;
            }
            else {
                const sub1 = this.segAttr.x_p_2D - this.segAttr.p_proj_x;
                const dist = sub1 * sub1 + this.segAttr.y_p_2DSq;
                const tt = this.segAttr.p_proj_x / segParams.norm;
                const inter_w = thick0 * (1.0 - tt) + tt * thick1;
                const tmp = sphere.radius + inter_w * KS;
                return (dist < tmp * tmp);
            }
        }
    }
    /**
     * @link Area.contains for a complete description
     * @param p
     */
    contains = (function () {
        const sphere = { radius: 0, center: new Vector3() };
        /**
         * @param p
         */
        return function (p) {
            sphere.center.copy(p);
            return this.sphereIntersect(sphere);
        };
    })();
    /**
     *  Copied from AreaSeg.getAcc
     *
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param segParams A segParams object containing data for a segment area
     *
     *  @return Object containing intersect (boolean) and currAcc (number) attributes
     */
    getAccSegment(sphere, segParams) {
        const allReturn = { intersect: false, currAcc: Accuracies.nice * this.min_thick };
        if (this.sphereIntersectSegment(sphere, segParams, 1)) {
            const tmp = Math.abs(segParams.diffThick) / segParams.norm;
            const half_delta = sphere.radius * Math.sqrt(1 + tmp * tmp) * 0.5;
            const thick0 = segParams.v[0].getThickness();
            const thick1 = segParams.v[1].getThickness();
            // we check only the direction where the weight is minimum since
            // we will return minimum accuracy needed in the area.
            let absc = this.segAttr.p_proj_x;
            absc += thick0 > thick1 ? half_delta : -half_delta;
            if (absc <= 0.0) {
                allReturn.currAcc = thick0;
            }
            else if (absc >= segParams.norm) {
                allReturn.currAcc = thick1;
            }
            else {
                const tt = absc / segParams.norm;
                allReturn.currAcc = thick0 * (1.0 - tt) + tt * thick1;
            }
            allReturn.intersect = true;
        }
        return allReturn;
    }
    /**
     *  Get accuracy for the inner triangle (do not consider segment edges)
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     */
    getAccTri(sphere) {
        // Inequal thickness triangle case:
        if (!this.equal_weights) {
            const v0 = this.v[0].getPos(); // Should be the min thickness point on the triangle
            // Get the main dir furthest point
            const main_dir_point = this.tmpVect.addVectors(sphere.center, this.main_dir.clone().multiplyScalar(sphere.radius));
            // Get the proj of this point
            // 1/ get the ortho coord 2D wise
            this.tmpVect.subVectors(main_dir_point, v0);
            const distLineSq = this.tmpVect.lengthSq();
            // Get the dist to the plane (signed)
            const y_p_2D = this.tmpVect.dot(this.unit_normal); // Should do some test here to know if we are above or below the plane
            const x_p_2D = Math.sqrt(distLineSq - y_p_2D * y_p_2D);
            // Get the ortho proj point in the triangle plane
            // Cf. http://geomalgorithms.com/a04-_planes.html
            const proj_ortho_point = this.tmpVect.clone().addVectors(sphere.center, this.unit_normal.clone().multiplyScalar(-y_p_2D));
            // Get the thickness at this point
            let params = TriangleUtils.getTriBaryCoord(this.p0p1, this.p2p0, this.v[0].getPos(), proj_ortho_point);
            let thick_ortho_point = TriangleUtils.getMeanThick(this, params.u, params.v);
            // Ortho vector to the weight varies along where the sphere is relative to the plane
            thick_ortho_point = y_p_2D >= 0 ? thick_ortho_point : -thick_ortho_point;
            const ortho_vec_x = this.v[0].getThickness() - thick_ortho_point;
            const ortho_vec_y = x_p_2D;
            const t = -y_p_2D / ortho_vec_y;
            // P proj is the point at the intersection of:
            //              - the local X axis (computation in the unit_dir basis)
            //                  and
            //              - the line defined by P and the vector orthogonal to the weight line
            const p_proj_x = x_p_2D + t * ortho_vec_x;
            const dirVect = this.tmpVect.subVectors(v0, proj_ortho_point).normalize();
            const p_proj = this.tmpVect.addVectors(proj_ortho_point, dirVect.multiplyScalar(x_p_2D - p_proj_x));
            // Get the barycentric parameters of the non orthogonal point
            params = TriangleUtils.getTriBaryCoord(this.p0p1, this.p2p0, this.v[0].getPos(), p_proj);
            if (params.u <= 1 && params.v <= 1 && params.u + params.v <= 1 && params.u >= 0 && params.v >= 0) {
                // Return the barycentered thickness (yes barycentered is a proper english terminology)
                return TriangleUtils.getMeanThick(this, params.u, params.v);
            }
            else {
                return this.max_thick * 10000;
            }
        }
        else {
            // Case of equal weights
            return this.min_thick;
        }
    }
    /**
     *  @link Area.getAcc for a complete description
     *
     *  @return the accuracy needed in the intersection zone
     *
     *  @param sphere  A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor  the ratio to determine the wanted accuracy.
     *
     *  @todo Check the Maths
     */
    getAcc(sphere, factor) {
        // First: Test the intersection of the sphere to all three segments to get the min Acc for segments
        let minForSeg = this.max_thick * 100000;
        for (let i = 0; i < 3; i++) {
            const intersectSeg = this.getAccSegment(sphere, this.segParams[i]);
            // The sphere intersecting ones the angle means the sphere intersect the Bounding Volume
            if (intersectSeg.intersect) {
                minForSeg = Math.min(minForSeg, intersectSeg.currAcc);
            }
        }
        // Second: Test the inner triangle
        let minForTri = this.max_thick * 100000;
        if (minForSeg !== this.min_thick) {
            minForTri = this.getAccTri(sphere);
        }
        const minThick = Math.min(minForSeg, minForTri);
        if (minThick !== this.max_thick * 100000) {
            return minThick * factor;
        }
        else {
            // Sphere does not intersect with the segments, or the inner triangle
            return this.max_thick * factor;
        }
    }
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere) {
        return this.getAcc(sphere, Accuracies.nice);
    }
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere) {
        return this.getAcc(sphere, Accuracies.curr);
    }
    /**
     *  @link Area.getRawAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere) {
        return this.getAcc(sphere, Accuracies.raw);
    }
    /**
     * @link Area.getMinAcc
     * @return number
     */
    getMinAcc() {
        return Accuracies.curr * this.min_thick;
    }
    /**
     * @link Area.getMinRawAcc
     * @return number
     */
    getMinRawAcc = () => {
        return Accuracies.raw * this.min_thick;
    };
    /**
     *  Return the minimum accuracy required at some point on the given axis.
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis, t) {
        let step = Number.MAX_VALUE;
        for (let i = 0; i < 3; ++i) {
            step = Math.min(step, this.segAreas[i].getAxisProjectionMinStep(axis, t));
        }
        return step;
    }
}

/**
 *  AreaSphere is a general representation of a spherical area.
 *  See Primitive.getArea for more details.
 *
 *  @extends {Area}
 */
class AreaSphere extends Area {
    p;
    r;
    accFactor;
    /**
     *  @param p Point to locate the area
     *  @param r Radius of the area
     *  @param accFactor Accuracy factor. By default SphereArea will use global Accuracies parameters. However, you can setup a accFactor.
     *                            to change that. You will usually want to have accFactor between 0 (excluded) and 1. Default to 1.0.
     *                            Be careful not to set it too small as it can increase the complexity of some algorithms up to the crashing point.
     */
    constructor(p, r, accFactor) {
        super();
        this.p = new Vector3(p.x, p.y, p.z);
        this.r = r;
        this.accFactor = accFactor || 1.0;
    }
    /**
     *  Test intersection of the shape with a sphere
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return true if the sphere and the area intersect
     */
    sphereIntersect = (function () {
        const v = new Vector3();
        return function (sphere) {
            let self = this;
            v.subVectors(sphere.center, self.p);
            const tmp = sphere.radius + self.r;
            return v.lengthSq() < tmp * tmp;
        };
    })();
    /**
     * @link Area.contains for a complete description
     * @param p A point in space, must comply to Vector3 API.
     * @return true if the point is within the area
     */
    contains = (function () {
        const v = new Vector3();
        return function (p) {
            let self = this;
            v.subVectors(p, self.p);
            return v.lengthSq() < self.r * self.r;
        };
    })();
    /**
     *  @link Area.getAcc for a complete description
     *  @param _sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @param factor The ratio to determine the wanted accuracy.
     *  @return the accuracy needed in the intersection zone
     */
    getAcc(_sphere, factor) {
        return this.r * factor;
    }
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere) {
        return this.getAcc(sphere, Accuracies.nice * this.accFactor);
    }
    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere) {
        return this.getAcc(sphere, Accuracies.curr * this.accFactor);
    }
    /**
     *  @link Area.getRawAcc for a complete description
     *  @param sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a Vector3)
     *  @return The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere) {
        return this.getAcc(sphere, Accuracies.raw * this.accFactor);
    }
    /**
     * @link Area.getMinAcc
     * @return the minimum accuracy needed in the area
     */
    getMinAcc() {
        return Accuracies.curr * this.r * this.accFactor;
    }
    /**
     * @link Area.getMinRawAcc
     * @return the minimum raw accuracy needed in the area
     */
    getMinRawAcc() {
        return Accuracies.raw * this.r * this.accFactor;
    }
    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param axis x, y or z
     *  @param t Coordinate on the axis
     *  @return The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis, t) {
        let step = 100000000;
        const diff = t - this.p[axis];
        if (diff < -2 * this.r) {
            step = Math.min(step, Math.max(Math.abs(diff + this.r), Accuracies.curr * this.r * this.accFactor));
        }
        else if (diff < 2 * this.r) {
            step = Math.min(step, Accuracies.curr * this.r * this.accFactor);
        }
        return step;
    }
}

/**
 *  Represent an implicit primitive respecting the SCALIS model developed by Cedric Zanni
 *
 *  @constructor
 *  @extends {Primitive}
 */
class ScalisPrimitive extends Primitive {
    static type = "ScalisPrimitive";
    static DIST = "dist";
    static CONVOL = "convol";
    volType;
    v = [];
    constructor() {
        super();
        // Type of volume (convolution or distance function)
        this.volType = ScalisPrimitive.DIST;
    }
    /**
     *  @return Type of the element
     */
    getType() {
        return ScalisPrimitive.type;
    }
    /**
     *  @return {ScalisPrimitiveJSON}
     */
    toJSON() {
        const res = {
            ...super.toJSON(),
            v: [],
            volType: this.volType
        };
        for (let i = 0; i < this.v.length; ++i) {
            res.v.push(this.v[i].toJSON());
        }
        return res;
    }
    /**
     *  @abstract Specify if the voltype can be changed
     *  @return True if and only if the VolType can be changed.
     */
    mutableVolType() {
        return false;
    }
    /**
     *  @param vt New VolType to set (Only for SCALIS primitives)
     */
    setVolType(vt) {
        if (vt !== this.volType) {
            this.volType = vt;
            this.invalidAABB();
        }
    }
    /**
     *  @return  Current volType
     */
    getVolType() {
        return this.volType;
    }
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB() {
        this.aabb.makeEmpty();
        for (let i = 0; i < this.v.length; i++) {
            this.aabb.union(this.v[i].getAABB());
        }
    }
}
Types.register(ScalisPrimitive.type, ScalisPrimitive);

class ScalisPoint extends ScalisPrimitive {
    static type = "ScalisPoint";
    fromJSON(json) {
        const v = ScalisVertex.fromJSON(json.v[0]);
        const m = Material.fromJSON(json.materials[0]);
        return new ScalisPoint(v, json.volType, json.density, m);
    }
    density;
    v_to_p = new Vector3();
    /**
     * @param vertex The vertex with point parameters.
     * @param volType The volume type wanted for this primitive.
     *                 Note: "convolution" does not make sense for a point, so technically,
     *                 ScalisPrimitive.DIST or ScalisPrimitive.CONVOL will give the same results.
     *                 However, since this may be a simple way of sorting for later blending,
     *                 you can still choose between the 2 options.
     * @param density Implicit field density.
     *                 Gives a finer control of the created implicit field.
     * @param mat Material for the point
     */
    constructor(vertex, volType, density, mat) {
        super();
        this.v.push(vertex);
        this.v[0].setPrimitive(this);
        this.volType = volType;
        this.density = density;
        this.materials.push(mat);
    }
    getType() {
        return ScalisPoint.type;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            density: this.density
        };
    }
    /**
     * @param d New density to set
     */
    setDensity(d) {
        this.density = d;
        this.invalidAABB();
    }
    /**
     * @return Current density
     */
    getDensity() {
        return this.density;
    }
    /**
     * Set material for this point
     * @param m Material
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
    }
    getAreas() {
        if (!this.valid_aabb) {
            console.error("ERROR: Cannot get area of invalid primitive");
            return [];
        }
        else {
            return [{
                    aabb: this.aabb,
                    bv: new AreaSphere(this.v[0].getPos(), ScalisMath.KS * this.v[0].getThickness(), ScalisMath.KIS),
                    // AreaScalisPoint is deprecated and AreaSphere should be used instead. Uncomment if you notice accuracy issues.
                    // bv: new AreaScalisPoint(this.v[0].getPos(), this.v[0].getThickness()),
                    obj: this
                }];
        }
    }
    /**
     * @link Element.heuristicStepWithin
     * @return The next step length to do with respect to this primitive/node.
     */
    heuristicStepWithin() {
        return this.v[0].getThickness() / 3;
    }
    /**
     * @link Element.value
     *
     * @param p Point where we want to evaluate the primitive field
     * @param res ValueResultType
     */
    value(p, res) {
        if (!this.valid_aabb) {
            throw "Error: PrepareForEval should have been called";
        }
        const thickness = this.v[0].getThickness();
        // Eval itself
        this.v_to_p.subVectors(p, this.v[0].getPos());
        const r2 = this.v_to_p.lengthSq() / (thickness * thickness);
        const tmp = 1.0 - ScalisMath.KIS2 * r2;
        if (tmp > 0.0) {
            res.v = this.density * tmp * tmp * tmp * ScalisMath.Poly6NF0D;
            if (res.g) {
                // Gradient computation is easy since the
                // gradient is radial. We use the analytical solution
                // to directional gradient (differential in this.v_to_p length)
                const tmp2 = -this.density * ScalisMath.KIS2 * 6.0 * this.v_to_p.length() * tmp * tmp * ScalisMath.Poly6NF0D / (thickness * thickness);
                res.g.copy(this.v_to_p).normalize().multiplyScalar(tmp2);
            }
            if (res.m) {
                res.m.copy(this.materials[0]);
            }
        }
        else {
            res.v = 0.0;
            if (res.g) {
                res.g.set(0, 0, 0);
            }
            if (res.m) {
                res.m.copy(Material.defaultMaterial);
            }
        }
    }
    distanceTo(p) {
        // return distance point/segment
        // don't take thickness into account
        return p.distanceTo(this.v[0].getPos());
        // return p.distanceTo(this.v[0].getPos()) - this.v[0].getThickness();
    }
}
Types.register(ScalisPoint.type, ScalisPoint);

/**
 *  Implicit segment class in the blobtree.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
class ScalisSegment extends ScalisPrimitive {
    static type = "ScalisSegment";
    fromJSON(json) {
        const v0 = ScalisVertex.fromJSON(json.v[0]);
        const v1 = ScalisVertex.fromJSON(json.v[1]);
        const m = [
            Material.fromJSON(json.materials[0]),
            Material.fromJSON(json.materials[1])
        ];
        return new ScalisSegment(v0, v1, json.volType, json.density, m);
    }
    density;
    // Temporary for eval
    // TODO: should be wrapped in the eval function scope if possible (ie not precomputed)
    // CONVOL
    clipped_l1 = 1.0;
    clipped_l2 = 0.0;
    vector = new Vector3();
    cycle = new Vector3();
    proj = new Vector3();
    // helper attributes
    v0_p;
    v1_p;
    dir = new Vector3();
    lengthSq = 0;
    length = 0;
    unit_dir = new Vector3();
    // weight_p1 is convol's weight_p2 ( >_< )
    weight_p1 = 0;
    // c0 and c1 are convol's weight_coeff
    c0 = 0;
    c1 = 0;
    increase_unit_dir = new Vector3();
    p_min = new Vector3();
    weight_min = 0;
    inv_weight_min = 0;
    unit_delta_weight = 0;
    maxbound = 0;
    maxboundSq = 0;
    cyl_bd0 = 0;
    cyl_bd1 = 0;
    f0f1f2 = new Vector3();
    tmpVec1 = new Vector3();
    tmpVec2 = new Vector3();
    /**
     *  @param v0 First vertex for the segment
     *  @param v1 Second vertex for the segment
     *  @param volType Volume type, can be ScalisPrimitive.CONVOL
     *                 (homothetic convolution surfaces, Zanni and al), or
     *                 ScalisPrimitive.DIST (classic weighted distance field)
     *  @param density Density is another constant to modulate the implicit
     *                  field. Used only for DIST voltype.
     *  @param mats Material for this primitive.
     *              Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
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
        // helper attributes
        this.v0_p = this.v[0].getPos();
        this.v1_p = this.v[1].getPos(); // this one is probably useless to be kept for eval since not used....
        this.computeHelpVariables();
    }
    getType() {
        return ScalisSegment.type;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            density: this.density
        };
    }
    mutableVolType() {
        return true;
    }
    /**
     *  @param d The new density
     */
    setDensity(d) {
        this.density = d;
        this.invalidAABB();
    }
    /**
     *  @return The current density
     */
    getDensity() {
        return this.density;
    }
    /**
     *  [Abstract] See Primitive.setVolType for more details.
     *  @param vt New VolType to set (Only for SCALIS primitives)
     */
    setVolType(vt) {
        if (!(vt == ScalisPrimitive.CONVOL || vt == ScalisPrimitive.DIST)) {
            throw new Error("volType must be set to ScalisPrimitive.CONVOL or ScalisPrimitive.DIST");
        }
        if (this.volType != vt) {
            this.volType = vt;
            this.invalidAABB();
        }
    }
    // [Abstract] See Primitive.getVolType for more details
    getVolType() {
        return this.volType;
    }
    // [Abstract] See Primitive.prepareForEval for more details
    prepareForEval() {
        if (!this.valid_aabb) {
            this.computeHelpVariables();
            this.valid_aabb = true;
        }
    }
    // [Abstract] See Primtive.getArea for more details
    getAreas() {
        if (!this.valid_aabb) {
            console.error("ERROR: Cannot get area of invalid primitive");
            return [];
        }
        else {
            return [{
                    aabb: this.aabb,
                    bv: new AreaScalisSeg(this.v[0].getPos(), this.v[1].getPos(), this.v[0].getThickness(), this.v[1].getThickness()),
                    obj: this
                }];
        }
    }
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
        const bound_supp0 = this.v[0].getThickness() * ScalisMath.KS;
        const bound_supp1 = this.v[1].getThickness() * ScalisMath.KS;
        this.maxbound = Math.max(bound_supp0, bound_supp1);
        this.maxboundSq = this.maxbound * this.maxbound;
        // Speed up const for cylinder bounding
        // Used only in evalConvol
        this.cyl_bd0 = Math.min(-bound_supp0, this.length - bound_supp1);
        this.cyl_bd1 = Math.max(this.length + bound_supp1, bound_supp0);
        this.increase_unit_dir.copy(this.unit_dir);
        // weight help constiables
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
    }
    // [Abstract] See Primitive.value for more details
    value(p, res) {
        switch (this.volType) {
            case ScalisPrimitive.DIST:
                this.evalDist(p, res);
                break;
            case ScalisPrimitive.CONVOL:
                this.evalConvol(p, res);
                break;
            default:
                throw new Error("Unknown volType, cannot evaluate.");
        }
    }
    ///////////////////////////////////////////////////////////////////////////
    // Distance Evaluation functions and auxiliaary functions
    // Note : for the mech primitive we use a CompactPolynomial6 kernel.
    //        TODO : the orga should use the same for better smoothness
    /**
     *  value function for Distance volume type (distance field).
     */
    evalDist = (function () {
        const ev_eps = { v: 0 };
        const p_eps = new Vector3();
        return function (p, res) {
            const p0_to_p = this.vector;
            p0_to_p.subVectors(p, this.v[0].getPos());
            // Documentation : see DistanceHomothetic.pdf in convol/Documentation/Convol-Core/
            const orig_p_scal_dir = p0_to_p.dot(this.dir);
            const orig_p_sqr = p0_to_p.lengthSq();
            const denum = this.lengthSq * this.c0 + orig_p_scal_dir * this.c1;
            let t = (this.c1 < 0) ? 0 : 1;
            if (denum > 0.0) {
                t = orig_p_scal_dir * this.c0 + orig_p_sqr * this.c1;
                t = (t < 0.0) ? 0.0 : ((t > denum) ? 1.0 : t / denum); // clipping (nearest point on segment not line)
            }
            // Optim the below code... But keep the old code it's more understandable
            const proj_p_l = Math.sqrt(t * (t * this.lengthSq - 2 * orig_p_scal_dir) + orig_p_sqr);
            //const proj_to_point = this.proj;
            //proj_to_point.set(
            //    t*this.dir.x - p0_to_p.x,
            //    t*this.dir.y - p0_to_p.y,
            //    t*this.dir.z - p0_to_p.z
            //);
            //const proj_p_l = proj_to_point.length();
            const weight_proj = this.c0 + t * this.c1;
            res.v = this.density * ScalisMath.Poly6Eval(proj_p_l / weight_proj) * ScalisMath.Poly6NF0D;
            ///////////////////////////////////////////////////////////////////////
            // Material computation : by orthogonal projection
            if (res.m) {
                this.evalMat(p, res);
            }
            // IMPORTANT NOTE :
            // We should use an analytical gradient here. It should be possible to
            // compute.
            if (res.g) {
                const epsilon = 0.00001;
                const d_over_eps = this.density / epsilon;
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
     * @param p Evaluation point
     * @param res Resulting material will be in res.m
    */
    evalMat(p, res) {
        const p0_to_p = this.vector;
        p0_to_p.subVectors(p, this.v[0].getPos());
        const udir_dot = this.unit_dir.dot(p0_to_p);
        const s = (udir_dot / this.length);
        if (!res.m)
            throw "[ScalisSegment] evalMat: res.m should be defined here.";
        if (s > 1.0) {
            res.m.copy(this.materials[1]);
        }
        else if (s <= 0.0) {
            res.m.copy(this.materials[0]);
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
    }
    ;
    /**
     *  @param w special_coeff
     */
    HomotheticClippingSpecial(w) {
        // we search solution t \in [0,1] such that at^2-2bt+c<=0 
        const a = -w.z;
        const b = -w.y;
        const c = -w.x;
        const delta = b * b - a * c;
        if (delta >= 0.0) {
            const b_p_sqrt_delta = b + Math.sqrt(delta);
            if ((b_p_sqrt_delta < 0.0) || (this.length * b_p_sqrt_delta < c)) {
                return false;
            }
            else {
                const main_root = c / b_p_sqrt_delta;
                this.clipped_l1 = (main_root < 0.0) ? 0.0 : main_root;
                const a_r = a * main_root;
                this.clipped_l2 = (2.0 * b < a_r + a * this.length) ? c / (a_r) : this.length;
                return true;
            }
        }
        return false;
    }
    // [Abstract] see ScalisPrimitive.heuristicStepWithin
    heuristicStepWithin() {
        return this.weight_min / 3;
    }
    ///////////////////////////////////////////////////////////////////////////
    // Convolution Evaluation functions and auxiliaary functions
    /**
     *  value function for Convol volume type (Homothetic convolution).
     */
    evalConvol(p, res) {
        if (!this.valid_aabb) {
            throw new Error("prepareForEval should have been called");
        }
        if (res.g)
            res.g.set(0, 0, 0);
        res.v = 0;
        const p_min_to_point = this.tmpVec1;
        p_min_to_point.subVectors(p, this.p_min);
        const uv = this.increase_unit_dir.dot(p_min_to_point);
        const d2 = p_min_to_point.lengthSq();
        const special_coeff = this.tmpVec2;
        special_coeff.set(this.weight_min * this.weight_min - ScalisMath.KIS2 * d2, -this.unit_delta_weight * this.weight_min - ScalisMath.KIS2 * uv, this.unit_delta_weight * this.unit_delta_weight - ScalisMath.KIS2);
        // clipped_l1, clipped_l2 are members of segment
        if (this.HomotheticClippingSpecial(special_coeff)) {
            const inv_local_min_weight = 1.0 / (this.weight_min + this.clipped_l1 * this.unit_delta_weight);
            special_coeff.x = 1.0 - ScalisMath.KIS2 * (this.clipped_l1 * (this.clipped_l1 - 2.0 * uv) + d2) * inv_local_min_weight * inv_local_min_weight;
            special_coeff.y = -this.unit_delta_weight - ScalisMath.KIS2 * (uv - this.clipped_l1) * inv_local_min_weight;
            if (res.g) //both grad and value
             {
                if (this.unit_delta_weight >= 0.06) { // ensure a maximum relative error of ??? (for degree i up to 8)
                    this.HomotheticCompactPolynomial_segment_FGradF_i6((this.clipped_l2 - this.clipped_l1) *
                        inv_local_min_weight, this.unit_delta_weight, special_coeff);
                }
                else {
                    this.HomotheticCompactPolynomial_approx_segment_FGradF_i6((this.clipped_l2 - this.clipped_l1) * inv_local_min_weight, this.unit_delta_weight, this.inv_weight_min, special_coeff);
                }
                res.v = ScalisMath.Poly6NF1D * this.f0f1f2.x;
                this.f0f1f2.y *= inv_local_min_weight;
                res.g
                    .copy(this.increase_unit_dir)
                    .multiplyScalar(this.f0f1f2.z + this.clipped_l1 * this.f0f1f2.y)
                    .sub(p_min_to_point.multiplyScalar(this.f0f1f2.y))
                    .multiplyScalar(ScalisMath.Poly6NF1D * 6.0 * ScalisMath.KIS2 * inv_local_min_weight);
            }
            else //value only
             {
                if (this.unit_delta_weight >= 0.06) { // ensure a maximum relative error of ??? (for degree i up to 8)
                    res.v = ScalisMath.Poly6NF1D *
                        this.HomotheticCompactPolynomial_segment_F_i6((this.clipped_l2 - this.clipped_l1) * inv_local_min_weight, this.unit_delta_weight, special_coeff);
                }
                else {
                    res.v = ScalisMath.Poly6NF1D *
                        this.HomotheticCompactPolynomial_approx_segment_F_i6((this.clipped_l2 - this.clipped_l1) * inv_local_min_weight, this.unit_delta_weight, inv_local_min_weight, special_coeff);
                }
            }
            if (res.m) {
                this.evalMat(p, res);
            }
        }
    }
    ;
    /**
     *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
     *  @return Clamped value
     *  Author: Jakub Korzeniowski
     *  Agency: Softhis
     *  http://www.softhis.com
     */
    clamp(a, b, c) { return Math.max(b, Math.min(c, a)); }
    ;
    distanceTo = (function () {
        const tmpVector = new Vector3();
        const tmpVectorProj = new Vector3();
        return function (p) {
            const self = this;
            // return distance point/segment
            // don't take thickness into account
            let t = tmpVector.subVectors(p, self.v[0].getPos())
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
     *  @return the value
     */
    HomotheticCompactPolynomial_segment_F_i6(l, d, w) {
        const t6247 = d * l + 0.1e1;
        const t6241 = 0.1e1 / t6247;
        const t6263 = t6247 * t6247;
        const t2 = t6263 * t6263;
        const t6244 = 0.1e1 / t2;
        const t6252 = w.y;
        const t6249 = t6252 * t6252;
        const t6273 = 0.12e2 * t6249;
        const t6258 = 0.1e1 / d;
        const t6271 = t6252 * t6258;
        const t6264 = t6247 * t6263;
        const t6257 = l * l;
        const t6260 = t6257 * t6257;
        const t6259 = l * t6257;
        const t6254 = l * t6260;
        const t6253 = w.x;
        const t6251 = w.z;
        const t6250 = t6253 * t6253;
        const t6248 = t6251 * t6251;
        const t3 = t6264 * t6264;
        const t6246 = 0.1e1 / t3;
        const t6245 = t6241 * t6244;
        const t6243 = 0.1e1 / t6264;
        const t6242 = 0.1e1 / t6263;
        const t71 = Math.log(t6247);
        const t93 = t6259 * t6259;
        return -t6248 * (((((-(t6241 - 0.1e1) * t6258 - l * t6242) * t6258 - t6257 * t6243) * t6258 - t6259 * t6244) * t6258 - t6260 * t6245) * t6258 - t6254 * t6246) * t6271 + (-t6253 * (t6246 - 0.1e1) * t6258 / 0.6e1 - (-(t6245 - 0.1e1) * t6258 / 0.5e1 - l * t6246) * t6271) * t6250 + ((t6253 * t6273 + 0.3e1 * t6251 * t6250) * (0.2e1 / 0.5e1 * (-(t6244 - 0.1e1) * t6258 / 0.4e1 - l * t6245) * t6258 - t6257 * t6246) + (0.3e1 * t6248 * t6253 + t6251 * t6273) * (0.4e1 / 0.5e1 * (0.3e1 / 0.4e1 * (0.2e1 / 0.3e1 * (-(t6242 - 0.1e1) * t6258 / 0.2e1 - l * t6243) * t6258 - t6257 * t6244) * t6258 - t6259 * t6245) * t6258 - t6260 * t6246) + t6251 * t6248 * (0.6e1 / 0.5e1 * (0.5e1 / 0.4e1 * (0.4e1 / 0.3e1 * (0.3e1 / 0.2e1 * (0.2e1 * (t71 * t6258 - l * t6241) * t6258 - t6257 * t6242) * t6258 - t6259 * t6243) * t6258 - t6260 * t6244) * t6258 - t6254 * t6245) * t6258 - t93 * t6246) + (-0.12e2 * t6251 * t6253 - 0.8e1 * t6249) * (0.3e1 / 0.5e1 * ((-(t6243 - 0.1e1) * t6258 / 0.3e1 - l * t6244) * t6258 / 0.2e1 - t6257 * t6245) * t6258 - t6259 * t6246) * t6252) * t6258 / 0.6e1;
    }
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).
     *  (Approximation? Faster?).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     */
    HomotheticCompactPolynomial_approx_segment_F_i6(l, d, q, w) {
        const t6386 = q * d;
        const t6361 = t6386 + 0.1e1;
        const t6387 = 0.1e1 / t6361;
        const t1 = t6361 * t6361;
        const t2 = t1 * t1;
        const t6359 = t6387 / t2 / t1;
        const t6363 = w.z;
        const t6364 = w.y;
        const t6365 = w.x;
        const t6366 = l * l;
        const t6356 = t6363 * t6366 - 0.2e1 * t6364 * l + t6365;
        const t9 = t6364 * t6364;
        const t6357 = t6363 * t6365 - t9;
        const t6358 = t6363 * l - t6364;
        const t6377 = t6365 * t6365;
        const t6381 = t6364 * t6377;
        const t6369 = t6356 * t6356;
        const t6383 = t6358 * t6369;
        const t6362 = 0.1e1 / t6363;
        const t6384 = t6357 * t6362;
        const t6385 = 0.6e1 / 0.35e2 * (0.4e1 / 0.3e1 * (0.2e1 * t6357 * l + t6358 * t6356 + t6364 * t6365) * t6384 + t6383 + t6381) * t6384 + t6356 * t6383 / 0.7e1 + t6365 * t6381 / 0.7e1;
        const t6380 = t6362 * t6385;
        const t6360 = t6387 * t6359;
        const t6355 = t6369 * t6369;
        const t27 = t6377 * t6377;
        const t6353 = t6364 * t6380 + t6355 / 0.8e1 - t27 / 0.8e1;
        // eslint-disable-next-line no-loss-of-precision
        const t6352 = -l * t6355 + (-0.10e2 * t6364 * t6353 + t6365 * t6385) * t6362;
        const t65 = q * q;
        return t6380 - 0.7e1 * d * t6353 * t6362 + (-0.1111111111e0 * (0.3e1 * t6359 - 0.300e1 + 0.7e1 * (0.2e1 + t6360) * t6386) * t6352 - 0.1000000000e0 * (0.2e1 - 0.200e1 * t6359 - 0.7e1 * (0.1e1 + t6360) * t6386) / q * (-0.1e1 * t6366 * t6355 + (0.1333333333e1 * t6364 * t6352 + 0.2e1 * t6365 * t6353) * t6362)) * t6362 / t65;
    }
    /**
     *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  Result is stored in this.f0f1f2
     */
    HomotheticCompactPolynomial_segment_FGradF_i6(l, d, w) {
        const t6320 = d * l + 0.1e1;
        const t6314 = 0.1e1 / t6320;
        const t6336 = t6320 * t6320;
        const t2 = t6336 * t6336;
        const t6317 = 0.1e1 / t2;
        const t6325 = w.y;
        const t6322 = t6325 * t6325;
        const t6351 = 0.2e1 * t6322;
        const t6324 = w.z;
        const t6326 = w.x;
        const t6350 = t6324 * t6326 / 0.3e1 + 0.2e1 / 0.3e1 * t6322;
        const t6321 = t6324 * t6324;
        const t6349 = t6321 / 0.6e1;
        const t6348 = -0.2e1 / 0.3e1 * t6324;
        const t6337 = t6320 * t6336;
        const t6316 = 0.1e1 / t6337;
        const t6318 = t6314 * t6317;
        const t7 = t6337 * t6337;
        const t6319 = 0.1e1 / t7;
        const t6330 = l * l;
        const t6331 = 0.1e1 / d;
        const t6332 = l * t6330;
        const t6309 = 0.3e1 / 0.5e1 * ((-(t6316 - 0.1e1) * t6331 / 0.3e1 - l * t6317) * t6331 / 0.2e1 - t6330 * t6318) * t6331 - t6332 * t6319;
        const t6347 = t6309 * t6325;
        const t6311 = -(t6318 - 0.1e1) * t6331 / 0.5e1 - l * t6319;
        const t6323 = t6326 * t6326;
        const t6346 = t6323 * t6311;
        const t6310 = 0.2e1 / 0.5e1 * (-(t6317 - 0.1e1) * t6331 / 0.4e1 - l * t6318) * t6331 - t6330 * t6319;
        const t6345 = t6326 * t6310;
        const t6344 = -t6323 * (t6319 - 0.1e1) / 0.6e1;
        const t6333 = t6330 * t6330;
        const t6327 = l * t6333;
        const t6315 = 0.1e1 / t6336;
        const t6308 = 0.4e1 / 0.5e1 * (0.3e1 / 0.4e1 * (0.2e1 / 0.3e1 * (-(t6315 - 0.1e1) * t6331 / 0.2e1 - l * t6316) * t6331 - t6330 * t6317) * t6331 - t6332 * t6318) * t6331 - t6333 * t6319;
        const t6307 = ((((-(t6314 - 0.1e1) * t6331 - l * t6315) * t6331 - t6330 * t6316) * t6331 - t6332 * t6317) * t6331 - t6333 * t6318) * t6331 - t6327 * t6319;
        const t81 = t6332 * t6332;
        const t92 = Math.log(t6320);
        this.f0f1f2.x = (t6326 * t6344 - t6325 * t6346 + t6345 * t6351 - 0.4e1 / 0.3e1 * t6322 * t6347 + (t6323 * t6310 / 0.2e1 + t6308 * t6351 - 0.2e1 * t6326 * t6347) * t6324 + (t6326 * t6308 / 0.2e1 - t6325 * t6307 + (-t81 * t6319 / 0.6e1 + (-t6327 * t6318 / 0.5e1 + (-t6333 * t6317 / 0.4e1 + (-t6332 * t6316 / 0.3e1 + (-t6330 * t6315 / 0.2e1 + (t92 * t6331 - l * t6314) * t6331) * t6331) * t6331) * t6331) * t6331) * t6324) * t6321) * t6331;
        this.f0f1f2.y = (t6344 + t6310 * t6350 + t6308 * t6349 + (-0.2e1 / 0.3e1 * t6326 * t6311 + t6309 * t6348) * t6325) * t6331;
        this.f0f1f2.z = (t6346 / 0.6e1 + t6309 * t6350 + t6307 * t6349 + (-0.2e1 / 0.3e1 * t6345 + t6308 * t6348) * t6325) * t6331;
    }
    /**
     *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  Result is stored in this.f0f1f2
     */
    HomotheticCompactPolynomial_approx_segment_FGradF_i6(l, d, q, w) {
        const t6478 = q * d;
        const t6443 = t6478 + 0.1e1;
        const t6479 = 0.1e1 / t6443;
        const t1 = q * q;
        const t6449 = 0.1e1 / t1;
        const t2 = t6443 * t6443;
        const t3 = t2 * t2;
        const t6441 = t6479 / t3 / t2;
        const t6448 = w.x;
        const t6477 = 0.2e1 * t6448;
        const t6446 = w.z;
        const t6444 = 0.1e1 / t6446;
        const t6476 = d * t6444;
        const t6447 = w.y;
        const t6451 = l * l;
        const t6438 = t6446 * t6451 - 0.2e1 * t6447 * l + t6448;
        const t6455 = t6438 * t6438;
        const t6437 = t6438 * t6455;
        const t6463 = t6448 * t6448;
        const t6445 = t6448 * t6463;
        const t10 = t6447 * t6447;
        const t6439 = t6446 * t6448 - t10;
        const t6440 = t6446 * l - t6447;
        const t6470 = t6439 * t6444;
        const t6433 = 0.4e1 / 0.3e1 * (0.2e1 * t6439 * l + t6440 * t6438 + t6447 * t6448) * t6470 + t6440 * t6455 + t6447 * t6463;
        const t6473 = t6433 / 0.5e1;
        const t6432 = t6447 * t6444 * t6473 + t6437 / 0.6e1 - t6445 / 0.6e1;
        const t6429 = -l * t6437 + (-0.8e1 * t6447 * t6432 + t6448 * t6473) * t6444;
        const t6469 = t6451 * t6437;
        // eslint-disable-next-line no-loss-of-precision
        const t6427 = -t6469 + (0.10e2 / 0.7e1 * t6447 * t6429 + t6432 * t6477) * t6444;
        const t6475 = -t6427 / 0.8e1;
        const t6474 = 0.6e1 / 0.35e2 * t6433 * t6470 + t6440 * t6437 / 0.7e1 + t6447 * t6445 / 0.7e1;
        const t6442 = t6479 * t6441;
        const t6472 = (0.3e1 * t6441 - 0.300e1 + 0.7e1 * (0.2e1 + t6442) * t6478) * t6449;
        const t6471 = (0.2e1 - 0.200e1 * t6441 - 0.7e1 * (0.1e1 + t6442) * t6478) / q * t6449;
        const t6468 = t6444 * t6472;
        const t6467 = t6444 * t6471;
        const t6466 = t6444 * t6474;
        const t6436 = t6455 * t6455;
        const t57 = t6463 * t6463;
        const t6430 = t6447 * t6466 + t6436 / 0.8e1 - t57 / 0.8e1;
        // eslint-disable-next-line no-loss-of-precision
        const t6428 = -l * t6436 + (-0.10e2 * t6447 * t6430 + t6448 * t6474) * t6444;
        // eslint-disable-next-line no-loss-of-precision
        this.f0f1f2.x = t6466 - 0.7e1 * t6430 * t6476 - t6428 * t6468 / 0.9e1 - (-t6451 * t6436 + (0.4e1 / 0.3e1 * t6447 * t6428 + t6430 * t6477) * t6444) * t6467 / 0.10e2;
        this.f0f1f2.y = (t6473 - 0.7e1 * d * t6432 - t6429 * t6472 / 0.7e1 + t6471 * t6475) * t6444;
        this.f0f1f2.z = t6432 * t6444 + t6429 * t6476 + t6468 * t6475 - (-l * t6469 + (0.3e1 / 0.2e1 * t6447 * t6427 - 0.3e1 / 0.7e1 * t6448 * t6429) * t6444) * t6467 / 0.9e1;
    }
    ;
}
Types.register(ScalisSegment.type, ScalisSegment);

// Number of sample in the Simpsons integration.
const sampleNumber = 10;
/**
 * This class implements a ScalisTriangle primitive.
 *  CONVOL Evaluation is not exact so we use simpsons numerical integration.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 */
class ScalisTriangle extends ScalisPrimitive {
    static type = "ScalisTriangle";
    fromJSON(json) {
        const v = [
            ScalisVertex.fromJSON(json.v[0]),
            ScalisVertex.fromJSON(json.v[1]),
            ScalisVertex.fromJSON(json.v[2])
        ];
        const m = [
            Material.fromJSON(json.materials[0]),
            Material.fromJSON(json.materials[1]),
            Material.fromJSON(json.materials[2])
        ];
        return new ScalisTriangle(v, json.volType, 1.0, m);
    }
    ;
    v;
    min_thick;
    max_thick;
    // Temporary for eval
    // TODO : should be wrapped in the eval function scope if possible (ie not precomputed)
    res_gseg = {
        proj_to_p: new Vector3(),
        weight_proj: 0,
        t: 0
    };
    tmp_res_gseg = {
        proj_to_p: new Vector3(),
        weight_proj: 0,
        t: 0
    };
    p0p1 = new Vector3();
    p1p2 = new Vector3();
    p2p0 = new Vector3();
    unit_normal = new Vector3();
    unit_p0p1 = new Vector3();
    unit_p1p2 = new Vector3();
    unit_p2p0 = new Vector3();
    length_p0p1 = 0;
    length_p1p2 = 0;
    length_p2p0 = 0;
    diffThick_p0p1 = 0;
    diffThick_p0p2 = 0;
    diffThick_p1p2 = 0;
    diffThick_p2p0 = 0;
    main_dir = new Vector3();
    point_iso_zero = new Vector3();
    ortho_dir = new Vector3();
    unsigned_ortho_dir = new Vector3();
    proj_dir = new Vector3();
    equal_weights = false; // Use to skip computations for a specific case
    coord_max = 0;
    coord_middle = 0;
    unit_delta_weight = 0;
    longest_dir_special = new Vector3();
    max_seg_length = 0;
    half_dir_1 = new Vector3();
    point_half = new Vector3();
    half_dir_2 = new Vector3();
    point_min = new Vector3();
    weight_min = 0;
    valid_aabb = false;
    /**
     *  @param v the 3 vertices for the triangle
     *  @param volType Volume type, can be ScalisPrimitive.CONVOL
     *                 (homothetic convolution surfaces, Zanni and al), or
     *                 ScalisPrimitive.DIST (classic weighted distance field)
     *  @param density Density is another constant to modulate the implicit
     *                  field. Used only for DIST voltype.
     *  @param mats Material for this primitive.
     *                                  Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
     *
     */
    constructor(v, volType, density, mats) {
        super();
        if (density !== 1.0) {
            throw "Error in ScalisTriangle : cannot use a density different from 1.0, not implemented.";
        }
        this.volType = volType;
        this.materials = mats !== null ? mats : [Material.defaultMaterial.clone(), Material.defaultMaterial.clone(), Material.defaultMaterial.clone()];
        this.v = v;
        this.v[0].setPrimitive(this);
        this.v[1].setPrimitive(this);
        this.v[2].setPrimitive(this);
        this.min_thick = Math.min(this.v[0].getThickness(), this.v[1].getThickness(), this.v[2].getThickness());
        this.max_thick = Math.max(this.v[0].getThickness(), this.v[1].getThickness(), this.v[2].getThickness());
    }
    getType() {
        return ScalisTriangle.type;
    }
    toJSON() {
        return {
            ...super.toJSON()
        };
    }
    // [Abstract] See Primitive.prepareForEval for more details
    prepareForEval() {
        if (!this.valid_aabb) {
            this.computeHelpVariables();
            this.valid_aabb = true;
        }
    }
    // [Abstract] See Primtive.getArea for more details
    getAreas() {
        if (!this.valid_aabb) {
            console.log("ERROR : Cannot get area of invalid primitive");
            return [];
        }
        else {
            var segParams = [];
            segParams.push({
                "norm": this.length_p0p1,
                "diffThick": this.diffThick_p0p1,
                "dir": this.unit_p0p1,
                "v": [this.v[0], this.v[1]],
                "ortho_vec_x": this.v[0].getThickness() - this.v[1].getThickness(),
                "ortho_vec_y": this.length_p0p1
            });
            segParams.push({
                "norm": this.length_p1p2,
                "diffThick": this.diffThick_p1p2,
                "dir": this.unit_p1p2,
                "v": [this.v[1], this.v[2]],
                "ortho_vec_x": this.v[1].getThickness() - this.v[2].getThickness(),
                "ortho_vec_y": this.length_p1p2
            });
            segParams.push({
                "norm": this.length_p2p0,
                "diffThick": this.diffThick_p2p0,
                "dir": this.unit_p2p0,
                "v": [this.v[2], this.v[0]],
                "ortho_vec_x": this.v[2].getThickness() - this.v[0].getThickness(),
                "ortho_vec_y": this.length_p2p0
            });
            return [{
                    aabb: this.aabb,
                    bv: new AreaScalisTri(this.v, this.unit_normal, this.main_dir, segParams, this.min_thick, this.max_thick),
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
    setVolType(vt) {
        if (!(vt == ScalisPrimitive.CONVOL || vt == ScalisPrimitive.DIST)) {
            throw "ERROR : volType must be set to ScalisPrimitive.CONVOL or ScalisPrimitive.DIST";
        }
        if (this.volType != vt) {
            this.volType = vt;
            this.invalidAABB();
        }
    }
    // [Abstract] See Primitive.getVolType for more details
    getVolType() {
        return this.volType;
    }
    /**
     *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
     *  @return Clamped value
     *  Author: Jakub Korzeniowski
     *  Agency: Softhis
     *  http://www.softhis.com
     */
    clamp(a, b, c) {
        return Math.max(b, Math.min(c, a));
    }
    // [Abstract] See Primitive.distanceTo for more details
    distanceTo = (function () {
        var p0p = new Vector3();
        var p1p = new Vector3();
        var p2p = new Vector3();
        var tmp = new Vector3();
        return function (p) {
            /** @type {ScalisTriangle} */
            let self = this;
            p0p.subVectors(p, self.v[0].getPos());
            p1p.subVectors(p, self.v[1].getPos());
            p2p.subVectors(p, self.v[2].getPos());
            if (tmp.crossVectors(self.p0p1, p0p).dot(self.unit_normal) > 0 &&
                tmp.crossVectors(self.p1p2, p1p).dot(self.unit_normal) > 0 &&
                tmp.crossVectors(self.p2p0, p2p).dot(self.unit_normal) > 0) {
                // p is in the triangle
                return Math.abs(p0p.dot(self.unit_normal));
            }
            else {
                var t0 = p0p.dot(self.p0p1) / self.length_p0p1;
                // clamp is our own function declared there
                t0 = self.clamp(t0, 0, 1);
                tmp.copy(self.p0p1)
                    .multiplyScalar(t0)
                    .add(self.v[0].getPos());
                t0 = p.distanceToSquared(tmp);
                var t1 = p1p.dot(self.p1p2) / self.length_p1p2;
                // clamp is our own function declared there
                t1 = self.clamp(t1, 0, 1);
                tmp.copy(self.p1p2)
                    .multiplyScalar(t1)
                    .add(self.v[1].getPos());
                t1 = p.distanceToSquared(tmp);
                var t2 = p2p.dot(self.p2p0) / self.length_p2p0;
                // clamp is our own function declared there
                t2 = self.clamp(t2, 0, 1);
                tmp.copy(self.p2p0)
                    .multiplyScalar(t2)
                    .add(self.v[2].getPos());
                t2 = p.distanceToSquared(tmp);
                return Math.sqrt(Math.min(Math.min(t0, t1), t2));
            }
        };
    })();
    // [Abstract] See Primitive.heuristicStepWithin for more details
    heuristicStepWithin() {
        return this.weight_min / 3;
    }
    ;
    /**
     *  @link Element.value for a complete description
     */
    value(p, res) {
        switch (this.volType) {
            case ScalisPrimitive.DIST:
                return this.evalDist(p, res);
            case ScalisPrimitive.CONVOL:
                // for now rings are just evaluated as distance surface
                return this.evalConvol(p, res);
            default:
                throw "Unknown volType, use Orga";
        }
    }
    /**
     *  value function for Distance volume type (distance field).
     */
    evalDist = (function () {
        var ev_eps = { v: 0 };
        var p_eps = new Vector3();
        /**
         *  value function for Distance volume type (distance field).
         *
         *  @param {Vector3} p
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
            var p0_to_p = new Vector3();
            p0_to_p.subVectors(p, self.v[0].getPos());
            var normal_inv = self.unit_normal.clone().multiplyScalar(-1);
            ///////////////////////////////////////////////////////////////////////
            // We must generalize the principle used for the segment
            if (!self.equal_weights) {
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
                var d1n2n3 = new Vector3();
                d1n2n3.crossVectors(n2, n3);
                d1n2n3.multiplyScalar(-d1);
                var d2n3n1 = new Vector3();
                d2n3n1.crossVectors(n3, n1);
                d2n3n1.multiplyScalar(-d2);
                var d3n1n2 = new Vector3();
                d3n1n2.crossVectors(n1, n2);
                d3n1n2.multiplyScalar(-d3);
                var n2cn3 = new Vector3();
                n2cn3.crossVectors(n2, n3);
                var Z = new Vector3(d1n2n3.x + d2n3n1.x + d3n1n2.x, d1n2n3.y + d2n3n1.y + d3n1n2.y, d1n2n3.z + d2n3n1.z + d3n1n2.z);
                Z.divideScalar(n1.dot(n2cn3));
                // Now we want to project in the direction orthogonal to (pZ) and ortho_dir
                var pz = new Vector3(Z.x - p.x, Z.y - p.y, Z.z - p.z);
                // set proj_dir
                self.proj_dir = new Vector3();
                self.proj_dir.crossVectors(pz, self.unsigned_ortho_dir);
                self.proj_dir.normalize(); // should be useless
            }
            // Project along the given direction
            var non_ortho_proj = new Vector3();
            non_ortho_proj.copy(self.proj_dir);
            non_ortho_proj.multiplyScalar(-p0_to_p.dot(normal_inv) / self.proj_dir.dot(normal_inv));
            non_ortho_proj.add(p);
            var tmp_vec = new Vector3();
            var tmp_vec0 = new Vector3();
            var tmp_vec1 = new Vector3();
            var tmp_vec2 = new Vector3();
            tmp_vec0.subVectors(non_ortho_proj, self.v[0].getPos());
            tmp_vec1.subVectors(non_ortho_proj, self.v[1].getPos());
            tmp_vec2.subVectors(non_ortho_proj, self.v[2].getPos());
            if (tmp_vec.crossVectors(self.unit_p0p1, tmp_vec0).dot(normal_inv) > 0.0 &&
                tmp_vec.crossVectors(self.unit_p1p2, tmp_vec1).dot(normal_inv) > 0.0 &&
                tmp_vec.crossVectors(self.unit_p2p0, tmp_vec2).dot(normal_inv) > 0.0) {
                tmp_vec.subVectors(p, non_ortho_proj);
                res.v = tmp_vec.lengthSq();
                // get barycentric coordinates of nearest_point (which is necessarily in the triangle
                var p0 = self.v[0].getPos();
                var p1 = self.v[1].getPos();
                var p2 = self.v[2].getPos();
                var tmp_vec_bis = new Vector3();
                tmp_vec.subVectors(p1, p0);
                tmp_vec_bis.subVectors(p2, p0);
                var n = new Vector3();
                n.crossVectors(tmp_vec, tmp_vec_bis);
                tmp_vec.subVectors(p2, p1);
                var nv1 = new Vector3();
                nv1.crossVectors(tmp_vec, tmp_vec1);
                tmp_vec.subVectors(p0, p2);
                var nv2 = new Vector3();
                nv2.crossVectors(tmp_vec, tmp_vec2);
                tmp_vec.subVectors(p1, p0);
                var nv3 = new Vector3();
                nv3.crossVectors(tmp_vec, tmp_vec0);
                var nsq = n.lengthSq();
                var a1 = n.dot(nv1);
                var a2 = n.dot(nv2);
                var a3 = n.dot(nv3);
                var inter_weight = (a1 * self.v[0].getThickness() + a2 * self.v[1].getThickness() + a3 * self.v[2].getThickness()) / nsq;
                res.v = ScalisMath.Poly6Eval(Math.sqrt(res.v) / inter_weight) * ScalisMath.Poly6NF0D;
                if (res.m) {
                    res.m.triMean(self.materials[0], self.materials[1], self.materials[2], a1, a2, a3, nsq);
                }
            }
            else {
                // Use to keep the case selected in case we need to compute the material
                var seg_case = 0;
                // do the same as for a segment on all triangle sides
                self.GenericSegmentComputation(p, self.v[0].getPos(), self.p0p1, self.length_p0p1, self.length_p0p1 * self.length_p0p1, self.v[0].getThickness(), self.v[1].getThickness() - self.v[0].getThickness(), self.res_gseg);
                self.res_gseg.sqrdist = self.res_gseg.proj_to_p.lengthSq();
                self.res_gseg.ratio = self.res_gseg.sqrdist / (self.res_gseg.weight_proj * self.res_gseg.weight_proj);
                self.GenericSegmentComputation(p, self.v[1].getPos(), self.p1p2, self.length_p1p2, self.length_p1p2 * self.length_p1p2, self.v[1].getThickness(), self.v[2].getThickness() - self.v[1].getThickness(), self.tmp_res_gseg);
                self.tmp_res_gseg.sqrdist = self.tmp_res_gseg.proj_to_p.lengthSq();
                self.tmp_res_gseg.ratio = self.tmp_res_gseg.sqrdist / (self.tmp_res_gseg.weight_proj * self.tmp_res_gseg.weight_proj);
                if (self.res_gseg.ratio > self.tmp_res_gseg.ratio) {
                    self.res_gseg.sqrdist = self.tmp_res_gseg.sqrdist;
                    self.res_gseg.proj_to_p = self.tmp_res_gseg.proj_to_p;
                    self.res_gseg.weight_proj = self.tmp_res_gseg.weight_proj;
                    self.res_gseg.ratio = self.tmp_res_gseg.ratio;
                    self.res_gseg.t = self.tmp_res_gseg.t;
                    seg_case = 1;
                }
                self.GenericSegmentComputation(p, self.v[2].getPos(), self.p2p0, self.length_p2p0, self.length_p2p0 * self.length_p2p0, self.v[2].getThickness(), self.v[0].getThickness() - self.v[2].getThickness(), self.tmp_res_gseg);
                self.tmp_res_gseg.sqrdist = self.tmp_res_gseg.proj_to_p.lengthSq();
                self.tmp_res_gseg.ratio = self.tmp_res_gseg.sqrdist / (self.tmp_res_gseg.weight_proj * self.tmp_res_gseg.weight_proj);
                if (self.res_gseg.ratio > self.tmp_res_gseg.ratio) {
                    self.res_gseg.sqrdist = self.tmp_res_gseg.sqrdist;
                    self.res_gseg.proj_to_p = self.tmp_res_gseg.proj_to_p;
                    self.res_gseg.weight_proj = self.tmp_res_gseg.weight_proj;
                    self.res_gseg.ratio = self.tmp_res_gseg.ratio;
                    self.res_gseg.t = self.tmp_res_gseg.t;
                    seg_case = 2;
                }
                res.v = ScalisMath.Poly6Eval(Math.sqrt(self.res_gseg.sqrdist) / self.res_gseg.weight_proj) * ScalisMath.Poly6NF0D;
                ////////////////////////////////////////////////////////////////
                // Material computation
                if (res.m) {
                    switch (seg_case) {
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
            if (res.g) {
                var epsilon = 0.00001;
                p_eps.copy(p);
                p_eps.x += epsilon;
                self.evalDist(p_eps, ev_eps);
                res.g.x = (ev_eps.v - res.v) / epsilon;
                p_eps.x -= epsilon;
                p_eps.y += epsilon;
                self.evalDist(p_eps, ev_eps);
                res.g.y = (ev_eps.v - res.v) / epsilon;
                p_eps.y -= epsilon;
                p_eps.z += epsilon;
                self.evalDist(p_eps, ev_eps);
                res.g.z = (ev_eps.v - res.v) / epsilon;
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
     *  @param  point Point where value is wanted, as a Vector3
     *  @param  p1 Segment first point, as a Vector3
     *  @param  p1p2 Segment first to second point, as a Vector3
     *  @param  length Length of the segment
     *  @param  sqr_length Squared length of the segment
     *  @param  weight_1 Weight for the first point of the segment
     *  @param  delta_weight weight_2 - weight_1
     *  @param  res {proj_to_p, weight_proj}
     *
     */
    GenericSegmentComputation(point, p1, p1p2, _length, // Unused parameter
    sqr_length, weight_1, delta_weight, // = weight_2-weight_1
    res) {
        var origin_to_p = new Vector3();
        origin_to_p.subVectors(point, p1);
        var orig_p_scal_dir = origin_to_p.dot(p1p2);
        var orig_p_sqr = origin_to_p.lengthSq();
        var denum = sqr_length * weight_1 + orig_p_scal_dir * delta_weight;
        var t = (delta_weight < 0.0) ? 0.0 : 1.0;
        if (denum > 0.0) {
            t = (orig_p_scal_dir * weight_1 + orig_p_sqr * delta_weight) / denum;
            t = (t < 0.0) ? 0.0 : ((t > 1.0) ? 1.0 : t); // clipping (nearest point on segment not line)
        }
        res.proj_to_p = new Vector3(t * p1p2.x - origin_to_p.x, t * p1p2.y - origin_to_p.y, t * p1p2.z - origin_to_p.z);
        res.weight_proj = weight_1 + t * delta_weight;
        res.t = t;
        return res;
    }
    ///////////////////////////////////////////////////////////////////////////
    // Convolution Evaluation functions and auxiliaary functions
    /**
     *  value function for Distance volume type (distance field).
     *
     *  @param {Vector3} p
     *  @param {ValueResultType} res
     */
    evalConvol = (function () {
        var g = new Vector3();
        var m = new Material();
        var tmpRes = { v: 0, g: null, m: null };
        var g2 = new Vector3();
        var m2 = new Material();
        var tmpRes2 = { v: 0, g: null, m: null };
        return function (p, res) {
            /** @type {ScalisTriangle} */
            let self = this;
            tmpRes.g = res.g ? g : null;
            tmpRes.m = res.m ? m : null;
            // Compute closest point (t parameter) on the triangle in "warped space" as well as clipping
            var clipped = { l1: 0, l2: 0 };
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
                var grad_odd = new Vector3();
                for (var i = 1; i < nb_samples; i += 2) {
                    self.computeLineIntegral(self.unwarpAbscissa(t) * w_local + t_low, p, tmpRes);
                    res_odd += tmpRes.v;
                    if (res.g) {
                        if (tmpRes.g === null)
                            throw "[ScalisTriangle] equalConvol : gradient is null";
                        grad_odd.addVectors(grad_odd, tmpRes.g);
                    }
                    t += d_step_size;
                }
                var res_even = 0.0;
                var grad_even = new Vector3();
                t = 0.0;
                for (var j = 2; j < nb_samples; j += 2) {
                    t += d_step_size;
                    self.computeLineIntegral(self.unwarpAbscissa(t) * w_local + t_low, p, tmpRes);
                    if (res.g) {
                        if (tmpRes.g === null)
                            throw "[ScalisTriangle] equalConvol : gradient is null";
                        grad_even.addVectors(grad_even, tmpRes.g);
                    }
                    res_even += tmpRes.v;
                }
                tmpRes2.g = res.g ? g2 : null;
                tmpRes2.m = res.m ? m2 : null;
                var res_low = self.computeLineIntegral(t_low, p, tmpRes);
                var res_high = self.computeLineIntegral(t_high, p, tmpRes2);
                res.v = res_low.v + 4.0 * res_odd + 2.0 * res_even + res_low.v;
                var factor = (local_t_max / (3.0 * (nb_samples))) * ScalisMath.Poly6NF2D;
                res.v *= factor;
                if (res.g) {
                    var grad_res = new Vector3();
                    const res_low_g = res_low.g;
                    const res_high_g = res_high.g;
                    if (!res_low_g || !res_high_g)
                        throw "[ScalisTriangle] equalConvol : gradient is not defined here.";
                    grad_res.addVectors(grad_res, res_low_g);
                    grad_res.addVectors(grad_res, grad_odd.multiplyScalar(4.0));
                    grad_res.addVectors(grad_res, grad_even.multiplyScalar(2.0));
                    grad_res.addVectors(grad_res, res_high_g);
                    res.g = grad_res.multiplyScalar(factor);
                }
            }
            else {
                res.v = 0.0;
                res.g = new Vector3();
            }
            if (res.m) {
                if (tmpRes.m === null)
                    throw "[ScalisTriangle] equalConvol : material is null";
                tmpRes.g = null;
                self.evalDist(p, tmpRes);
                res.m.copy(tmpRes.m);
            }
        };
    })();
    /**
     *  @return Warped value
     */
    warpAbscissa(t) {
        // Compute approx of ln(d*l+1)/d
        var dt = t * this.unit_delta_weight;
        var inv_dtp2 = 1.0 / (dt + 2.0);
        var sqr_dt_divdlp2 = dt * inv_dtp2;
        sqr_dt_divdlp2 *= sqr_dt_divdlp2;
        var serie_approx = 1.0 + sqr_dt_divdlp2 * ((1.0 / 3.0) + sqr_dt_divdlp2 * ((1.0 / 5.0) + sqr_dt_divdlp2 * ((1.0 / 7.0) + sqr_dt_divdlp2 * ((1.0 / 9.0) + sqr_dt_divdlp2 * ((1.0 / 11.0) + sqr_dt_divdlp2 * (1.0 / 13.0))))));
        return 2.0 * t * inv_dtp2 * serie_approx;
    }
    /**
     *  @return Unwarped value
     */
    unwarpAbscissa(t) {
        // Compute approx of (exp(d*l)-1)/d
        var dt = t * this.unit_delta_weight;
        return t * (1.0 + dt * (1.0 / 2.0 + dt * (1.0 / 6.0 + dt * (1.0 / 24.0 + dt * (1.0 / 120.0 + dt * 1.0 / 720.0)))));
    }
    /**
     *  @param  t
     *  @param  p point, as a Vector3
     *  @param  res result containing the wanted elements like res.v for the value, res.g for the gradient, res.m for the material.
     *  @return the res parameter, filled with proper values
     */
    computeLineIntegral(t, p, res) {
        var weight = this.weight_min + t * this.unit_delta_weight;
        var p_1 = new Vector3();
        p_1.addVectors(this.point_min, this.longest_dir_special.clone().multiplyScalar(t));
        var length = (t < this.coord_middle) ? (t / this.coord_middle) * this.max_seg_length
            : ((this.coord_max - t) / (this.coord_max - this.coord_middle)) * this.max_seg_length;
        if (res.g) {
            this.consWeightEvalGradForSeg(p_1, weight, this.ortho_dir, length, p, res);
        }
        else {
            this.consWeightEvalForSeg(p_1, weight, this.ortho_dir, length, p, res);
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
     *  @param w special_coeff, x, y and z attributes must be defined
     *  @param length
     *  @param clipped Result if clipping occured, in l1 and l2, returned
     *                           values are between 0.0 and length/weight_min
     *
     *  @return  true if clipping occured
     *
     *  @protected
     */
    homotheticClippingSpecial(w, length, clipped) {
        // we search solution t \in [0,1] such that at^2-2bt+c<=0
        var a = -w.z;
        var b = -w.y;
        var c = -w.x;
        var delta = b * b - a * c;
        if (delta >= 0.0) {
            var b_p_sqrt_delta = b + Math.sqrt(delta);
            if ((b_p_sqrt_delta < 0.0) || (length * b_p_sqrt_delta < c)) {
                return false;
            }
            else {
                var main_root = c / b_p_sqrt_delta;
                clipped.l1 = (main_root < 0.0) ? 0.0 : main_root;
                var a_r = a * main_root;
                clipped.l2 = (2.0 * b < a_r + a * length) ? c / (a_r) : length;
                return true;
            }
        }
        return false;
    }
    /**
     *  @param point
     *  @return Object defining v attribute with the computed value
     *
     *  @protected
     */
    consWeightEvalForSeg(p_1, w_1, unit_dir, length, point, res) {
        var p_min_to_point = new Vector3();
        p_min_to_point.subVectors(point, p_1);
        var uv = unit_dir.dot(p_min_to_point);
        var d2 = p_min_to_point.lengthSq();
        var special_coeff = new Vector3();
        special_coeff.set(w_1 * w_1 - ScalisMath.KIS2 * d2, -ScalisMath.KIS2 * uv, -ScalisMath.KIS2);
        var clipped = { l1: 0, l2: 0 };
        if (this.homotheticClippingSpecial(special_coeff, length, clipped)) {
            var inv_local_min_weight = 1.0 / w_1;
            special_coeff.x = 1.0 - ScalisMath.KIS2 * (clipped.l1 * (clipped.l1 - 2.0 * uv) + d2) * inv_local_min_weight * inv_local_min_weight;
            special_coeff.y = -ScalisMath.KIS2 * (uv - clipped.l1) * inv_local_min_weight;
            res.v = this.homotheticCompactPolynomial_segment_F_i6_cste((clipped.l2 - clipped.l1) * inv_local_min_weight, special_coeff);
        }
        else {
            return 0;
        }
        return res;
    }
    /**
     *  @return  Object defining v attribute with the computed value
     *  @protected
     */
    consWeightEvalGradForSeg(p_1, w_1, unit_dir, length, point, res) {
        var p_min_to_point = new Vector3();
        p_min_to_point.subVectors(point, p_1);
        var uv = unit_dir.dot(p_min_to_point);
        var d2 = p_min_to_point.lengthSq();
        var special_coeff = new Vector3();
        special_coeff.set(w_1 * w_1 - ScalisMath.KIS2 * d2, -ScalisMath.KIS2 * uv, -ScalisMath.KIS2);
        var clipped = { l1: 0, l2: 0 };
        if (this.homotheticClippingSpecial(special_coeff, length, clipped)) {
            var inv_local_min_weight = 1.0 / w_1;
            special_coeff.x = 1.0 - ScalisMath.KIS2 * (clipped.l1 * (clipped.l1 - 2.0 * uv) + d2) * inv_local_min_weight * inv_local_min_weight;
            special_coeff.y = -ScalisMath.KIS2 * (uv - clipped.l1) * inv_local_min_weight;
            var F0F1F2 = new Vector3();
            this.homotheticCompactPolynomial_segment_FGradF_i6_cste((clipped.l2 - clipped.l1) * inv_local_min_weight, special_coeff, F0F1F2);
            res.v = F0F1F2.x;
            F0F1F2.y *= inv_local_min_weight;
            var vect = unit_dir.clone();
            vect.multiplyScalar(F0F1F2.z + clipped.l1 * F0F1F2.y);
            p_min_to_point.multiplyScalar(-F0F1F2.y);
            p_min_to_point.addVectors(p_min_to_point, vect);
            res.g = p_min_to_point.multiplyScalar(6.0 * ScalisMath.KIS2 * inv_local_min_weight);
        }
        else {
            res.v = 0;
            if (!res.g)
                throw "[ScalisTriangle] consWeightEvalGradForSeg : gradient is null";
            res.g.set(0, 0, 0);
        }
        return res;
    }
    /**
     *  @param  point the point of evaluation, as a Vector3
     *  @param  clipped Result if clipping occured, in l1 and l2, returned
     *                           values are between 0.0 and length/weight_min
     *  @return  true if clipping occured
     */
    ComputeTParam(point, clipped) {
        var p_min_to_point = new Vector3();
        p_min_to_point.subVectors(point, this.point_min);
        var coord_main_dir = p_min_to_point.dot(this.main_dir);
        var coord_normal = p_min_to_point.dot(this.unit_normal);
        //WARNING : Assume that the compact support is defined in the same way as HomotheticCompactPolynomial kernels
        var dist_sqr = coord_main_dir * coord_main_dir + coord_normal * coord_normal;
        var special_coeff = new Vector3();
        special_coeff.set(this.weight_min * this.weight_min - ScalisMath.KIS2 * dist_sqr, -this.unit_delta_weight * this.weight_min - ScalisMath.KIS2 * coord_main_dir, this.unit_delta_weight * this.unit_delta_weight - ScalisMath.KIS2);
        return this.homotheticClippingSpecial(special_coeff, this.coord_max, clipped);
    }
    /**
     *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param w Some coefficient, as a Vector3
     *  @return  the value
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
        return (0.6e1 / 0.5e1 * (0.4e1 / 0.3e1 * (0.2e1 * t7065 * l + t7066 * t7064 + t7069 * t7070) * t7077 + t7076 + t7075) * t7077 + t7064 * t7076 + t7070 * t7075) * t7067 / 0.7e1;
    }
    // optimized function for segment of constant weight
    // computes value and grad
    /**
     *  Sub-function for optimized convolution for segment of constant weight,
     *  value and gradient computation (Homothetic Compact Polynomial).
     *  Function designed by Cedric Zanni, optimized for C++ using matlab.
     *  @param  l
     *  @param  res result in a Vector3
     *  @param  w a Vector3
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
Types.register(ScalisTriangle.type, ScalisTriangle);

/**
 *  A superclass for Node and Primitive in the blobtree.
 */
class DistanceFunctor {
    static type = "DistanceFunctor";
    /**
     *  @abstract
     *  @param json Json description of the object
     */
    static fromJSON(json) {
        return Types.fromJSON(json);
    }
    /**
     *  @return Type of the element
     */
    getType() {
        return DistanceFunctor.type;
    }
    /**
     *  @abstract
     *  Return a Javscript Object respecting JSON convention and can be used to serialize the functor.
     */
    toJSON() {
        return {
            type: this.getType()
        };
    }
    ;
    /**
     *  Perform a numerical approximation of the gradient according to epsilon.
     *  @param d The distance to be considered.
     *  @param epsilon The numerical step for this gradient computation. Default to 0.00001.
     */
    numericalGradient(d, epsilon = 0.00001) {
        return (this.value(d + epsilon) - this.value(d - epsilon)) / (2 * epsilon);
    }
    /**
     *  Compute the gradient. Should be reimplemented in most cases.
     *  By default, this function returns a numerical gradient with epsilon at 0.00001.
     *  @return One-dimensional gradient at d.
     */
    gradient(d) {
        return this.numericalGradient(d, 0.00001);
    }
    /**
     *  @returns Distance above which all values will be 0. Should be reimplemented and defaults to infinity.
     */
    getSupport() {
        return Infinity;
    }
}
Types.register(DistanceFunctor.type, DistanceFunctor);

/**
 *  Specialised Distance Functor using a 6 degree polynomial function.
 *  This is the function similar to the one used in SCALIS primitives.
 *  @constructor
 */
class Poly6DistanceFunctor extends DistanceFunctor {
    static type = "Poly6DistanceFunctor";
    scale;
    fromJSON(json) {
        return new Poly6DistanceFunctor(json.scale);
    }
    /**
     * This is the standard 6 degree polynomial function used for implicit modeling.
     * At 0, its value is 1 with a zero derivative.
     * At 1, its value is 0 with a zero derivative.
     */
    evalStandard(d) {
        if (d < 0.0) {
            return 1.0;
        }
        const aux = 1.0 - d * d;
        if (aux > 0.0) {
            return aux * aux * aux;
        }
        else {
            return 0.0;
        }
    }
    constructor(scale) {
        super();
        this.scale = scale || 1.0;
    }
    /**
     *  @return Type of the element
     */
    getType() {
        return Poly6DistanceFunctor.type;
    }
    /**
     *  @return Json description of this functor.
     */
    toJSON() {
        return {
            ...super.toJSON(),
            scale: this.scale
        };
    }
    /**
     * @link DistanceFunctor.value for a complete description.
     * @param d The distance to be considered.
     * @returns Scalar field value according to given distance d.
     */
    value(d) {
        let dp = d / (2 * this.scale); // ensure the support fits the scale.
        dp = dp + 0.5;
        return this.evalStandard(dp) / this.evalStandard(0.5);
    }
    /**
     * @returns dimensional gradient at d.
     */
    gradient(d) {
        const ds = d / (2 * this.scale) + 0.5;
        let res = 1 - ds * ds;
        res = -(6 / (2 * this.scale)) * ds * res * res / this.evalStandard(0.5);
        return res;
    }
    /**
     * @link DistanceFunctor.getSupport for a complete description.
     */
    getSupport() {
        return this.scale;
    }
}
Types.register(Poly6DistanceFunctor.type, Poly6DistanceFunctor);

/**
 *  This class implements an abstract primitive class for signed distance field.
 *  SDFPrimitive subclasses must define a scalar field being the distance to a geometry.
 *  @constructor
 *  @extends {Element}
 */
class SDFPrimitive extends Element {
    static type = "SDFPrimitive";
    constructor() {
        super();
        // Default bounding box for a SDF is infinite.
        this.aabb.set(new Vector3(-Infinity, -Infinity, -Infinity), new Vector3(Infinity, Infinity, Infinity));
    }
    /**
     * @return Type of the element
     */
    getType() {
        return SDFPrimitive.type;
    }
    /**
     * @link Element.computeAABB for a complete description.
     */
    computeAABB() {
        // Nothing to do, SDF have infinite bounding box
    }
    getAreas() {
        throw "No Areas for SDFPrimitive.";
    }
    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     *
     * @param p
     */
    distanceTo = (function () {
        var res = { v: 0 };
        return function (p) {
            this.value(p, res);
            return res.v;
        };
    })();
    /**
     * @link see Element.heuristicStepWithin for a complete description.
     */
    heuristicStepWithin() {
        console.error("SDFPrimitive.heuristicStepWithin is Not implemented");
        return 1;
    }
    ;
}
Types.register(SDFPrimitive.type, SDFPrimitive);

/**
 *  This primitive implements a distance field to an extended "capsule geometry", which is actually a weighted segment.
 *  You can find more on Capsule geometry here https://github.com/maximeq/three-js-capsule-geometry
 *
 *  @constructor
 *  @extends SDFPrimitive
 */
class SDFCapsule extends SDFPrimitive {
    static type = "SDFCapsule";
    fromJSON(json) {
        return new SDFCapsule(new Vector3(json.p1.x, json.p1.y, json.p1.z), new Vector3(json.p2.x, json.p2.y, json.p2.z), json.r1, json.r2);
    }
    p1;
    p2;
    r1;
    r2;
    rdiff;
    unit_dir;
    lengthSq;
    length;
    /**
     *  @param p1 Position of the first segment extremity
     *  @param p2 Position of the second segment extremity
     *  @param r1 Radius of the sphere centered in p1
     *  @param r2 Radius of the sphere centered in p2
     */
    constructor(p1, p2, r1, r2) {
        super();
        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.r1 = r1;
        this.r2 = r2;
        // Helper for evaluation
        this.rdiff = this.r2 - this.r1;
        this.unit_dir = new Vector3().subVectors(this.p2, this.p1);
        this.lengthSq = this.unit_dir.lengthSq();
        this.length = this.unit_dir.length();
        this.unit_dir.normalize();
    }
    /**
     *  @return Type of the element
     */
    getType() {
        return SDFCapsule.type;
    }
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
     *  @param r1 The new radius at p1
     */
    setRadius1(r1) {
        this.r1 = r1;
        this.invalidAABB();
    }
    /**
     *  @param r2 The new radius at p2
     */
    setRadius2(r2) {
        this.r2 = r2;
        this.invalidAABB();
    }
    /**
     *  @return Current radius at p1
     */
    getRadius1() {
        return this.r1;
    }
    /**
     *  @return Current radius at p2
     */
    getRadius2() {
        return this.r2;
    }
    /**
     *  @param p1 The new position of the first segment point.
     */
    setPosition1(p1) {
        this.p1.copy(p1);
        this.invalidAABB();
    }
    /**
     *  @param p2 The new position of the second segment point
     */
    setPosition2(p2) {
        this.p2.copy(p2);
        this.invalidAABB();
    }
    /**
     *  @return Current position of the first segment point
     */
    getPosition1() {
        return this.p1;
    }
    /**
     *  @return Current position of the second segment point
     */
    getPosition2() {
        return this.p2;
    }
    computeDistanceAABB(d) {
        const b1 = new Box3(this.p1.clone().add(new Vector3(-this.r1 - d, -this.r1 - d, -this.r1 - d)), this.p1.clone().add(new Vector3(this.r1 + d, this.r1 + d, this.r1 + d)));
        const b2 = new Box3(this.p2.clone().add(new Vector3(-this.r2 - d, -this.r2 - d, -this.r2 - d)), this.p2.clone().add(new Vector3(this.r2 + d, this.r2 + d, this.r2 + d)));
        return b1.union(b2);
    }
    /**
     * @link Element.prepareForEval for a complete description
     */
    prepareForEval() {
        if (!this.valid_aabb) {
            this.valid_aabb = true;
        }
    }
    /**
     * @return The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d) {
        if (!this.valid_aabb) {
            throw "ERROR: Cannot get area of invalid primitive";
        }
        else {
            return [{
                    aabb: this.computeDistanceAABB(d),
                    bv: new AreaCapsule(this.p1, this.p2, this.r1 + d, this.r2 + d, this.r1 / (this.r1 + d), // Adjust accuracy factor according to the radius and not only to the required d
                    this.r2 / (this.r2 + d)),
                    obj: this
                }];
        }
    }
    /**
     *  @link Element.value for a complete description
     */
    value = (function () {
        const v = new Vector3();
        const proj = new Vector3();
        /**
         *  @param p
         *  @param res
         */
        return function (p, res) {
            const self = this;
            v.subVectors(p, self.p1);
            const p1p_sqrl = v.lengthSq();
            // In unit_dir basis, vector (this.r1-this.r2, this.length) is normal to the "weight line"
            // We need a projection in this direction up to the segment line to know in which case we fall.
            const x_p_2D = v.dot(self.unit_dir);
            // pythagore inc.
            const y_p_2D = Math.sqrt(Math.max(// Necessary because of rounded errors, pyth result can be <0 and this causes sqrt to return NaN...
            0.0, p1p_sqrl - x_p_2D * x_p_2D // =  y_p_2D² by pythagore
            ));
            const t = -y_p_2D / self.length;
            const proj_x = x_p_2D + t * (self.r1 - self.r2);
            // var proj_y = 0.0; // by construction
            // Easy way to compute the distance now that we have the projection on the segment
            const a = MathUtils.clamp(proj_x / self.length, 0, 1.0);
            proj.copy(self.p1).lerp(self.p2, a); // compute the actual 3D projection
            const l = v.subVectors(p, proj).length();
            res.v = l - (a * self.r2 + (1.0 - a) * self.r1);
            if (res.g) {
                res.g.copy(v).divideScalar(l);
            }
        };
    })();
}
Types.register(SDFCapsule.type, SDFCapsule);

/**
 *  This class implements an abstract Node class for Signed Distance Field.
 *  The considered primitive is at distance = 0.
 *  Convention is : negative value inside the surface, positive value outside.
 *  @constructor
 *  @extends {Node}
 */
class SDFNode extends Node {
    static type = "SDFNode";
    children;
    constructor() {
        super();
        // Default bounding box for a SDF is infinite.
        this.aabb.set(new Vector3(-Infinity, -Infinity, -Infinity), new Vector3(+Infinity, +Infinity, +Infinity));
        this.children = [];
    }
    overridegetType() {
        return SDFNode.type;
    }
    computeAABB() {
        // Nothing to do, SDF have infinite bounding box
    }
    /**
     *  Return the bounding box of the node for a given maximum distance.
     *  Ie, the distance field is greater than d everywhere outside the returned box.
     *  @abstract
     *  @param d Distance
     */
    computeDistanceAABB(d) {
        let res = new Box3();
        for (let i = 0; i < this.children.length; ++i) {
            res.union(this.children[i].computeDistanceAABB(d));
        }
        return res;
    }
    addChild(c) {
        return super.addChild(c);
    }
    /**
     *  SDF Field are infinite, so Areas do not make sense except for the SDFRoot, which will
     *  usually apply a compact kernel to the distance field.
     *  @abstract
     */
    getAreas() {
        throw "No Areas for SDFNode, except for the SDFRootNode.";
    }
    /**
     * @param d Distance to consider for the area computation.
     */
    getDistanceAreas(d) {
        // By default return areas of all children
        let res = [];
        for (let i = 0; i < this.children.length; ++i) {
            let c = this.children[i];
            res.push(...c.getDistanceAreas(d));
        }
        return res;
    }
    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     * @param _p Point
     */
    distanceTo(_p) {
        throw "distanceTo should be reimplemented in every children classes of SDFNode.";
    }
    ;
    heuristicStepWithin() {
        throw "heuristicStepWithin may not make sens for all SDFNode, except for the SDFRootNode.";
    }
    ;
}
Types.register(SDFNode.type, SDFNode);

class SDFPoint extends SDFPrimitive {
    static type = "SDFPoint";
    static fromJSON(json) {
        return new SDFPoint(new Vector3(json.p.x, json.p.y, json.p.z), json.acc);
    }
    ;
    p;
    acc;
    /**
     *  @param p Position (ie center) of the point
     *  @param acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
     */
    constructor(p, acc = 1.0) {
        super();
        this.p = p.clone();
        this.acc = acc;
    }
    getType() {
        return SDFPoint.type;
    }
    ;
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
    }
    ;
    /**
     *  @param acc The new accuracy factor
     */
    setAccuracy(acc) {
        this.acc = acc;
        this.invalidAABB();
    }
    ;
    /**
     *  @return Current accuracy factor
     */
    getAccuracy() {
        return this.acc;
    }
    ;
    /**
     *  @param p The new position (ie center)
     */
    setPosition(p) {
        this.p.copy(p);
        this.invalidAABB();
    }
    ;
    /**
     *  @return Current position (ie center)
     */
    getPosition() {
        return this.p;
    }
    ;
    /**
     *  @param d Distance
     */
    computeDistanceAABB(d) {
        return new Box3(this.p.clone().add(new Vector3(-d, -d, -d)), this.p.clone().add(new Vector3(d, d, d)));
    }
    prepareForEval() {
        if (!this.valid_aabb) {
            this.valid_aabb = true;
        }
    }
    ;
    /**
     * @link SDFPrimitive.getDistanceAreas
     * @param d Distance to consider for the area computation.
     */
    getDistanceAreas(d) {
        if (!this.valid_aabb) {
            throw new Error("ERROR : Cannot get area of invalid primitive");
        }
        else {
            return [{
                    aabb: this.computeDistanceAABB(d),
                    bv: new AreaSphere(this.p, d, this.acc),
                    obj: this
                }];
        }
    }
    ;
    /**
     *  @link Element.value for a complete description
     */
    value = (function () {
        const v = new Vector3();
        return function (p, res) {
            if (!this.valid_aabb) {
                throw new Error("Error : PrepareForEval should have been called");
            }
            v.subVectors(p, this.p);
            const l = v.length();
            res.v = l;
            if (res.g) {
                res.g.copy(v).multiplyScalar(1 / l);
            }
        };
    })();
}
Types.register(SDFPoint.type, SDFPoint);

/**
 *  This class implements a SDF Root Node, which is basically a Signed Distance Field
 *  made of some node combination, on which is applied a compact support function.
 *  For now SDF nodes do not have materials. A unique material is defined in the SDFRootNode.
 */
class SDFRootNode extends Primitive {
    static type = "SDFRootNode";
    f;
    sdfRoot;
    tmp_res;
    tmp_g;
    static fromJSON(json) {
        const f = Types.fromJSON(json.f);
        let material = Material.fromJSON(json.materials[0]);
        let sdfRoot = Types.fromJSON(json.sdfRoot);
        return new SDFRootNode(f, material, sdfRoot);
    }
    /**
     * @param f The distance function to be applied to the distance field.
     * It must respect the Blobtree convention, which is : positive everywhere, with a finite support.
     * @param material The material for this node.
     * @param sdfRoot The child containing the complete SDF. SDFRootNode can have only one child.
     */
    constructor(f, material, sdfRoot) {
        super();
        this.f = f;
        this.materials.push(material ? material.clone() : new Material());
        this.sdfRoot = sdfRoot ? (sdfRoot instanceof SDFNode ? sdfRoot : new SDFNode().addChild(sdfRoot)) : new SDFNode();
        this.tmp_res = { v: 0, g: null };
        this.tmp_g = new Vector3(0, 0, 0);
    }
    getType() {
        return SDFRootNode.type;
    }
    addChild(c) {
        if (this.sdfRoot.children.length === 0) {
            this.sdfRoot.addChild.call(this, c);
        }
        else {
            throw new Error("SDFRootNode can have only one child.");
        }
    }
    removeChild(c) {
        this.sdfRoot.removeChild(c);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            f: this.f.toJSON(),
            sdfRoot: this.sdfRoot.toJSON()
        };
    }
    prepareForEval() {
        if (!this.valid_aabb) {
            this.aabb = new Box3();
            for (let i = 0; i < this.sdfRoot.children.length; ++i) {
                let c = this.sdfRoot.children[i];
                c.prepareForEval();
                this.aabb.union(c.computeDistanceAABB(this.f.getSupport()));
            }
            this.valid_aabb = true;
        }
    }
    getAreas() {
        if (!this.valid_aabb) {
            throw new Error("ERROR: Cannot get area of invalid node");
        }
        else {
            let distAreas = this.sdfRoot.getDistanceAreas(this.f.getSupport());
            return distAreas.map(area => ({
                aabb: area.aabb,
                bv: area.bv,
                obj: this
            }));
        }
    }
    value(p, res) {
        const tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        res.v = 0;
        if (res.m) {
            res.m.copy(Material.defaultMaterial);
        }
        if (this.aabb.containsPoint(p)) {
            this.sdfRoot.children[0].value(p, tmp);
            res.v = this.f.value(tmp.v);
            if (res.g) {
                res.g.copy(tmp.g).multiplyScalar(this.f.gradient(res.v));
            }
            if (res.m) {
                res.m.copy(this.materials[0]);
            }
        }
        else if (res.step !== undefined) {
            res.step = this.aabb.distanceToPoint(p) + 0.3;
        }
    }
}
Types.register(SDFRootNode.type, SDFRootNode);

class SDFSegment extends SDFPrimitive {
    static type = "SDFSegment";
    static fromJSON(json) {
        return new SDFSegment(new Vector3(json.p1.x, json.p1.y, json.p1.z), new Vector3(json.p2.x, json.p2.y, json.p2.z), json.acc);
    }
    ;
    p1;
    p2;
    acc;
    // Helper for evaluation
    l;
    /**
    *  @param p1 Position of the first segment extremity
    *  @param p2 Position of the second segment extremity
    *  @param acc Accuracy factor for this primitive. Default is 1.0 which will lead to the side of the support.
    */
    constructor(p1, p2, acc) {
        super();
        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.acc = acc || 1.0;
        this.l = new Line3(this.p1, this.p2);
    }
    getType() {
        return SDFSegment.type;
    }
    ;
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
        };
    }
    ;
    /**
     *  @param acc The new accuracy factor
     */
    setAccuracy(acc) {
        this.acc = acc;
        this.invalidAABB();
    }
    ;
    /**
     *  @return Current accuracy factor
     */
    getAccuracy() {
        return this.acc;
    }
    ;
    /**
     *  @param  p1 The new position of the first segment point.
     */
    setPosition1(p1) {
        this.p1.copy(p1);
        this.invalidAABB();
    }
    ;
    /**
     *  @param p2 The new position of the second segment point
     */
    setPosition2(p2) {
        this.p2.copy(p2);
        this.invalidAABB();
    }
    ;
    /**
     *  @return Current position of the first segment point
     */
    getPosition1() {
        return this.p1;
    }
    ;
    /**
     *  @return Current position of the second segment point
     */
    getPosition2() {
        return this.p2;
    }
    ;
    // [Abstract]
    computeDistanceAABB(d) {
        var b1 = new Box3(this.p1.clone().add(new Vector3(-d, -d, -d)), this.p1.clone().add(new Vector3(d, d, d)));
        var b2 = new Box3(this.p2.clone().add(new Vector3(-d, -d, -d)), this.p2.clone().add(new Vector3(d, d, d)));
        return b1.union(b2);
    }
    ;
    // [Abstract]
    prepareForEval() {
        if (!this.valid_aabb) {
            this.l.set(this.p1, this.p2);
            this.valid_aabb = true;
        }
    }
    ;
    /**
     * @return The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d) {
        if (!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid primitive";
        }
        else {
            return [{
                    aabb: this.computeDistanceAABB(d),
                    bv: new AreaCapsule(this.p1, this.p2, d, d, this.acc, this.acc),
                    obj: this
                }];
        }
    }
    ;
    /**
     *  @link Element.value for a complete description
     */
    value = (function () {
        var v = new Vector3();
        var lc = new Vector3();
        /**
         *  @param {Vector3} p
         *  @param {ValueResultType} res
         */
        return function (p, res) {
            this.l.closestPointToPoint(p, true, v);
            res.v = lc.subVectors(p, v).length();
            if (res.g) {
                res.g.copy(lc).divideScalar(res.v);
            }
        };
    })();
}
Types.register(SDFSegment.type, SDFSegment);

class SDFSphere extends SDFPrimitive {
    static type = "SDFSphere";
    static fromJSON(json) {
        return new SDFSphere(new Vector3(json.p.x, json.p.y, json.p.z), json.r);
    }
    ;
    p;
    r;
    /**
     *  @param  p Position (ie center) of the sphere
     *  @param  r Radius of the sphere
     */
    constructor(p, r) {
        super();
        this.p = p.clone();
        this.r = r;
    }
    getType() {
        return SDFSphere.type;
    }
    ;
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
    }
    ;
    /**
     *  @param r The new radius
     */
    setRadius(r) {
        this.r = r;
        this.invalidAABB();
    }
    ;
    /**
     *  @return Current radius
     */
    getRadius() {
        return this.r;
    }
    ;
    /**
     *  @param p The new position (ie center)
     */
    setPosition(p) {
        this.p.copy(p);
        this.invalidAABB();
    }
    ;
    /**
     *  @return  Current position (ie center)
     */
    getPosition() {
        return this.p;
    }
    ;
    // [Abstract]
    computeDistanceAABB(d) {
        return new Box3(this.p.clone().add(new Vector3(-this.r - d, -this.r - d, -this.r - d)), this.p.clone().add(new Vector3(this.r + d, this.r + d, this.r + d)));
    }
    ;
    // [Abstract]
    prepareForEval() {
        if (!this.valid_aabb) {
            this.valid_aabb = true;
        }
    }
    ;
    /**
     * @return The Areas object corresponding to the node/primitive, in an array
     */
    getDistanceAreas(d) {
        if (!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid primitive";
        }
        else {
            return [{
                    aabb: this.computeDistanceAABB(d),
                    bv: new AreaSphere(this.p, this.r + d, this.r / (this.r + d) // Adjust accuray factor according to the radius and not only to the required d
                    ),
                    obj: this
                }];
        }
    }
    ;
    /**
     *  @link Element.value for a complete description
     */
    value = (function () {
        var v = new Vector3();
        /**
         *  @param {Vector3} p
         *  @param {ValueResultType} res
         */
        return function (p, res) {
            /** @type {SDFSphere} */
            let self = this;
            if (!self.valid_aabb) {
                throw "Error : PrepareForEval should have been called";
            }
            v.subVectors(p, self.p);
            var l = v.length();
            res.v = l - self.r;
            if (res.g) {
                res.g.copy(v).multiplyScalar(1 / l);
            }
        };
    })();
}
Types.register(SDFSphere.type, SDFSphere);

/**
 * @typedef {0|1|2|3|4|5|6|7} EdgeIndex
 * @typedef {[EdgeIndex, EdgeIndex]} EdgeIndexPair
 * @typedef {0|1} TopoValue
 * @typedef {[TopoValue, TopoValue, TopoValue]} TopoTriple
 */
/**
 * Tables for Marching Cube
 */
const Tables = {
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
        [1, 1, 1] //7 (MC = 6)
    ]
};

/**
 *  Axis Aligned Bounding Box in 2D carrying accuracy data
 *  @constructor
 *  @extends Box2
 */
class Box2Acc extends Box2 {
    nice_acc;
    raw_acc;
    /**
     *  @param min Minimum x,y coordinate of the box
     *  @param max Maximum x,y coordinate of the box
     *  @param nice_acc Nice accuracy in this box
     *  @param raw_acc Raw accuracy in this box
     */
    constructor(min, max, nice_acc, raw_acc) {
        super(min, max);
        const s = Math.max(this.max.x - this.min.x, this.max.y - this.min.y);
        this.nice_acc = 10000000;
        // Can nice_acc be 0 ? if yes we can simplify the next line
        if (nice_acc === undefined || nice_acc === null && s > 0) {
            this.nice_acc = s;
        }
        else {
            this.nice_acc = nice_acc;
        }
        this.raw_acc = this.raw_acc ? this.nice_acc : raw_acc;
    }
    unionWithAcc(box) {
        if (box.nice_acc === null || box.raw_acc === null)
            throw "[Box2Acc] Cannot do union with a box that is empty.";
        if (this.nice_acc === null || this.raw_acc === null)
            throw "[Box2Acc] Cannot do union on a box that is empty.";
        super.union(box);
        // Union of 2 boxes get the min acc for both
        this.raw_acc = Math.min(box.raw_acc, this.raw_acc);
        this.nice_acc = Math.min(box.nice_acc, this.nice_acc);
    }
    getRawAcc() {
        return this.raw_acc;
    }
    ;
    getNiceAcc() {
        return this.nice_acc;
    }
    ;
    setRawAcc(raw_acc) {
        this.raw_acc = Math.max(0, raw_acc);
    }
    ;
    setNiceAcc(nice_acc) {
        this.nice_acc = Math.max(0, nice_acc);
    }
    ;
    toString() {
        return ("(" +
            this.min.x.toFixed(2) +
            ", " +
            this.min.y.toFixed(2) +
            ") -> (" +
            this.max.x.toFixed(2) +
            ", " +
            this.max.y.toFixed(2) +
            ") ");
    }
    ;
    setWithAcc(min_x, min_y, max_x, max_y, nice_acc, raw_acc) {
        this.min.set(min_x, min_y);
        this.max.set(max_x, max_y);
        if (nice_acc !== undefined) {
            this.nice_acc = nice_acc;
        }
        if (raw_acc !== undefined) {
            this.raw_acc = raw_acc;
        }
    }
    ;
    /**
     *  Get corner with the minimum coordinates
     *  @return {Vector2}
     */
    getMinCorner() {
        return this.min;
    }
    ;
}
/**
 *  Class for a dual marching cube using 2 sliding arrays.

 *  @constructor
 */
class SlidingMarchingCubes {
    blobtree;
    uniformZ;
    detail_ratio;
    convergence;
    progress;
    reso;
    steps;
    curr_steps;
    curr_step_vol;
    values_xy;
    vertices_xy;
    areas;
    min_acc;
    values;
    x;
    y;
    z;
    mask;
    edge_cross;
    vertex;
    vertex_n;
    vertex_m;
    extended;
    dis_o_aabb;
    ext_p;
    geometry;
    minCurvOrient;
    _isMinCurvatureTriangulation;
    /**
     *  @param blobtree A blobtree to polygonize.
     *  @param smcParams Parameters and option for this polygonizer
     */
    constructor(blobtree, smcParams) {
        if (!smcParams) {
            throw new Error("smcParams must be provided for SlidingMarchingCubes, to use all default values, please use {}");
        }
        this.blobtree = blobtree;
        this.uniformZ = smcParams.zResolution === "uniform" ? true : false;
        this.detail_ratio = smcParams.detailRatio
            ? Math.max(0.01, smcParams.detailRatio)
            : 1.0;
        if (smcParams.convergence) {
            this.convergence = smcParams.convergence;
            this.convergence.ratio = this.convergence.ratio || 0.01;
            this.convergence.step = this.convergence.step || 10;
        }
        else {
            this.convergence = null;
        }
        this.progress = smcParams.progress
            ? smcParams.progress
            : function (_percent) {
                //console.log(percent);
            };
        this.reso = new Int32Array(3);
        this.steps = {
            x: null,
            y: null,
            z: null
        };
        this.curr_steps = {
            x: 0,
            y: 0,
            z: 0
        };
        // = this.curr_steps.x*this.curr_steps.y*this.curr_steps.z
        this.curr_step_vol = 0;
        /**
         *  Sliding values array
         */
        this.values_xy = [null, null];
        /**
         *  Sliding values array
         */
        this.vertices_xy = [null, null];
        this.areas = [];
        this.min_acc = 1;
        // Processing consts
        this.values = new Array(8);
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.mask = 0;
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
        this.vertex = new Vector3(0, 0, 0); // vertex associated to the cell if any
        this.vertex_n = new Vector3(0, 0, 0); // vertex normal
        this.vertex_m = new Material(); // vertex material
        // Vars and tmp consts for extension checks
        this.extended = false;
        this.dis_o_aabb = new Box3();
        this.ext_p = new Vector3();
        /**
         * Resulting mesh data
         */
        this.geometry = null;
        // Ensure triangulation along min curvature edge
        this.minCurvOrient = true;
        // Returns true if 123/143 split is along min curvature
        this._isMinCurvatureTriangulation =
            (function () {
                //Var and tmp const pre allocated and Scoped
                //for optimization of triangulation criteria
                //assuming a v1v2v3v4 quad
                let p1 = new Vector3(); //v1 position
                let p2 = new Vector3(); //v2 position
                let p3 = new Vector3(); //v3 position
                let p4 = new Vector3(); //v4 position
                //Edges from v2
                let pp_2_1 = new Vector3(); //v2v1 edge
                let pp_2_3 = new Vector3(); //v2v3 edge
                let pp_2_4 = new Vector3(); //v2v4 edge
                //Edges from v4
                let pp_4_1 = new Vector3(); //v4v1 edge
                let pp_4_3 = new Vector3(); //v3v1 edge
                let n_2 = new Vector3(); //123 normal
                let n_4 = new Vector3(); //341 normal
                let n_23 = new Vector3(); //234 normal
                let n_42 = new Vector3(); //412 normal
                return function (v1, v2, v3, v4) {
                    if (this.geometry === null)
                        throw "[SlidingMarchingCubes] geometry must be initialized before calling _isMinCurvatureTriangulation";
                    //Quad opposes v1 and v3 and v2 and v4
                    //check min curvature
                    p1.x = this.geometry.position[v1 * 3];
                    p1.y = this.geometry.position[v1 * 3 + 1];
                    p1.z = this.geometry.position[v1 * 3 + 2];
                    p2.x = this.geometry.position[v2 * 3];
                    p2.y = this.geometry.position[v2 * 3 + 1];
                    p2.z = this.geometry.position[v2 * 3 + 2];
                    p3.x = this.geometry.position[v3 * 3];
                    p3.y = this.geometry.position[v3 * 3 + 1];
                    p3.z = this.geometry.position[v3 * 3 + 2];
                    p4.x = this.geometry.position[v4 * 3];
                    p4.y = this.geometry.position[v4 * 3 + 1];
                    p4.z = this.geometry.position[v4 * 3 + 2];
                    //Edges from v2
                    pp_2_1.subVectors(p1, p2);
                    pp_2_3.subVectors(p3, p2);
                    pp_2_4.subVectors(p4, p2);
                    //Edges from v4
                    pp_4_1.subVectors(p1, p4);
                    pp_4_3.subVectors(p3, p4);
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
                    return dot_31 < dot_24;
                };
            })();
    }
    /**
     *  Initialize the internal Geometry structure.
     *  @private
     */
    initGeometry() {
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
    buildResultingBufferGeometry() {
        if (this.geometry === null) {
            throw "[SlidingMarchinCubes] Geometry must be initialized before calling buildResultingBufferGeometry";
        }
        const res = new BufferGeometry();
        res.setAttribute("position", new BufferAttribute(new Float32Array(this.geometry.position), 3));
        res.setAttribute("normal", new BufferAttribute(new Float32Array(this.geometry.normal), 3));
        res.setAttribute("color", new BufferAttribute(new Float32Array(this.geometry.color), 3));
        res.setAttribute("roughness", new BufferAttribute(new Float32Array(this.geometry.roughness), 1));
        res.setAttribute("metalness", new BufferAttribute(new Float32Array(this.geometry.metalness), 1));
        res.setIndex(new BufferAttribute(this.geometry.nVertices > 65535
            ? new Uint32Array(this.geometry.faces)
            : new Uint16Array(this.geometry.faces), 1));
        return res;
    }
    /**
     *  Set values in this.values_xy[1] to 0
     *  @private
     */
    setFrontToZero() {
        // init to 0, can be omptim later
        if (this.values_xy[1] === null) {
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling setFrontToZero";
        }
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
        if (this.values_xy[1] === null) {
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling setFrontToMinus";
        }
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
        if (this.values_xy[1] === null) {
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling setFrontToZeroIfMinus";
        }
        for (let i = 0; i < this.values_xy[1].length; ++i) {
            if (this.values_xy[1][i] === -1) {
                this.values_xy[1][i] = 0;
            }
        }
    }
    /**
     *  Perform bilinear interpolation in a given 2D box to set values in front array
     *
     *  @param cx Coordinate x of bottom left corner of the front array
     *  @param cy Coordinate x of bottom left corner of the front array
     *  @param cz Coordinate x of bottom left corner of the front array
     *
     *  @param x0 Lower x box osition in the array
     *  @param x1 Upper x box position in the array
     *  @param y0 Lower y box position in the array
     *  @param y1 Upper y box position in the array
     *
     *  @private
     */
    interpolateInBox(_cx, _cy, _cz, x0, x1, y0, y1) {
        if (this.values_xy[1] === null) {
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling interpolateInBox";
        }
        let constr = this.values_xy[1];
        let nx = x1 - x0;
        let ny = y1 - y0;
        /*
        this.computeFrontValAtBoxCorners(cx,cy,cz, new Vector2(x0,y0), new Vector2(x1,y1));
        const mask = this.computeBoxMask(new Vector2(x0,y0), new Vector2(x1,y1));
        if(!(mask === 0xf || mask === 0x0)){
            throw "Error bad mask when interpolating";
        }
        */
        if (nx > 1) {
            // must interpolate
            let line = y0 * this.reso[0];
            let val0 = constr[line + x0];
            let v_step = (constr[line + x1] - val0) / nx;
            for (let i = 1; i < nx; ++i) {
                if (constr[line + x0 + i] === -1) {
                    constr[line + x0 + i] = val0 + i * v_step;
                    //this.computeFrontValAt(cx,cy,cz,x0+i,y0);
                }
            }
        }
        if (ny > 1) {
            // compute upper line
            let line = y1 * this.reso[0];
            let val0 = constr[line + x0];
            let v_step = (constr[line + x1] - val0) / nx;
            for (let i = 1; i < nx; ++i) {
                if (constr[line + x0 + i] === -1) {
                    constr[line + x0 + i] = val0 + i * v_step;
                    //this.computeFrontValAt(cx,cy,cz,x0+i,y1);
                }
            }
            for (let i = 0; i <= nx; ++i) {
                val0 = constr[y0 * this.reso[0] + x0 + i];
                v_step = (constr[y1 * this.reso[0] + x0 + i] - val0) / ny;
                for (let k = 1; k < ny; ++k) {
                    if (constr[(y0 + k) * this.reso[0] + x0 + i] === -1) {
                        constr[(y0 + k) * this.reso[0] + x0 + i] = val0 + k * v_step;
                    }
                }
            }
        }
    }
    /**
     *  Compute blobtree value at a given position in the front sliding array.
     *
     *  @param cx Coordinate x of bottom left corner of the front array
     *  @param cy Coordinate x of bottom left corner of the front array
     *  @param cz Coordinate x of bottom left corner of the front array
     *
     *  @param x X position in the array
     *  @param y Y position in the array
     *
     *  @private
     */
    computeFrontValAt(cx, cy, cz, x, y) {
        this.computeFrontValAtClosure(cx, cy, cz, x, y);
    }
    ;
    /**
     *  Function using closure to have static constiable. Wrapped in computeFrontValAt
     *  for profiling purpose.
     */
    computeFrontValAtClosure = (function () {
        const eval_res = { v: 0 };
        const p = new Vector3();
        return function (cx, cy, cz, x, y) {
            const self = this;
            const index = y * self.reso[0] + x;
            eval_res.v = self.blobtree.getNeutralValue();
            if (self.values_xy[1] === null)
                throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling computeFrontValAtClosure";
            if (self.values_xy[1][index] === -1) {
                p.set(cx + x * self.min_acc, cy + y * self.min_acc, cz);
                self.blobtree.value(p, eval_res);
                self.values_xy[1][index] = eval_res.v;
            }
        };
    })();
    /**
     *  Compute corner values in the front buffer in 2D box defined by min,max
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     *  @param min 2D box min
     *  @param max 2D box max
     */
    computeFrontValAtBoxCorners(cx, cy, cz, min, max) {
        this.computeFrontValAt(cx, cy, cz, min.x, min.y);
        this.computeFrontValAt(cx, cy, cz, min.x, max.y);
        this.computeFrontValAt(cx, cy, cz, max.x, min.y);
        this.computeFrontValAt(cx, cy, cz, max.x, max.y);
    }
    ;
    /**
     *  Compute all values in the front buffer in 2D box defined by min,max
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     *  @param min 2D box min
     *  @param max 2D box max
     */
    computeFrontValInBox(cx, cy, cz, min, max) {
        for (let xx = min.x; xx <= max.x; ++xx) {
            for (let yy = min.y; yy <= max.y; ++yy) {
                this.computeFrontValAt(cx, cy, cz, xx, yy);
            }
        }
    }
    ;
    /**
     *  Set all values in 2D box min,max at 0.
     *  @param min 2D box min
     *  @param max 2D box max
     */
    setFrontValZeroInBox(min, max) {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling setFrontValZeroInBox";
        for (let ix = min.x; ix <= max.x; ++ix) {
            for (let iy = min.y; iy <= max.y; ++iy) {
                this.values_xy[1][iy * this.reso[0] + ix] = 0;
            }
        }
    }
    ;
    /**
     *  Compute 2D mask of a given 2D box. Mask is an hex integer unique for each
     *  combination of iso value crossing (like in 3D marching cubes, but in 2D).
     *  @param min 2D box min
     *  @param max 2D box max
     *  @return The mask
     */
    computeBoxMask(min, max) {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling computeBoxMask";
        let mask = 0;
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
    }
    ;
    /**
     *  Return 0 if and only if all coners value of 2D box min,max are 0
     *  @param min 2D box min
     *  @param max 2D box max
     */
    checkZeroBox(min, max) {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling checkZeroBox";
        return (this.values_xy[1][min.y * this.reso[0] + min.x] +
            this.values_xy[1][min.y * this.reso[0] + max.x] +
            this.values_xy[1][max.y * this.reso[0] + max.x] +
            this.values_xy[1][max.y * this.reso[0] + min.x]);
    }
    ;
    /**
     *  Recursive function computing values in the given 2D box (which is a subbox
     *  of the whole front buffer), by cuting in 2 at each step. This function is
     *  "smart", since computed boxes are buid with their scalar field accuracy.
     *  Depending on the accuracy, scalar field values may be computed from the
     *  blobtree or interpolated (linear).
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     *  @param boxes2D 2D boxes intersecting box. Used to compute accuracy for split boxes.
     *  @param box The 2D box in which we compute values
     */
    recursiveBoxComputation(cx, cy, cz, box, boxes2D) {
        // split the current box in 2 boxes in the largest dimension
        let new_boxes = null;
        const diff = new Vector2(Math.round(box.max.x - box.min.x), Math.round(box.max.y - box.min.y));
        if (diff.x > 1 && diff.x >= diff.y) {
            // cut in x
            const x_cut = box.min.x + Math.floor(diff.x / 2);
            new_boxes = [
                new Box2Acc(box.min, new Vector2(x_cut, box.max.y), 10000, 10000),
                new Box2Acc(new Vector2(x_cut, box.min.y), box.max, 10000, 10000)
            ];
            this.computeFrontValAt(cx, cy, cz, x_cut, box.min.y);
            this.computeFrontValAt(cx, cy, cz, x_cut, box.max.y);
        }
        else {
            // cut in y
            if (diff.y > 1) {
                const y_cut = box.min.y + Math.floor(diff.y / 2);
                new_boxes = [
                    new Box2Acc(box.min, new Vector2(box.max.x, y_cut), 10000, 10000),
                    new Box2Acc(new Vector2(box.min.x, y_cut), box.max, 10000, 10000)
                ];
                this.computeFrontValAt(cx, cy, cz, box.min.x, y_cut);
                this.computeFrontValAt(cx, cy, cz, box.max.x, y_cut);
            }
            else {
                // the box is 1 in size, so we stop
                return;
            }
        }
        // Compute accuracies for each box
        const boxes2D_rec = [[], []];
        for (let i = 0; i < boxes2D.length; ++i) {
            for (let k = 0; k < new_boxes.length; ++k) {
                if (new_boxes[k].intersectsBox(boxes2D[i])) {
                    const new_box_nice_acc = new_boxes[k].getNiceAcc();
                    const new_box_raw_acc = new_boxes[k].getRawAcc();
                    const boxes2D_nice_acc = boxes2D[i].getNiceAcc();
                    if (new_box_nice_acc === null || new_box_raw_acc === null)
                        throw "[SlidingMarchingCubes] recursiveBoxComputation: new_box_nice_acc or new_box_raw_acc is null, this cannot happen here";
                    if (boxes2D_nice_acc === null)
                        throw "[SlidingMarchingCubes] recursiveBoxComputation: boxes2D_nice_acc is null, do not give empty boxes to this function.";
                    new_boxes[k].setRawAcc(Math.min(new_box_nice_acc, new_box_raw_acc));
                    new_boxes[k].setNiceAcc(Math.min(new_box_nice_acc, boxes2D_nice_acc));
                    boxes2D_rec[k].push(boxes2D[i]);
                }
            }
        }
        for (let k = 0; k < new_boxes.length; ++k) {
            let b = new_boxes[k];
            let bsize = b.getSize(new Vector2());
            if (boxes2D_rec[k].length === 0) {
                this.setFrontValZeroInBox(b.min, b.max);
            }
            else {
                const b_raw_acc = b.getRawAcc();
                const b_nice_acc = b.getNiceAcc();
                if (b_raw_acc === null || b_nice_acc === null)
                    throw "[SlidingMarchingCubes] recursiveBoxComputation: b_raw_acc or b_nice_acc is null, this cannot happen here";
                if (bsize.x <= b_raw_acc && bsize.y <= b_raw_acc) {
                    // We reach the raw level
                    let mask = this.computeBoxMask(b.min, b.max);
                    if (mask === 0xf || mask === 0x0) {
                        // all points are inside, since we reached raw, we can interpolate
                        // Note when all values are very close to 0, it's useless to interpolate, setting 0 can do.
                        this.interpolateInBox(cx, cy, cz, b.min.x, b.max.x, b.min.y, b.max.y);
                        // OR just compute all values.
                        // this.computeFrontValInBox(cx,cy,cz,b.min,b.max);
                    }
                    else {
                        //Surface is crossed, must go down to the nice
                        if (bsize.x <= b_nice_acc &&
                            bsize.y <= b_nice_acc) {
                            // We are under nice acc, just interpolate
                            this.interpolateInBox(cx, cy, cz, b.min.x, b.max.x, b.min.y, b.max.y);
                            // OR just compute all values.
                            // this.computeFrontValInBox(cx,cy,cz,b.min,b.max);
                        }
                        else {
                            this.recursiveBoxComputation(cx, cy, cz, b, boxes2D_rec[k]);
                            //console.log("going down in " + b.toString());
                        }
                    }
                }
                else {
                    // we did not reach the raw level, so we must cut again
                    this.recursiveBoxComputation(cx, cy, cz, b, boxes2D_rec[k]);
                }
            }
        }
    }
    ;
    /**
     *  Compute all values in the front buffer.
     *  @param cx X coordinate of the front buffer corner
     *  @param cy Y coordinate of the front buffer corner
     *  @param cz Z coordinate of the front buffer corner
     */
    computeFrontValues(cx, cy, cz) {
        this.setFrontToMinus();
        const areas = this.blobtree.getAreas();
        const bigbox = new Box2Acc();
        bigbox.makeEmpty();
        const boxes2D = [];
        for (let i = 0; i < areas.length; ++i) {
            const raw_acc = Math.round((areas[i].bv.getMinRawAcc() * this.detail_ratio) / this.min_acc);
            const nice_acc = Math.round((areas[i].bv.getMinAcc() * this.detail_ratio) / this.min_acc);
            const x_min = Math.max(0, Math.floor((areas[i].aabb.min.x - cx) / this.min_acc));
            const y_min = Math.max(0, Math.floor((areas[i].aabb.min.y - cy) / this.min_acc));
            const x_max = Math.min(this.reso[0] - 1, Math.ceil((areas[i].aabb.max.x - cx) / this.min_acc));
            const y_max = Math.min(this.reso[1] - 1, Math.ceil((areas[i].aabb.max.y - cy) / this.min_acc));
            boxes2D.push(new Box2Acc(new Vector2(x_min, y_min), new Vector2(x_max, y_max), nice_acc, raw_acc));
            bigbox.unionWithAcc(boxes2D[boxes2D.length - 1]);
        }
        bigbox.intersect(new Box2Acc(new Vector2(0, 0), new Vector2(this.reso[0], this.reso[1]), bigbox.getNiceAcc(), bigbox.getRawAcc()));
        this.computeFrontValAtBoxCorners(cx, cy, cz, bigbox.min, bigbox.max);
        this.recursiveBoxComputation(cx, cy, cz, bigbox, boxes2D);
        this.setFrontToZeroIfMinus();
    }
    ;
    /**
     *   get the min accuracy needed for this zone
     *   @param bbox the zone for which we want the minAcc
     *   @return the min acc for this zone
     */
    getMinAcc(bbox) {
        const areas = this.blobtree.getAreas();
        let minAcc = Number.MAX_VALUE;
        for (let i = 0; i < areas.length; i++) {
            const area = areas[i];
            if (area.aabb.intersectsBox(bbox)) {
                if (area.bv) {
                    // it's a new area, we can get the min acc
                    const areaMinAcc = area.bv.getMinAcc();
                    if (areaMinAcc < minAcc) {
                        minAcc = areaMinAcc;
                    }
                }
            }
        }
        return minAcc * this.detail_ratio;
    }
    ;
    /**
     *   get the max accuracy needed for this zone
     *   @param bbox the zone for which we want the minAcc
     *   @return the max acc for this zone
     */
    getMaxAcc(bbox) {
        const areas = this.blobtree.getAreas();
        let maxAcc = 0;
        for (let i = 0; i < areas.length; i++) {
            const area = areas[i];
            if (area.aabb.intersectsBox(bbox)) {
                if (area.bv) {
                    // it's a new area, we can get the min acc
                    const areaMaxAcc = area.bv.getMinAcc();
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
     *  @param o_aabb The aabb where to compute the surface, if null, the blobtree AABB will be used
     *  @param extended True if we want the agorithm to extend the computation zone
     *                            to ensure overlap with a mesh resulting from a computation
     *                            in a neighbouring aabb (Especially usefull for parallelism).
     */
    compute(o_aabb, extended) {
        this.initGeometry();
        const timer_begin = new Date().getTime();
        this.blobtree.prepareForEval();
        let aabb = null;
        if (o_aabb) {
            aabb = o_aabb.clone();
        }
        else {
            aabb = this.blobtree.getAABB();
        }
        this.extended = extended !== undefined ? extended : false;
        if (this.extended) {
            let adims = aabb.getSize(new Vector3());
            let minAcc = Math.min(Math.min(this.getMinAcc(aabb), adims.x), Math.min(adims.y, adims.z));
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
        const aabb_trim = [];
        const aabb_trim_parents = [];
        if (o_aabb) {
            this.blobtree.externalTrim(aabb, aabb_trim, aabb_trim_parents);
            this.blobtree.prepareForEval();
        }
        this.areas = this.blobtree.getAreas();
        // if no areas, blobtree is empty so stop and send an empty mesh.
        if (this.areas.length === 0) {
            this.progress(100);
            return this.buildResultingBufferGeometry();
        }
        this.min_acc = this.areas.length !== 0 ? this.areas[0].bv.getMinAcc() : 1;
        for (let i = 0; i < this.areas.length; ++i) {
            if (this.areas[i].bv.getMinAcc() < this.min_acc) {
                this.min_acc = this.areas[i].bv.getMinAcc();
            }
        }
        this.min_acc = this.min_acc * this.detail_ratio;
        const corner = aabb.min;
        const dims = aabb.getSize(new Vector3());
        this.steps.z = new Float32Array(Math.ceil(dims.z / this.min_acc) + 2);
        this.steps.z[0] = corner.z;
        let index = 1;
        const areas = this.blobtree.getAreas();
        while (this.steps.z[index - 1] < corner.z + dims.z) {
            let min_step = dims.z;
            // If uniformZ is true, we do not adapt z stepping to local slice accuracy.
            if (this.uniformZ) {
                min_step = this.min_acc;
            }
            else {
                // find minimum accuracy needed in this slice.
                for (let i = 0; i < areas.length; ++i) {
                    min_step = Math.min(min_step, areas[i].bv.getAxisProjectionMinStep("z", this.steps.z[index - 1]) * this.detail_ratio);
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
            let i = 0;
            this.dis_o_aabb.set(new Vector3(-1, -1, -1), new Vector3(-1, -1, -1));
            while (i < this.reso[2] && this.dis_o_aabb.min.z === -1) {
                if (this.steps.z[i] >= aabb.min.z) {
                    this.dis_o_aabb.min.z = i;
                }
                i++;
            }
            if (i > this.reso[2] - 1) {
                this.dis_o_aabb.min.z = this.reso[2] - 1;
            } // should never happen
            i = this.reso[2] - 1;
            while (i >= 0 && this.dis_o_aabb.max.z === -1) {
                if (this.steps.z[i] < aabb.max.z) {
                    this.dis_o_aabb.max.z = i;
                }
                i--;
            }
            if (i < 0) {
                this.dis_o_aabb.max.z = 0;
            } // should never happen
            this.dis_o_aabb.min.x = Math.round((aabb.min.x - aabb.min.x) / this.min_acc);
            this.dis_o_aabb.min.y = Math.round((aabb.min.y - aabb.min.y) / this.min_acc);
            this.dis_o_aabb.max.x =
                this.reso[0] -
                    2 -
                    Math.round((aabb.max.x - aabb.max.x) / this.min_acc);
            this.dis_o_aabb.max.y =
                this.reso[1] -
                    2 -
                    Math.round((aabb.max.y - aabb.max.y) / this.min_acc);
        }
        // Back values
        this.values_xy[0] = new Float32Array(this.reso[0] * this.reso[1]);
        // Front values
        this.values_xy[1] = new Float32Array(this.reso[0] * this.reso[1]);
        this.vertices_xy[0] = new Int32Array(this.reso[0] * this.reso[1]);
        this.vertices_xy[1] = new Int32Array(this.reso[0] * this.reso[1]);
        // Aabb for trimming the blobtree
        const trim_aabb = new Box3();
        this.computeFrontValues(corner.x, corner.y, corner.z);
        let percent = 0;
        for (let iz = 0; iz < this.reso[2] - 1; ++iz) {
            // Switch the 2 arrays, and fill the one in front
            let valuesSwitcher = this.values_xy[0];
            this.values_xy[0] = this.values_xy[1];
            this.values_xy[1] = valuesSwitcher;
            let verticesSwitcher = this.vertices_xy[0];
            this.vertices_xy[0] = this.vertices_xy[1];
            this.vertices_xy[1] = verticesSwitcher;
            const z1 = this.steps.z[iz + 1];
            trim_aabb.set(new Vector3(corner.x, corner.y, z1 - this.min_acc / 64), new Vector3(corner.x + this.reso[0] * this.min_acc, corner.y + this.reso[1] * this.min_acc, z1 + this.min_acc / 64));
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
            for (let iy = 0; iy < this.reso[1] - 1; ++iy) {
                for (let ix = 0; ix < this.reso[0] - 1; ++ix) {
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
        const timer_end = new Date().getTime();
        console.log("Sliding Marching Cubes computed in " + (timer_end - timer_begin) + "ms");
        // Clear memory, in case this object is kept alive
        this.values_xy[0] = null;
        this.values_xy[1] = null;
        this.vertices_xy[0] = null;
        this.vertices_xy[1] = null;
        this.progress(100);
        return this.buildResultingBufferGeometry();
    }
    ;
    /**
     *  Check values for cube at x, y. Ie get values front front and back arrays,
     *  compute marching cube mask, build the resulting vertex and faces if necessary.
     *  @param x
     *  @param y
     *  @param corner Bottom left corner of front array.
     */
    fetchAndTriangulate(x, y, z, corner) {
        if (this.values_xy[1] === null)
            throw "[SlidingMarchingCubes] values_xy[1] must be initialized before calling fetchAndTriangulate";
        if (this.values_xy[0] === null)
            throw "[SlidingMarchingCubes] values_xy[0] must be initialized before calling fetchAndTriangulate";
        if (this.vertices_xy[1] === null)
            throw "[SlidingMarchingCubes] vertices_xy[1] must be initialized before calling fetchAndTriangulate";
        if (this.geometry === null)
            throw "[SlidingMarchingCubes] geometry must be initialized before calling fetchAndTriangulate";
        const idx_y_0 = y * this.reso[0] + x;
        const idx_y_1 = (y + 1) * this.reso[0] + x;
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
    }
    ;
    /**
     *  Push 2 faces in direct order (right handed).
     *  @param v1 Index of vertex 1 in this.geometry
     *  @param v2 Index of vertex 2 in this.geometry
     *  @param v3 Index of vertex 3 in this.geometry
     *  @param v4 Index of vertex 4 in this.geometry
     */
    pushDirectFaces(v1, v2, v3, v4) {
        if (this.geometry === null)
            throw "[SlidingMarchingCubes] geometry must be initialized before calling pushDirectFaces";
        this.geometry.addFace(v1, v2, v3);
        this.geometry.addFace(v3, v4, v1);
    }
    ;
    /**
     *  Push 2 faces in undirect order (left handed).
     *  @param v1 Index of vertex 1 in this.geometry
     *  @param v2 Index of vertex 2 in this.geometry
     *  @param v3 Index of vertex 3 in this.geometry
     *  @param v4 Index of vertex 4 in this.geometry
     */
    pushUndirectFaces(v1, v2, v3, v4) {
        if (this.geometry === null)
            throw "[SlidingMarchingCubes] geometry must be initialized before calling pushUndirectFaces";
        this.geometry.addFace(v3, v2, v1);
        this.geometry.addFace(v1, v4, v3);
    }
    ;
    /**
     *  Compute and add faces depending on current cell crossing mask
     *  @param x Current cell x coordinate in the grid (integer)
     *  @param y Current cell y coordinate in the grid (integer)
     *  @param z Current cell z coordinate in the grid (integer)
     */
    triangulate(x, y, z) {
        if (this.vertices_xy[1] === null)
            throw "[SlidingMarchingCubes] vertices_xy[1] must be initialized before calling triangulate";
        if (this.vertices_xy[0] === null)
            throw "[SlidingMarchingCubes] vertices_xy[0] must be initialized before calling triangulate";
        let idx_y_0 = y * this.reso[0] + x;
        if (this.edge_cross[0] && y !== 0 && z !== 0) {
            // x edge is crossed
            // Check orientation
            let v1 = this.vertices_xy[1][idx_y_0];
            let v2 = this.vertices_xy[1][(y - 1) * this.reso[0] + x];
            let v3 = this.vertices_xy[0][(y - 1) * this.reso[0] + x];
            let v4 = this.vertices_xy[0][idx_y_0];
            if (this.minCurvOrient) {
                let switch_edge = !this._isMinCurvatureTriangulation(v1, v2, v3, v4);
                if (switch_edge) {
                    let tmp = v1;
                    v1 = v2;
                    v2 = v3;
                    v3 = v4;
                    v4 = tmp;
                }
            }
            if (this.mask & 0x1) {
                this.pushDirectFaces(v1, v2, v3, v4);
            }
            else {
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
            if (this.minCurvOrient) {
                let switch_edge = !this._isMinCurvatureTriangulation(v1, v2, v3, v4);
                if (switch_edge) {
                    let tmp = v1;
                    v1 = v2;
                    v2 = v3;
                    v3 = v4;
                    v4 = tmp;
                }
            }
            if (this.mask & 0x1) {
                this.pushDirectFaces(v1, v2, v3, v4);
            }
            else {
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
            if (this.minCurvOrient) {
                let switch_edge = !this._isMinCurvatureTriangulation(v1, v2, v3, v4);
                if (switch_edge) {
                    let tmp = v1;
                    v1 = v2;
                    v2 = v3;
                    v3 = v4;
                    v4 = tmp;
                }
            }
            if (this.mask & 0x1) {
                this.pushDirectFaces(v1, v2, v3, v4);
            }
            else {
                this.pushUndirectFaces(v1, v2, v3, v4);
            }
        }
    }
    ;
    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex = (function () {
        // Function static constiable
        const eval_res = {
            v: 0,
            g: new Vector3(0, 0, 0),
            m: new Material()
        };
        const conv_res = new Vector3();
        return function () {
            eval_res.v = this.blobtree.getNeutralValue();
            // Optimization note :
            //      Here I dont use tables but performances may be improved
            //      by using tables. See marching cube and surface net for examples
            // Average edge intersection
            let e_count = 0;
            this.vertex.set(0, 0, 0);
            //For every edge of the cube...
            for (let i = 0; i < 12; ++i) {
                // --> the following code does not seem to work. Tables.EdgeCross may be broken
                //Use edge mask to check if it is crossed
                // if(!(edge_mask & (1<<i))) {
                //     continue;
                // }
                //Now find the point of intersection
                const e0 = Tables.EdgeVMap[i][0]; //Unpack vertices
                const e1 = Tables.EdgeVMap[i][1];
                const p0 = Tables.VertexTopo[e0];
                const p1 = Tables.VertexTopo[e1];
                const g0 = this.values[e0]; //Unpack grid values
                const g1 = this.values[e1];
                // replace the mask check with that. Slower.
                this.edge_cross[i] =
                    g0 > this.blobtree.getIsoValue() !==
                        g1 > this.blobtree.getIsoValue();
                if (!this.edge_cross[i]) {
                    continue;
                }
                //If it did, increment number of edge crossings
                ++e_count;
                const d = g1 - g0;
                let t = 0; //Compute point of intersection
                if (Math.abs(d) > 1e-6) {
                    t = (this.blobtree.getIsoValue() - g0) / d;
                }
                else {
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
                Convergence.safeNewton3D(this.blobtree, // Scalar Field to eval
                this.vertex, // 3D point where we start, must comply to Vector3 API
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
        for (let i = 0; i < 8; ++i) {
            const s = this.values[i];
            this.mask |= s > this.blobtree.getIsoValue() ? 1 << i : 0;
        }
    }
}

/**
 *  This class will polygonize nodes independantly when they blend with a MaxNode or a RicciNode
 *  (for RicciNode, only if the coefficient of at least "ricciThreshold", threshold being a parameter).
 *  It will create a mesh made of several shells but intersections will be better looking than with some
 *  global polygonizers like MarchingCubes.
 */
class SplitMaxPolygonizer {
    blobtree;
    uniformRes = false;
    min_acc = null;
    minAccs = [];
    subPolygonizer = {
        className: "SlidingMarchingCubes",
        smcParams: {
            detailRatio: 1.0
        }
    };
    ricciThreshold = 64;
    progress = (_percent) => {
        //console.log(percent);
    };
    // Now we need to parse the blobtree and split it according to the different ways of
    // generating each groups.
    // Since we do not wantto alterate the original blobtree, for now we will use cloning.
    // (to be changed if it is too slow)
    subtrees = []; // Blobtrees created for primitives which must be generated with SMC
    progCoeff = []; // progress coefficient, mainly depends on the total number of primitives in the node.
    totalCoeff = 0;
    constructor(blobtree, smpParams) {
        const params = smpParams || {};
        this.blobtree = blobtree;
        if (params.uniformRes) {
            this.uniformRes = params.uniformRes;
        }
        if (params.subPolygonizer) {
            switch (params.subPolygonizer.className) {
                case "SlidingMarchingCubes":
                    this.subPolygonizer.className = "SlidingMarchingCubes";
                    this.subPolygonizer.smcParams = params.subPolygonizer.smcParams || {
                        detailRatio: 1.0
                    };
                    break;
                default:
                    console.error("Unknown polygonier class" + params.subPolygonizer.className);
                    break;
            }
        }
        if (params.ricciThreshold !== undefined) {
            this.ricciThreshold = params.ricciThreshold;
        }
        if (params.progress !== undefined) {
            this.progress = params.progress;
        }
        this.setBlobtree(blobtree);
    }
    setBlobtree(blobtree) {
        this.blobtree = blobtree;
        this.blobtree.prepareForEval();
        const getBlobtreeMinAcc = function (btree) {
            const areas = btree.getAreas();
            let min_acc = areas.length !== 0 ? areas[0].bv.getMinAcc() : null;
            for (let i = 0; i < areas.length; ++i) {
                if (areas[i].bv.getMinAcc() < (min_acc === null ? 0 : min_acc)) {
                    min_acc = areas[i].bv.getMinAcc();
                }
            }
            return min_acc;
        };
        this.min_acc = getBlobtreeMinAcc(this.blobtree);
        this.subtrees = [];
        this.progCoeff = [];
        this.totalCoeff = 0;
        const self = this;
        const addToSubtrees = function (n) {
            let subtree;
            if (n instanceof RootNode) {
                subtree = n.clone();
            }
            else {
                subtree = new RootNode();
                subtree.addChild(n.clone());
            }
            self.subtrees.push(subtree);
            subtree.prepareForEval();
            const subtreeMinAcc = getBlobtreeMinAcc(subtree);
            if (subtreeMinAcc === null)
                throw "[SplitMaxPolygonizer] setBlobTreee: subtree's minAcc is null when it shouldn't be.";
            self.minAccs.push(subtreeMinAcc);
            self.progCoeff.push(subtree.count(ScalisPoint) + subtree.count(ScalisSegment) + subtree.count(ScalisTriangle));
            self.totalCoeff += self.progCoeff[self.progCoeff.length - 1];
        };
        const recurse = function (n) {
            if (n instanceof RicciNode) {
                if (n.getRicciN() < self.ricciThreshold) {
                    // This node must be copied and generated using SMC
                    if (n.children.length !== 0) {
                        addToSubtrees(n);
                    }
                }
                else {
                    for (let i = 0; i < n.children.length; ++i) {
                        recurse(n.children[i]);
                    }
                }
            }
            else if (n instanceof MaxNode) {
                for (let i = 0; i < n.children.length; ++i) {
                    recurse(n.children[i]);
                }
            }
            else if (n instanceof ScalisPoint) {
                addToSubtrees(n);
            }
            else if (n instanceof ScalisSegment) {
                addToSubtrees(n);
            }
            else if (n instanceof ScalisTriangle) {
                addToSubtrees(n);
            }
            else {
                addToSubtrees(n);
            }
        };
        recurse(this.blobtree);
    }
    compute() {
        if (!this.blobtree.isValidAABB()) {
            this.setBlobtree(this.blobtree);
        }
        const self = this;
        this.progress(0);
        let prog = 0;
        const geometries = [];
        for (let i = 0; i < this.subtrees.length; ++i) {
            const prev_detailRatio = this.subPolygonizer.smcParams.detailRatio || 1.0;
            if (this.uniformRes && this.min_acc) {
                this.subPolygonizer.smcParams.detailRatio = prev_detailRatio * this.min_acc / this.minAccs[i];
            }
            this.subPolygonizer.smcParams.progress = function (percent) {
                self.progress(100 * (prog + (percent / 100) * self.progCoeff[i]) / self.totalCoeff);
            };
            let polygonizer = null;
            switch (this.subPolygonizer.className) {
                case "SlidingMarchingCubes":
                    polygonizer = new SlidingMarchingCubes(this.subtrees[i], this.subPolygonizer.smcParams);
            }
            if (polygonizer === null) {
                throw "[SplitMaxPolygonizer] compute: Unknown polygonizer class" + this.subPolygonizer.className;
            }
            geometries.push(polygonizer.compute());
            this.subPolygonizer.smcParams.detailRatio = prev_detailRatio;
            prog += this.progCoeff[i];
        }
        const res = BufferGeometryUtils.mergeBufferGeometries(geometries);
        this.progress(100);
        return res;
    }
    ;
}

/**
 *  A special SlidingMarchingCubes with a different function
 *  to compute vertex normal in a cell.
 *  In this polygnizer, we suppose the blobtree used for marching
 *  is not the complete blobtree and we want to use the normal from
 *  the complete blobtree.
 */
class SplitSMC extends SlidingMarchingCubes {
    metaBlobtree;
    constructor(blobtree, params) {
        super(blobtree, params);
        if (params.metaBlobtree) {
            this.metaBlobtree = params.metaBlobtree;
            this.metaBlobtree.prepareForEval();
        }
        else {
            throw "Error : SplitSMC needs a meta blobtree in params (from which normals will be computed).";
        }
    }
    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex = (function () {
        // Function static variable
        var eval_res = { v: 0, g: new Vector3(0, 0, 0), m: new Material() };
        var conv_res = new Vector3();
        return function () {
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
                var e0 = Tables.EdgeVMap[i][0]; //Unpack vertices
                var e1 = Tables.EdgeVMap[i][1];
                var p0 = Tables.VertexTopo[e0];
                var p1 = Tables.VertexTopo[e1];
                var g0 = self.values[e0]; //Unpack grid values
                var g1 = self.values[e1];
                // replace the mask check with that. Slower.
                self.edge_cross[i] = ((g0 > self.blobtree.getIsoValue()) !== (g1 > self.blobtree.getIsoValue()));
                if (!self.edge_cross[i]) {
                    continue;
                }
                //If it did, increment number of edge crossings
                ++e_count;
                var d = (g1 - g0);
                var t = 0; //Compute point of intersection
                if (Math.abs(d) > 1e-6) {
                    t = (self.blobtree.getIsoValue() - g0) / d;
                }
                else {
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
                Convergence.safeNewton3D(self.blobtree, // Scalar Field to eval
                self.vertex, // 3D point where we start, must comply to Vector3 API
                self.blobtree.getIsoValue(), // iso value we are looking for
                self.min_acc * self.convergence.ratio, // Geometrical limit to stop
                self.convergence.step, // limit of number of step
                self.min_acc, // Bounding volume inside which we look for the iso, getting out will make the process stop.
                conv_res // the resulting point
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

const version = "1.0.0";

export { Accuracies, Area, AreaCapsule, AreaScalisSeg, AreaScalisTri, AreaSphere, Convergence, DifferenceNode, DistanceFunctor, Element, Material, MaxNode, MinNode, Node, Poly6DistanceFunctor, Primitive, RicciNode, RootNode, SDFCapsule, SDFNode, SDFPoint, SDFPrimitive, SDFRootNode, SDFSegment, SDFSphere, ScaleNode, ScalisMath, ScalisPoint, ScalisPrimitive, ScalisSegment, ScalisTriangle, ScalisVertex, SlidingMarchingCubes, SplitMaxPolygonizer, SplitSMC, Tables, TriangleUtils, TwistNode, Types, version };
//# sourceMappingURL=three-js-blobtree.module.js.map

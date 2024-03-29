"use strict";

const THREE = require("three");
const Types = require("./Types.js");
const Node = require("./Node.js");
const Material = require("./Material.js");

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
class MinNode extends Node {

    static type = "MinNode";

    /**
     *
     * @param {MinNodeJSON} json
     * @returns {MinNode}
     */
    static fromJSON(json) {
        var res = new MinNode();
        for (var i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
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
        this.tmp_g = new THREE.Vector3();
        /** @type {Material} */
        this.tmp_m = new Material();

    }

    getType () {
        return MinNode.type;
    }

    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval () {
        if (!this.valid_aabb) {
            this.aabb = new THREE.Box3();  // Create empty BBox
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
            res.m.copy(Material.defaultMaterial);
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

Types.register(MinNode.type, MinNode);

module.exports = MinNode;

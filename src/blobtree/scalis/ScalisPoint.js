"use strict";

const THREE = require("three");
const Types = require("../Types.js");
const Material = require("../Material.js");
const ScalisPrimitive = require("./ScalisPrimitive.js");
const ScalisVertex = require("./ScalisVertex.js");
const ScalisMath = require("./ScalisMath.js");
const AreaSphere = require("../areas/AreaSphere.js");

// AreaScalisPoint is deprecated since the more genreal AreaSphere is now supposed to do the job.
// Uncomment if you see any difference.
// const AreaScalisPoint = require("../areas/deprecated/AreaScalisPoint.js");

/** @typedef {import('../Element.js')} Element */
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./ScalisVertex').ScalisVertexJSON} ScalisVertexJSON */

/**
 * @typedef {Object} ScalisPointJSON
 * @property {Array<ScalisVertexJSON>} v
 * @property {Array<Material>} materials
 * @property {string} volType
 * @property {number} density
 */

class ScalisPoint extends ScalisPrimitive  {

    static type = "ScalisPoint";

    /**
     * @param {ScalisPointJSON} json
     * @returns
     */
    static fromJSON(json) {
        var v = ScalisVertex.fromJSON(json.v[0]);
        var m = Material.fromJSON(json.materials[0]);
        return new ScalisPoint(v, json.volType, json.density, m);
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
        this.v_to_p = new THREE.Vector3();
    }

    getType() {
        return ScalisPoint.type;
    };

    toJSON() {
        var res = ScalisPrimitive.prototype.toJSON.call(this);
        res.density = this.density;
        return res;
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
                bv: new AreaSphere(this.v[0].getPos(), ScalisMath.KS * this.v[0].getThickness(), ScalisMath.KIS),
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
        var tmp = 1.0 - ScalisMath.KIS2 * r2;
        if (tmp > 0.0) {
            res.v = this.density * tmp * tmp * tmp * ScalisMath.Poly6NF0D;

            if (res.g) {
                // Gradient computation is easy since the
                // gradient is radial. We use the analitical solution
                // to directionnal gradient (differential in this.v_to_p length)
                var tmp2 = -this.density * ScalisMath.KIS2 * 6.0 * this.v_to_p.length() * tmp * tmp * ScalisMath.Poly6NF0D / (thickness * thickness);
                res.g.copy(this.v_to_p).normalize().multiplyScalar(tmp2);
            }
            if (res.m) { res.m.copy(this.materials[0]); }
        }
        else {
            res.v = 0.0;
            if (res.g) { res.g.set(0, 0, 0); }
            if (res.m) { res.m.copy(Material.defaultMaterial); }
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

Types.register(ScalisPoint.type, ScalisPoint);


module.exports = ScalisPoint;

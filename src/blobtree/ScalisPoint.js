"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const ScalisPrimitive = require("./ScalisPrimitive.js");
const ScalisVertex = require("./ScalisVertex.js");
const Material = require("./Material.js");
const EvalTags = require("./EvalTags.js");
const ScalisMath = require("./ScalisMath.js");
const AreaScalisPoint = require("./Areas/AreaScalisPoint.js");
const ScalisPointAcc = require("./accuracies/ScalisPointAcc.js");

/**
 *  A unique identifier for the ScalisPoint type.
 *  @const {string}
 */
var typeScalisPoint = "scalisPoint";

/**
 *  @constructor
 *  @extends ScalisPrimitive
 *
 *  @param {!ScalisVertex} vertex The vertex with point parameters.
 *  @param {string} volType The volume type wanted for this primitive.
 *                                Note : can only be ScalisPrimitive.DIST for now, since "convolution" does not make sens for a point.
 *  @param {number} density Implicit field density.
 *                          Gives afiner control of the created implicit field.
 *  @param {!Material} mat Material for the point
 */
var ScalisPoint = function(vertex, volType, density, mat) {
    ScalisPrimitive.call(this);

    this.v.push(vertex);

    this.volType     = ScalisPrimitive.DIST;
    this.density     = density;
    this.materials.push(mat);

    this.type        = typeScalisPoint;

    // Temporary for eval
    this.v_to_p =  new THREE.Vector3();
};

ScalisPoint.prototype = Object.create(ScalisPrimitive.prototype);
ScalisPoint.prototype.constructor = ScalisPoint;

ScalisPoint.type = typeScalisPoint;

ScalisPoint.prototype.toJSON = function() {
    var res = ScalisPrimitive.prototype.toJSON.call(this);
    res.density = this.density;
    return res;
};
ScalisPoint.fromJSON = function(json){
    var v = ScalisVertex.fromJSON(json.v[0]);
    var m = Material.fromJSON(json.materials[0]);
    return new ScalisPoint(v, json.volType, json.density, m);
};

/**
 *  @param {number} d New density to set
 */
ScalisPoint.prototype.setDensity = function(d) {
    this.density = d;
    this.invalidAABB();
};

/**
 *  @return {number} Current density
 */
ScalisPoint.prototype.getDensity = function() {
    return this.density;
};

/**
 *  Set material for this point
 *  @param {!Material} m
 */
ScalisPoint.prototype.setMaterial = function(m) {
    this.materials[0].copy(m);
    this.invalidAABB();
};

// [Abstract] see ScalisPrimitive.computeHelpVariables
ScalisPoint.prototype.computeHelpVariables = function() {
    this.computeAABB();
};

// [Abstract] see ScalisPrimitive.prepareForEval
ScalisPoint.prototype.prepareForEval = function() {
    var res = {del_obj:[], new_areas:[]};
    if(!this.valid_aabb)
    {
        this.computeHelpVariables();
        this.valid_aabb = true;
        res.new_areas = this.getAreas();
    }
    return res;
};

// [Abstract] see ScalisPrimitive.getArea
ScalisPoint.prototype.getAreas = function() {
    if(!this.valid_aabb) {
        throw "ERROR : Cannot get area of invalid primitive";
        return [];
    }else{
        return [{
            aabb:this.aabb,
            bv: new AreaScalisPoint(this.v[0].getPos(),this.v[0].getThickness()),
            obj: this
        }];
    }
};

// [Abstract] see ScalisPrimitive.heuristicStepWithin
ScalisPoint.prototype.heuristicStepWithin = function() {
    return this.v[0].getThickness() / 3;
};

// [Abstract] see ScalisPrimitive.value
ScalisPoint.prototype.value = function(p,req,res) {
    if(!this.valid_aabb){
        throw "Error : PrepareForEval should have been called";
    }

    var thickness = this.v[0].getThickness();

    // Eval itself
    this.v_to_p.subVectors(p,this.v[0].getPos());
    var r2 = this.v_to_p.lengthSq()/(thickness*thickness);
    var tmp = 1.0-ScalisMath.KIS2*r2;
    if(tmp > 0.0)
    {
        res.v = this.density*tmp*tmp*tmp*ScalisMath.Poly6NF0D;

        if(req & EvalTags.Grad)
        {
            // Gradient computation is easy since the
            // gradient is radial. We use the analitical solution
            // to directionnal gradient (differential in this.v_to_p length)
            var tmp2 = -this.density * thickness * ScalisMath.KIS2 * 6.0 *
                tmp * tmp * ScalisMath.Poly6NF0D/(thickness*thickness*thickness);
            res.g.set(tmp2*this.v_to_p.x,
                      tmp2*this.v_to_p.y,
                      tmp2*this.v_to_p.z);
        }
        if(req & EvalTags.Mat)  { res.m.copy(this.materials[0]); }
    }
    else
    {
        res.v = 0.0;
        if(req & EvalTags.Grad) { res.g.set(0,0,0); }
        if(req & EvalTags.Mat)  { res.m.copy(Material.defaultMaterial); }
    }

};

// [Abstract]
ScalisPoint.prototype.distanceTo = function(p) {
    // return distance point/segment
    // don't take thickness into account
    return p.distanceTo(this.v[0].getPos());
    // return p.distanceTo(this.v[0].getPos()) - this.v[0].getThickness();
};

module.exports = ScalisPoint;

"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("../Types.js");
const SDFNode = require("./SDFNode.js");
const EvalTags = require("../EvalTags.js");
const Material = require("../Material.js");

/**
 *  This class implements a SDF Root Node, which is basically a Signed Distance Field
 *  made of some noe combination, on which is applied a compact support function.
 *  For now SDF nodes do not have materials. A unique material is defined in the SDFRootNode.
 *
 *  @constructor
 *  @extends SDFNode
 *
 *  @param {DistanceFunctor} f The distance function to be applied to the distance field. It must
 *                            respect the Blobtree convention, which is : positive everywhere, with a finite support.
 *  @param {SDFNode} child The child containng the complete SDF. SDFRootNode can have only one child.
 */
var SDFRootNode = function (f, material, child) {

    SDFNode.call(this);

    this.f = f;

    this.material = material ? material.clone() : new Material(null, null, null);

    this.addChild(child);

    // Tmp vars to speed up computation (no reallocations)
    this.tmp_res = {v:0, g:new THREE.Vector3(0,0,0)};
};

SDFRootNode.prototype = Object.create( SDFNode.prototype );
SDFRootNode.prototype.constructor = SDFRootNode;

SDFRootNode.type = "SDFRootNode";
Types.register(SDFRootNode.type, SDFRootNode);

SDFRootNode.prototype.getType = function(){
    return SDFRootNode.type;
};

SDFRootNode.prototype.addChild = function(c){
    if(this.children.length === 0){
        SDFNode.prototype.addChild.call(this,c);
    }else{
        throw "Error : SDFRootNode can have only one child.";
    }
};

SDFRootNode.prototype.toJSON = function(){
    var res = SDFNode.prototype.toJSON.call(this);
    res.f = this.f.toJSON();

    return res;
};
SDFRootNode.fromJSON = function(json){
    var res = new SDFRootNode(Types.fromJSON(res.f), Types.fromJSON(json.children[0]));
    return res;
};

// [Abstract] see Node for a complete description
SDFRootNode.prototype.prepareForEval = function()
{
    if(!this.valid_aabb){
        this.aabb = new THREE.Box3();  // Create empty BBox
        for(var i=0; i<this.children.length; ++i){
            var c = this.children[i];
            c.prepareForEval();
            this.aabb.union(
                c.computeDistanceAABB(this.f.support())
            );     // new aabb is computed according to remaining children aabb
        }

        this.valid_aabb = true;
    }
};

// [Abstract] see ScalisPrimitive.getArea
SDFRootNode.prototype.getAreas = function() {
    if(!this.valid_aabb) {
        throw "ERROR : Cannot get area of invalid node";
    }else{
        return this.children[0].getAreas(this.f.support());
    }
};

// [Abstract] see Node for more details.
SDFRootNode.prototype.value = function(p,req,res)
{
    var tmp = this.tmp_res;

    // Init res
    res.v = 0;
    if(req & EvalTags.Mat)  {
        res.m.copy(Material.defaultMaterial);
    }if(req & EvalTags.Grad) {
        res.g.set(0,0,0);
    }else if (req & EvalTags.NextStep) {
        // that, is the max distance
        // we want a value that won't miss any 'min'
        res.step = 1000000000;
    }

    if(this.aabb.containsPoint(p)){
        this.children[0].value(p,req,tmp);

        res.v = this.f.value(tmp.v);
        if(req & EvalTags.Grad){
            res.g.copy(tmp.g).multiplyScalar(this.f.gradient(res.v))
        }
        if(req && EvalTags.Mat){
            res.m.copy(this.material);
        }
    }
    else if (req & EvalTags.NextStep) {
        // return distance to aabb such that next time we'll hit from within the aabbb
        res.step = this.aabb.distanceToPoint(p) + 0.3;
    }
};

module.exports = SDFRootNode;

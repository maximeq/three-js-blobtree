"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("./Types.js");
const Node = require("./Node.js");
const EvalTags = require("./EvalTags.js");
const Convergence = require("../utils/Convergence.js");
const Material = require("./Material.js");

/**
 *  This class implement a Min node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 *
 *  @param {Array.<Node>} children The children to add to this node. Just a convenient parameter, you can do it manually using addChild.
 */
var MinNode = function (children) {

    Node.call(this);

    this.type = MinNode.type;

    if(children){
        var self = this;
        children.forEach(function(c){
            self.addChild(c);
        });
    }

    // Tmp vars to speed up computation (no reallocations)
    this.tmp_res = {v:0, g:new THREE.Vector3(0,0,0), m:new Material(null, null, null)};
};

MinNode.prototype = Object.create( Node.prototype );
MinNode.prototype.constructor = MinNode;

MinNode.type = "MinNode";
Types.register(MinNode.type, MinNode);

MinNode.prototype.getType = function(){
    return MinNode.type;
};

MinNode.fromJSON = function(json){
    var res = new MinNode();
    for(var i=0; i<json.children.length; ++i){
        res.addChild(Types.fromJSON(json.children[i]));
    }
    return res;
};

// [Abstract] see Node for a complete description
MinNode.prototype.prepareForEval = function()
{
    if(!this.valid_aabb){
        this.aabb = new THREE.Box3();  // Create empty BBox
        for(var i=0; i<this.children.length; ++i){
            var c = this.children[i];
            c.prepareForEval();
            this.aabb.union(c.getAABB());     // new aabb is computed according to remaining children aabb
        }

        this.valid_aabb = true;
    }
};

// [Abstract] see Node for more details.
MinNode.prototype.value = function(p,req,res)
{
    // TODO : check that all bounding box of all children and subchildrens are valid
    //        This enable not to do it in prim and limit the number of assert call (and string built)

    var l = this.children.length;
    var tmp = this.tmp_res;

    // Init res
    res.v = 0;
    if(req & EvalTags.Mat)  {
        res.m.copy(Material.defaultMaterial);
    }if(req & EvalTags.Grad) {
        res.g.set(0,0,0);
    }else if (req & EvalTags.NextStep) {
        // that, is the max distance
        // we want a value that loose any 'min'
        res.step = 1000000000;
    }

    if(this.aabb.containsPoint(p) && l !== 0){
        res.v = Number.MAX_VALUE;
        for(var i=0; i<l; ++i)
        {
            this.children[i].value(p,req,tmp);
            this.countEval++;
            if(tmp.v < res.v){
                res.v = tmp.v;
                if(req & EvalTags.Grad) {
                    res.g.copy(tmp.g);
                }
                if(req & EvalTags.Mat){
                    res.m.copy(tmp.m);
                }
                // within primitive potential
                if (req & (EvalTags.NextStep | EvalTags.NextStepOrtho )){
                    throw "Not implemented";
                }
            }
            res.v = Math.min(res.v,tmp.v);
        }
    }
    else if (req & EvalTags.NextStep) {
        throw "Not implemented";
    }else{

    }

};

// Trim must be redefined for DifferenceNode since in this node we cannot trim one of the 2 nodes without trimming the other.
MinNode.prototype.trim = function(aabb, trimmed, parents)
{
    // Trim remaining nodes
    for (var i=0; i<this.children.length; i++) {
        this.children[i].trim(aabb,trimmed,parents);
    }
};

module.exports = MinNode;
"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("./Types.js");
const Node = require("./Node.js");
const Convergence = require("../utils/Convergence.js");
const Material = require("./Material.js");

/**
 *  This class implement a difference blending node.
 *  The scalar field of the second child of this node will be substracted to the first node field.
 *  The result is clamped to 0 to always keep a positive field value.
 *  @constructor
 *  @extends Node
 *  @param {!Node} node0 The first node
 *  @param {!Node} node1 The second node, its value will be substracted to the node 0 value.
 *  @param {number} alpha Power of the second field : the greater alpha the sharper the difference. Default is 1, must be > 1.
 */
var DifferenceNode = function (node0, node1, alpha) {

    Node.call(this);

    this.addChild(node0);
    this.addChild(node1)

    this.alpha = alpha || 1;

    // For now, this field value is clamped to 0
    this.clamped = 0.0;

    // Tmp vars to speed up computation (no reallocations)
    this.tmp_res0 = {v:0, g:new THREE.Vector3(0,0,0), m:new Material()};
    this.tmp_res1 = {v:0, g:new THREE.Vector3(0,0,0), m:new Material()};
    this.g0 = new THREE.Vector3();
    this.m0 = new Material();
    this.g1 = new THREE.Vector3();
    this.m1 = new Material();

    this.tmp_v_arr = new Float32Array(2);
    this.tmp_m_arr = [
        null,
        null
    ];


};

DifferenceNode.prototype = Object.create( Node.prototype );
DifferenceNode.prototype.constructor = DifferenceNode;

DifferenceNode.type = "DifferenceNode";
Types.register(DifferenceNode.type, DifferenceNode);

DifferenceNode.prototype.getAlpha = function(){
    return this.alpha;
};
DifferenceNode.prototype.setAlpha = function(alpha){
    if(this.alpha != alpha){
        this.alpha = alpha;
        this.invalidAABB();
    }
};

DifferenceNode.prototype.toJSON = function(){
    var res = Node.prototype.toJSON.call(this);
    res.alpha = this.alpha;
    return res;
};

DifferenceNode.fromJSON = function(json){
    var res = new DifferenceNode();
    this.children[0] = Types.fromJSON(json.children[0]);
    this.children[1] = Types.fromJSON(json.children[1]);
    return res;
};

// [Abstract] see Node for a complete description
DifferenceNode.prototype.prepareForEval = function()
{
    if(!this.valid_aabb){
        this.children[0].prepareForEval();
        this.children[1].prepareForEval();
        // Bounding box of this node is the same as the one of the positive children,
        // Since negative values will be clamped to 0.
        this.aabb.copy(this.children[0].getAABB());

        this.valid_aabb = true;
    }
};

// [Abstract] see Node for more details.
DifferenceNode.prototype.value = function(p,res)
{
    var l = this.children.length;
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
    if(res.m)  {
        res.m.copy(Material.defaultMaterial);
        tmp1.m.copy(Material.defaultMaterial);
        tmp0.m.copy(Material.defaultMaterial);
    }if(res.g) {
        res.g.set(0,0,0);
        tmp1.g.set(0,0,0);
        tmp0.g.set(0,0,0);
    }else if (res.step !== undefined) {
        // that, is the max distance
        // we want a value that loose any 'min'
        res.step = 1000000000;
    }

    if(this.aabb.containsPoint(p)){
        if( this.children[0].aabb.containsPoint(p) ) {
            this.children[0].value(p,tmp0);
            if( this.children[1].aabb.containsPoint(p) ) {
                this.children[1].value(p,tmp1);
            }
            if( tmp1.v === 0 ){
                res.v = tmp0.v;
                if(res.g){
                    res.g.copy(tmp0.g);
                }
                if(res.m){
                    res.m.copy(tmp0.m);
                }
            }else{
                var v_pow = Math.pow(tmp1.v,this.alpha);
                res.v = Math.max(this.clamped,tmp0.v - tmp1.v*Math.pow(tmp1.v,this.alpha-1.0));
                if(res.g){
                    if(res.v === this.clamped){
                        res.g.set(0,0,0);
                    }else{
                        tmp1.g.multiplyScalar(v_pow);
                        res.g.subVectors(tmp0.g, tmp1.g);
                    }
                }
                if(res.m){
                    v_arr[0] = tmp0.v;
                    v_arr[1] = tmp1.v;
                    m_arr[0] = tmp0.m;
                    m_arr[1] = tmp1.m;
                    res.m.weightedMean(m_arr,v_arr,2);
                }
            }
        }
    }
    else if (res.step !== undefined) {
        // return distance to aabb such that next time we'll hit from within the aabbb
        res.step = this.aabb.distanceToPoint(p) + 0.3;
    }
};

// Trim must be redefined for DifferenceNode since in this node we cannot trim one of the 2 nodes without trimming the other.
DifferenceNode.prototype.trim = function(aabb, trimmed, parents)
{
    // Trim remaining nodes
    for (var i=0; i<this.children.length; i++) {
        this.children[i].trim(aabb,trimmed,parents);
    }
};

module.exports = DifferenceNode;

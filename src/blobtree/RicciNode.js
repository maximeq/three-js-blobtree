"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("./Types.js");
const Node = require("./Node.js");
const EvalTags = require("./EvalTags.js");
const Convergence = require("../utils/Convergence.js");
const Material = require("./Material.js");

/**
 *  This class implement a n-ary blend node which use a Ricci Blend.
 *  Ricci blend is : v = k-root( Sum(c.value^k) ) for all c in node children.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 *
 *  @param {number} ricci_n The value for ricci
 *  @param {Array.<Node>} children The children to add to this node. Just a convenient parameter, you can do it manually using addChild
 */
var RicciNode = function (ricci_n, children) {

    Node.call(this);

    this.type = RicciNode.type;

    this.ricci_n = ricci_n;

    if(children){
        var self = this;
        children.forEach(function(c){
            self.addChild(c);
        });
    }

    // Tmp vars to speed up computation (no reallocations)
    this.tmp_res = {v:0, g:new THREE.Vector3(0,0,0), m:new Material(null, null, null)};
    this.tmp_v_arr = new Float32Array(0);
    this.tmp_m_arr = new Array(0);
};

RicciNode.prototype = Object.create( Node.prototype );
RicciNode.prototype.constructor = RicciNode;

RicciNode.type = "RicciNode";
Types.register(RicciNode.type, RicciNode);

RicciNode.prototype.getType = function(){
    return RicciNode.type;
};

RicciNode.prototype.toJSON = function(){
    var res = Node.prototype.toJSON.call(this);
    res.ricci = this.ricci_n;

    return res;
};
RicciNode.fromJSON = function(json){
    var res = new RicciNode(json.ricci);
    for(var i=0; i<json.children.length; ++i){
        res.addChild(Types.fromJSON(json.children[i]));
    }
    return res;
};

// [Abstract] see Node for a complete description
RicciNode.prototype.prepareForEval = function()
{
    if(!this.valid_aabb){
        this.aabb = new THREE.Box3();  // Create empty BBox
        for(var i=0; i<this.children.length; ++i){
            var c = this.children[i];
            c.prepareForEval();
            this.aabb.union(c.getAABB());     // new aabb is computed according to remaining children aabb
        }

        this.valid_aabb = true;

        // Prepare tmp arrays
        if(this.tmp_v_arr.length<this.children.length){
            this.tmp_v_arr = new Float32Array(this.children.length*2);
            this.tmp_m_arr.length = this.children.length*2;
            for(var i=0; i<this.tmp_m_arr.length; ++i){
                this.tmp_m_arr[i] = new Material(null, 0, 0);
            }
        }
    }
};

// [Abstract] see Node for more details.
RicciNode.prototype.value = function(p,req,res)
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
        // arrays used for material mean
        var v_arr = this.tmp_v_arr;
        var m_arr = this.tmp_m_arr;
        var mv_arr_n = 0;

        // tmp var to compute the powered sum before the n-root
        // Kept for gradient computation
        var res_vv = 0;
        for(var i=0; i<l; ++i)
        {
            if( this.children[i].aabb.containsPoint(p) ) {

                this.children[i].value(p,req,tmp);
                this.countEval++;
                if(tmp.v > 0) // actually just !=0 should be enough but for stability reason...
                {
                    var v_pow = Math.pow(tmp.v,this.ricci_n-1.0);
                    res_vv += tmp.v*v_pow;

                    // gradient if needed
                    if(req & EvalTags.Grad) {
                        tmp.g.multiplyScalar(v_pow);
                        res.g.add(tmp.g);
                    }
                    // material if needed
                    if(req & EvalTags.Mat){
                        v_arr[mv_arr_n] = tmp.v*v_pow;
                        m_arr[mv_arr_n].copy(tmp.m);
                        mv_arr_n++;
                    }
                    // within primitive potential
                    if (req & (EvalTags.NextStep | EvalTags.NextStepOrtho )){
                        // we have to compute next step or nextStep z
                        res.step=Math.min(res.step,
                                          this.children[i].heuristicStepWithin());
                    }

                }
                // outside of the potential for this box, but within the box
                else {
                    this.countEval0++;
                    if (req & EvalTags.NextStep) {
                        res.step=Math.min(res.step,
                                          this.children[i].distanceTo(p));
                    }

                }
            }
            else if (req & EvalTags.NextStep) {
                res.step=Math.min(res.step,
                                  this.children[i].distanceTo(p));
            }
            else if (req & EvalTags.NextStepOrtho) {
                // outside of aabb
                // lower bound of the distance to the beginning of the aabb
                var lowerBoundDistWall;
                if (req & EvalTags.NextStepZ)
                    lowerBoundDistWall = this.children[i].aabb.min.z-p.z;
                else if (req & EvalTags.NextStepY)
                    lowerBoundDistWall = this.children[i].aabb.min.y-p.y;
                else if (req & EvalTags.NextStepX)
                    lowerBoundDistWall = this.children[i].aabb.min.x-p.x;
                // if negative, given that we're out of aabb, we know we'll never be inside
                // let's no consider it then, discarded with res.step
                if (lowerBoundDistWall > 0)
                {
                    res.step=Math.min(res.step,
                                      lowerBoundDistWall);
                    // lowerBoundDistWall+0.00001);
                }
            }
        }

        // compute final result using ricci power function
        res.v = Math.pow(res_vv, 1/this.ricci_n);

        if(res.v !== 0){
            if(req & EvalTags.Grad){
                res.g.multiplyScalar(res.v/res_vv);
            }
            if(req & EvalTags.Mat){
                res.m.weightedMean(m_arr,v_arr,mv_arr_n);
            }
        }
        // else the default values should be OK.
    }
    else if (req & EvalTags.NextStep) {
        // return distance to aabb such that next time we'll hit from within the aabbb
        res.step = this.aabb.distanceToPoint(p) + 0.3;
    }

};

RicciNode.prototype.setRicciN = function(n)
{
    if(this.ricci_n != n){
        this.ricci_n = n;
        this.invalidAABB();
    }
};

module.exports = RicciNode;

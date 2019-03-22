"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("./Types.js");
const Node = require("./Node.js");
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

    this.ricci_n = ricci_n;

    if(children){
        var self = this;
        children.forEach(function(c){
            self.addChild(c);
        });
    }

    // Tmp vars to speed up computation (no reallocations)
    this.tmp_v_arr = new Float32Array(0);
    this.tmp_m_arr = new Array(0);

    // temp vars to speed up evaluation by avoiding allocations
    this.tmp_res = {v:0,g:null,m:null};
    this.tmp_g = new THREE.Vector3();
    this.tmp_m = new Material();
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
                this.tmp_m_arr[i] = new Material({roughness:0, metalness:0});
            }
        }
    }
};

// [Abstract] see Node for more details.
RicciNode.prototype.value = function(p,res)
{
    // TODO : check that all bounding box of all children and subchildrens are valid
    //        This enable not to do it in prim and limit the number of assert call (and string built)
    var l = this.children.length;
    var tmp = this.tmp_res;
    tmp.g = res.g ? this.tmp_g : null;
    tmp.m = res.m ? this.tmp_m : null;

    // Init res
    res.v = 0;
    if(res.m)  {
        res.m.copy(Material.defaultMaterial);
    }if(res.g) {
        res.g.set(0,0,0);
    }else if (res.step !== undefined) {
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

                this.children[i].value(p,tmp);
                if(tmp.v > 0) // actually just !=0 should be enough but for stability reason...
                {
                    var v_pow = Math.pow(tmp.v,this.ricci_n-1.0);
                    res_vv += tmp.v*v_pow;

                    // gradient if needed
                    if(res.g) {
                        tmp.g.multiplyScalar(v_pow);
                        res.g.add(tmp.g);
                    }
                    // material if needed
                    if(res.m){
                        v_arr[mv_arr_n] = tmp.v*v_pow;
                        m_arr[mv_arr_n].copy(tmp.m);
                        mv_arr_n++;
                    }
                    // within primitive potential
                    if (res.step || res.stepOrtho){
                        // we have to compute next step or nextStep z
                        res.step=Math.min(res.step,this.children[i].heuristicStepWithin());
                    }

                }
                // outside of the potential for this box, but within the box
                else {
                    if (res.step !== undefined) {
                        res.step=Math.min(res.step,
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
        res.v = Math.pow(res_vv, 1/this.ricci_n);

        if(res.v !== 0){
            if(res.g){
                res.g.multiplyScalar(res.v/res_vv);
            }
            if(res.m){
                res.m.weightedMean(m_arr,v_arr,mv_arr_n);
            }
        }
        // else the default values should be OK.
    }else if (res.step !== undefined) {
        if(this.children.length !== 0){
            var add = this.children[0].heuristicStepWithin();
            for(var i=1; i<this.children.length; ++i){
                add = Math.min(add,this.children[i].heuristicStepWithin());
            }
            // return distance to aabb such that next time we'll hit from within the aabbb
            res.step = this.aabb.distanceToPoint(p) + add;
        }
    }

    if(res.stepOrtho !== undefined){
        res.stepOrtho = res.step;
    }
};

RicciNode.prototype.setRicciN = function(n)
{
    if(this.ricci_n != n){
        this.ricci_n = n;
        this.invalidAABB();
    }
};
RicciNode.prototype.getRicciN = function(){
    return this.ricci_n;
};

module.exports = RicciNode;

"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Node = require("./Node.js");
const EvalTags = require("./EvalTags.js");
const Convergence = require("../utils/Convergence.js");
const Material = require("./Material.js");

/**
 *  @type {string}
 */
var ricciNodeType = "blobtreeRicciNode";

/**
 *  This class implement a n-ary blend node which use a Ricci Blend.
 *  Ricci blend is : v = k-root( Sum(c.value^k) ) for all c in node children.
 *  @constructor
 *  @extends Node
 *
 *  @param {number} ricci_n The value for ricci
 */
var RicciNode = function (ricci_n) {

    Node.call(this);

    this.type = ricciNodeType;

    this.ricci_n = ricci_n;

    // Tmp vars to speed up computation (no reallocations)
    this.tmp_res = {v:0, g:new THREE.Vector3(0,0,0), m:new Material(null, null, null)};
    this.tmp_v_arr = new Float32Array(0);
    this.tmp_m_arr = new Array(0);

    this.blobBoundingSphere = new THREE.Sphere();
};

RicciNode.prototype = Object.create( Node.prototype );
RicciNode.prototype.constructor = RicciNode;

RicciNode.type = ricciNodeType;

RicciNode.prototype.toJSON = function(){
    var res = Node.prototype.toJSON.call(this);
    res.ricci = this.ricci_n;

    return res;
};

// see JSONLoader
// RicciNode.fromJSON = function(json)


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
    if(req & EvalTags.Mat)  {  res.m.copy(Material.defaultMaterial); }
    if(req & EvalTags.Grad) { res.g.set(0,0,0);                            }

    else if (req & EvalTags.NextStep) {
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

/**
 *  @param {!{origin:THREE.Vector3,direction:THREE.Vector3}} ray Ray to cast ofor which intersection is seeked.
 *                      Must be defiuned as {
 *                          origin: point as a THREE.Vector3,
 *                          direction: vector as a THREE.Vector3 (will be normalized before marching)
 *                      }
 *  @param {number} res The result of the intersection as : {
 *                          distance: distance from ray.origin to intersection point,
 *                          point: intersection point
 *                      }
 *  @param {number} maxDistance If the intersection is not located at a distance
 *                              lower than maxDistance, it will not be considered.
 *                              The smaller this is, the faster the casting will be.
 *  @param {number} precision Distance to the intersection under which we will
 *                            consider to be on the intersection point.
 *
 *  @return {boolean} True if an intersection has been found.
 */
RicciNode.prototype.intersectRayBlob = function(iso_value)
{
// curpos and marching vector are only instanciated once,
// we are using closure method
    var curPos = new THREE.Vector3();
    var marchingVector = new THREE.Vector3();
    var currentStep = new THREE.Vector3();
    var tmp_res = {
        g : new THREE.Vector3()
    };
    var conv_res = {
        p : new THREE.Vector3(),
        g : new THREE.Vector3(),
        p_absc : 0.0
    };
    var previousStepLength=0;
    var previousValue=0; // used for linear interp for a better guess
    var dist=0;
    var previousDist=0;

    return function(ray,res,maxDistance,precision) {
        curPos.copy(ray.origin);
        marchingVector.copy(ray.direction);

        marchingVector.normalize();
        dist=0;
        // compute first value to have next step length
        this.value(
            curPos,
            EvalTags.Value | EvalTags.NextStep,
            tmp_res);

        // march
        while ((tmp_res.v < iso_value) && (dist < maxDistance))
        {
            curPos.add(
                currentStep.copy(marchingVector).multiplyScalar(tmp_res.step)
            );
            dist+=tmp_res.step;

            previousStepLength=tmp_res.step;
            previousValue = tmp_res.v;

            this.value(
                curPos,
                EvalTags.Value | EvalTags.NextStep,
                tmp_res);
        }
        if (tmp_res.v >= iso_value)
        {
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

            Convergence.safeNewton1D(
                                        this,
                                        curPos,
                                        marchingVector.multiplyScalar(-1.0),
                                        0.0,
                                        previousStepLength,
                                        previousStepLength*(iso_value-tmp_res.v)/(previousValue-tmp_res.v), // linear approx of the first position
                                        iso_value,
                                        previousStepLength/512.0, //deltaPix*(dist-previousStepLength), // should be the size of a pixel at the previous curPos BROKEN?
                                        10,
                                        conv_res
                                        );
            res.distance = dist -conv_res.absc;

            res.point = conv_res.p.clone();

            // test wether the caller wanted to compute the gradient
            // (we assume that if res.g is defined, it's a request)
            if (res.g)
            {
                res.g.copy(conv_res.g);
            }

            return true;
        }
        else
        {
            // no intersection
            return false;
        }
    };
}();


/**
 *  Kaiser function for some intersaction and raycasting...
 *  What is it? Casting a ray only in 1 axis dimension?
 */
RicciNode.prototype.intersectOrthoRayBlob = function() {
// curpos and marching vector are only instanciated once,
// we are using closure method
    var curPos = new THREE.Vector3();
    var resumePos = new THREE.Vector3();
    var tmp_res = {};
    var dicho_res = {};
    dicho_res.g = new THREE.Vector3();
    var previousStepLength=0;
    var previousDist=0;
    // to ensure that we're within the aabb
    var epsilon = 0.0000001;
    var within = -1;
    return function(wOffset,hOffset,res,dim) {

        if (dim.axis & EvalTags.NextStepZ) {
            curPos.set(this.aabb.min.x+wOffset,
                       this.aabb.min.y+hOffset,
                       this.aabb.min.z+epsilon);
        }
        else if (dim.axis & EvalTags.NextStepY) {
            curPos.set(this.aabb.min.x+wOffset,
                       this.aabb.min.y+epsilon,
                       this.aabb.min.z+hOffset);
        }
        else if (dim.axis & EvalTags.NextStepX) {
            curPos.set(this.aabb.min.x+epsilon,
                       this.aabb.min.y+wOffset,
                       this.aabb.min.z+hOffset);
        }

        // max depth step we can do (has to be set)
        tmp_res.step= dim.get(this.aabb.max) - dim.get(this.aabb.min);

        this.value(
            curPos,
            EvalTags.Value | dim.axis,
            tmp_res);

        previousStepLength=epsilon;

        within=-1;

        // we're looking for all intersection, we won't stop before that
        while(dim.get(curPos) < dim.get(this.aabb.max))
        {
            // march
            // the '=0' case is important, otherwise there's an infinite loop
            while (((tmp_res.v - 1) * within >= 0) && (dim.get(curPos) < dim.get(this.aabb.max)))
            {
                // orthographic march
                // our tmp_res.step is valid as we know it's within the aabb
                dim.add(curPos,tmp_res.step);

                previousStepLength=tmp_res.step;

                // max depth step we can do (has to be set)
                tmp_res.step=dim.get(this.aabb.max)-dim.get(curPos);
                this.value(
                    curPos,
                    EvalTags.Value | dim.axis,
                    tmp_res);
            }
            // either a sign difference or we're out
            if(dim.get(curPos) < dim.get(this.aabb.max))
            {
                // we ain't out, so it was a sign difference
                within *= -1;
                // keep track of our current position in order to resume marching later
                resumePos.copy(curPos);
                previousDist=dim.get(curPos);

                // compute intersection
                // dichotomia: first step is going back half of the previous distance
                previousStepLength /= 2;

                dim.add(curPos,-previousStepLength);

                // we use dicho_res instead of tmp_res because we need
                // to keep track of previous results in order to resume later

                // dynamic number of dichotomia step
                while(previousStepLength>0.1)
                {
                    previousDist=dim.get(curPos);
                    previousStepLength/=2;
                    // not asking for the next step, which is always half of previous
                    this.value(
                        curPos,
                        EvalTags.Value,
                        dicho_res);

                    if ((dicho_res.v - 1) * within < 0)
                        // forward
                        dim.add(curPos,previousStepLength);
                    else
                        // backward
                        dim.add(curPos,-previousStepLength);
                }
                // linear interpolation with previous dist
                dim.add(curPos,previousDist);
                dim.divide(curPos,2);
                // get the gradient
                this.value(curPos,
                           EvalTags.Grad,
                           dicho_res);
                res.push({
                    point : curPos.clone(),
                    gradient : dicho_res.g.clone()
                    // point : curPos
                });
                // set variable in order to resume to where we were
                curPos.copy(resumePos);
            }
        }
    };
}();

module.exports = RicciNode;

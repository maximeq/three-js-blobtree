"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("./Types.js");
const RicciNode = require("./RicciNode.js");

const Convergence = require("../utils/Convergence");

/**
 *  The root of any implicit blobtree. Does behave computationaly like a RicciNode with n = 64.
 *  The RootNode is the only node to be its own parent.
 *  @constructor
 *  @extends RicciNode
 */
var RootNode = function() {
    // Default RootNode is a riccinode with ricci_n = 64 (almost a max)
    RicciNode.call(this, 64);

    this.valid_aabb = true;

    // Default iso value, value where the surface is present
    this.iso_value = 1.0;

    // Set some nodes as "trimmed", so they are not evaluated.
    this.trimmed = [];
    this.trim_parents = [];

};

RootNode.prototype = Object.create(RicciNode.prototype);
RootNode.prototype.constructor = RootNode;

RootNode.type = "RootNode";
Types.register(RootNode.type, RootNode);

RootNode.prototype.getType = function(){
    return RootNode.type;
};

RootNode.prototype.toJSON = function(){
    var res = RicciNode.prototype.toJSON.call(this);
    res.iso = this.iso_value;
    return res;
};
RootNode.fromJSON = function(json){
    var res = new RootNode(json.ricci);
    for(var i=0; i<json.children.length; ++i){
        res.addChild(Types.fromJSON(json.children[i]));
    }
    return res;
};

RootNode.prototype.getIsoValue = function() {
    return this.iso_value;
};
RootNode.prototype.setIsoValue = function(v) {
    this.iso_value = v;
};
/**
 *  @return {number} The neutral value of this tree, ie the value of the field in empty region of space.
 *                   This is an API for external use and future development. For now it is hard set to 0.
 */
RootNode.prototype.getNeutralValue = function() {
    return 0;
};

// [Abstract] see Node.invalidAABB
RootNode.prototype.invalidAABB = function() {
    this.valid_aabb = false;
};

/**
 *  Basically perform a trim but keep track of trimmed elements.
 *  This is usefull if you want to trim, then untrim, then trim, etc...
 *  For example, this is very useful for evaluation optim
 *  @param {THREE.Box3} aabb
 */
RootNode.prototype.internalTrim = function(aabb)
{
    if( !(this.trimmed.length === 0 && this.trim_parents.length === 0) ){
        throw "Error : you should not call internal trim if you have not untrimmed before. Call untrim or use externalTrim";
    }
    this.trim(aabb, this.trimmed, this.trim_parents);
};

/**
 *  Wrapper for trim, will help programmers to make the difference between
 *  internal and external trim.
 *  @param {THREE.Box3} aabb
 *  @param {Array.<Element>} trimmed Array of trimmed Elements
 *  @param {Array.<Node>} parents Array of fathers from which each trimmed element has been removed.
 */
RootNode.prototype.externalTrim = function(aabb, trimmed, parents){
    this.trim(aabb, trimmed, parents);
};

/**
 *  Reset the full blobtree
 */
RootNode.prototype.internalUntrim = function(){
    this.untrim(this.trimmed, this.trim_parents);
    this.trimmed.length = 0;
    this.trim_parents.length = 0;
};

/**
 *  Reset the full blobtree given previous trimming data.
 *  Note : don't forget to recall prepareForEval if you want to perform evaluation.
 *  @param {Array.<Element>} trimmed Array of trimmed Elements
 *  @param {Array.<Node>} parents Array of fathers from which each trimmed element has been removed.
 */
RootNode.prototype.untrim = function(trimmed, parents){
    if( !(trimmed.length === parents.length) ){
        throw "Error : trimmed and parents arrays should have the same length";
    }
    for(var i=0; i<trimmed.length; ++i){
        parents[i].addChild(trimmed[i]);
    }
};

/**
 *  Tell if the blobtree is empty
 *  @return true if blobtree is empty
 */
RootNode.prototype.isEmpty = function(){
    return this.children.length == 0;
};

/**
 *  @param {!THREE.Ray} ray Ray to cast for which intersection is seeked.
 *
 *  @param {Object} res The result of the intersection
 *  @param {number} res.distance distance from ray.origin to intersection point,
 *  @param {THREE.Vector3} res.point: intersection point,
 *  @param {THREE.Vector3} res.g: gradient at intersection, if required.
 *
 *  @param {number} maxDistance If the intersection is not located at a distance
 *                              lower than maxDistance, it will not be considered.
 *                              The smaller this is, the faster the casting will be.
 *  @param {number} precision Distance to the intersection under which we will
 *                            consider to be on the intersection point.
 *
 *  @return {boolean} True if an intersection has been found.
 */
RootNode.prototype.intersectRayBlob = function()
{
    var curPos = new THREE.Vector3();
    var marchingVector = new THREE.Vector3();
    var currentStep = new THREE.Vector3();

    var g = new THREE.Vector3();
    var tmp_res = {
        v:0,
        g : g,
        step:0
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
        tmp_res.g = null;
        this.value(
            curPos,
            tmp_res);

        // march
        while ((tmp_res.v < this.iso_value) && (dist < maxDistance))
        {
            curPos.add(
                currentStep.copy(marchingVector).multiplyScalar(tmp_res.step)
            );
            dist+=tmp_res.step;

            previousStepLength=tmp_res.step;
            previousValue = tmp_res.v;

            this.value(
                curPos,
                tmp_res);
        }
        if (tmp_res.v >= this.iso_value)
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
                                        previousStepLength*(this.iso_value-tmp_res.v)/(previousValue-tmp_res.v), // linear approx of the first position
                                        this.iso_value,
                                        previousStepLength/512.0, //deltaPix*(dist-previousStepLength), // should be the size of a pixel at the previous curPos BROKEN?
                                        10,
                                        conv_res
                                        );
            res.distance = dist-conv_res.p_absc;

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
 *  Kaiser function for some intersection and raycasting...
 *  Undocumented.
 *  TODO : check, it is probably an optimized intersection for blob intersection
 *         in X, Y or Z directions.
 */
RootNode.prototype.intersectOrthoRayBlob = function() {
// curpos and marching vector are only instanciated once,
// we are using closure method
    var curPos = new THREE.Vector3();
    var resumePos = new THREE.Vector3();
    var tmp_res = {step:0};
    var g = new THREE.Vector3();
    var dicho_res = {};
    var previousStepLength=0;
    var previousDist=0;
    // to ensure that we're within the aabb
    var epsilon = 0.0000001;
    var within = -1;
    return function(wOffset,hOffset,res,dim) {

        if (dim.axis.z) {
            curPos.set(this.aabb.min.x+wOffset,
                       this.aabb.min.y+hOffset,
                       this.aabb.min.z+epsilon);
        }
        else if (dim.axis.y) {
            curPos.set(this.aabb.min.x+wOffset,
                       this.aabb.min.y+epsilon,
                       this.aabb.min.z+hOffset);
        }
        else if (dim.axis.z) {
            curPos.set(this.aabb.min.x+epsilon,
                       this.aabb.min.y+wOffset,
                       this.aabb.min.z+hOffset);
        }

        // max depth step we can do (has to be set)
        tmp_res.step= dim.get(this.aabb.max) - dim.get(this.aabb.min);

        this.value(
            curPos,
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
                dicho_res.g = null;
                while(previousStepLength>0.1)
                {
                    previousDist=dim.get(curPos);
                    previousStepLength/=2;
                    // not asking for the next step, which is always half of previous
                    this.value(
                        curPos,
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
                dicho_res.g = g;
                this.value(curPos,
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

module.exports = RootNode;

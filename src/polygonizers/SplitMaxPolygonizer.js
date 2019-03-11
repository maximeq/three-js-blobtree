
const THREE = require("three-full/builds/Three.cjs.js");

// Does not work yet, so just suppose that Blobtree is defined externally
// const Blobtree = require('three-js-blobtree");

const RootNode = require("../blobtree/RootNode");
const RicciNode = require("../blobtree/RicciNode");
const MaxNode = require("../blobtree/MaxNode");
const ScalisPoint = require("../blobtree/scalis/ScalisPoint");
const ScalisSegment = require("../blobtree/scalis/ScalisSegment");
const ScalisTriangle = require("../blobtree/scalis/ScalisTriangle");

const SlidingMarchingCubes = require("./SlidingMarchingCubes");

/**
 *  This class will polygonize nodes independantly when they blend with a MaxNode or a RicciNode
 *  (for RicciNode, only if the coefficient of at least "ricciThreshold", threshold being a parameter).
 *  It will create a mesh made of several shells but intersections will be better looking than with some
 *  global polygonizers like MarchingCubes.
 *
 *  @param {Object} params Parameters and option for this polygonizer.
 *      @param {Object} params.subPolygonizer Parameters for the subpolygonizer to use.
 *                                            Must contain all parameters for the given subPolygonizer (like detailRatio, etc...)
 *      @param {Boolean} params.uniformRes If true, uniform resolution will be used on all primitives, according to the minimum accuracy in the blobtree.
 *          @param {Function} params.subPolygonizer.class The class of the subpolygonizer (default to SlidingMarchingCubes)
 *  @param {Function} params.progress Progress callback, taking a percentage as parameter.
 *  @param {Number} params.ricciThreshold The RicciNode coefficient above which it will be considered like a MaxNode.
 */
var SplitMaxPolygonizer = function(blobtree, params) {

    var params = params || {};

    this.blobtree = blobtree;

    this.uniformRes = params.uniformRes || false;
    this.min_acc = null;
    this.minAccs = [];

    this.subPolygonizer = params.subPolygonizer  ? params.subPolygonizer : {
        class:SlidingMarchingCubes,
        detailRatio:1.0
    };

    this.ricciThreshold = params.ricciThreshold || 64;

    this.progress = params.progress ? params.progress : function(percent){
        //console.log(percent);
    };

    // Now we need to parse the blobtree and split it according to the different ways of
    // generating each groups.
    // Since we do not wantto alterate the original blobtree, for now we will use cloning.
    // (to be changed if it is too slow)
    this.subtrees = []; // Blobtrees created for primitives which must be generated with SMC
        this.progCoeff = []; // progress coefficient, mainly depends on the total number of primitives in the node.
        this.totalCoeff = 0;

    this.setBlobtree(blobtree);
};

SplitMaxPolygonizer.prototype.constructor = SplitMaxPolygonizer;

SplitMaxPolygonizer.prototype.setBlobtree = function(blobtree){

    this.blobtree = blobtree;
    this.blobtree.prepareForEval();

    var getBlobtreeMinAcc = function(btree){
        var areas = btree.getAreas();
        var min_acc = areas.length !== 0 ? areas[0].bv.getMinAcc() : null;
        for(var i=0; i<areas.length; ++i){
            if(areas[i].bv.getMinAcc()<min_acc){
                min_acc = areas[i].bv.getMinAcc();
            }
        }
        return min_acc;
    };
    this.min_acc = getBlobtreeMinAcc(this.blobtree);

    this.subtrees = [];
        this.progCoeff = [];
        this.totalCoeff = 0;

    var self = this;
    var addToSubtrees = function(n){
        var subtree = null;
        if(n instanceof RootNode){
            subtree = n.clone();
        }else{
            subtree = new RootNode();
            subtree.addChild(n.clone());
        }
        self.subtrees.push(subtree);
        subtree.prepareForEval();
        self.minAccs.push(getBlobtreeMinAcc(subtree));
        self.progCoeff.push(
            subtree.count(ScalisPoint) + subtree.count(ScalisSegment) + subtree.count(ScalisTriangle)
        );
        self.totalCoeff += self.progCoeff[self.progCoeff.length-1];
    };

    var recurse = function(n){
        if(n instanceof RicciNode){
            if(n.getRicciN() < self.ricciThreshold){
                // This node must be copied and generated using SMC
                if(n.children.length !== 0){
                    addToSubtrees(n);
                }
            }else{
                for(var i=0; i<n.children.length; ++i){
                    recurse(n.children[i]);
                }
            }
        }else if(n instanceof MaxNode){
            for(var i=0; i<n.children.length; ++i){
                recurse(n.children[i]);
            }
        }else if(n instanceof ScalisPoint){
            addToSubtrees(n);
        }else if(n instanceof ScalisSegment){
            addToSubtrees(n);
        }else if(n instanceof ScalisTriangle){
            addToSubtrees(n);
        }else{
            addToSubtrees(n);
        }
    };

    recurse(this.blobtree);
}

SplitMaxPolygonizer.prototype.compute = function() {

    if(!this.blobtree.isValidAABB()){
        this.setBlobtree(this.blobtree);
    }

    var self = this;
    this.progress(0);
    var prog = 0;
    var geometries = [];
    for(var i=0; i<this.subtrees.length; ++i){

        var prev_detailRatio = this.subPolygonizer.detailRatio || 1.0;
        if(this.uniformRes && this.min_acc){
            this.subPolygonizer.detailRatio = prev_detailRatio*this.min_acc/this.minAccs[i];
        }

        this.subPolygonizer.progress = function(percent){
            self.progress(100*(prog + (percent/100)*self.progCoeff[i])/self.totalCoeff)
        };
        var polygonizer = new this.subPolygonizer.class(
            this.subtrees[i],
            this.subPolygonizer
        );
        geometries.push(polygonizer.compute());

        this.subPolygonizer.detailRatio = prev_detailRatio;

        prog += this.progCoeff[i];
    }

    var res = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

    this.progress(100);

    return res;
};

module.exports = SplitMaxPolygonizer;

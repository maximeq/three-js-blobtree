
const THREE = require("three-full/builds/Three.cjs.js");

const Material = require("../blobtree/Material.js");
const Tables = require("./MCTables.js");
const Convergence = require("../utils/Convergence.js");

const SlidingMarchingCubes = require("./SlidingMarchingCubes");



/**
 *  A special SlidingMarchingCubes with a different function
 *  to compute vertex normal in a cell.
 *  In this polygnizer, we suppose the blobtree used for marching
 *  is not the complete blobtree and we want to use the normal from
 *  the complete blobtree.
 *  @param {RootNode} params.metaBlobtree The blobtree from which normals will be computed.
 *                    Usually a blobtree containing blobtree.
 */
var SplitSMC = function(blobtree, params){
    SlidingMarchingCubes.call(this, blobtree, params);

    if(params.metaBlobtree){
        this.metaBlobtree = params.metaBlobtree;
        this.metaBlobtree.prepareForEval();
    }else{
        throw "Error : SplitSMC needs a meta blobtree in params (from which normals will be computed).";
    }
};

SplitSMC.prototype = Object.create(SlidingMarchingCubes.prototype);
SplitSMC.prototype.constructor = SplitSMC;

/**
 *  Compute the vertex in the current cube.
 *  Use this.x, this.y, this.z
 */
SplitSMC.prototype.computeVertex = (function() {
    // Function static variable
    var eval_res = {v:null, g:new THREE.Vector3(0,0,0), m:new Material()};
    var conv_res = new THREE.Vector3();

    return function()
    {
        eval_res.v = this.blobtree.getNeutralValue();

        // Optimization note :
        //      Here I dont use tables but performances may be improved
        //      by using tables. See marching cube and surface net for examples

        // Average edge intersection
        var e_count = 0;

        this.vertex.set(0,0,0);

        //For every edge of the cube...
        for(var i=0; i<12; ++i)
        {

            // --> the following code does not seem to work. Tables.EdgeCross may be broken
            //Use edge mask to check if it is crossed
            // if(!(edge_mask & (1<<i))) {
            //     continue;
            // }

            //Now find the point of intersection
            var e0 = Tables.EdgeVMap[i][0];       //Unpack vertices
            var e1 = Tables.EdgeVMap[i][1];
            var p0 = Tables.VertexTopo[e0];
            var p1 = Tables.VertexTopo[e1];
            var g0 = this.values[e0];                //Unpack grid values
            var g1 = this.values[e1];

            // replace the mask check with that. Slower.
            this.edge_cross[i] = ((g0>this.blobtree.getIsoValue()) !== (g1>this.blobtree.getIsoValue()));
            if( !this.edge_cross[i] ){
                continue;
            }
            //If it did, increment number of edge crossings
            ++e_count;

            var d = (g1-g0);
            var t  = 0;  //Compute point of intersection
            if(Math.abs(d) > 1e-6) {
                t = (this.blobtree.getIsoValue()-g0) / d;
            } else {
                continue;
            }

            this.vertex.x += (1.0-t)*p0[0] + t * p1[0];
            this.vertex.y += (1.0-t)*p0[1] + t * p1[1];
            this.vertex.z += (1.0-t)*p0[2] + t * p1[2];
        }

        this.vertex.x = this.x + this.curr_steps.x*this.vertex.x/e_count;
        this.vertex.y = this.y + this.curr_steps.y*this.vertex.y/e_count;
        this.vertex.z = this.z + this.curr_steps.z*this.vertex.z/e_count;

        // now make some convergence step
        // Note : it cost 15 to 20% performance lost
        //        and the result does not seem 15 et 20% better...
        if(this.convergence){
            Convergence.safeNewton3D(
                this.blobtree,      // Scalar Field to eval
                this.vertex,                  // 3D point where we start, must comply to THREE.Vector3 API
                this.blobtree.getIsoValue(),               // iso value we are looking for
                this.min_acc*this.convergence.ratio ,               // Geometrical limit to stop
                this.convergence.step,                           // limit of number of step
                this.min_acc,                     // Bounding volume inside which we look for the iso, getting out will make the process stop.
                conv_res                          // the resulting point
            );
            this.vertex.copy(conv_res);
        }

        this.metaBlobtree.value(this.vertex, eval_res);

        eval_res.g.normalize();
        this.vertex_n.copy(eval_res.g).multiplyScalar(-1);
        this.vertex_m.copy(eval_res.m);
    };
})();

module.exports = SplitSMC;

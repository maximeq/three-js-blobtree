
const THREE = require("three");

const Material = require("../blobtree/Material.js");
const Tables = require("./MCTables.js");
const Convergence = require("../utils/Convergence.js");

const SlidingMarchingCubes = require("./SlidingMarchingCubes");

/**
 * @typedef {import('../blobtree/RootNode')} RootNode
 * @typedef {import('./SlidingMarchingCubes')} SMCParams
 */


/**
 * metaBlobtree is The blobtree from which normals will be computed.
 * Usually a blobtree containing blobtree.
 * @typedef {{metaBlobtree: RootNode} & SMCParams} SplitSMCParams
 */

/**
 *  A special SlidingMarchingCubes with a different function
 *  to compute vertex normal in a cell.
 *  In this polygnizer, we suppose the blobtree used for marching
 *  is not the complete blobtree and we want to use the normal from
 *  the complete blobtree.
 */
class SplitSMC extends SlidingMarchingCubes {

    /**
     *  @param {RootNode} blobtree
     *  @param {SplitSMCParams} params
     */
    constructor(blobtree, params) {
        super(blobtree, params);

        if (params.metaBlobtree) {
            this.metaBlobtree = params.metaBlobtree;
            this.metaBlobtree.prepareForEval();
        } else {
            throw "Error : SplitSMC needs a meta blobtree in params (from which normals will be computed).";
        }
    }

    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex = (function () {
        // Function static variable
        var eval_res = { v: null, g: new THREE.Vector3(0, 0, 0), m: new Material() };
        var conv_res = new THREE.Vector3();

        return function () {

            /** @type {SplitSMC} */
            let self = this;

            eval_res.v = self.blobtree.getNeutralValue();

            // Optimization note :
            //      Here I dont use tables but performances may be improved
            //      by using tables. See marching cube and surface net for examples

            // Average edge intersection
            let e_count = 0;

            self.vertex.set(0, 0, 0);

            //For every edge of the cube...
            for (let i = 0; i < 12; ++i) {

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
                var g0 = self.values[e0];                //Unpack grid values
                var g1 = self.values[e1];

                // replace the mask check with that. Slower.
                self.edge_cross[i] = ((g0 > self.blobtree.getIsoValue()) !== (g1 > self.blobtree.getIsoValue()));
                if (!self.edge_cross[i]) {
                    continue;
                }
                //If it did, increment number of edge crossings
                ++e_count;

                var d = (g1 - g0);
                var t = 0;  //Compute point of intersection
                if (Math.abs(d) > 1e-6) {
                    t = (self.blobtree.getIsoValue() - g0) / d;
                } else {
                    continue;
                }

                self.vertex.x += (1.0 - t) * p0[0] + t * p1[0];
                self.vertex.y += (1.0 - t) * p0[1] + t * p1[1];
                self.vertex.z += (1.0 - t) * p0[2] + t * p1[2];
            }

            self.vertex.x = self.x + self.curr_steps.x * self.vertex.x / e_count;
            self.vertex.y = self.y + self.curr_steps.y * self.vertex.y / e_count;
            self.vertex.z = self.z + self.curr_steps.z * self.vertex.z / e_count;

            // now make some convergence step
            // Note : it cost 15 to 20% performance lost
            //        and the result does not seem 15 et 20% better...
            if (self.convergence) {
                Convergence.safeNewton3D(
                    self.blobtree,      // Scalar Field to eval
                    self.vertex,                  // 3D point where we start, must comply to THREE.Vector3 API
                    self.blobtree.getIsoValue(),               // iso value we are looking for
                    self.min_acc * self.convergence.ratio,               // Geometrical limit to stop
                    self.convergence.step,                           // limit of number of step
                    self.min_acc,                     // Bounding volume inside which we look for the iso, getting out will make the process stop.
                    conv_res                          // the resulting point
                );
                self.vertex.copy(conv_res);
            }

            self.metaBlobtree.value(self.vertex, eval_res);

            eval_res.g.normalize();
            self.vertex_n.copy(eval_res.g).multiplyScalar(-1);
            self.vertex_m.copy(eval_res.m);
        };
    })();
};



module.exports = SplitSMC;

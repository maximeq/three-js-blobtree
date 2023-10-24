import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";

// Does not work yet, so just suppose that Blobtree is defined externally
// const Blobtree = require('three-js-blobtree");

import RootNode from "../blobtree/RootNode";
import RicciNode from "../blobtree/RicciNode";
import MaxNode from "../blobtree/MaxNode";
import ScalisPoint from "../blobtree/scalis/ScalisPoint";
import ScalisSegment from "../blobtree/scalis/ScalisSegment";
import ScalisTriangle from "../blobtree/scalis/ScalisTriangle";

import SlidingMarchingCubes from "./SlidingMarchingCubes";

// Copied from SlidingMarchingCubes.js
// @todo migrate SlidingMarchingCubes to ts and import parameters type properly
type ConvergenceParams = {
    ratio?: number,
    step?: number
};
// Copied from SlidingMarchingCubes.js see that file for detailed doc
// @todo migrate SlidingMarchingCubes to ts and import parameters type properly
type SMCParams = {
    zResolution?: "adaptive" | "uniform",
    detailRatio?: number,
    progress?: (percent: number) => void;
    convergence?: ConvergenceParams,
    dichotomy?: number
};
/**
 * Parameters for the subpolygonizer to use.
 * Contain a className which will be mapped to a constructor, and parameters related to that polygonizer
 */
type SubPolygonizerParams = {
    className: "SlidingMarchingCubes", // | "MarchingCubes" // We only have 1 polygonizer class available for now
    smcParams?: SMCParams,
    // mcParams: MCParams // We only have 1 polygonizer class available for now
};


/**
 * @typedef {Object} SplitMaxPolygonizerParams
 * @property {SubPolygonizerParams=} subPolygonizer P
 * @property {Boolean=} smpParams.uniformRes
 * @property {Function=} smpParams.progress
 * @property {Number=} smpParams.ricciThreshold
 */

export type SplitMaxPolygonizerParams = {
    subPolygonizer?: SubPolygonizerParams,
    uniformRes?: boolean; // If true, uniform resolution will be used on all primitives, according to the minimum accuracy in the blobtree.
    progress?: (percent: number) => void; // Progress callback, taking a number in [0,100] as parameter.
    ricciThreshold?: number; // The RicciNode coefficient above which it will be considered like a MaxNode.
};

/**
 *  This class will polygonize nodes independantly when they blend with a MaxNode or a RicciNode
 *  (for RicciNode, only if the coefficient of at least "ricciThreshold", threshold being a parameter).
 *  It will create a mesh made of several shells but intersections will be better looking than with some
 *  global polygonizers like MarchingCubes.
 */
export class SplitMaxPolygonizer {

    private blobtree: RootNode;
    private uniformRes: boolean = false;

    private min_acc: number | null = null;
    private minAccs: number[] = [];

    private subPolygonizer: SubPolygonizerParams = {
        className: "SlidingMarchingCubes",
        smcParams: {
            detailRatio: 1.0
        }
    };

    readonly ricciThreshold: number = 64;

    private progress: (percent: number) => void = (_percent: number) => {
        //console.log(percent);
    };

    // Now we need to parse the blobtree and split it according to the different ways of
    // generating each groups.
    // Since we do not wantto alterate the original blobtree, for now we will use cloning.
    // (to be changed if it is too slow)
    private subtrees: RootNode[] = []; // Blobtrees created for primitives which must be generated with SMC
    private progCoeff: number[] = []; // progress coefficient, mainly depends on the total number of primitives in the node.
    private totalCoeff: number = 0;

    constructor(blobtree: RootNode, smpParams: SplitMaxPolygonizerParams) {
        const params = smpParams || {};

        this.blobtree = blobtree;

        if (params.uniformRes) {
            this.uniformRes = params.uniformRes;
        }

        if (params.subPolygonizer) {
            switch (params.subPolygonizer.className) {
                case "SlidingMarchingCubes":
                    this.subPolygonizer.className = "SlidingMarchingCubes";
                    this.subPolygonizer.smcParams = params.subPolygonizer.smcParams || {
                        detailRatio: 1.0
                    };
                    break;
                default:
                    console.error("Unknown polygonier class" + params.subPolygonizer.className);
                    break;
            }
        }

        if (params.ricciThreshold !== undefined) {
            this.ricciThreshold = params.ricciThreshold;
        }

        if (params.progress !== undefined) {
            this.progress = params.progress;
        }

        this.setBlobtree(blobtree);
    }

    setBlobtree(blobtree: RootNode) {

        this.blobtree = blobtree;
        this.blobtree.prepareForEval();

        const getBlobtreeMinAcc = function (btree: RootNode) {
            var areas = btree.getAreas();
            var min_acc = areas.length !== 0 ? areas[0].bv.getMinAcc() : null;
            for (var i = 0; i < areas.length; ++i) {
                if (areas[i].bv.getMinAcc() < min_acc) {
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
        var addToSubtrees = function (n) {
            var subtree = null;
            if (n instanceof RootNode) {
                subtree = n.clone();
            } else {
                subtree = new RootNode();
                subtree.addChild(n.clone());
            }
            self.subtrees.push(subtree);
            subtree.prepareForEval();
            self.minAccs.push(getBlobtreeMinAcc(subtree));
            self.progCoeff.push(
                subtree.count(ScalisPoint) + subtree.count(ScalisSegment) + subtree.count(ScalisTriangle)
            );
            self.totalCoeff += self.progCoeff[self.progCoeff.length - 1];
        };

        var recurse = function (n) {
            if (n instanceof RicciNode) {
                if (n.getRicciN() < self.ricciThreshold) {
                    // This node must be copied and generated using SMC
                    if (n.children.length !== 0) {
                        addToSubtrees(n);
                    }
                } else {
                    for (var i = 0; i < n.children.length; ++i) {
                        recurse(n.children[i]);
                    }
                }
            } else if (n instanceof MaxNode) {
                for (let i = 0; i < n.children.length; ++i) {
                    recurse(n.children[i]);
                }
            } else if (n instanceof ScalisPoint) {
                addToSubtrees(n);
            } else if (n instanceof ScalisSegment) {
                addToSubtrees(n);
            } else if (n instanceof ScalisTriangle) {
                addToSubtrees(n);
            } else {
                addToSubtrees(n);
            }
        };

        recurse(this.blobtree);
    }

    compute() {

        if (!this.blobtree.isValidAABB()) {
            this.setBlobtree(this.blobtree);
        }

        var self = this;
        this.progress(0);
        var prog = 0;
        var geometries = [];
        for (var i = 0; i < this.subtrees.length; ++i) {

            var prev_detailRatio = this.subPolygonizer.smcParams.detailRatio || 1.0;
            if (this.uniformRes && this.min_acc) {
                this.subPolygonizer.smcParams.detailRatio = prev_detailRatio * this.min_acc / this.minAccs[i];
            }

            this.subPolygonizer.smcParams.progress = function (percent) {
                self.progress(100 * (prog + (percent / 100) * self.progCoeff[i]) / self.totalCoeff)
            };
            let polygonizer = null;
            switch (this.subPolygonizer.className) {
                case "SlidingMarchingCubes":
                    polygonizer = new SlidingMarchingCubes(
                        this.subtrees[i],
                        this.subPolygonizer.smcParams
                    );
                default:
                    break;
            };
            geometries.push(polygonizer.compute());

            this.subPolygonizer.smcParams.detailRatio = prev_detailRatio;

            prog += this.progCoeff[i];
        }

        var res = BufferGeometryUtils.mergeBufferGeometries(geometries);

        this.progress(100);

        return res;
    };

};

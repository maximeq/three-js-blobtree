import { SlidingMarchingCubes } from "./SlidingMarchingCubes.js";
import type { RootNode } from "../exports.js";
import type { SMCParams } from './SlidingMarchingCubes';
/**
 * metaBlobtree is The blobtree from which normals will be computed.
 * Usually a blobtree containing blobtree.
 */
export interface SplitSMCParams extends SMCParams {
    metaBlobtree: RootNode;
}
/**
 *  A special SlidingMarchingCubes with a different function
 *  to compute vertex normal in a cell.
 *  In this polygnizer, we suppose the blobtree used for marching
 *  is not the complete blobtree and we want to use the normal from
 *  the complete blobtree.
 */
export declare class SplitSMC extends SlidingMarchingCubes {
    metaBlobtree: RootNode;
    constructor(blobtree: RootNode, params: SplitSMCParams);
    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex: (this: SlidingMarchingCubes) => void;
}
//# sourceMappingURL=SplitSMC.d.ts.map
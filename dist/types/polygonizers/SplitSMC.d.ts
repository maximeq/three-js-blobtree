import { SlidingMarchingCubes } from "./SlidingMarchingCubes.js";
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
export declare class SplitSMC extends SlidingMarchingCubes {
    /**
     *  @param {RootNode} blobtree
     *  @param {SplitSMCParams} params
     */
    constructor(blobtree: any, params: any);
    /**
     *  Compute the vertex in the current cube.
     *  Use this.x, this.y, this.z
     */
    computeVertex: () => void;
}
//# sourceMappingURL=SplitSMC.d.ts.map
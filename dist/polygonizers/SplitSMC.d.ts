export = SplitSMC;
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
declare class SplitSMC extends SlidingMarchingCubes {
    /**
     *  @param {RootNode} blobtree
     *  @param {SplitSMCParams} params
     */
    constructor(blobtree: RootNode, params: SplitSMCParams);
    metaBlobtree: import("../blobtree/RootNode");
}
declare namespace SplitSMC {
    export { RootNode, SMCParams, SplitSMCParams };
}
import SlidingMarchingCubes = require("./SlidingMarchingCubes");
type RootNode = import('../blobtree/RootNode');
/**
 * metaBlobtree is The blobtree from which normals will be computed.
 * Usually a blobtree containing blobtree.
 */
type SplitSMCParams = {
    metaBlobtree: RootNode;
} & SMCParams;
type SMCParams = import('./SlidingMarchingCubes');
//# sourceMappingURL=SplitSMC.d.ts.map
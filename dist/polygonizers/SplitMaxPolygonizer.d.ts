import RootNode from "../blobtree/RootNode";
declare type ConvergenceParams = {
    ratio?: number;
    step?: number;
};
declare type SMCParams = {
    zResolution?: "adaptive" | "uniform";
    detailRatio?: number;
    progress?: (percent: number) => void;
    convergence?: ConvergenceParams;
    dichotomy?: number;
};
/**
 * Parameters for the subpolygonizer to use.
 * Contain a className which will be mapped to a constructor, and parameters related to that polygonizer
 */
declare type SubPolygonizerParams = {
    className: "SlidingMarchingCubes";
    smcParams?: SMCParams;
};
/**
 * @typedef {Object} SplitMaxPolygonizerParams
 * @property {SubPolygonizerParams=} subPolygonizer P
 * @property {Boolean=} smpParams.uniformRes
 * @property {Function=} smpParams.progress
 * @property {Number=} smpParams.ricciThreshold
 */
export declare type SplitMaxPolygonizerParams = {
    subPolygonizer?: SubPolygonizerParams;
    uniformRes?: boolean;
    progress?: (percent: number) => void;
    ricciThreshold?: number;
};
/**
 *  This class will polygonize nodes independantly when they blend with a MaxNode or a RicciNode
 *  (for RicciNode, only if the coefficient of at least "ricciThreshold", threshold being a parameter).
 *  It will create a mesh made of several shells but intersections will be better looking than with some
 *  global polygonizers like MarchingCubes.
 */
export declare class SplitMaxPolygonizer {
    private blobtree;
    private uniformRes;
    private min_acc;
    private minAccs;
    private subPolygonizer;
    readonly ricciThreshold: number;
    private progress;
    private subtrees;
    private progCoeff;
    private totalCoeff;
    constructor(blobtree: RootNode, smpParams: SplitMaxPolygonizerParams);
    setBlobtree(blobtree: RootNode): void;
    compute(): import("three").BufferGeometry;
}
export {};
//# sourceMappingURL=SplitMaxPolygonizer.d.ts.map
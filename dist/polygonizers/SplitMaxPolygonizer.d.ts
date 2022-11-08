export = SplitMaxPolygonizer;
/**
 * @typedef {import('./SlidingMarchingCubes').SMCParams} SMCParams
 */
/**
 * @typedef {SMCParams & {class: any}} SubPolygonizerParams
 */
/**
 * @typedef {Object} SplitMaxPolygonizerParams
 * @property {SubPolygonizerParams=} subPolygonizer Parameters for the subpolygonizer to use.
 *                                           Must contain all parameters for the given subPolygonizer (like detailRatio, etc...)
 *                                           The class of the subpolygonizer (default to SlidingMarchingCubes) is in additional parameter class
 * @property {Boolean=} smpParams.uniformRes If true, uniform resolution will be used on all primitives, according to the minimum accuracy in the blobtree.
 * @property {Function=} smpParams.progress Progress callback, taking a percentage as parameter.
 * @property {Number=} smpParams.ricciThreshold The RicciNode coefficient above which it will be considered like a MaxNode.
 */
/**
 *  This class will polygonize nodes independantly when they blend with a MaxNode or a RicciNode
 *  (for RicciNode, only if the coefficient of at least "ricciThreshold", threshold being a parameter).
 *  It will create a mesh made of several shells but intersections will be better looking than with some
 *  global polygonizers like MarchingCubes.
 */
declare class SplitMaxPolygonizer {
    /**
     *  @param {SplitMaxPolygonizerParams=} smpParams Parameters and option for this polygonizer.
     */
    constructor(blobtree: any, smpParams?: SplitMaxPolygonizerParams | undefined);
    blobtree: any;
    uniformRes: boolean;
    min_acc: any;
    minAccs: any[];
    /** @type {SubPolygonizerParams} */
    subPolygonizer: SubPolygonizerParams;
    ricciThreshold: number;
    progress: Function;
    subtrees: any[];
    progCoeff: any[];
    totalCoeff: number;
    constructor: typeof import("./SplitMaxPolygonizer");
    setBlobtree(blobtree: any): void;
    compute(): THREE.BufferGeometry;
}
declare namespace SplitMaxPolygonizer {
    export { SMCParams, SubPolygonizerParams, SplitMaxPolygonizerParams };
}
type SubPolygonizerParams = SMCParams & {
    class: any;
};
type SplitMaxPolygonizerParams = {
    /**
     * Parameters for the subpolygonizer to use.
     * Must contain all parameters for the given subPolygonizer (like detailRatio, etc...)
     * The class of the subpolygonizer (default to SlidingMarchingCubes) is in additional parameter class
     */
    subPolygonizer?: SubPolygonizerParams | undefined;
    /**
     * If true, uniform resolution will be used on all primitives, according to the minimum accuracy in the blobtree.
     */
    uniformRes?: boolean | undefined;
    /**
     * Progress callback, taking a percentage as parameter.
     */
    progress?: Function | undefined;
    /**
     * The RicciNode coefficient above which it will be considered like a MaxNode.
     */
    ricciThreshold?: number | undefined;
};
type SMCParams = import('./SlidingMarchingCubes').SMCParams;
//# sourceMappingURL=SplitMaxPolygonizer.d.ts.map
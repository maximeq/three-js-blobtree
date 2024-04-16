/**
 * @typedef {0|1|2|3|4|5|6|7} EdgeIndex
 * @typedef {[EdgeIndex, EdgeIndex]} EdgeIndexPair
 * @typedef {0|1} TopoValue
 * @typedef {[TopoValue, TopoValue, TopoValue]} TopoTriple
 */
/**
 * Tables for Marching Cube
 */
export declare const Tables: {
    /**
     * edgevmap[i][0] = first vertex index of the ith edge of a cube
     * edgevmap[i][0] = second vertex index of the ith edge of a cube
     * @type {[
    *   EdgeIndexPair, EdgeIndexPair, EdgeIndexPair, EdgeIndexPair,
    *   EdgeIndexPair, EdgeIndexPair, EdgeIndexPair, EdgeIndexPair,
    *   EdgeIndexPair, EdgeIndexPair, EdgeIndexPair, EdgeIndexPair
     * ]}
     */
    EdgeVMap: number[][];
    /**
     * @type {[TopoTriple,TopoTriple,TopoTriple,TopoTriple,TopoTriple,TopoTriple,TopoTriple,TopoTriple]}
     */
    VertexTopo: number[][];
};
//# sourceMappingURL=MCTables.d.ts.map
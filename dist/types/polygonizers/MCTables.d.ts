/**
 * @typedef {0|1|2|3|4|5|6|7} EdgeIndex
 * @typedef {[EdgeIndex, EdgeIndex]} EdgeIndexPair
 * @typedef {0|1} TopoValue
 * @typedef {[TopoValue, TopoValue, TopoValue]} TopoTriple
 */
type EdgeIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type EdgeIndexPair = [EdgeIndex, EdgeIndex];
type TopoValue = 0 | 1;
type TopoTriple = [TopoValue, TopoValue, TopoValue];
type MarchinCubeTables = {
    EdgeVMap: EdgeIndexPair[];
    VertexTopo: TopoTriple[];
};
/**
 * Tables for Marching Cube
 */
export declare const Tables: MarchinCubeTables;
export {};
//# sourceMappingURL=MCTables.d.ts.map
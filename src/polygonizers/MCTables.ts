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
}

/**
 * Tables for Marching Cube
 */
export const Tables: MarchinCubeTables = {
    /**
     * edgevmap[i][0] = first vertex index of the ith edge of a cube
     * edgevmap[i][0] = second vertex index of the ith edge of a cube
     */
    EdgeVMap: [
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],

        [0, 2],
        [1, 3],
        [4, 6],
        [5, 7],

        [0, 1],
        [2, 3],
        [4, 5],
        [6, 7],
    ],

    /**
     * Vertex topology for Marching Cubes
     */
    VertexTopo: [
        [0, 0, 0], //0 (MC = 0)
        [0, 0, 1], //1 (MC = 4)
        [0, 1, 0], //2 (MC = 3)
        [0, 1, 1], //3 (MC = 7)
        [1, 0, 0], //4 (MC = 1)
        [1, 0, 1], //5 (MC = 5)
        [1, 1, 0], //6 (MC = 2)
        [1, 1, 1]  //7 (MC = 6)
    ]
};

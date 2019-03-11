'use strict';

var Tables = {};

// edgevmap[i][0] = first vertex index of the ith edge of a cube
// edgevmap[i][0] = second vertex index of the ith edge of a cube
Tables.EdgeVMap = [
    [0,4],
    [1,5],
    [2,6],
    [3,7],

    [0,2],
    [1,3],
    [4,6],
    [5,7],

    [0,1],
    [2,3],
    [4,5],
    [6,7]
];

Tables.VertexTopo = [
    [0,0,0], //0 (MC = 0)
    [0,0,1], //1 (MC = 4)
    [0,1,0], //2 (MC = 3)
    [0,1,1], //3 (MC = 7)
    [1,0,0], //4 (MC = 1)
    [1,0,1], //5 (MC = 5)
    [1,1,0], //6 (MC = 2)
    [1,1,1]  //7 (MC = 6)
];

module.exports = Tables;
const fs = require('fs');
const childProcess = require('child_process');

const GeometryToOBJ = require('./lib/GeometryToOBJ.js');

const THREE = require("three-full/builds/Three.cjs.js");
const Blobtree = require('../../');

var root = new Blobtree.RootNode();

root.addChild(
    new  Blobtree.MinNode(
        [
            new Blobtree.ScalisPoint(
                        new Blobtree.ScalisVertex(
                            new THREE.Vector3(0,0,0),
                            10
                        ),
                        Blobtree.ScalisPrimitive.DIST,
                        1.0,
                        new Blobtree.Material()
                    ),
            new Blobtree.ScalisPoint(
                new Blobtree.ScalisVertex(
                    new THREE.Vector3(10,0,0),
                    3
                ),
                Blobtree.ScalisPrimitive.DIST,
                1.0,
                new Blobtree.Material()
            )
        ]
    )
);

root.prepareForEval();

var smc = new Blobtree.SlidingMarchingCubes(root,{convergence:{},detailRatio:0.25});

var g = smc.compute();
// g.computeVertexNormals();

var wstr_united = fs.createWriteStream("./min.obj");
wstr_united.write( GeometryToOBJ(g) );
wstr_united.end('\n');
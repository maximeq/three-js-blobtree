const fs = require('fs');
const childProcess = require('child_process');

const GeometryToOBJ = require('./lib/GeometryToOBJ.js');

const THREE = require("three-full/builds/Three.cjs.js");
const Blobtree = require('../../');

var root = new Blobtree.Root();

root.addChild(
    new Blobtree.ScalisPoint(
        new Blobtree.ScalisVertex(
            new THREE.Vector3(0,0,0),
            2
        ),
        Blobtree.ScalisPrimitive.DIST,
        1.0,
        new Blobtree.Material()
    )
);

var smc = new Blobtree.SlidingMarchingCubes(root);

var g = smc.compute();

var wstr_united = fs.createWriteStream("./basic.obj");
wstr_united.write( GeometryToOBJ(g) );
wstr_united.end('\n');

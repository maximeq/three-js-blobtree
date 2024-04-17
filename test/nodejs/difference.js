import fs from 'fs';
import { GeometryToOBJ } from './lib/GeometryToOBJ.js';
import * as THREE from "three";
import * as Blobtree from '../../dist/three-js-blobtree.module.js';

var root = new Blobtree.RootNode();

root.addChild(
    new Blobtree.DifferenceNode(
        new Blobtree.RicciNode(
            1,
            [
                new Blobtree.ScalisPoint(
                    new Blobtree.ScalisVertex(
                        new THREE.Vector3(0, 0, 0),
                        10
                    ),
                    Blobtree.ScalisPrimitive.DIST,
                    1.0,
                    new Blobtree.Material()
                ),
                new Blobtree.ScalisPoint(
                    new Blobtree.ScalisVertex(
                        new THREE.Vector3(-10, 0, 0),
                        3
                    ),
                    Blobtree.ScalisPrimitive.DIST,
                    1.0,
                    new Blobtree.Material()
                )
            ]
        ),
        new Blobtree.ScalisPoint(
            new Blobtree.ScalisVertex(
                new THREE.Vector3(10, 0, 0),
                3
            ),
            Blobtree.ScalisPrimitive.DIST,
            1.0,
            new Blobtree.Material()
        ),
        8
    )
);

var smc = new Blobtree.SlidingMarchingCubes(root, { detailRatio: 0.25 });

var g = smc.compute();

var wstr_united = fs.createWriteStream("./difference.obj");
wstr_united.write(GeometryToOBJ(g));
wstr_united.end('\n');

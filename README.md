three-js-blobtree
================

[![License][license-badge]][license-badge-url]

## Three.js Extension to manipulate Blobtrees and implicit surfaces ##

A library to manage implicit surfaces in THREE.JS applications using a Blobtree.

### Setup ###

Assuming that npm and node are already installed.

Clone the current repository. Then in the repository folder :
````
npm install
````
This should install all required dependencies for build and development.

Coming soon,

### Usage ###

You can use this library directly in browser or from node.js.

#### Browser ####

Distribution files can be found in ./dist/browser, to be included in your HTML :

````
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Three Full Es6</title>
    </head>
    <body>
        <!-- Don't forget to include THREE, its is not shipped with the lib -->
        <script src="three.js"></script>
        <script src="dist/browser/blobtree.js"></script>
        <script>
            alert('Blobtree.version: ' + Blobtre.version)
        </script>
    </body>
</html>
````

#### Node [Coming soon] ####

Install directly from npm :
````
npm install --save three-js-blobtree
````

Then simply require the package in your scripts.

````javascript
const Blobtree = require('three-js-blobtree')
````

### Repository Commands ###
In case you want participate, or want to dig deeper into the lib.

Make documentation:
````
npm run make-doc
````
Will build the jsDoc documentation in ./doc, entry point at ./doc/index.html

Build:
````
npm run build
````
Will update the browser build in dist.

### Dependencies ###

#### Node Dependencies ####
This library currently depends on node module three-full which is packaging all THREE.JS sources, including extras like examples.
It can work with only THREE, but for convenience we rely on three-full.

#### Browser Dependencies ####
In browser, only THREE is required.

### Main concepts ###
This library implements a blobtree representation.
A blobtree is a tree of implicit primitives generating a scalar field. Classic fields include distance fields, but other implicit functions can also be used.

In this library, the standard convention is to consider the scalar field as a "mater density field".
To respect this convention, all implicit fields should be such that the propagated value to the root evaluation always results in a value greater than 0. By default, the surface of interest is at value 1.0, but this can be changed in the Blobtree Root.

In this library, a Blobtree instance is carrying parameters for rendering and polygonizing, especially regarding the accuracy needed and bounding volumes.
Some global parameters can be changed in the global namespace Accuracies, and rendering or polygonizing algorithm should give additionnal options to choose the level of details.
However, keep in mind that any primitive must define those elements.

#### Documentation ####
A full jsdoc documentation can be build using npm.
However, the best way to start is to read and play with the examples.

## Future Improvements ##

### Dependency to three-full ###
The lib depends on three-full on the nodejs side. It is not necessary in theory, it could depend only on three, but three-full is more complete to be used in examples, etc...
We could consider automatically building two nodejs entry points, one linked to three and the other to three-full.

### Signed Distance Fields ###

#### Nodes ####

   Signed Distance Fields support is minimalist for now. Should be added : union, intersection, difference, transformation (rotation, translation, scale...).

#### Materials ####

   For now only SDFRootNode can handle a material. Primitive nodes at least should define materials settings and evaluation.

### Architecture and Code ###

#### Automated regression tests ####

Tests should be added for automatic comparison of expected values. This is a required step before optimizing primitive computations.
Also, concerning analytical gradient, the same requirement applies : for all primtives analytical results should be compared with numerical one to check it is correct.

#### Deprecation and refactoring ####

##### Scalis bounding volumes #####

Scalis bounding volumes are redundants with Sphere and Capsule volumes (AreaSphere and AreaCapsule). AreaScalisPoint and AreasScalisSeg should be permanently removed and replaced with the previously mentionned general volumes.

##### Scalis Distance #####

It should be possible to use a SDFRootNode with a SDFCapsule instead of a Scalis with a DIST volume type. This would remove some duplicate code.





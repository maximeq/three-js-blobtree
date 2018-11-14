three-js-blobtree
================

[![License][license-badge]][license-badge-url]

#### Three.js Extension to manipulate Blobtrees and implicit surfaces ####

A library to manage implicit surfaces in THREE.JS applications using a Blobtree.

#### Setup ####

Assuming that npm and node are already installed.

Clone the current repository. Then in the repository folder :
````
npm install
````
This should install all required dependencies for build and development.

Coming soon,

#### Usage ####

You can use this library directly in browser or from node.js.

###### Browser ######

Distribution files can be found in ./dist/browser, to be included in your HTML :

````
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Three Full Es6</title>
    </head>
    <body>
        <!-- Don't forget to include THREE, its is not shipped with
        <script src="three.js"></script>
        <script src="dist/browser/blobtree.js"></script>
        <script>
            alert('Blobtree.version: ' + Blobtre.version)
        </script>
    </body>
</html>
````

###### Node [Coming soon] ######

Install directly from npm :
````
npm install --save three-js-blobtree
````

Then simply require the package in your scripts.

````javascript
const Blobtree = require('three-js-blobtree')
````

#### Repository Commands ####
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

#### Dependencies ####

##### Node Dependencies #####
This library currently depends on node module three-full which is packaging all THREE.JS sources, including extras like examples.
It can work with only THREE, but for convenience we rely on three-full.

##### Browser Dependencies #####
In browser, only THREE is required.

#### Main concepts ####
This library implements a blobtree representation.
A blobtree is a tree of implicit primitives generating a scalar field. Classic fields include distance fields, but other implicit functions can also be used.

In this library, the standard convention is to consider the scalar field as a "mater density field".
To respect this convention, all implicit fields should be such that the propagated value to the root evaluation always results in a value greater than 0. By default, the surface of interest is at value 1.0, but this can be changed in the Blobtree Root.

# Documentation
A full jsdoc documentation can be build using npm.
However, the best way to start is to read and play with the examples.

# TODO

## Dep to Three-full
For now we ue common require method. We should probably use import syntax, so that it is possible to build a light bundle from those sources.
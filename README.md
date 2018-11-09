# three-js-blobtree
A library to manage implicit surfaces in THREE.JS applications using a Blobtree.

# Dependencies
This library currently depends on node module Three-full which is packaging all THREE.JS sources, including extras like examples.

# Main concepts
This library implements a blobtree representation.
A blobtree is a tree of implicit primitives generating a scalar field. Classic fields include distance fields, but other implicit functions can also be used.

In this library, the standard convention is to consider the scalar field as a "mater density field".
To respect this convention, all implicit fields should be such that their value is always greater than 0, with surface of interest at 1.0.
Note that the library can also work with other conventions by changing the iso value in the Blobtree root. However, it is not recommanded as far as it can be avoided.

# Documentation
A full jsdoc documentation can be build using npm.
However, the best way to start is to have read the examples code.

# TODO

## Dep to Three-full
For now we ue common require method. We should probably use import syntax, so that it is possible to build a light bundle from those sources.
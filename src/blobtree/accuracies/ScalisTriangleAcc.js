"use strict";

/**
 * @global
 * @type {Object} ScalisTriangleAcc Contains the accuracies for Scalis Points.
 * @property {number} nice Factor for the nice accuracy needed to represent the features nicely
 * @property {number} raw Factor for the raw accuracy needed to represent the features roughly
 * @property {number} curr Current accuracy factor, should be between ScalisTriangleAcc.nice and ScalisTriangleAcc.raw
 */
var ScalisTriangleAcc = {};

ScalisTriangleAcc.nice = 0.3;
ScalisTriangleAcc.raw = 1.0;
ScalisTriangleAcc.curr = 0.3;

module.exports = ScalisTriangleAcc;

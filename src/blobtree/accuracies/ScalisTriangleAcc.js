"use strict";

var ScalisTriangleAcc = {};

/** @const {number} factor for the nice accuracy needed to represent the features correctly */
ScalisTriangleAcc.nice = 0.3;
/** @const {number} factor for the raw accuracy needed to represent the features roughly */
ScalisTriangleAcc.raw = 1.0;
/** @type {number} Current accuracy factor, should be between ScalisTriangleAcc.nice and ScalisTriangleAcc.raw*/
ScalisTriangleAcc.curr = 0.3;

module.exports = ScalisTriangleAcc;

"use strict";

/**
 * @global
 * @type {Object} ScalisPointAcc Contains the accuracies for Scalis Points.
 * @property {number} nice Factor for the nice accuracy needed to represent the features nicely
 * @property {number} raw Factor for the raw accuracy needed to represent the features roughly
 * @property {number} curr Current accuracy factor, should be between ScalisPointAcc.nice and ScalisPointAcc.raw
 */
var ScalisPointAcc = {};

ScalisPointAcc.nice = 0.3;
ScalisPointAcc.raw = 1.0;
ScalisPointAcc.curr = 0.3;

module.exports = ScalisPointAcc;

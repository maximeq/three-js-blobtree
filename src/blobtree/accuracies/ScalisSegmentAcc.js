"use strict";

/**
 * @global
 * @type {Object} ScalisSegmentAcc Contains the accuracies for Scalis Points.
 * @property {number} nice Factor for the nice accuracy needed to represent the features nicely
 * @property {number} raw Factor for the raw accuracy needed to represent the features roughly
 * @property {number} curr Current accuracy factor, should be between ScalisSegmentAcc.nice and ScalisSegmentAcc.raw
 */
var ScalisSegmentAcc = {};

ScalisSegmentAcc.nice = 0.3;
ScalisSegmentAcc.raw = 1.0;
ScalisSegmentAcc.curr = 0.3;

module.exports = ScalisSegmentAcc;

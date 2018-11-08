"use strict";

var ScalisSegmentAcc = {};

/** @const {number} factor for the nice accuracy needed to represent the features correctly */
ScalisSegmentAcc.nice = 0.3;
/** @const {number} factor for the raw accuracy needed to represent the features roughly */
ScalisSegmentAcc.raw = 1.0;
/** @type {number} Current accuracy factor, should be between ScalisSegmentAcc.nice and ScalisSegmentAcc.raw*/
ScalisSegmentAcc.curr = 0.3;

module.exports = ScalisSegmentAcc;

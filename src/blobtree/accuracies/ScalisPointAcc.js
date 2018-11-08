"use strict";

var ScalisPointAcc = {};

/** @const {number} factor for the nice accuracy needed to represent the features correctly */
ScalisPointAcc.nice = 0.3;
/** @const {number} factor for the raw accuracy needed to represent the features roughly */
ScalisPointAcc.raw = 1.0;
/** @type {number} Current accuracy factor, should be between ScalisPointAcc.nice and ScalisPointAcc.raw*/
ScalisPointAcc.curr = 0.3;

module.exports = ScalisPointAcc;

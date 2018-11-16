"use strict";

/**
 * @global
 * @type {Object} SphereAcc Contains the accuracies for Sphere areas.
 * @property {number} nice Factor for the nice accuracy needed to represent the features nicely
 * @property {number} raw Factor for the raw accuracy needed to represent the features roughly
 * @property {number} curr Current accuracy factor, should be between SphereAcc.nice and SphereAcc.raw
 */
var SphereAcc = {};

SphereAcc.nice = 0.3;
SphereAcc.raw = 1.0;
SphereAcc.curr = 0.3;

module.exports = SphereAcc;

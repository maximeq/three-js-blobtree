"use strict";

/**
 * @global
 * @type {Object} Accuracies Contains the accuracies needed in Areas. Can be changed when importing blobtree.js.
 *                For classic segments and sphere, we setteled for a raw accuracy being proportional to
 *                the radii. 1/3 of the radius is considered nice, 1 radius is considered raw.
 *                For new primitives, feel free to create your own accuracies factors depending on the features.
 *
 * @property {number} nice Factor for the nice accuracy needed to represent the features nicely
 * @property {number} raw Factor for the raw accuracy needed to represent the features roughly
 * @property {number} curr Current accuracy factor, should be between Accuracies.nice and Accuracies.raw.
 *                         It will be the one used by rendering algorithms to decide to stop even if nice accuracy has not been reached.
 */
var Accuracies = {};

Accuracies.nice = 0.3;
Accuracies.raw = 1.0;
Accuracies.curr = 0.3;

module.exports = Accuracies;

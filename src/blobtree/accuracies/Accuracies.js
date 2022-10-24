"use strict";

/**
 * Accuracies Contains the accuracies needed in Areas. Can be changed when importing blobtree.js.
 * For classic segments and sphere, we setteled for a raw accuracy being proportional to
 * the radii. 1/3 of the radius is considered nice, 1 radius is considered raw.
 * For new primitives, feel free to create your own accuracies factors depending on the features.
 */
var Accuracies = {
    /**
     * Factor for the nice accuracy needed to represent the features nicely
     * @type {number}
     */
    nice: 0.3,
    /**
     * Factor for the raw accuracy needed to represent the features roughly
     * @type {number}
     */
    raw: 1.0,
    /**
     * Current accuracy factor, should be between Accuracies.nice and Accuracies.raw.
     * It will be the one used by rendering algorithms to decide to stop even if nice accuracy has not been reached.
     * @type {number}
     *
     */
    curr: 0.3
};

module.exports = Accuracies;

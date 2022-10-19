"use strict";

const THREE = require("three");
const Area = require("./Area.js");
const Accuracies = require("../accuracies/Accuracies.js");

/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */

/**
 *  AreaSphere is a general representation of a spherical area.
 *  See Primitive.getArea for more details.
 *
 *  @extends {Area}
 */
class AreaSphere extends Area {
    /**
     *  @param {!THREE.Vector3} p Point to locate the area
     *  @param {number} r Radius of the area
     *  @param {number} accFactor Accuracy factor. By default SphereArea will use global Accuracies parameters. However, you can setup a accFactor.
     *                            to change that. You will usually want to have accFactor between 0 (excluded) and 1. Default to 1.0.
     *                            Be careful not to set it too small as it can increase the complexity of some algorithms up to the crashing point.
     */
    constructor(p, r, accFactor) {
        super();

        this.p = new THREE.Vector3(p.x, p.y, p.z);
        this.r = r;

        this.accFactor = accFactor || 1.0;
    }

    /**
     *  Test intersection of the shape with a sphere
     *  @return {boolean} true if the sphere and the area intersect
     *
     *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     */
    sphereIntersect = (function () {
        var v = new THREE.Vector3();
        return (sphere) => {
            /** @type {AreaSphere} */
            let self = this;

            v.subVectors(sphere.center, self.p);
            var tmp = sphere.radius + self.r;
            return v.lengthSq() < tmp * tmp;
        };
    })();

    /**
     * @link Area.contains for a complete description
     * @param {THREE.Vector3} p
     * @return {boolean}
     */
    contains = (function () {
        var v = new THREE.Vector3();
        /**
         *  @param {!THREE.Vector3} p A point in space, must comply to THREE.Vector3 API.
         *
         */
        return (p) => {
            /** @type {AreaSphere} */
            let self = this;

            v.subVectors(p, self.p);
            return v.lengthSq() < self.r * self.r;
        };
    })();

    /**
     *  @link Area.getAcc for a complete description
     *
     *  @return {number} the accuracy needed in the intersection zone
     *
     *  @param {AreaSphereParam} _sphere  A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @param {number}  factor  the ratio to determine the wanted accuracy.
     *
     */
    getAcc(_sphere, factor) {
        return this.r * factor;
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A sphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Nice accuracy needed in the intersection zone
     */
    getNiceAcc(sphere) {
        return this.getAcc(sphere, Accuracies.nice * this.accFactor);
    }

    /**
     *  @link Area.getNiceAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The Curr accuracy needed in the intersection zone
     */
    getCurrAcc(sphere) {
        return this.getAcc(sphere, Accuracies.curr * this.accFactor);
    }

    /**
     *  @link Area.getRawAcc for a complete description
     *  @param {AreaSphereParam}  sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     *  @return {number} The raw accuracy needed in the intersection zone
     */
    getRawAcc(sphere) {
        return this.getAcc(sphere, Accuracies.raw * this.accFactor);
    }

    /**
     * @link Area.getMinAcc
     * @return {number}
     */
    getMinAcc() {
        return Accuracies.curr * this.r * this.accFactor;
    }

    /**
     * @link Area.getMinRawAcc
     * @return {number}
     */
    getMinRawAcc() {
        return Accuracies.raw * this.r * this.accFactor;
    }

    /**
     *  Return the minimum accuracy required at some point on the given axis, according to Accuracies.curr
     *  The returned accuracy is the one you would need when stepping in the axis
     *  direction when you are on the axis at coordinate t.
     *  @param {string} axis x, y or z
     *  @param {number} t Coordinate on the axis
     *  @return {number} The step you can safely do in axis direction
     */
    getAxisProjectionMinStep(axis, t) {
        var step = 100000000;
        var diff = t - this.p[axis];
        if (diff < -2 * this.r) {
            step = Math.min(
                step,
                Math.max(
                    Math.abs(diff + this.r),
                    Accuracies.curr * this.r * this.accFactor
                )
            );
        } else if (diff < 2 * this.r) {
            step = Math.min(
                step,
                Accuracies.curr * this.r * this.accFactor
            );
        }// else the area is behind us
        return step;
    };
}

module.exports = AreaSphere;


'use strict';

const Types = require("../Types.js");
const DistanceFunctor = require("./DistanceFunctor.js");

/**
 *  Specialised Distance Functor using a 6 degree polynomial function.
 *  This is the function similar to the one used in SCALIS primitives.
 *  @constructor
 */
class Poly6DistanceFunctor extends DistanceFunctor {

    static type = "Poly6DistanceFunctor";

    /**
     * This is the standard 6 degree polynomial function used for implicit modeling.
     * At 0, its value is 1 with a zero derivative.
     * At 1, its value is 0 with a zero derivative.
     * @param {number} d
     */
    static evalStandard(d) {
        if (d < 0.0) {
            return 1.0;
        }
        var aux = 1.0 - d * d;

        if (aux > 0.0) {
            return aux * aux * aux;
        } else {
            return 0.0;
        }
    };

    /**
     * @param {number} scale
     */
    constructor(scale) {
        super();
        this.scale = scale || 1.0;
    }

    /**
     *  @return {string} Type of the element
     */
    getType() {
        return Poly6DistanceFunctor.type;
    };

    /**
     *  @return {Object} Json description of this functor.
     */
    toJSON() {
        var json = super.toJSON();
        json.scale = this.scale;
        return json;
    };

    /**
     * @link DistanceFunctor.value for a complete description.
     * @param {number} d The distance to be considered.
     * @returns {number} Scalar field value according to given distance d.
     */
    value(d) {
        var dp = d / (2 * this.scale); // ensure the support fits the scale.
        dp = dp + 0.5;
        return Poly6DistanceFunctor.evalStandard(dp) / Poly6DistanceFunctor.evalStandard(0.5);
    };

    /**
     * @param {number} d
     * @returns {number} dimensional gradient at d.
     */
    gradient(d) {
        var ds = d / (2 * this.scale) + 0.5;
        var res = (1 - ds * ds);
        res = -(6 / (2 * this.scale)) * ds * res * res / Poly6DistanceFunctor.evalStandard(0.5);
        return res;
    };

    /**
     * @link DistanceFunctor.getSupport for a complete description.
     * @returns
     */
    getSupport() {
        return this.scale;
    };
};

Types.register(Poly6DistanceFunctor.type, Poly6DistanceFunctor);

module.exports = Poly6DistanceFunctor;



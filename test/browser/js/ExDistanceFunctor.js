'use strict';

/**
 *  Specialised Distance Functor using a 6 degree polynomial function.
 *  This is the function similar to the one used in SCALIS primitives.
 *  This is the same as Blobtree.Poly6DistanceFunctor, but defined externally from the lib.
 *
 *  It is meant to be used as a template to create your own distance function.
 *  @constructor
 *
 *  @param {number} scale Functors can easily take parameter. Here, a scaling factor.
 */
class ExDistanceFunctor extends Blobtree.DistanceFunctor {

    static type = "ExDistanceFunctor";

    constructor(scale) {
        super();
        this.scale = scale || 1.0;
    }

    // [Abstract]
    value(d) {

        // This is the standard 6 degree polynomial function used for implicit modeling.
        // At 0, its value is 1 with a zero derivative.
        // at 1, its value is 0 with a zero derivative.
        var f = function (d) {
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

        var dp = d / (2 * this.scale); // ensure the support fits the scale.
        dp = dp + 0.5;             // shift by 0.5 to be in the middle of the curve at 0.
        var res = f(dp) / f(0.5);    // Normalize to have iso_value 1.0 at dp === 0

        return res;
    };

    // Return the support of the funtion.
    // This is the distance to 0 from which the functor will always evaluate to 0.
    // If the support is not finite, please provide an arbitrary stop.
    // Polygonizers will use this to determine how far they should look for the surface, so :
    //      - Providing a too large support will increase computation time
    //      - Providing a too small support may result in missing the surface
    getSupport(d) {
        return this.scale;
    };


/*****************************************************************************/
/* Following methods are optional                                            */
/*****************************************************************************/

    // Optionnal : this function is used to save the current functor as a JSON object.
    //            The resulting JSON can then be imported using Blobtree.Types.fromJSON()
    toJSON() {
        var json = super.toJSON(c);
        json.scale = this.scale;
        return json;
    };

    // Optionnal : this function computes the gradient (simple derivative) of the function.
    //             if not provided, a numerical approximation will be used.
    gradient(d) {
        // This is the standard 6 degree polynomial function used for implicit modeling.
        // At 0, its value is 1 with a zero derivative.
        // at 1, its value is 0 with a zero derivative.
        var f = function (d) {
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

        var ds = d / (2 * this.scale) + 0.5;
        var res = (1 - ds * ds);
        res = -(6 / (2 * this.scale)) * ds * res * res / f(0.5);
        return res;
    };
};

Blobtree.Types.register(ExDistanceFunctor.type, ExDistanceFunctor);




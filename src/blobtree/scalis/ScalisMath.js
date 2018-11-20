'use strict';


/**
 *  @global ScalisMath Contains some maths constant and functions for Scalis primitives.
 *          We use CompactPolynomial6 with 2.0 as Scale. Those parameters will be used by main primitives.
 *  @type {Object}
 *  @property {number} KS Kernel Scale
 *  @property {number} KS2 Kernel Scale Squared
 *  @property {number} KIS2 Kernel Inverse Scale Squared
 *  @property {} Poly6Eval
 */
var ScalisMath = {};

ScalisMath.KS = 2.0;
ScalisMath.KIS = 1/ScalisMath.KS;
ScalisMath.KS2 = 4.0;
ScalisMath.KIS2 = 1/(ScalisMath.KS*ScalisMath.KS);
/**
 *  Compact Polynomial of degree 6 evaluation function
 *  @param {number} r Radius (ie distance)
 */
ScalisMath.Poly6Eval = function(r)
{
    var aux = 1.0-ScalisMath.KIS2*r*r;

    if(aux > 0.0)
    {
        return aux*aux*aux;
    }else{
        return 0.0;
    }
};
/**
 *  Compact Polynomial of degree 6 evaluation function from a squared radius.
 *  (avoid square roots in some cases)
 *  @param {number} r2 Radius squared (ie distance squared)
 */
ScalisMath.Poly6EvalSq = function(r2)
{
    var aux = 1.0-ScalisMath.KIS2*r2;

    if(aux > 0.0)
    {
        return aux*aux*aux;
    }else{
        return 0.0;
    }
};

/**
 *  Compute the iso value at a given distance for a given polynomial degree
 *  and scale in 0 dimension (point)
 *
 *  @param {number} degree  Polynomial degree of the kernel
 *  @param {number} scale   Kernel scale
 *  @param {number} dist    Distance
 *  @return {number} The iso value at a given distance for a given polynomial degree and scale
 */
ScalisMath.GetIsoValueAtDistanceGeom0D = function(degree, scale, dist)
{
    if(degree%2!==0){
        throw "degree should be even";
    }

    if(dist < scale)
    {
        var func_dist_scale = 1.0 - (dist*dist) / (scale*scale);
        return Math.pow(func_dist_scale, degree/2.0);
    }
    else
    {
        return 0.0;
    }
};

/**
 * @global
 * @type {number} Normalization Factor for polynomial 4 in 0 dimension
 * @const
 */
ScalisMath.Poly4NF0D = 1.0/ScalisMath.GetIsoValueAtDistanceGeom0D(4,ScalisMath.KS,1.0);
/**
 * @global
 * @type {number} Normalization Factor for polynomial 6 in 0 dimension
 * @const
 */
ScalisMath.Poly6NF0D = 1.0/ScalisMath.GetIsoValueAtDistanceGeom0D(6,ScalisMath.KS,1.0);

/**
 *  Compute the iso value at a given distance for a given polynomial degree
 *  and scale in 1 dimension
 *
 *  @param {number} degree  Polynomial degree of the kernel
 *  @param {number} scale   Kernel scale
 *  @param {number} dist    Distance
 *  @return {number} The iso value at a given distance for a given polynomial degree and scale
 */
ScalisMath.GetIsoValueAtDistanceGeom1D = function (degree, scale, dist)
{
    if(degree%2!==0){
        throw "degree should be even";
    }

    if(dist < scale)
    {
        var func_dist_scale = 1.0 - (dist*dist) / (scale*scale);
        var iso_for_dist = 2.0 * scale * Math.sqrt(func_dist_scale);
        var k = 0;
        while(k!=degree)
        {
            k += 2;
            iso_for_dist *= k / (1.0 + k) * func_dist_scale;
        }
        return iso_for_dist;
    }
    else
    {
        return 0.0;
    }
};
/**
 * @global
 * @type {number} Normalization Factor for polynomial 4 in 1 dimension
 * @const
 */
ScalisMath.Poly4NF1D = 1.0/ScalisMath.GetIsoValueAtDistanceGeom1D(4,ScalisMath.KS,1.0);
/**
 * @global
 * @type {number} Normalization Factor for polynomial 6 in 1 dimension
 * @const
 */
ScalisMath.Poly6NF1D = 1.0/ScalisMath.GetIsoValueAtDistanceGeom1D(6,ScalisMath.KS,1.0);

/**
 *  Compute the iso value at a given distance for a given polynomial degree
 *  and scale in 2 dimensions
 *
 *  @param {number} degree  Polynomial degree of the kernel
 *  @param {number} scale   Kernel scale
 *  @param {number} dist    Distance
 *  @return {number} The iso value at a given distance for a given polynomial degree and scale
 */
ScalisMath.GetIsoValueAtDistanceGeom2D = function (degree, scale, dist)
{
    if(dist < scale)
    {
        var i_p_2 = degree+2;
        var func_dist_scale = 1.0 - (dist*dist) / (scale*scale);
        return (2.0 * Math.PI / i_p_2) * scale*scale * Math.pow(func_dist_scale, i_p_2 * 0.5);
    }
    else
    {
        return 0.0;
    }
};
/**
 * @global
 * @type {number} Normalization Factor for polynomial 4 in 2 dimension
 * @const
 */
ScalisMath.Poly4NF2D = 1.0/ScalisMath.GetIsoValueAtDistanceGeom2D(4,ScalisMath.KS,1.0);
/**
 * @global
 * @type {number} Normalization Factor for polynomial 6 in 2 dimension
 * @const
 */
ScalisMath.Poly6NF2D = 1.0/ScalisMath.GetIsoValueAtDistanceGeom2D(6,ScalisMath.KS,1.0);

module.exports = ScalisMath;





/**
 * @author Maxime Quiblier
 *
 */

'use strict';

const THREE = require("three-full/builds/Three.cjs.js");

var Convergence = {};

// Limitations: 3D only, but can easily be rewritten for nD
// The algorithm stops when :
// - 2 consecutive steps are smaller than epsilon
// - OR n_max_step is reached
// Optimization roads :
//      - 2 small steps may be too much, only 1 could be enough in most cases isn't it?
// @todo write documentation to talk about failure cases.
//
// Variable used in function. This avoid reallocation.
    Convergence.last_mov_pt = new THREE.Vector3();
    Convergence.grad = new THREE.Vector3();
    Convergence.eval_res_g = new THREE.Vector3(0,0,0);
    Convergence.eval_res = {v:0, g:null};
    Convergence.vec = new THREE.Vector3();

Convergence.safeNewton3D = function(    pot,              // Scalar Field to eval
                                        starting_point,   // 3D point where we start, must comply to THREE.Vector3 API
                                        value,            // iso value we are looking for
                                        epsilon,          // Geometrical limit to stop
                                        n_max_step,       // limit of number of step
                                        r_max,            // max distance where we look for the iso
                                        //bounding_v,       // Bounding volume inside which we look for the iso, getting out will make the process stop.
                                        res               // the resulting point
                                        )
{
        res.copy(starting_point);

        var i = 1;
        var consecutive_small_steps = 0;
        var broken = false;
        while( consecutive_small_steps != 2 && i<=n_max_step && !broken)
        {
            this.last_mov_pt.copy(res);

            this.eval_res.g = this.eval_res_g; // active gradient computation
            pot.value(res,this.eval_res) ;

            this.grad.copy(this.eval_res.g);
            if(this.grad.x !== 0.0 || this.grad.y !== 0.0 || this.grad.z !== 0.0 )
            {
                var g_l = this.grad.length();
                var step = (value-this.eval_res.v)/g_l;
                if(step < epsilon && step > -epsilon)
                {
                    if(step>0.0)
                    {
                        step = epsilon/g_l;
                    }
                    else
                    {
                        step = -epsilon/g_l;
                    }
                    consecutive_small_steps++;
                }
                else
                {
                    consecutive_small_steps = 0;
                }
                this.grad.normalize().multiplyScalar(step);
                res.add(this.grad);

                // If the newton step took us out of the bounding volume, we have to stop
                //if(!bounding_v.containsPoint(res))
                if( this.vec.subVectors(res,starting_point).lengthSq() > r_max*r_max)
                {
                    res.copy(starting_point);
                    return;
                }

                /*
                if( this.vec.subVectors(res,starting_point).lengthSq() > r_max*r_max)
                {
                    this.eval_res.g = null; // deactive gradient computation
                    var current_val = this.eval_res.v;
                    pot.value(res,this.eval_res);
                    if( (this.eval_res.v-value)*(current_val-value) < 0.0)   // can only use dichotomy if one point is inside and one outside among (res and last_mov_pt)
                    {
                        res.add(this.last_mov_pt);
                        res.multiplyScalar(0.5);
                    }
                    else
                    {
                        // In this case we have no clue what to do, so just break...
                        broken = true;
                    }
                }
                */
            }
            else
            {
                broken = true;
            }

            ++i;
        }

        if(broken){
            // return strating_point
            res.copy(starting_point);
            return;
        }

        /*
        if(broken){

            this.eval_res.g = null; // deactive gradient computation

            // Check the point between last_moving_point and starting_point which is closest to the surface and return it.
            pot.value(this.last_mov_pt,this.eval_res);
            var ev_last_mov_pt = this.eval_res.v;
            pot.value(starting_point,this.eval_res);
            var ev_st_pt = this.eval_res.v;
            if( Math.abs(ev_last_mov_pt-value) > Math.abs(starting_point-value) )
            {
                res.copy(starting_point);
                return;
            }
            else
            {
                res.copy(this.last_mov_pt);
                return;
            }
        }
        */
};


/** \brief This algorithm uses Newton convergence to find a point epsilon close to
*        a point "p" such that the given potential "pot" evaluated at "p" is "value".
*        The search is constrained on line defined by (origin, search_dir), and between bounds
*        defined by min_absc and max_absc which are the abscissae on the line with respect
*        to origin and search_dir. search_dir should be normalized.
*        The starting point is given with an abscissa : origin + starting_point_absc*search_dir
*
*   \param pot
*   \param origin Point choosen as origin in the search line frame.
*   \param search_dir unit vector that, together with origin, defines the searching line
*   \param min_absc Minimum abscissa on the line : the algorithm will not search for a point below this abscissa.
*   \param max_absc Maximum abscissa on the line : the algorithm will not search for a point above this abscissa.
*   \param starting_point_absc Abscissa of the starting point, with respect to the search dir.
*   \param value The potential value we are looking for on the line with respect to pot.Eval(..)
*   \param epsilon We want the result to be at least epsilon close to the surface with respect to the
*                   distance Vector.norm(), we suppose this norm to be the one associated with the dot product Vector.operator |
*   \param n_max_step Maximum of newton step before giving up.
*
*    \return true if a point p such that |pot.Eval(p) - value| < epsilon was found.
*           false and the current searching point otherwise.
*
*
*   @todo write documentation to talk about failure cases.
*   @todo Should not normalise search_dir. Change that here and in all part of code where this is used.
*/
Convergence.safeNewton1D = function(
                                        pot,
                                        origin,
                                        search_dir_unit,
                                        min_absc_inside,
                                        max_absc_outside,
                                        starting_point_absc,
                                        value,
                                        epsilon,
                                        n_max_step,
                                        res // resulting point res.p and gradient res.g (if res.g defined) resulting absc in res.p_absc
                                        )
{
    this.eval_res.g = this.eval_res_g; // active gradient computation

    if( !(search_dir_unit.x !== 0.0 || search_dir_unit.y !== 0.0 || search_dir_unit.z !== 0.0) ){
        throw "Error : search direction is null";
    }
    if(epsilon<=0){
        throw "Error: epsilon <= 0, convergence will nuke your face or loop";
    }
    if(starting_point_absc<min_absc_inside || starting_point_absc>max_absc_outside){
        throw "Error : starting absc is not in boundaries";
    }

    var curr_point_absc = starting_point_absc;
    var curr_field_value = 0;    // contain the field value at curr_point
    var eval_pt = new THREE.Vector3();

    // Newton step until we overpass the surface
    // the minimum step is set to epsilon, that ensure we will cross the surface.
    var grad = 0;
    var step = 0;
    var i = 0;
    while( max_absc_outside - min_absc_inside > epsilon && i < n_max_step)
    {
        // curr_point_absc is guaranteed inside [min_absc_inside,max_absc_outside]
        pot.value(  eval_pt.copy(search_dir_unit).multiplyScalar(curr_point_absc).add(origin),
                    this.eval_res) ;
        // update bounding absc
        if(this.eval_res.v > value)
        {
            min_absc_inside = curr_point_absc;
        }
        else
        {
            max_absc_outside = curr_point_absc;
        }

        // Analytical gradient evaluation + dot product should be less than 2 evaluations in cost.
        grad = this.eval_res.g.dot(search_dir_unit);
        if(grad !== 0.0)
        {
            step = (value-this.eval_res.v)/grad;
            curr_point_absc += step;

            // Dichotomy step
            if(curr_point_absc >= max_absc_outside || curr_point_absc <= min_absc_inside)
            {
                curr_point_absc = (max_absc_outside+min_absc_inside)*0.5;
            }

        }
        else
        {
            // Dichotomy step
            curr_point_absc = (max_absc_outside+min_absc_inside)*0.5;
        }

        ++i;
    }

    res.p_absc = (max_absc_outside+min_absc_inside)*0.5; // approximate
    res.p.copy(search_dir_unit).multiplyScalar(curr_point_absc).add(origin);
    if(res.g !== undefined){
        if(i===0){
            pot.value(  res.p,
                        this.eval_res) ;
        }
        res.g.copy(this.eval_res.g);
    }
};

Convergence.dichotomy1D = function(
                                        pot,
                                        origin,
                                        search_dir_unit,
                                        startStepLength,
                                        value,
                                        epsilon,
                                        n_max_step, // TODO : Useless, since dichotomia is absolutely determinist, n step is startStepLength/(2^n) accuracy...
                                                    //        OR epsilon is the one useless...
                                        res // resulting point res.p and gradient res.g (if res.g defined) resulting absc in res.p_absc
                                        )
{

    this.eval_res.g = null; // deactive gradient computation

    var previousPos = new THREE.Vector3().copy(origin);
    var currentStep = new THREE.Vector3();
    // intersection
    // dichotomia: first step is going back half of the previous distance
    startStepLength /= 2;
    var dist = -startStepLength;
    var previousDist = dist;
    origin.sub(
        currentStep.copy(search_dir_unit)
            .multiplyScalar(startStepLength));
    var nstep = 0;
    while((startStepLength > epsilon) && (nstep < n_max_step))
    {
        nstep++;
        previousPos.copy(origin);
        previousDist=dist;

        startStepLength/=2;
        // not asking for the next step, which is always half of previous
        pot.value(
            origin,
            this.eval_res);

        if (this.eval_res.v < value)
        {
            // before the surface: go forward
            origin.add(
                currentStep.copy(search_dir_unit)
                    .multiplyScalar(startStepLength));
            dist+=startStepLength;
        }
        else
        {
            // after the surface: go backward
            origin.sub(
                currentStep.copy(search_dir_unit)
                    .multiplyScalar(startStepLength));
            dist-=startStepLength;
        }
    }
    // linear interpolation with previous pos
    res.p.copy(origin.add(previousPos).divideScalar(2));
    res.p_absc = (previousDist + dist)/2;

    // linear interpolation with previous pos
    res.p.copy(origin);
    res.p_absc = dist;

    // test wether the caller wanted to compute the gradient
    // (we assume that if res.g is defined, it's a request)
    if (res.g)
    {
        this.eval_res.g = this.eval_res_g; // active gradient computation
        pot.value(
            res.p,
            this.eval_res);
        res.g.copy(this.eval_res.g);
    }

};

module.exports = Convergence;

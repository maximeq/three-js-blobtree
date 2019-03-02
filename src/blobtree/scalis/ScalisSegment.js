"use strict";

const THREE = require("three-full/builds/Three.cjs.js");
const Types = require("../Types.js");
const Material = require("../Material.js");
const ScalisPrimitive = require("./ScalisPrimitive.js");
const ScalisVertex = require("./ScalisVertex.js");
const ScalisMath = require("./ScalisMath.js");
const AreaScalisSeg = require("../areas/AreaScalisSeg.js");
const Accuracies = require("../accuracies/Accuracies.js");

/**
 *  Implicit segment class in the blobtree.
 *
 *  @constructor
 *  @extends ScalisPrimitive
 *
 *  @param {!ScalisVertex} v0 First vertex for the segment
 *  @param {!ScalisVertex} v1 Second vertex for the segment
 *  @param {!string} volType Volume type, can be ScalisPrimitive.CONVOL
 *                 (homothetic convolution surfaces, Zanni and al), or
 *                 ScalisPrimitive.DIST (classic weighted distance field)
 *  @param {number} density Density is another constant to modulate the implicit
 *                  field. Used only for DIST voltype.
 *  @param {!Array.<Material>} mats Material for this primitive.
 *                                   Use [Material.defaultMaterial.clone(), Material.defaultMaterial.clone()] by default.
 *
 */
var ScalisSegment = function(v0, v1, volType, density, mats) {
    ScalisPrimitive.call(this);

    this.v.length   = 2;
    this.v[0]       = v0;
    this.v[1]       = v1;
    v0.setPrimitive(this);
    v1.setPrimitive(this);

    this.volType     = volType;
    this.density     = density;
    this.materials   = mats;

    // Temporary for eval
    // TODO : should be wrapped in the eval function scope if possible (ie not precomputed)
    // CONVOL
    this.clipped_l1 = 1.0;
    this.clipped_l2 = 0.0;
    this.vector = new THREE.Vector3();
    this.cycle  = new THREE.Vector3();
    this.proj   = new THREE.Vector3();
    // helper attributes
    this.v0_p = this.v[0].getPos();
    this.v1_p = this.v[1].getPos(); // this one is probably useless to be kept for eval since not used....
    this.dir = new THREE.Vector3();
    this.lengthSq = 0;
    this.length = 0;
    this.unit_dir = new THREE.Vector3();
    // weight_p1 is convol's weight_p2 ( >_< )
    this.weight_p1 = 0;
    // c0 and c1 are convol's weight_coeff
    this.c0 = 0;
    this.c1 = 0;

    this.increase_unit_dir = new THREE.Vector3();
    this.p_min = new THREE.Vector3();
    this.weight_min = 0;
    this.inv_weight_min = 0;
    this.unit_delta_weight = 0;

    var bound_supp0 = 0;
    var bound_supp1 = 0;
    this.maxbound = 0;
    this.maxboundSq = 0;
    this.cyl_bd0 = 0;
    this.cyl_bd1 = 0;
    this.f0f1f2 = new THREE.Vector3();

    this.tmpVec1 = new THREE.Vector3();
    this.tmpVec2 = new THREE.Vector3();

    this.computeHelpVariables();
};

ScalisSegment.prototype = Object.create(ScalisPrimitive.prototype);
ScalisSegment.constructor = ScalisSegment;

ScalisSegment.type = "ScalisSegment";
Types.register(ScalisSegment.type, ScalisSegment);

ScalisSegment.prototype.getType = function(){
    return ScalisSegment.type;
};

ScalisSegment.prototype.toJSON = function() {
    var res = ScalisPrimitive.prototype.toJSON.call(this);
    res.density = this.density;
    return res;
};
ScalisSegment.fromJSON = function(json){
    var v0 = ScalisVertex.fromJSON(json.v[0]);
    var v1 = ScalisVertex.fromJSON(json.v[1]);
    var m = [
        Material.fromJSON(json.materials[0]),
        Material.fromJSON(json.materials[1])
    ];
    return new ScalisSegment(v0, v1, json.volType, json.density, m);
};

//  [Abstract] See ScalisPrimitive.mutableVolType for more details
ScalisSegment.prototype.mutableVolType = function() {
    return true;
};

/**
 *  @param {number} d The new density
 */
ScalisSegment.prototype.setDensity = function(d) {
    this.density = d;
    this.invalidAABB();
};

/**
 *  @return {number} The current density
 */
ScalisSegment.prototype.getDensity = function() {
    return this.density;
};

// [Abstract] See Primitive.setVolType for more details
ScalisSegment.prototype.setVolType = function(vt)
{
    if( !(vt == ScalisPrimitive.CONVOL || vt == ScalisPrimitive.DIST) ){
        throw "ERROR : volType must be set to ScalisPrimitive.CONVOL or ScalisPrimitive.DIST";
    }

    if(this.volType != vt){
        this.volType = vt;
        this.invalidAABB();
    }
};

// [Abstract] See Primitive.getVolType for more details
ScalisSegment.prototype.getVolType = function()
{
    return this.volType;
};

// [Abstract] See Primitive.prepareForEval for more details
ScalisSegment.prototype.prepareForEval = function() {
    if(!this.valid_aabb)
    {
        this.computeHelpVariables();
        this.valid_aabb = true;
    }
};

// [Abstract] See Primtive.getArea for more details
ScalisSegment.prototype.getAreas = function() {
    if(!this.valid_aabb){
        throw "ERROR : Cannot get area of invalid primitive";
        return [];
    }else{
        return [{
            aabb:this.aabb,
            //new THREE.Box3(-256, -256, -256, 256,256,256),
            //new THREE.Box3(this.aabb.min_x-min_thick,this.aabb.min_y-min_thick,this.aabb.min_z-min_thick,
            //this.aabb.max_x+min_thick,this.aabb.max_y+min_thick,this.aabb.max_z+min_thick),
            bv: new AreaScalisSeg(
                this.v[0].getPos(),
                this.v[1].getPos(),
                this.v[0].getThickness(),
                this.v[1].getThickness(),
                this.length,
                this.unit_dir),
            obj: this
        }];
    }
};

// [Abstract] See Primitive.computeHelpVariables for more details
ScalisSegment.prototype.computeHelpVariables = function() {
    this.v0_p = this.v[0].getPos();
    this.v1_p = this.v[1].getPos(); // this one is probably useless to be kept for eval since not used....

    this.dir.subVectors(this.v1_p,this.v0_p);
    this.lengthSq = this.dir.lengthSq();
    this.length = Math.sqrt(this.lengthSq);
    this.unit_dir.copy(this.dir).normalize();

    this.weight_p1 = this.v[1].getThickness();
    this.c0 = this.v[0].getThickness();
    this.c1 = this.v[1].getThickness() - this.v[0].getThickness();

    // Bounding property
    // bounding box is axis aligned so the bounding is not very tight.
    var bound_supp0 = this.v[0].getThickness()*ScalisMath.KS;
    var bound_supp1 = this.v[1].getThickness()*ScalisMath.KS;

    this.maxbound = Math.max(bound_supp0,bound_supp1);
    this.maxboundSq = this.maxbound*this.maxbound;

    // Speed up var for cylinder bounding
    // Used only in evalConvol
    this.cyl_bd0 = Math.min(-bound_supp0, this.length-bound_supp1);
    this.cyl_bd1 = Math.max(this.length+bound_supp1, bound_supp0);

    this.increase_unit_dir.copy(this.unit_dir);
    // weight help variables
    if (this.c1 < 0)
    {
        this.p_min.copy(this.v1_p);
        this.weight_min = this.weight_p1;
        this.inv_weight_min = 1 / this.weight_p1;
        this.increase_unit_dir.negate();
        this.unit_delta_weight = -this.c1 / this.length;
    }
    else
    {
        this.p_min.copy(this.v0_p);
        // weight_p0 is c0
        this.weight_min = this.c0;
        this.inv_weight_min = 1 / this.c0;
        this.unit_delta_weight = this.c1/ this.length;
    }

    this.computeAABB();
};

// [Abstract] See Primitive.value for more details
ScalisSegment.prototype.value = function(p,res) {
    switch(this.volType){
    case ScalisPrimitive.DIST:
        this.evalDist(p,res);
        break;
    case ScalisPrimitive.CONVOL:
        this.evalConvol(p,res);
        break;
    default:
        throw "Unknown volType, cannot evaluate.";
        break;
    }
};

///////////////////////////////////////////////////////////////////////////
// Distance Evaluation functions and auxiliaary functions
// Note : for the mech primitive we use a CompactPolynomial6 kernel.
//        TODO : the orga should use the same for better smoothness

/**
 *  value function for Distance volume type (distance field).
 */
ScalisSegment.prototype.evalDist = (function(){
    var ev_eps = {v:0};
    var p_eps = new THREE.Vector3();
    return function(p,res) {

        var p0_to_p = this.vector;
        p0_to_p.subVectors(p,this.v[0].getPos());

        // Documentation : see DistanceHomothetic.pdf in convol/Documentation/Convol-Core/
        var orig_p_scal_dir = p0_to_p.dot(this.dir);
        var orig_p_sqr = p0_to_p.lengthSq();

        var denum = this.lengthSq * this.c0 + orig_p_scal_dir * this.c1;
        var t = (this.c1<0) ? 0 : 1;
        if(denum > 0.0)
        {
            t = orig_p_scal_dir * this.c0 + orig_p_sqr * this.c1;
            t = (t<0.0) ? 0.0 : ((t>denum) ? 1.0 : t/denum) ; // clipping (nearest point on segment not line)
        }

        // Optim the below code... But keep the old code it's more understandable
        var proj_p_l = Math.sqrt(t*(t*this.lengthSq-2*orig_p_scal_dir)+orig_p_sqr);
        //var proj_to_point = this.proj;
        //proj_to_point.set(
        //    t*this.dir.x - p0_to_p.x,
        //    t*this.dir.y - p0_to_p.y,
        //    t*this.dir.z - p0_to_p.z
        //);
        //var proj_p_l = proj_to_point.length();

        var weight_proj = this.c0 + t*this.c1;
        res.v = this.density*ScalisMath.Poly6Eval(proj_p_l/weight_proj)*ScalisMath.Poly6NF0D;

        ///////////////////////////////////////////////////////////////////////
        // Material computation : by orthogonal projection
        if(res.m){
            this.evalMat(p,res);
        }

        // IMPORTANT NOTE :
        // We should use an analytical gradient here. It should be possible to
        // compute.
        if(res.g){
            var epsilon = 0.00001;
            var d_over_eps = this.density/epsilon;
            p_eps.copy(p);
            p_eps.x += epsilon;
            this.evalDist(p_eps, ev_eps);
            res.g.x = d_over_eps*(ev_eps.v-res.v);
            p_eps.x -= epsilon;

            p_eps.y += epsilon;
            this.evalDist(p_eps,ev_eps);
            res.g.y = d_over_eps*(ev_eps.v-res.v);
            p_eps.y -= epsilon;

            p_eps.z += epsilon;
            this.evalDist(p_eps,ev_eps);
            res.g.z = d_over_eps*(ev_eps.v-res.v);
        }
    };
})();

/**
 *
 * @param {THREE.Vector3} p Evaluation point
 * @param {Object} res Resulting material will be in res.m
 */
ScalisSegment.prototype.evalMat = function(p,res){
    var p0_to_p = this.vector;
    p0_to_p.subVectors(p,this.v[0].getPos());
    var udir_dot = this.unit_dir.dot(p0_to_p);
    var s = (udir_dot/this.length);

    // Material interpolation
    if(s>1.0)
    {
        res.m.copy(this.materials[1]);
    }
    else
    {
        if(s<=0.0)
        {
            res.m.copy(this.materials[0]);
        }
        else
        {
            // (1-s)*m0 + s*m1
            res.m.copy(this.materials[0]);
            res.m.lerp(this.materials[1], s);
        }
    }
};

/**
 *  @param {!THREE.Vector3} w special_coeff
 *  @return {boolean}
 */
ScalisSegment.prototype.HomotheticClippingSpecial = function(w)
{
    // we search solution t \in [0,1] such that at^2-2bt+c<=0
    var a = -w.z;
    var b = -w.y;
    var c = -w.x;

    var delta = b*b - a*c;
    if(delta>=0.0)
    {
        var b_p_sqrt_delta = b+Math.sqrt(delta);
        if( (b_p_sqrt_delta<0.0) || (this.length*b_p_sqrt_delta<c) )
        {
            return false;
        }
        else
        {
            var main_root = c / b_p_sqrt_delta;
            this.clipped_l1 = (main_root<0.0) ? 0.0 : main_root;
            var a_r = a*main_root;
            this.clipped_l2 = (2.0*b<a_r+a*this.length) ? c/(a_r) : this.length;
            return true;
        }
    }
    return false;
};

// [Abstract] see ScalisPrimitive.heuristicStepWithin
ScalisSegment.prototype.heuristicStepWithin = function() {
        return this.weight_min / 3;
};

///////////////////////////////////////////////////////////////////////////
// Convolution Evaluation functions and auxiliaary functions
/**
 *  value function for Convol volume type (Homothetic convolution).
 */
ScalisSegment.prototype.evalConvol = function(p, res) {
    if(!this.valid_aabb){
        throw "Error : prepareForEval should have been called";
    }
    // init
    if(res.g)
        res.g.set(0,0,0);
    res.v=0;

    var p_min_to_point = this.tmpVec1;
    p_min_to_point.subVectors(p,this.p_min);

    var uv = this.increase_unit_dir.dot(p_min_to_point);
    var d2 = p_min_to_point.lengthSq();

    var special_coeff = this.tmpVec2;
    special_coeff.set(
        this.weight_min*this.weight_min - ScalisMath.KIS2 * d2,
            -this.unit_delta_weight*this.weight_min - ScalisMath.KIS2 * uv ,
        this.unit_delta_weight*this.unit_delta_weight - ScalisMath.KIS2 );

    // clipped_l1, clipped_l2 are members of segment
    if(this.HomotheticClippingSpecial(special_coeff))
    {
        var inv_local_min_weight = 1.0 / (this.weight_min + this.clipped_l1 * this.unit_delta_weight);
        special_coeff.x = 1.0 - ScalisMath.KIS2 * ( this.clipped_l1*(this.clipped_l1-2.0*uv) + d2 ) * inv_local_min_weight*inv_local_min_weight;
        special_coeff.y = - this.unit_delta_weight - ScalisMath.KIS2*(uv-this.clipped_l1) * inv_local_min_weight;

        if (res.g) //both grad and value
        {
            if(this.unit_delta_weight >= 0.06) { // ensure a maximum relative error of ??? (for degree i up to 8)
                this.HomotheticCompactPolynomial_segment_FGradF_i6( (this.clipped_l2-this.clipped_l1) *
                                                                    inv_local_min_weight,
                                                                    this.unit_delta_weight,
                                                                    special_coeff);
            }else{
                this.HomotheticCompactPolynomial_approx_segment_FGradF_i6( (this.clipped_l2-this.clipped_l1) *
                                                                           inv_local_min_weight,
                                                                           this.unit_delta_weight,
                                                                           this.inv_weight_min,
                                                                           special_coeff);
            }


            res.v = ScalisMath.Poly6NF1D * this.f0f1f2.x;
            this.f0f1f2.y *= inv_local_min_weight;
            res.g
                .copy(this.increase_unit_dir)
                .multiplyScalar(this.f0f1f2.z + this.clipped_l1 * this.f0f1f2.y)
                .sub(p_min_to_point.multiplyScalar(this.f0f1f2.y))
                .multiplyScalar(ScalisMath.Poly6NF1D*6.0*ScalisMath.KIS2*inv_local_min_weight);
        }
        else //value only
        {
            if(this.unit_delta_weight >= 0.06) { // ensure a maximum relative error of ??? (for degree i up to 8)
                res.v=ScalisMath.Poly6NF1D *
                    this.HomotheticCompactPolynomial_segment_F_i6( (this.clipped_l2-this.clipped_l1) *
                                                                   inv_local_min_weight,
                                                                   this.unit_delta_weight,
                                                                   special_coeff);
            }else{
                res.v=ScalisMath.Poly6NF1D *
                    this.HomotheticCompactPolynomial_approx_segment_F_i6( (this.clipped_l2-this.clipped_l1) *
                                                                          inv_local_min_weight,
                                                                          this.unit_delta_weight,
                                                                          inv_local_min_weight,
                                                                          special_coeff);
            }
        }

        if(res.m){
            this.evalMat(p,res);
        }
    }
};

/**
 *  Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
 *  @param {number} a
 *  @param {number} b
 *  @param {number} c
 *  @return {number} Clamped value
 *  Author: Jakub Korzeniowski
 *  Agency: Softhis
 *  http://www.softhis.com
 */
ScalisSegment.prototype.clamp = function (a,b,c){return Math.max(b,Math.min(c,a));};

// [Abstract] see ScalisPrimitive.distanceTo
ScalisSegment.prototype.distanceTo = function ()
{
    var tmpVector = new THREE.Vector3();
    var tmpVectorProj = new THREE.Vector3();
    return function(p) {
        // var thickness = Math.min(this.c0,this.c0+this.c1);

        // return distance point/segment
        // don't take thickness into account
        var t = tmpVector.subVectors(p,this.v[0].getPos())
            .dot(this.dir) / this.lengthSq;

        // clamp is our own function declared there
        t=this.clamp(t,0,1);
        tmpVectorProj.copy(this.dir)
            .multiplyScalar(t)
            .add(this.v[0].getPos());
        return p.distanceTo(tmpVectorProj);
    };
}();

/**
 *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).*
 *  Function designed by Cedric Zanni, optimized for C++ using matlab.
 *  @param {number} l
 *  @param {number} d
 *  @param {!Object} w
 *  @return {number} the value
 */
ScalisSegment.prototype.HomotheticCompactPolynomial_segment_F_i6 = function( l,  d,  w)
{
    var t6247 = d * l + 0.1e1;
    var t6241 = 0.1e1 / t6247;
    var t6263 = t6247 * t6247;
    var t2 = t6263 * t6263;
    var t6244 = 0.1e1 / t2;
    var t6252 = w.y;
    var t6249 = t6252 * t6252;
    var t6273 = 0.12e2 * t6249;
    var t6258 = 0.1e1 / d;
    var t6271 = t6252 * t6258;
    var t6264 = t6247 * t6263;
    var t6257 = l * l;
    var t6260 = t6257 * t6257;
    var t6259 = l * t6257;
    var t6254 = l * t6260;
    var t6253 = w.x;
    var t6251 = w.z;
    var t6250 = t6253 * t6253;
    var t6248 = t6251 * t6251;
    var t3 = t6264 * t6264;
    var t6246 = 0.1e1 / t3;
    var t6245 = t6241 * t6244;
    var t6243 = 0.1e1 / t6264;
    var t6242 = 0.1e1 / t6263;
    var t71 = Math.log(t6247);
    var t93 = t6259 * t6259;
    return  -t6248 * (((((-(t6241 - 0.1e1) * t6258 - l * t6242) * t6258 - t6257 * t6243) * t6258 - t6259 * t6244) * t6258 - t6260 * t6245) * t6258 - t6254 * t6246) * t6271 + (-t6253 * (t6246 - 0.1e1) * t6258 / 0.6e1 - (-(t6245 - 0.1e1) * t6258 / 0.5e1 - l * t6246) * t6271) * t6250 + ((t6253 * t6273 + 0.3e1 * t6251 * t6250) * (0.2e1 / 0.5e1 * (-(t6244 - 0.1e1) * t6258 / 0.4e1 - l * t6245) * t6258 - t6257 * t6246) + (0.3e1 * t6248 * t6253 + t6251 * t6273) * (0.4e1 / 0.5e1 * (0.3e1 / 0.4e1 * (0.2e1 / 0.3e1 * (-(t6242 - 0.1e1) * t6258 / 0.2e1 - l * t6243) * t6258 - t6257 * t6244) * t6258 - t6259 * t6245) * t6258 - t6260 * t6246) + t6251 * t6248 * (0.6e1 / 0.5e1 * (0.5e1 / 0.4e1 * (0.4e1 / 0.3e1 * (0.3e1 / 0.2e1 * (0.2e1 * (t71 * t6258 - l * t6241) * t6258 - t6257 * t6242) * t6258 - t6259 * t6243) * t6258 - t6260 * t6244) * t6258 - t6254 * t6245) * t6258 - t93 * t6246) + (-0.12e2 * t6251 * t6253 - 0.8e1 * t6249) * (0.3e1 / 0.5e1 * ((-(t6243 - 0.1e1) * t6258 / 0.3e1 - l * t6244) * t6258 / 0.2e1 - t6257 * t6245) * t6258 - t6259 * t6246) * t6252) * t6258 / 0.6e1;
};

/**
 *  Sub-function for optimized convolution value computation (Homothetic Compact Polynomial).
 *  (Approximation? Faster?).
 *  Function designed by Cedric Zanni, optimized for C++ using matlab.
 *  @param {number} l
 *  @param {number} d
 *  @param {number} q
 *  @param {!Object} w
 */
ScalisSegment.prototype.HomotheticCompactPolynomial_approx_segment_F_i6 = function ( l,  d,  q,  w)
{
    var t6386 = q * d;
    var t6361 = t6386 + 0.1e1;
    var t6387 = 0.1e1 / t6361;
    var t1 = t6361 * t6361;
    var t2 = t1 * t1;
    var t6359 = t6387 / t2 / t1;
    var t6363 = w.z;
    var t6364 = w.y;
    var t6365 = w.x;
    var t6366 = l * l;
    var t6356 = t6363 * t6366 - 0.2e1 * t6364 * l + t6365;
    var t9 = t6364 * t6364;
    var t6357 = t6363 * t6365 - t9;
    var t6358 = t6363 * l - t6364;
    var t6377 = t6365 * t6365;
    var t6381 = t6364 * t6377;
    var t6369 = t6356 * t6356;
    var t6383 = t6358 * t6369;
    var t6362 = 0.1e1 / t6363;
    var t6384 = t6357 * t6362;
    var t6385 = 0.6e1 / 0.35e2 * (0.4e1 / 0.3e1 * (0.2e1 * t6357 * l + t6358 * t6356 + t6364 * t6365) * t6384 + t6383 + t6381) * t6384 + t6356 * t6383 / 0.7e1 + t6365 * t6381 / 0.7e1;
    var t6380 = t6362 * t6385;
    var t6360 = t6387 * t6359;
    var t6355 = t6369 * t6369;
    var t27 = t6377 * t6377;
    var t6353 = t6364 * t6380 + t6355 / 0.8e1 - t27 / 0.8e1;
    var t6352 = -l * t6355 + (-0.10e2 * t6364 * t6353 + t6365 * t6385) * t6362;
    var t65 = q * q;
    return  t6380 - 0.7e1 * d * t6353 * t6362 + (-0.1111111111e0 * (0.3e1 * t6359 - 0.300e1 + 0.7e1 * (0.2e1 + t6360) * t6386) * t6352 - 0.1000000000e0 * (0.2e1 - 0.200e1 * t6359 - 0.7e1 * (0.1e1 + t6360) * t6386) / q * (-0.1e1 * t6366 * t6355 + (0.1333333333e1 * t6364 * t6352 + 0.2e1 * t6365 * t6353) * t6362)) * t6362 / t65;
};

/**
 *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
 *  Function designed by Cedric Zanni, optimized for C++ using matlab.
 *  Result is stored in this.f0f1f2
 *  @param {number} l
 *  @param {number} d
 *  @param {!Object} w
 *
 */
ScalisSegment.prototype.HomotheticCompactPolynomial_segment_FGradF_i6 = function( l,  d,  w)
{
    var t6320 = d * l + 0.1e1;
    var t6314 = 0.1e1 / t6320;
    var t6336 = t6320 * t6320;
    var t2 = t6336 * t6336;
    var t6317 = 0.1e1 / t2;
    var t6325 = w.y;
    var t6322 = t6325 * t6325;
    var t6351 = 0.2e1 * t6322;
    var t6324 = w.z;
    var t6326 = w.x;
    var t6350 = t6324 * t6326 / 0.3e1 + 0.2e1 / 0.3e1 * t6322;
    var t6321 = t6324 * t6324;
    var t6349 = t6321 / 0.6e1;
    var t6348 = -0.2e1 / 0.3e1 * t6324;
    var t6337 = t6320 * t6336;
    var t6316 = 0.1e1 / t6337;
    var t6318 = t6314 * t6317;
    var t7 = t6337 * t6337;
    var t6319 = 0.1e1 / t7;
    var t6330 = l * l;
    var t6331 = 0.1e1 / d;
    var t6332 = l * t6330;
    var t6309 = 0.3e1 / 0.5e1 * ((-(t6316 - 0.1e1) * t6331 / 0.3e1 - l * t6317) * t6331 / 0.2e1 - t6330 * t6318) * t6331 - t6332 * t6319;
    var t6347 = t6309 * t6325;
    var t6311 = -(t6318 - 0.1e1) * t6331 / 0.5e1 - l * t6319;
    var t6323 = t6326 * t6326;
    var t6346 = t6323 * t6311;
    var t6310 = 0.2e1 / 0.5e1 * (-(t6317 - 0.1e1) * t6331 / 0.4e1 - l * t6318) * t6331 - t6330 * t6319;
    var t6345 = t6326 * t6310;
    var t6344 = -t6323 * (t6319 - 0.1e1) / 0.6e1;
    var t6333 = t6330 * t6330;
    var t6327 = l * t6333;
    var t6315 = 0.1e1 / t6336;
    var t6308 = 0.4e1 / 0.5e1 * (0.3e1 / 0.4e1 * (0.2e1 / 0.3e1 * (-(t6315 - 0.1e1) * t6331 / 0.2e1 - l * t6316) * t6331 - t6330 * t6317) * t6331 - t6332 * t6318) * t6331 - t6333 * t6319;
    var t6307 = ((((-(t6314 - 0.1e1) * t6331 - l * t6315) * t6331 - t6330 * t6316) * t6331 - t6332 * t6317) * t6331 - t6333 * t6318) * t6331 - t6327 * t6319;
    var t81 = t6332 * t6332;
    var t92 = Math.log(t6320);
    this.f0f1f2.x = (t6326 * t6344 - t6325 * t6346 + t6345 * t6351 - 0.4e1 / 0.3e1 * t6322 * t6347 + (t6323 * t6310 / 0.2e1 + t6308 * t6351 - 0.2e1 * t6326 * t6347) * t6324 + (t6326 * t6308 / 0.2e1 - t6325 * t6307 + (-t81 * t6319 / 0.6e1 + (-t6327 * t6318 / 0.5e1 + (-t6333 * t6317 / 0.4e1 + (-t6332 * t6316 / 0.3e1 + (-t6330 * t6315 / 0.2e1 + (t92 * t6331 - l * t6314) * t6331) * t6331) * t6331) * t6331) * t6331) * t6324) * t6321) * t6331;
    this.f0f1f2.y = (t6344 + t6310 * t6350 + t6308 * t6349 + (-0.2e1 / 0.3e1 * t6326 * t6311 + t6309 * t6348) * t6325) * t6331;
    this.f0f1f2.z = (t6346 / 0.6e1 + t6309 * t6350 + t6307 * t6349 + (-0.2e1 / 0.3e1 * t6345 + t6308 * t6348) * t6325) * t6331;
};

/**
 *  Sub-function for optimized convolution value and gradient computation (Homothetic Compact Polynomial).
 *  Function designed by Cedric Zanni, optimized for C++ using matlab.
 *  Result is stored in this.f0f1f2
 *  @param {number} l
 *  @param {number} d
 *  @param {!Object} w
 */
ScalisSegment.prototype.HomotheticCompactPolynomial_approx_segment_FGradF_i6 = function ( l,  d,  q,  w)
{
    var t6478 = q * d;
    var t6443 = t6478 + 0.1e1;
    var t6479 = 0.1e1 / t6443;
    var t1 = q * q;
    var t6449 = 0.1e1 / t1;
    var t2 = t6443 * t6443;
    var t3 = t2 * t2;
    var t6441 = t6479 / t3 / t2;
    var t6448 = w.x;
    var t6477 = 0.2e1 * t6448;
    var t6446 = w.z;
    var t6444 = 0.1e1 / t6446;
    var t6476 = d * t6444;
    var t6447 = w.y;
    var t6451 = l * l;
    var t6438 = t6446 * t6451 - 0.2e1 * t6447 * l + t6448;
    var t6455 = t6438 * t6438;
    var t6437 = t6438 * t6455;
    var t6463 = t6448 * t6448;
    var t6445 = t6448 * t6463;
    var t10 = t6447 * t6447;
    var t6439 = t6446 * t6448 - t10;
    var t6440 = t6446 * l - t6447;
    var t6470 = t6439 * t6444;
    var t6433 = 0.4e1 / 0.3e1 * (0.2e1 * t6439 * l + t6440 * t6438 + t6447 * t6448) * t6470 + t6440 * t6455 + t6447 * t6463;
    var t6473 = t6433 / 0.5e1;
    var t6432 = t6447 * t6444 * t6473 + t6437 / 0.6e1 - t6445 / 0.6e1;
    var t6429 = -l * t6437 + (-0.8e1 * t6447 * t6432 + t6448 * t6473) * t6444;
    var t6469 = t6451 * t6437;
    var t6427 = -t6469 + (0.10e2 / 0.7e1 * t6447 * t6429 + t6432 * t6477) * t6444;
    var t6475 = -t6427 / 0.8e1;
    var t6474 = 0.6e1 / 0.35e2 * t6433 * t6470 + t6440 * t6437 / 0.7e1 + t6447 * t6445 / 0.7e1;
    var t6442 = t6479 * t6441;
    var t6472 = (0.3e1 * t6441 - 0.300e1 + 0.7e1 * (0.2e1 + t6442) * t6478) * t6449;
    var t6471 = (0.2e1 - 0.200e1 * t6441 - 0.7e1 * (0.1e1 + t6442) * t6478) / q * t6449;
    var t6468 = t6444 * t6472;
    var t6467 = t6444 * t6471;
    var t6466 = t6444 * t6474;
    var t6436 = t6455 * t6455;
    var t57 = t6463 * t6463;
    var t6430 = t6447 * t6466 + t6436 / 0.8e1 - t57 / 0.8e1;
    var t6428 = -l * t6436 + (-0.10e2 * t6447 * t6430 + t6448 * t6474) * t6444;
    this.f0f1f2.x = t6466 - 0.7e1 * t6430 * t6476 - t6428 * t6468 / 0.9e1 - (-t6451 * t6436 + (0.4e1 / 0.3e1 * t6447 * t6428 + t6430 * t6477) * t6444) * t6467 / 0.10e2;
    this.f0f1f2.y = (t6473 - 0.7e1 * d * t6432 - t6429 * t6472 / 0.7e1 + t6471 * t6475) * t6444;
    this.f0f1f2.z = t6432 * t6444 + t6429 * t6476 + t6468 * t6475 - (-l * t6469 + (0.3e1 / 0.2e1 * t6447 * t6427 - 0.3e1 / 0.7e1 * t6448 * t6429) * t6444) * t6467 / 0.9e1;
};
// End of organic evaluation functions
////////////////////////////////////////////////////////////////////////////

module.exports = ScalisSegment;

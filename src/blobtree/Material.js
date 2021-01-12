'use strict';

const THREE = require("@dualbox/three");

/**
 *  Material object for blobtree. It is an internal material, that should especially
 *  be used in implicit elements. It is the internal representation of the material,
 *  not the openGL material that will be used for display.
 *  @constructor
 *
 *  @param {!Object} params Parameters for the material. As a dictionary to be easily extended later.
 *
 *  @param {THREE.Color?}   params.color        Base diffuse color for the material.
 *                                              Defaults to #aaaaaa
 *
 *  @param {number?}        params.roughness    Roughness for the material.
 *                                              Defaults to 0.
 *
 *  @param {number?}        params.metalness    Metalness aspect of the material, 1 for metalness, 0 for dielectric.
 *                                              Defaults to 0.
 *
 *  @param {THREE.Color?} params.emissive       Emissive color for the material.
 *                                              Defaults to pitch black. (no light emission)
 */
var Material = function (params) {

    params = params || {};

    if(arguments[1] !== undefined){
        throw "Error : Blobtree Material now takes only 1 argument.";
    }

    this.color = new THREE.Color(params.color !== undefined ? params.color : 0xaaaaaa);
    this.roughness = params.roughness !== undefined ? params.roughness : 0;
    this.metalness = params.metalness !== undefined ? params.metalness : 0;
    this.emissive = new THREE.Color( params.emissive !== undefined ? params.emissive : 0x000000 );

};

Material.prototype.toJSON = function()
{
    return {
        color: "#" + this.color.getHexString(),
        roughness: this.roughness,
        metalness: this.metalness,
        emissive: `#${this.emissive.getHexString()}`
    };
};

Material.fromJSON = function(json)
{
    return new Material({
        color: new THREE.Color( json.color ),
        roughness: json.roughness,
        metalness: json.metalness,
        emissive: json.emissive, // If undefined, will default to pitch black. If not, will load the hex string.
    });
};

/**
 *  Return a clone of the material
 *  @return {!Material} The new material
 */
Material.prototype.clone = function()
{
    return new Material({
        color: this.color,
        roughness: this.roughness,
        metalness: this.metalness,
        emissive: this.emissive,
    });
};

/**
 *  Copy the given material parameters
 *  @param {!Material} mat Material to be copied
 */
Material.prototype.copy = function(mat)
{
    this.color.copy(mat.color);
    this.roughness = mat.roughness;
    this.metalness = mat.metalness;
    this.emissive.copy( mat.emissive );
};

/**
 *  @deprecated Use setParams instead
 *  Set Material parameters at once. DEPRECATED. Use setParams
 *  @param {THREE.Color!} c Color
 *  @param {number!} r roughness
 *  @param {number!} m Metalness
 */
Material.prototype.set = function(c, r, m)
{
    this.color.copy(c);
    this.roughness = r;
    this.metalness = m;
};

/**
 *  Set Material parameters (all or just some)
 *
 *  @param {!Object} params Parameters for the material. As a dictionary to be easily extended later.
 *  @param {THREE.Color?}   params.color        Base diffuse color for the material.
 *  @param {number?}        params.roughness    Roughness for the material.
 *  @param {number?}        params.metalness    Metalness aspect of the material, 1 for metalness, 0 for dielectric.
 *  @param {THREE.Color?} params.emissive       Emissive color for the material.
 */
Material.prototype.setParams = function (params)
{
    this.color.copy(params.color ? params.color : this.color);
    this.roughness = params.roughness !== undefined ? params.roughness : this.roughness;
    this.metalness = params.metalness !== undefined ? params.metalness : this.metalness;
    this.emissive.copy( params.emissive !== undefined ? params.emissive : this.emissive );
};

/** @return {THREE.Color} */
Material.prototype.getColor = function()       { return this.color;    };

/** @return {number} */
Material.prototype.getRoughness = function()   { return this.roughness;};

/** @return {number} */
Material.prototype.getMetalness = function()  { return this.metalness;  };

/** @return {THREE.Color} */
Material.prototype.getEmissive = function() { return this.emissive; }


Material.prototype.equals = function(m)  {
    return this.color.equals(m.color) &&
        this.metalness=== m.metalness &&
        this.roughness === m.roughness &&
        this.emissive.equals( m.emissive );
};

/**
 *  Perform a linear interpolation between this material and a given other.
 * (1-s)*this + s*m = this +(m1-this)*s
 *  @param {!Material} m The material to interpolate with this
 *  @param {number} s the interpolation coefficient
 */
Material.prototype.lerp = function(m,s)
{
    this.color.lerp(m.color,s);
    this.roughness = (1-s)*this.roughness + s*m.roughness;
    this.metalness = (1-s)*this.metalness + s*m.metalness;
    this.emissive.lerp( m.emissive, s );
};
/**
 *  Used in triangles (ok it's specific, still we need it :)
 *  Linear interpolation over a triangle? Store the result in this
 *  @param {!Material} m1 The material of first corner
 *  @param {!Material} m2 The material of second corner
 *  @param {!Material} m3 The material of third corner
 *  @param {number} a1 the interpolation coefficient 1
 *  @param {number} a2 the interpolation coefficient 2
 *  @param {number} a3 the interpolation coefficient 3
 *  @param {number} denum Normalizing the result (division)
 *  @return {Material} this
 */
Material.prototype.triMean = function(m1,m2,m3,a1,a2,a3,denum)
{
    this.color.r = (a1*m1.color.r + a2*m2.color.r + a3*m3.color.r)/denum;
    this.color.g = (a1*m1.color.g + a2*m2.color.g + a3*m3.color.g)/denum;
    this.color.b = (a1*m1.color.b + a2*m2.color.b + a3*m3.color.b)/denum;

    this.roughness = (a1*m1.roughness + a2*m2.roughness + a3*m3.roughness)/denum;

    this.metalness = (a1*m1.metalness + a2*m2.metalness + a3*m3.metalness)/denum;

    this.emissive.r = (a1*m1.emissive.r + a2*m2.emissive.r + a3*m3.emissive.r)/denum;
    this.emissive.g = (a1*m1.emissive.g + a2*m2.emissive.g + a3*m3.emissive.g)/denum;
    this.emissive.b = (a1*m1.emissive.b + a2*m2.emissive.b + a3*m3.emissive.b)/denum;

    return this;
};

/**
 *  Perform a weighted mean over several materials and set to this.
 *  Note that m_arr.length must equals v_arr.length
 *  @param {Array.<!Material>} m_arr Array of materials
 *  @param {Array.<number>|Float32Array} v_arr Array of values being the corresponding weights
 *  @param {number=} n Can be set if you want to mean only the n first element of the arrays
 */
Material.prototype.weightedMean = function(m_arr,v_arr, n)
{
    this.color.setRGB(0,0,0);
    this.roughness = 0;
    this.metalness = 0;
    this.emissive.setScalar( 0 );
    const l = (n === undefined) ? m_arr.length : n;
    let sum_v = 0.0;

    for ( let i = 0; i < l; ++ i ) {

        this.color.r += v_arr[i]*m_arr[i].color.r;
        this.color.g += v_arr[i]*m_arr[i].color.g;
        this.color.b += v_arr[i]*m_arr[i].color.b;
        this.roughness += v_arr[i]*m_arr[i].roughness;
        this.metalness += v_arr[i]*m_arr[i].metalness;
        this.emissive.r += v_arr[i]*m_arr[i].emissive.r;
        this.emissive.g += v_arr[i]*m_arr[i].emissive.g;
        this.emissive.b += v_arr[i]*m_arr[i].emissive.b;
        sum_v += v_arr[i];

    }

    if(sum_v !== 0){
        this.color.r /= sum_v;
        this.color.g /= sum_v;
        this.color.b /= sum_v;
        this.roughness /= sum_v;
        this.metalness /= sum_v;
        this.emissive.r /= sum_v;
        this.emissive.g /= sum_v;
        this.emissive.b /= sum_v;
    }else{
        this.color.setScalar( 0 );
        this.roughness = 0;
        this.metalness = 0;
        this.emissive.setScalar( 0 );
    }

    return this;
};

// Other static functions
/**
 *  Compare arrays of materials.
 *
 *  @deprecated
 *
 *  @param {Array.<Material>} arr1
 *  @param {Array.<Material>} arr2
 *  @param {Array.<Material>=} arr3
 *  @param {Array.<Material>=} arr4
 *  @param {Array.<Material>=} arr5
 *
 *  @return {boolean} true if and only if all arguments are arrays of the same length and containing the same material values.
 */
Material.areEqualsArrays = function(arr1, arr2, arr3, arr4, arr5){

    console.warn("Material.areEqualsArrays is deprecated, please use your own comparison function using Material.equals.");

    var res = true;
    // check for nullity
    for (var i = 1; i < arguments.length; i++) {
        res = res && ((arr1 === null && arguments[i]===null) || (arr1 !== null && arguments[i]!==null));
    }
    if(!res){return res;} // Case : at least one arr is null but not all

    if(arr1 === null){return true;} // case all null

    for (var i = 1; i < arguments.length; i++) {
        var equals = true;
        if(arguments[i].length !== arr1.length){
            return false;
        }
        for(var k=0; k<arr1.length; ++k){
            equals = equals && arr1[k].equals(arguments[i][k]);
        }
        res = res && equals;
    }
    return res;
};

Material.defaultMaterial = new Material();

module.exports = Material;







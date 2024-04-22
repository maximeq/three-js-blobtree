export type MaterialJSON = Object;
/**
 * @property {string} color
 * @property {number} roughness
 * @property {number} metalness
 * @property {string} emissive
 */
/**
 *  Material object for blobtree. It is an internal material, that should especially
 *  be used in implicit elements. It is the internal representation of the material,
 *  not the openGL material that will be used for display.
 *  @constructor
 *
 *  @param {!Object} params Parameters for the material. As a dictionary to be easily extended later.
 *
 *  @param {Color?}   params.color        Base diffuse color for the material.
 *                                              Defaults to #aaaaaa
 *
 *  @param {number?}        params.roughness    Roughness for the material.
 *                                              Defaults to 0.
 *
 *  @param {number?}        params.metalness    Metalness aspect of the material, 1 for metalness, 0 for dielectric.
 *                                              Defaults to 0.
 *
 *  @param {Color?} params.emissive       Emissive color for the material.
 *                                              Defaults to pitch black. (no light emission)
 */
export declare class Material {
    static defaultMaterial: Material;
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
    static areEqualsArrays(arr1: any): boolean;
    static fromJSON(json: any): Material;
    /**
    *  @constructor
    *
    *  @param { !Object } params Parameters for the material.As a dictionary to be easily extended later.
    *
    *  @param { Color ?} params.color Base diffuse color for the material. Defaults to #aaaaaa
    *
    *  @param { number ?} params.roughness Roughness for the material. Defaults to 0.
    *
    *  @param { number ?} params.metalness Metalness aspect of the material, 1 for metalness, 0 for dielectric. Defaults to 0.
    *
    *  @param { Color ?} params.emissive Emissive color for the material. Defaults to pitch black. (no light emission)
    */
    constructor(params: any);
    toJSON(): {
        color: string;
        roughness: any;
        metalness: any;
        emissive: string;
    };
    /**
     *  Return a clone of the material
     *  @return {!Material} The new material
     */
    clone(): Material;
    /**
     *  Copy the given material parameters
     *  @param {!Material} mat Material to be copied
     */
    copy(mat: any): void;
    /**
     *  @deprecated Use setParams instead
     *  Set Material parameters at once. DEPRECATED. Use setParams
     *  @param {Color!} c Color
     *  @param {number!} r roughness
     *  @param {number!} m Metalness
     */
    set(c: any, r: any, m: any): void;
    /**
     *  Set Material parameters (all or just some)
     *
     *  @param {Object} params Parameters for the material. As a dictionary to be easily extended later.
     *  @param {Color?}   params.color        Base diffuse color for the material.
     *  @param {number?}        params.roughness    Roughness for the material.
     *  @param {number?}        params.metalness    Metalness aspect of the material, 1 for metalness, 0 for dielectric.
     *  @param {Color?} params.emissive       Emissive color for the material.
     */
    setParams(params: any): void;
    /** @return {Color} */
    getColor(): any;
    /** @return {number} */
    getRoughness(): any;
    /** @return {number} */
    getMetalness: () => any;
    /** @return {Color} */
    getEmissive(): any;
    equals(m: any): any;
    /**
     *  Perform a linear interpolation between this material and a given other.
     * (1-s)*this + s*m = this +(m1-this)*s
     *  @param {!Material} m The material to interpolate with this
     *  @param {number} s the interpolation coefficient
     */
    lerp(m: any, s: any): void;
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
    triMean(m1: any, m2: any, m3: any, a1: any, a2: any, a3: any, denum: any): this;
    /**
     *  Perform a weighted mean over several materials and set to this.
     *  Note that m_arr.length must equals v_arr.length
     *  @param {Array.<!Material>} m_arr Array of materials
     *  @param {Array.<number>|Float32Array} v_arr Array of values being the corresponding weights
     *  @param {number=} n Can be set if you want to mean only the n first element of the arrays
     */
    weightedMean(m_arr: any, v_arr: any, n: any): this;
}
//# sourceMappingURL=Material.d.ts.map
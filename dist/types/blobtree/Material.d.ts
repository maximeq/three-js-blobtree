import { Color } from "three";
export type MaterialJSON = {
    color: string;
    roughness: number;
    metalness: number;
    emissive: string;
};
interface MaterialParams {
    color?: Color;
    roughness?: number;
    metalness?: number;
    emissive?: Color;
}
/**
 *  Material object for blobtree. It is an internal material, that should especially
 *  be used in implicit elements. It is the internal representation of the material,
 *  not the openGL material that will be used for display.
 */
export declare class Material {
    color: Color;
    roughness: number;
    metalness: number;
    emissive: Color;
    static defaultMaterial: Material;
    /**
     *  Compare arrays of materials
     *
     *  @param {Array.<Material>} arr1
     *  @param {Array.<Material>} arr2
     *  @param {Array.<Material>=} arr3
     *  @param {Array.<Material>=} arr4
     *  @param {Array.<Material>=} arr5
     *
     *  @return true if and only if all arguments are arrays of the same length and containing the same material values.
     *  @deprecated
     */
    static areEqualsArrays(arr1: Material[], _arr2: Material[]): boolean;
    static fromJSON(json: MaterialJSON): Material;
    /**
    *  @constructor
    *
    *  @param params Parameters for the material.As a dictionary to be easily extended later.
    *
    *  @param params.color Base diffuse color for the material. Defaults to #aaaaaa
    *
    *  @param params.roughness Roughness for the material. Defaults to 0.
    *
    *  @param params.metalness Metalness aspect of the material, 1 for metalness, 0 for dielectric. Defaults to 0.
    *
    *  @param params.emissive Emissive color for the material. Defaults to pitch black. (no light emission)
    */
    constructor(params?: MaterialParams);
    toJSON(): {
        color: string;
        roughness: number;
        metalness: number;
        emissive: string;
    };
    /**
     *  Return a clone of the material
     *  @return The new material
     */
    clone(): Material;
    /**
     *  Copy the given material parameters
     *  @param mat Material to be copied
     */
    copy(mat: Material): void;
    /**
     *  @deprecated Use setParams instead
     *  Set Material parameters at once. DEPRECATED. Use setParams
     *  @param  c Color
     *  @param r roughness
     *  @param m Metalness
     */
    set(c: Color, r: number, m: number): void;
    /**
     *  Set Material parameters (all or just some)
     *
     *  @param params Parameters for the material. As a dictionary to be easily extended later.
     *  @param params.color        Base diffuse color for the material.
     *  @param params.roughness    Roughness for the material.
     *  @param params.metalness    Metalness aspect of the material, 1 for metalness, 0 for dielectric.
     *  @param params.emissive       Emissive color for the material.
     */
    setParams(params: MaterialParams): void;
    getColor(): Color;
    getRoughness(): number;
    getMetalness(): number;
    getEmissive(): Color;
    equals(m: Material): boolean;
    /**
     *  Perform a linear interpolation between this material and a given other.
     * (1-s)*this + s*m = this +(m1-this)*s
     *  @param m The material to interpolate with this
     *  @param s the interpolation coefficient
     */
    lerp(m: Material, s: number): void;
    /**
     *  Used in triangles (ok it's specific, still we need it :)
     *  Linear interpolation over a triangle? Store the result in this
     *  @param m1 The material of first corner
     *  @param m2 The material of second corner
     *  @param m3 The material of third corner
     *  @param a1 the interpolation coefficient 1
     *  @param a2 the interpolation coefficient 2
     *  @param a3 the interpolation coefficient 3
     *  @param denum Normalizing the result (division)
     *  @return this
     */
    triMean(m1: Material, m2: Material, m3: Material, a1: number, a2: number, a3: number, denum: number): Material;
    /**
     *  Perform a weighted mean over several materials and set to this.
     *  Note that m_arr.length must equals v_arr.length
     *  @param m_arr Array of materials
     *  @param v_arr Array of values being the corresponding weights
     *  @param n Can be set if you want to mean only the n first element of the arrays
     */
    weightedMean(m_arr: Material[], v_arr: (number[] | Float32Array), n?: number): this;
}
export {};
//# sourceMappingURL=Material.d.ts.map
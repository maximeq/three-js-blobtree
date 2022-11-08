export = Primitive;
/**
 * @typedef {import('./Material.js')} Material
 * @typedef {import('./Material.js').MaterialJSON} MaterialJSON
 * @typedef {import('./Element.js').ElementJSON} ElementJSON
 * @typedef {import('./Element.js').Json} Json
 *
 * @typedef {import('./areas/Area.js')} Area
 */
/**
 * @typedef {{materials:Array<MaterialJSON>} & ElementJSON} PrimitiveJSON
 */
/**
 *  Represent a blobtree primitive.
 *
 *  @constructor
 *  @extends {Element}
 */
declare class Primitive extends Element {
    /**
     * @param {PrimitiveJSON} _json
     */
    static fromJSON(_json: PrimitiveJSON): void;
    /** @type {!Array.<!Material>} */
    materials: Array<Material>;
    /**
     * @returns {PrimitiveJSON}
     */
    toJSON(): PrimitiveJSON;
    /**
     *  @param {Array.<!Material>} mats Array of materials to set. they will be copied to the primitive materials
     */
    setMaterials(mats: Array<Material>): void;
    /**
     *  @return {Array.<!Material>} Current primitive materials
     */
    getMaterials: () => Array<Material>;
    /**
     * @abstract
     * Compute variables to help with value computation.
     * @param {*} cls The class to count. Primitives have no children so no complexty here.
     */
    count(cls: any): 1 | 0;
}
declare namespace Primitive {
    export { Material, MaterialJSON, ElementJSON, Json, Area, PrimitiveJSON };
}
import Element = require("./Element.js");
type Material = import('./Material.js');
type PrimitiveJSON = {
    materials: Array<MaterialJSON>;
} & ElementJSON;
type MaterialJSON = import('./Material.js').MaterialJSON;
type ElementJSON = import('./Element.js').ElementJSON;
type Json = import('./Element.js').Json;
type Area = import('./areas/Area.js');
//# sourceMappingURL=Primitive.d.ts.map
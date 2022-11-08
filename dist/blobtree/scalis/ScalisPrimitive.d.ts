export = ScalisPrimitive;
/** @typedef {import('../Element.js')} Element */
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ElementJSON} ElementJSON */
/** @typedef {import('../Primitive.js').PrimitiveJSON} PrimitiveJSON */
/** @typedef {import('./ScalisVertex')} ScalisVertex */
/** @typedef {import('./ScalisVertex').ScalisVertexJSON} ScalisVertexJSON */
/**
 * @typedef {{v:Array<ScalisVertexJSON>, volType:string} & PrimitiveJSON} ScalisPrimitiveJSON
 */
/**
 *  Represent an implicit primitive respecting the SCALIS model developped by Cedrric Zanni
 *
 *  @constructor
 *  @extends {Primitive}
 */
declare class ScalisPrimitive extends Primitive {
    static DIST: string;
    static CONVOL: string;
    volType: string;
    /**
     * @type {!Array.<!ScalisVertex>}
     */
    v: Array<ScalisVertex>;
    /**
     *  @return {ScalisPrimitiveJSON}
     */
    toJSON(): ScalisPrimitiveJSON;
    /**
     *  @abstract Specify if the voltype can be changed
     *  @return {boolean} True if and only if the VolType can be changed.
     */
    mutableVolType(): boolean;
    /**
     *  @param {string} vt New VolType to set (Only for SCALIS primitives)
     */
    setVolType(vt: string): void;
    /**
     *  @return {string} Current volType
     */
    getVolType(): string;
}
declare namespace ScalisPrimitive {
    export { Element, Json, ElementJSON, PrimitiveJSON, ScalisVertex, ScalisVertexJSON, ScalisPrimitiveJSON };
}
import Primitive = require("../Primitive.js");
type ScalisVertex = import('./ScalisVertex');
type ScalisPrimitiveJSON = {
    v: Array<ScalisVertexJSON>;
    volType: string;
} & PrimitiveJSON;
type Element = import('../Element.js');
type Json = import('../Element.js').Json;
type ElementJSON = import('../Element.js').ElementJSON;
type PrimitiveJSON = import('../Primitive.js').PrimitiveJSON;
type ScalisVertexJSON = import('./ScalisVertex').ScalisVertexJSON;
//# sourceMappingURL=ScalisPrimitive.d.ts.map
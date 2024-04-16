import { Primitive } from "../Primitive.js";
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
export declare class ScalisPrimitive extends Primitive {
    static type: string;
    static DIST: string;
    static CONVOL: string;
    constructor();
    /**
     *  @return {string} Type of the element
     */
    getType(): string;
    /**
     *  @return {ScalisPrimitiveJSON}
     */
    toJSON(): {
        v: never[];
        volType: any;
        /**
         * @type {!Array.<!ScalisVertex>}
         */
        materials: never[];
        type: string;
    };
    /**
     *  @abstract Specify if the voltype can be changed
     *  @return {boolean} True if and only if the VolType can be changed.
     */
    mutableVolType(): boolean;
    /**
     *  @param {string} vt New VolType to set (Only for SCALIS primitives)
     */
    setVolType(vt: any): void;
    /**
     *  @return {string} Current volType
     */
    getVolType(): any;
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB(): void;
}
//# sourceMappingURL=ScalisPrimitive.d.ts.map
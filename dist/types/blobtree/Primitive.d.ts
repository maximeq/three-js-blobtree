import { Element } from './Element';
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
export declare class Primitive extends Element {
    static type: string;
    /**
     * @param {PrimitiveJSON} _json
     */
    static fromJSON(_json: any): void;
    constructor();
    /**
     * @returns {PrimitiveJSON}
     */
    toJSON(): {
        materials: never[];
        type: string;
    };
    /**
     *  @param {Array.<!Material>} mats Array of materials to set. they will be copied to the primitive materials
     */
    setMaterials(mats: any): void;
    /**
     *  @return {Array.<!Material>} Current primitive materials
     */
    getMaterials: () => any;
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB(): void;
    /**
     *  @abstract
     *  Destroy the current primitive and remove it from the blobtree (basically
     *  clean up the links between blobtree elements).
     */
    destroy(): void;
    /**
     * @abstract
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas(): never[];
    /**
     * @abstract
     * Compute variables to help with value computation.
     */
    computeHelpVariables(): void;
    /**
     * @abstract
     * Compute variables to help with value computation.
     * @param {*} cls The class to count. Primitives have no children so no complexty here.
     */
    count(cls: any): 0 | 1;
}
//# sourceMappingURL=Primitive.d.ts.map
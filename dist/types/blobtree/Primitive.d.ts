import { Element, type ElementJSON } from './Element';
import { Material, type MaterialJSON } from './Material';
import type { Area } from './areas';
/**
 * @typedef {import('./Material.js')} Material
 * @typedef {import('./Material.js').MaterialJSON} MaterialJSON
 * @typedef {import('./Element.js').ElementJSON} ElementJSON
 * @typedef {import('./Element.js').Json} Json
 *
 * @typedef {import('./areas/Area.js')} Area
 */
export type PrimitiveJSON = {
    materials: Array<MaterialJSON>;
} & ElementJSON;
/**
 *  Represent a blobtree primitive.
 *
 *  @constructor
 *  @extends {Element}
 */
export declare class Primitive extends Element {
    static type: string;
    static fromJSON(_json: PrimitiveJSON): void;
    materials: Material[];
    constructor();
    toJSON(): PrimitiveJSON;
    /**
     *  @param  mats Array of materials to set. they will be copied to the primitive materials
     */
    setMaterials(mats: Material[]): void;
    /**
     *  @return Current primitive materials
     */
    getMaterials(): Material[];
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
     */
    getAreas(): {
        aabb: THREE.Box3;
        bv: Area;
        obj: Primitive;
    }[];
    /**
     * @abstract
     * Compute variables to help with value computation.
     */
    computeHelpVariables(): void;
    /**
     * @abstract
     * Compute variables to help with value computation.
     * @param cls The class to count. Primitives have no children so no complexty here.
     */
    count(cls: Function): 1 | 0;
}
//# sourceMappingURL=Primitive.d.ts.map
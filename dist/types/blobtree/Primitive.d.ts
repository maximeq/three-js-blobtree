import { Element, type ElementJSON } from './Element';
import { Material, type MaterialJSON } from './Material';
import type { Area } from './areas';
export type PrimitiveJSON = {
    materials: MaterialJSON[];
} & ElementJSON;
/**
 *  Represent a blobtree primitive.
 *
 *  @constructor
 *  @extends {Element}
 */
export declare abstract class Primitive extends Element {
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
     * Compute constiables to help with value computation.
     */
    abstract computeHelpVariables(): void;
    /**
     * @abstract
     * Compute constiables to help with value computation.
     * @param cls The class to count. Primitives have no children so no complexty here.
     */
    count(cls: Function): 1 | 0;
}
//# sourceMappingURL=Primitive.d.ts.map
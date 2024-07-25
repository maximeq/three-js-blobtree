import { Element, type ElementJSON } from './Element';
import { Material, type MaterialJSON } from './Material';
import { Types } from "./Types";
import type { Area } from './areas';
import type { ScalisPrimitiveType } from './scalis';
import type { SDFRootNodeType } from './sdf';

export type PrimitiveJSON = { materials: MaterialJSON[] } & ElementJSON

export type PrimitiveType = "Primitive" | ScalisPrimitiveType | SDFRootNodeType;

/**
 *  Represent a blobtree primitive.
 *
 *  @constructor
 *  @extends {Element}
 */
export abstract class Primitive extends Element {

    static override type: PrimitiveType = "Primitive";

    static override fromJSON(_json: PrimitiveJSON) {
        throw "[Primitive] fromJSON should never be called as Primitive is abstract.";
    }

    materials: Material[] = [];
    constructor() {
        super();
    }

    override toJSON(): PrimitiveJSON {
        const res = { ...super.toJSON(), materials: [] as MaterialJSON[] };
        res.materials = [];
        for (let i = 0; i < this.materials.length; ++i) {
            res.materials.push(this.materials[i].toJSON());
        }
        return res;
    };

    /**
     *  @param  mats Array of materials to set. they will be copied to the primitive materials
     */
    setMaterials(mats: Material[]) {
        if (mats.length !== this.materials.length) {
            throw "[Primitive] setMaterials : trying to set " + mats.length + " materials on a primitive with only " + this.materials.length;
        }
        for (let i = 0; i < mats.length; ++i) {
            if (!mats[i].equals(this.materials[i])) {
                this.materials[i].copy(mats[i]);
                this.invalidAABB();
            }
        }
    };

    /**
     *  @return Current primitive materials
     */
    getMaterials(): Material[] {
        return this.materials;
    };

    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB(): void {
        throw "[Primitive] computeAABB must be reimplemented in all inherited class.";
    };

    /**
     *  @abstract
     *  Destroy the current primitive and remove it from the blobtree (basically
     *  clean up the links between blobtree elements).
     */
    override destroy(): void {
        if (this.parentNode !== null) {
            this.parentNode.removeChild(this);
        }
    };

    /**
     * @abstract
     */
    override getAreas(): { aabb: THREE.Box3, bv: Area, obj: Primitive }[] {
        console.error("ERROR : getAreas is an abstract function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)");
        return [];
    };

    /**
     * @abstract
     * Compute variables to help with value computation.
     */
    abstract override computeHelpVariables(): void;

    /**
     * @abstract
     * Compute variables to help with value computation.
     * @param cls The class to count. Primitives have no children so no complexty here.
     */
    override count(cls: Function) {
        return this instanceof cls ? 1 : 0;
    };

};

Types.register(Primitive.type, Primitive);


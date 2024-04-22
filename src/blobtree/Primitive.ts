import { Element, type ElementJSON } from './Element';
import { Material, type MaterialJSON } from './Material';
import { Types } from "./Types";
import type { Area } from './areas';

/**
 * @typedef {import('./Material.js')} Material
 * @typedef {import('./Material.js').MaterialJSON} MaterialJSON
 * @typedef {import('./Element.js').ElementJSON} ElementJSON
 * @typedef {import('./Element.js').Json} Json
 *
 * @typedef {import('./areas/Area.js')} Area
 */

export type PrimitiveJSON = { materials: Array<MaterialJSON> } & ElementJSON

/**
 *  Represent a blobtree primitive.
 *
 *  @constructor
 *  @extends {Element}
 */
export class Primitive extends Element {

    static type = "Primitive";

    static fromJSON(_json: PrimitiveJSON) {
        throw new Error("Primitibe.fromJSON should never be called as Primitibe is abstract.");
    }

    materials: Material[] = [];
    constructor() {
        super();
    }

    toJSON(): PrimitiveJSON {
        var res = { ...super.toJSON(), materials: [] as Object[] };
        res.materials = [];
        for (var i = 0; i < this.materials.length; ++i) {
            res.materials.push(this.materials[i].toJSON());
        }
        return res;
    };

    /**
     *  @param  mats Array of materials to set. they will be copied to the primitive materials
     */
    setMaterials(mats: Material[]) {
        if (mats.length !== this.materials.length) {
            throw "Error : trying to set " + mats.length + " materials on a primitive with only " + this.materials.length;
        }
        for (var i = 0; i < mats.length; ++i) {
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
        throw "Primitive.computeAABB  Must be reimplemented in all inherited class.";
    };

    /**
     *  @abstract
     *  Destroy the current primitive and remove it from the blobtree (basically
     *  clean up the links between blobtree elements).
     */
    destroy(): void {
        if (this.parentNode !== null) {
            this.parentNode.removeChild(this);
        }
    };

    /**
     * @abstract
     */
    getAreas(): { aabb: THREE.Box3, bv: Area, obj: Primitive }[] {
        console.error("ERROR : getAreas is an abstract function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)");
        return [];
    };

    /**
     * @abstract
     * Compute variables to help with value computation.
     */
    computeHelpVariables() {
        throw "ERROR : computeHelpVariables is a virtual function, should be re-implemented in all primitives(error occured in " + this.getType() + " primitive)";
    };

    /**
     * @abstract
     * Compute variables to help with value computation.
     * @param cls The class to count. Primitives have no children so no complexty here.
     */
    count(cls: Function) {
        return this instanceof cls ? 1 : 0;
    };

};

Types.register(Primitive.type, Primitive);


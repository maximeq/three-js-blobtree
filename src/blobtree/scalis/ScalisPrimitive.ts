import { Types } from "../Types";
import { Primitive, type PrimitiveJSON } from "../Primitive";
import type { ScalisVertex, ScalisVertexJSON } from "./ScalisVertex";

export type ScalisPrimitiveVolType = "dist" | "convol";
export type ScalisPrimitiveJSON = { v: Array<ScalisVertexJSON>, volType: ScalisPrimitiveVolType } & PrimitiveJSON;

/**
 *  Represent an implicit primitive respecting the SCALIS model developed by Cedric Zanni
 *
 *  @constructor
 *  @extends {Primitive}
 */
export abstract class ScalisPrimitive extends Primitive {

    static override type = "ScalisPrimitive";
    static DIST = "dist" as const;
    static CONVOL = "convol" as const;

    volType: ScalisPrimitiveVolType;
    v: ScalisVertex[] = [];

    constructor() {
        super();

        // Type of volume (convolution or distance function)
        this.volType = ScalisPrimitive.DIST;
    }

    /**
     *  @return Type of the element
     */
    override getType(): string {
        return ScalisPrimitive.type;
    }

    /**
     *  @return {ScalisPrimitiveJSON}
     */
    override toJSON(): ScalisPrimitiveJSON {
        const res: ScalisPrimitiveJSON = {
            ...super.toJSON(),
            v: [],
            volType: this.volType
        };
        for (let i = 0; i < this.v.length; ++i) {
            res.v.push(this.v[i].toJSON());
        }
        return res;
    }

    /**
     *  @abstract Specify if the voltype can be changed
     *  @return True if and only if the VolType can be changed.
     */
    mutableVolType(): boolean {
        return false;
    }

    /**
     *  @param vt New VolType to set (Only for SCALIS primitives)
     */
    setVolType(vt: "dist" | "convol"): void {
        if (vt !== this.volType) {
            this.volType = vt;
            this.invalidAABB();
        }
    }

    /**
     *  @return  Current volType
     */
    getVolType(): ScalisPrimitiveVolType {
        return this.volType;
    }

    /**
     * @link Element.computeAABB for a complete description
     */
    override computeAABB(): void {
        this.aabb.makeEmpty();
        for (let i = 0; i < this.v.length; i++) {
            this.aabb.union(this.v[i].getAABB());
        }
    }
}

Types.register(ScalisPrimitive.type, ScalisPrimitive);

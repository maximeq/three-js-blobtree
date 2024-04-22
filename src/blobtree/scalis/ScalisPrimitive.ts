import { Types } from "../Types.js";
import { Primitive, type PrimitiveJSON } from "../Primitive.js";
import type { ScalisVertex, ScalisVertexJSON } from "./ScalisVertex.js";

export type ScalisPrimitiveVolType = "dist" | "convol"
export type ScalisPrimitiveJSON = { v: Array<ScalisVertexJSON>, volType: ScalisPrimitiveVolType } & PrimitiveJSON

/**
 *  Represent an implicit primitive respecting the SCALIS model developped by Cedrric Zanni
 *
 *  @constructor
 *  @extends {Primitive}
 */
export class ScalisPrimitive extends Primitive {

    static type = "ScalisPrimitive";
    static DIST = "dist" as const;
    static CONVOL = "convol" as const;

    volType: ScalisPrimitiveVolType;
    v: ScalisVertex[] = [];

    constructor() {
        super();

        // Type of volume (convolution or distance funtion)
        this.volType = ScalisPrimitive.DIST;
    }

    /**
     *  @return Type of the element
     */
    getType(): string {
        return ScalisPrimitive.type;
    }

    /**
     *  @return {ScalisPrimitiveJSON}
     */
    toJSON(): ScalisPrimitiveJSON {
        var res = {
            ...super.toJSON(),
            v: [] as ScalisVertexJSON[],
            volType: this.volType
        };
        res.v = [];
        res.volType = this.volType;
        for (var i = 0; i < this.v.length; ++i) {
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
    setVolType(vt: "dist" | "convol") {
        if (vt !== this.volType) {
            this.volType = vt;
            this.invalidAABB();
        }
    }

    /**
     *  @return  Current volType
     */
    getVolType(): string {
        return this.volType;
    }

    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB(): void {
        this.aabb.makeEmpty();
        for (var i = 0; i < this.v.length; i++) {
            this.aabb.union(this.v[i].getAABB());
        }
    }
};

Types.register(ScalisPrimitive.type, ScalisPrimitive);




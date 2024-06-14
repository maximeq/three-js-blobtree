import { Primitive, type PrimitiveJSON } from "../Primitive";
import type { ScalisVertex, ScalisVertexJSON } from "./ScalisVertex";
export type ScalisPrimitiveVolType = "dist" | "convol";
export type ScalisPrimitiveJSON = {
    v: Array<ScalisVertexJSON>;
    volType: ScalisPrimitiveVolType;
} & PrimitiveJSON;
/**
 *  Represent an implicit primitive respecting the SCALIS model developed by Cedric Zanni
 *
 *  @constructor
 *  @extends {Primitive}
 */
export declare abstract class ScalisPrimitive extends Primitive {
    static type: string;
    static DIST: "dist";
    static CONVOL: "convol";
    volType: ScalisPrimitiveVolType;
    v: ScalisVertex[];
    constructor();
    /**
     *  @return Type of the element
     */
    getType(): string;
    /**
     *  @return {ScalisPrimitiveJSON}
     */
    toJSON(): ScalisPrimitiveJSON;
    /**
     *  @abstract Specify if the voltype can be changed
     *  @return True if and only if the VolType can be changed.
     */
    mutableVolType(): boolean;
    /**
     *  @param vt New VolType to set (Only for SCALIS primitives)
     */
    setVolType(vt: "dist" | "convol"): void;
    /**
     *  @return  Current volType
     */
    getVolType(): ScalisPrimitiveVolType;
    /**
     * @link Element.computeAABB for a complete description
     */
    computeAABB(): void;
}
//# sourceMappingURL=ScalisPrimitive.d.ts.map
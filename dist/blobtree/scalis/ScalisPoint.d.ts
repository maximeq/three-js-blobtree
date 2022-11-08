export = ScalisPoint;
/** @typedef {import('../Element.js')} Element */
/** @typedef {import('../Element.js').Json} Json */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./ScalisVertex').ScalisVertexJSON} ScalisVertexJSON */
/** @typedef {import('./ScalisPrimitive').ScalisPrimitiveJSON} ScalisPrimitiveJSON */
/**
 * @typedef {{density:number} & ScalisPrimitiveJSON} ScalisPointJSON
 */
declare class ScalisPoint extends ScalisPrimitive {
    /**
     * @param {ScalisPointJSON} json
     * @returns
     */
    static fromJSON(json: ScalisPointJSON): import("./ScalisPoint.js");
    /**
     *  @param {!ScalisVertex} vertex The vertex with point parameters.
     *  @param {string} volType The volume type wanted for this primitive.
     *                          Note : "convolution" does not make sens for a point, so technically,
     *                                 ScalisPrimitive.DIST or ScalisPrimitive.CONVOL will give the same results.
     *                                 However, since this may be a simple way of sorting for later blending,
     *                                 you can still choose between the 2 options.
     *  @param {number} density Implicit field density.
     *                          Gives afiner control of the created implicit field.
     *  @param {!Material} mat Material for the point
     */
    constructor(vertex: ScalisVertex, volType: string, density: number, mat: Material);
    density: number;
    v_to_p: THREE.Vector3;
    toJSON(): {
        density: number;
        v: ScalisVertex.ScalisVertexJSON[];
        volType: string;
        materials: Material.MaterialJSON[];
        type: string;
    };
    /**
     *  @param {number} d New density to set
     */
    setDensity(d: number): void;
    /**
     *  @return {number} Current density
     */
    getDensity(): number;
    /**
     *  Set material for this point
     *  @param {!Material} m
     */
    setMaterial(m: Material): void;
    getAreas(): {
        aabb: THREE.Box3;
        bv: AreaSphere;
        obj: this;
    }[];
}
declare namespace ScalisPoint {
    export { Element, Json, ValueResultType, ScalisVertexJSON, ScalisPrimitiveJSON, ScalisPointJSON };
}
import ScalisPrimitive = require("./ScalisPrimitive.js");
import THREE = require("three");
import ScalisVertex = require("./ScalisVertex.js");
import Material = require("../Material.js");
import AreaSphere = require("../areas/AreaSphere.js");
type ScalisPointJSON = {
    density: number;
} & ScalisPrimitiveJSON;
type Element = import('../Element.js');
type Json = import('../Element.js').Json;
type ValueResultType = import('../Element.js').ValueResultType;
type ScalisVertexJSON = import('./ScalisVertex').ScalisVertexJSON;
type ScalisPrimitiveJSON = import('./ScalisPrimitive').ScalisPrimitiveJSON;
//# sourceMappingURL=ScalisPoint.d.ts.map
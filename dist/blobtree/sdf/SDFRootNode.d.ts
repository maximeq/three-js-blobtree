export = SDFRootNode;
/** @typedef {import('../areas/Area')} Area */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('../Primitive.js').PrimitiveJSON} PrimitiveJSON */
/** @typedef {import('./SDFNode').SDFNodeJSON} SDFNodeJSON */
/** @typedef {import('./DistanceFunctor').DistanceFunctorJSON} DistanceFunctorJSON */
/** @typedef {{f:DistanceFunctorJSON, sdfRoot:SDFNodeJSON} & PrimitiveJSON} SDFRootNodeJSON */
/**
 *  This class implements a SDF Root Node, which is basically a Signed Distance Field
 *  made of some noe combination, on which is applied a compact support function.
 *  For now SDF nodes do not have materials. A unique material is defined in the SDFRootNode.
 *
 */
declare class SDFRootNode extends Primitive {
    /**
     *
     * @param {SDFRootNodeJSON} json
     * @returns
     */
    static fromJSON(json: SDFRootNodeJSON): import("./SDFRootNode.js");
    /**
     *
     * @param {DistanceFunctor} f The distance function to be applied to the distance field.
     * It must respect the Blobtree convention, which is : positive everywhere, with a finite support.
     * @param {Material} material
     * @param {SDFNode | SDFPrimitive=} sdfRoot The child containng the complete SDF. SDFRootNode can have only one child.
     */
    constructor(f: DistanceFunctor, material: Material, sdfRoot?: (SDFNode | SDFPrimitive) | undefined);
    f: DistanceFunctor;
    sdfRoot: SDFNode;
    tmp_res: {
        v: number;
        g: any;
    };
    tmp_g: THREE.Vector3;
    /**
     * @param {SDFNode | SDFPrimitive} c
     */
    addChild(c: SDFNode | SDFPrimitive): void;
    /**
     * @param {SDFNode | SDFPrimitive} c
     */
    removeChild(c: SDFNode | SDFPrimitive): void;
    /**
     * @returns {SDFRootNodeJSON}
     */
    toJSON(): SDFRootNodeJSON;
}
declare namespace SDFRootNode {
    export { Area, ValueResultType, PrimitiveJSON, SDFNodeJSON, DistanceFunctorJSON, SDFRootNodeJSON };
}
import Primitive = require("../Primitive.js");
import DistanceFunctor = require("./DistanceFunctor");
import SDFNode = require("./SDFNode.js");
import THREE = require("three");
import SDFPrimitive = require("./SDFPrimitive");
type SDFRootNodeJSON = {
    f: DistanceFunctorJSON;
    sdfRoot: SDFNodeJSON;
} & PrimitiveJSON;
import Material = require("../Material.js");
type Area = import('../areas/Area');
type ValueResultType = import('../Element.js').ValueResultType;
type PrimitiveJSON = import('../Primitive.js').PrimitiveJSON;
type SDFNodeJSON = import('./SDFNode').SDFNodeJSON;
type DistanceFunctorJSON = import('./DistanceFunctor').DistanceFunctorJSON;
//# sourceMappingURL=SDFRootNode.d.ts.map
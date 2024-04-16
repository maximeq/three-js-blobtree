import { Primitive } from "../Primitive.js";
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
export declare class SDFRootNode extends Primitive {
    static type: string;
    /**
     *
     * @param {SDFRootNodeJSON} json
     * @returns
     */
    static fromJSON(json: any): SDFRootNode;
    /**
     *
     * @param {DistanceFunctor} f The distance function to be applied to the distance field.
     * It must respect the Blobtree convention, which is : positive everywhere, with a finite support.
     * @param {Material} material
     * @param {SDFNode | SDFPrimitive=} sdfRoot The child containng the complete SDF. SDFRootNode can have only one child.
     */
    constructor(f: any, material: any, sdfRoot: any);
    getType(): string;
    /**
     * @param {SDFNode | SDFPrimitive} c
     */
    addChild(c: any): void;
    /**
     * @param {SDFNode | SDFPrimitive} c
     */
    removeChild(c: any): void;
    /**
     * @returns {SDFRootNodeJSON}
     */
    toJSON(): {
        f: any;
        sdfRoot: any;
        materials: never[];
        type: string;
    };
    prepareForEval(): void;
    /**
     *  @link Element.getAreas for a complete description
     *
     *  This function is an attempt to have SDFRootNode behave like a Primitive in the normal Blobtree.
     *
     *  @returns {Array.<{aabb: Box3, bv:Area, obj:Primitive}>}
     */
    getAreas(): any[];
    /**
     *  @link Node.value for a complete description
     *
     *  @param {Vector3} p
     *  @param {ValueResultType} res
     */
    value(p: any, res: any): void;
}
//# sourceMappingURL=SDFRootNode.d.ts.map
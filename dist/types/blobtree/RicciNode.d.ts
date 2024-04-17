import { Node } from "./Node";
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */
/**
 * @typedef {{ricci_n:number} & NodeJSON} RicciNodeJSON
 */
/**
 *  This class implement a n-ary blend node which use a Ricci Blend.
 *  Ricci blend is : v = k-root( Sum(c.value^k) ) for all c in node children.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export declare class RicciNode extends Node {
    static type: string;
    /**
     *  @param {number} ricci_n The value for ricci
     *  @param {Array<Node>=} children The children to add to this node. Just a convenient parameter, you can do it manually using addChild
     */
    constructor(ricci_n: any, children: any);
    /**
     * @link Node.getType
     * @returns {string}
     */
    getType(): string;
    /**
     * @link Node.toJSON
     * @returns {RicciNodeJSON}
     */
    toJSON(): {
        ricci_n: any;
        children: never[];
        type: string;
    };
    /**
     * @link Node.fromJSON
     * @param {Json} json
     * @returns
     */
    static fromJSON(json: any): RicciNode;
    /**
     * @link Node.prepareForEval
     */
    prepareForEval(): void;
    /**
     *  @link Element.value for a complete description
     *
     *  @param {Vector3} p
     *  @param {ValueResultType} res
     */
    value(p: any, res: any): void;
    /**
     * @param {number} n
     */
    setRicciN(n: any): void;
    /**
     * @returns {number}
     */
    getRicciN: () => any;
}
//# sourceMappingURL=RicciNode.d.ts.map
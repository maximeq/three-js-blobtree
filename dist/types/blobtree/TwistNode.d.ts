import { Node } from "./Node";
/** @typedef {import('./Element.js')} Element */
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */
/**
 * @typedef { {twist_amout:number} & {axis_x:number} & {axis_y:number} & {axis_z:number} & NodeJSON} TwistNodeJSON
 */
/**
 *  This class implement a TwistNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export declare class TwistNode extends Node {
    static type: string;
    /**
    *  @param {Array.<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children: any);
    /**
    * @link Node.toJSON
    * @returns {TwistNodeJSON}
    */
    toJSON(): {
        twist_amout: any;
        axis_x: any;
        axis_y: any;
        axis_z: any;
        children: never[];
        type: string;
    };
    /**
     *@link Node.fromJSON
     *
     * @param {TwistNodeJSON} json
     * @returns {TwistNode}
     */
    static fromJSON(json: any): TwistNode;
    setTwistAmount(amount: any): void;
    setTwistAxis(axis: any): void;
    _computeTransforms(): void;
    getType(): string;
    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval(): void;
    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value(p: any, res: any): void;
    /**
     *  @link Element.trim for a complete description.
     *
     *  @param {THREE.Box3} aabb
     *  @param {Array<Element>} trimmed
     *  @param {Array<Node>} parents
     */
    trim(aabb: any, trimmed: any, parents: any): void;
}
//# sourceMappingURL=TwistNode.d.ts.map
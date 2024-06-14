import { Vector3 } from "three";
import { Node, type NodeJSON } from "./Node";
import { Material } from "./Material";
import { type ValueResultType } from './Element';
export type RicciNodeJSON = {
    ricci_n: number;
} & NodeJSON;
/**
 *  This class implement a n-ary blend node which use a Ricci Blend.
 *  Ricci blend is : v = k-root( Sum(c.value^k) ) for all c in node children.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export declare class RicciNode extends Node {
    ricci_n: number;
    tmp_v_arr: Float32Array;
    tmp_m_arr: Material[];
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;
    static type: string;
    /**
     *  @param ricci_n The value for ricci
     *  @param children The children to add to this node. Just a convenient parameter, you can do it manually using addChild
     */
    constructor(ricci_n: number, children?: Node[]);
    /**
     * @link Node.getType
     */
    getType(): string;
    /**
     * @link Node.toJSON
     */
    toJSON(): RicciNodeJSON;
    /**
     * @link Node.fromJSON
     */
    static fromJSON(json: RicciNodeJSON): RicciNode;
    /**
     * @link Node.prepareForEval
     */
    prepareForEval(): void;
    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void;
    setRicciN(n: number): void;
    getRicciN(): number;
}
//# sourceMappingURL=RicciNode.d.ts.map
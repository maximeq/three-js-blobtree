import { Vector3, Box3 } from "three"
import { Types } from "./Types";
import { Node, type NodeJSON, type MaxNodeType } from "./Node";
import { Material } from "./Material";
import { type ValueResultType } from './Element';

type MaxNodeJSON = NodeJSON;

/**
 *  This class implement a Max node.
 *  It will return the maximum value of the field of each primitive.
 *  Return 0 in region were no primitive is present.
 *  @class MaxNode
 *  @extends Node
 */
export class MaxNode extends Node {
    tmp_res: ValueResultType = { v: 0, g: null, m: null };
    tmp_g: Vector3 = new Vector3();
    tmp_m: Material = new Material();

    static override type: MaxNodeType = "MaxNode";

    static override fromJSON(json: MaxNodeJSON): MaxNode {
        const res = new MaxNode();
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }

    /**
     *  @constructor
     *  @param children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
     */
    constructor(children?: Node[]) {
        super();
        if (children) {
            const self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }
    }

    override getType (): MaxNodeType {
        return MaxNode.type;
    }

    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval(): void {
        if (!this.valid_aabb) {
            this.aabb = new Box3();  // Create empty BBox
            for (let i = 0; i < this.children.length; ++i) {
                const c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB());     // new aabb is computed according to remaining children aabb
            }

            this.valid_aabb = true;
        }
    }

    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType): void {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)

        const l = this.children.length;
        const tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;

        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material.defaultMaterial);
        } if (res.g) {
            res.g.set(0, 0, 0);
        } else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }

        if (this.aabb.containsPoint(p) && l !== 0) {
            res.v = Number.MAX_VALUE;
            for (let i = 0; i < l; ++i) {
                this.children[i].value(p, tmp);
                if (tmp.v > res.v) {
                    res.v = tmp.v;
                    if (res.g && tmp.g) {
                        res.g.copy(tmp.g);
                    }
                    if (res.m && tmp.m) {
                        res.m.copy(tmp.m);
                    }
                    // within primitive potential
                    if (res.step || res.stepOrtho) {
                        throw "Not implemented";
                    }
                }
                res.v = Math.max(res.v, tmp.v);
            }
        }
        else if (res.step || res.stepOrtho) {
            throw "Not implemented";
        }
    }

};

Types.register(MaxNode.type,  MaxNode);
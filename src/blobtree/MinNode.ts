import { Vector3, Box3 } from "three"
import { Types } from "./Types";
import { Node, type NodeJSON, type MinNodeType } from "./Node";
import { Material } from "./Material";
import { type ValueResultType, Element } from './Element';

type MinNodeJSON = NodeJSON;

/**
 *  This class implement a Min node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export class MinNode extends Node {
    tmp_res: ValueResultType = { v: 0, g: null, m: null };
    tmp_g: Vector3 = new Vector3();
    tmp_m: Material = new Material();

    static override type: MinNodeType = "MinNode";

    static override fromJSON(json: MinNodeJSON): MinNode {
        const res = new MinNode();
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }

    /**
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

    override getType(): MinNodeType {
        return MinNode.type;
    }

    /**
     *  @link Element.prepareForEval for a complete description
     */
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
    };

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
                if (tmp.v < res.v) {
                    res.v = tmp.v;
                    if (res.g && tmp.g) {
                        res.g.copy(tmp.g);
                    }
                    if (res.m && tmp.m) {
                        res.m.copy(tmp.m);
                    }
                    // within primitive potential
                    if (res.step || res.stepOrtho) {
                        throw "[MinNode] value: res.step and res.stepOrtho not implemented";
                    }
                }
                res.v = Math.min(res.v, tmp.v);
            }
        }
        else if (res.step || res.stepOrtho) {
            throw "[MinNode] value: res.step and res.stepOrtho not implemented";
        }
    }

    /**
     *  @link Element.trim for a complete description.
     */
    override trim(aabb: Box3, trimmed: Element[], parents: Node[]) {
        // Trim remaining nodes
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    };
}

Types.register(MinNode.type, MinNode);
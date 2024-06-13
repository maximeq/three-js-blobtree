import { Vector3, Box3 } from "three";
import { Types } from "./Types";
import { Node, type NodeJSON } from "./Node";
import { Material } from "./Material";
import { Element, type ValueResultType } from './Element';

type DifferenceNodeJSON = {
  alpha: number;
} & NodeJSON;


/**
 *  This class implement a difference blending node.
 *  The scalar field of the second child of this node will be substracted to the first node field.
 *  The result is clamped to 0 to always keep a positive field value.
 *  @constructor
 *  @extends Node
 */
export class DifferenceNode extends Node {

    alpha: number;
    clamped: number;
    tmp_res0: ValueResultType;
    tmp_res1: ValueResultType;
    g0: Vector3;
    m0: Material;
    g1: Vector3;
    m1: Material;
    tmp_v_arr: Float32Array;
    tmp_m_arr: [Material | null, Material | null];

    static override type = "DifferenceNode";

    override fromJSON(json: DifferenceNodeJSON): DifferenceNode {
        return new DifferenceNode(Types.fromJSON(json.children[0]), Types.fromJSON(json.children[1]), json.alpha);
    };

    /**
     *
     *  @param node0 The first node
     *  @param node1 The second node, its value will be substracted to the node 0 value.
     *  @param alpha Power of the second field : the greater alpha the sharper the difference. Default is 1, must be > 1.
     */
    constructor(node0: Node, node1: Node, alpha: number) {
        super();
        this.addChild(node0);
        this.addChild(node1)

        this.alpha = alpha || 1;

        /**
         * For now, this field value is clamped to 0
         */
        this.clamped = 0.0;

        // Tmp vars to speed up computation (no reallocations)
        this.tmp_res0 = { v: 0, g: new Vector3(0, 0, 0), m: new Material() };

        this.tmp_res1 = { v: 0, g: new Vector3(0, 0, 0), m: new Material() };

        this.g0 = new Vector3();
        this.m0 = new Material();
        this.g1 = new Vector3();
        this.m1 = new Material();

        /** @type {Float32Array} */
        this.tmp_v_arr = new Float32Array(2);
        /** @type {Array<Material|null>} */
        this.tmp_m_arr = [
            null,
            null
        ];
    }

    getAlpha(): number {
        return this.alpha;
    };

    setAlpha(alpha: number): void {
        if (this.alpha != alpha) {
            this.alpha = alpha;
            this.invalidAABB();
        }
    };

    override toJSON(): DifferenceNodeJSON {
        return {
            ...super.toJSON(),
            alpha: this.alpha
        };
    };

    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval(): void {
        if (!this.valid_aabb) {
            this.children[0].prepareForEval();
            this.children[1].prepareForEval();
            // Bounding box of this node is the same as the one of the positive children,
            // Since negative values will be clamped to 0.
            this.aabb.copy(this.children[0].getAABB());

            this.valid_aabb = true;
        }
    };

    /**
     *  Compute the value and/or gradient and/or material
     *  of the element at position p in space. return computations in res (see below)
     *
     *  @param p Point where we want to evaluate the primitive field
     *  @param res Computed values will be stored here. Each values should exist and
     *                       be allocated already.
     *  @param res.v Value, must be defined
     *  @param res.m Material, must be allocated and defined if wanted
     *  @param res.g Gradient, must be allocated and defined if wanted
     *  @param res.step The next step we can safely walk without missing the iso (0). Mostly used for convergence function or ray marching.
     *  @param res.stepOrtho
     */
    value(p: Vector3, res: ValueResultType) {
        const v_arr = this.tmp_v_arr;
        const m_arr = this.tmp_m_arr;

        const tmp0 = this.tmp_res0;
        const tmp1 = this.tmp_res1;

        tmp0.g = res.g ? this.g0 : null;
        tmp0.m = res.m ? this.m0 : null;
        tmp1.g = res.g ? this.g1 : null;
        tmp1.m = res.m ? this.m1 : null;

        // Init res
        res.v = 0;
        tmp1.v = 0;
        tmp0.v = 0;
        if (res.m && tmp0.m && tmp1.m) {
            res.m.copy(Material.defaultMaterial);
            tmp1.m.copy(Material.defaultMaterial);
            tmp0.m.copy(Material.defaultMaterial);
        } if (res.g && tmp0.g && tmp1.g) {
            res.g.set(0, 0, 0);
            tmp1.g.set(0, 0, 0);
            tmp0.g.set(0, 0, 0);
        } else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }

        if (this.aabb.containsPoint(p)) {
            if (this.children[0].aabb.containsPoint(p)) {
                this.children[0].value(p, tmp0);
                if (this.children[1].aabb.containsPoint(p)) {
                    this.children[1].value(p, tmp1);
                }
                if (tmp1.v === 0) {
                    res.v = tmp0.v;
                    if (res.g && tmp0.g) {
                        res.g.copy(tmp0.g);
                    }
                    if (res.m && tmp0.m) {
                        res.m.copy(tmp0.m);
                    }
                } else {
                    const v_pow = Math.pow(tmp1.v, this.alpha);
                    res.v = Math.max(this.clamped, tmp0.v - tmp1.v * Math.pow(tmp1.v, this.alpha - 1.0));
                    if (res.g && tmp1.g && tmp0.g) {
                        if (res.v === this.clamped) {
                            res.g.set(0, 0, 0);
                        } else {
                            tmp1.g.multiplyScalar(v_pow);
                            res.g.subVectors(tmp0.g, tmp1.g);
                        }
                    }
                    if (res.m && tmp0.m && tmp1.m) {
                        v_arr[0] = tmp0.v;
                        v_arr[1] = tmp1.v;
                        m_arr[0] = tmp0.m;
                        m_arr[1] = tmp1.m;
                        if (m_arr[0] === null && m_arr[1] === null) 
                            throw "[DifferenceNode] value: m_arr[0] and m_arr[1] are both null. This is not possible here.";
                        res.m.weightedMean(m_arr as Material[], v_arr, 2);
                    }
                }
            }
        }
        else if (res.step !== undefined) {
            // return distance to aabb such that next time we'll hit from within the aabbb
            res.step = this.aabb.distanceToPoint(p) + 0.3;
        }
    };

    /**
     *  @link Element.trim for a complete description.
     *
     *  Trim must be redefined for DifferenceNode since in this node we cannot trim one of the 2 nodes without trimming the other.
     */
    override trim(aabb: Box3, trimmed: Element[], parents: Node[]) {
        // Trim remaining nodes
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    };
};

Types.register(DifferenceNode.type, DifferenceNode);
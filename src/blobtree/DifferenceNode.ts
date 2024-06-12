import { Vector3 } from "three";
import { Types } from "./Types";
import { Node } from "./Node";
import { Material } from "./Material";
import { Element } from './Element';
import { type NodeJSON } from './Node.js';

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
    tmp_res0: { v: number, g: Vector3, m: Material };
    tmp_res1: { v: number, g: Vector3, m: Material };
    g0: Vector3;
    m0: Material;
    g1: Vector3;
    m1: Material;
    tmp_v_arr: Float32Array;
    tmp_m_arr: (Material | null)[];

    static override type = "DifferenceNode";

    /**
     * @param {DifferenceNodeJSON} json
     * @returns {DifferenceNode}
     */
    static override fromJSON(json: DifferenceNodeJSON) {
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

    /**
     * @returns {number}
     */
    getAlpha() {
        return this.alpha;
    };

    /**
     * @param {number} alpha
     */
    setAlpha(alpha) {
        if (this.alpha != alpha) {
            this.alpha = alpha;
            this.invalidAABB();
        }
    };

    /**
     * @returns {DifferenceNodeJSON}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            alpha: this.alpha
        };
    };

    /**
     * @link Node.prepareForEval for a complete description
     **/
    prepareForEval() {
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
     *  @param {Vector3} p Point where we want to evaluate the primitive field
     *  @param {Object} res Computed values will be stored here. Each values should exist and
     *                       be allocated already.
     *  @param {number} res.v Value, must be defined
     *  @param {Material} res.m Material, must be allocated and defined if wanted
     *  @param {Vector3} res.g Gradient, must be allocated and defined if wanted
     *  @param {number=} res.step The next step we can safely walk without missing the iso (0). Mostly used for convergence function or ray marching.
     *  @param {number=} res.stepOrtho
     */
    value(p, res) {
        var v_arr = this.tmp_v_arr;
        var m_arr = this.tmp_m_arr;

        var tmp0 = this.tmp_res0;
        var tmp1 = this.tmp_res1;

        tmp0.g = res.g ? this.g0 : null;
        tmp0.m = res.m ? this.m0 : null;
        tmp1.g = res.g ? this.g1 : null;
        tmp1.m = res.m ? this.m1 : null;

        // Init res
        res.v = 0;
        tmp1.v = 0;
        tmp0.v = 0;
        if (res.m) {
            res.m.copy(Material.defaultMaterial);
            tmp1.m.copy(Material.defaultMaterial);
            tmp0.m.copy(Material.defaultMaterial);
        } if (res.g) {
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
                    if (res.g) {
                        res.g.copy(tmp0.g);
                    }
                    if (res.m) {
                        res.m.copy(tmp0.m);
                    }
                } else {
                    var v_pow = Math.pow(tmp1.v, this.alpha);
                    res.v = Math.max(this.clamped, tmp0.v - tmp1.v * Math.pow(tmp1.v, this.alpha - 1.0));
                    if (res.g) {
                        if (res.v === this.clamped) {
                            res.g.set(0, 0, 0);
                        } else {
                            tmp1.g.multiplyScalar(v_pow);
                            res.g.subVectors(tmp0.g, tmp1.g);
                        }
                    }
                    if (res.m) {
                        v_arr[0] = tmp0.v;
                        v_arr[1] = tmp1.v;
                        m_arr[0] = tmp0.m;
                        m_arr[1] = tmp1.m;
                        res.m.weightedMean(m_arr, v_arr, 2);
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
     *
     *  @param {Box3} aabb
     *  @param {Array.<Element>} trimmed
     *  @param {Array.<Node>} parents
     */
    trim(aabb, trimmed, parents) {
        // Trim remaining nodes
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    };
};

Types.register(DifferenceNode.type, DifferenceNode);
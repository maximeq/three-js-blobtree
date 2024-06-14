import { Vector3, Box3 } from "three";
import { Types } from "./Types";
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
export class RicciNode extends Node {
    ricci_n: number;
    tmp_v_arr: Float32Array;
    tmp_m_arr: Material[];
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;

    static override type = "RicciNode";

    /**
     *  @param ricci_n The value for ricci
     *  @param children The children to add to this node. Just a convenient parameter, you can do it manually using addChild
     */
    constructor(ricci_n: number, children?: Node[]) {
        super();

        this.ricci_n = ricci_n;

        if (children) {
            let self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }

        // Tmp consts to speed up computation (no reallocations)
        this.tmp_v_arr = new Float32Array(0);
        this.tmp_m_arr = [];

        // temp consts to speed up evaluation by avoiding allocations
        this.tmp_res = { v: 0, g: null, m: null };
        this.tmp_g = new Vector3();
        this.tmp_m = new Material();
    }

    /**
     * @link Node.getType
     */
    override getType(): string {
        return RicciNode.type;
    };

    /**
     * @link Node.toJSON
     */
    override toJSON(): RicciNodeJSON {
        let res = {
            ...super.toJSON(),
            ricci_n: this.ricci_n
        };

        return res;
    };

    /**
     * @link Node.fromJSON
     */
    fromJSON(json: RicciNodeJSON): RicciNode {
        let res = new RicciNode(json.ricci_n);
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    };

    /**
     * @link Node.prepareForEval
     */
    prepareForEval() {
        if (!this.valid_aabb) {
            this.aabb = new Box3();  // Create empty BBox
            for (let i = 0; i < this.children.length; ++i) {
                let c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB());     // new aabb is computed according to remaining children aabb
            }

            this.valid_aabb = true;

            // Prepare tmp arrays
            if (this.tmp_v_arr.length < this.children.length) {
                this.tmp_v_arr = new Float32Array(this.children.length * 2);
                this.tmp_m_arr.length = this.children.length * 2;
                for (let i = 0; i < this.tmp_m_arr.length; ++i) {
                    this.tmp_m_arr[i] = new Material({ roughness: 0, metalness: 0 });
                }
            }
        }
    };

    /**
     *  @link Element.value for a complete description
     */
    value(p: Vector3, res: ValueResultType) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)
        let l = this.children.length;
        let tmp = this.tmp_res;
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
            // arrays used for material mean
            let v_arr = this.tmp_v_arr;
            let m_arr = this.tmp_m_arr;
            let mv_arr_n = 0;

            // tmp let to compute the powered sum before the n-root
            // Kept for gradient computation
            let res_vv = 0;
            for (let i = 0; i < l; ++i) {
                if (this.children[i].aabb.containsPoint(p)) {

                    this.children[i].value(p, tmp);
                    if (tmp.v > 0) // actually just !=0 should be enough but for stability reason...
                    {
                        let v_pow = Math.pow(tmp.v, this.ricci_n - 1.0);
                        res_vv += tmp.v * v_pow;

                        // gradient if needed
                        if (res.g && tmp.g) {
                            tmp.g.multiplyScalar(v_pow);
                            res.g.add(tmp.g);
                        }
                        // material if needed
                        if (res.m && tmp.m) {
                            v_arr[mv_arr_n] = tmp.v * v_pow;
                            m_arr[mv_arr_n].copy(tmp.m);
                            mv_arr_n++;
                        }
                        // within primitive potential
                        if (res.step || res.stepOrtho) {
                            // we have to compute next step or nextStep z
                            res.step = Math.min((res.step ? res.step : res.stepOrtho) as number,
                                this.children[i].heuristicStepWithin());
                        }

                    }
                    // outside of the potential for this box, but within the box
                    else {
                        if (res.step !== undefined) {
                            res.step = Math.min(res.step,
                                this.children[i].distanceTo(p));
                        }

                    }
                }
                else if (res.step || res.stepOrtho) {
                    res.step = Math.min((res.step ? res.step : res.stepOrtho) as number,
                        this.children[i].distanceTo(p));
                }
            }

            // compute final result using ricci power function
            res.v = Math.pow(res_vv, 1 / this.ricci_n);

            if (res.v !== 0) {
                if (res.g) {
                    res.g.multiplyScalar(res.v / res_vv);
                }
                if (res.m) {
                    res.m.weightedMean(m_arr, v_arr, mv_arr_n);
                }
            }
            // else the default values should be OK.
        } else if (res.step !== undefined) {
            if (this.children.length !== 0) {
                let add = this.children[0].heuristicStepWithin();
                for (let i = 1; i < this.children.length; ++i) {
                    add = Math.min(add, this.children[i].heuristicStepWithin());
                }
                // return distance to aabb such that next time we'll hit from within the aabbb
                res.step = this.aabb.distanceToPoint(p) + add;
            }
        }

        if (res.stepOrtho !== undefined) {
            res.stepOrtho = res.step;
        }
    };

    setRicciN(n: number): void {
        if (this.ricci_n != n) {
            this.ricci_n = n;
            this.invalidAABB();
        }
    };

    getRicciN (): number {
        return this.ricci_n;
    };

};

Types.register(RicciNode.type, {fromJSON: (new RicciNode(0)).fromJSON});
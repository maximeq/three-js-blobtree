import { Vector3, Matrix4, Box3 } from "three"
import { Types } from "./Types";
import { Node, type NodeJSON } from "./Node";
import { Material } from "./Material";
import type { ValueResultType, Element } from './Element';

type TwistNodeJSON = {
  twist_amount: number;
  axis_x: number;
  axis_y: number;
  axis_z: number;
} & NodeJSON;
/**
 *  This class implement a TwistNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export class TwistNode extends Node {
    _twist_amount: number;
    _twist_axis: Vector3;
    _twist_axis_mat: Matrix4;
    _twist_axis_mat_inv: Matrix4;
    tmp_res: ValueResultType;
    tmp_g: Vector3;
    tmp_m: Material;

    static override type = "TwistNode";

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

        // temp consts to speed up evaluation by avoiding allocations
        /** @type {{v:number, g:Vector3, m:Material}} */
        this.tmp_res = { v: 0, g: null, m: null };
        /** @type {Vector3} */
        this.tmp_g = new Vector3();
        /** @type {Material} */
        this.tmp_m = new Material();

        this._twist_amount = 1.0;
        this._twist_axis = new Vector3(0.0, 1.0, 0.0);
        this._twist_axis_mat = new Matrix4();
        this._twist_axis_mat_inv = new Matrix4();

    }


    /**
    * @link Node.toJSON
    * @returns {TwistNodeJSON}
    */
    override toJSON(): TwistNodeJSON {
        let res = {
            ...super.toJSON(),
            twist_amount: this._twist_amount,
            axis_x: this._twist_axis.x,
            axis_y: this._twist_axis.y,
            axis_z: this._twist_axis.z,
        };

        return res;
    };

    /**
     *@link Node.fromJSON
     * 
     * @param {TwistNodeJSON} json
     * @returns {TwistNode}
     */
    static override fromJSON(json: TwistNodeJSON): TwistNode {
        const res = new TwistNode();
        res.setTwistAmount(json.twist_amount);
        res.setTwistAxis(new Vector3(json.axis_x
            , json.axis_y
            , json.axis_z));
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }

    setTwistAmount(amount: number) {
        this._twist_amount = amount;
    }

    setTwistAxis(axis: Vector3) {
        this._twist_axis = axis;
        this._computeTransforms();
    }

    _computeTransforms() {
        let r_angle = Math.acos(this._twist_axis.dot(new Vector3(0, 1, 0)));
        if (Math.abs(r_angle) > 0.0001) {
            let t_axis = this._twist_axis.clone();
            let rot_axis = t_axis.cross(new Vector3(0, 1, 0));
            rot_axis.normalize();
            this._twist_axis_mat.makeRotationAxis(rot_axis, r_angle);
        }
        else {
            this._twist_axis_mat.identity();
        }
        this._twist_axis_mat_inv = this._twist_axis_mat.clone();
        this._twist_axis_mat_inv.invert();
    }

    override getType() {
        return TwistNode.type;
    }

    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval() {
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
    value(p: Vector3, res: ValueResultType) {
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


            let center = new Vector3();
            this.aabb.getCenter(center);

            //Center the input point
            let t_p = new Vector3(p.x - center.x
                , p.y - center.y
                , p.z - center.z);

            //Rotate towards twist axis space
            t_p.applyMatrix4(this._twist_axis_mat);

            //Twist          
            let c_twist = Math.cos(this._twist_amount * t_p.y);
            let s_twist = Math.sin(this._twist_amount * t_p.y);

            //Revert to world space
            let q = new Vector3(c_twist * t_p.x - s_twist * t_p.z,
                t_p.y,
                s_twist * t_p.x + c_twist * t_p.z);

            q.applyMatrix4(this._twist_axis_mat_inv);

            let t_q = new Vector3(q.x + center.x
                , q.y + center.y
                , q.z + center.z);

            res.v = Number.MAX_VALUE;
            for (let i = 0; i < l; ++i) {
                this.children[i].value(t_q, tmp);
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
        }
        else if (res.step || res.stepOrtho) {
            throw "Not implemented";
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

Types.register(TwistNode.type, {fromJSON: TwistNode.fromJSON});
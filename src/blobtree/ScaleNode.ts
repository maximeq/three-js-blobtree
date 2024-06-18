import { Vector3, Box3 } from "three"
import { Types } from "./Types";
import { Node } from "./Node";
import { Material } from "./Material";

import type { ValueResultType, Element } from './Element';
import type { NodeJSON, ScaleNodeType } from './Node';

type ScaleNodeJSON = {
  scale_x: number;
  scale_y: number;
  scale_z: number;
} & NodeJSON;

/**
 *  This class implement a ScaleNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
export class ScaleNode extends Node {
    _scale: Vector3 = new Vector3(1, 1, 1);
    tmp_res: ValueResultType = { v: 0, g: null, m: null };
    tmp_g: Vector3 = new Vector3();
    tmp_m: Material = new Material();

    static override type: ScaleNodeType = "ScaleNode";

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



    /**
    * @link Node.toJSON
    */
    override toJSON(): ScaleNodeJSON {
        let res = {
            ...super.toJSON(),
            scale_x: this._scale.x,
            scale_y: this._scale.y,
            scale_z: this._scale.z,
        };

        return res;
    };

    /**
     * @link Node.fromJSON
     */
    static override fromJSON(json: ScaleNodeJSON): ScaleNode {
        const res = new ScaleNode();
        res.setScale(
            new Vector3(
                json.scale_x,
                json.scale_y,
                json.scale_z
            )
        );
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }

    /**
     * @link ScaleNode.setScale
     */
    setScale(scale: Vector3): void {
        this._scale.copy(scale);
        this.invalidAABB();
    }

    /**
     * @link Node.getType
     */
    override getType(): ScaleNodeType {
        return ScaleNode.type;
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
                this.aabb.union(c.getAABB());    // new aabb is computed according to remaining children aabb
            }

            let bb_size = new Vector3();
            this.aabb.clone().getSize(bb_size);
            let x_scale = bb_size.x * (this._scale.x - 1.0);
            let y_scale = bb_size.y * (this._scale.y - 1.0);
            let z_scale = bb_size.z * (this._scale.z - 1.0);

            this.aabb.expandByVector(new Vector3(x_scale, y_scale, z_scale));
            this.valid_aabb = true;
        }
    };

    /**
    * @link Element.computeAABB for a complete description
    */
    override computeAABB() {
        this.aabb.makeEmpty();
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].computeAABB();
            this.aabb.union(this.children[i].getAABB());
        }

        let bb_size = new Vector3();
        this.aabb.clone().getSize(bb_size);
        let x_scale = bb_size.x * (this._scale.x - 1.0);
        let y_scale = bb_size.y * (this._scale.y - 1.0);
        let z_scale = bb_size.z * (this._scale.z - 1.0);

        this.aabb.expandByVector(new Vector3(x_scale, y_scale, z_scale));
    }

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

            let st_p = new Vector3((p.x - center.x) / this._scale.x + center.x
                , (p.y - center.y) / this._scale.y + center.y
                , (p.z - center.z) / this._scale.z + center.z);

            res.v = Number.MAX_VALUE;
            for (let i = 0; i < l; ++i) {
                this.children[i].value(st_p, tmp);
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

Types.register(ScaleNode.type, ScaleNode);
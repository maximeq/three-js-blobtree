import { Vector3, Box3 } from "three";
import { Types } from "../Types.js";
import { SDFNode, type SDFNodeJSON } from "./SDFNode.js";
import { Primitive, type PrimitiveJSON } from "../Primitive.js";
import { Material } from "../Material.js";
import { DistanceFunctor, type DistanceFunctorJSON } from './DistanceFunctor.js';
import { SDFPrimitive } from './SDFPrimitive.js';
import { Area } from '../areas/Area.js';
import { type ValueResultType } from "../Element.js";

export type SDFRootNodeJSON = { f: DistanceFunctorJSON, sdfRoot: SDFNodeJSON } & PrimitiveJSON;

/**
 *  This class implements a SDF Root Node, which is basically a Signed Distance Field
 *  made of some node combination, on which is applied a compact support function.
 *  For now SDF nodes do not have materials. A unique material is defined in the SDFRootNode.
 */
export class SDFRootNode extends Primitive {
    static override type = "SDFRootNode";

    f: DistanceFunctor;
    sdfRoot: SDFNode;
    tmp_res: { v: number, g: Vector3 | null };
    tmp_g: Vector3;

    static override fromJSON(json: SDFRootNodeJSON): SDFRootNode {
        const f: DistanceFunctor = Types.fromJSON(json.f);
        let material: Material = Material.fromJSON(json.materials[0]);
        let sdfRoot: SDFNode | SDFPrimitive = Types.fromJSON(json.sdfRoot);

        return new SDFRootNode(f, material, sdfRoot);
    }

    /**
     * @param f The distance function to be applied to the distance field.
     * It must respect the Blobtree convention, which is : positive everywhere, with a finite support.
     * @param material The material for this node.
     * @param sdfRoot The child containing the complete SDF. SDFRootNode can have only one child.
     */
    constructor(f: DistanceFunctor, material?: Material, sdfRoot?: SDFNode | SDFPrimitive) {
        super();

        this.f = f;
        this.materials.push(material ? material.clone() : new Material());
        this.sdfRoot = sdfRoot ? (sdfRoot instanceof SDFNode ? sdfRoot : new SDFNode().addChild(sdfRoot)) : new SDFNode();

        this.tmp_res = { v: 0, g: null };
        this.tmp_g = new Vector3(0, 0, 0);
    }

    override getType(): string {
        return SDFRootNode.type;
    }

    addChild(c: SDFNode | SDFPrimitive): void {
        if (this.sdfRoot.children.length === 0) {
            this.sdfRoot.addChild.call(this, c);
        } else {
            throw new Error("SDFRootNode can have only one child.");
        }
    }

    removeChild(c: SDFNode | SDFPrimitive): void {
        this.sdfRoot.removeChild(c);
    }

    override toJSON(): SDFRootNodeJSON {
        return {
            ...super.toJSON(),
            f: this.f.toJSON(),
            sdfRoot: this.sdfRoot.toJSON()
        };
    }

    prepareForEval(): void {
        if (!this.valid_aabb) {
            this.aabb = new Box3();
            for (let i = 0; i < this.sdfRoot.children.length; ++i) {
                let c = this.sdfRoot.children[i];
                c.prepareForEval();
                this.aabb.union(c.computeDistanceAABB(this.f.getSupport()));
            }
            this.valid_aabb = true;
        }
    }

    override getAreas(): { aabb: Box3, bv: Area, obj: Primitive }[] {
        if (!this.valid_aabb) {
            throw new Error("ERROR: Cannot get area of invalid node");
        } else {
            let distAreas = this.sdfRoot.getDistanceAreas(this.f.getSupport());
            return distAreas.map(area => ({
                aabb: area.aabb,
                bv: area.bv,
                obj: this
            }));
        }
    }

    value(p: Vector3, res: ValueResultType): void {
        const tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;

        res.v = 0;
        if (res.m) {
            res.m.copy(Material.defaultMaterial);
        }
        if (this.aabb.containsPoint(p)) {
            this.sdfRoot.children[0].value(p, tmp);

            res.v = this.f.value(tmp.v);
            if (res.g) {
                res.g.copy(tmp.g!).multiplyScalar(this.f.gradient(res.v));
            }
            if (res.m) {
                res.m.copy(this.materials[0]);
            }
        } else if (res.step !== undefined) {
            res.step = this.aabb.distanceToPoint(p) + 0.3;
        }
    }

    computeHelpVariables(): void {
        throw "computeHelpVariables is not implemented for SDFRootNode.";
    }

    heuristicStepWithin(): number {
        throw "heuristicStepWithin is not implemented for SDFRootNode.";
    }
}

Types.register(SDFRootNode.type, SDFRootNode);

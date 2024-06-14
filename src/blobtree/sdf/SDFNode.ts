import { Vector3, Box3 } from "three";
import { Types } from "../Types";
import { Node, type NodeJSON } from '../Node';
import type { Area } from '../areas/Area';
import type { SDFPrimitive } from './SDFPrimitive';
import type { Primitive } from '../Primitive';
import type { ValueResultType } from '../Element';

export type SDFNodeJSON = NodeJSON;

/**
 *  This class implements an abstract Node class for Signed Distance Field.
 *  The considered primitive is at distance = 0.
 *  Convention is : negative value inside the surface, positive value outside.
 *  @constructor
 *  @extends {Node}
 */
export class SDFNode extends Node {

    static override type = "SDFNode";

    override children: (SDFNode | SDFPrimitive)[];

    constructor() {
        super();

        // Default bounding box for a SDF is infinite.
        this.aabb.set(
            new Vector3(-Infinity, -Infinity, -Infinity),
            new Vector3(+Infinity, +Infinity, +Infinity)
        );

        this.children = [];
    }

    overridegetType(): string {
        return SDFNode.type;
    }

    override computeAABB(): void{
        // Nothing to do, SDF have infinite bounding box
    }

    /**
     *  Return the bounding box of the node for a given maximum distance.
     *  Ie, the distance field is greater than d everywhere outside the returned box.
     *  @abstract
     *  @param d Distance
     */
    computeDistanceAABB(d: number): Box3 {
        let res = new Box3();
        for (let i = 0; i < this.children.length; ++i) {
            res.union(this.children[i].computeDistanceAABB(d));
        }
        return res;
    }

    override addChild(c: SDFNode | SDFPrimitive): this{
        return super.addChild(c);
    }

    /**
     *  SDF Field are infinite, so Areas do not make sense except for the SDFRoot, which will
     *  usually apply a compact kernel to the distance field.
     *  @abstract
     */
    override getAreas(): { aabb: Box3; bv: Area; obj: Primitive; }[] {
        throw "No Areas for SDFNode, except for the SDFRootNode.";
    }

    /**
     * @param d Distance to consider for the area computation.
     */
    getDistanceAreas(d: number): { aabb: Box3, bv: Area, obj: SDFPrimitive }[] {
        // By default return areas of all children
        let res: Array<{ aabb: Box3, bv: Area, obj: SDFPrimitive }> = [];
        for (let i = 0; i < this.children.length; ++i) {
            let c = this.children[i];
            res.push(...c.getDistanceAreas(d));
        }
        return res;
    }

    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     * @param _p Point
     */
    override distanceTo(_p: Vector3): number {
        throw "distanceTo should be reimplemented in every children classes of SDFNode.";
    };

    override heuristicStepWithin(): number {
        throw "heuristicStepWithin may not make sens for all SDFNode, except for the SDFRootNode.";
    };

    prepareForEval(): void {
        throw "prepareForEval is not implemented for SDFNode.";
    }

    value(_p: Vector3, _res: ValueResultType): void {
        throw "value is not implemented for SDFNode.";
    }
};

Types.register(SDFNode.type, SDFNode);

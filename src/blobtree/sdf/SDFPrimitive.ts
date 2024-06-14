import { Vector3, Box3 } from "three";
import { Types } from "../Types";
import { Element, type ElementJSON } from "../Element";
import type { Area } from '../areas/Area';
import type { Primitive } from '../Primitive';

export type SDFPrimitiveJSON = ElementJSON;

/**
 *  This class implements an abstract primitive class for signed distance field.
 *  SDFPrimitive subclasses must define a scalar field being the distance to a geometry.
 *  @constructor
 *  @extends {Element}
 */
export abstract class SDFPrimitive extends Element {
    static override type = "SDFPrimitive";

    constructor() {
        super();
        // Default bounding box for a SDF is infinite.
        this.aabb.set(
            new Vector3(-Infinity, -Infinity, -Infinity),
            new Vector3(Infinity, Infinity, Infinity)
        );
    }

    /**
     * @return Type of the element
     */
    override getType(): string {
        return SDFPrimitive.type;
    }

    /**
     * @link Element.computeAABB for a complete description.
     */
    computeAABB(): void {
        // Nothing to do, SDF have infinite bounding box
    }

    /**
     * Return the bounding box of the node for a given maximum distance.
     * Ie, the distance field is greater than d everywhere outside the returned box.
     * @param d Distance
     * @abstract
     */
    abstract computeDistanceAABB(d: number): Box3;

    override getAreas(): {aabb: Box3; bv: Area; obj: Primitive }[] {
        throw "No Areas for SDFPrimitive.";
    }

    /**
     * @param d Distance to consider for the area computation.
     */
    abstract getDistanceAreas(d: number): { aabb: Box3; bv: Area; obj: SDFPrimitive }[];

    /**
     * Since SDF Nodes are distance function, this function will return
     * an accurate distance to the surface.
     * @abstract
     *
     * @param p
     */
    override distanceTo = (function() {
        var res = { v: 0 };
        return function (this: SDFPrimitive, p: Vector3) {
            this.value(p, res);
            return res.v;
        };
    })();

    /**
     * @link see Element.heuristicStepWithin for a complete description.
     */
    heuristicStepWithin(): number {
        console.error("SDFPrimitive.heuristicStepWithin is Not implemented");
        return 1;
    };
}

Types.register(SDFPrimitive.type, SDFPrimitive);

import { Vector3, Box3 } from "three"
import { ScalisMath } from "./ScalisMath"
import type { ScalisPrimitive } from "./ScalisPrimitive";

export type SegParam = {
    norm: number;
    diffThick: number;
    dir: Vector3;
    v: [ScalisVertex, ScalisVertex];
    ortho_vec_x: number;
    ortho_vec_y: number;
};

export type ScalisVertexJSON = { position: { x: number, y: number, z: number }, thickness: number }

var verticesIds = 0;

/**
 *  A scalis ScalisVertex. Basically a point and a wanted thickness.
 */
export class ScalisVertex {

    static fromJSON(json: ScalisVertexJSON) {
        return new ScalisVertex(new Vector3(json.position.x, json.position.y, json.position.z), json.thickness);
    }

    pos: Vector3;
    thickness: number;
    id: number;
    prim: ScalisPrimitive | null = null;        // The primitive using this vertex
    aabb = new Box3();
    valid_aabb: boolean = false;

    /**
     *  @param  pos A position in space, as a Vector3
     *  @param  thickness Wanted thickness at this point. Misnamed parameter : this is actually half the thickness.
     */
    constructor(pos: Vector3, thickness: number) {
        this.pos = pos.clone();
        this.thickness = thickness;

        // Only used for quick fix Zanni Correction. Should be removed as soon as it's not useful anymore.
        this.id = verticesIds++;
    };

    /**
     *  Set an internal pointer to the primitive using this vertex.
     *  Should be called from primitive constructor.
     * @param prim
     */
    setPrimitive(prim: ScalisPrimitive) {
        if (this.prim === null) {
            this.prim = prim;
        }
    }

    toJSON(): ScalisVertexJSON {
        return {
            position: {
                x: this.pos.x,
                y: this.pos.y,
                z: this.pos.z
            },
            thickness: this.thickness
        };
    }

    /**
     *  Set a new position.
     *  @param pos A position in space, as a Vector3
     */
    setPos(pos: Vector3) {
        this.valid_aabb = false;
        this.pos.copy(pos);
        this.prim?.invalidAABB();
    }

    /**
     *  Set a new thickness
     *  @param thickness The new thickness
     */
    setThickness(thickness: number) {
        this.valid_aabb = false;
        this.thickness = thickness;
        this.prim?.invalidAABB();
    }

    /**
     *  Set a both position and thickness
     *  @param thickness The new thickness
     *  @param pos A position in space, as a Vector3
     */
    setAll(pos: Vector3, thickness: number) {
        this.valid_aabb = false;
        this.pos = pos;
        this.thickness = thickness;
        this.prim?.invalidAABB();
    }

    /**
     *  Get the current position
     *  @return Current position, as a Vector3
     */
    getPos(): Vector3 {
        return this.pos;
    }

    /**
     *  Get the current Thickness
     *  @return {number} Current Thickness
     */
    getThickness(): number {
        return this.thickness;
    };

    /**
     *  Get the current AxisAlignedBoundingBox
     *  @return The AABB of this vertex.
     */
    getAABB(): Box3 {
        if (!this.valid_aabb) {
            this.computeAABB();
            this.valid_aabb = true;
        }
        return this.aabb;
    };

    /**
     *  Compute the current AABB.
     *  @protected
     */
    computeAABB(): void {
        var pos = this.getPos();
        var boundSupport = this.getThickness() * ScalisMath.KS;
        this.aabb.set(new Vector3(
            pos.x - boundSupport,
            pos.y - boundSupport,
            pos.z - boundSupport
        ),
            new Vector3(
                pos.x + boundSupport,
                pos.y + boundSupport,
                pos.z + boundSupport
            )
        );
    }

    /**
     *  Check equality between 2 vertices
     */
    equals(other: ScalisVertex): boolean {
        return this.pos.equals(other.pos) && this.thickness === other.thickness;
    }
}

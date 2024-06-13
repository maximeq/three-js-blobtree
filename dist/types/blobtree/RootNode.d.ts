import { Box3, Ray, Vector3 } from "three";
import { RicciNode } from "./RicciNode";
import type { Element } from './Element';
import type { Node } from './Node';
import type { RicciNodeJSON } from './RicciNode';
type RootNodeJSON = {
    iso: number;
} & RicciNodeJSON;
interface IntersectionResult {
    distance?: number;
    point: Vector3;
    g?: Vector3;
}
/**
 *  The root of any implicit blobtree. Does behave computationaly like a RicciNode with n = 64.
 *  The RootNode is the only node to be its own parent.
 *  @constructor
 *  @extends RicciNode
 */
export declare class RootNode extends RicciNode {
    iso_value: number;
    trimmed: Element[];
    trim_parents: Node[];
    static type: string;
    fromJSON(json: RootNodeJSON): RootNode;
    constructor();
    /**
     * @link Node.getType
     */
    getType(): string;
    /**
     * @link RicciNode.toJSON
     */
    toJSON(): RootNodeJSON;
    getIsoValue(): number;
    setIsoValue(v: number): void;
    /**
     *  @return The neutral value of this tree, ie the value of the field in empty region of space.
     *                   This is an API for external use and future development. For now it is hard set to 0.
     */
    getNeutralValue(): number;
    /**
     * @link Node.invalidAABB for a complete description
     */
    invalidAABB(): void;
    /**
     *  Basically perform a trim but keep track of trimmed elements.
     *  This is usefull if you want to trim, then untrim, then trim, etc...
     *  For example, this is very useful for evaluation optimization.
     */
    internalTrim(aabb: Box3): void;
    /**
     *  Wrapper for trim, will help programmers to make the difference between
     *  internal and external trim.
     *  @param trimmed Array of trimmed Elements
     *  @param parents Array of fathers from which each trimmed element has been removed.
     */
    externalTrim(aabb: Box3, trimmed: Element[], parents: Node[]): void;
    /**
     *  Reset the full blobtree
     */
    internalUntrim(): void;
    /**
     *  Reset the full blobtree given previous trimming data.
     *  Note : don't forget to recall prepareForEval if you want to perform evaluation.
     *  @param trimmed Array of trimmed Elements
     *  @param parents Array of fathers from which each trimmed element has been removed.
     */
    untrim(trimmed: Element[], parents: Node[]): void;
    /**
     *  Tell if the blobtree is empty
     *  @return true if blobtree is empty
     */
    isEmpty(): boolean;
    intersectRayBlob: (this: RootNode, ray: Ray, res: IntersectionResult, maxDistance: number, _precision: number) => boolean;
    /**
     *  Kaiser function for some intersection and raycasting...
     *  Undocumented.
     *  TODO : check, it is probably an optimized intersection for blob intersection
     *         in X, Y or Z directions.
     */
    intersectOrthoRayBlob: (this: RootNode, wOffset: number, hOffset: number, res: IntersectionResult[], dim: {
        axis: {
            x: boolean;
            y: boolean;
            z: boolean;
        };
        get: (v: Vector3) => number;
        add: (v: Vector3, s: number) => void;
        divide: (v: Vector3, s: number) => void;
    }) => void;
}
export {};
//# sourceMappingURL=RootNode.d.ts.map
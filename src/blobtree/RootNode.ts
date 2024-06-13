import { Box3, Ray, Vector3 } from "three";
import { Types } from "./Types"
import { RicciNode } from "./RicciNode";
import { Convergence } from "../utils/Convergence"

import type { Element, ValueResultType } from './Element';
import type { Node } from './Node';
import type { RicciNodeJSON } from './RicciNode';

type RootNodeJSON = {
  iso: number;
} & RicciNodeJSON;


interface IntersectionResult {
    distance?: number; // distance from ray.origin to intersection point
    point: Vector3; // intersection point
    g?: Vector3; // gradient at intersection, if required
  }

/**
 *  The root of any implicit blobtree. Does behave computationaly like a RicciNode with n = 64.
 *  The RootNode is the only node to be its own parent.
 *  @constructor
 *  @extends RicciNode
 */
export class RootNode extends RicciNode {
    iso_value: number;
    trimmed: Element[];
    trim_parents: Node[];

    static override type = "RootNode";

    override fromJSON(json: RootNodeJSON): RootNode {
        const res = new RootNode();
        for (let i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    };

    constructor() {
        // Default RootNode is a riccinode with ricci_n = 64 (almost a max)
        super(64);

        this.valid_aabb = true;

        // Default iso value, value where the surface is present
        this.iso_value = 1.0;

        // Set some nodes as "trimmed", so they are not evaluated.
        this.trimmed = [];
        this.trim_parents = [];
    }

    /**
     * @link Node.getType
     */
    override getType(): string {
        return RootNode.type;
    };

    /**
     * @link RicciNode.toJSON
     */
    override toJSON(): RootNodeJSON {
        const res = {
            ...super.toJSON(),
            iso: this.iso_value
        };
        return res;
    };

    getIsoValue(): number {
        return this.iso_value;
    };

    setIsoValue(v: number): void {
        this.iso_value = v;
    };

    /**
     *  @return The neutral value of this tree, ie the value of the field in empty region of space.
     *                   This is an API for external use and future development. For now it is hard set to 0.
     */
    getNeutralValue(): number {
        return 0;
    };

    /**
     * @link Node.invalidAABB for a complete description
     */
    override invalidAABB(): void {
        this.valid_aabb = false;
    };

    /**
     *  Basically perform a trim but keep track of trimmed elements.
     *  This is usefull if you want to trim, then untrim, then trim, etc...
     *  For example, this is very useful for evaluation optimization.
     */
    internalTrim(aabb: Box3) {
        if (!(this.trimmed.length === 0 && this.trim_parents.length === 0)) {
            throw "Error : you should not call internal trim if you have not untrimmed before. Call untrim or use externalTrim";
        }
        this.trim(aabb, this.trimmed, this.trim_parents);
    };

    /**
     *  Wrapper for trim, will help programmers to make the difference between
     *  internal and external trim.
     *  @param trimmed Array of trimmed Elements
     *  @param parents Array of fathers from which each trimmed element has been removed.
     */
    externalTrim(aabb: Box3, trimmed: Element[], parents: Node[]) {
        this.trim(aabb, trimmed, parents);
    };

    /**
     *  Reset the full blobtree
     */
    internalUntrim(): void {
        this.untrim(this.trimmed, this.trim_parents);
        this.trimmed.length = 0;
        this.trim_parents.length = 0;
    };

    /**
     *  Reset the full blobtree given previous trimming data.
     *  Note : don't forget to recall prepareForEval if you want to perform evaluation.
     *  @param trimmed Array of trimmed Elements
     *  @param parents Array of fathers from which each trimmed element has been removed.
     */
    untrim(trimmed: Element[], parents: Node[]) {
        if (!(trimmed.length === parents.length)) {
            throw "Error : trimmed and parents arrays should have the same length";
        }
        for (let i = 0; i < trimmed.length; ++i) {
            parents[i].addChild(trimmed[i]);
        }
    };

    /**
     *  Tell if the blobtree is empty
     *  @return true if blobtree is empty
     */
    isEmpty (): boolean {
        return this.children.length == 0;
    };


    intersectRayBlob = function () {
        const curPos = new Vector3();
        const marchingVector = new Vector3();
        const currentStep = new Vector3();

        const tmp_res: ValueResultType = {
            v: 0,
            g: new Vector3(),
            m: null,
            step: 0
        };
        const conv_res = {
            p: new Vector3(),
            g: new Vector3(),
            p_absc: 0.0
        };
        let previousStepLength = 0;
        let previousValue = 0; // used for linear interp for a better guess
        let dist = 0;
        /**
         *  @param ray Ray to cast for which intersection is seeked.
         *
         *  @param maxDistance If the intersection is not located at a distance
         *                              lower than maxDistance, it will not be considered.
         *                              The smaller this is, the faster the casting will be.
         *  @param _precision Distance to the intersection under which we will
         *                            consider to be on the intersection point.
         *
         *  @return True if an intersection has been found.
         */
        return function (this: RootNode, ray: Ray, res: IntersectionResult, maxDistance: number, _precision: number): boolean {
            curPos.copy(ray.origin);
            marchingVector.copy(ray.direction);

            marchingVector.normalize();
            dist = 0;
            // compute first value to have next step length
            tmp_res.g = null;
            this.value(curPos, tmp_res);

            // march
            if (tmp_res.step === undefined)
                throw "[RootNode] intersectRayBlob: step is not defined in the value result. This cannot happen.";
            while ((tmp_res.v < this.iso_value) && (dist < maxDistance)) {
                curPos.add(
                    currentStep.copy(marchingVector).multiplyScalar(tmp_res.step)
                );
                dist += tmp_res.step;

                previousStepLength = tmp_res.step;
                previousValue = tmp_res.v;

                this.value(
                    curPos,
                    tmp_res);
            }
            if (tmp_res.v >= this.iso_value) {

                Convergence.safeNewton1D(
                    this,
                    curPos,
                    marchingVector.multiplyScalar(-1.0),
                    0.0,
                    previousStepLength,
                    previousStepLength * (this.iso_value - tmp_res.v) / (previousValue - tmp_res.v), // linear approx of the first position
                    this.iso_value,
                    previousStepLength / 512.0, //deltaPix*(dist-previousStepLength), // should be the size of a pixel at the previous curPos BROKEN?
                    10,
                    conv_res
                );
                res.distance = dist - conv_res.p_absc;

                res.point = conv_res.p.clone();

                // test wether the caller wanted to compute the gradient
                // (we assume that if res.g is defined, it's a request)
                if (res.g) {
                    res.g.copy(conv_res.g);
                }

                return true;
            }
            else {
                // no intersection
                return false;
            }
        };
    }();


    /**
     *  Kaiser function for some intersection and raycasting...
     *  Undocumented.
     *  TODO : check, it is probably an optimized intersection for blob intersection
     *         in X, Y or Z directions.
     */
    intersectOrthoRayBlob = function () {
        // curpos and marching vector are only instanciated once,
        // we are using closure method
        const curPos = new Vector3();
        const resumePos = new Vector3();
        const tmp_res: ValueResultType = {
            v: 0,
            m: null,
            g: null,
            step: 0
        };
        const g = new Vector3();
        const dicho_res: ValueResultType = {
            v: 0,
            m: null,
            g: null
        };
        let previousStepLength = 0;
        let previousDist = 0;
        // to ensure that we're within the aabb
        const epsilon = 0.0000001;
        let within = -1;
        type DimObject = {
            axis: {
                x: boolean;
                y: boolean;
                z: boolean;
            };
            get: (v: Vector3) => number;
            add: (v: Vector3, s: number) => void;
            divide: (v: Vector3, s: number) => void;
        };
        return function (this: RootNode, wOffset: number, hOffset: number, res: IntersectionResult[], dim: DimObject) {

            if (dim.axis.x) {
                curPos.set(this.aabb.min.x + wOffset,
                    this.aabb.min.y + hOffset,
                    this.aabb.min.z + epsilon);
            } else if (dim.axis.y) {
                curPos.set(this.aabb.min.x + wOffset,
                    this.aabb.min.y + epsilon,
                    this.aabb.min.z + hOffset);
            } else if (dim.axis.z) {
                curPos.set(this.aabb.min.x + epsilon,
                    this.aabb.min.y + wOffset,
                    this.aabb.min.z + hOffset);
            }

            // max depth step we can do (has to be set)
            tmp_res.step = dim.get(this.aabb.max) - dim.get(this.aabb.min);

            this.value(curPos, tmp_res);

            previousStepLength = epsilon;

            within = -1;

            // we're looking for all intersection, we won't stop before that
            while (dim.get(curPos) < dim.get(this.aabb.max)) {
                // march
                // the '=0' case is important, otherwise there's an infinite loop
                while (((tmp_res.v - 1) * within >= 0) && (dim.get(curPos) < dim.get(this.aabb.max))) {
                    // orthographic march
                    // our tmp_res.step is valid as we know it's within the aabb
                    dim.add(curPos, tmp_res.step);

                    previousStepLength = tmp_res.step;

                    // max depth step we can do (has to be set)
                    tmp_res.step = dim.get(this.aabb.max) - dim.get(curPos);
                    this.value(
                        curPos,
                        tmp_res);
                }
                // either a sign difference or we're out
                if (dim.get(curPos) < dim.get(this.aabb.max)) {
                    // we ain't out, so it was a sign difference
                    within *= -1;
                    // keep track of our current position in order to resume marching later
                    resumePos.copy(curPos);
                    previousDist = dim.get(curPos);

                    // compute intersection
                    // dichotomia: first step is going back half of the previous distance
                    previousStepLength /= 2;

                    dim.add(curPos, -previousStepLength);

                    // we use dicho_res instead of tmp_res because we need
                    // to keep track of previous results in order to resume later

                    // dynamic number of dichotomia step
                    dicho_res.g = null;
                    while (previousStepLength > 0.1) {
                        previousDist = dim.get(curPos);
                        previousStepLength /= 2;
                        // not asking for the next step, which is always half of previous
                        this.value(curPos, dicho_res);

                        if ((dicho_res.v - 1) * within < 0)
                            // forward
                            dim.add(curPos, previousStepLength);
                        else
                            // backward
                            dim.add(curPos, -previousStepLength);
                    }
                    // linear interpolation with previous dist
                    dim.add(curPos, previousDist);
                    dim.divide(curPos, 2);
                    // get the gradient
                    dicho_res.g = g;
                    this.value(curPos, dicho_res);
                    res.push({
                        point: curPos.clone(),
                        g: dicho_res.g.clone()
                    });
                    // set constiable in order to resume to where we were
                    curPos.copy(resumePos);
                }
            }
        };
    }();

};

Types.register(RootNode.type, RootNode);
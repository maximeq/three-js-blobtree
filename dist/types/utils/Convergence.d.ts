/**
 * @author Maxime Quiblier
 */
import { Vector3 } from "three";
import type { ValueResultType } from "../blobtree";
import type { Element } from "../blobtree/Element";
type SafeNewton1DResult = {
    p: Vector3;
    g: Vector3;
    p_absc: number;
};
type Convergence = {
    last_mov_pt: Vector3;
    grad: Vector3;
    eval_res_g: Vector3;
    eval_res: ValueResultType;
    vec: Vector3;
    safeNewton3D(pot: Element, starting_point: Vector3, value: number, epsilon: number, n_max_step: number, r_max: number, res: Vector3): void;
    safeNewton1D(pot: Element, origin: Vector3, search_dir_unit: Vector3, min_absc_inside: number, max_absc_outside: number, starting_point_absc: number, value: number, epsilon: number, n_max_step: number, res: SafeNewton1DResult): void;
    dichotomy1D(pot: Element, origin: Vector3, search_dir_unit: Vector3, startStepLength: number, value: number, epsilon: number, n_max_step: number, res: SafeNewton1DResult): void;
};
export declare const Convergence: Convergence;
export {};
//# sourceMappingURL=Convergence.d.ts.map
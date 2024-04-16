export var last_mov_pt: THREE.Vector3;
export var grad: THREE.Vector3;
export var eval_res_g: THREE.Vector3;
export var eval_res: {
    v: number;
    m: Material;
    g: THREE.Vector3;
};
export var vec: THREE.Vector3;
/**
 * @param {BlobtreeElement} pot
 * @param {THREE.Vector3} starting_point
 * @param {number} value
 * @param {number} epsilon
 * @param {number} n_max_step
 * @param {number} r_max
 * @param {THREE.Vector3} res
 * @returns
 */
export function safeNewton3D(pot: BlobtreeElement, starting_point: THREE.Vector3, value: number, epsilon: number, n_max_step: number, r_max: number, res: THREE.Vector3): void;
/**
 *
 * @typedef {Object} safeNewton1DResult
 * @property {THREE.Vector3} p
 * @property {THREE.Vector3} g
 * @property {number} p_absc
 *
 */
/** This algorithm uses Newton convergence to find a point epsilon close to
*        a point "p" such that the given potential "pot" evaluated at "p" is "value".
*        The search is constrained on line defined by (origin, search_dir), and between bounds
*        defined by min_absc and max_absc which are the abscissae on the line with respect
*        to origin and search_dir. search_dir should be normalized.
*        The starting point is given with an abscissa : origin + starting_point_absc*search_dir
*
*   @param {BlobtreeElement} pot
*   @param {THREE.Vector3} origin Point choosen as origin in the search line frame.
*   @param {THREE.Vector3} search_dir_unit unit vector that, together with origin, defines the searching line. Should be normalized
*   @param {number} min_absc_inside Minimum abscissa on the line : the algorithm will not search for a point below this abscissa.
*   @param {number} max_absc_outside Maximum abscissa on the line : the algorithm will not search for a point above this abscissa.
*   @param {number} starting_point_absc Abscissa of the starting point, with respect to the search dir.
*   @param {number} value The potential value we are looking for on the line with respect to pot.Eval(..)
*   @param {number} epsilon We want the result to be at least epsilon close to the surface with respect to the
*                   distance Vector.norm(), we suppose this norm to be the one associated with the dot product Vector.operator |
*   @param {number} n_max_step Maximum of newton step before giving up.
*
*   @param {safeNewton1DResult} res
*
*
*   @todo write documentation to talk about failure cases.
*   @todo Should not normalise search_dir. Change that here and in all part of code where this is used.
*/
export function safeNewton1D(pot: BlobtreeElement, origin: THREE.Vector3, search_dir_unit: THREE.Vector3, min_absc_inside: number, max_absc_outside: number, starting_point_absc: number, value: number, epsilon: number, n_max_step: number, res: safeNewton1DResult): void;
export function dichotomy1D(pot: any, origin: any, search_dir_unit: any, startStepLength: any, value: any, epsilon: any, n_max_step: any, res: any): void;
export type safeNewton1DResult = {
    p: THREE.Vector3;
    g: THREE.Vector3;
    p_absc: number;
};
import THREE = require("three");
import Material = require("../blobtree/Material.js");
import BlobtreeElement = require("../blobtree/Element.js");
//# sourceMappingURL=Convergence.d.ts.map
export let KS: number;
export let KIS: number;
export let KS2: number;
export let KIS2: number;
/**
 *  Compute the iso value at a given distance for a given polynomial degree
 *  and scale in 0 dimension (point)
 *
 *  @param {number} degree  Polynomial degree of the kernel
 *  @param {number} scale   Kernel scale
 *  @param {number} dist    Distance
 *  @return {number} The iso value at a given distance for a given polynomial degree and scale
 */
export function GetIsoValueAtDistanceGeom0D(degree: number, scale: number, dist: number): number;
/**
 *  Compute the iso value at a given distance for a given polynomial degree
 *  and scale in 1 dimension
 *
 *  @param {number} degree  Polynomial degree of the kernel
 *  @param {number} scale   Kernel scale
 *  @param {number} dist    Distance
 *  @return {number} The iso value at a given distance for a given polynomial degree and scale
 */
export function GetIsoValueAtDistanceGeom1D(degree: number, scale: number, dist: number): number;
/**
 *  Compute the iso value at a given distance for a given polynomial degree
 *  and scale in 2 dimensions
 *
 *  @param {number} degree  Polynomial degree of the kernel
 *  @param {number} scale   Kernel scale
 *  @param {number} dist    Distance
 *  @return {number} The iso value at a given distance for a given polynomial degree and scale
 */
export function GetIsoValueAtDistanceGeom2D(degree: number, scale: number, dist: number): number;
export declare function Poly6Eval(r: number): number;
export declare function Poly6EvalSq(r2: number): number;
export declare const Poly4NF0D: number;
export declare const Poly6NF0D: number;
export declare const Poly4NF1D: number;
export declare const Poly6NF1D: number;
export declare const Poly4NF2D: number;
export declare const Poly6NF2D: number;
//# sourceMappingURL=ScalisMath.d.ts.map
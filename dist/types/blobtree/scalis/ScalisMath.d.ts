export declare const ScalisMath: {
    KS: number;
    KIS: number;
    KS2: number;
    KIS2: number;
    /**
     *  Compact Polynomial of degree 6 evaluation function
     *  @param {number} r Radius (ie distance)
     */
    Poly6Eval: (r: any) => number;
    /**
     *  Compact Polynomial of degree 6 evaluation function from a squared radius.
     *  (avoid square roots in some cases)
     *  @param {number} r2 Radius squared (ie distance squared)
     */
    Poly6EvalSq: (r2: any) => number;
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 0 dimension (point)
     *
     *  @param {number} degree  Polynomial degree of the kernel
     *  @param {number} scale   Kernel scale
     *  @param {number} dist    Distance
     *  @return {number} The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom0D: (degree: any, scale: any, dist: any) => number;
    /**
     * @type {number} Normalization Factor for polynomial 4 in 0 dimension
     * @const
     */
    Poly4NF0D: number;
    /**
     * @type {number} Normalization Factor for polynomial 6 in 0 dimension
     * @const
     */
    Poly6NF0D: number;
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 1 dimension
     *
     *  @param {number} degree  Polynomial degree of the kernel
     *  @param {number} scale   Kernel scale
     *  @param {number} dist    Distance
     *  @return {number} The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom1D: (degree: any, scale: any, dist: any) => number;
    /**
     * @type {number} Normalization Factor for polynomial 4 in 1 dimension
     * @const
     */
    Poly4NF1D: number;
    /**
     * @type {number} Normalization Factor for polynomial 6 in 1 dimension
     * @const
     */
    Poly6NF1D: number;
    /**
     *  Compute the iso value at a given distance for a given polynomial degree
     *  and scale in 2 dimensions
     *
     *  @param {number} degree  Polynomial degree of the kernel
     *  @param {number} scale   Kernel scale
     *  @param {number} dist    Distance
     *  @return {number} The iso value at a given distance for a given polynomial degree and scale
     */
    GetIsoValueAtDistanceGeom2D: (degree: any, scale: any, dist: any) => number;
    /**
     * @type {number} Normalization Factor for polynomial 4 in 2 dimension
     * @const
     */
    Poly4NF2D: number;
    /**
     * @type {number} Normalization Factor for polynomial 6 in 2 dimension
     * @const
     */
    Poly6NF2D: number;
};
//# sourceMappingURL=ScalisMath.d.ts.map
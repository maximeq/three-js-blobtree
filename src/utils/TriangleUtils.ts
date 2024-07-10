import { Vector3, Matrix4 } from "three";

interface VertexLike {
    getPos: () => Vector3;
    getThickness: () => number;
}

export interface TriangleLike extends TriangleComputedAttributes {
    v: VertexLike[];
}

export interface TriangleComputedAttributes {
    p0p1?: Vector3;
    p1p2?: Vector3;
    p2p0?: Vector3;
    unit_p0p1?: Vector3;
    unit_p1p2?: Vector3;
    unit_p2p0?: Vector3;
    unit_normal?: Vector3;
    length_p0p1?: number;
    length_p1p2?: number;
    length_p2p0?: number;
    diffThick_p0p1?: number;
    diffThick_p1p2?: number;
    diffThick_p2p0?: number;
    ortho_dir?: Vector3;
    point_min?: Vector3;
    weight_min?: number;
    main_dir?: Vector3;
    point_iso_zero?: Vector3;
    proj_dir?: Vector3;
    equal_weights?: boolean;
    half_dir_1?: Vector3;
    point_half?: Vector3;
    half_dir_2?: Vector3;
    coord_max?: number;
    coord_middle?: number;
    unit_delta_weight?: number;
    longest_dir_special?: Vector3;
    // The following properties seem to be intended as calculated properties or methods, which cannot be directly declared in TypeScript interfaces.
    max_seg_length?: number; // This should be calculated in a method, not directly in the interface.
    unsigned_ortho_dir?: Vector3; // This should be calculated in a method, not directly in the interface.
}

interface TriangleLikeDeprecated {
    v: VertexLike[];
    p0p1: Vector3;
    p1p2: Vector3;
    p2p0: Vector3;
    unit_p0p1: Vector3;
    unit_p1p2: Vector3;
    unit_p2p0: Vector3;
    unit_normal: Vector3;
    main_dir: Vector3;
    ortho_dir: Vector3;
    length_p0p1?: number;
    length_p1p2?: number;
    length_p2p0?: number;
    diffThick_p0p1?: number;
    diffThick_p1p2?: number;
    diffThick_p2p0?: number;
    point_min?: Vector3;
    weight_min?: number;
    point_iso_zero?: Vector3;
    proj_dir?: Vector3;
    equal_weights?: boolean;
    half_dir_1?: Vector3;
    point_half?: Vector3;
    half_dir_2?: Vector3;
    coord_max?: number;
    coord_middle?: number;
    unit_delta_weight?: number;
    longest_dir_special?: Vector3;
    // The following properties seem to be intended as calculated properties or methods, which cannot be directly declared in TypeScript interfaces.
    max_seg_length?: number; // This should be calculated in a method, not directly in the interface.
    unsigned_ortho_dir?: Vector3; // This should be calculated in a method, not directly in the interface.
}

const EPSILON = 0.000001;
export const TriangleUtils = {

/*
  ! Triangle extends Primitive and must have the following properties in constructor: !

    this.p0p1  = new Vector3();
    this.p1p2 = new Vector3();
    this.p2p0 = new Vector3();
    this.unit_normal = new Vector3();
    this.unit_p0p1 = new Vector3();
    this.unit_p1p2 = new Vector3();
    this.unit_p2p0 = new Vector3();
    this.length_p0p1 = 0;
    this.length_p1p2 = 0;
    this.length_p2p0 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p0p1 = 0;
    this.main_dir = new Vector3();
    this.point_iso_zero = new Vector3();
    this.ortho_dir      = new Vector3();
    this.unsigned_ortho_dir = new Vector3();
    this.proj_dir       = new Vector3();
    this.equal_weights = false; // Use to skip computations for a specific case

    this.coord_max           = 0;
    this.coord_middle        = 0;
    this.unit_delta_weight   = 0;
    this.longest_dir_special = 0;
    this.max_seg_length      = 0;
    this.half_dir_1 = new Vector3();
    this.point_half = new Vector3();
    this.half_dir_2 = new Vector3();
    this.point_min = new Vector3();
    this.weight_min = 0;

*/

/**
 * intermediary functions used in computeVectorsDirs
 */
cleanIndex(ind: number, lengthArray: number) {
    let res = ind;
    if (lengthArray === 0) {
        throw "[TriangleUtils] cleanIndex : Length of the array should not be 0";
    }
    if (lengthArray === 1) {
        return 0;
    }
    // negative index are looped back at the end of the array
    if (ind < 0) res = (lengthArray + ind) % lengthArray;
    // index greater than the array length are looped back at the beginning
    if (ind >= lengthArray) {
        res = ind % lengthArray;
    }
    return res;
},

/**
 * Updates the cached values of the triangle
 * @param triangle The triangles who's internal values need to be updated
 */
updateComputedAttributes(triangle: TriangleLike) {
    let v0_p = triangle.v[0].getPos();
    let v1_p = triangle.v[1].getPos();
    let v2_p = triangle.v[2].getPos();

    if (triangle.p0p1) triangle.p0p1.subVectors(v1_p, v0_p);
    if (triangle.p1p2) triangle.p1p2.subVectors(v2_p, v1_p);
    if (triangle.p2p0) triangle.p2p0.subVectors(v0_p, v2_p);

    if (triangle.unit_normal && triangle.p0p1 && triangle.p2p0) {
        // triangle.unit_normal.crossVectors(triangle.p0p1,triangle.p1p2);
        triangle.unit_normal.crossVectors(triangle.p0p1, triangle.p2p0);
        triangle.unit_normal.normalize();
    }

    if (triangle.p0p1 && triangle.unit_p0p1) {
        triangle.length_p0p1 = triangle.p0p1.length();
        triangle.unit_p0p1.copy(triangle.p0p1);
        triangle.unit_p0p1.divideScalar(triangle.length_p0p1);
        triangle.diffThick_p0p1 = triangle.v[0].getThickness() - triangle.v[1].getThickness();
    }

    if (triangle.p1p2 && triangle.unit_p1p2) {
        triangle.length_p1p2 = triangle.p1p2.length();
        triangle.unit_p1p2.copy(triangle.p1p2);
        triangle.unit_p1p2.divideScalar(triangle.length_p1p2);
        triangle.diffThick_p1p2 = triangle.v[1].getThickness() - triangle.v[2].getThickness();
    }

    if (triangle.p2p0 && triangle.unit_p2p0) {
        triangle.length_p2p0 = triangle.p2p0.length();
        triangle.unit_p2p0.copy(triangle.p2p0);
        triangle.unit_p2p0.divideScalar(triangle.length_p2p0);
        triangle.diffThick_p2p0 = triangle.v[2].getThickness() - triangle.v[0].getThickness();
    }
    // Precomputation Used in mech computation
    // So we first find the direction of maximum weight constiation.

    let sortingArr: {vert: Vector3, thick: number, idx: number}[] = [];
    sortingArr.push({ vert: triangle.v[0].getPos(), thick: triangle.v[0].getThickness(), idx: 0 });
    sortingArr.push({ vert: triangle.v[1].getPos(), thick: triangle.v[1].getThickness(), idx: 1 });
    sortingArr.push({ vert: triangle.v[2].getPos(), thick: triangle.v[2].getThickness(), idx: 2 });

    // sort by the min thickness
    sortingArr.sort(function (a, b) { return a.thick - b.thick; });
    triangle.point_min = sortingArr[0].vert;
    triangle.weight_min = sortingArr[0].thick;
    // Cycle throught the other points
    let idx = TriangleUtils.cleanIndex(sortingArr[0].idx + 1, 3);
    let point_1 = triangle.v[idx].getPos();
    let weight_1 = triangle.v[idx].getThickness();
    idx = TriangleUtils.cleanIndex(sortingArr[0].idx + 2, 3);
    let point_2 = triangle.v[idx].getPos();
    let weight_2 = triangle.v[idx].getThickness();
    let dir_1 = new Vector3();
    dir_1 = dir_1.subVectors(point_1, triangle.point_min);
    let dir_2 = new Vector3();
    dir_2 = dir_2.subVectors(point_2, triangle.point_min);
    let delta_1 = weight_1 - triangle.weight_min;
    let delta_2 = weight_2 - triangle.weight_min;
    if (delta_1 < EPSILON || delta_2 < EPSILON) {
        if (delta_1 < delta_2) { //delta_1 is closer to 0
            triangle.ortho_dir = dir_1.clone();
            triangle.ortho_dir.normalize();

            // direction of fastest constiation of weight
            if (triangle.main_dir && triangle.unit_normal) {
                triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
                triangle.main_dir.normalize();
                if ((triangle.main_dir.dot(dir_2)) < 0.0) {
                    triangle.main_dir.multiplyScalar(-1.0);
                }
            }
            let coord_iso_zero_dir = - triangle.weight_min / delta_2;
            triangle.point_iso_zero = new Vector3(triangle.point_min.x + coord_iso_zero_dir * dir_2.x,
                triangle.point_min.y + coord_iso_zero_dir * dir_2.y,
                triangle.point_min.z + coord_iso_zero_dir * dir_2.z);
        }
        else { //delta_2 is closer to 0
            triangle.ortho_dir = dir_2.clone();
            triangle.ortho_dir.normalize();

            if (triangle.main_dir && triangle.unit_normal) {
                // direction of fastest constiation of weight
                triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
                triangle.main_dir.normalize();
                if ((triangle.main_dir.dot(dir_1)) < 0.0) {
                    triangle.main_dir.multiplyScalar(-1.0);
                }
            }
            let coord_iso_zero_dir = - triangle.weight_min / delta_1;
            triangle.point_iso_zero = new Vector3(triangle.point_min.x + coord_iso_zero_dir * dir_1.x,
                triangle.point_min.y + coord_iso_zero_dir * dir_1.y,
                triangle.point_min.z + coord_iso_zero_dir * dir_1.z);
        }
        if (Math.abs(delta_1 - delta_2) < EPSILON) {
            if (triangle.unit_normal) 
                triangle.proj_dir = triangle.unit_normal.clone().multiplyScalar(-1);
            triangle.equal_weights = true;
        }
    }
    else { // WARNING : numerically instable if delta_ close to zero !
        // find the point were weight equal zero along the two edges that leave from point_min
        let coord_iso_zero_dir1 = - triangle.weight_min / delta_1;
        let point_iso_zero1 = new Vector3(triangle.point_min.x + coord_iso_zero_dir1 * dir_1.x,
            triangle.point_min.y + coord_iso_zero_dir1 * dir_1.y,
            triangle.point_min.z + coord_iso_zero_dir1 * dir_1.z);
        triangle.point_iso_zero = point_iso_zero1;
        let coord_iso_zero_dir2 = - triangle.weight_min / delta_2;
        let point_iso_zero2 = new Vector3(triangle.point_min.x + coord_iso_zero_dir2 * dir_2.x,
            triangle.point_min.y + coord_iso_zero_dir2 * dir_2.y,
            triangle.point_min.z + coord_iso_zero_dir2 * dir_2.z);

        // along ortho_dir the weight are const
        if (triangle.ortho_dir) {
            triangle.ortho_dir.subVectors(point_iso_zero2, point_iso_zero1);
            triangle.ortho_dir.normalize();
        }

        // direction of fastest constiation of weight
        if (triangle.main_dir && triangle.ortho_dir && triangle.unit_normal) {
            triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
            triangle.main_dir.normalize();
            if ((triangle.main_dir.dot(dir_1)) < 0.0 || (triangle.main_dir.dot(dir_2)) < 0.0) {
                triangle.main_dir.multiplyScalar(-1.0);
            }
        }
    }

    if (triangle.main_dir) {
        let coord_1 = dir_1.dot(triangle.main_dir);    // not normalized !
        let coord_2 = dir_2.dot(triangle.main_dir);    // not normalized !

        // due to previous approximation for stability
        coord_1 = (coord_1 < 0.0) ? 0.0 : coord_1;
        coord_2 = (coord_2 < 0.0) ? 0.0 : coord_2;

        let longest_dir = null;
        if (coord_1 > coord_2) {
            longest_dir = dir_1;

            triangle.half_dir_1 = dir_2;
            triangle.point_half = point_2;
            triangle.half_dir_2 = point_1.clone().subVectors(point_1, point_2);

            triangle.coord_max = coord_1;
            triangle.coord_middle = (coord_2 / coord_1) * triangle.coord_max;

            triangle.unit_delta_weight = delta_1 / triangle.coord_max;
        }
        else {
            longest_dir = dir_2;

            triangle.half_dir_1 = dir_1;
            triangle.point_half = point_1;
            triangle.half_dir_2 = point_2.clone().subVectors(point_2, point_1);

            triangle.coord_max = coord_2;
            triangle.coord_middle = (coord_1 / coord_2) * triangle.coord_max;

            triangle.unit_delta_weight = delta_2 / triangle.coord_max;
        }
        
    
        triangle.longest_dir_special = longest_dir.divideScalar(triangle.coord_max);
    }
        // Length of the longest segment during numerical integration
        let tmp = new Vector3();
    if (triangle.half_dir_1 && triangle.longest_dir_special && triangle.coord_middle && triangle.ortho_dir) {
        tmp.subVectors(triangle.half_dir_1, triangle.longest_dir_special.clone().multiplyScalar(triangle.coord_middle));
        triangle.max_seg_length = tmp.length();
        triangle.unsigned_ortho_dir = triangle.ortho_dir.clone();
        if ((triangle.ortho_dir.dot(tmp)) < 0.0) {
            triangle.ortho_dir.multiplyScalar(-1.0);
        }
    }

},
/**
 *  Compute some internal consts for triangle
 *  @param triangle The triangle to compute consts for (blobtree or skel)
 *  @deprecated Please use updateComputedAtrributes instead
 */
computeVectorsDirs(triangle: TriangleLikeDeprecated) {

    let v0_p = triangle.v[0].getPos();
    let v1_p = triangle.v[1].getPos();
    let v2_p = triangle.v[2].getPos();

    triangle.p0p1.subVectors(v1_p, v0_p);
    triangle.p1p2.subVectors(v2_p, v1_p);
    triangle.p2p0.subVectors(v0_p, v2_p);

    //triangle.unit_normal.crossVectors(triangle.p0p1,triangle.p1p2);
    triangle.unit_normal.crossVectors(triangle.p0p1, triangle.p2p0);
    triangle.unit_normal.normalize();

    triangle.length_p0p1 = triangle.p0p1.length();
    triangle.unit_p0p1.copy(triangle.p0p1);
    triangle.unit_p0p1.divideScalar(triangle.length_p0p1);
    triangle.diffThick_p0p1 = triangle.v[0].getThickness() - triangle.v[1].getThickness();

    triangle.length_p1p2 = triangle.p1p2.length();
    triangle.unit_p1p2.copy(triangle.p1p2);
    triangle.unit_p1p2.divideScalar(triangle.length_p1p2);
    triangle.diffThick_p1p2 = triangle.v[1].getThickness() - triangle.v[2].getThickness();

    triangle.length_p2p0 = triangle.p2p0.length();
    triangle.unit_p2p0.copy(triangle.p2p0);
    triangle.unit_p2p0.divideScalar(triangle.length_p2p0);
    triangle.diffThick_p2p0 = triangle.v[2].getThickness() - triangle.v[0].getThickness();

    // Precomputation Used in mech computation
    // So we first find the direction of maximum weight constiation.

    /** @type Array<{vert: Vector3, thick: number, idx: number}> */
    let sortingArr = [];
    sortingArr.push({ vert: triangle.v[0].getPos(), thick: triangle.v[0].getThickness(), idx: 0 });
    sortingArr.push({ vert: triangle.v[1].getPos(), thick: triangle.v[1].getThickness(), idx: 1 });
    sortingArr.push({ vert: triangle.v[2].getPos(), thick: triangle.v[2].getThickness(), idx: 2 });

    // sort by the min thickness
    sortingArr.sort(function (a, b) { return a.thick - b.thick; });
    triangle.point_min = sortingArr[0].vert;
    triangle.weight_min = sortingArr[0].thick;
    // Cycle throught the other points
    let idx = TriangleUtils.cleanIndex(sortingArr[0].idx + 1, 3);
    let point_1 = triangle.v[idx].getPos();
    let weight_1 = triangle.v[idx].getThickness();
    idx = TriangleUtils.cleanIndex(sortingArr[0].idx + 2, 3);
    let point_2 = triangle.v[idx].getPos();
    let weight_2 = triangle.v[idx].getThickness();
    let dir_1 = new Vector3();
    dir_1 = dir_1.subVectors(point_1, triangle.point_min);
    let dir_2 = new Vector3();
    dir_2 = dir_2.subVectors(point_2, triangle.point_min);
    let delta_1 = weight_1 - triangle.weight_min;
    let delta_2 = weight_2 - triangle.weight_min;
    if (delta_1 < EPSILON || delta_2 < EPSILON) {
        if (delta_1 < delta_2) { //delta_1 is closer to 0
            triangle.ortho_dir = dir_1.clone();
            triangle.ortho_dir.normalize();

            // direction of fastest variation of weight
            triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
            triangle.main_dir.normalize();
            if ((triangle.main_dir.dot(dir_2)) < 0.0) {
                triangle.main_dir.multiplyScalar(-1.0);
            }
            let coord_iso_zero_dir = - triangle.weight_min / delta_2;
            triangle.point_iso_zero = new Vector3(triangle.point_min.x + coord_iso_zero_dir * dir_2.x,
                triangle.point_min.y + coord_iso_zero_dir * dir_2.y,
                triangle.point_min.z + coord_iso_zero_dir * dir_2.z);
        }
        else { //delta_2 is closer to 0
            triangle.ortho_dir = dir_2.clone();
            triangle.ortho_dir.normalize();

            // direction of fastest variation of weight
            triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
            triangle.main_dir.normalize();
            if ((triangle.main_dir.dot(dir_1)) < 0.0) {
                triangle.main_dir.multiplyScalar(-1.0);
            }
            let coord_iso_zero_dir = - triangle.weight_min / delta_1;
            triangle.point_iso_zero = new Vector3(triangle.point_min.x + coord_iso_zero_dir * dir_1.x,
                triangle.point_min.y + coord_iso_zero_dir * dir_1.y,
                triangle.point_min.z + coord_iso_zero_dir * dir_1.z);
        }
        if (Math.abs(delta_1 - delta_2) < EPSILON) {
            triangle.proj_dir = triangle.unit_normal.clone().multiplyScalar(-1);
            triangle.equal_weights = true;
        }
    }
    else { // WARNING : numerically instable if delta_ close to zero !
        // find the point were weight equal zero along the two edges that leave from point_min
        let coord_iso_zero_dir1 = - triangle.weight_min / delta_1;
        let point_iso_zero1 = new Vector3(triangle.point_min.x + coord_iso_zero_dir1 * dir_1.x,
            triangle.point_min.y + coord_iso_zero_dir1 * dir_1.y,
            triangle.point_min.z + coord_iso_zero_dir1 * dir_1.z);
        triangle.point_iso_zero = point_iso_zero1;
        let coord_iso_zero_dir2 = - triangle.weight_min / delta_2;
        let point_iso_zero2 = new Vector3(triangle.point_min.x + coord_iso_zero_dir2 * dir_2.x,
            triangle.point_min.y + coord_iso_zero_dir2 * dir_2.y,
            triangle.point_min.z + coord_iso_zero_dir2 * dir_2.z);

        // along ortho_dir the weight are const
        triangle.ortho_dir.subVectors(point_iso_zero2, point_iso_zero1);
        triangle.ortho_dir.normalize();

        // direction of fastest variation of weight
        triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
        triangle.main_dir.normalize();
        if ((triangle.main_dir.dot(dir_1)) < 0.0 || (triangle.main_dir.dot(dir_2)) < 0.0) {
            triangle.main_dir.multiplyScalar(-1.0);
        }
    }

    let coord_1 = dir_1.dot(triangle.main_dir);    // not normalized !
    let coord_2 = dir_2.dot(triangle.main_dir);    // not normalized !

    // due to previous approximation for stability
    coord_1 = (coord_1 < 0.0) ? 0.0 : coord_1;
    coord_2 = (coord_2 < 0.0) ? 0.0 : coord_2;

    let longest_dir = null;
    if (coord_1 > coord_2) {
        longest_dir = dir_1;

        triangle.half_dir_1 = dir_2;
        triangle.point_half = point_2;
        triangle.half_dir_2 = point_1.clone().subVectors(point_1, point_2);

        triangle.coord_max = coord_1;
        triangle.coord_middle = (coord_2 / coord_1) * triangle.coord_max;

        triangle.unit_delta_weight = delta_1 / triangle.coord_max;
    }
    else {
        longest_dir = dir_2;

        triangle.half_dir_1 = dir_1;
        triangle.point_half = point_1;
        triangle.half_dir_2 = point_2.clone().subVectors(point_2, point_1);

        triangle.coord_max = coord_2;
        triangle.coord_middle = (coord_1 / coord_2) * triangle.coord_max;

        triangle.unit_delta_weight = delta_2 / triangle.coord_max;
    }

    triangle.longest_dir_special = longest_dir.divideScalar(triangle.coord_max);

    // Length of the longest segment during numerical integration
    let tmp = new Vector3();
    tmp.subVectors(triangle.half_dir_1, triangle.longest_dir_special.clone().multiplyScalar(triangle.coord_middle));
    triangle.max_seg_length = tmp.length();
    triangle.unsigned_ortho_dir = triangle.ortho_dir.clone();
    if ((triangle.ortho_dir.dot(tmp)) < 0.0) {
        triangle.ortho_dir.multiplyScalar(-1.0);
    }
},

/**
 *  @param triangle
 *     u parametrisation of the point to compute along the axis V0->V1
 *     v parametrisation of the point to compute along the axis V0->V2
 *  @return An object with the computed pos and thickness
 */
getParametrisedVertexAttr(triangle: TriangleLike, u: number, v: number): { pos: Vector3, thick: number } {
    let meanThick = TriangleUtils.getMeanThick(triangle, u, v);
    // create new point
    let pos = new Vector3();
    let uAdd = pos.subVectors(triangle.v[1].getPos(), triangle.v[0].getPos()).multiplyScalar(u);
    let vAdd = pos.clone().subVectors(triangle.v[2].getPos(), triangle.v[0].getPos()).multiplyScalar(v);
    pos.addVectors(triangle.v[0].getPos(), uAdd);
    pos.addVectors(pos, vAdd);

    return { "pos": pos, "thick": meanThick };
},

/**
 *  @param triangle The concerned triangle
 *  @param u u coordinate
 *  @param v v coordinate
 */
getMeanThick (triangle: TriangleLike, u: number, v: number): number {
    return triangle.v[0].getThickness() * (1 - u - v) + triangle.v[1].getThickness() * u + triangle.v[2].getThickness() * v;
},

/*  Cf. http://math.stackexchange.com/questions/148199/equation-for-non-orthogonal-projection-of-a-point-onto-two-vectors-representing
    eq1: W=uU+vV with u and v the parametrisation and V and U the basis vectors
     -> eq 1.dot(U) gives us eq A/   and eq 1.dot(V) gives us eq B/

    A/ u(U⋅U)+v(U⋅V)=W⋅U
    B/ u(V⋅U)+v(V⋅V)=W⋅V
    <=>
    u*a + v*b = c;
    u*d + v*e = f;
    <=>
    v = (f-d*(c/a))*(1/(e-d*b/a));
    u = (c-v*b)/a;
    with:
    a = U.lengthSq();
    b = U.dot(V);
    c = p.dot(U);
    d = V.dot(U);
    e = V.lengthSq();
    f = W.dot(V);
*/
/**
 *  Get the triangle barycenter coordinates. The projection is non orthogonal.
 *  WTF is that? Barycentirc coordinates are 3 components, not 2 !
 *  @param p0p1 Vector from p0 to p1
 *  @param p2p0 Vector from p2 to p0
 *  @param p0 Point 0 in triangle
 *  @param p Point in space
 *
 *  @return {{u:number,v:number}} Coordinate of barycenter
 */
getTriBaryCoord (p0p1: Vector3, p2p0: Vector3, p0: Vector3, p: Vector3): {u: number, v: number} {
    let U = p0p1;
    let V = p2p0.clone().multiplyScalar(-1);
    let W = new Vector3().subVectors(p, p0);

    // b == d
    let a = U.lengthSq();
    let b = U.dot(V);
    let c = W.dot(U);
    let d = V.lengthSq();
    let e = W.dot(V);
    let v = (a * e - b * c) / (a * d - b * b);
    let u = (c - v * b) / a;
    return { "u": u, "v": v };
},

    getUVCoord(U: Vector3, V: Vector3, p0: Vector3, p: Vector3) {
    let W = new Vector3();
    W.crossVectors(U, V);
    let mat = new Matrix4();
    mat.set(U.x, V.x, W.x, 0,
        U.y, V.y, W.y, 0,
        U.z, V.z, W.z, 0,
        0, 0, 0, 1);
    let mat1 = new Matrix4();
    mat1.copy(mat).invert();
    let vec = new Vector3().subVectors(p, p0);
    vec.applyMatrix4(mat1);

    return { u: vec.x, v: vec.y };
}
};
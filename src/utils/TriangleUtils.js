'use strict';

const THREE = require("three-full/builds/Three.cjs.js");


var EPSILON = 0.000001;

var TriangleUtils = {};

/*
  ! Triangle extends Primitive and must have the following properties in constructor: !

    this.p0p1  = new THREE.Vector3();
    this.p1p2 = new THREE.Vector3();
    this.p2p0 = new THREE.Vector3();
    this.unit_normal = new THREE.Vector3();
    this.unit_p0p1 = new THREE.Vector3();
    this.unit_p1p2 = new THREE.Vector3();
    this.unit_p2p0 = new THREE.Vector3();
    this.length_p0p1 = 0;
    this.length_p1p2 = 0;
    this.length_p2p0 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p0p1 = 0;
    this.diffThick_p0p1 = 0;
    this.main_dir = new THREE.Vector3();
    this.point_iso_zero = new THREE.Vector3();
    this.ortho_dir      = new THREE.Vector3();
    this.unsigned_ortho_dir = new THREE.Vector3();
    this.proj_dir       = new THREE.Vector3();
    this.equal_weights = false; // Use to skip computations for a specific case

    this.coord_max           = 0;
    this.coord_middle        = 0;
    this.unit_delta_weight   = 0;
    this.longest_dir_special = 0;
    this.max_seg_length      = 0;
    this.half_dir_1 = new THREE.Vector3();
    this.point_half = new THREE.Vector3();
    this.half_dir_2 = new THREE.Vector3();
    this.point_min = new THREE.Vector3();
    this.weight_min = 0;

*/

// intermediary functions used in computeVectorsDirs
var cleanIndex = function(ind, lengthArray) {
    var res =ind;
    if (lengthArray === 0 ){
        throw "Lenght of the array should not be null";
        return res;
    }
    if (lengthArray ===1){
        return 0;
    }
    // negative index are looped back at the end of the array
    if (ind < 0) res = (lengthArray+ind) % lengthArray;
    // index greater than the array length are looped back at the beginning
    if (ind >= lengthArray) {
        res = ind % lengthArray;
    }
    return res;
};

/**
 *  Compute some internal vars for triangle
 *  @param {!Object} triangle The triangle to compute vars for (blobtree or skel)
 */
TriangleUtils.computeVectorsDirs = function(triangle){

    var v0_p = triangle.v[0].getPos();
    var v1_p = triangle.v[1].getPos();
    var v2_p = triangle.v[2].getPos();

    triangle.p0p1.subVectors(v1_p,v0_p);
    triangle.p1p2.subVectors(v2_p,v1_p);
    triangle.p2p0.subVectors(v0_p,v2_p);

    //triangle.unit_normal.crossVectors(triangle.p0p1,triangle.p1p2);
    triangle.unit_normal.crossVectors(triangle.p0p1,triangle.p2p0);
    triangle.unit_normal.normalize();

    triangle.length_p0p1 = triangle.p0p1.length();
    triangle.unit_p0p1.copy(triangle.p0p1);
    triangle.unit_p0p1.divideScalar(triangle.length_p0p1);
    triangle.diffThick_p0p1 = triangle.v[0].getThickness()-triangle.v[1].getThickness();

    triangle.length_p1p2 = triangle.p1p2.length();
    triangle.unit_p1p2.copy(triangle.p1p2);
    triangle.unit_p1p2.divideScalar(triangle.length_p1p2);
    triangle.diffThick_p1p2 = triangle.v[1].getThickness()-triangle.v[2].getThickness();

    triangle.length_p2p0 = triangle.p2p0.length();
    triangle.unit_p2p0.copy(triangle.p2p0);
    triangle.unit_p2p0.divideScalar(triangle.length_p2p0);
    triangle.diffThick_p2p0 = triangle.v[2].getThickness()-triangle.v[0].getThickness();

    // Precomputation Used in mech computation
    // So we first find the direction of maximum weight variation.

    var sortingArr = [];
    sortingArr.push({ vert: triangle.v[0].getPos(), thick: triangle.v[0].getThickness(), idx:0});
    sortingArr.push({ vert: triangle.v[1].getPos(), thick: triangle.v[1].getThickness(), idx:1});
    sortingArr.push({ vert: triangle.v[2].getPos(), thick: triangle.v[2].getThickness(), idx:2});

    // sort by the min thickness
    sortingArr.sort(function(a, b) { return a.thick - b.thick;});
    triangle.point_min = sortingArr[0].vert;
    triangle.weight_min = sortingArr[0].thick;
    // Cycle throught the other points
    var idx = cleanIndex(sortingArr[0].idx+1,3);
    var point_1 = triangle.v[idx].getPos();
    var weight_1 = triangle.v[idx].getThickness();
    idx = cleanIndex(sortingArr[0].idx+2,3);
    var point_2 = triangle.v[idx].getPos();
    var weight_2 = triangle.v[idx].getThickness();
    var dir_1 = new THREE.Vector3();
    dir_1 = dir_1.subVectors(point_1, triangle.point_min);
    var dir_2 = new THREE.Vector3();
    dir_2 = dir_2.subVectors(point_2, triangle.point_min);
    var delta_1 = weight_1 - triangle.weight_min;
    var delta_2 = weight_2 - triangle.weight_min;
    if(delta_1 < EPSILON || delta_2 < EPSILON)
    {
        if(delta_1 < delta_2)
        { //delta_1 is closer to 0
            triangle.ortho_dir = dir_1.clone();
            triangle.ortho_dir.normalize();

            // direction of fastest variation of weight
            triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
            triangle.main_dir.normalize();
            if( (triangle.main_dir.dot(dir_2)) < 0.0) {
                triangle.main_dir.multiplyScalar( -1.0);
            }
            var coord_iso_zero_dir = - triangle.weight_min / delta_2;
            triangle.point_iso_zero = new THREE.Vector3( triangle.point_min.x + coord_iso_zero_dir*dir_2.x,
                                                triangle.point_min.y + coord_iso_zero_dir*dir_2.y,
                                                triangle.point_min.z + coord_iso_zero_dir*dir_2.z);
        }
        else
        { //delta_2 is closer to 0
            triangle.ortho_dir = dir_2.clone();
            triangle.ortho_dir.normalize();

            // direction of fastest variation of weight
            triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
            triangle.main_dir.normalize();
            if( (triangle.main_dir.dot(dir_1)) < 0.0) {
                triangle.main_dir.multiplyScalar( -1.0);
            }
            var coord_iso_zero_dir = - triangle.weight_min / delta_1;
            triangle.point_iso_zero = new THREE.Vector3(triangle.point_min.x + coord_iso_zero_dir*dir_1.x,
                                                triangle.point_min.y + coord_iso_zero_dir*dir_1.y,
                                                triangle.point_min.z + coord_iso_zero_dir*dir_1.z);
        }
        if(Math.abs(delta_1-delta_2)< EPSILON) {
            triangle.proj_dir = triangle.unit_normal.clone().multiplyScalar(-1);
            triangle.equal_weights = true;
        }
    }
    else
    { // WARNING : numerically instable if delta_ close to zero !
        // find the point were weight equal zero along the two edges that leave from point_min
        var coord_iso_zero_dir1 = - triangle.weight_min / delta_1;
        var point_iso_zero1 = new THREE.Vector3(triangle.point_min.x + coord_iso_zero_dir1*dir_1.x,
                                            triangle.point_min.y + coord_iso_zero_dir1*dir_1.y,
                                            triangle.point_min.z + coord_iso_zero_dir1*dir_1.z);
        triangle.point_iso_zero = point_iso_zero1;
        var coord_iso_zero_dir2 = - triangle.weight_min / delta_2;
        var point_iso_zero2 = new THREE.Vector3(triangle.point_min.x + coord_iso_zero_dir2*dir_2.x,
                                            triangle.point_min.y + coord_iso_zero_dir2*dir_2.y,
                                            triangle.point_min.z + coord_iso_zero_dir2*dir_2.z);

        // along ortho_dir the weight are const
        triangle.ortho_dir.subVectors(point_iso_zero2, point_iso_zero1);
        triangle.ortho_dir.normalize();

        // direction of fastest variation of weight
        triangle.main_dir.crossVectors(triangle.ortho_dir, triangle.unit_normal);
        triangle.main_dir.normalize();
        if( (triangle.main_dir.dot(dir_1)) < 0.0 || (triangle.main_dir.dot(dir_2)) < 0.0) {
            triangle.main_dir.multiplyScalar( -1.0);
        }
    }

    var coord_1 = dir_1.dot(triangle.main_dir);    // not normalized !
    var coord_2 = dir_2.dot(triangle.main_dir);    // not normalized !

    // due to previous approximation for stability
    coord_1 = (coord_1<0.0) ? 0.0 : coord_1;
    coord_2 = (coord_2<0.0) ? 0.0 : coord_2;

    var longest_dir = null;
    if(coord_1 > coord_2)
    {
        longest_dir = dir_1;

        triangle.half_dir_1 = dir_2;
        triangle.point_half = point_2;
        triangle.half_dir_2 = point_1.clone().subVectors(point_1,point_2);

        triangle.coord_max = coord_1;
        triangle.coord_middle = (coord_2/coord_1) * triangle.coord_max;

        triangle.unit_delta_weight = delta_1 / triangle.coord_max;
    }
    else
    {
        longest_dir = dir_2;

        triangle.half_dir_1 = dir_1;
        triangle.point_half = point_1;
        triangle.half_dir_2 = point_2.clone().subVectors(point_2,point_1);

        triangle.coord_max = coord_2;
        triangle.coord_middle = (coord_1/coord_2) * triangle.coord_max;

        triangle.unit_delta_weight = delta_2 / triangle.coord_max;
    }

    triangle.longest_dir_special = longest_dir.divideScalar(triangle.coord_max);

    // Length of the longest segment during numerical integration
    var tmp = new THREE.Vector3();
    tmp.subVectors(triangle.half_dir_1, triangle.longest_dir_special.clone().multiplyScalar(triangle.coord_middle));
    triangle.max_seg_length = tmp.length();
    triangle.unsigned_ortho_dir = triangle.ortho_dir.clone();
    if( (triangle.ortho_dir.dot(tmp)) < 0.0 ) {
        triangle.ortho_dir.multiplyScalar(-1.0);
    }
};

/**
 *  @param {!Object} triangle
 *     u parametrisation of the point to compute along the axis V0->V1
 *     v parametrisation of the point to compute along the axis V0->V2
 *  @return {{pos:!THREE.Vector3, thick:number}} An object with the computed pos and thickness
 */
TriangleUtils.getParametrisedVertexAttr = function(triangle, u, v){
    var meanThick = TriangleUtils.getMeanThick(triangle, u, v);
    // create new point
    var pos = new THREE.Vector3();
    var uAdd = pos.subVectors(triangle.v[1].getPos(), triangle.v[0].getPos()).multiplyScalar(u);
    var vAdd = pos.clone().subVectors(triangle.v[2].getPos(), triangle.v[0].getPos()).multiplyScalar(v);
    pos.addVectors(triangle.v[0].getPos(), uAdd);
    pos.addVectors(pos, vAdd);

    return {"pos": pos, "thick": meanThick};
};

/**
 *  @param {!Object} triangle The concerned triangle
 *  @param {number} u u coordinate
 *  @param {number} v v coordinate
 *  @return {number}
 */
TriangleUtils.getMeanThick = function(triangle, u, v){
    return triangle.v[0].getThickness()*(1-u-v) + triangle.v[1].getThickness()*u + triangle.v[2].getThickness()*v;
};

/**
 *  @param {!Object} triangle The concerned triangle
 *  @param {number} u u coordinate
 *  @param {number} v v coordinate
 *  @return {!Material} Interpolated material
 */
TriangleUtils.getMeanMat = function(triangle, u, v){
    var res = new Material();
    var m_arr = triangle.materials === null?
        [triangle.v[0].getMaterial(),triangle.v[0].getMaterial(),triangle.v[0].getMaterial()] :
        [triangle.materials[0],triangle.materials[1],triangle.materials[2]];
    res.weightedMean(
        m_arr,
        [1-u-v,u,v]
    );
    return res;
};


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
 *  @param {!THREE.Vector3} p0p1 Vector from p0 to p1
 *  @param {!THREE.Vector3} p2p0 Vector from p2 to p0
 *  @param {!THREE.Vector3} p0 Point 0 in triangle
 *  @param {!THREE.Vector3} p Point in space
 *
 *  @return {{u:number,v:number}} Coordinate of barycenter
 */
TriangleUtils.getTriBaryCoord = function(p0p1, p2p0, p0, p){
    var U = p0p1;
    var V = p2p0.clone().multiplyScalar(-1);
    var W = new THREE.Vector3().subVectors(p, p0);

    // b == d
    var a = U.lengthSq();
    var b = U.dot(V);
    var c = W.dot(U);
    var d = V.lengthSq();
    var e = W.dot(V);
    var v = (a*e-b*c)/(a*d-b*b);
    var u = (c-v*b)/a;
    return {"u":u, "v":v};
};

TriangleUtils.getUVCoord = function(U, V, p0, p){
    var W = new THREE.Vector3();
    W.crossVectors(U,V);
    var mat = new THREE.Matrix4();
    mat.set(U.x, V.x, W.x,0,
            U.y, V.y, W.y,0,
            U.z, V.z, W.z,0,
              0,   0,   0,1);
    var mat1 = new THREE.Matrix4();
    mat1.getInverse(mat);
    var vec = new THREE.Vector3().subVectors(p, p0);
    vec.applyMatrix4(mat1);

    return {u:vec.x,v:vec.y};
};

module.exports = TriangleUtils;

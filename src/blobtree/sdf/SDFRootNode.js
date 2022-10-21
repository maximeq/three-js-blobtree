"use strict";

const THREE = require("three");
const Types = require("../Types.js");
const SDFNode = require("./SDFNode.js");
const Primitive = require("../Primitive.js");
const Material = require("../Material.js");
const DistanceFunctor = require('./DistanceFunctor');
const SDFPrimitive = require('./SDFPrimitive');

/** @typedef {import('../areas/Area')} Area */
/** @typedef {import('../Element.js').ValueResultType} ValueResultType */
/** @typedef {import('../Primitive.js').PrimitiveJSON} PrimitiveJSON */

/** @typedef {import('./SDFNode').SDFNodeJSON} SDFNodeJSON */
/** @typedef {import('./DistanceFunctor').DistanceFunctorJSON} DistanceFunctorJSON */


/** @typedef {{f:DistanceFunctorJSON, sdfRoot:SDFNodeJSON} & PrimitiveJSON} SDFRootNodeJSON */

/**
 *  This class implements a SDF Root Node, which is basically a Signed Distance Field
 *  made of some noe combination, on which is applied a compact support function.
 *  For now SDF nodes do not have materials. A unique material is defined in the SDFRootNode.
 *
 */
class SDFRootNode extends Primitive {

    static type = "SDFRootNode";

    /**
     *
     * @param {SDFRootNodeJSON} json
     * @returns
     */
    static fromJSON(json) {
        let f = Types.fromJSON(json.f);
        let material = Material.fromJSON(json.materials[0]);
        let sdfRoot = Types.fromJSON(json.sdfRoot);
        if (!(f instanceof DistanceFunctor)) {
            throw new Error("SDFRootNode parsing resulted in the wrong type of object for parameter f.");
        }
        if (!(material instanceof Material)) {
            console.error("SDFRootNode parsing resulted in the wrong type of object for parameter material, using default.");
            material = null;
        }
        if (!(sdfRoot instanceof SDFNode || sdfRoot instanceof SDFPrimitive)) {
            console.error("SDFRootNode parsing resulted in the wrong type of object for parameter sdfRoot, using default.");
            sdfRoot = null;
        }
        var res = new SDFRootNode(f, material, sdfRoot);
        return res;
    }

    /**
     *
     * @param {DistanceFunctor} f The distance function to be applied to the distance field.
     * It must respect the Blobtree convention, which is : positive everywhere, with a finite support.
     * @param {Material} material
     * @param {SDFNode | SDFPrimitive=} sdfRoot The child containng the complete SDF. SDFRootNode can have only one child.
     */
    constructor(f, material, sdfRoot)
    {
        super();

        this.f = f;

        this.materials.push(material ? material.clone() : new Material());

        this.sdfRoot = sdfRoot ?
            (sdfRoot instanceof SDFNode ? sdfRoot : new SDFNode().addChild(sdfRoot)) : new SDFNode();

        // Tmp vars to speed up computation (no reallocations)
        // TODO : should be pushed in the function static variables since there can be no SDFRoot below the SDFRoot.
        this.tmp_res = {v:0, g:null};
        this.tmp_g = new THREE.Vector3(0,0,0);
    }

    getType(){
        return SDFRootNode.type;
    };

    /**
     * @param {SDFNode | SDFPrimitive} c
     */
    addChild(c){
        if (this.sdfRoot.children.length === 0){
            this.sdfRoot.addChild.call(this,c);
        }else{
            throw "Error : SDFRootNode can have only one child.";
        }
    };

    /**
     * @param {SDFNode | SDFPrimitive} c
     */
    removeChild(c) {
        this.sdfRoot.removeChild(c);
    }

    /**
     * @returns {SDFRootNodeJSON}
     */
    toJSON(){
        var res = {
            ...super.toJSON(),
            f: this.f.toJSON(),
            sdfRoot: this.sdfRoot.toJSON()
        };
        return res;
    };

    prepareForEval()
    {
        if(!this.valid_aabb){
            this.aabb = new THREE.Box3();  // Create empty BBox
            for (let i = 0; i < this.sdfRoot.children.length; ++i){
                let c = this.sdfRoot.children[i];
                c.prepareForEval();
                this.aabb.union(
                    c.computeDistanceAABB(this.f.getSupport())
                );     // new aabb is computed according to remaining children aabb
            }

            this.valid_aabb = true;
        }
    };

    /**
     *  @link Element.getAreas for a complete description
     *
     *  This function is an attempt to have SDFRootNode behave like a Primitive in the normal Blobtree.
     *
     *  @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:Primitive}>}
     */
    getAreas() {
        if(!this.valid_aabb) {
            throw "ERROR : Cannot get area of invalid node";
        } else {
            let distAreas = this.sdfRoot.getDistanceAreas(this.f.getSupport());
            let res = [];
            distAreas.forEach((area) => {
                res.push({
                    aabb: area.aabb,
                    bv: area.bv,
                    obj: this
                });
            });
            return res;
        }
    };

    /**
     *  @link Node.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value(p,res)
    {
        var tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;

        // Init res
        res.v = 0;
        if(res.m)  {
            res.m.copy(Material.defaultMaterial);
        }if(res.g) {
            // res.g.set(0,0,0); // Useless here
        }else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that won't miss any 'min'
            res.step = 1000000000;
        }

        if(this.aabb.containsPoint(p)){
            this.sdfRoot.children[0].value(p,tmp);

            res.v = this.f.value(tmp.v);
            if(res.g){
                res.g.copy(tmp.g).multiplyScalar(this.f.gradient(res.v))
            }
            if(res.m){
                res.m.copy(this.materials[0]);
            }
        }
        else if (res.step !== undefined) {
            // return distance to aabb such that next time we'll hit from within the aabbb
            res.step = this.aabb.distanceToPoint(p) + 0.3;
        }
    };
};

Types.register(SDFRootNode.type, SDFRootNode);

module.exports = SDFRootNode;

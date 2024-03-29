"use strict";

const THREE = require("three");
const Types = require("./Types.js");
const Node = require("./Node.js");
const Material = require("./Material.js");

/** @typedef {import('./Element.js')} Element */
/** @typedef {import('./Element.js').Json} Json */
/** @typedef {import('./Element.js').ValueResultType} ValueResultType */
/** @typedef {import('./Node.js').NodeJSON} NodeJSON */

/**
 * @typedef { {twist_amout:number} & {axis_x:number} & {axis_y:number} & {axis_z:number} & NodeJSON} TwistNodeJSON
 */

/**
 *  This class implement a TwistNode node.
 *  It will return the minimum value of the field of each primitive.
 *  Return 0 in regioin were no primitive is present.
 *  @constructor
 *  @extends Node
 */
class TwistNode extends Node {

    static type = "TwistNode";

    /**
    *  @param {Array.<Node>=} children The children to add to this node.Just a convenient parameter, you can do it manually using addChild.
    */
    constructor(children) {

        super();

        if (children) {
            var self = this;
            children.forEach(function (c) {
                self.addChild(c);
            });
        }

        // temp vars to speed up evaluation by avoiding allocations
        /** @type {{v:number, g:THREE.Vector3, m:Material}} */
        this.tmp_res = { v: 0, g: null, m: null };
        /** @type {THREE.Vector3} */
        this.tmp_g = new THREE.Vector3();
        /** @type {Material} */
        this.tmp_m = new Material();

        this._twist_amout = 1.0;
        this._twist_axis = new THREE.Vector3(0.0,1.0,0.0);
        this._twist_axis_mat = new THREE.Matrix4();
        this._twist_axis_mat_inv = new THREE.Matrix4();

    }

    
     /**
     * @link Node.toJSON
     * @returns {TwistNodeJSON}
     */
      toJSON() {
        let res = {
            ...super.toJSON(),
            twist_amout: this._twist_amout,
            axis_x: this._twist_axis.x,
            axis_y: this._twist_axis.y,
            axis_z: this._twist_axis.z,
        };

        return res;
    };

    /**
     *@link Node.fromJSON
     * 
     * @param {TwistNodeJSON} json
     * @returns {TwistNode}
     */
     static fromJSON(json) {
        var res = new TwistNode();
        res.setTwistAmount(json.twist_amout);
        res.setTwistAxis(new THREE.Vector3(json.axis_x
                                            ,json.axis_y
                                            ,json.axis_z));
        for (var i = 0; i < json.children.length; ++i) {
            res.addChild(Types.fromJSON(json.children[i]));
        }
        return res;
    }

    setTwistAmount(amount)
    {
        this._twist_amout = amount;
    }

    setTwistAxis(axis)
    {
        this._twist_axis = axis;
        this._computeTransforms();
    }

    _computeTransforms()
    {
        let r_angle = Math.acos(this._twist_axis.dot(new THREE.Vector3(0,1,0)));
        if(Math.abs(r_angle) > 0.0001)
        {   
            let t_axis = this._twist_axis.clone();
            let rot_axis = t_axis.cross(new THREE.Vector3(0,1,0));
            rot_axis.normalize();            
            this._twist_axis_mat.makeRotationAxis(rot_axis,r_angle);
        }
        else
        {
            this._twist_axis_mat.identity();
        }
        this._twist_axis_mat_inv = this._twist_axis_mat.clone();
        this._twist_axis_mat_inv.invert();      
    }

    getType () {
        return TwistNode.type;
    }

    /**
     *  @link Element.prepareForEval for a complete description
     */
    prepareForEval () {
        if (!this.valid_aabb) {
            this.aabb = new THREE.Box3();  // Create empty BBox
            for (var i = 0; i < this.children.length; ++i) {
                var c = this.children[i];
                c.prepareForEval();
                this.aabb.union(c.getAABB());     // new aabb is computed according to remaining children aabb
            }

            this.valid_aabb = true;
        }
    };

    /**
     *  @link Element.value for a complete description
     *
     *  @param {THREE.Vector3} p
     *  @param {ValueResultType} res
     */
    value (p, res) {
        // TODO : check that all bounding box of all children and subchildrens are valid
        //        This enable not to do it in prim and limit the number of assert call (and string built)

        var l = this.children.length;
        var tmp = this.tmp_res;
        tmp.g = res.g ? this.tmp_g : null;
        tmp.m = res.m ? this.tmp_m : null;

        // Init res
        res.v = 0;
        if (res.m) {
            res.m.copy(Material.defaultMaterial);
        } if (res.g) {
            res.g.set(0, 0, 0);
        } else if (res.step !== undefined) {
            // that, is the max distance
            // we want a value that loose any 'min'
            res.step = 1000000000;
        }



        if (this.aabb.containsPoint(p) && l !== 0) {
         

            let center = new THREE.Vector3();
            this.aabb.getCenter(center);            
          
            //Center the input point
            let t_p =  new THREE.Vector3(p.x - center.x
                                        ,p.y - center.y
                                        ,p.z - center.z);

            //Rotate towards twist axis space
            t_p.applyMatrix4(this._twist_axis_mat);

            //Twist          
            let c_twist = Math.cos(this._twist_amout*t_p.y);
            let s_twist = Math.sin(this._twist_amout*t_p.y);
        
            //Revert to world space
            let q = new THREE.Vector3(c_twist*t_p.x - s_twist*t_p.z,
                                     t_p.y,
                                     s_twist*t_p.x + c_twist*t_p.z);
            
            q.applyMatrix4(this._twist_axis_mat_inv);

            let t_q = new THREE.Vector3(q.x + center.x
                ,q.y + center.y
                ,q.z + center.z);
                                
            res.v = Number.MAX_VALUE;
            for (var i = 0; i < l; ++i) {
                this.children[i].value(t_q, tmp);
                res.v = tmp.v;

                if (res.g) {
                    res.g.copy(tmp.g);
                }
                if (res.m) {
                    res.m.copy(tmp.m);
                }
                // within primitive potential
                if (res.step || res.stepOrtho) {
                    throw "Not implemented";
                }
            }
        }
        else if (res.step || res.stepOrtho) {
            throw "Not implemented";
        }
    }

    /**
     *  @link Element.trim for a complete description.
     *
     *  @param {THREE.Box3} aabb
     *  @param {Array<Element>} trimmed
     *  @param {Array<Node>} parents
     */
    trim(aabb, trimmed, parents) {
        // Trim remaining nodes
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].trim(aabb, trimmed, parents);
        }
    };
}

Types.register(TwistNode.type, TwistNode);

module.exports = TwistNode;

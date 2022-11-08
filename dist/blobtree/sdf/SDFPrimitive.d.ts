export = SDFPrimitive;
/** @typedef {import('../areas/Area')} Area */
/** @typedef {import('../Element').ElementJSON} ElementJSON */
/** @typedef {import('../Primitive')} Primitive */
/**
 * @typedef {ElementJSON} SDFPrimitiveJSON
 */
/**
 *  This class implements an abstract primitve class for signed distance field.
 *  SDFPrimitive subclasses must define a scalar field being the distance to a geometry.
 *  @constructor
 *  @extends {Element}
 */
declare class SDFPrimitive extends Element {
    /**
     * Return the bounding box of the node for a given maximum distance.
     * Ie, the distance field is greater than d everywhere outside the returned box.
     * @param {number} _d Distance
     * @abstract
     * @return {THREE.Box3}
     */
    computeDistanceAABB(_d: number): THREE.Box3;
    /**
     * @param {number} _d Distance to consider for the area computation.
     * @returns {Array.<{aabb: THREE.Box3, bv:Area, obj:SDFPrimitive}>}
     */
    getDistanceAreas(_d: number): Array<{
        aabb: THREE.Box3;
        bv: Area;
        obj: SDFPrimitive;
    }>;
}
declare namespace SDFPrimitive {
    export { Area, ElementJSON, Primitive, SDFPrimitiveJSON };
}
import Element = require("../Element.js");
import THREE = require("three");
type Area = import('../areas/Area');
type ElementJSON = import('../Element').ElementJSON;
type Primitive = import('../Primitive');
type SDFPrimitiveJSON = ElementJSON;
//# sourceMappingURL=SDFPrimitive.d.ts.map
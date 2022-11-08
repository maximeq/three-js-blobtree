export = AreaSphere;
/** @typedef {import('./Area.js').AreaSphereParam} AreaSphereParam */
/**
 *  AreaSphere is a general representation of a spherical area.
 *  See Primitive.getArea for more details.
 *
 *  @extends {Area}
 */
declare class AreaSphere extends Area {
    /**
     *  @param {!THREE.Vector3} p Point to locate the area
     *  @param {number} r Radius of the area
     *  @param {number=} accFactor Accuracy factor. By default SphereArea will use global Accuracies parameters. However, you can setup a accFactor.
     *                            to change that. You will usually want to have accFactor between 0 (excluded) and 1. Default to 1.0.
     *                            Be careful not to set it too small as it can increase the complexity of some algorithms up to the crashing point.
     */
    constructor(p: THREE.Vector3, r: number, accFactor?: number | undefined);
    p: THREE.Vector3;
    r: number;
    accFactor: number;
    /**
     *  Test intersection of the shape with a sphere
     *  @return {boolean} true if the sphere and the area intersect
     *
     *  @param {!{r:number,c:!THREE.Vector3}} sphere A aphere object, must define sphere.radius (radius) and sphere.center (center, as a THREE.Vector3)
     */
    sphereIntersect: (sphere: any) => boolean;
}
declare namespace AreaSphere {
    export { AreaSphereParam };
}
import Area = require("./Area.js");
import THREE = require("three");
type AreaSphereParam = import('./Area.js').AreaSphereParam;
//# sourceMappingURL=AreaSphere.d.ts.map
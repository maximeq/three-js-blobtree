
// Main HTML script used in most examples with SlidingMarchingCubes
//
// Global variable "geometry", a BufferGeometry computed from a Blobtree.RootNode, must have been defined in a previously included script
// Global variable "mesh", a mesh using "geometry", must have been defined in a previously included script.

import {
    Scene, Color, WebGLRenderer, PerspectiveCamera, Mesh, BufferGeometry, MeshBasicMaterial, DoubleSide,
    DirectionalLight, AmbientLight, Vector3
} from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js"

var camera, controls, scene, renderer, shadow;

init();
animate();

function init() {

    scene = new Scene();
    scene.background = new Color(0xf0f0f0);

    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 100, 0);

    // controls

    controls = new OrbitControls(camera, renderer.domElement);

    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.2;

    controls.screenSpacePanning = false;

    controls.minDistance = 10;
    controls.maxDistance = 1000;

    // Initial Polar angle position
    controls.maxPolarAngle = Math.PI / 3;
    controls.minPolarAngle = Math.PI / 3;
    controls.update();

    controls.maxPolarAngle = Math.PI;

    controls.rotationSpeed = 0.4;

    scene.add(globalThis.mesh);

    // hacked "shadow" (Projection of the geometry on a plane below the object, with solid color.)
    shadow = new Mesh(
        new BufferGeometry(),
        new MeshBasicMaterial({ color: 0xe0e0e0, side: DoubleSide })
    );
    updateShadow();
    scene.add(shadow);

    // lights

    var light = new DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    light.intensity = 0.6
    scene.add(light);
    light = new DirectionalLight(0xffffff);
    light.position.set(1, 1, -1);
    light.intensity = 0.2;
    scene.add(light);
    light = new DirectionalLight(0xffffff);
    light.position.set(-1, -1, -1);
    light.intensity = 0.4;
    scene.add(light);

    light = new AmbientLight(0x222222);
    scene.add(light);

    //

    window.addEventListener('resize', onWindowResize, false);

}

function updateShadow() {
    // Try to build a shadow based on the meshes in the scene.
    shadow.geometry = null;
    scene.traverse(function (obj) {
        if (obj instanceof Mesh && obj !== shadow) {
            if (obj.geometry.boundingBox === null) {
                obj.geometry.computeBoundingBox();
            }
            shadow.geometry = shadow.geometry ? BufferGeometryUtils.mergeBufferGeometries([shadow.geometry, obj.geometry]) : obj.geometry;
        }
    });
    if (!shadow.geometry.boundingBox) {
        shadow.geometry.computeBoundingBox();
    }
    shadow.geometry = shadow.geometry.clone().scale(1, 0.00001, 1).translate(0, -shadow.geometry.boundingBox.getSize(new Vector3()).y / 1.5, 0);
}
globalThis.updateShadow = updateShadow;

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);

    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

    render();

}

function render() {

    renderer.render(scene, camera);

}
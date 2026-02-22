import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SerialManager } from './serial.js';

// Setup Básico 3D
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e5e5e7'); // Fundo cinza suave Apple

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
scene.add(new THREE.GridHelper(10, 10), new THREE.AmbientLight(0xffffff, 1));

// Inicialização Serial
const serial = new SerialManager();

// Reação aos dados
serial.onData = (data) => {
    // Exemplo: if(data.includes('move')) { ... }
};

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
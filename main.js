import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SerialManager } from './serial.js';

// --- CONFIGURAÇÃO THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d1d1d1');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
scene.add(new THREE.GridHelper(10, 10), new THREE.AmbientLight(0xffffff, 0.8));

let modeloAtual = null;
const loader = new GLTFLoader();

function carregarModelo(url) {
    loader.load(url, (gltf) => {
        if (modeloAtual) scene.remove(modeloAtual);
        modeloAtual = gltf.scene;
        scene.add(modeloAtual);
    });
}

// --- INICIALIZA SERIAL E DEFINE A REAÇÃO ---
const serial = new SerialManager();

// Aqui conectamos o dado da Serial com a rotação do Three.js
serial.onData = (data) => {
    if (modeloAtual) {
        // Exemplo: se o sensor enviar 'L', gira para esquerda, 'R' para direita
        if (data.includes('R')) modeloAtual.rotation.y += 0.1;
        if (data.includes('L')) modeloAtual.rotation.y -= 0.1;
    }
};

// Loop de animação
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
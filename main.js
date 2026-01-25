// --- 0. IMPORTS ---
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// --- 1. CONFIGURAÇÃO DA CENA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d1d1d1'); // cor de fundo

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Grid Helper
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// --- 2. ILUMINAÇÃO ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// --- 3. LÓGICA DE CARREGAMENTO ---
const loader = new GLTFLoader();
let modeloAtual = null;

// Input invisível para carregar do PC
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.glb,.gltf';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// Função para carregar qualquer modelo
const carregarModelo = (url) => {
    loader.load(
        url,
        (gltf) => {
            if (modeloAtual) scene.remove(modeloAtual);
            modeloAtual = gltf.scene;
            scene.add(modeloAtual);
            console.log("Modelo carregado:", url);
        },
        (xhr) => console.log(`${((xhr.loaded / xhr.total) * 100).toFixed(0)}% carregado`),
        (error) => console.error("Erro ao carregar:", error)
    );
};

// Evento do input (arquivo local)
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        carregarModelo(url);
    }
});

// --- 4. GUI LIL-GUI ---
const gui = new GUI({ title: 'Studio' });

const settings = {
    corFundo: '#c7c7c7',
    exposicao: 0.8,
    reflexos: 0.3,
    trocarModelo: () => fileInput.click()
};

const pastaRender = gui.addFolder('Render & Ambiente');
pastaRender.addColor(settings, 'corFundo').name('Cor do Fundo').onChange(v => scene.background.set(v));
pastaRender.add(settings, 'exposicao', 0, 2).name('Exposição').onChange(v => renderer.toneMappingExposure = v);
pastaRender.add(settings, 'reflexos', 0, 1).name('Reflexos');

const pastaModelo = gui.addFolder('Ajuste Modelo');
pastaModelo.add(settings, 'trocarModelo').name('📁 Trocar Modelo');

// --- 5. MODELO INICIAL ---
carregarModelo('/models/meninapintando.glb'); // modelo inicial da pasta public/models

// --- 6. RESIZE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 7. LOOP ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

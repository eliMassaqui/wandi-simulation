import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// --- 1. CONFIGURAÇÃO DA CENA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#c7c7c7');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// --- 2. ILUMINAÇÃO ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// --- 3. LÓGICA DE CARREGAMENTO (PC + SERVIDOR) ---
const loader = new GLTFLoader();
let modeloAtual = null;

// Input invisível para abrir arquivos do seu computador
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.glb,.gltf';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// Função principal de carga (respeitando sua lógica original)
const carregarModelo = (url) => {
    loader.load(url, (gltf) => {
        if (modeloAtual) {
            scene.remove(modeloAtual); // Limpa o modelo anterior
        }
        modeloAtual = gltf.scene;
        scene.add(modeloAtual);
        console.log("Modelo carregado!");
    }, 
    (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% carregado'); },
    (error) => { console.error("Erro ao carregar:", error); }
    );
};

// Quando você escolhe um arquivo no seu computador
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file); // Cria link temporário para o arquivo local
        carregarModelo(url);
    }
});

// --- 4. INTERFACE LIL-GUI ---
const gui = new GUI({ title: 'Master Studio' });

const settings = {
    corFundo: '#c7c7c7',
    exposicao: 0.8,
    reflexos: 0.3,
    trocarModelo: () => fileInput.click() // Simula clique no botão de arquivo
};

const pastaRender = gui.addFolder('Render & Ambiente');
pastaRender.addColor(settings, 'corFundo').name('Cor do Fundo').onChange(v => scene.background.set(v));
pastaRender.add(settings, 'exposicao', 0, 2).name('Exposição').onChange(v => renderer.toneMappingExposure = v);
pastaRender.add(settings, 'reflexos', 0, 1).name('Reflexos');

const pastaModelo = gui.addFolder('Ajuste Modelo');
pastaModelo.add(settings, 'trocarModelo').name('📁 Trocar Modelo');

// --- 5. INICIALIZAÇÃO E LOOP ---
// ATENÇÃO: Renomeie seu arquivo para "robotik_arm.glb" (sem espaços) na pasta public
carregarModelo('/robotik_arm.glb'); 

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// --- 1. CONFIGURAÇÃO DA CENA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d1d1d1');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

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

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.glb,.gltf';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

const carregarModelo = (url) => {
    loader.load(
        url,
        (gltf) => {
            if (modeloAtual) scene.remove(modeloAtual);
            modeloAtual = gltf.scene;
            scene.add(modeloAtual);
            console.log("Modelo carregado:", url);
        },
        undefined,
        (error) => console.error("Erro ao carregar:", error)
    );
};

// --- 4. GUI LIL-GUI (Ajustes de Render) ---
const gui = new GUI({ title: 'Configurações de Render' });
const settings = {
    corFundo: '#d1d1d1',
    exposicao: 0.8,
    reflexos: 0.3
};

gui.addColor(settings, 'corFundo').name('Fundo').onChange(v => scene.background.set(v));
gui.add(settings, 'exposicao', 0, 2).name('Exposição').onChange(v => renderer.toneMappingExposure = v);

// --- 5. LÓGICA WEB SERIAL API ---
let porta;
let keepReading = false;

const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const serialLog = document.getElementById('serial-log');

async function lerDados() {
    const decoder = new TextDecoderStream();
    const inputDone = porta.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();

    try {
        while (keepReading) {
            const { value, done } = await reader.read();
            if (done) break;
            
            if (value) {
                serialLog.innerText = `RX: ${value.trim()}`;
                
                // INTEGRAÇÃO: Se receber um número, rotaciona o modelo
                if (modeloAtual) {
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                        modeloAtual.rotation.y = num * (Math.PI / 180);
                    }
                }
            }
        }
    } catch (err) {
        console.error("Erro de leitura:", err);
    } finally {
        reader.releaseLock();
    }
}

btnConnect.addEventListener('click', async () => {
    try {
        // Isso ativa o diálogo do PyQt que você criou!
        porta = await navigator.serial.requestPort();
        await porta.open({ baudRate: 9600 });

        keepReading = true;
        btnConnect.style.display = 'none';
        btnDisconnect.style.display = 'flex';
        statusBadge.classList.add('online');
        statusText.innerText = 'Online';
        serialLog.innerText = 'Conectado.';

        lerDados();
    } catch (err) {
        serialLog.innerText = 'Conexão cancelada.';
    }
});

btnDisconnect.addEventListener('click', async () => {
    keepReading = false;
    if (porta) await porta.close();
    
    btnConnect.style.display = 'flex';
    btnDisconnect.style.display = 'none';
    statusBadge.classList.remove('online');
    statusText.innerText = 'Offline';
    serialLog.innerText = 'Desconectado.';
});

// --- 6. INTEGRAÇÃO DOS BOTÕES DO CARD ---
document.getElementById('btn-import').onclick = () => fileInput.click();

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('file-name').innerText = file.name;
        const url = URL.createObjectURL(file);
        carregarModelo(url);
    }
});

// --- 7. RESIZE E LOOP ---
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
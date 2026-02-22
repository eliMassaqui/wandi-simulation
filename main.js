import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// --- CONFIGURAÇÃO THREE.JS ---
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

scene.add(new THREE.GridHelper(10, 10));
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const loader = new GLTFLoader();
let modeloAtual = null;

// --- GERENCIAMENTO DE MEMÓRIA (Crucial para performance) ---
const limparModeloAnterior = (obj) => {
    obj.traverse((node) => {
        if (node.isMesh) {
            node.geometry.dispose();
            if (Array.isArray(node.material)) {
                node.material.forEach(m => m.dispose());
            } else {
                node.material.dispose();
            }
        }
    });
};

const carregarModelo = (url) => {
    loader.load(url, (gltf) => {
        if (modeloAtual) {
            limparModeloAnterior(modeloAtual);
            scene.remove(modeloAtual);
        }
        modeloAtual = gltf.scene;
        scene.add(modeloAtual);
    }, undefined, (err) => console.error("Erro:", err));
};

// Input de arquivo oculto
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.glb,.gltf';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) carregarModelo(URL.createObjectURL(file));
});

// GUI
const gui = new GUI({ title: 'Studio' });
const settings = {
    corFundo: '#d1d1d1',
    exposicao: 1.0,
    trocarModelo: () => fileInput.click()
};
gui.addColor(settings, 'corFundo').onChange(v => scene.background.set(v));
gui.add(settings, 'exposicao', 0, 2).onChange(v => renderer.toneMappingExposure = v);
gui.add(settings, 'trocarModelo').name('📁 Trocar Modelo');

// --- LÓGICA WEB SERIAL (Otimizada) ---
let port, reader, keepReading = false;
let logBuffer = ""; // Buffer para evitar manipulação excessiva do DOM

const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const btnSend = document.getElementById('btn-send');
const serialInput = document.getElementById('serial-input');
const serialLog = document.getElementById('serial-log');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

function updateUI(connected) {
    btnConnect.disabled = connected;
    btnDisconnect.disabled = !connected;
    btnSend.disabled = !connected;
    serialInput.disabled = !connected;
    statusDot.className = connected ? 'dot connected' : 'dot';
    statusText.textContent = connected ? 'Conectado' : 'Desconectado';
}

function logSerialData(text) {
    logBuffer += text;
    // Mantém apenas os últimos 2000 caracteres no log para não pesar o Chrome
    if (logBuffer.length > 2000) logBuffer = logBuffer.slice(-2000);
    serialLog.textContent = logBuffer;
    serialLog.scrollTop = serialLog.scrollHeight;
}

btnConnect.addEventListener('click', async () => {
    if (!('serial' in navigator)) return alert("Web Serial não suportada.");
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 }); // Se possível, use 115200 no hardware
        updateUI(true);
        keepReading = true;
        readLoop();
    } catch (error) {
        logSerialData(`\nErro: ${error.message}`);
    }
});

async function readLoop() {
    const decoder = new TextDecoder();
    while (port.readable && keepReading) {
        reader = port.readable.getReader();
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const decodedText = decoder.decode(value);
                logSerialData(decodedText);

                // Exemplo de interação: se receber algo, gira o modelo
                if (modeloAtual && decodedText.includes('ROTATE')) {
                    modeloAtual.rotation.y += 0.1;
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            reader.releaseLock();
        }
    }
}

btnDisconnect.addEventListener('click', async () => {
    keepReading = false;
    if (reader) await reader.cancel();
    if (port) await port.close();
    updateUI(false);
});

btnSend.addEventListener('click', async () => {
    if (!port?.writable) return;
    const writer = port.writable.getWriter();
    await writer.write(new TextEncoder().encode(serialInput.value + '\n'));
    logSerialData(`\n[Enviado]: ${serialInput.value}\n`);
    writer.releaseLock();
    serialInput.value = '';
});

serialInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnSend.click(); });

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
import * as THREE from 'https://cdn.skypack.dev/three@0.150.1';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// --- CONFIGURAÇÃO DA CENA THREE.JS (Original) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d1d1d1');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - 220), 0.1, 1000);
camera.position.set(3, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight - 220);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
scene.add(new THREE.GridHelper(10, 10), new THREE.AmbientLight(0xffffff, 1));

// OBJETO DE TESTE (Exemplo: Cubo que reagirá ao hardware)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x1e90ff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// --- ELEMENTOS DA INTERFACE ---
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');
const cmdInput = document.getElementById('serial-input');
const btnSend = document.getElementById('btn-send');

// --- LÓGICA DE COMUNICAÇÃO WEBSOCKET (PONTE AUTOMÁTICA) ---
let socket = null;
let reconnectInterval = 2000; // 2 segundos

function connectToIDE() {
    console.log("Tentando conectar ao servidor da Wandi IDE...");
    
    // Conecta ao servidor WebSocket local aberto pelo Python
    socket = new WebSocket("ws://localhost:8765");

    socket.onopen = () => {
        console.log("✅ Conexão estabelecida com a ponte local.");
        addLog("Sistema: Conectado à Wandi IDE.");
        // O status "Online/Offline" do Hardware será definido pelo comando STATUS: vindo do Python
    };

    socket.onmessage = (event) => {
        const data = event.data;

        // 1. TRATAMENTO DE STATUS DO HARDWARE
        if (data.startsWith("STATUS:")) {
            const state = data.split(":")[1];
            if (state === "ON") {
                statusDot.classList.add('connected');
                statusText.innerText = "ONLINE";
                addLog("Hardware: Porta Serial Ativa.");
            } else {
                statusDot.classList.remove('connected');
                statusText.innerText = "OFFLINE";
                addLog("Hardware: Porta Serial Desconectada.");
            }
            return;
        }

        // 2. TRATAMENTO DE DADOS DO ARDUINO (RX)
        addLog(`RX: ${data}`);

        // EXEMPLO DE LÓGICA REALISTA: 
        // Se receber um número, rotaciona o cubo
        const val = parseFloat(data);
        if (!isNaN(val)) {
            cube.rotation.y = val * (Math.PI / 180);
        }
    };

    socket.onclose = () => {
        console.warn("❌ Conexão com a IDE perdida. Tentando reconectar...");
        statusDot.classList.remove('connected');
        statusText.innerText = "OFFLINE";
        
        // Tenta reconectar automaticamente
        setTimeout(connectToIDE, reconnectInterval);
    };

    socket.onerror = (error) => {
        // Apenas fecha o socket, o onclose cuidará da reconexão
        socket.close();
    };
}

// --- FUNÇÕES AUXILIARES ---

function addLog(msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (logElement) {
        logElement.innerText += `\n[${time}] ${msg}`;
        logElement.scrollTop = logElement.scrollHeight;
    }
}

// Enviar comandos para o Arduino (TX)
btnSend.onclick = () => {
    const msg = cmdInput.value;
    if (socket && socket.readyState === WebSocket.OPEN && msg) {
        socket.send(msg);
        addLog(`TX: ${msg}`);
        cmdInput.value = "";
    }
};

// Permitir enviar com a tecla Enter
cmdInput.onkeypress = (e) => { if (e.key === 'Enter') btnSend.click(); };

// --- LOOP DE RENDERIZAÇÃO ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Ajuste de Janela
window.onresize = () => {
    const height = window.innerHeight - 220;
    camera.aspect = window.innerWidth / height;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, height);
};

// INICIALIZAÇÃO
connectToIDE();
animate();
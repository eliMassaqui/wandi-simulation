import * as THREE from 'https://cdn.skypack.dev/three@0.150.1';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// --- CONFIGURAÇÃO DA CENA ORIGINAL ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d1d1d1');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - 220), 0.1, 1000);
camera.position.set(3, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight - 220); // Altura total menos o painel
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
const grid = new THREE.GridHelper(10, 10);
scene.add(grid);
scene.add(new THREE.AmbientLight(0xffffff, 1));

// OBJETO DE TESTE (Um cilindro simulando um motor/eixo)
const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
const material = new THREE.MeshStandardMaterial({ color: 0x1e90ff });
const component = new THREE.Mesh(geometry, material);
scene.add(component);

// --- PONTE DE COMUNICAÇÃO (WANDI BRIDGE) ---
let wandiAPI = null;
const logElement = document.getElementById('serial-log');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const inputField = document.getElementById('serial-input');
const sendBtn = document.getElementById('btn-send');

function inicializarPonte() {
    if (typeof qt !== 'undefined') {
        new QWebChannel(qt.webChannelTransport, (channel) => {
            wandiAPI = channel.objects.wandi_api;
            
            // Atualiza UI ao conectar com a IDE
            statusDot.classList.add('connected');
            statusText.innerText = "IDE CONECTADA";
            addLog("✅ Ponte estabelecida com a Wandi IDE.");

            // ESCUTAR: Dados vindos do Arduino via Python
            wandiAPI.data_to_web.connect((data) => {
                addLog(`Arduino: ${data}`);
                processarLogicaHardware(data);
            });
        });
    } else {
        addLog("⚠️ Erro: QWebChannel não detectado. Use dentro da Wandi IDE.");
    }
}

// ENVIAR: Envia comando para o Python -> Serial
sendBtn.onclick = () => {
    const msg = inputField.value;
    if (msg && wandiAPI) {
        wandiAPI.send_to_hardware(msg);
        addLog(`TX: ${msg}`);
        inputField.value = "";
    }
};

inputField.onkeypress = (e) => { if (e.key === 'Enter') sendBtn.click(); };

// LOGICA DE SIMULAÇÃO (Reagir ao Hardware)
function processarLogicaHardware(data) {
    // Exemplo lúcido: se receber um número, rotaciona o componente
    const valor = parseFloat(data);
    if (!isNaN(valor)) {
        component.rotation.x = valor * (Math.PI / 180); // Converte graus para rad
    }
}

function addLog(msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logElement.innerText += `\n[${time}] ${msg}`;
    logElement.scrollTop = logElement.scrollHeight;
}

// --- LOOP E RESIZE ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.onresize = () => {
    const h = window.innerHeight - 220;
    camera.aspect = window.innerWidth / h;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, h);
};

inicializarPonte();
animate();
import * as THREE from 'https://cdn.skypack.dev/three@0.150.1';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// --- CENA THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d1d1d1');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - 220), 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight - 220);
document.body.appendChild(renderer.domElement);
// ... resto da sua cena original (grid, luzes, objetos) ...

// --- ELEMENTOS DA UI (ID's da sua imagem) ---
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const serialLog = document.getElementById('serial-log');
const cmdInput = document.getElementById('serial-input');
const btnSend = document.getElementById('btn-send');

let wandiAPI = null;
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const serialLog = document.getElementById('serial-log');

// Inicializa a Ponte com a IDE
if (typeof qt !== 'undefined') {
    new QWebChannel(qt.webChannelTransport, (channel) => {
        wandiAPI = channel.objects.wandi_api;

        // Escuta mudança de status (A mágica da pulsação acontece aqui)
        wandiAPI.status_changed.connect((isConnected) => {
            if (isConnected) {
                statusDot.classList.add('connected');
                statusText.innerText = "ONLINE";
                statusText.style.color = "#2ed573";
            } else {
                statusDot.classList.remove('connected');
                statusText.innerText = "OFFLINE";
                statusText.style.color = "#ff4757";
            }
        });

        // Receber dados e imprimir no log
        wandiAPI.data_to_web.connect((data) => {
            const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
            serialLog.innerText += `\n[${time}] RX: ${data}`;
            serialLog.scrollTop = serialLog.scrollHeight;
        });

        // Sincronização inicial
        wandiAPI.check_initial_status();
    });
}

// Enviar dados para o Arduino
btnSend.onclick = () => {
    if (wandiAPI && cmdInput.value) {
        wandiAPI.send_to_hardware(cmdInput.value);
        cmdInput.value = "";
    }
};

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
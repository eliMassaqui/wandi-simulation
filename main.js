import * as THREE from 'https://cdn.skypack.dev/three@0.150.1';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// --- CENA THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d1d1d1');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - 220), 0.1, 1000);
camera.position.set(3, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight - 220);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
scene.add(new THREE.GridHelper(10, 10), new THREE.AmbientLight(0xffffff, 1));

// Exemplo de cubo que reage ao Arduino
const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: 0x1e90ff }));
scene.add(cube);

// --- LÓGICA DE COMUNICAÇÃO WEBSOCKET ---
let socket = null;
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');

function connect() {
    socket = new WebSocket("ws://localhost:8765");

    socket.onopen = () => {
        statusDot.classList.add('connected');
        statusText.innerText = "ONLINE";
        addLog("✅ Conectado à Wandi IDE.");
    };

    socket.onmessage = (event) => {
        const data = event.data;
        
        // Se o Python enviar comando de status
        if (data === "CONNECTED_STATUS:true") {
            statusDot.classList.add('connected');
            statusText.innerText = "ONLINE";
        } else if (data === "CONNECTED_STATUS:false") {
            statusDot.classList.remove('connected');
            statusText.innerText = "OFFLINE";
        } else {
            addLog(`RX: ${data}`);
            // Lógica de simulação: Exemplo girar cubo
            cube.rotation.y += 0.1;
        }
    };

    socket.onclose = () => {
        statusDot.classList.remove('connected');
        statusText.innerText = "OFFLINE";
        setTimeout(connect, 3000); // Tenta reconectar a cada 3s
    };
}

function addLog(msg) {
    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logElement.innerText += `\n[${t}] ${msg}`;
    logElement.scrollTop = logElement.scrollHeight;
}

// Botão Enviar
document.getElementById('btn-send').onclick = () => {
    const input = document.getElementById('serial-input');
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(input.value);
        addLog(`TX: ${input.value}`);
        input.value = "";
    }
};

// --- RENDER LOOP ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.onresize = () => {
    camera.aspect = window.innerWidth / (window.innerHeight - 220);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - 220);
};

connect();
animate();
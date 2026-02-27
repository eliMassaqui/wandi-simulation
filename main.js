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

let socket = null;
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');

function connect() {
    // Cria a conexão WebSocket
    socket = new WebSocket("ws://localhost:8765");

    socket.onopen = () => {
        console.log("🚀 Conectado ao Servidor Local");
        // O status real (Verde/Vermelho) virá da mensagem "STATUS:..." do Python
    };

    socket.onmessage = (event) => {
        const data = event.data;

        // Trata mensagens de Status do Sistema
        if (data.startsWith("STATUS:")) {
            const state = data.split(":")[1];
            if (state === "ON") {
                statusDot.classList.add('connected');
                statusText.innerText = "ONLINE";
            } else {
                statusDot.classList.remove('connected');
                statusText.innerText = "OFFLINE";
            }
            return;
        }

        // Se for dado do Arduino, mostra no log e move o 3D
        logElement.innerText += `\n> ${data}`;
        logElement.scrollTop = logElement.scrollHeight;
        
        // Exemplo: se chegar um dado, rotaciona algo no Three.js
        // if(window.myMesh) window.myMesh.rotation.y += 0.1;
    };

    socket.onclose = () => {
        statusDot.classList.remove('connected');
        statusText.innerText = "RECONECTANDO...";
        // Tenta reconectar em 2 segundos se cair ou se o servidor ainda não subiu
        setTimeout(connect, 2000);
    };

    socket.onerror = () => {
        socket.close(); // Força o trigger do onclose para reconectar
    };
}

// Inicializa a tentativa de conexão
connect();

// Envio de comando pelo botão
document.getElementById('btn-send').onclick = () => {
    const input = document.getElementById('serial-input');
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(input.value);
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
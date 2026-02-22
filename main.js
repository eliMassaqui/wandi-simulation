// --- 0 a 7: MANTENHA SEU CÓDIGO THREE.JS EXISTENTE AQUI ---
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

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

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

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

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) carregarModelo(URL.createObjectURL(file));
});

const gui = new GUI({ title: 'Studio' });
const settings = {
    corFundo: '#d1d1d1',
    exposicao: 1.0,
    reflexos: 0.3,
    trocarModelo: () => fileInput.click()
};

const pastaRender = gui.addFolder('Render & Ambiente');
pastaRender.addColor(settings, 'corFundo').onChange(v => scene.background.set(v));
pastaRender.add(settings, 'exposicao', 0, 2).onChange(v => renderer.toneMappingExposure = v);

const pastaModelo = gui.addFolder('Ajuste Modelo');
pastaModelo.add(settings, 'trocarModelo').name('📁 Trocar Modelo');

// Carregue o modelo inicial
// carregarModelo('/models/meninapintando.glb'); 

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


// ==========================================
// --- 8. LÓGICA DA WEB SERIAL API ---
// ==========================================

let port;
let reader;
let writer;
let keepReading = false;

// Elementos da UI
const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const btnSend = document.getElementById('btn-send');
const serialInput = document.getElementById('serial-input');
const serialLog = document.getElementById('serial-log');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Atualiza a UI baseada no estado da conexão
function updateUI(connected) {
    btnConnect.disabled = connected;
    btnDisconnect.disabled = !connected;
    btnSend.disabled = !connected;
    serialInput.disabled = !connected;
    
    if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Conectado';
        serialLog.textContent = 'Conexão estabelecida.\n';
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Desconectado';
        serialLog.textContent += '\nDesconectado.';
    }
}

// Função para adicionar texto ao log
function logSerialData(text) {
    serialLog.textContent += text;
    serialLog.scrollTop = serialLog.scrollHeight; // Auto-scroll
}

// Conectar à porta serial
btnConnect.addEventListener('click', async () => {
    if (!('serial' in navigator)) {
        alert("Web Serial API não suportada neste navegador. Use o Chrome ou Edge.");
        return;
    }

    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 }); // Ajuste o baudRate conforme seu hardware
        
        updateUI(true);
        keepReading = true;
        
        // Inicia o loop de leitura
        readUntilClosed();
    } catch (error) {
        console.error('Erro ao conectar:', error);
        logSerialData(`\nErro: ${error.message}`);
    }
});

// Loop assíncrono para ler os dados continuamente
async function readUntilClosed() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();

    try {
        while (keepReading) {
            const { value, done } = await reader.read();
            if (done) break;
            
            // Aqui os dados chegam como String.
            logSerialData(value);

            // ==========================================
            // LÓGICA DE INTERAÇÃO COM O 3D:
            // Se o seu microcontrolador enviar "ROTATE_X:0.5\n",
            // você pode processar isso aqui. Exemplo:
            // if (modeloAtual && value.includes('ROTATE')) {
            //    modeloAtual.rotation.y += 0.1;
            // }
            // ==========================================
        }
    } catch (error) {
        console.error('Erro de leitura:', error);
    } finally {
        reader.releaseLock();
    }
}

// Desconectar da porta serial
btnDisconnect.addEventListener('click', async () => {
    keepReading = false;
    
    // Força o cancelamento da leitura para liberar o "lock" da porta
    if (reader) {
        await reader.cancel();
    }
    
    if (port) {
        await port.close();
    }
    updateUI(false);
});

// Enviar dados pela porta serial
btnSend.addEventListener('click', async () => {
    if (!port || !port.writable) return;
    
    const data = serialInput.value;
    if (!data) return;

    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    writer = textEncoder.writable.getWriter();

    await writer.write(data + '\n');
    logSerialData(`\n[Enviado]: ${data}\n`);
    
    writer.releaseLock();
    serialInput.value = ''; // Limpa o input
});

// Permite enviar com a tecla Enter
serialInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnSend.click();
});
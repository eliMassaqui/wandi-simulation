import { WandiSimulador } from './simulador.js';

const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');
const cmdInput = document.getElementById('serial-input');
const btnSend = document.getElementById('btn-send');

const simulador = new WandiSimulador();
window.addEventListener('resize', () => simulador.onResize());

let socket = null;
const BRIDGE_URL = "ws://127.0.0.1:8765";
const RECONNECT_INTERVAL = 2000;

function startBridgeConnection() {
    socket = new WebSocket(BRIDGE_URL);

    socket.onopen = () => {
        addLog("SISTEMA: Ponte estabelecida.");
    };

socket.onmessage = (event) => {
    // 1. Sanitização imediata: ignora mensagens vazias ou lixo de buffer
    const data = event.data.trim();
    if (!data) return;

    // 2. Filtro de Status
    if (data.startsWith("STATUS:")) {
        updateStatusUI(data.split(":")[1] === "ON");
        return;
    }

    // 3. Extração ultra-rápida de números (Prevenção contra qualquer string suja)
    // Este Regex pega o primeiro número que aparecer, não importa o texto ao redor
    const match = data.match(/-?\d+(\.\d+)?/);
    if (match) {
        const valor = parseFloat(match[0]);
        if (!isNaN(valor)) {
            simulador.atualizarRotacao(valor);
        }
    }

    // 4. Log Inteligente: Só logamos se não for uma avalanche de ângulos
    // Se o dado for muito rápido, o log é o que trava o navegador.
    // Aqui decidimos logar apenas mensagens que NÃO sejam apenas números.
    if (isNaN(data)) {
        addLog(data);
    }
};

    socket.onclose = () => {
        updateStatusUI(false);
        setTimeout(startBridgeConnection, RECONNECT_INTERVAL);
    };

    socket.onerror = () => socket.close();
}

function updateStatusUI(isOnline) {
    statusDot.classList.toggle('connected', isOnline);
    statusText.innerText = isOnline ? "ONLINE" : "OFFLINE";
    statusText.style.color = isOnline ? "#2ed573" : "#ff4757";
}

// Limite máximo de linhas para evitar consumo de RAM
const MAX_LOG_LINES = 20; 

function addLog(msg) {
    if (!logElement) return;

    const line = document.createElement('div');
    // Visual limpo: apenas o texto, sem bordas ou linhas
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    
    logElement.appendChild(line);

    // Remove o excesso de forma eficiente
    while (logElement.childNodes.length > MAX_LOG_LINES) {
        logElement.removeChild(logElement.firstChild);
    }

    // Scroll suave apenas se necessário
    logElement.scrollTop = logElement.scrollHeight;
}

function sendCommand() {
    const val = cmdInput.value.trim();
    if (socket?.readyState === WebSocket.OPEN && val !== "") {
        socket.send(val);
        addLog(`TX: ${val}`);
        cmdInput.value = "";
    }
}

btnSend.onclick = sendCommand;
cmdInput.onkeydown = (e) => { if (e.key === "Enter") sendCommand(); };

startBridgeConnection();
import { WandiSimulador } from './simulador.js';

// Elementos da UI
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');
const cmdInput = document.getElementById('serial-input');
const btnSend = document.getElementById('btn-send');

// Inicializa Simulador
const simulador = new WandiSimulador();
window.addEventListener('resize', () => simulador.onResize());

let socket = null;
const BRIDGE_URL = "ws://127.0.0.1:8765";
const RECONNECT_INTERVAL = 2000;

function startBridgeConnection() {
    socket = new WebSocket(BRIDGE_URL);

    socket.onopen = () => {
        addLog("SISTEMA: Ponte estabelecida.");
        updateStatusUI(true);
    };

    socket.onmessage = (event) => {
        const rawData = event.data.trim();
        if (!rawData) return;

        // 1. TRATAMENTO DE STATUS
        if (rawData.startsWith("STATUS:")) {
            updateStatusUI(rawData.split(":")[1] === "ON");
            return;
        }

        // 2. FILTRAGEM DE DADOS PARA O CUBO
        const match = rawData.match(/[-+]?\d*\.?\d+/);
        if (match) {
            const angulo = parseFloat(match[0]);
            if (!isNaN(angulo)) {
                simulador.atualizarRotacao(angulo);
            }
        }

        // 3. LOG SELETIVO
        if (!rawData.includes("Angulo:")) { 
            addLog(rawData); 
        }
    };

    socket.onclose = () => {
        updateStatusUI(false);
        setTimeout(startBridgeConnection, RECONNECT_INTERVAL);
    };

    socket.onerror = () => socket.close();
}

function updateStatusUI(isOnline) {
    statusDot?.classList.toggle('connected', isOnline);
    if (statusText) {
        statusText.innerText = isOnline ? "ONLINE" : "OFFLINE";
        statusText.style.color = isOnline ? "#2ed573" : "#ff4757";
    }
}

function addLog(msg) {
    if (!logElement) return;
    const line = document.createElement('div');
    line.style.borderBottom = "1px solid rgba(0,0,0,0.05)";
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    
    logElement.appendChild(line);
    while (logElement.childNodes.length > 30) {
        logElement.removeChild(logElement.firstChild);
    }
    logElement.scrollTop = logElement.scrollHeight;
}

// ==========================================
// ENVIO DE COMANDOS (Input e Sidebar)
// ==========================================

function sendRawCommand(cmd) {
    if (socket?.readyState === WebSocket.OPEN && cmd !== "") {
        // Enviamos com \n para garantir que a placa processe a linha
        socket.send(cmd + "\n");
        addLog(`TX: ${cmd}`);
    } else {
        addLog("ERRO: Ponte desconectada.");
    }
}

// Escuta a Sidebar (Botões J1, J2, números, etc)
function setupSidebarControls() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.addEventListener('click', (event) => {
        const btn = event.target.closest('.cmd-btn');
        if (!btn) return;

        const command = btn.getAttribute('data-cmd');
        if (command) {
            sendRawCommand(command);
            
            // Feedback visual no botão
            btn.style.filter = "brightness(1.5)";
            setTimeout(() => { btn.style.filter = "none"; }, 150);
        }
    });
}

// Eventos de Input Manual
btnSend.onclick = () => {
    sendRawCommand(cmdInput.value.trim());
    cmdInput.value = "";
};

cmdInput.onkeydown = (e) => { 
    if (e.key === "Enter") {
        sendRawCommand(cmdInput.value.trim());
        cmdInput.value = "";
    }
};

// Inicialização Geral
setupSidebarControls();
startBridgeConnection();
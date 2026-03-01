import { WandiSimulador } from './simulador.js';

// 1. Referências de Elementos
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');
const cmdInput = document.getElementById('serial-input');
const btnSend = document.getElementById('btn-send');

// 2. Inicialização do Simulador
const simulador = new WandiSimulador();
window.addEventListener('resize', () => simulador.onResize());

let socket = null;
const BRIDGE_URL = "ws://127.0.0.1:8765";

// 3. Função de Envio (Centralizada)
function sendRawCommand(cmd) {
    if (!cmd) return;
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        // Enviamos o comando com terminador \n para a placa reconhecer
        socket.send(cmd + "\n");
        addLog(`TX: ${cmd}`);
        console.log("Comando enviado via WS:", cmd);
    } else {
        addLog("ERRO: Ponte desconectada. Comando não enviado.");
        console.warn("Tentativa de envio sem socket aberto.");
    }
}

// 4. Conexão com a Ponte
function startBridgeConnection() {
    console.log("Tentando conectar à ponte...");
    socket = new WebSocket(BRIDGE_URL);

    socket.onopen = () => {
        addLog("SISTEMA: Conectado à Ponte.");
        updateStatusUI(true);
    };

    socket.onmessage = (event) => {
        const rawData = event.data.trim();
        if (!rawData) return;

        // Tratar dados recebidos (Status ou Ângulo)
        if (rawData.startsWith("STATUS:")) {
            updateStatusUI(rawData.split(":")[1] === "ON");
        } else {
            const match = rawData.match(/[-+]?\d*\.?\d+/);
            if (match) {
                const angulo = parseFloat(match[0]);
                simulador.atualizarRotacao(angulo);
            }
            // Só loga no painel se não for excessivamente rápido
            if (!rawData.includes("Angulo:")) addLog(rawData);
        }
    };

    socket.onclose = () => {
        updateStatusUI(false);
        setTimeout(startBridgeConnection, 2000);
    };

    socket.onerror = (err) => {
        console.error("Erro no WebSocket:", err);
        socket.close();
    };
}

// 5. Configuração de Eventos (O segredo do funcionamento)
function initEvents() {
    // Evento do Botão de Envio de Texto
    if (btnSend) {
        btnSend.onclick = () => {
            sendRawCommand(cmdInput.value.trim());
            cmdInput.value = "";
        };
    }

    // Evento de Tecla Enter no Input
    if (cmdInput) {
        cmdInput.onkeydown = (e) => {
            if (e.key === "Enter") {
                sendRawCommand(cmdInput.value.trim());
                cmdInput.value = "";
            }
        };
    }

// 6. Funções Auxiliares
function updateStatusUI(isOnline) {
    if (statusDot) statusDot.classList.toggle('connected', isOnline);
    if (statusText) {
        statusText.innerText = isOnline ? "ONLINE" : "OFFLINE";
        statusText.style.color = isOnline ? "#2ed573" : "#ff4757";
    }
}

function addLog(msg) {
    if (!logElement) return;
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}] ${msg}`;
    logElement.appendChild(line);
    
    while (logElement.childNodes.length > 20) {
        logElement.removeChild(logElement.firstChild);
    }
    logElement.scrollTop = logElement.scrollHeight;
}

// Inicializar tudo
initEvents();
startBridgeConnection();
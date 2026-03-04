import { WandiSimulador } from './simulador.js';

const simulador = new WandiSimulador();
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');
const cmdInput = document.getElementById('serial-input');
const btnSend = document.getElementById('btn-send');

let socket = null;
const BRIDGE_URL = "ws://127.0.0.1:8765";

function addLog(msg) {
    const line = document.createElement('div');
    line.textContent = `> ${msg}`; // Mais rápido que innerHTML
    logElement.appendChild(line);
    if (logElement.childNodes.length > 15) logElement.removeChild(logElement.firstChild);
    logElement.scrollTop = logElement.scrollHeight;
}

function updateStatusUI(isOnline) {
    statusDot.className = isOnline ? 'dot connected' : 'dot';
    statusText.innerText = isOnline ? "ONLINE" : "OFFLINE";
    statusText.style.color = isOnline ? "var(--green-led)" : "#ff4757";
    simulador.setGridStatus(isOnline);
}

function startBridgeConnection() {
    socket = new WebSocket(BRIDGE_URL);

    socket.onopen = () => {
        addLog("Conectado à ponte WebSocket.");
        updateStatusUI(true);
    };

    socket.onmessage = (event) => {
        const rawData = event.data.trim();
        if (!rawData) return;

        // Lógica de comando de status
        if (rawData.startsWith("STATUS:")) {
            updateStatusUI(rawData.includes("ON"));
            return;
        }

        // Parsing numérico otimizado (aceita "90", "Angulo:90", etc)
        const numMatch = rawData.match(/-?\d+(\.\d+)?/);
        if (numMatch) {
            const angulo = parseFloat(numMatch[0]);
            simulador.atualizarRotacao(angulo);
        }

        // Log apenas de mensagens não-numéricas para não poluir
        if (isNaN(rawData[0]) && !rawData.includes("Angulo")) {
            addLog(`RX: ${rawData}`);
        }
    };

    socket.onclose = () => {
        updateStatusUI(false);
        setTimeout(startBridgeConnection, 2000);
    };
}

const sendCmd = () => {
    const val = cmdInput.value.trim();
    if (val && socket?.readyState === WebSocket.OPEN) {
        socket.send(val + "\n");
        addLog(`TX: ${val}`);
        cmdInput.value = "";
    }
};

btnSend.onclick = sendCmd;
cmdInput.onkeydown = (e) => e.key === "Enter" && sendCmd();
window.onresize = () => simulador.onResize();

startBridgeConnection();
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
        const data = event.data.trim();

        // 1. Tratamento de Status
        if (data.startsWith("STATUS:")) {
            updateStatusUI(data.split(":")[1] === "ON");
            return;
        }

        // 2. Tratamento de Dados (Acompanhamento TOTAL)
        if (data.length > 0) {
            addLog(data); 

            // Extrai o número (ex: "Angulo: 90" vira 90)
            const match = data.match(/[-+]?[0-9]*\.?[0-9]+/);
            if (match) {
                const angulo = parseFloat(match[0]);
                if (!isNaN(angulo)) {
                    // Atualização imediata sem lerp/suavização
                    simulador.atualizarRotacao(angulo);
                }
            }
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

function addLog(msg) {
    if (!logElement) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logElement.innerText += `\n[${time}] ${msg}`;
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
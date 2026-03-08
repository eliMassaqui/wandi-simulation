import { WandiSimulador } from './simulador.js';

const simulador = new WandiSimulador();
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');

let socket = null;
const BRIDGE_URL = "ws://127.0.0.1:8765";

function addLog(msg) {
    const line = document.createElement('div');
    line.innerHTML = `<span style="color: var(--accent)">></span> [${new Date().toLocaleTimeString()}] ${msg}`;
    logElement.appendChild(line);
    if (logElement.childNodes.length > 20) logElement.removeChild(logElement.firstChild);
    logElement.scrollTop = logElement.scrollHeight;
}

function updateStatusUI(isOnline) {
    statusDot.classList.toggle('connected', isOnline);
    statusText.innerText = isOnline ? "ONLINE" : "OFFLINE";
    statusText.style.color = isOnline ? "var(--green-led)" : "#ff4757";
}

function startBridgeConnection() {
    socket = new WebSocket(BRIDGE_URL);

    socket.onopen = () => {
        addLog("SISTEMA: Conectado à Ponte.");
        updateStatusUI(true);
    };

// Dentro de socket.onmessage

socket.onmessage = (event) => {
    const rawData = event.data.trim();
    if (!rawData) return;

    if (rawData.startsWith("STATUS:")) {
        updateStatusUI(rawData.split(":")[1] === "ON");
    } else {
        // Regex aprimorada para capturar números decimais corretamente
        const match = rawData.match(/[-+]?\d*\.?\d+/);
        
        if (match) {
            const novoAngulo = parseFloat(match[0]);
            
            // FILTRO DE RUÍDO (Opcional): 
            // Só atualiza se a mudança for significativa ou se não for um "salto" impossível
            // Ex: Evita que o motor pule de 0 para 180 em 1ms por erro de leitura serial
            if (!isNaN(novoAngulo)) {
                simulador.atualizarRotacao(novoAngulo);
            }
        }
        
        // Log apenas se não for dado de telemetria contínua para não travar o browser
        if (!rawData.toLowerCase().includes("angulo")) {
            addLog(`RX: ${rawData}`);
        }
    }
};

    socket.onclose = () => {
        updateStatusUI(false);
        setTimeout(startBridgeConnection, 2000);
    };
}

window.addEventListener('resize', () => simulador.onResize());
startBridgeConnection();
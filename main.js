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
        const rawData = event.data.trim();
        if (!rawData) return;

        // 1. TRATAMENTO DE STATUS (Curto-circuito)
        if (rawData.startsWith("STATUS:")) {
            updateStatusUI(rawData.split(":")[1] === "ON");
            return;
        }

        // 2. FILTRAGEM DE DADOS (Regex Robusto)
        // Captura apenas o primeiro número (inteiro ou decimal) que encontrar
        const match = rawData.match(/[-+]?\d*\.?\d+/);
        
        if (match) {
            const angulo = parseFloat(match[0]);
            
            // Proteção contra NaN ou valores fora de escala física (0-180)
            if (!isNaN(angulo) && angulo >= -360 && angulo <= 360) {
                simulador.atualizarRotacao(angulo);
            }
        }

        // 3. LOG SELETIVO (Não logar tudo se for rápido demais)
        // Dica: Só logue se não for um dado repetitivo de ângulo ou use um contador
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
    statusDot.classList.toggle('connected', isOnline);
    statusText.innerText = isOnline ? "ONLINE" : "OFFLINE";
    statusText.style.color = isOnline ? "#2ed573" : "#ff4757";
}

function addLog(msg) {
    if (!logElement) return;

    // Criamos um fragmento ou elemento individual para não re-renderizar todo o texto
    const line = document.createElement('div');
    line.style.borderBottom = "1px solid #444";
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    
    logElement.appendChild(line);

    // MANTÉM APENAS AS ÚLTIMAS 30 LINHAS
    // Isso impede que o HTML consuma toda a RAM do PC
    while (logElement.childNodes.length > 30) {
        logElement.removeChild(logElement.firstChild);
    }

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
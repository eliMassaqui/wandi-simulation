import { WandiSimulador } from './simulador.js';

// --- ELEMENTOS DA INTERFACE ---
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');
const cmdInput = document.getElementById('serial-input');
const btnSend = document.getElementById('btn-send');

// --- INICIALIZAÇÃO DO MOTOR 3D ---
const simulador = new WandiSimulador();
window.addEventListener('resize', () => simulador.onResize());

// --- CONFIGURAÇÃO DA CONEXÃO ---
let socket = null;
const BRIDGE_URL = "ws://127.0.0.1:8765"; //
const RECONNECT_INTERVAL = 2000; //

/**
 * Inicia o ciclo de conexão automática e infinita
 */
function startBridgeConnection() {
    console.log(`Buscando Wandi IDE em ${BRIDGE_URL}...`);
    
    socket = new WebSocket(BRIDGE_URL);

    // Quando a ponte WebSocket é estabelecida
    socket.onopen = () => {
        console.log("✅ Conectado ao servidor de ponte local.");
        addLog("SISTEMA: Ponte estabelecida. Sincronizando hardware...");
    };

    socket.onmessage = (event) => {
        const message = event.data.trim();

        // 1. Tratamento de Status do Hardware
        if (message.startsWith("STATUS:")) {
            const state = message.split(":")[1];
            const isOnline = state === "ON";
            
            updateStatusUI(isOnline);
            
            // Limpeza automática do log ao conectar
            if (isOnline && logElement) {
                logElement.innerText = "--- Monitor Serial Iniciado ---";
            }
            return;
        }

        // 2. Tratamento de Dados Reais (RX) e Rotação do Cubo
        if (message.length > 0) {
            addLog(message); 

            // Extração do ângulo: Suporta formatos como "Angulo: 150.00" ou apenas "150.00"
            // Utilizamos Regex para capturar o valor numérico com segurança
            const match = message.match(/[-+]?[0-9]*\.?[0-9]+/);
            if (match) {
                const angulo = parseFloat(match[0]);
                if (!isNaN(angulo)) {
                    simulador.atualizarRotacao(angulo);
                }
            }
        }
    };

    // Gerenciamento de falhas e reconexão automática
    socket.onclose = () => {
        updateStatusUI(false); 
        console.warn("⚠️ Conexão perdida. Tentando reconectar automaticamente...");
        
        socket = null;
        setTimeout(startBridgeConnection, RECONNECT_INTERVAL);
    };

    socket.onerror = (err) => {
        socket.close(); 
    };
}

/**
 * Atualiza o LED pulsante e o texto de status
 */
function updateStatusUI(isOnline) {
    if (isOnline) {
        statusDot.classList.add('connected');
        statusText.innerText = "ONLINE";
        statusText.style.color = "#2ed573";
    } else {
        statusDot.classList.remove('connected');
        statusText.innerText = "OFFLINE";
        statusText.style.color = "#ff4757";
    }
}

/**
 * Adiciona mensagens ao monitor de dados (Live)
 */
function addLog(msg) {
    if (!logElement) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    logElement.innerText += `\n[${time}] ${msg}`;
    logElement.scrollTop = logElement.scrollHeight;
}

/**
 * Envio de comandos da Web para o Hardware (TX)
 */
function sendCommand() {
    const val = cmdInput.value.trim();
    if (socket && socket.readyState === WebSocket.OPEN && val !== "") {
        socket.send(val);
        addLog(`TX: ${val}`);
        cmdInput.value = "";
    }
}

// Event Listeners
btnSend.onclick = sendCommand;
cmdInput.onkeydown = (e) => { if (e.key === "Enter") sendCommand(); };

// --- INICIALIZAÇÃO ---
startBridgeConnection();
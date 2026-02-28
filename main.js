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
const MAX_LOG_LINES = 15; // Mantém o painel leve

function startBridgeConnection() {
    socket = new WebSocket(BRIDGE_URL);

    socket.onopen = () => {
        logElement.innerText = ""; // Limpa o "Aguardando conexão..."
        addLog("SISTEMA: Ponte estabelecida.");
        updateStatusUI(true);
    };

    socket.onmessage = (event) => {
        const data = event.data.trim();
        if (!data) return;

        // 1. Tratamento de Status
        if (data.startsWith("STATUS:")) {
            updateStatusUI(data.split(":")[1] === "ON");
            return;
        }

        // 2. Extração de Números (Filtragem Blindada)
        // Pega qualquer número na string para mover o cubo
        const match = data.match(/-?\d+(\.\d+)?/);
        if (match) {
            const angulo = parseFloat(match[0]);
            if (!isNaN(angulo)) {
                simulador.atualizarRotacao(angulo);
            }
        }

        // 3. Log Inteligente (O segredo da leveza)
        // Se a mensagem for só um número ou "Angulo: X", não logamos para poupar CPU.
        // Logamos apenas mensagens de texto ou erros importantes.
        if (isNaN(data) && !data.includes("Angulo:")) {
            addLog(data);
        }
    };

    socket.onclose = () => {
        updateStatusUI(false);
        setTimeout(startBridgeConnection, 2000);
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

    // Usamos div simples sem estilos extras para renderização ultra rápida.
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}] ${msg}`;
    
    logElement.appendChild(line);

    // Remove linhas antigas para não pesar a memória do navegador
    while (logElement.childNodes.length > MAX_LOG_LINES) {
        logElement.removeChild(logElement.firstChild);
    }

    // Auto-scroll
    logElement.scrollTop = logElement.scrollHeight;
}

// Envio de comandos
function sendCommand() {
    const val = cmdInput.value.trim();
    if (socket?.readyState === WebSocket.OPEN && val !== "") {
        socket.send(val);
        addLog(`TX: ${val}`);
        cmdInput.value = "";
    }
}

// ==========================================
// LÓGICA DA SIDEBAR DE CONTROLO
// ==========================================
function setupSidebarControls() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Usa 'Event Delegation' (mais leve e rápido que adicionar listener em cada botão)
    sidebar.addEventListener('click', (event) => {
        const btn = event.target.closest('.cmd-btn');
        if (!btn) return; // Ignora cliques fora dos botões

        const command = btn.getAttribute('data-cmd');
        
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(command);
            addLog(`UI_TX: ${command}`); // Log indicando que veio da Interface
            
            // Efeito visual sutil de sucesso no botão
            const originalBg = btn.style.background;
            btn.style.filter = "brightness(1.5)";
            setTimeout(() => { btn.style.filter = "none"; }, 150);
        } else {
            addLog("ERRO: Placa offline. Comando ignorado.");
        }
    });
}

// Inicializa a escuta da sidebar
setupSidebarControls();

btnSend.onclick = sendCommand;
cmdInput.onkeydown = (e) => { if (e.key === "Enter") sendCommand(); };

startBridgeConnection();
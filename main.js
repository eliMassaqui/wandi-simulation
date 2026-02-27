// --- ELEMENTOS DA INTERFACE ---
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');
const cmdInput = document.getElementById('serial-input');
const btnSend = document.getElementById('btn-send');

// --- CONFIGURAÇÃO DA CONEXÃO ---
let socket = null;
const BRIDGE_URL = "ws://127.0.0.1:8765"; // IP numérico evita falhas de DNS local
const RECONNECT_INTERVAL = 2000; // Tenta reconectar a cada 2 segundos

/**
 * Inicia o ciclo de conexão automática e infinita
 */
function startBridgeConnection() {
    console.log(`Buscando Wandi IDE em ${BRIDGE_URL}...`);
    
    socket = new WebSocket(BRIDGE_URL);

    // Quando a ponte WebSocket é estabelecida
    socket.onopen = () => {
<<<<<<< HEAD
        addLog("SISTEMA: Conectado à ponte local.");
=======
        console.log("✅ Conectado ao servidor de ponte local.");
        addLog("SISTEMA: Ponte estabelecida. Sincronizando hardware...");
>>>>>>> parent of 8585a7f (guireee)
    };

    // Processamento de mensagens recebidas
    socket.onmessage = (event) => {
<<<<<<< HEAD
        const data = event.data;

        // Trata a mudança de cor e texto do status
        if (data.startsWith("STATUS:")) {
            const state = data.split(":")[1];
            if (state === "ON") {
                statusDot.classList.add('connected');
                statusText.innerText = "ONLINE";
                statusText.style.color = "#2ed573";
            } else {
                statusDot.classList.remove('connected');
                statusText.innerText = "OFFLINE";
                statusText.style.color = "#ff4757";
            }
            return;
        }

        addLog(`RX: ${data}`);
=======
        const message = event.data;

        // Lógica de Status: Define se o Hardware (Arduino) está ligado ou não
        if (message.startsWith("STATUS:")) {
            const state = message.split(":")[1];
            updateStatusUI(state === "ON");
            return;
        }

        // Lógica de Dados: Monitor Serial (RX)
        addLog(`RX: ${message}`);
        
        // --- AQUI VOCÊ ADICIONA SUA LÓGICA THREE.JS ---
        // Exemplo: if(message === '1') cube.rotation.x += 0.5;
>>>>>>> parent of 8585a7f (guireee)
    };

    // Gerenciamento de falhas e reconexão automática
    socket.onclose = () => {
<<<<<<< HEAD
        statusDot.classList.remove('connected');
        statusText.innerText = "OFFLINE";
        statusText.style.color = "#ff4757";
        setTimeout(connect, 2000); // Reconexão automática
=======
        updateStatusUI(false); // Garante que fique OFFLINE na interface
        console.warn("⚠️ Conexão perdida. Tentando reconectar automaticamente...");
        
        // Limpa o socket atual e agenda nova tentativa
        socket = null;
        setTimeout(startBridgeConnection, RECONNECT_INTERVAL);
>>>>>>> parent of 8585a7f (guireee)
    };

    // Erros silenciosos para não travar o console
    socket.onerror = (err) => {
        socket.close(); 
    };
}

<<<<<<< HEAD
function addLog(msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
=======
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
    
    // Adiciona o texto e faz scroll automático para o final
>>>>>>> parent of 8585a7f (guireee)
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
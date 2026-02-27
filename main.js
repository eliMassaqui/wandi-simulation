const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const logElement = document.getElementById('serial-log');
const cmdInput = document.getElementById('serial-input');
const btnSend = document.getElementById('btn-send');

let socket = null;
const BRIDGE_URL = "ws://127.0.0.1:8765";

function connect() {
    socket = new WebSocket(BRIDGE_URL);

    socket.onopen = () => {
        addLog("SISTEMA: Conectado à ponte local.");
    };

    socket.onmessage = (event) => {
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
    };

    socket.onclose = () => {
        statusDot.classList.remove('connected');
        statusText.innerText = "OFFLINE";
        statusText.style.color = "#ff4757";
        setTimeout(connect, 2000); // Reconexão automática
    };

    socket.onerror = () => socket.close();
}

function addLog(msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logElement.innerText += `\n[${time}] ${msg}`;
    logElement.scrollTop = logElement.scrollHeight;
}

btnSend.onclick = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(cmdInput.value);
        addLog(`TX: ${cmdInput.value}`);
        cmdInput.value = "";
    }
};

connect();
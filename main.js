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
        addLog("SISTEMA: Ponte conectada.");
    };

    socket.onmessage = (event) => {
        const msg = event.data;

        if (msg.startsWith("STATUS:")) {
            const isOnline = msg.split(":")[1] === "ON";
            updateUI(isOnline);
        } else {
            addLog(`RX: ${msg}`);
        }
    };

    socket.onclose = () => {
        updateUI(false);
        setTimeout(connect, 2000);
    };

    socket.onerror = () => socket.close();
}

function updateUI(online) {
    if (online) {
        statusDot.classList.add('connected');
        statusText.innerText = "ONLINE";
        statusText.style.color = "#2ed573";
    } else {
        statusDot.classList.remove('connected');
        statusText.innerText = "OFFLINE";
        statusText.style.color = "#ff4757";
    }
}

function addLog(msg) {
    logElement.innerText += `\n${msg}`;
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
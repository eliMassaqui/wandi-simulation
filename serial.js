// serial.js
export class SerialManager {
    constructor() {
        this.port = null;
        this.reader = null;
        this.keepReading = false;
        this.logBuffer = "";
        this.onData = null; // Callback para o Three.js

        // Seleção de elementos
        this.btnConnect = document.getElementById('btn-connect');
        this.btnDisconnect = document.getElementById('btn-disconnect');
        this.btnSend = document.getElementById('btn-send');
        this.serialInput = document.getElementById('serial-input');
        this.serialLog = document.getElementById('serial-log');
        this.statusDot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');

        this.initEvents();
    }

    initEvents() {
        this.btnConnect.onclick = () => this.connect();
        this.btnDisconnect.onclick = () => this.disconnect();
        this.btnSend.onclick = () => this.send();
        this.serialInput.onkeypress = (e) => { if (e.key === 'Enter') this.send(); };
    }

    async connect() {
        if (!('serial' in navigator)) return alert("Web Serial não suportada.");
        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });
            this.keepReading = true;
            this.updateUI(true);
            this.readLoop();
        } catch (e) {
            this.log("Erro: " + e.message);
        }
    }

    async readLoop() {
        const decoder = new TextDecoder();
        while (this.port?.readable && this.keepReading) {
            this.reader = this.port.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    const text = decoder.decode(value);
                    this.log(text);
                    if (this.onData) this.onData(text);
                }
            } catch (err) {
                console.error(err);
            } finally {
                this.reader.releaseLock();
            }
        }
    }

    async send() {
        if (!this.port?.writable || !this.serialInput.value) return;
        const writer = this.port.writable.getWriter();
        const data = this.serialInput.value;
        await writer.write(new TextEncoder().encode(data + '\n'));
        this.log(`\n[Enviado]: ${data}\n`);
        writer.releaseLock();
        this.serialInput.value = '';
    }

    async disconnect() {
        this.keepReading = false;
        if (this.reader) await this.reader.cancel();
        if (this.port) await this.port.close();
        this.updateUI(false);
    }

    log(text) {
        this.logBuffer += text;
        if (this.logBuffer.length > 2000) this.logBuffer = this.logBuffer.slice(-2000);
        this.serialLog.textContent = this.logBuffer;
        this.serialLog.scrollTop = this.serialLog.scrollHeight;
    }

    updateUI(connected) {
        this.btnConnect.disabled = connected;
        this.btnDisconnect.disabled = !connected;
        this.btnSend.disabled = !connected;
        this.serialInput.disabled = !connected;
        this.statusDot.className = connected ? 'dot connected' : 'dot';
        this.statusText.textContent = connected ? 'Conectado' : 'Desconectado';
    }
}
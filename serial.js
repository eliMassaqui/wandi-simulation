// serial.js
export class SerialManager {
    constructor() {
        this.port = null;
        this.keepReading = false;
        this.logBuffer = "";
        this.onData = null;

        this.ui = {
            btnConnect: document.getElementById('btn-connect'),
            btnDisconnect: document.getElementById('btn-disconnect'),
            btnSend: document.getElementById('btn-send'),
            input: document.getElementById('serial-input'),
            log: document.getElementById('serial-log'),
            dot: document.getElementById('status-dot'),
            text: document.getElementById('status-text')
        };

        this.initEvents();
    }

    initEvents() {
        this.ui.btnConnect.onclick = () => this.connect();
        this.ui.btnDisconnect.onclick = () => this.disconnect();
        this.ui.btnSend.onclick = () => this.send();
        this.ui.input.onkeypress = (e) => { if (e.key === 'Enter') this.send(); };
    }

    async connect() {
        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });
            this.keepReading = true;
            this.updateUI(true);
            this.readLoop();
        } catch (e) {
            this.log("\n[!] Falha na conexão.");
        }
    }

    async readLoop() {
        const decoder = new TextDecoder();
        while (this.port?.readable && this.keepReading) {
            const reader = this.port.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    const text = decoder.decode(value);
                    this.log(text);
                    if (this.onData) this.onData(text);
                }
            } catch (err) { break; } 
            finally { reader.releaseLock(); }
        }
    }

    async send() {
        const val = this.ui.input.value;
        if (!this.port?.writable || !val) return;
        const writer = this.port.writable.getWriter();
        await writer.write(new TextEncoder().encode(val + '\n'));
        this.log(`\n>> ${val}\n`);
        writer.releaseLock();
        this.ui.input.value = '';
    }

    async disconnect() {
        this.keepReading = false;
        this.updateUI(false);
        if (this.port) await this.port.close();
    }

    log(text) {
        this.logBuffer += text;
        if (this.logBuffer.length > 3000) this.logBuffer = this.logBuffer.slice(-3000);
        this.ui.log.textContent = this.logBuffer;
        this.ui.log.scrollTop = this.ui.log.scrollHeight;
    }

    updateUI(connected) {
        this.ui.btnConnect.disabled = connected;
        this.ui.btnDisconnect.disabled = !connected;
        this.ui.btnSend.disabled = !connected;
        this.ui.input.disabled = !connected;
        this.ui.dot.className = connected ? 'dot connected' : 'dot';
        this.ui.text.textContent = connected ? 'Conectado' : 'Desconectado';
    }
}
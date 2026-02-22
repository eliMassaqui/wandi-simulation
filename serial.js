// serial.js
export class SerialManager {
    constructor() {
        this.port = null;
        this.keepReading = false;
        this.logBuffer = "";
        this.onData = null;

        this.initUI();
        this.initEvents();
        this.initResizer();
    }

    initUI() {
        this.panel = document.getElementById('serial-panel');
        this.btnConnect = document.getElementById('btn-connect');
        this.btnDisconnect = document.getElementById('btn-disconnect');
        this.btnSend = document.getElementById('btn-send');
        this.input = document.getElementById('serial-input');
        this.logElem = document.getElementById('serial-log');
        this.dot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');
    }

    initResizer() {
        const resizer = document.getElementById('resizer');
        resizer.addEventListener('mousedown', (e) => {
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });

        const resize = (e) => {
            const newWidth = window.innerWidth - e.pageX;
            if (newWidth > 200 && newWidth < 600) {
                this.panel.style.width = `${newWidth}px`;
            }
        };

        const stopResize = () => {
            document.removeEventListener('mousemove', resize);
        };
    }

    initEvents() {
        this.btnConnect.onclick = () => this.connect();
        this.btnDisconnect.onclick = () => this.disconnect();
        this.btnSend.onclick = () => this.send();
        this.input.onkeypress = (e) => { if (e.key === 'Enter') this.send(); };
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
        if (!this.port?.writable || !this.input.value) return;
        const writer = this.port.writable.getWriter();
        await writer.write(new TextEncoder().encode(this.input.value + '\n'));
        this.log(`\n>> ${this.input.value}\n`);
        writer.releaseLock();
        this.input.value = '';
    }

    async disconnect() {
        this.keepReading = false;
        this.updateUI(false);
        if (this.port) await this.port.close();
    }

    log(text) {
        this.logBuffer += text;
        if (this.logBuffer.length > 3000) this.logBuffer = this.logBuffer.slice(-3000);
        this.logElem.textContent = this.logBuffer;
        this.logElem.scrollTop = this.logElem.scrollHeight;
    }

    updateUI(connected) {
        this.btnConnect.disabled = connected;
        this.btnDisconnect.disabled = !connected;
        this.btnSend.disabled = !connected;
        this.input.disabled = !connected;
        this.dot.className = connected ? 'dot connected' : 'dot';
        this.statusText.textContent = connected ? 'ONLINE' : 'OFFLINE';
    }
}
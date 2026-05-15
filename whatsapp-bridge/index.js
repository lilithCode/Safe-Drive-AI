const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

// 1. Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        handleSIGINT: true,
        executablePath: '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- This helps on Linux
            '--disable-gpu'
        ],
    }
});

// 2. Generate QR Code for scanning
client.on('qr', (qr) => {
    console.log('--- SCAN THIS QR CODE WITH WHATSAPP ---');
    qrcode.generate(qr, { small: true });
});

// 3. Confirm Login
client.on('ready', () => {
    console.log('WhatsApp Bridge is READY and LOGGED IN');
});

// 4. API Endpoint for FastAPI to call
app.post('/send-alert', async (req, res) => {
    const { number, message } = req.body;
    try {
        // WhatsApp numbers need @c.us at the end
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        await client.sendMessage(chatId, message);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3001, () => {
    console.log('Bridge listening on http://localhost:3001');
    client.initialize();
});
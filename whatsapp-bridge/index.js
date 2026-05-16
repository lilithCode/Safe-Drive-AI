// const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const express = require('express');
// const cors = require('cors'); // New: to allow Frontend to ask for QR

// const app = express();
// app.use(cors()); // Enable CORS
// app.use(express.json({ limit: '50mb' })); 

// // --- NEW: Variable to store the QR string ---
// let latestQR = "";
// let connectionStatus = "INITIALIZING";

// const client = new Client({
//     authStrategy: new LocalAuth(),
//     puppeteer: { 
//         handleSIGINT: true,
//         executablePath: '/usr/bin/chromium', 
//         args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
//     }
// });

// // Update the QR event
// client.on('qr', (qr) => {
//     latestQR = qr; // Store the raw string for the UI
//     connectionStatus = "WAITING_FOR_SCAN";
//     console.log('New QR generated. Waiting for scan...');
//     qrcode.generate(qr, { small: true }); // Still show in terminal for fallback
// });

// client.on('ready', () => {
//     latestQR = ""; // Clear QR once logged in
//     connectionStatus = "CONNECTED";
//     console.log('WhatsApp Bridge READY');
// });

// client.on('disconnected', () => {
//     connectionStatus = "DISCONNECTED";
// });

// // --- NEW ENDPOINT: Get QR for UI ---
// app.get('/get-qr', (req, res) => {
//     res.json({ 
//         qr: latestQR, 
//         status: connectionStatus 
//     });
// });

// client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
// client.on('ready', () => console.log('WhatsApp Bridge READY'));

// app.post('/send-alert', async (req, res) => {
//     try {
//         await client.sendMessage(`${req.body.number}@c.us`, req.body.message);
//         res.json({ success: true });
//     } catch (e) { res.status(500).json({ error: e.message }); }
// });

// app.post('/send-image', async (req, res) => {
//     try {
//         const base64Data = req.body.image.split(',')[1] || req.body.image;
//         const media = new MessageMedia('image/jpeg', base64Data);
//         await client.sendMessage(`${req.body.number}@c.us`, media, { caption: req.body.caption });
//         res.json({ success: true });
//     } catch (e) { res.status(500).json({ error: e.message }); }
// });

// app.post('/send-video', async (req, res) => {
//     const { number, video, caption } = req.body;
//     try {
//         const chatId = `${number}@c.us`;
//         // Ensure we handle the base64 string correctly
//         const base64Data = video.includes(',') ? video.split(',')[1] : video;
        
//         // We create the media object. 
//         // NOTE: We keep it as video/webm because that's what the browser recorded.
//         // WhatsApp-web.js + FFmpeg will handle the conversion to mp4 automatically.
//         const media = new MessageMedia('video/webm', base64Data, 'emergency.webm');
        
//         console.log(`Processing video for ${number}... (this may take a few seconds)`);
        
//         await client.sendMessage(chatId, media, { 
//             caption: caption,
//             sendVideoAsGif: false 
//         });
        
//         console.log(`✅ Video sent successfully to ${number}`);
//         res.json({ success: true });
//     } catch (error) {
//         console.error("❌ Bridge Video Error:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// app.listen(3001, () => {
//     console.log('Bridge listening on http://localhost:3001');
//     client.initialize();
// });


const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
// Allow large payloads for 5s videos and high-res photos
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: true }));

// --- SESSION STORAGE ---
// Format: { "923...": { client, qr: "string", status: "CONNECTED" } }
const sessions = {};

/**
 * Logic to initialize a unique WhatsApp instance for a specific driver
 */
const createSession = (id) => {
    if (sessions[id]) return;

    console.log(`[System] Initializing new session for ID: ${id}`);
    
    const client = new Client({
        // This is the magic: it creates a unique folder for every user number
        authStrategy: new LocalAuth({ clientId: id }), 
        puppeteer: { 
            handleSIGINT: true,
            executablePath: '/usr/bin/chromium', // Arch Linux path
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ]
        }
    });

    // Initialize tracking object
    sessions[id] = { client, qr: "", status: "INITIALIZING" };

    client.on('qr', (qr) => {
        sessions[id].qr = qr;
        sessions[id].status = "WAITING_FOR_SCAN";
        console.log(`[QR] New code generated for ${id}. Scan via Dashboard.`);
        // Also show in terminal as backup for the developer
        qrcode.generate(qr, { small: true }); 
    });

    client.on('ready', () => {
        sessions[id].qr = "";
        sessions[id].status = "CONNECTED";
        console.log(`[Ready] Driver ${id} is officially LOGGED IN.`);
    });

    client.on('auth_failure', (msg) => {
        console.error(`[Error] Auth failure for ${id}:`, msg);
        sessions[id].status = "AUTH_FAILURE";
    });

    client.on('disconnected', (reason) => {
        console.log(`[System] User ${id} logged out:`, reason);
        delete sessions[id];
    });

    client.initialize();
};

// --- API ENDPOINTS ---

/**
 * 1. Get QR for a specific user
 * Usage: http://localhost:3001/get-qr?id=923270707947
 */
app.get('/get-qr', (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing driver ID (phone number)" });

    if (!sessions[id]) {
        createSession(id);
    }
    
    res.json({ 
        qr: sessions[id].qr, 
        status: sessions[id].status 
    });
});

/**
 * 2. Send Text Alert (Multi-user)
 */
app.post('/send-alert', async (req, res) => {
    const { id, number, message } = req.body;
    try {
        const session = sessions[id];
        if (!session || session.status !== "CONNECTED") {
            return res.status(400).json({ error: "Driver WhatsApp not connected" });
        }
        await session.client.sendMessage(`${number}@c.us`, message);
        console.log(`[Alert] Message sent from ${id} to guardian ${number}`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * 3. Send Image Snapshot (Multi-user)
 */
app.post('/send-image', async (req, res) => {
    const { id, number, image, caption } = req.body;
    try {
        const session = sessions[id];
        if (!session) return res.status(404).json({ error: "Session not found" });
        
        const base64Data = image.split(',')[1] || image;
        const media = new MessageMedia('image/jpeg', base64Data);
        
        await session.client.sendMessage(`${number}@c.us`, media, { caption });
        console.log(`[Photo] Snapshot sent from ${id}`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * 4. Send 5s Video (Multi-user)
 */
app.post('/send-video', async (req, res) => {
    const { id, number, video, caption } = req.body;
    try {
        const session = sessions[id];
        if (!session) return res.status(404).json({ error: "Session not found" });
        
        const base64Data = video.split(',')[1] || video;
        const media = new MessageMedia('video/webm', base64Data, 'emergency.webm');
        
        console.log(`[Video] Processing clip from ${id}...`);
        await session.client.sendMessage(`${number}@c.us`, media, { caption });
        console.log(`[Video] Clip successfully delivered to ${number}`);
        res.json({ success: true });
    } catch (e) {
        console.error("Bridge Video Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`SafeDrive Multi-User Bridge: Port ${PORT}`);
    console.log(`==========================================`);
});
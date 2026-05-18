const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal"); // Required for terminal QR
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

app.use(express.json({ limit: "70mb" }));
app.use(express.urlencoded({ limit: "70mb", extended: true }));

console.log(`[${new Date().toLocaleTimeString()}] [SYSTEM] Initializing SafeDrive Bridge...`);

/**
 * RECURSIVE BROWSER FINDER
 */
const findLocalChrome = (dir) => {
    const binaryNames = ['chrome-headless-shell', 'chrome', 'chrome.exe', 'chrome-headless-shell.exe'];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            const found = findLocalChrome(fullPath);
            if (found) return found;
        } else {
            if (binaryNames.includes(item) && !item.endsWith('.zip') && !item.endsWith('.txt')) {
                if (process.platform !== 'win32') {
                    try {
                        fs.accessSync(fullPath, fs.constants.X_OK);
                        if (stats.size > 10000000) return fullPath; 
                    } catch (e) { continue; }
                } else { return fullPath; }
            }
        }
    }
    return null;
};

const sessions = {};

/**
 * SESSION CREATOR
 */
const createSession = async (id) => {
    if (sessions[id]) return;

    const localDir = path.join(__dirname, ".local-browser");
    const chromePath = findLocalChrome(localDir);

    if (!chromePath) {
        console.error("[FATAL] Local browser not found.");
        process.exit(1);
    }

    console.log(`[SESSION] Spawning instance for: ${id}`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: id }),
        puppeteer: {
            handleSIGINT: false,
            executablePath: chromePath,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--single-process", "--no-zygote"],
        },
    });

    sessions[id] = { client, qr: "", status: "INITIALIZING" };

    client.on("qr", (qr) => {
        sessions[id].qr = qr;
        sessions[id].status = "WAITING_FOR_SCAN";
        
        // --- CONDITIONAL QR DISPLAY ---
        if (id === "SYSTEM_ADMIN") {
            console.log(`\n[MASTER_LOGIN] PLEASE SCAN THIS TO INITIALIZE SYSTEM NUMBER:`);
            qrcode.generate(qr, { small: true });
        } else {
            console.log(`[QR_CODE] Generated for User ${id} (Sent to UI)`);
        }
    });

    client.on("ready", () => {
        sessions[id].qr = "";
        sessions[id].status = "CONNECTED";
        console.log(`[READY] >>> ${id} IS ONLINE`);
    });

    client.on("authenticated", () => console.log(`[AUTH] Credentials accepted for ${id}`));
    client.on("auth_failure", (msg) => {
        sessions[id].status = "ERROR";
        console.error(`[ERROR] Auth failed for ${id}: ${msg}`);
    });

    client.on("disconnected", async () => {
        console.warn(`[OFFLINE] ${id} disconnected.`);
        delete sessions[id];
    });

    client.initialize().catch(err => console.error(`[CRITICAL] ${id} Init Error:`, err.message));
};

// --- ENDPOINTS ---

app.get("/get-qr", (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID Required" });
    if (!sessions[id]) createSession(id);
    res.json({ qr: sessions[id].qr, status: sessions[id].status });
});

app.post("/send-alert", async (req, res) => {
    const { id, number, message } = req.body;
    try {
        const session = sessions[id];
        if (!session || session.status !== "CONNECTED") throw new Error("Session not connected");
        await session.client.sendMessage(`${number}@c.us`, message);
        console.log(`[SMS] Delivered from ${id}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/send-image", async (req, res) => {
    const { id, number, image, caption } = req.body;
    try {
        const session = sessions[id];
        const base64Data = image.includes(",") ? image.split(",")[1] : image;
        const media = new MessageMedia("image/jpeg", base64Data);
        await session.client.sendMessage(`${number}@c.us`, media, { caption });
        console.log(`[PIC] Delivered from ${id}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/send-video", async (req, res) => {
    const { id, number, video, caption } = req.body;
    try {
        const session = sessions[id];
        const base64Data = video.includes(",") ? video.split(",")[1] : video;
        const media = new MessageMedia("video/webm", base64Data, "emergency.webm");
        await session.client.sendMessage(`${number}@c.us`, media, { caption });
        console.log(`[VID] Delivered from ${id}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CLEANUP ---
const cleanup = async () => {
    console.log(`\n[SHUTDOWN] Saving sessions and closing browsers...`);
    for (const id in sessions) {
        try { await sessions[id].client.destroy(); } catch (e) {}
    }
    process.exit();
};
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(` SafeDrive Multi-User Bridge on Port ${PORT} `);
    console.log(`==========================================`);
    createSession("SYSTEM_ADMIN"); // Initialize System Account
});
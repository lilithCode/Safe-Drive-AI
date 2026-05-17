// const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
// const qrcode = require("qrcode-terminal");
// const express = require("express");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");

// const app = express();
// app.use(cors());
// app.use(express.json({ limit: "60mb" }));
// app.use(express.urlencoded({ limit: "60mb", extended: true }));

// // --- UTILITY: RECURSIVE BROWSER FINDER ---
// const findLocalChrome = (dir) => {
//     const binaryNames = ['chrome-headless-shell', 'chrome', 'chrome.exe', 'chrome-headless-shell.exe'];
//     const items = fs.readdirSync(dir);

//     for (const item of items) {
//         const fullPath = path.join(dir, item);
//         const stats = fs.statSync(fullPath);

//         if (stats.isDirectory()) {
//             const found = findLocalChrome(fullPath);
//             if (found) return found;
//         } else {
//             if (binaryNames.includes(item) && !item.endsWith('.zip') && !item.endsWith('.txt')) {
//                 if (process.platform !== 'win32') {
//                     try {
//                         fs.accessSync(fullPath, fs.constants.X_OK);
//                         if (stats.size > 10000000) return fullPath; 
//                     } catch (e) { continue; }
//                 } else {
//                     return fullPath;
//                 }
//             }
//         }
//     }
//     return null;
// };

// const sessions = {};

// const createSession = async (id) => {
//     if (sessions[id]) return;

//     console.log(`[System] Initializing session for: ${id}`);

//     const localDir = path.join(__dirname, ".local-browser");
//     const chromePath = findLocalChrome(localDir);

//     if (!chromePath) {
//         console.error("[Error] Could not locate Chrome binary in .local-browser");
//         process.exit(1);
//     }
//     console.log(`[System] Executable found: ${chromePath}`);

//     const client = new Client({
//         // PERSISTENCE: This saves the session folder automatically
//         authStrategy: new LocalAuth({ clientId: id }),
//         puppeteer: {
//             handleSIGINT: false, // Set to false to let our custom cleanup handle it
//             executablePath: chromePath,
//             args: [
//                 "--no-sandbox",
//                 "--disable-setuid-sandbox",
//                 "--disable-dev-shm-usage",
//                 "--single-process",
//                 "--no-zygote" 
//             ],
//         },
//     });

//     sessions[id] = { client, qr: "", status: "INITIALIZING" };

//     client.on("qr", (qr) => {
//         sessions[id].qr = qr;
//         sessions[id].status = "WAITING_FOR_SCAN";
//         console.log(`[QR] New code for ${id}.`);
//         qrcode.generate(qr, { small: true });
//     });

//     client.on("ready", () => {
//         sessions[id].qr = "";
//         sessions[id].status = "CONNECTED";
//         console.log(`[Ready] Driver ${id} is LOGGED IN.`);
//     });

//     client.on("disconnected", async () => {
//         console.log(`[System] User ${id} logged out.`);
//         delete sessions[id];
//     });

//     client.initialize().catch(err => console.error(`Init error for ${id}:`, err));
// };

// // --- API ENDPOINTS ---
// app.get("/get-qr", (req, res) => {
//     const { id } = req.query;
//     if (!id) return res.status(400).json({ error: "Missing ID" });
//     if (!sessions[id]) createSession(id);
//     res.json({ qr: sessions[id].qr, status: sessions[id].status });
// });

// app.post("/send-alert", async (req, res) => {
//     const { id, number, message } = req.body;
//     try {
//         const session = sessions[id];
//         if (!session || session.status !== "CONNECTED") throw new Error("Driver not logged in");
//         await session.client.sendMessage(`${number}@c.us`, message);
//         res.json({ success: true });
//     } catch (e) { res.status(500).json({ error: e.message }); }
// });

// app.post("/send-image", async (req, res) => {
//     const { id, number, image, caption } = req.body;
//     try {
//         const session = sessions[id];
//         const base64Data = image.split(",")[1] || image;
//         const media = new MessageMedia("image/jpeg", base64Data);
//         await session.client.sendMessage(`${number}@c.us`, media, { caption });
//         res.json({ success: true });
//     } catch (e) { res.status(500).json({ error: e.message }); }
// });

// app.post("/send-video", async (req, res) => {
//     const { id, number, video, caption } = req.body;
//     try {
//         const session = sessions[id];
//         const base64Data = video.split(",")[1] || video;
//         const media = new MessageMedia("video/webm", base64Data, "emergency.webm");
//         await session.client.sendMessage(`${number}@c.us`, media, { caption });
//         res.json({ success: true });
//     } catch (e) { res.status(500).json({ error: e.message }); }
// });

// // --- GRACEFUL SHUTDOWN (Zombie Killer) ---
// const cleanup = async () => {
//     console.log("\n[System] Closing browsers but saving session data...");
//     for (const id in sessions) {
//         try { 
//             // .destroy() closes the browser but leaves the .wwebjs_auth folder intact
//             await sessions[id].client.destroy(); 
//         } catch (e) {}
//     }
//     process.exit();
// };

// process.on("SIGINT", cleanup);
// process.on("SIGTERM", cleanup);

// const PORT = 3001;
// app.listen(PORT, () => {
//     console.log(`==========================================`);
//     console.log(`SafeDrive Persistent Bridge: Port ${PORT}`);
//     console.log(`==========================================`);
//     // Pre-load the master account
//     createSession("SYSTEM_ADMIN");
// });


const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

// Increase payload limits for Base64 images and videos
app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ limit: "60mb", extended: true }));

console.log("[SYSTEM] Starting SafeDrive Bridge Node Service...");

// --- UTILITY: RECURSIVE BROWSER FINDER ---
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
                } else {
                    return fullPath;
                }
            }
        }
    }
    return null;
};

const sessions = {};

const createSession = async (id) => {
    if (sessions[id]) {
        console.log(`[SESSION] Attempted to create existing session: ${id}. Skipping.`);
        return;
    }

    console.log(`[SESSION] Initializing sequence for Driver ID: ${id}`);

    const localDir = path.join(__dirname, ".local-browser");
    const chromePath = findLocalChrome(localDir);

    if (!chromePath) {
        console.error("[FATAL] Browser binary not found in .local-browser. Setup failed.");
        process.exit(1);
    }
    console.log(`[SESSION] Using Browser: ${chromePath}`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: id }),
        puppeteer: {
            handleSIGINT: false,
            executablePath: chromePath,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--single-process",
                "--no-zygote" 
            ],
        },
    });

    sessions[id] = { client, qr: "", status: "INITIALIZING" };

    // --- CLIENT EVENTS ---

    client.on("qr", (qr) => {
        sessions[id].qr = qr;
        sessions[id].status = "WAITING_FOR_SCAN";
        console.log(`[QR_CODE] Generated for ${id}. (Awaiting scan from UI)`);
        // Removed qrcode.generate to keep terminal clean as requested
    });

    client.on("authenticated", () => {
        console.log(`[AUTH] Driver ${id} successfully authenticated.`);
    });

    client.on("ready", () => {
        sessions[id].qr = "";
        sessions[id].status = "CONNECTED";
        console.log(`[READY] Driver ${id} is ONLINE and CONNECTED.`);
    });

    client.on("auth_failure", (msg) => {
        sessions[id].status = "ERROR";
        console.error(`[AUTH_ERROR] Authentication failed for ${id}: ${msg}`);
    });

    client.on("disconnected", async (reason) => {
        console.warn(`[LOGOUT] Driver ${id} disconnected. Reason: ${reason}`);
        delete sessions[id];
    });

    console.log(`[SESSION] Launching WhatsApp engine for ${id}...`);
    client.initialize().catch(err => {
        console.error(`[CRITICAL] Initialization error for ${id}:`, err);
    });
};

// --- API ENDPOINTS WITH DETAILED LOGS ---

app.get("/get-qr", (req, res) => {
    const { id } = req.query;
    console.log(`[API_REQ] GET /get-qr | ID: ${id}`);
    
    if (!id) {
        return res.status(400).json({ error: "Missing Driver ID" });
    }

    if (!sessions[id]) {
        console.log(`[API_FLOW] Session ${id} not found. Starting now...`);
        createSession(id);
    }

    res.json({ 
        qr: sessions[id].qr, 
        status: sessions[id].status 
    });
});

app.post("/send-alert", async (req, res) => {
    const { id, number, message } = req.body;
    console.log(`[API_REQ] POST /send-alert | From: ${id} | To: ${number}`);

    try {
        const session = sessions[id];
        if (!session || session.status !== "CONNECTED") {
            console.error(`[SEND_FAIL] Session ${id} is not connected.`);
            throw new Error("Driver account not linked.");
        }
        
        await session.client.sendMessage(`${number}@c.us`, message);
        console.log(`[SUCCESS] Text Alert delivered to ${number}`);
        res.json({ success: true });
    } catch (e) {
        console.error(`[ERROR] Text Send Failed: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

app.post("/send-image", async (req, res) => {
    const { id, number, image, caption } = req.body;
    console.log(`[API_REQ] POST /send-image | From: ${id} | To: ${number}`);

    try {
        const session = sessions[id];
        const base64Data = image.split(",")[1] || image;
        const media = new MessageMedia("image/jpeg", base64Data);
        
        await session.client.sendMessage(`${number}@c.us`, media, { caption });
        console.log(`[SUCCESS] Snapshot delivered to ${number}`);
        res.json({ success: true });
    } catch (e) {
        console.error(`[ERROR] Image Send Failed: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

app.post("/send-video", async (req, res) => {
    const { id, number, video, caption } = req.body;
    console.log(`[API_REQ] POST /send-video | From: ${id} | To: ${number}`);

    try {
        const session = sessions[id];
        const base64Data = video.split(",")[1] || video;
        const media = new MessageMedia("video/webm", base64Data, "emergency.webm");
        
        console.log(`[PROCESS] Encoding video for ${number}...`);
        await session.client.sendMessage(`${number}@c.us`, media, { caption });
        console.log(`[SUCCESS] Video Alert delivered to ${number}`);
        res.json({ success: true });
    } catch (e) {
        console.error(`[ERROR] Video Send Failed: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// --- GRACEFUL SHUTDOWN ---
const cleanup = async () => {
    console.log("\n[SHUTDOWN] Terminating SafeDrive Bridge...");
    for (const id in sessions) {
        try { 
            console.log(`[SHUTDOWN] Closing browser instance for ${id}`);
            await sessions[id].client.destroy(); 
        } catch (e) {
            console.error(`[SHUTDOWN_ERR] Failed to kill ${id}:`, e.message);
        }
    }
    console.log("[SHUTDOWN] All browser processes cleared. Goodbye.");
    process.exit();
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`================================================`);
    console.log(` SafeDrive Multi-User Bridge Running on Port ${PORT} `);
    console.log(`================================================`);
    
    // Auto-load master system account
    createSession("SYSTEM_ADMIN");
});
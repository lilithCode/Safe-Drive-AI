// const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
// const qrcode = require("qrcode-terminal");
// const express = require("express");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");

// const app = express();
// app.use(cors());
// app.use(express.json({ limit: "70mb" }));
// app.use(express.urlencoded({ limit: "70mb", extended: true }));

// const sessions = {};

// const createSession = async (id) => {
//   if (sessions[id]) return;

//   // Standard Arch Linux Chromium path
//   let chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";

//   console.log(`[SESSION] Starting: ${id}`);

//   const client = new Client({
//     authStrategy: new LocalAuth({ clientId: id }),
//     puppeteer: {
//       executablePath: chromePath,
//       handleSIGINT: false,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//       ],
//     },
//   });

//   sessions[id] = { client, qr: "", status: "INITIALIZING" };

//   client.on("qr", (qr) => {
//     sessions[id].qr = qr;
//     sessions[id].status = "WAITING_FOR_SCAN";
//     if (id === "SYSTEM_ADMIN") {
//       console.log(`[LOGIN] Scan this for ${id}:`);
//       qrcode.generate(qr, { small: true });
//     }
//   });

//   client.on("ready", () => {
//     sessions[id].qr = "";
//     sessions[id].status = "CONNECTED";
//     console.log(`[ONLINE] ${id}`);
//   });

//   client.on("authenticated", () => console.log(`[AUTH] Success: ${id}`));

//   client.on("auth_failure", (msg) => {
//     sessions[id].status = "ERROR";
//     console.error(`[ERROR] ${id}: ${msg}`);
//   });

//   client.on("disconnected", async () => {
//     console.warn(`[OFFLINE] ${id}`);
//     delete sessions[id];
//   });

//   client
//     .initialize()
//     .catch((err) => console.error(`[CRITICAL] ${id}:`, err.message));
// };

// app.get("/get-qr", (req, res) => {
//   const { id } = req.query;
//   if (!id) return res.status(400).json({ error: "ID Required" });
//   if (!sessions[id]) createSession(id);
//   res.json({ qr: sessions[id].qr, status: sessions[id].status });
// });

// app.post("/send-alert", async (req, res) => {
//   const { id, number, message } = req.body;
//   try {
//     const session = sessions[id];
//     if (!session || session.status !== "CONNECTED")
//       throw new Error("Not connected");
//     await session.client.sendMessage(`${number}@c.us`, message);
//     res.json({ success: true });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// app.post("/send-image", async (req, res) => {
//   const { id, number, image, caption } = req.body;
//   try {
//     const session = sessions[id];
//     const base64Data = image.includes(",") ? image.split(",")[1] : image;
//     const media = new MessageMedia("image/jpeg", base64Data);
//     await session.client.sendMessage(`${number}@c.us`, media, { caption });
//     res.json({ success: true });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// app.post("/send-video", async (req, res) => {
//   const { id, number, video, caption } = req.body;
//   try {
//     const session = sessions[id];
//     const base64Data = video.includes(",") ? video.split(",")[1] : video;
//     const media = new MessageMedia("video/mp4", base64Data, "video.mp4");
//     await session.client.sendMessage(`${number}@c.us`, media, { caption });
//     res.json({ success: true });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// const cleanup = async () => {
//   for (const id in sessions) {
//     try {
//       await sessions[id].client.destroy();
//     } catch (e) {}
//   }
//   process.exit();
// };

// process.on("SIGINT", cleanup);
// process.on("SIGTERM", cleanup);

// const PORT = 3001;
// app.listen(PORT, () => {
//   console.log(`SafeDrive Bridge running on port ${PORT}`);
//   createSession("SYSTEM_ADMIN");
// });




const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "70mb" }));
app.use(express.urlencoded({ limit: "70mb", extended: true }));

const sessions = {};

const createSession = async (id) => {
  if (sessions[id]) return;
  const chromePath = process.platform === "linux" ? "/usr/bin/chromium" : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

  console.log(`[SESSION] Initializing: ${id}`);
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: id }),
    puppeteer: {
      executablePath: chromePath,
      handleSIGINT: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    },
  });

  sessions[id] = { client, qr: "", status: "INITIALIZING" };

  client.on("qr", (qr) => {
    sessions[id].qr = qr;
    sessions[id].status = "WAITING_FOR_SCAN";
    if (id === "SYSTEM_ADMIN") {
      console.log(`[LOGIN] Scan this for ${id}:`);
      qrcode.generate(qr, { small: true });
    }
  });

  client.on("ready", () => {
    sessions[id].qr = "";
    sessions[id].status = "CONNECTED";
    console.log(`[READY] Driver ${id} is ONLINE`);
  });

  client.on("disconnected", () => {
    console.warn(`[OFFLINE] ${id} logged out`);
    delete sessions[id];
  });

  client.initialize().catch((err) => console.error(`[CRITICAL] ${id}:`, err.message));
};

app.get("/get-qr", (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID Required" });
  if (!sessions[id]) createSession(id);
  res.json({ qr: sessions[id].qr, status: sessions[id].status });
});

app.post("/send-alert", async (req, res) => {
  const { id, number, message } = req.body;
  console.log(`[API_REQ] POST /send-alert | From: ${id} | To: ${number}`);
  try {
    const session = sessions[id];
    if (!session || session.status !== "CONNECTED") throw new Error("WhatsApp not connected");
    await session.client.sendMessage(`${number}@c.us`, message);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/send-image", async (req, res) => {
  const { id, number, image, caption } = req.body;
  console.log(`[API_REQ] POST /send-image | From: ${id}`);
  try {
    const session = sessions[id];
    const base64Data = image.split(",")[1] || image;
    const media = new MessageMedia("image/jpeg", base64Data);
    await session.client.sendMessage(`${number}@c.us`, media, { caption });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/send-video", async (req, res) => {
  const { id, number, video, caption } = req.body;
  console.log(`[API_REQ] POST /send-video | From: ${id}`);
  try {
    const session = sessions[id];
    const base64Data = video.split(",")[1] || video;
    const media = new MessageMedia("video/webm", base64Data, "emergency.webm");
    await session.client.sendMessage(`${number}@c.us`, media, { caption });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(3001, () => {
    console.log(`Bridge listening on 3001`);
    createSession("SYSTEM_ADMIN");
});
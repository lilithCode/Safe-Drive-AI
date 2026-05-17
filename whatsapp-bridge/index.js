const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ limit: "60mb", extended: true }));

const sessions = {};

const createSession = (id) => {
  if (sessions[id]) return;

  console.log(`[System] Initializing new session for ID: ${id}`);

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: id }),
    puppeteer: {
      handleSIGINT: true,
      // Removed executablePath so Puppeteer handles finding the browser automatically
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
      ],
    },
  });

  sessions[id] = { client, qr: "", status: "INITIALIZING" };

  client.on("qr", (qr) => {
    sessions[id].qr = qr;
    sessions[id].status = "WAITING_FOR_SCAN";
    console.log(`[QR] New code generated for ${id}. Scan via Dashboard.`);
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    sessions[id].qr = "";
    sessions[id].status = "CONNECTED";
    console.log(`[Ready] Driver ${id} is officially LOGGED IN.`);
  });

  client.on("auth_failure", (msg) => {
    console.error(`[Error] Auth failure for ${id}:`, msg);
    sessions[id].status = "AUTH_FAILURE";
  });

  client.on("disconnected", (reason) => {
    console.log(`[System] User ${id} logged out:`, reason);
    delete sessions[id];
  });

  client.initialize();
};

app.get("/get-qr", (req, res) => {
  const { id } = req.query;
  if (!id)
    return res.status(400).json({ error: "Missing driver ID (phone number)" });

  if (!sessions[id]) {
    createSession(id);
  }

  res.json({
    qr: sessions[id].qr,
    status: sessions[id].status,
  });
});

app.post("/send-alert", async (req, res) => {
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

app.post("/send-image", async (req, res) => {
  const { id, number, image, caption } = req.body;
  try {
    const session = sessions[id];
    if (!session) return res.status(404).json({ error: "Session not found" });

    const base64Data = image.split(",")[1] || image;
    const media = new MessageMedia("image/jpeg", base64Data);

    await session.client.sendMessage(`${number}@c.us`, media, { caption });
    console.log(`[Photo] Snapshot sent from ${id}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/send-video", async (req, res) => {
  const { id, number, video, caption } = req.body;
  try {
    const session = sessions[id];
    if (!session) return res.status(404).json({ error: "Session not found" });

    const base64Data = video.split(",")[1] || video;
    const media = new MessageMedia("video/webm", base64Data, "emergency.webm");

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

// const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const express = require('express');

// const app = express();
// // Allow large Base64 payloads for high-res images
// app.use(express.json({ limit: '50mb' })); 
// app.use(express.urlencoded({ limit: '50mb', extended: true }));

// const client = new Client({
//     authStrategy: new LocalAuth(),
//     puppeteer: { 
//         handleSIGINT: true,
//         executablePath: '/usr/bin/chromium', // Standard Arch Linux path
//         args: [
//             '--no-sandbox',
//             '--disable-setuid-sandbox',
//             '--disable-dev-shm-usage',
//             '--single-process',
//             '--disable-gpu'
//         ],
//     }
// });

// client.on('qr', (qr) => {
//     console.log('--- SCAN THIS QR CODE WITH WHATSAPP ---');
//     qrcode.generate(qr, { small: true });
// });

// client.on('ready', () => {
//     console.log('WhatsApp Bridge is READY and LOGGED IN');
// });

// // ENDPOINT 1: Send Text Message
// app.post('/send-alert', async (req, res) => {
//     const { number, message } = req.body;
//     try {
//         const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
//         await client.sendMessage(chatId, message);
//         console.log(`Text alert sent to ${number}`);
//         res.json({ success: true });
//     } catch (error) {
//         console.error("Bridge Alert Error:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // ENDPOINT 2: Send Image
// app.post('/send-image', async (req, res) => {
//     const { number, image, caption } = req.body;
//     try {
//         const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        
//         // Strip base64 prefix (data:image/jpeg;base64,)
//         const base64Data = image.split(',')[1] || image;
        
//         const media = new MessageMedia('image/jpeg', base64Data);
        
//         await client.sendMessage(chatId, media, { caption: caption });
//         console.log(`Image snapshot sent to ${number}`);
//         res.json({ success: true });
//     } catch (error) {
//         console.error("Bridge Image Error:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // ENDPOINT 3: Send Video
// app.post('/send-video', async (req, res) => {
//     const { number, video, caption } = req.body;
//     try {
//         const chatId = `${number}@c.us`;
//         // Strip base64 prefix
//         const base64Data = video.split(',')[1] || video;
        
//         // WhatsApp expects 'video/mp4' for most compatibility
//         const media = new MessageMedia('video/mp4', base64Data, 'emergency_clip.mp4');
        
//         await client.sendMessage(chatId, media, { 
//             caption: caption,
//             sendMediaAsDocument: false // Send as viewable video
//         });
        
//         console.log(`Video sent to ${number}`);
//         res.json({ success: true });
//     } catch (error) {
//         console.error("Bridge Video Error:", error);
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

const app = express();
app.use(express.json({ limit: '60mb' })); 
app.use(express.urlencoded({ limit: '60mb', extended: true }));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        handleSIGINT: true,
        executablePath: '/usr/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
    }
});

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('WhatsApp Bridge READY'));

app.post('/send-alert', async (req, res) => {
    try {
        await client.sendMessage(`${req.body.number}@c.us`, req.body.message);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/send-image', async (req, res) => {
    try {
        const base64Data = req.body.image.split(',')[1] || req.body.image;
        const media = new MessageMedia('image/jpeg', base64Data);
        await client.sendMessage(`${req.body.number}@c.us`, media, { caption: req.body.caption });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/send-video', async (req, res) => {
    const { number, video, caption } = req.body;
    try {
        const chatId = `${number}@c.us`;
        // Ensure we handle the base64 string correctly
        const base64Data = video.includes(',') ? video.split(',')[1] : video;
        
        // We create the media object. 
        // NOTE: We keep it as video/webm because that's what the browser recorded.
        // WhatsApp-web.js + FFmpeg will handle the conversion to mp4 automatically.
        const media = new MessageMedia('video/webm', base64Data, 'emergency.webm');
        
        console.log(`Processing video for ${number}... (this may take a few seconds)`);
        
        await client.sendMessage(chatId, media, { 
            caption: caption,
            sendVideoAsGif: false 
        });
        
        console.log(`✅ Video sent successfully to ${number}`);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Bridge Video Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3001, () => client.initialize());
This is a professional, step-by-step guide designed for a collaborator. It covers every technical "fix" we implemented (MediaPipe versions, Local Browser paths, and FFmpeg) so that the project runs perfectly on any system.

***

# 🛡️ SafeDrive AI: Setup & Execution Guide

SafeDrive AI is a real-time driver monitoring system that uses Computer Vision to detect fatigue/distraction and triggers an automated SOS sequence via WhatsApp (Location + 3 Photos + 5s Video).

## 📋 Prerequisites
Before starting, ensure the following are installed on the system:
1. **Node.js** (v18 or higher)
2. **Python** (3.10 to 3.12)
3. **FFmpeg** (Required for WhatsApp Video processing)
   * *Arch Linux:* `sudo pacman -S ffmpeg unzip`
   * *Ubuntu/Debian:* `sudo apt install ffmpeg unzip`
   * *Windows:* Install via [Choco](https://chocolatey.org/) or official website.

---

## 🚀 Step 1: The WhatsApp Bridge (Node.js)
The Bridge acts as a "Virtual Phone" that manages WhatsApp sessions.

1. **Navigate to the folder:**
   ```bash
   cd whatsapp-bridge
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Install the Local Browser (System Independent):**
   *To ensure the bridge works on any laptop without searching for Chrome, we install a local version:*
   ```bash
   npx puppeteer browsers install chrome-headless-shell --path .local-browser
   ```
4. **Manual Extraction (For Linux/Arch Users):**
   *If the bridge fails to find the browser, manually unzip it:*
   ```bash
   cd .local-browser/chrome-headless-shell
   unzip *.zip -d linux-146.0.7680.31/  # Use the version folder name found there
   chmod -R +x .
   cd ../..
   ```
5. **Start the Bridge:**
   ```bash
   node index.js
   ```
6. **Scan the QR Code:**
   A QR code will appear for the `SYSTEM_ADMIN` account. Scan it with your phone. The bridge is ready when it prints: `WhatsApp Bridge READY`.

---

## 🧠 Step 2: The AI Backend (FastAPI)
The backend processes the video feed and calculates EAR (Eye Aspect Ratio).

1. **Navigate to the folder:**
   ```bash
   cd backend
   ```
2. **Create & Activate Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # venv\Scripts\activate  # Windows
   ```
3. **Install Dependencies (Specific Fix):**
   *We use a specific MediaPipe version to avoid compatibility errors with Python 3.12:*
   ```bash
   pip install fastapi uvicorn opencv-python numpy httpx
   pip i[k0haii@BlueBox backend]$ python3.12 -m venv venv
bash: python3.12: command not found
[k0haii@BlueBox backend]$ 
nstall mediapipe==0.10.13
   ```
4. **Start the AI Server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 💻 Step 3: The Dashboard (Next.js)
The frontend HUD for the driver.

1. **Navigate to the folder:**
   ```bash
   cd frontend
   ```
2. **Install UI Libraries:**
   ```bash
   npm install
   ```
3. **Start the Dashboard:**
   ```bash
   npm run dev
   ```
4. **Access the App:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Usage & Demo Instructions

### 1. The Setup Wizard
On the first run, the app will prompt for:
*   **Driver Name & Phone:** Your identification.
*   **Guardian Number:** The recipient of the SOS (Format: `923XXXXXXXXX`).
*   **Protocol:** 
    *   *System Number:* Uses the developer's pre-linked WhatsApp (Fastest).
    *   *Personal Number:* Shows a QR code for the driver to link their own account.

### 2. Monitoring
*   Click **Initialize** then **Start Driving**.
*   The AI Mesh (dots) will appear on your face.
*   **Manual SOS:** Click the "Initiate SOS" button.
*   **Auto SOS:** Close your eyes for **3 seconds straight**.

### 3. The Emergency Packet
The recipient will receive:
1.  **Text Alert:** With a real Google Maps link.
2.  **3 Photos:** Captured every 5 seconds.
3.  **Video Clip:** A 5-second recording of the incident.

---

## ⚠️ Common Fixes (Troubleshooting)

*   **Camera not working?** 
    Ensure no other app (Zoom, Discord) is using the webcam. On Arch, ensure the driver is loaded: `sudo modprobe v4l2loopback`.
*   **WhatsApp Timeout?**
    The video file takes about 10 seconds to process and upload. Wait for the `✅ Video sent` log in the bridge terminal.
*   **QR Code not appearing in UI?**
    Ensure the `whatsapp-bridge` is running on port 3001 and your browser allows `localhost` CORS requests.

***

**Status:** ALL SYSTEMS OPERATIONAL 🟢
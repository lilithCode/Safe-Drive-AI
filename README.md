Here is the updated and detailed **README.md** following your exact format, including all the new features we implemented (WhatsApp Bridge, SOS logic, and Multi-user setup).

---

# SafeDrive AI
 
> Real-time Driver Assistance & Monitoring Dashboard with Automated SOS Response
 
SafeDrive AI is a professional, AI-powered dashboard that monitors driver fatigue and distractions in real time. Beyond just monitoring, it features an automated emergency response system that sends location data, visual snapshots, and video evidence to guardians via WhatsApp if an accident or drowsiness is detected.
 
---
 
## What it does
 
| Feature | How |
|---|---|
| **Drowsiness Detection** | MediaPipe FaceMesh calculates Eye Aspect Ratio (EAR) in-browser. Alerts when eyes stay closed for >4 frames. |
| **Distraction Detection** | YOLOv8 on the backend identifies phone usage and head-tilt/looking-away behavior. |
| **Automated SOS** | Triggers an emergency "Data Packet" to guardians via WhatsApp including text and GPS location. |
| **Visual Proof** | Captures and sends 3 sequential snapshots + a 5-second video clip of the driver during an alert. |
| **Multi-User Link** | Integrated Setup Wizard allows drivers to use a "System Master" number or link their own via QR code. |
| **Live Telemetry** | Real-time AI data pushed via WebSockets to a high-performance GSAP-animated HUD. |
 
---
 
## Tech stack
 
**Frontend**
- Next.js 15 (React)
- Tailwind CSS
- GSAP (Animations)
- MediaPipe FaceMesh
- Lucide React (Icons)
- HTML5 MediaRecorder API

**Backend**
- Python 3.10+
- FastAPI
- YOLOv8 (Ultralytics)
- OpenCV & NumPy
- HTTPX (Async API calls)

**Communication Bridge**
- Node.js (Express)
- WhatsApp-Web.js (Puppeteer)
- QR Code Terminal/React
---
 
## Prerequisites
 
Make sure you have these installed before starting:
 
- [Node.js](https://nodejs.org/) v20 or higher
- [Python](https://www.python.org/) v3.10 or higher
- **System Requirements (Linux/Arch):**
  ```bash
  sudo pacman -S chromium ffmpeg
  ```
---
 
## Running locally
 
This is a monorepo with three components. You will need **three separate terminals** running at the same time.
 
---
 
### Terminal 1 — WhatsApp Bridge (The Communication Hub)
This service manages the WhatsApp sessions.
 
```bash
cd whatsapp-bridge
npm install
node index.js
```
> **Note:** On first run, scan the QR code in the terminal to initialize the **MASTER** system number.

---

### Terminal 2 — Backend (The Brain)
 
```bash
cd backend
python3 -m venv venv
source venv/bin/activate # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
 
---
 
### Terminal 3 — Frontend (The Dashboard)
 
```bash
cd frontend
npm install
npm run dev
```
 
---
 
### Initial Setup
 
1. Go to [http://localhost:3000](http://localhost:3000).
2. The **Setup Wizard** will appear automatically on the first visit.
3. Enter Driver and Guardian details.
4. Choose **"Use System Number"** (uses your master login) or **"Use My Number"** (presents a QR code to link the driver's phone).
5. Allow **Camera** and **Location** permissions in the browser.
 
---
 
## Project structure
 
```
SafeDrive-AI/
├── backend/          # FastAPI server + YOLOv8 + SOS logic
├── frontend/         # Next.js app + MediaPipe + Dashboard UI
├── whatsapp-bridge/  # Node.js Express server for WhatsApp Web sessions
├── README.md
└── .gitignore
```
---
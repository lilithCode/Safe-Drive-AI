# SafeDrive AI
 
> Real-time Driver Assistance & Monitoring Dashboard
 
SafeDrive AI is a browser-based, AI-powered dashboard that helps prevent road accidents by monitoring driver fatigue and distractions in real time. 
Built as a university project to demonstrate practical Computer Vision and modern Web Technologies.
 
---
 
## What it does
 
| Feature | How |
|---|---|
| Drowsiness detection | MediaPipe FaceMesh calculates Eye Aspect Ratio (EAR) in-browser. Alerts when eyes stay closed too long. |
| Distraction detection | YOLOv8 on the backend spots phone usage, eating, drinking, and more. |
| Real time alerts | WebSockets push warnings from backend to UI instantly , no page refresh. |
| Live dashboard | Next.js UI shows safety score, live alert logs, and risk level indicators. |
| 3D face mesh | Custom WebGL/Canvas renderer draws a 468-point facial mesh at 60 FPS. |
 
---
 
## Tech stack
 
**Frontend**
- Next.js (React)
- Tailwind CSS
- MediaPipe FaceMesh
- WebSockets
- HTML5 Canvas API
**Backend**
- Python 3.8+
- FastAPI
- YOLOv8 
- OpenCV
- WebSockets
---
 
## Prerequisites
 
Make sure you have these installed before starting:
 
- [Node.js](https://nodejs.org/) v18 or higher
- [Python](https://www.python.org/) v3.8 or higher
---
 
## Running locally
 
This is a monorepo with a frontend and a backend. You will need **two separate terminals** running at the same time.
 
---
 
### Terminal 1 — Backend
 
```bash
cd backend
```
 
Create a virtual environment:
 
```bash
python3 -m venv venv
```
 
Activate it:
 
```bash
# Linux / Mac
source venv/bin/activate
 
# Windows
.\venv\Scripts\activate
```
 
Install dependencies:
 
```bash
pip install -r requirements.txt
 ```
 
Start the server:
 
```bash
uvicorn main:app --reload
```
 
> The first run will automatically download `yolov8n.pt` (~6 MB). This only happens once.
 
---
 
### Terminal 2 — Frontend
 
```bash
cd frontend
```
 
Install dependencies:
 
```bash
npm install
```
 
Start the app:
 
```bash
npm run dev
```
 
---
 
### Open the app
 
Go to [http://localhost:3000](http://localhost:3000) in your browser and allow camera access when prompted.
 
---
 
## Project structure
 
```
SafeDrive/
├── backend/          # FastAPI server + YOLOv8 logic
├── frontend/         # Next.js app + MediaPipe
├── README.md
└── .gitignore
```
---


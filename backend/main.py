from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
import json
from vision_engine import FacialAnalyzer

app = FastAPI()

# Allow Next.js frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change to your Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Engine
analyzer = FacialAnalyzer()

@app.get("/")
def read_root():
    return {"status": "SafeDrive AI Backend is Running"}

@app.websocket("/ws/video")
async def video_websocket(websocket: WebSocket):
    await websocket.accept()
    print("Frontend Connected to WebSockets!")
    try:
        while True:
            # 1. Receive Base64 image from Next.js
            data = await websocket.receive_text()
            
            # Remove the "data:image/jpeg;base64," prefix if it exists
            if "," in data:
                data = data.split(",")[1]
                
            # 2. Convert Base64 back to OpenCV Image
            img_bytes = base64.b64decode(data)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            if frame is None:
                continue

            # 3. Analyze the frame using our Vision Engine
            analysis_results = analyzer.analyze_frame(frame)
            
            # 4. Send JSON results back to frontend
            await websocket.send_text(json.dumps(analysis_results))
            
    except WebSocketDisconnect:
        print("Frontend Disconnected")
    except Exception as e:
        print(f"Error: {e}")
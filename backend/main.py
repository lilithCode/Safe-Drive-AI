# import base64
# import cv2 
# import numpy as np
# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# import json
# import httpx
# from pydantic import BaseModel
# from typing import Optional
# from detector import process_frame
# import asyncio 

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class SOSPayload(BaseModel):
#     latitude: Optional[float] = None
#     longitude: Optional[float] = None
#     guardian_number: str
#     driver_name: str
#     image: Optional[str] = None
#     video: Optional[str] = None
#     is_follow_up: bool = False

# @app.websocket("/ws/video")
# async def video_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     try:
#         while True:
#             data = await websocket.receive_text()
#             header, encoded = data.split(",", 1)
#             img_bytes = base64.b64decode(encoded)
#             np_arr = np.frombuffer(img_bytes, np.uint8)
#             frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
#             if frame is None: continue
#             ai_data = process_frame(frame)
#             await websocket.send_text(json.dumps(ai_data))
#     except Exception as e: print(f"Socket Error: {e}")

# @app.post("/api/sos/whatsapp")
# async def trigger_whatsapp_sos(payload: SOSPayload):
#     async with httpx.AsyncClient(timeout=60.0) as client:
#         try:
#             if not payload.is_follow_up:
#                 lat, lng = payload.latitude, payload.longitude
#                 loc_source = "Browser GPS"
#                 if lat is None:
#                     try:
#                         ip_res = await client.get("http://ip-api.com/json/", timeout=5.0)
#                         ip_data = ip_res.json()
#                         lat, lng, loc_source = ip_data.get("lat"), ip_data.get("lon"), "Network IP"
#                     except: pass

#                 maps_link = f"https://www.google.com/maps?q={lat},{lng}" if lat else "Unavailable"
#                 message = f"🚨 *SAFE-DRIVE AI EMERGENCY* 🚨\n\nDriver: *{payload.driver_name}*\nStatus: *CRITICAL*\n📍 Location ({loc_source}): {maps_link}"
#                 await client.post("http://localhost:3001/send-alert", json={"number": payload.guardian_number, "message": message})
#                 await asyncio.sleep(1.0)

#             if payload.image:
#                 await client.post("http://localhost:3001/send-image", json={
#                     "number": payload.guardian_number, "image": payload.image,
#                     "caption": "📸 Emergency Snapshot"
#                 })

#             if payload.video:
#                 print("Sending video clip...")
#                 await client.post("http://localhost:3001/send-video", json={
#                     "number": payload.guardian_number, "video": payload.video,
#                     "caption": "📹 5-Second Video Feed"
#                 })

#             return {"success": True}
#         except Exception as e:
#             return {"success": False, "error": str(e)}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


import base64
import cv2 
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import httpx
from pydantic import BaseModel
from typing import Optional
from detector import process_frame
import asyncio 

app = FastAPI()

# --- CORS SETTINGS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class SOSPayload(BaseModel):
    id: str  # The unique Driver Phone Number
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    guardian_number: str
    driver_name: str
    image: Optional[str] = None
    video: Optional[str] = None
    is_follow_up: bool = False

# --- AI VIDEO WEBSOCKET ---
@app.websocket("/ws/video")
async def video_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            header, encoded = data.split(",", 1)
            img_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None: continue
            ai_data = process_frame(frame)
            await websocket.send_text(json.dumps(ai_data))
    except Exception as e: print(f"Socket Error: {e}")

# --- MULTI-USER WHATSAPP SOS ENDPOINT ---
@app.post("/api/sos/whatsapp")
async def trigger_whatsapp_sos(payload: SOSPayload):
    # Bridge URL
    BRIDGE_URL = "http://localhost:3001"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            # 1. First Packet Logic (Text + Location)
            if not payload.is_follow_up:
                lat, lng = payload.latitude, payload.longitude
                loc_source = "Browser GPS"
                if lat is None:
                    try:
                        ip_res = await client.get("http://ip-api.com/json/", timeout=5.0)
                        ip_data = ip_res.json()
                        lat, lng, loc_source = ip_data.get("lat"), ip_data.get("lon"), "Network IP"
                    except: pass

                maps_link = f"https://www.google.com/maps?q={lat},{lng}" if lat else "Unavailable"
                message = f"🚨 *SAFE-DRIVE AI EMERGENCY* 🚨\n\nDriver: *{payload.driver_name}*\nStatus: *CRITICAL*\n📍 Location ({loc_source}): {maps_link}"
                
                # Send Text (Pass 'id' so bridge knows which WA account to use)
                await client.post(f"{BRIDGE_URL}/send-alert", json={
                    "id": payload.id, 
                    "number": payload.guardian_number, 
                    "message": message
                })
                await asyncio.sleep(1.0)

            # 2. Send Image (Sequential or Initial)
            if payload.image:
                await client.post(f"{BRIDGE_URL}/send-image", json={
                    "id": payload.id,
                    "number": payload.guardian_number,
                    "image": payload.image,
                    "caption": "📸 Emergency Snapshot"
                })

            # 3. Send Video
            if payload.video:
                await client.post(f"{BRIDGE_URL}/send-video", json={
                    "id": payload.id,
                    "number": payload.guardian_number,
                    "video": payload.video,
                    "caption": "📹 5-Second Video Feed"
                })

            return {"success": True}
        except Exception as e:
            print(f"SOS Error: {e}")
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
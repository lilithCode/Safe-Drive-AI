# import base64
# import cv2
# import numpy as np
# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# import json
# import asyncio
# import httpx
# import logging
# from pydantic import BaseModel
# from typing import Optional
# from detector import process_frame

# # --- SETUP LOGGING ---
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("SafeDrive-Backend")

# app = FastAPI()

# # --- CORS SETTINGS ---
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --- DATA MODELS ---
# class SOSPayload(BaseModel):
#     id: str
#     latitude: Optional[float] = None
#     longitude: Optional[float] = None
#     guardian_number: str
#     driver_name: str
#     image: Optional[str] = None
#     video: Optional[str] = None
#     is_follow_up: bool = False

# # --- 1. AI VIDEO WEBSOCKET ---
# @app.websocket("/ws/video")
# async def video_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     logger.info("✅ UI Connected to Video WebSocket")
#     try:
#         while True:
#             data = await websocket.receive_text()
#             header, encoded = data.split(",", 1)
#             img_bytes = base64.b64decode(encoded)
#             np_arr = np.frombuffer(img_bytes, np.uint8)
#             frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
#             if frame is None:
#                 continue

#             # Process AI Features without blocking the thread
#             ai_data = await asyncio.to_thread(process_frame, frame)
#             await websocket.send_text(json.dumps(ai_data))
            
#     except WebSocketDisconnect:
#         logger.warning("❌ UI Disconnected from Video WebSocket")
#     except Exception as e:
#         logger.error(f"🔥 Socket Error: {e}")

# # --- 2. WHATSAPP SOS ENDPOINT (Fixed 404 issue) ---
# @app.post("/api/sos/whatsapp")
# async def trigger_whatsapp_sos(payload: SOSPayload):
#     logger.info(f"🚨 SOS REQUEST RECEIVED | ID: {payload.id} | Follow-up: {payload.is_follow_up}")
    
#     BRIDGE_URL = "http://localhost:3001"
    
#     async with httpx.AsyncClient(timeout=60.0) as client:
#         try:
#             # Step A: Location & Text (Only on first packet)
#             if not payload.is_follow_up:
#                 lat, lng = payload.latitude, payload.longitude
#                 source = "Browser GPS"

#                 if lat is None or lng is None:
#                     logger.info("🛰️ GPS missing, fetching IP location...")
#                     try:
#                         ip_res = await client.get("http://ip-api.com/json/", timeout=5.0)
#                         ip_data = ip_res.json()
#                         lat, lng, source = ip_data.get("lat"), ip_data.get("lon"), "Network IP"
#                     except Exception as e:
#                         logger.error(f"IP-Geo Failed: {e}")

#                 maps_link = f"https://www.google.com/maps?q={lat},{lng}" if lat else "Unavailable"
#                 message = f"🚨 *SAFE-DRIVE AI EMERGENCY* 🚨\n\nDriver: *{payload.driver_name}*\nStatus: *CRITICAL*\n📍 Location ({source}): {maps_link}"
                
#                 logger.info(f"📤 Sending text alert to bridge for user {payload.id}...")
#                 await client.post(f"{BRIDGE_URL}/send-alert", json={
#                     "id": payload.id, "number": payload.guardian_number, "message": message
#                 })
#                 await asyncio.sleep(1.0)

#             # Step B: Image Sending
#             if payload.image:
#                 logger.info(f"📸 Sending image packet to bridge for user {payload.id}...")
#                 await client.post(f"{BRIDGE_URL}/send-image", json={
#                     "id": payload.id,
#                     "number": payload.guardian_number,
#                     "image": payload.image,
#                     "caption": "📸 Emergency Snapshot"
#                 })

#             # Step C: Video Sending
#             if payload.video:
#                 logger.info(f"📹 Sending 5s video clip to bridge for user {payload.id}...")
#                 video_res = await client.post(f"{BRIDGE_URL}/send-video", json={
#                     "id": payload.id,
#                     "number": payload.guardian_number,
#                     "video": payload.video,
#                     "caption": "📹 5-Second Video Feed"
#                 })
#                 logger.info(f"✅ Bridge Video Response: {video_res.status_code}")

#             return {"success": True, "status": "Packet processed"}

#         except Exception as e:
#             logger.error(f"💥 SOS PIPELINE CRASHED: {e}")
#             return {"success": False, "error": str(e)}

# # --- 3. SERVER START ---
# if __name__ == "__main__":
#     import uvicorn
#     logger.info("🚀 Starting SafeDrive AI FastAPI Server...")
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)




import base64
import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import httpx
import logging
from pydantic import BaseModel
from typing import Optional
from detector import process_frame

# --- SETUP LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SafeDrive-Backend")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class SOSPayload(BaseModel):
    id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    guardian_number: Optional[str] = "923270707947" # Fallback if missing
    driver_name: Optional[str] = "Driver"          # Fallback if missing
    image: Optional[str] = None
    video: Optional[str] = None
    is_follow_up: bool = False

# --- 1. AI VIDEO WEBSOCKET ---
@app.websocket("/ws/video")
async def video_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("✅ UI Connected to Video WebSocket")
    try:
        while True:
            data = await websocket.receive_text()
            header, encoded = data.split(",", 1)
            img_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None: continue
            ai_data = await asyncio.to_thread(process_frame, frame)
            await websocket.send_text(json.dumps(ai_data))
    except Exception as e:
        logger.error(f"🔥 Socket Error: {e}")

# --- 2. WHATSAPP SOS ENDPOINT ---
@app.post("/api/sos/whatsapp")
async def trigger_whatsapp_sos(payload: SOSPayload):
    # Log what arrived to see the 422 cause
    logger.info(f"🚨 SOS Signal Received | Mode ID: {payload.id}")
    
    BRIDGE_URL = "http://localhost:3001"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            if not payload.is_follow_up:
                lat, lng = payload.latitude, payload.longitude
                source = "Browser GPS"
                if lat is None:
                    try:
                        ip_res = await client.get("http://ip-api.com/json/", timeout=5.0)
                        ip_data = ip_res.json()
                        lat, lng, source = ip_data.get("lat"), ip_data.get("lon"), "Network IP"
                    except: pass
                
                maps_link = f"https://www.google.com/maps?q={lat},{lng}" if lat else "Unavailable"
                message = f"🚨 *SAFE-DRIVE AI EMERGENCY* 🚨\n\nDriver: *{payload.driver_name}*\nStatus: *CRITICAL*\n📍 Location ({source}): {maps_link}"
                
                logger.info(f"📤 Sending alert from {payload.id} to {payload.guardian_number}")
                await client.post(f"{BRIDGE_URL}/send-alert", json={"id": payload.id, "number": payload.guardian_number, "message": message})
                await asyncio.sleep(1.0)

            if payload.image:
                await client.post(f"{BRIDGE_URL}/send-image", json={"id": payload.id, "number": payload.guardian_number, "image": payload.image, "caption": "📸 Emergency Snapshot"})

            if payload.video:
                await client.post(f"{BRIDGE_URL}/send-video", json={"id": payload.id, "number": payload.guardian_number, "video": payload.video, "caption": "📹 5-Second Video Feed"})

            return {"success": True}
        except Exception as e:
            logger.error(f"💥 SOS FAIL: {e}")
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
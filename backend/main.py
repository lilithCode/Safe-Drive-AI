# import base64
# import cv2 
# import numpy as np
# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# import json

# # for making whatsapp location tool
# import httpx
# from pydantic import BaseModel

# from typing import Optional # Import this at the top
# # LOGIV FOR LOCATION AT END 


# from detector import process_frame

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], # Allows all origins for dev
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.websocket("/ws/video") # WebSocket endpoint
# async def video_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     print("Frontend connected to WebSocket.")
    
#     try:
#         while True:
#             # Receive Base64 image from React
#             data = await websocket.receive_text()
            
#             # The frontend sends a Data URL (like "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...")
#             # we need to split the header and the actual Base64 data
#             header, encoded = data.split(",", 1)
            
#             # Decode the image from Base64 to bytes, then to a NumPy array, and finally to an OpenCV image
#             img_bytes = base64.b64decode(encoded) # converts to raw binary image data like b'\xff\xd8\xff\xe0\x00\x10JFIF...'
#             np_arr = np.frombuffer(img_bytes, np.uint8)  # gives 8bit int to represent the image data as a NumPy array like array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, ...], dtype=uint8)
#             frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR) # converts to real image matrix , like output (H, W, 3 channels) array of pixel values 
            
#             if frame is None:
#                 continue

#             # Process AI Features on detector.py and get results
#             ai_data = process_frame(frame)
            
#             # Send AI Response back to React
#             await websocket.send_text(json.dumps(ai_data)) #json.dumps converts the dictionary to JSON
            
#     except WebSocketDisconnect:
#         print("Frontend disconnected.")
#     except Exception as e:
#         print(f"Error processing frame: {e}")

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) #runs the fastapi on port 8000



#     # WHATSAPP LOCATION LOGIC 
#     # 1. Define the data we expect from the Frontend
# class SOSPayload(BaseModel):
#     latitude: Optional[float] = None  # Allow it to be None
#     longitude: Optional[float] = None # Allow it to be None
#     guardian_number: str
#     driver_name: str


# @app.post("/api/sos/whatsapp")
# async def trigger_whatsapp_sos(payload: SOSPayload):
#     lat = payload.latitude
#     lng = payload.longitude
#     loc_source = "Browser GPS"

#     # If Browser GPS failed, use Backend IP-Geolocation
#     if lat is None or lng is None:
#         try:
#             async with httpx.AsyncClient() as client:
#                 # This API finds the location based on the incoming request IP
#                 ip_res = await client.get("http://ip-api.com/json/")
#                 ip_data = ip_res.json()
#                 if ip_data["status"] == "success":
#                     lat = ip_data["lat"]
#                     lng = ip_data["lon"]
#                     loc_source = "Network IP (Approximate)"
#         except Exception as e:
#             print(f"IP Geolocation failed: {e}")

#     # Build the message
#     if lat and lng:
#         maps_link = f"https://www.google.com/maps?q={lat},{lng}"
#         location_status = f"📍 Location ({loc_source}):\n{maps_link}"
#     else:
#         location_status = "📍 Location: *Unavailable (Sensor & Network Error)*"
    
#     message = (
#         f"🚨 *SAFE-DRIVE AI EMERGENCY* 🚨\n\n"
#         f"Driver: *{payload.driver_name}*\n"
#         f"Status: *CRITICAL ALERT*\n"
#         f"{location_status}\n\n"
#         f"Please check on the driver immediately."
#     )

#     async with httpx.AsyncClient() as client:
#         response = await client.post("http://localhost:3001/send-alert", json={
#             "number": payload.guardian_number,
#             "message": message
#         })
#         return response.json()



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

app = FastAPI()

# --- CORS SETTINGS (CLEANED) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class SOSPayload(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    guardian_number: str
    driver_name: str

# --- AI VIDEO WEBSOCKET ---
@app.websocket("/ws/video")
async def video_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected to WebSocket.")
    try:
        while True:
            data = await websocket.receive_text()
            header, encoded = data.split(",", 1)
            img_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            if frame is None:
                continue

            ai_data = process_frame(frame)
            await websocket.send_text(json.dumps(ai_data))
            
    except WebSocketDisconnect:
        print("Frontend disconnected.")
    except Exception as e:
        print(f"Error processing frame: {e}")

# --- WHATSAPP SOS ENDPOINT ---
@app.post("/api/sos/whatsapp")
async def trigger_whatsapp_sos(payload: SOSPayload):
    lat = payload.latitude
    lng = payload.longitude
    loc_source = "Browser GPS"

    # Fallback to IP Geolocation if Browser GPS fails
    if lat is None or lng is None:
        try:
            async with httpx.AsyncClient() as client:
                ip_res = await client.get("http://ip-api.com/json/", timeout=5.0)
                ip_data = ip_res.json()
                if ip_data.get("status") == "success":
                    lat = ip_data["lat"]
                    lng = ip_data["lon"]
                    loc_source = "Network IP (Approximate)"
        except Exception as e:
            print(f"IP Geolocation failed: {e}")

    if lat and lng:
        maps_link = f"https://www.google.com/maps?q={lat},{lng}"
        location_status = f"📍 Location ({loc_source}):\n{maps_link}"
    else:
        location_status = "📍 Location: *Unavailable (Sensor & Network Error)*"
    
    message = (
        f"🚨 *SAFE-DRIVE AI EMERGENCY* 🚨\n\n"
        f"Driver: *{payload.driver_name}*\n"
        f"Status: *CRITICAL ALERT*\n"
        f"{location_status}\n\n"
        f"Please check on the driver immediately."
    )

    # Talk to the Node.js WhatsApp Bridge
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post("http://localhost:3001/send-alert", json={
                "number": payload.guardian_number,
                "message": message
            })
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
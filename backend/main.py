import base64
import cv2 
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json

from detector import process_frame

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/video") # WebSocket endpoint
async def video_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected to WebSocket.")
    
    try:
        while True:
            # Receive Base64 image from React
            data = await websocket.receive_text()
            
            # The frontend sends a Data URL (like "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...")
            # we need to split the header and the actual Base64 data
            header, encoded = data.split(",", 1)
            
            # Decode the image from Base64 to bytes, then to a NumPy array, and finally to an OpenCV image
            img_bytes = base64.b64decode(encoded) # converts to raw binary image data like b'\xff\xd8\xff\xe0\x00\x10JFIF...'
            np_arr = np.frombuffer(img_bytes, np.uint8)  # gives 8bit int to represent the image data as a NumPy array like array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, ...], dtype=uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR) # converts to real image matrix , like output (H, W, 3 channels) array of pixel values 
            
            if frame is None:
                continue

            # Process AI Features on detector.py and get results
            ai_data = process_frame(frame)
            
            # Send AI Response back to React
            await websocket.send_text(json.dumps(ai_data)) #json.dumps converts the dictionary to JSON
            
    except WebSocketDisconnect:
        print("Frontend disconnected.")
    except Exception as e:
        print(f"Error processing frame: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) #runs the fastapi on port 8000
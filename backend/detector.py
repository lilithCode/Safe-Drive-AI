import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
import math
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Initialize YOLOv8 for Object Detection (Auto-downloads yolov8n.pt on first run)
yolo_model = YOLO("yolov8n.pt")

# Specific Landmark Indices from MediaPipe FaceMesh
RIGHT_EYE = [33, 160, 158, 133, 153, 144]
LEFT_EYE = [362, 385, 387, 263, 373, 380]
INNER_LIP_TOP = 13
INNER_LIP_BOTTOM = 14
INNER_LIP_LEFT = 78
INNER_LIP_RIGHT = 308
NOSE_TIP = 1
FACE_LEFT_EDGE = 234
FACE_RIGHT_EDGE = 454

def calculate_distance(p1, p2):
    return math.dist(p1, p2)

# EAR = Eye Aspect Ratio, when awaken usually around 0.3-0.4, when drowsy below 0.22
def calculate_ear(eye_landmarks, all_landmarks, w, h):
    # Map indices to pixel coordinates
    pts = [(all_landmarks[i].x * w, all_landmarks[i].y * h) for i in eye_landmarks]
    # Vertical distances
    v1 = calculate_distance(pts[1], pts[5])
    v2 = calculate_distance(pts[2], pts[4])
    # Horizontal distance
    h_dist = calculate_distance(pts[0], pts[3])
    return (v1 + v2) / (2.0 * h_dist + 1e-6)

# MAR = Mouth Aspect Ratio, when yawning usually around 0.5-0.6, when not yawning below 0.3
def calculate_mar(all_landmarks, w, h):
    top = (all_landmarks[INNER_LIP_TOP].x * w, all_landmarks[INNER_LIP_TOP].y * h)
    bottom = (all_landmarks[INNER_LIP_BOTTOM].x * w, all_landmarks[INNER_LIP_BOTTOM].y * h)
    left = (all_landmarks[INNER_LIP_LEFT].x * w, all_landmarks[INNER_LIP_LEFT].y * h)
    right = (all_landmarks[INNER_LIP_RIGHT].x * w, all_landmarks[INNER_LIP_RIGHT].y * h)
    
    vertical = calculate_distance(top, bottom)
    horizontal = calculate_distance(left, right)
    return vertical / (horizontal + 1e-6)

# Check if head is turned away by comparing nose position to left and right edges of the face.
# A ratio close to 1 means facing forward, while a highly skewed ratio indicates a turned head.
def check_head_pose(all_landmarks, w, h):
    nose = (all_landmarks[NOSE_TIP].x * w, all_landmarks[NOSE_TIP].y * h)
    left_edge = (all_landmarks[FACE_LEFT_EDGE].x * w, all_landmarks[FACE_LEFT_EDGE].y * h)
    right_edge = (all_landmarks[FACE_RIGHT_EDGE].x * w, all_landmarks[FACE_RIGHT_EDGE].y * h)
    
    dist_left = calculate_distance(nose, left_edge)
    dist_right = calculate_distance(nose, right_edge)
    
    ratio = dist_left / (dist_right + 1e-6)
    return ratio < 0.4 or ratio > 2.5

def process_frame(frame: np.ndarray):
    h, w, _ = frame.shape
    
    response = {
        "face_detected": False,
        "drowsy": False,
        "yawning": False,
        "head_distracted": False,
        "phone_detected": False,
        "objects": [],
        "ear": 0.0,
        "mar": 0.0,
        "landmarks": []
    }
    
    # Convert BGR to RGB for MediaPipe processing as MediaPipe expects RGB input and OpenCV uses BGR by default
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)
    
    if results.multi_face_landmarks:
        response["face_detected"] = True
        landmarks = results.multi_face_landmarks[0].landmark
        
        # save all landmarks as pixel coordinates for drawing a mesh later in React
        response["landmarks"] = [[lm.x, lm.y] for lm in landmarks]
        
        # Calculate EAR
        left_ear = calculate_ear(LEFT_EYE, landmarks, w, h)
        right_ear = calculate_ear(RIGHT_EYE, landmarks, w, h)
        avg_ear = (left_ear + right_ear) / 2.0
        response["ear"] = avg_ear
        if avg_ear < 0.22: # Threshold for closed eyes
            response["drowsy"] = True
            
        # Calculate MAR
        mar = calculate_mar(landmarks, w, h)
        response["mar"] = mar
        if mar > 0.4: # Threshold for yawning
            response["yawning"] = True
            
        # Calculate Head Pose
        response["head_distracted"] = check_head_pose(landmarks, w, h)

    # YOLOv8 Processing (Objects / Phones)
    # Class 67 in COCO dataset is 'cell phone'
    yolo_results = yolo_model(frame, verbose=False)[0]
    
    for box in yolo_results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        label = yolo_model.names[cls_id]
        
        # Extract Bounding Box
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        
        if conf > 0.45: # If the AI is 45% sure
            response["objects"].append({
                "label": label,
                "confidence": conf,
                "box": [int(x1), int(y1), int(x2), int(y2)]
            })
            
            if label == "cell phone":
                response["phone_detected"] = True
                
    return response
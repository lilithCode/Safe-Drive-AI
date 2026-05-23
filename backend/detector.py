import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
import math

# --- INITIALIZATION ---
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Load your custom fine-tuned model
yolo_model = YOLO("best.pt")

# --- CONFIGURATION & THRESHOLDS ---
EAR_THRESHOLD = 0.22          # Lower = stricter (eyes must be more closed)
MAR_THRESHOLD = 0.50          
DROWSY_CONSEC_FRAMES = 6      # FIX: Increased to 6 frames to ignore blinks completely
YAWN_CONSEC_FRAMES = 5        
YOLO_SKIP_FRAMES = 5          # Run YOLO every 5 frames to save CPU/GPU

# --- STATE TRACKING ---
frame_counter = 0
closed_eyes_frames = 0
yawning_frames = 0
last_yolo_distracted = False
last_yolo_objects = []

# MediaPipe Landmark Indices
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

def calculate_ear(eye_landmarks, all_landmarks, w, h):
    pts = [(all_landmarks[i].x * w, all_landmarks[i].y * h) for i in eye_landmarks]
    v1 = calculate_distance(pts[1], pts[5])
    v2 = calculate_distance(pts[2], pts[4])
    h_dist = calculate_distance(pts[0], pts[3])
    return (v1 + v2) / (2.0 * h_dist + 1e-6)

def calculate_mar(all_landmarks, w, h):
    top = (all_landmarks[INNER_LIP_TOP].x * w, all_landmarks[INNER_LIP_TOP].y * h)
    bottom = (all_landmarks[INNER_LIP_BOTTOM].x * w, all_landmarks[INNER_LIP_BOTTOM].y * h)
    left = (all_landmarks[INNER_LIP_LEFT].x * w, all_landmarks[INNER_LIP_LEFT].y * h)
    right = (all_landmarks[INNER_LIP_RIGHT].x * w, all_landmarks[INNER_LIP_RIGHT].y * h)
    return calculate_distance(top, bottom) / (calculate_distance(left, right) + 1e-6)

def check_head_pose(all_landmarks, w, h):
    nose = (all_landmarks[NOSE_TIP].x * w, all_landmarks[NOSE_TIP].y * h)
    left_edge = (all_landmarks[FACE_LEFT_EDGE].x * w, all_landmarks[FACE_LEFT_EDGE].y * h)
    right_edge = (all_landmarks[FACE_RIGHT_EDGE].x * w, all_landmarks[FACE_RIGHT_EDGE].y * h)
    ratio = calculate_distance(nose, left_edge) / (calculate_distance(nose, right_edge) + 1e-6)
    return ratio < 0.45 or ratio > 2.2 # True if looking away

def process_frame(frame: np.ndarray):
    global frame_counter, last_yolo_distracted, last_yolo_objects
    global closed_eyes_frames, yawning_frames
    
    h, w, _ = frame.shape
    frame_counter += 1

    response = {
        "face_detected": False,
        "drowsy": False,
        "yawning": False,
        "head_distracted": False,
        "phone_detected": last_yolo_distracted,
        "objects": last_yolo_objects,
        "ear": 0.0,
        "mar": 0.0,
        "landmarks": []
    }

    # --- 1. MEDIAPIPE FACE ANALYSIS ---
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    if results.multi_face_landmarks:
        response["face_detected"] = True
        landmarks = results.multi_face_landmarks[0].landmark
        response["landmarks"] = [[lm.x, lm.y] for lm in landmarks]

        # EAR Calculation
        left_ear = calculate_ear(LEFT_EYE, landmarks, w, h)
        right_ear = calculate_ear(RIGHT_EYE, landmarks, w, h)
        avg_ear = (left_ear + right_ear) / 2.0
        response["ear"] = avg_ear
        
        # Blink vs Drowsy Persistence Logic
        if avg_ear < EAR_THRESHOLD:
            closed_eyes_frames += 1
        else:
            closed_eyes_frames = 0 # Reset on blink finish
            
        if closed_eyes_frames >= DROWSY_CONSEC_FRAMES:
            response["drowsy"] = True

        # Yawning Logic
        mar = calculate_mar(landmarks, w, h)
        response["mar"] = mar
        if mar > MAR_THRESHOLD:
            yawning_frames += 1
        else:
            yawning_frames = 0
        if yawning_frames >= YAWN_CONSEC_FRAMES:
            response["yawning"] = True

        # Head Orientation
        response["head_distracted"] = check_head_pose(landmarks, w, h)

    # --- 2. YOLO PHONE DETECTION (Optimized) ---
    if frame_counter % YOLO_SKIP_FRAMES == 0:
        # Resize for speed
        small_frame = cv2.resize(frame, (320, 320))
        yolo_results = yolo_model(small_frame, verbose=False)[0]
        
        current_objects = []
        is_phone_now = False

        for box in yolo_results.boxes:
            conf = float(box.conf[0])
            if conf > 0.40:
                cls_id = int(box.cls[0])
                label = yolo_model.names[cls_id].lower()
                
                # Rescale boxes back to original size
                coords = box.xyxy[0].tolist()
                x1, y1, x2, y2 = [int(c * (w/320 if i%2==0 else h/320)) for i, c in enumerate(coords)]
                
                current_objects.append({
                    "label": label,
                    "confidence": conf,
                    "box": [x1, y1, x2, y2]
                })

                # Check specifically for 'phone' class from your Kaggle dataset
                if "phone" in label:
                    is_phone_now = True

        last_yolo_distracted = is_phone_now
        last_yolo_objects = current_objects

    response["phone_detected"] = last_yolo_distracted
    response["objects"] = last_yolo_objects

    return response
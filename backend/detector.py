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

yolo_model = YOLO("yolov8n.pt")

frame_counter = 0
YOLO_SKIP_FRAMES = 10  # Only run YOLO every 10 frames
last_yolo_result = False
last_yolo_objects = []

# --- LANDMARK INDICES ---
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
    
    vertical = calculate_distance(top, bottom)
    horizontal = calculate_distance(left, right)
    return vertical / (horizontal + 1e-6)

def check_head_pose(all_landmarks, w, h):
    nose = (all_landmarks[NOSE_TIP].x * w, all_landmarks[NOSE_TIP].y * h)
    left_edge = (all_landmarks[FACE_LEFT_EDGE].x * w, all_landmarks[FACE_LEFT_EDGE].y * h)
    right_edge = (all_landmarks[FACE_RIGHT_EDGE].x * w, all_landmarks[FACE_RIGHT_EDGE].y * h)
    
    dist_left = calculate_distance(nose, left_edge)
    dist_right = calculate_distance(nose, right_edge)
    
    ratio = dist_left / (dist_right + 1e-6)
    return ratio < 0.4 or ratio > 2.5

def calculate_safety_score(drowsy, yawning, head_distracted, phone_detected):
    score = 100
    if drowsy: score -= 30
    if phone_detected: score -= 25
    if head_distracted: score -= 20
    if yawning: score -= 10
    
    return max(0, score) #  between 0 and 100

def process_frame(frame: np.ndarray):
    global frame_counter, last_yolo_result, last_yolo_objects
    
    h, w, _ = frame.shape
    frame_counter += 1

    response = {
        "face_detected": False,
        "drowsy": False,
        "yawning": False,
        "head_distracted": False,
        "phone_detected": last_yolo_result,
        "objects": last_yolo_objects,
        "ear": 0.0,
        "mar": 0.0,
        "landmarks": [],
        "safety_score": 100
    }

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    if results.multi_face_landmarks:
        response["face_detected"] = True
        landmarks = results.multi_face_landmarks[0].landmark
        response["landmarks"] = [[lm.x, lm.y] for lm in landmarks]

        # EAR 
        left_ear = calculate_ear(LEFT_EYE, landmarks, w, h)
        right_ear = calculate_ear(RIGHT_EYE, landmarks, w, h)
        avg_ear = (left_ear + right_ear) / 2.0
        response["ear"] = avg_ear
        if avg_ear < 0.23:
            response["drowsy"] = True

        # MAR 
        mar = calculate_mar(landmarks, w, h)
        response["mar"] = mar
        if mar > 0.75:
            response["yawning"] = True

        # Head Pose
        response["head_distracted"] = check_head_pose(landmarks, w, h)

    if frame_counter % YOLO_SKIP_FRAMES == 0:
        small_frame = cv2.resize(frame, (320, 320))
        yolo_results = yolo_model(small_frame, verbose=False)[0]
        
        current_phone_detected = False
        current_objects = []

        for box in yolo_results.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = yolo_model.names[cls_id]

            if conf > 0.45:
                scale_x = w / 320
                scale_y = h / 320
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                current_objects.append({
                    "label": label,
                    "confidence": conf,
                    "box": [int(x1 * scale_x), int(y1 * scale_y), int(x2 * scale_x), int(y2 * scale_y)]
                })

                if label == "cell phone":
                    current_phone_detected = True

        # Update last results
        last_yolo_result = current_phone_detected
        last_yolo_objects = current_objects
    
    response["phone_detected"] = last_yolo_result
    response["objects"] = last_yolo_objects

    # SAFETY SCORE
    response["safety_score"] = calculate_safety_score(
        response["drowsy"], 
        response["yawning"], 
        response["head_distracted"], 
        response["phone_detected"]
    )

    return response
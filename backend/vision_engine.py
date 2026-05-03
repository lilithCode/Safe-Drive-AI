import cv2
import mediapipe as mp
import numpy as np
import math
from ultralytics import YOLO

class FacialAnalyzer:
    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.yolo_model = YOLO('yolov8n.pt')
        
        self.RIGHT_EYE = [33, 160, 158, 133, 153, 144]
        self.LEFT_EYE = [362, 385, 387, 263, 373, 380]
        self.MOUTH = [78, 81, 13, 311, 308, 402, 14, 178]
        self.TARGET_CLASSES = [67, 39]  # 67: phone, 39: bottle

    def euclidean_distance(self, p1, p2):
        return math.dist(p1, p2)

    def calculate_ear(self, landmarks, eye_indices):
        p2_p6 = self.euclidean_distance(landmarks[eye_indices[1]], landmarks[eye_indices[5]])
        p3_p5 = self.euclidean_distance(landmarks[eye_indices[2]], landmarks[eye_indices[4]])
        p1_p4 = self.euclidean_distance(landmarks[eye_indices[0]], landmarks[eye_indices[3]])
        return (p2_p6 + p3_p5) / (2.0 * p1_p4)

    def calculate_mar(self, landmarks):
        p2_p8 = self.euclidean_distance(landmarks[self.MOUTH[1]], landmarks[self.MOUTH[7]])
        p3_p7 = self.euclidean_distance(landmarks[self.MOUTH[2]], landmarks[self.MOUTH[6]])
        p4_p6 = self.euclidean_distance(landmarks[self.MOUTH[3]], landmarks[self.MOUTH[5]])
        p1_p5 = self.euclidean_distance(landmarks[self.MOUTH[0]], landmarks[self.MOUTH[4]])
        return (p2_p8 + p3_p7 + p4_p6) / (2.0 * p1_p5)

    def get_head_pose(self, coords, w, h):
        image_points = np.array([
            coords[1],    # Nose tip
            coords[152],  # Chin
            coords[226],  # Left eye left corner
            coords[446],  # Right eye right corner
            coords[57],   # Left mouth corner
            coords[287]   # Right mouth corner
        ], dtype="double")

        model_points = np.array([
            (0.0, 0.0, 0.0),
            (0.0, -330.0, -65.0),
            (-225.0, 170.0, -135.0),
            (225.0, 170.0, -135.0),
            (-150.0, -150.0, -125.0),
            (150.0, -150.0, -125.0)
        ])

        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype="double")
        dist_coeffs = np.zeros((4, 1))

        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs
        )

        if not success:
            return False

        rmat, _ = cv2.Rodrigues(rotation_vector)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)
        pitch, yaw, roll = angles[0], angles[1], angles[2]

        return yaw < -15 or yaw > 15 or pitch < -15 or pitch > 15

    def analyze_frame(self, frame):
        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        data = {
            "face_detected": False, "drowsy": False, "yawning": False, "head_distracted": False,
            "phone_detected": False, "objects": [], "ear": 0.0, "mar": 0.0, "landmarks": []
        }

        # 1. FACIAL ANALYSIS
        results = self.face_mesh.process(rgb_frame)
        if results.multi_face_landmarks:
            data["face_detected"] = True
            for face_landmarks in results.multi_face_landmarks:
                coords = [(int(pt.x * w), int(pt.y * h)) for pt in face_landmarks.landmark]
                
                avg_ear = (self.calculate_ear(coords, self.LEFT_EYE) + self.calculate_ear(coords, self.RIGHT_EYE)) / 2.0
                mar = self.calculate_mar(coords)
                head_distracted = self.get_head_pose(coords, w, h)
                
                data["ear"] = round(avg_ear, 2)
                data["mar"] = round(mar, 2)
                data["drowsy"] = avg_ear < 0.25
                data["yawning"] = mar > 0.75 # Increased so talking doesn't trigger it
                data["head_distracted"] = head_distracted
                
                # Send a subset of landmarks to draw the face grid on frontend
                # (Sending all 468 points is too heavy, we send every 4th point for a cool grid effect)
                data["landmarks"] = coords[::4]

        # 2. OBJECT DETECTION
        yolo_results = self.yolo_model(frame, verbose=False)
        for r in yolo_results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                if cls_id in self.TARGET_CLASSES:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    conf = float(box.conf[0])
                    
                    label = "Phone" if cls_id == 67 else "Bottle"
                    if cls_id == 67: data["phone_detected"] = True
                    
                    data["objects"].append({
                        "label": label, "confidence": round(conf, 2),
                        "box": [x1, y1, x2, y2]
                    })

        return data
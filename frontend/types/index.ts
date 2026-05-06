export interface AIResponse {
  face_detected: boolean;
  drowsy: boolean;
  yawning: boolean;
  head_distracted: boolean;
  phone_detected: boolean;
  objects: Array<{
    label: string;
    confidence: number;
    box: [number, number, number, number];
  }>;
  ear: number;
  mar: number;
  landmarks: Array<[number, number]>;
}

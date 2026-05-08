import React, { useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { AIResponse } from "../types";

interface Props {
  webcamRef: React.RefObject<Webcam>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  aiData: AIResponse | null;
  isEmergency: boolean;
  alertsToday: number;
  driveTime: number;
  safetyScore: number;
}

// geometric connections for the mesh look
const FACE_CONNECTIONS = [
  // Forehead & Center Vertical
  [10, 168],
  [168, 1],
  [1, 0],
  [0, 17],
  [17, 152],
  // Face Oval (Left)
  [10, 67],
  [67, 234],
  [234, 132],
  [132, 152],
  // Face Oval (Right)
  [10, 297],
  [297, 454],
  [454, 361],
  [361, 152],
  // Eyes (Triangulated)
  [33, 133],
  [133, 168],
  [33, 168],
  [362, 263],
  [362, 168],
  [263, 168],
  // Nose/Cheek Geometry
  [1, 33],
  [1, 263], // Nose to Outer Eyes
  [1, 234],
  [1, 454], // Nose to Outer Cheeks
  [0, 234],
  [0, 454], // Mouth to Outer Cheeks
  [17, 132],
  [17, 361], // Chin/Mouth to Jaw
  // Brow/Forehead Geometry
  [10, 33],
  [10, 263], // Forehead to Outer eyes
  [67, 33],
  [297, 263], // Forehead sides to Outer eyes
  // Extra cross-connections for denser mesh
  [67, 168],
  [297, 168],
  [234, 33],
  [454, 263],
  [132, 17],
  [361, 17],
  [234, 0],
  [454, 0],
  [67, 10],
  [297, 10],
  [132, 133],
  [361, 362],
  [234, 168],
  [454, 168],
];

export default function VideoFeed({
  webcamRef,
  canvasRef,
  aiData,
  isEmergency,
  alertsToday,
  driveTime,
  safetyScore,
}: Props) {
  // Store latest aiData in a ref so the animation loop always reads fresh values
  const aiDataRef = useRef<AIResponse | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    aiDataRef.current = aiData;
  }, [aiData]);

  // Single animation loop — runs continuously so the mesh is always animated
  useEffect(() => {
    let running = true;

    const draw = () => {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(draw);

      const canvas = canvasRef.current;
      const video = webcamRef.current?.video;
      const data = aiDataRef.current;

      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // DRAW FACE GRID MESH
      if (
        data &&
        data.face_detected &&
        data.landmarks &&
        data.landmarks.length > 0
      ) {
        // Determine dynamic color based on driver status
        const isDanger = data.drowsy || data.phone_detected;
        const isWarning = data.head_distracted || data.yawning;

        // Animation time drivers
        const now = Date.now();
        const pulse = Math.sin(now / 400) * 0.5 + 0.5; // 0..1 slow pulse
        const fastPulse = Math.sin(now / 180) * 0.5 + 0.5; // 0..1 fast pulse
        const scanY = (now / 12) % canvas.height; // Scanline Y position

        // Base colors
        let r = 16,
          g = 185,
          b = 129; // Safe: Emerald Green
        if (isDanger) {
          r = 239;
          g = 68;
          b = 68;
        } // Danger: Red
        else if (isWarning) {
          r = 234;
          g = 179;
          b = 8;
        } // Warning: Yellow

        const alpha = 0.55 + pulse * 0.3; // Breathing alpha 0.55→0.85
        const strokeColor = `rgba(${r},${g},${b},${alpha})`;
        const nodeColor = `rgb(${r},${g},${b})`;
        const glowColor = `rgba(${r},${g},${b},${0.15 + fastPulse * 0.2})`;

        // ── Draw connection lines with glow ──
        ctx.shadowBlur = 8 + pulse * 10; // Breathing glow radius
        ctx.shadowColor = nodeColor;
        ctx.lineWidth = 1 + pulse * 0.8;
        ctx.strokeStyle = strokeColor;

        FACE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const start = data.landmarks[startIdx];
          const end = data.landmarks[endIdx];
          if (start && end) {
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.stroke();
          }
        });

        // ── Draw scanline sweep across the mesh ──
        ctx.shadowBlur = 0;
        const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
        scanGrad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        scanGrad.addColorStop(0.5, `rgba(${r},${g},${b},0.18)`);
        scanGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 40, canvas.width, 80);

        // ── Draw nodes ──
        const uniqueNodes = Array.from(new Set(FACE_CONNECTIONS.flat()));

        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        uniqueNodes.forEach((idx) => {
          const pt = data.landmarks[idx];
          if (!pt) return;

          // Track boundaries
          if (pt[0] < minX) minX = pt[0];
          if (pt[1] < minY) minY = pt[1];
          if (pt[0] > maxX) maxX = pt[0];
          if (pt[1] > maxY) maxY = pt[1];

          // Glow halo behind each node
          ctx.shadowBlur = 10 + fastPulse * 8;
          ctx.shadowColor = nodeColor;
          ctx.fillStyle = glowColor;
          const haloR = 6 + fastPulse * 3;
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], haloR, 0, Math.PI * 2);
          ctx.fill();

          // Solid node (small square like the reference image)
          ctx.shadowBlur = 4;
          ctx.fillStyle = nodeColor;
          const nodeSize = 2 + fastPulse * 1.2;
          ctx.fillRect(
            pt[0] - nodeSize / 2,
            pt[1] - nodeSize / 2,
            nodeSize,
            nodeSize,
          );
        });

        ctx.shadowBlur = 0;

        // ── HUD bounding corners ──
        const cornerLength = 18;
        const pad = 22;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = nodeColor;
        ctx.shadowBlur = 12 + pulse * 10;
        ctx.shadowColor = nodeColor;

        // Top Left
        ctx.beginPath();
        ctx.moveTo(minX - pad, minY - pad + cornerLength);
        ctx.lineTo(minX - pad, minY - pad);
        ctx.lineTo(minX - pad + cornerLength, minY - pad);
        ctx.stroke();
        // Top Right
        ctx.beginPath();
        ctx.moveTo(maxX + pad - cornerLength, minY - pad);
        ctx.lineTo(maxX + pad, minY - pad);
        ctx.lineTo(maxX + pad, minY - pad + cornerLength);
        ctx.stroke();
        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(minX - pad, maxY + pad - cornerLength);
        ctx.lineTo(minX - pad, maxY + pad);
        ctx.lineTo(minX - pad + cornerLength, maxY + pad);
        ctx.stroke();
        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(maxX + pad - cornerLength, maxY + pad);
        ctx.lineTo(maxX + pad, maxY + pad);
        ctx.lineTo(maxX + pad, maxY + pad - cornerLength);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // HUD Label Text
        ctx.fillStyle = nodeColor;
        ctx.font = "bold 12px monospace";
        ctx.fillText(
          isDanger
            ? "DANGER_DETECTED"
            : isWarning
              ? "WARNING_STATE"
              : "TRACKING_ACTIVE",
          minX - pad,
          minY - pad - 8,
        );
      }

      // DRAW YOLO OBJECTS (PHONE)
      if (data) {
        data.objects?.forEach((obj) => {
          const [x1, y1, x2, y2] = obj.box;

          // Draw pulsing red box for phone distraction
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]); // Dashed line for objects
          ctx.beginPath();
          ctx.rect(x1, y1, x2 - x1, y2 - y1);
          ctx.stroke();
          ctx.setLineDash([]); // Reset

          ctx.fillStyle = "#ef4444";
          ctx.fillRect(x1, y1 - 28, ctx.measureText(obj.label).width + 30, 28);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 14px monospace";
          ctx.fillText(obj.label.toUpperCase(), x1 + 8, y1 - 8);
        });
      }
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [canvasRef, webcamRef]);

  return (
    <div className="bg-[#1e1e1e] rounded-2xl border border-zinc-800 p-4 shadow-xl">
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black mb-4">
        {isEmergency && (
          <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center text-white z-30">
            <h2 className="text-4xl font-bold mb-2 animate-pulse">
              SOS ACTIVE
            </h2>
            <p className="text-zinc-300">Emergency contacts notified.</p>
          </div>
        )}

        {/* Live Feed Status Overlay */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Live Mesh · 4 FPS
          </span>
        </div>

        {/* Real-time metrics overlay on video */}
        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
          <div className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg border border-zinc-700">
            <span className="text-xs text-zinc-400 block font-mono">
              EAR_INDEX
            </span>
            <span
              className={`font-mono text-sm ${aiData?.drowsy ? "text-red-400" : "text-green-400"}`}
            >
              {aiData?.ear?.toFixed(2) || "0.00"}
            </span>
          </div>
          <div className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg border border-zinc-700">
            <span className="text-xs text-zinc-400 block font-mono">
              MAR_INDEX
            </span>
            <span
              className={`font-mono text-sm ${aiData?.yawning ? "text-yellow-400" : "text-blue-400"}`}
            >
              {aiData?.mar?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>

        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user", width: 1280, height: 720 }}
          className="absolute w-full h-full object-cover opacity-80" // Slightly dimmed so the mesh pops out!
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full object-cover z-10"
        />
      </div>

      {/* Quick Stats Row underneath video */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Safety score"
          value={`${Math.round(safetyScore)}%`}
          color={
            safetyScore > 80
              ? "text-green-500"
              : safetyScore > 50
                ? "text-yellow-500"
                : "text-red-500"
          }
        />
        <StatCard
          title="EAR value"
          value={aiData?.ear?.toFixed(2) || "0.00"}
          color="text-zinc-200"
        />
        <StatCard
          title="Alerts today"
          value={alertsToday}
          color={alertsToday > 0 ? "text-red-400" : "text-zinc-200"}
        />
        <StatCard
          title="Drive time"
          value={`${driveTime} min`}
          color="text-blue-400"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
      <div className={`text-2xl font-semibold mb-1 ${color}`}>{value}</div>
      <div className="text-xs text-zinc-500 font-medium">{title}</div>
    </div>
  );
}

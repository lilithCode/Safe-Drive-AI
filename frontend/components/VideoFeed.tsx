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

export default function VideoFeed({
  webcamRef,
  canvasRef,
  aiData,
  isEmergency,
  alertsToday,
  driveTime,
  safetyScore,
}: Props) {
  const aiDataRef = useRef<AIResponse | null>(null);
  const animFrameRef = useRef<number>(0);
  const currentLandmarksRef = useRef<Array<[number, number]> | null>(null);

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

      if (!canvas || !video || !video.videoWidth) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (
        data &&
        data.face_detected &&
        data.landmarks &&
        data.landmarks.length > 0
      ) {
        // INTERPOLATION: Smooth gliding
        if (
          !currentLandmarksRef.current ||
          currentLandmarksRef.current.length !== data.landmarks.length
        ) {
          currentLandmarksRef.current = data.landmarks.map((pt) => [...pt]);
        } else {
          const ease = 0.5;
          for (let i = 0; i < data.landmarks.length; i++) {
            currentLandmarksRef.current[i][0] +=
              (data.landmarks[i][0] - currentLandmarksRef.current[i][0]) * ease;
            currentLandmarksRef.current[i][1] +=
              (data.landmarks[i][1] - currentLandmarksRef.current[i][1]) * ease;
          }
        }

        const interpolatedLandmarks = currentLandmarksRef.current;

        const isDanger = data.drowsy || data.phone_detected;
        const isWarning = data.head_distracted || data.yawning;

        const now = Date.now();
        const fastPulse = Math.sin(now / 180) * 0.5 + 0.5;
        const scanY = (now / 12) % canvas.height;

        let r = 16,
          g = 185,
          b = 129;
        if (isDanger) {
          r = 239;
          g = 68;
          b = 68;
        } else if (isWarning) {
          r = 234;
          g = 179;
          b = 8;
        }

        const nodeColor = `rgb(${r},${g},${b})`;

        // Scanline sweep
        ctx.shadowBlur = 0;
        const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
        scanGrad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        scanGrad.addColorStop(0.5, `rgba(${r},${g},${b},0.18)`);
        scanGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 40, canvas.width, 80);

        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        interpolatedLandmarks.forEach((pt) => {
          // Changed pt[0] mapping to fix the opposite side mesh glitch!
          // We directly map the X coordinate since react-webcam screenshot orientation matches it perfectly.
          const x = pt[0] * canvas.width;
          const y = pt[1] * canvas.height;

          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;

          ctx.shadowBlur = 4;
          ctx.shadowColor = nodeColor;
          ctx.fillStyle = nodeColor;
          const nodeSize = 2.0 + fastPulse * 1;
          ctx.fillRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize);
        });

        ctx.shadowBlur = 0;
        const pad = 22;
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
      } else {
        currentLandmarksRef.current = null;
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

        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Live Stream Sync
          </span>
        </div>

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
          className="absolute w-full h-full object-cover opacity-80"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full object-cover z-10"
        />
      </div>

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

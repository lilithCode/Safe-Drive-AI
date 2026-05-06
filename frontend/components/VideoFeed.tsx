// filepath: ./AI Projects/SafeDrive/frontend/components/VideoFeed.tsx
import React, { useEffect } from "react";
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
  useEffect(() => {
    if (!canvasRef.current || !webcamRef.current?.video || !aiData) return;
    const canvas = canvasRef.current;
    const video = webcamRef.current.video;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Professional Face Bounding Box (Instead of dots)
    if (
      aiData.face_detected &&
      aiData.landmarks &&
      aiData.landmarks.length > 0
    ) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      aiData.landmarks.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });

      // Add padding around the face
      minX -= 20;
      minY -= 40;
      maxX += 20;
      maxY += 20;

      // Draw Box
      ctx.strokeStyle = "#10b981"; // Emerald green
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(minX, minY, maxX - minX, maxY - minY, 12);
      ctx.stroke();

      // Draw Label Background
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.roundRect(minX, minY - 28, 120, 24, [8, 8, 0, 0]);
      ctx.fill();

      // Draw Label Text
      ctx.fillStyle = "#000000";
      ctx.font = "bold 13px Arial";
      ctx.fillText("Face detected", minX + 10, minY - 11);
    }

    // Draw YOLO Objects (Phone)
    aiData.objects?.forEach((obj) => {
      const [x1, y1, x2, y2] = obj.box;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x1, y1, x2 - x1, y2 - y1, 8);
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.fillRect(x1, y1 - 28, ctx.measureText(obj.label).width + 30, 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Arial";
      ctx.fillText(obj.label, x1 + 8, y1 - 8);
    });
  }, [aiData]);

  return (
    <div className="bg-[#1e1e1e] rounded-2xl border border-zinc-800 p-4">
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
            Live · 4 FPS
          </span>
        </div>

        {/* Real-time metrics overlay on video */}
        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
          <div className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg border border-zinc-700">
            <span className="text-xs text-zinc-400 block">EAR</span>
            <span
              className={`font-mono text-sm ${aiData?.drowsy ? "text-red-400" : "text-green-400"}`}
            >
              {aiData?.ear?.toFixed(2) || "0.00"}
            </span>
          </div>
          <div className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg border border-zinc-700">
            <span className="text-xs text-zinc-400 block">MAR</span>
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
          className="absolute w-full h-full object-cover"
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

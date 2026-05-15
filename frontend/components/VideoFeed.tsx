import React, { useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { AIResponse } from "../types";
import { Zap, Timer, AlertCircle, ShieldCheck } from "lucide-react";

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

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (data && data.face_detected && data.landmarks && data.landmarks.length > 0) {
        if (!currentLandmarksRef.current || currentLandmarksRef.current.length !== data.landmarks.length) {
          currentLandmarksRef.current = data.landmarks.map((pt) => [...pt]);
        } else {
          const ease = 0.4;
          for (let i = 0; i < data.landmarks.length; i++) {
            currentLandmarksRef.current[i][0] += (data.landmarks[i][0] - currentLandmarksRef.current[i][0]) * ease;
            currentLandmarksRef.current[i][1] += (data.landmarks[i][1] - currentLandmarksRef.current[i][1]) * ease;
          }
        }

        const interpolatedLandmarks = currentLandmarksRef.current;
        const isDanger = data.drowsy || data.phone_detected;
        const isWarning = data.head_distracted || data.yawning;

        // Theme colors for Canvas (Refined Palette)
        const amberAccent = "#E8B06F"; 
        const warmRed = "#D9534F";  
        const sageGreen = "#A3B18A"; 

        const now = Date.now();
        const fastPulse = Math.sin(now / 200) * 0.5 + 0.5;
        const scanY = (now / 15) % canvas.height;

        let activeColor = sageGreen;
        let labelText = "FOCUS_OPTIMAL";

        if (isDanger) {
          activeColor = warmRed;
          labelText = "CRITICAL_INTERVENTION";
        } else if (isWarning) {
          activeColor = amberAccent;
          labelText = "DISTRACTION_DETECTED";
        }

        // 1. Scanline Sweep
        const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
        scanGrad.addColorStop(0, `rgba(0,0,0,0)`);
        scanGrad.addColorStop(0.5, `${activeColor}33`); 
        scanGrad.addColorStop(1, `rgba(0,0,0,0)`);
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 60, canvas.width, 120);

        // 2. Draw Landmarks with Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = activeColor;
        ctx.fillStyle = activeColor;

        interpolatedLandmarks.forEach((pt) => {
          const x = pt[0] * canvas.width;
          const y = pt[1] * canvas.height;
          const nodeSize = 1.8 + fastPulse * 1.2;
          ctx.beginPath();
          ctx.arc(x, y, nodeSize / 2, 0, Math.PI * 2);
          ctx.fill();
        });

        // 3. Label HUD
        ctx.shadowBlur = 0;
        ctx.fillStyle = activeColor;
        ctx.font = "bold 10px monospace";
        ctx.fillText(`>> ${labelText}`, 20, 30);
      }
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [canvasRef, webcamRef]);

  return (
    <div className="bg-[#3D2B1F] rounded-2xl border border-[#4D392C] p-2 sm:p-4 shadow-2xl transition-all duration-500">
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black shadow-inner ring-1 ring-[#4D392C]">
        
        {/* Emergency Overlay */}
        {isEmergency && (
          <div className="absolute inset-0 bg-[#D9534F]/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-40 transition-all">
            <h2 className="text-3xl sm:text-5xl font-black tracking-[0.3em] animate-pulse">SOS ACTIVE</h2>
            <p className="text-[10px] font-bold tracking-widest mt-2 opacity-80 uppercase">Broadcasting GPS & Telemetry</p>
          </div>
        )}

        {/* HUD Top Left: Status */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-lg border border-white/10">
          <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${aiData?.face_detected ? 'bg-[#A3B18A] shadow-[#A3B18A]' : 'bg-[#D9534F] shadow-[#D9534F]'}`}></div>
          <span className="text-[9px] font-bold text-white/90 uppercase tracking-[0.2em]">
            {aiData?.face_detected ? "Visual Link: Active" : "Visual Link: Lost"}
          </span>
        </div>

        {/* HUD Bottom Left: Telemetry */}
        <div className="absolute bottom-4 left-4 z-30 flex gap-2">
          <div className="bg-black/40 backdrop-blur-xl px-3 py-2 rounded-lg border border-white/5 flex flex-col items-center min-w-[60px]">
            <span className="text-[8px] text-[#BFA899] font-bold uppercase tracking-tighter">EAR</span>
            <span className={`font-mono text-xs font-bold ${aiData?.drowsy ? "text-[#D9534F]" : "text-[#E8B06F]"}`}>
              {aiData?.ear?.toFixed(2) || "0.00"}
            </span>
          </div>
          <div className="bg-black/40 backdrop-blur-xl px-3 py-2 rounded-lg border border-white/5 flex flex-col items-center min-w-[60px]">
            <span className="text-[8px] text-[#BFA899] font-bold uppercase tracking-tighter">MAR</span>
            <span className={`font-mono text-xs font-bold ${aiData?.yawning ? "text-[#E8B06F]" : "text-[#BFA899]"}`}>
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
          className="absolute w-full h-full object-cover opacity-60 mix-blend-screen grayscale-[20%]"
        />
        
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover z-20" />
      </div>

      {/* Bottom Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <StatCard icon={<ShieldCheck size={14}/>} title="Safety Index" value={`${Math.round(safetyScore)}%`} accent={safetyScore < 50 ? "#D9534F" : "#E8B06F"} />
        <StatCard icon={<AlertCircle size={14}/>} title="Alerts Triggered" value={alertsToday} accent={alertsToday > 5 ? "#D9534F" : "#FFFFFF"} />
        <StatCard icon={<Timer size={14}/>} title="Session Time" value={`${driveTime}m`} />
        <StatCard icon={<Zap size={14}/>} title="AI Latency" value="32ms" accent="#A3B18A" />
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, accent }: any) {
  return (
    <div className="bg-[#2A1E16]/40 p-4 rounded-xl border border-[#4D392C] flex flex-col gap-1 hover:border-[#E8B06F]/30 transition-all group">
      <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
        <span className="text-[#E8B06F]">{icon}</span>
        <span className="text-[9px] font-bold text-[#BFA899] uppercase tracking-widest">{title}</span>
      </div>
      <div className="text-xl font-black tracking-tight" style={{ color: accent || "#FFFFFF" }}>
        {value}
      </div>
    </div>
  );
}
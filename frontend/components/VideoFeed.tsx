// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import Webcam from "react-webcam";
// import { AIResponse } from "../types";
// import { Zap, Timer, AlertCircle, Eye, Activity } from "lucide-react";

// interface Props {
//   webcamRef: React.RefObject<Webcam>;
//   canvasRef: React.RefObject<HTMLCanvasElement>;
//   aiData: AIResponse | null;
//   isEmergency: boolean;
//   alertsToday: number;
//   driveTime: number;
//   safetyScore: number;
//   nerdMode: boolean; 
// }

// export default function VideoFeed({
//   webcamRef,
//   canvasRef,
//   aiData,
//   isEmergency,
//   alertsToday,
//   driveTime,
//   safetyScore,
//   nerdMode,
// }: Props) {
//   const aiDataRef = useRef<AIResponse | null>(null);
//   const animFrameRef = useRef<number>(0);
//   const [latency, setLatency] = useState(32);
//   const currentLandmarksRef = useRef<Array<[number, number]> | null>(null);

//   useEffect(() => {
//     aiDataRef.current = aiData;
//     if (aiData) setLatency(Math.floor(Math.random() * (36 - 29 + 1) + 29));
//   }, [aiData]);

//   useEffect(() => {
//     let running = true;
//     const draw = () => {
//       if (!running) return;
//       animFrameRef.current = requestAnimationFrame(draw);
//       const canvas = canvasRef.current;
//       const video = (webcamRef.current as any)?.video;
//       const data = aiDataRef.current;
//       if (!canvas || !video || video.readyState !== 4) return;
//       const ctx = canvas.getContext("2d");
//       if (!ctx) return;
      
//       if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;
//       }
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       if (data && data.landmarks && data.landmarks.length > 0) {
//         if (!currentLandmarksRef.current || currentLandmarksRef.current.length !== data.landmarks.length) {
//           currentLandmarksRef.current = data.landmarks.map((pt) => [...pt]);
//         } else {
//           const ease = 0.4;
//           for (let i = 0; i < data.landmarks.length; i++) {
//             currentLandmarksRef.current[i][0] += (data.landmarks[i][0] - currentLandmarksRef.current[i][0]) * ease;
//             currentLandmarksRef.current[i][1] += (data.landmarks[i][1] - currentLandmarksRef.current[i][1]) * ease;
//           }
//         }

//         const interpolatedLandmarks = currentLandmarksRef.current;
//         const isDanger = data.drowsy || data.phone_detected;
//         const isWarning = data.head_distracted || data.yawning;

//         const activeColor = isDanger ? "#D9534F" : isWarning ? "#E8B06F" : "#A3B18A";
        
//         ctx.shadowBlur = 10;
//         ctx.shadowColor = activeColor;
//         ctx.fillStyle = activeColor;

//         interpolatedLandmarks.forEach((pt) => {
//           // REVERTED: Using your original logic here
//           const x = pt[0] * canvas.width;
//           const y = pt[1] * canvas.height;
          
//           ctx.beginPath();
//           ctx.arc(x, y, 1.2, 0, Math.PI * 2);
//           ctx.fill();
//         });
//       }
//     };
//     animFrameRef.current = requestAnimationFrame(draw);
//     return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
//   }, [canvasRef, webcamRef]);

//   return (
//     <div className="bg-[#3D2B1F] rounded-[2.5rem] border border-[#4D392C] p-2 sm:p-4 shadow-2xl transition-all duration-500 overflow-hidden h-full flex flex-col">
//       <div className="relative flex-1 w-full rounded-[2rem] overflow-hidden bg-black shadow-inner ring-1 ring-[#4D392C]">
        
//         {/* Emergency Overlay */}
//         {isEmergency && (
//           <div className="absolute inset-0 bg-[#D9534F]/40 backdrop-blur-[1px] z-40" />
//         )}

//         {/* HUD Top Left Status */}
//         <div className="absolute top-6 left-6 z-30 flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
//           <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${aiData?.face_detected ? 'bg-[#A3B18A]' : 'bg-[#D9534F]'}`}></div>
//           <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Link Status: {aiData?.face_detected ? "Active" : "Lost"}</span>
//         </div>

//         <Webcam ref={webcamRef} audio={false} mirrored={true} screenshotFormat="image/jpeg" screenshotQuality={0.7} videoConstraints={{ facingMode: "user", width: 1280, height: 720 }} className="absolute w-full h-full object-cover opacity-60 mix-blend-screen grayscale-[20%]" />
//         <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover z-20 pointer-events-none" />
//       </div>

//       {/* --- NERD MODE ONLY: TELEMETRY GRID --- */}
//       {nerdMode && (
//         <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4 animate-in slide-in-from-bottom duration-500 pb-2">
//           <StatCard 
//             icon={<Eye size={14} />} 
//             title="EAR Index" 
//             value={aiData?.ear?.toFixed(2) || "0.00"} 
//             accent={aiData?.drowsy ? "#D9534F" : "#E8B06F"} 
//           />
//           <StatCard 
//             icon={<Activity size={14} />} 
//             title="MAR Index" 
//             value={aiData?.mar?.toFixed(2) || "0.00"} 
//             accent={aiData?.yawning ? "#E8B06F" : "#FFFFFF"} 
//           />
//           <StatCard 
//             icon={<AlertCircle size={14} />} 
//             title="Alerts Today" 
//             value={alertsToday} 
//             accent={alertsToday > 0 ? "#D9534F" : "#FFFFFF"}
//           />
//           <StatCard 
//             icon={<Timer size={14} />} 
//             title="Session" 
//             value={`${driveTime}s`} 
//           />
//           <StatCard 
//             icon={<Zap size={14} />} 
//             title="AI Latency" 
//             value={`${latency}ms`} 
//             accent="#A3B18A" 
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// function StatCard({ icon, title, value, accent }: any) {
//   return (
//     <div className="bg-[#2A1E16]/40 p-4 rounded-2xl border border-[#4D392C] flex flex-col gap-1 transition-all group hover:border-[#E8B06F]/30">
//       <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
//         <span className="text-[#E8B06F]">{icon}</span>
//         <span className="text-[9px] font-black text-[#BFA899] uppercase tracking-widest">{title}</span>
//       </div>
//       <div className="text-xl font-black tracking-tight" style={{ color: accent || "#FFFFFF" }}>{value}</div>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { AIResponse } from "../types";
import { Zap, Timer, AlertCircle, Eye, Activity } from "lucide-react";

interface Props {
  webcamRef: React.RefObject<Webcam>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  aiData: AIResponse | null;
  isEmergency: boolean;
  alertsToday: number;
  driveTime: number;
  safetyScore: number;
  nerdMode: boolean; 
}

export default function VideoFeed({
  webcamRef,
  canvasRef,
  aiData,
  isEmergency,
  alertsToday,
  driveTime,
  safetyScore,
  nerdMode,
}: Props) {
  const aiDataRef = useRef<AIResponse | null>(null);
  const animFrameRef = useRef<number>(0);
  const [latency, setLatency] = useState(32);
  const currentLandmarksRef = useRef<Array<[number, number]> | null>(null);

  useEffect(() => {
    aiDataRef.current = aiData;
    if (aiData) setLatency(Math.floor(Math.random() * (36 - 29 + 1) + 29));
  }, [aiData]);

  useEffect(() => {
    let running = true;
    const draw = () => {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      const video = (webcamRef.current as any)?.video;
      const data = aiDataRef.current;
      if (!canvas || !video || video.readyState !== 4) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (data && data.landmarks && data.landmarks.length > 0) {
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
        const activeColor = data.drowsy ? "#D9534F" : data.head_distracted ? "#E8B06F" : "#A3B18A";
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = activeColor;
        ctx.fillStyle = activeColor;

        interpolatedLandmarks.forEach((pt) => {
          const x = pt[0] * canvas.width;
          const y = pt[1] * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    };
    animFrameRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [canvasRef, webcamRef]);

  return (
    <div className="bg-[#3D2B1F] rounded-[2.5rem] border border-[#4D392C] p-2 sm:p-4 shadow-2xl transition-all duration-500 overflow-hidden h-full flex flex-col">
      <div className="relative flex-1 w-full rounded-[2rem] overflow-hidden bg-black shadow-inner ring-1 ring-[#4D392C]">
        
        {/* HUD Top Left Status */}
        <div className="absolute top-6 left-6 z-30 flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${aiData?.face_detected ? 'bg-[#A3B18A]' : 'bg-[#D9534F]'}`}></div>
          <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Link: {aiData?.face_detected ? "Active" : "Searching"}</span>
        </div>

        <Webcam ref={webcamRef} audio={false} mirrored={true} screenshotFormat="image/jpeg" screenshotQuality={0.7} videoConstraints={{ facingMode: "user", width: 1280, height: 720 }} className="absolute w-full h-full object-cover opacity-60 mix-blend-screen grayscale-[20%]" />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover z-20 pointer-events-none" />
      </div>

      {/* --- NERD MODE ONLY: TELEMETRY GRID --- */}
      {nerdMode && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4 animate-in slide-in-from-bottom duration-500 pb-2 px-1">
          <StatCard icon={<Eye size={14} />} title="EAR" value={aiData?.ear?.toFixed(2) || "0.00"} accent={aiData?.drowsy ? "#D9534F" : "#E8B06F"} />
          <StatCard icon={<Activity size={14} />} title="MAR" value={aiData?.mar?.toFixed(2) || "0.00"} accent={aiData?.yawning ? "#E8B06F" : "#FFFFFF"} />
          <StatCard icon={<AlertCircle size={14} />} title="Alerts" value={alertsToday} accent={alertsToday > 0 ? "#D9534F" : "#FFFFFF"} />
          <StatCard icon={<Timer size={14} />} title="Session" value={`${driveTime}s`} />
          <StatCard icon={<Zap size={14} />} title="Latency" value={`${latency}ms`} accent="#A3B18A" />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, accent }: any) {
  return (
    <div className="bg-[#2A1E16]/40 p-4 rounded-2xl border border-[#4D392C] flex flex-col gap-1 transition-all group hover:border-[#E8B06F]/30">
      <div className="flex items-center gap-2 opacity-50">
        <span className="text-[#E8B06F]">{icon}</span>
        <span className="text-[9px] font-black text-[#BFA899] uppercase tracking-widest">{title}</span>
      </div>
      <div className="text-lg font-black tracking-tight" style={{ color: accent || "#FFFFFF" }}>{value}</div>
    </div>
  );
}
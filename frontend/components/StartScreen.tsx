

"use client";

import React, { useRef } from "react";
import { Car, Play, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface Props {
  appState: "IDLE" | "INITIALIZING" | "READY";
  onInitialize: () => void;
  onStart: () => void;
}

export default function StartScreen({ appState, onInitialize, onStart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.set(".gsap-item", { y: 30, opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out", duration: 1 },
      });

      tl.to(".gsap-item", { opacity: 1, y: 0, stagger: 0.12 });

      gsap.to(".floating-card", {
        y: -8,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".bg-glow", {
        scale: 1.08,
        opacity: 0.25,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: containerRef, dependencies: [appState] }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#F2E8D9] flex flex-col justify-center items-center text-[#3D2B1F] p-6 relative overflow-hidden font-sans" 
    >
      <div className="bg-glow absolute w-96 h-96 rounded-full bg-amber-200 opacity-10 blur-3xl" />

      {/* SYSTEM STATE STATUS AVATAR CARD */}
      <div className="gsap-item mb-10">
        <div className="floating-card w-28 h-28 sm:w-36 sm:h-36 bg-[#3D2B1F] rounded-3xl flex items-center justify-center shadow-2xl border border-[#4D392C]">
          {appState === "IDLE" && (
            <Car className="text-amber-300 w-14 h-14 sm:w-20 sm:h-20" strokeWidth={1.5} />
          )}
          {appState === "INITIALIZING" && (
            <Loader2 className="animate-spin text-amber-300 w-14 h-14 sm:w-20 sm:h-20" strokeWidth={1.5} />
          )}
          {appState === "READY" && (
            <CheckCircle2 className="text-green-300 w-14 h-14 sm:w-20 sm:h-20" strokeWidth={1.5} />
          )}
        </div>
      </div>

      <div className="text-center z-10">
        <h1 className="gsap-item text-5xl sm:text-7xl font-black tracking-tight uppercase mb-3">
          SafeDrive <span className="text-amber-500">AI</span>
        </h1>

        <div className="gsap-item flex items-center justify-center gap-3 mb-10">
          <span className="h-px w-10 bg-amber-300 opacity-40"></span>
          <p className="text-xs text-[#8C6A53] font-bold uppercase tracking-widest">
            Precision Neural Monitoring
          </p>
          <span className="h-px w-10 bg-amber-300 opacity-40"></span>
        </div>

        {/* IDLE MONITOR SCREEN ACTION BUTTON */}
        {appState === "IDLE" && (
          <div className="gsap-item flex flex-col items-center">
            <p className="text-sm sm:text-base text-[#8C6A53] mb-10 max-w-md leading-relaxed font-medium">
              Initialize the AI engine to activate real-time driver monitoring and computer vision assistance.
            </p>
            <button
              onClick={onInitialize}
              className="px-10 py-4 bg-[#3D2B1F] text-[#F2E8D9] rounded-full font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl"
            >
              <span className="text-amber-300">Initialize</span> AI Engine
            </button>
          </div>
        )}

        {/* CALIBRATION STATE SCREEN */}
        {appState === "INITIALIZING" && (
          <div className="gsap-item flex flex-col items-center">
            <p className="text-[#3D2B1F] mb-2 font-black tracking-wider text-xs uppercase">
              Booting Neural Networks
            </p>
            <p className="text-[#8C6A53] text-xs mb-8 uppercase tracking-wider font-bold">
              Calibrating sensors...
            </p>
            <div className="w-72 h-1 bg-[#8C6A53]/20 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 animate-pulse w-full"></div>
            </div>
          </div>
        )}

        {/* READY ACTION DEPLOYMENT ROW */}
        {appState === "READY" && (
          <div className="gsap-item flex flex-col items-center">
            <p className="text-green-700 mb-10 max-w-sm text-sm font-black uppercase tracking-wider leading-relaxed">
              System initialization complete.<br />All systems operational.
            </p>
            <button
              onClick={onStart}
              className="px-12 py-5 bg-green-300 text-[#3D2B1F] rounded-full font-black text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl"
            >
              <Play size={18} fill="currentColor" />
              Let's Drive
            </button>
          </div>
        )}
      </div>

      <div className="gsap-item absolute bottom-10 flex items-center gap-2 text-[#8C6A53] opacity-70">
        <ShieldCheck size={14} className="text-amber-500" />
        <span className="text-[10px] font-bold tracking-widest uppercase">
          Encrypted Session
        </span>
      </div>
    </div>
  );
}
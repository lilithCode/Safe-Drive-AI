"use client";

import React, { useEffect, useRef } from "react";
import { X, Sliders, Volume2, ShieldAlert, Monitor, Zap } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useGSAP(() => {
    if (isOpen) {
      gsap.to(panelRef.current, { x: 0, opacity: 1, duration: 0.8, ease: "back.out(1.2)" });
      gsap.to(backdropRef.current, { opacity: 1, duration: 0.5, pointerEvents: "auto" });
    } else {
      gsap.to(panelRef.current, { x: 50, opacity: 0, duration: 0.6, ease: "power4.in" });
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.5, pointerEvents: "none" });
    }
  }, [isOpen]);

  return (
    <>
      {/* Dimmed Backdrop */}
      <div 
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-[60] opacity-0 pointer-events-none transition-opacity duration-500"
      />

      {/* Floating Neomorphic Card */}
      <div 
        ref={panelRef}
        className="fixed top-6 right-6 bottom-6 w-full max-w-[420px] bg-[#F2E8D9] rounded-[2.5rem] z-[70] shadow-[-20px_-20px_60px_rgba(255,255,255,0.8),20px_20px_60px_rgba(61,43,31,0.2)] border border-[#FFFFFF]/60 translate-x-[110%] opacity-0 overflow-hidden flex flex-col"
      >
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#F2E8D9] rounded-xl flex items-center justify-center text-[#3D2B1F] shadow-[inset_-2px_-2px_5px_rgba(255,255,255,1),inset_2px_2px_5px_rgba(0,0,0,0.1)]">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-[#3D2B1F] font-black uppercase tracking-widest text-sm leading-none">Settings</h2>
              <p className="text-[10px] font-bold text-[#8E8884] uppercase tracking-tighter">System Calibration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#8E8884] bg-[#F2E8D9] shadow-[-4px_-4px_10px_rgba(255,255,255,1),4px_4px_10px_rgba(0,0,0,0.1)] hover:text-[#FF954F] transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content - Styled with Tailwind arbitrary values to fix chunk errors */}
        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-10 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3D2B1F20] [&::-webkit-scrollbar-thumb]:rounded-full">
          
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#3D2B1F]/60">
              <Zap size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Neural sensitivity</h3>
            </div>
            <div className="space-y-8">
              <SliderSetting label="Drowsiness EAR" value={0.25} min={0.1} max={0.4} />
              <SliderSetting label="Distraction Timeout" value={2.0} min={1.0} max={5.0} unit="s" />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#3D2B1F]/60">
              <Volume2 size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Audio Feedback</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <ToggleSetting label="Master Alarm" checked={true} />
              <ToggleSetting label="Voice AI Assistance" checked={true} />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#FF4D4D]">
              <ShieldAlert size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Emergency Protocol</h3>
            </div>
            <ToggleSetting label="Autonomous SOS Call" checked={false} danger />
          </section>

          <section className="space-y-6 pb-12">
            <div className="flex items-center gap-2 text-[#3D2B1F]/60">
              <Monitor size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Display Visuals</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ToggleSetting label="Face Mesh" checked={true} small />
              <ToggleSetting label="Telemetry" checked={true} small />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function SliderSetting({ label, value, min, max, unit = "" }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="text-[11px] font-black text-[#8E8884] uppercase tracking-widest">{label}</label>
        <span className="text-xs font-black text-[#3D2B1F] tabular-nums bg-[#F2E8D9] px-3 py-1 rounded-lg shadow-[inset_-2px_-2px_5px_rgba(255,255,255,1),inset_2px_2px_5px_rgba(0,0,0,0.05)]">
          {value}{unit}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-0 h-2 my-auto bg-[#F2E8D9] rounded-full shadow-[inset_-2px_-2px_4px_rgba(255,255,255,1),inset_2px_2px_4px_rgba(0,0,0,0.1)] border border-white/40" />
        <input 
          type="range" 
          min={min} 
          max={max} 
          step="0.01"
          className="relative w-full bg-transparent appearance-none cursor-pointer z-10 accent-[#FF954F]" 
        />
      </div>
    </div>
  );
}

function ToggleSetting({ label, checked, danger, small }: any) {
  return (
    <div className={`flex justify-between items-center bg-[#F2E8D9] rounded-2xl border border-white/60 shadow-[-5px_-5px_15px_rgba(255,255,255,0.8),5px_5px_15px_rgba(0,0,0,0.05)] ${small ? "p-3 flex-col gap-3 items-start" : "p-5"}`}>
      <span className={`font-black text-[#3D2B1F] uppercase tracking-tight ${small ? "text-[9px]" : "text-[11px]"}`}>{label}</span>
      <div className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all duration-300 ${checked ? (danger ? "bg-[#FF4D4D]" : "bg-[#FF954F]") : "bg-[#F2E8D9] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,1)]"}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 transform ${checked ? "translate-x-6 scale-110 shadow-lg" : "translate-x-0"}`} />
      </div>
    </div>
  );
}
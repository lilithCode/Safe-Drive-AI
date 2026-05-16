"use client";

import React, { useEffect, useRef } from "react";
import { X, Sliders, Volume2, ShieldAlert, Monitor, Zap, RefreshCcw } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResetConfig: () => void; // New Prop for resetting profile
}

export default function SettingsPanel({ isOpen, onClose, onResetConfig }: Props) {
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
      gsap.to(panelRef.current, { x: 0, opacity: 1, duration: 0.8, ease: "expo.out" });
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] opacity-0 pointer-events-none transition-opacity duration-500"
      />

      {/* Floating Calibration Card */}
      <div 
        ref={panelRef}
        className="fixed top-6 right-6 bottom-6 w-full max-w-[420px] bg-[#120D0A] rounded-[2.5rem] z-[70] shadow-2xl border border-[#2A2421] translate-x-[110%] opacity-0 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-[#2A2421]/50 bg-[#120D0A]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#FF954F]/10 rounded-xl flex items-center justify-center text-[#FF954F] border border-[#FF954F]/20">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-white font-black uppercase tracking-widest text-sm leading-none">Settings</h2>
              <p className="text-[10px] font-bold text-[#8E8884] uppercase tracking-tighter mt-1">System Calibration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#8E8884] hover:text-[#FF954F] hover:bg-white/5 transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">
          
          {/* Neural Sensitivity */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#FF954F]">
              <Zap size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Neural sensitivity</h3>
            </div>
            <div className="space-y-8">
              <SliderSetting label="Drowsiness EAR" value={0.25} min={0.1} max={0.4} />
              <SliderSetting label="Distraction Timeout" value={2.0} min={1.0} max={5.0} unit="s" />
            </div>
          </section>

          {/* Audio Feedback */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#FF954F]">
              <Volume2 size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Audio Feedback</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <ToggleSetting label="Master Alarm" checked={true} />
              <ToggleSetting label="Voice AI Assistance" checked={true} />
            </div>
          </section>

          {/* Emergency Protocol */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#FF4D4D]">
              <ShieldAlert size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Emergency Protocol</h3>
            </div>
            <div className="space-y-3">
                <ToggleSetting label="Autonomous SOS Call" checked={false} danger />
            </div>
          </section>

          {/* Display Visuals */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#FF954F]/60">
              <Monitor size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Display Visuals</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ToggleSetting label="Face Mesh" checked={true} small />
              <ToggleSetting label="Telemetry" checked={true} small />
            </div>
          </section>

          {/* DANGER ZONE: RESET */}
          <section className="space-y-6 pb-12">
            <div className="flex items-center gap-2 text-[#FF4D4D]">
              <RefreshCcw size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">System Reset</h3>
            </div>
            <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-tight leading-relaxed">
                    Warning: This will clear your name, phone number, and linked WhatsApp session.
                </p>
                <button 
                  onClick={() => {
                      if(window.confirm("ARE YOU SURE? This will restart the setup process.")) {
                          onResetConfig();
                      }
                  }}
                  className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-red-500/20"
                >
                  Clear System Profile
                </button>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2A2421; border-radius: 10px; }
      `}</style>
    </>
  );
}

function SliderSetting({ label, value, min, max, unit = "" }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-black text-[#8E8884] uppercase tracking-widest">{label}</label>
        <span className="text-xs font-black text-white tabular-nums bg-[#1C1714] px-3 py-1 rounded-lg border border-[#2A2421]">
          {value}{unit}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <input 
          type="range" 
          min={min} 
          max={max} 
          step="0.01"
          className="w-full h-1 bg-[#2A2421] appearance-none cursor-pointer accent-[#FF954F] rounded-full" 
        />
      </div>
    </div>
  );
}

function ToggleSetting({ label, checked, danger, small }: any) {
  return (
    <div className={`flex justify-between items-center bg-[#1C1714] rounded-2xl border border-[#2A2421] transition-all ${small ? "p-3 flex-col gap-3 items-start" : "p-5"}`}>
      <span className={`font-black text-white uppercase tracking-tight ${small ? "text-[9px]" : "text-[11px]"}`}>{label}</span>
      <div className={`w-11 h-6 rounded-full relative p-1 cursor-pointer transition-all duration-300 ${checked ? (danger ? "bg-[#FF4D4D]" : "bg-[#FF954F]") : "bg-[#2A2421]"}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </div>
  );
}
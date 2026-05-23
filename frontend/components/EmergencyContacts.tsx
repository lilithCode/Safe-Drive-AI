

"use client";

import React, { useRef } from "react";
import {
  MessageSquare,
  Siren,
  ShieldAlert,
} from "lucide-react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface GuardianItem {
  name: string;
  phone: string;
}

interface EmergencyContactsProps {
  isEmergency: boolean;
  onTriggerSOS: (targetPhone?: string) => void; // Updated to accept optional phone
  userConfig?: {
    senderMode?: string;
    driverName?: string;
    driverNumber?: string;
    guardians?: GuardianItem[];
    [key: string]: any;
  } | null;
}

export default function EmergencyContacts({
  isEmergency,
  onTriggerSOS,
  userConfig,
}: EmergencyContactsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const guardianList = userConfig?.guardians || [];

  // -----------------------------------
  // GSAP Animations
  // -----------------------------------
// -----------------------------------
  // GSAP Animations (Corrected)
  // -----------------------------------
  useGSAP(
    () => {
      // 1. Initial fade-in animation
      gsap.fromTo(
        ".emergency-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );

      // 2. Conditional Glow Animation
      if (isEmergency) {
        gsap.to(".sos-glow", {
          opacity: 0.4,
          backgroundColor: "#D9534F",
          duration: 1,
          repeat: -1,
          yoyo: true,
        });
      } else {
        // Kill the animation if not in emergency
        gsap.killTweensOf(".sos-glow");
        gsap.to(".sos-glow", {
          opacity: 0,
          backgroundColor: "transparent",
          duration: 0.5,
        });
      }
    },
    { scope: containerRef, dependencies: [isEmergency] }
  );
  return (
    <div
      ref={containerRef}
      className="emergency-card relative overflow-hidden rounded-[2.5rem] border border-[#4D392C] bg-[#3D2B1F] p-6 shadow-2xl flex flex-col h-full"
    >
      <div className="sos-glow absolute inset-0 bg-gradient-to-br from-[#E8B06F]/5 to-transparent pointer-events-none" />

      {/* PROTOCOL HEADER */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isEmergency ? 'bg-[#D9534F] animate-ping' : 'bg-[#E8B06F]'}`} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E8B06F]">
            Emergency Protocol
            </h3>
        </div>
        <ShieldAlert size={16} className="text-[#BFA899] opacity-40" />
      </div>

      {/* MASSIVE SOS ACTION TRIGGER (Broadcast to all/primary) */}
      <button
        onClick={() => onTriggerSOS()}
        disabled={isEmergency}
        className={`relative overflow-hidden w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-3 z-10 ${
          isEmergency 
            ? "bg-[#D9534F] text-white animate-pulse" 
            : "bg-[#E8B06F] text-[#3D2B1F] hover:shadow-[#E8B06F]/20"
        }`}
      >
        <Siren className={isEmergency ? "animate-spin" : ""} size={20} strokeWidth={3} />
        {isEmergency ? "SOS PROTOCOL ACTIVE" : "INITIATE GLOBAL SOS"}
      </button>

      {/* PRIORITY TARGETS */}
      <div className="mt-8 relative z-10 flex-1 flex flex-col min-h-0">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#BFA899] mb-4 font-black opacity-60 px-1">
          Direct Intervention Targets
        </p>

        <div className="space-y-3 overflow-y-auto pr-1 side-contacts-scrollbar flex-1">
          {guardianList.length === 0 ? (
            <div className="p-6 border border-dashed border-[#4D392C] rounded-3xl text-center opacity-40">
                <p className="text-[10px] font-black uppercase text-[#BFA899]">No Guardians Registered</p>
            </div>
          ) : (
            guardianList.map((guardian, i) => {
              const initials = (guardian.name || "G").charAt(0).toUpperCase();
              
              return (
                <button
                  key={i}
                  onClick={() => onTriggerSOS(guardian.phone)} // Immediate targeted SOS
                  className="group w-full rounded-2xl border border-[#4D392C] bg-[#2A1E16]/40 p-4 transition-all duration-300 hover:border-[#E8B06F]/40 hover:bg-[#2A1E16] active:scale-95 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border shrink-0 bg-[#3D2B1F] text-[#E8B06F] border-[#4D392C] group-hover:bg-[#E8B06F] group-hover:text-[#3D2B1F] transition-all">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-white group-hover:text-[#E8B06F] transition-colors truncate uppercase">
                        {guardian.name}
                      </span>
                      <span className="text-[9px] font-bold tracking-widest text-[#BFA899] opacity-50 mt-0.5">
                        {guardian.phone}
                      </span>
                    </div>
                  </div>
                  <div className="text-[#BFA899] group-hover:text-[#E8B06F] transition-all">
                    <MessageSquare size={16} strokeWidth={2.5} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        .side-contacts-scrollbar::-webkit-scrollbar { width: 4px; }
        .side-contacts-scrollbar::-webkit-scrollbar-thumb { background: #4D392C; border-radius: 10px; }
        .side-contacts-scrollbar::-webkit-scrollbar-thumb:hover { background: #E8B06F; }
      `}</style>
    </div>
  );
}
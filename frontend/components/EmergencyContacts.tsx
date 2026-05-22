

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Siren,
  ShieldAlert,
  X,
  MessageSquareCode,
} from "lucide-react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface GuardianItem {
  name: string;
  phone: string;
}

interface EmergencyContactsProps {
  isEmergency: boolean;
  onTriggerSOS: () => void;
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

  // Extract live custom tracking matrix array
  const guardianList = userConfig?.guardians || [];

  const [pendingText, setPendingText] = useState<{
    name: string;
    phone: string;
  } | null>(null);

  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // -----------------------------------
  // GSAP Animations
  // -----------------------------------
  useGSAP(
    () => {
      gsap.fromTo(
        ".emergency-card",
        { opacity: 0, y: 40, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out" }
      );

      gsap.to(".sos-glow", {
        scale: 1.08,
        opacity: 0.6,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".floating-icon", {
        y: -4,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: containerRef, dependencies: [guardianList.length] }
  );

  // -----------------------------------
  // Countdown Timer Engine
  // -----------------------------------
  useEffect(() => {
    if (pendingText && countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (pendingText && countdown === 0) {
      executeTextDispatch();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pendingText, countdown]);

  const initiateTextDispatch = (name: string, phone: string) => {
    if (!phone || phone.trim() === "" || phone === "No Number Set") {
      alert("This contact does not contain a valid phone number setup.");
      return;
    }
    setCountdown(5);
    setPendingText({ name, phone });
  };

  const cancelTextDispatch = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPendingText(null);
    setCountdown(5);
  };

  const executeTextDispatch = () => {
    alert(`Dispatched Critical SOS Text Alert to ${pendingText?.name} at ${pendingText?.phone}`);
    setPendingText(null);
  };

  return (
    <div
      ref={containerRef}
      className="emergency-card relative overflow-hidden rounded-3xl border border-[#4D392C] bg-[#3D2B1F] p-5 sm:p-6 shadow-2xl"
    >
      <div className="sos-glow absolute inset-0 bg-gradient-to-br from-[#E8B06F]/10 to-transparent pointer-events-none" />

      {/* -------------------------------- */}
      {/* FULL-WINDOW TEXT HOT OVERLAY */}
      {/* -------------------------------- */}
      {pendingText && (
        <div className="absolute inset-0 z-50 bg-[#2B1D14]/98 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
          <div className="floating-icon w-20 h-20 rounded-full bg-[#E8B06F]/10 border border-[#E8B06F]/20 flex items-center justify-center mb-4">
            <MessageSquareCode className="text-[#E8B06F]" size={34} />
          </div>

          <p className="text-[#BFA899] text-[10px] uppercase tracking-widest mb-1 font-bold">
            Queueing Text Transmission
          </p>

          <h2 className="text-white text-2xl font-black mb-6 text-center tracking-tight px-2">
            {pendingText.name}
          </h2>

          <div className="relative flex items-center justify-center mb-8">
            <span className="text-6xl font-black text-[#E8B06F] tabular-nums select-none">
              {countdown}
            </span>

            <svg className="absolute w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="#E8B06F"
                strokeWidth="5"
                fill="none"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * (5 - countdown)) / 5}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
          </div>

          <div className="w-full flex flex-col gap-3 max-w-sm">
            <button
              onClick={executeTextDispatch}
              className="w-full py-4 rounded-2xl bg-[#E8B06F] text-[#3D2B1F] font-black uppercase tracking-wider text-sm transition-all duration-200 active:scale-95 shadow-lg"
            >
              Bypass Countdown (Send Now)
            </button>

            <button
              onClick={cancelTextDispatch}
              className="w-full py-4 rounded-2xl bg-[#D9534F] text-white font-black uppercase tracking-wider text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-md"
            >
              <X size={18} strokeWidth={3} />
              Cancel Transmission Protocol
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------- */}
      {/* PROTOCOL HEADER */}
      {/* -------------------------------- */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-[#E8B06F]">
          Emergency Protocol
        </h3>
        <ShieldAlert size={16} className="text-[#BFA899] opacity-60" />
      </div>

      {/* -------------------------------- */}
      {/* MASSIVE SOS ACTION TRIGGER */}
      {/* -------------------------------- */}
      <button
        onClick={onTriggerSOS}
        disabled={isEmergency}
        className={`relative overflow-hidden w-full py-4.5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 ${
          isEmergency ? "bg-[#D9534F] text-white animate-pulse border border-red-600" : "bg-[#E8B06F] text-[#3D2B1F]"
        }`}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        <Siren className={isEmergency ? "animate-spin" : ""} size={18} strokeWidth={2.5} />
        {isEmergency ? "PROTOCOL IS ACTIVE" : "INITIATE CRITICAL SOS"}
      </button>

      {/* -------------------------------- */}
      {/* PRIORITY BLIND-TAP INTERVENTIONS */}
      {/* -------------------------------- */}
      <div className="mt-5 relative z-10">
        <p className="text-[9px] uppercase tracking-[0.15em] text-[#BFA899] mb-3 font-bold opacity-80">
          Priority Instant Message Targets
        </p>

        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 side-contacts-scrollbar">
          {guardianList.length === 0 ? (
            <Contact
              name="Primary Guardian"
              phone="No Number Set"
              init="G"
              onText={() => initiateTextDispatch("Primary Guardian", "No Number Set")}
            />
          ) : (
            guardianList.map((guardian, i) => {
              const fallBackName = guardian.name || `Guardian #${i + 1}`;
              const initials = fallBackName.trim().charAt(0).toUpperCase() || "G";
              
              return (
                <Contact
                  key={i}
                  name={fallBackName}
                  phone={guardian.phone || "No Number Set"}
                  init={initials}
                  onText={() => initiateTextDispatch(fallBackName, guardian.phone)}
                />
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        .side-contacts-scrollbar::-webkit-scrollbar { width: 3px; }
        .side-contacts-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .side-contacts-scrollbar::-webkit-scrollbar-thumb { background: #4D392C; border-radius: 10px; }
        .side-contacts-scrollbar::-webkit-scrollbar-thumb:hover { background: #E8B06F; }
      `}</style>
    </div>
  );
}

// Sub-component entry block
function Contact({ name, phone, init, onText }: any) {
  return (
    <button
      onClick={onText}
      className="group w-full rounded-2xl border border-[#4D392C] bg-[#2B1D14] p-4 transition-all duration-300 hover:border-[#E8B06F]/50 hover:bg-[#322217] active:scale-[0.97] text-left flex items-center justify-between"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-black border shrink-0 bg-[#3D2B1F] text-[#F2E8D9] border-[#5A4636]">
          {init}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-black text-white group-hover:text-[#E8B06F] transition-colors duration-200 truncate">
            {name}
          </span>
          <span className="text-[10px] font-mono tracking-wider text-[#BFA899] opacity-60 mt-0.5">
            {phone}
          </span>
        </div>
      </div>
      <div className="text-[#BFA899] shrink-0 ml-2 group-hover:text-[#E8B06F] group-hover:scale-110 transition-all duration-300 p-1">
        <MessageSquare size={16} strokeWidth={2.5} />
      </div>
    </button>
  );
}
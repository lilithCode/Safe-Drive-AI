"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  Siren,
  ShieldAlert,
  X,
  PhoneCall,
} from "lucide-react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function EmergencyContacts({
  isEmergency,
  onTriggerSOS,
}: any) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [pendingCall, setPendingCall] = useState<{
    name: string;
    phone: string;
  } | null>(null);

  const [countdown, setCountdown] = useState(5);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // -----------------------------------
  // GSAP
  // -----------------------------------
  useGSAP(
    () => {
      gsap.fromTo(
        ".emergency-card",
        {
          opacity: 0,
          y: 40,
          scale: 0.96,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
        }
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
    { scope: containerRef }
  );

  // -----------------------------------
  // COUNTDOWN
  // -----------------------------------
  useEffect(() => {
    if (pendingCall && countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (pendingCall && countdown === 0) {
      executeCall();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pendingCall, countdown]);

  const initiateCall = (
    name: string,
    phone: string
  ) => {
    setCountdown(5);
    setPendingCall({ name, phone });
  };

  const cancelCall = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setPendingCall(null);
    setCountdown(5);
  };

  const executeCall = () => {
    alert(
      `Calling ${pendingCall?.name} at ${pendingCall?.phone}`
    );

    setPendingCall(null);
  };


  

  return (
    <div
      ref={containerRef}
      className="
        emergency-card
        relative
        overflow-hidden
        rounded-3xl
        border
        border-[#4D392C]
        bg-[#3D2B1F]
        p-6
        shadow-2xl
      "
    >
      {/* Ambient Glow */}
      <div className="sos-glow absolute inset-0 bg-gradient-to-br from-[#E8B06F]/10 to-transparent pointer-events-none" />

      {/* -------------------------------- */}
      {/* CALL MODAL */}
      {/* -------------------------------- */}
      {pendingCall && (
        <div className="absolute inset-0 z-50 bg-[#2B1D14]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">

          {/* Icon */}
          <div className="floating-icon w-20 h-20 rounded-full bg-[#E8B06F]/10 border border-[#E8B06F]/20 flex items-center justify-center mb-5">
            <PhoneCall
              className="text-[#E8B06F]"
              size={34}
            />
          </div>

          <p className="text-[#BFA899] text-xs uppercase tracking-widest mb-2 font-bold">
            Initiating Call
          </p>

          <h2 className="text-white text-2xl font-black mb-8 text-center tracking-tight">
            {pendingCall.name}
          </h2>

          {/* Countdown */}
          <div className="relative flex items-center justify-center mb-8">
            <span className="text-6xl font-black text-[#E8B06F] tabular-nums">
              {countdown}
            </span>

            <svg className="absolute w-24 h-24 -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="4"
                fill="none"
              />

              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="#E8B06F"
                strokeWidth="4"
                fill="none"
                strokeDasharray="264"
                strokeDashoffset={
                  264 -
                  (264 * (5 - countdown)) / 5
                }
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
          </div>

          {/* Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={executeCall}
              className="
                w-full
                py-4
                rounded-2xl
                bg-[#E8B06F]
                text-[#3D2B1F]
                font-black
                uppercase
                tracking-wider
                transition-all
                duration-300
                hover:scale-[1.02]
                active:scale-95
              "
            >
              Call Now
            </button>

            <button
              onClick={cancelCall}
              className="
                w-full
                py-4
                rounded-2xl
                border
                border-white/10
                text-white
                font-black
                uppercase
                tracking-wider
                transition-all
                duration-300
                hover:bg-white/5
                hover:scale-[1.02]
                active:scale-95
                flex
                items-center
                justify-center
                gap-2
              "
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------- */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#E8B06F]">
          Emergency Protocol
        </h3>

        <ShieldAlert
          size={15}
          className="text-[#BFA899] opacity-50"
        />
      </div>

      {/* -------------------------------- */}
      {/* SOS BUTTON */}
      {/* -------------------------------- */}
      <button
        onClick={onTriggerSOS}
        disabled={isEmergency}
        className="
          relative
          overflow-hidden
          w-full
          py-4
          rounded-2xl
          bg-[#E8B06F]
          text-[#3D2B1F]
          font-black
          uppercase
          tracking-wider
          transition-all
          duration-500
          hover:scale-[1.02]
          active:scale-95
          shadow-xl
        "
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />

        <span className="relative z-10 flex items-center justify-center gap-3">
          <Siren
            className={
              isEmergency
                ? "animate-spin"
                : ""
            }
            size={20}
            strokeWidth={2.5}
          />

          {isEmergency
            ? "PROTOCOL ACTIVE"
            : "INITIATE SOS"}
        </span>
      </button>

      {/* -------------------------------- */}
      {/* CONTACTS */}
      {/* -------------------------------- */}
      <div className="mt-8 relative z-10">
        <p className="text-[10px] uppercase tracking-widest text-[#BFA899] mb-4 font-bold opacity-70">
          Priority Contacts
        </p>

        <div className="space-y-3">

          <Contact
            name="Ahmed (Brother)"
            phone="123-456-7890"
            init="A"
            onCall={() =>
              initiateCall(
                "Ahmed (Brother)",
                "123-456-7890"
              )
            }
          />

          <Contact
            name="Emergency Services"
            phone="911"
            init="911"
            alert
            onCall={() =>
              initiateCall(
                "Emergency Services",
                "911"
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

// -----------------------------------
// CONTACT CARD
// -----------------------------------
function Contact({
  name,
  phone,
  init,
  alert,
  onCall,
}: any) {
  return (
    <button
      onClick={onCall}
      className="
        group
        w-full
        rounded-2xl
        border
        border-[#4D392C]
        bg-[#2B1D14]
        p-4
        transition-all
        duration-500
        hover:scale-[1.02]
        hover:border-[#E8B06F]/40
        hover:bg-[#352419]
        active:scale-[0.98]
        text-left
      "
    >
      <div className="flex items-center justify-between">

        {/* Left */}
        <div className="flex items-center gap-4">

          {/* Avatar */}
          <div
            className={`
              w-11
              h-11
              rounded-xl
              flex
              items-center
              justify-center
              text-xs
              font-black
              border
              transition-all
              duration-500

              ${
                alert
                  ? "bg-red-500/10 text-red-400 border-red-400/20"
                  : "bg-[#3D2B1F] text-[#F2E8D9] border-[#5A4636]"
              }
            `}
          >
            {init}
          </div>

          {/* Text */}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white group-hover:text-[#E8B06F] transition-colors duration-300">
              {name}
            </span>

            <span className="text-[10px] uppercase tracking-widest text-[#BFA899] opacity-60">
              {phone}
            </span>
          </div>
        </div>

        {/* Icon */}
        <div className="text-[#BFA899] transition-all duration-500 group-hover:text-[#E8B06F] group-hover:scale-110">
          <Phone
            size={15}
            strokeWidth={2.5}
          />
        </div>
      </div>
    </button>
  );
}
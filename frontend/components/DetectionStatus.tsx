import React from "react";
import { AIResponse } from "../types";

/**
 * PALETTE MAPPING:
 * Card: #3D2B1F (Dark Chocolate)
 * Border: #4D392C (Deep Brown)
 * Background Inner: #2A1E16 (Darker Tone)
 * Accent/Warning: #E8B06F (Amber)
 * Text Secondary: #BFA899 (Taupe)
 * Success: #A3B18A (Sage)
 * Alert: #D9534F (Warm Red)
 */

export default function DetectionStatus({
  aiData,
}: {
  aiData: AIResponse | null;
}) {
  return (
    <div className="bg-[#3D2B1F] p-5 sm:p-6 rounded-2xl border border-[#4D392C] shadow-xl transition-all duration-300">
      <h3 className="text-[10px] sm:text-xs font-bold text-[#E8B06F] uppercase tracking-[0.2em] mb-5">
        Detection Status
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatusBox
          title="Eyes"
          isBad={aiData?.drowsy}
          badText="Closed"
          goodText="Open"
        />
        <StatusBox
          title="Head pose"
          isBad={aiData?.head_distracted}
          badText="Away"
          goodText="Forward"
          warning={!aiData?.face_detected}
          warnText="Not Found"
        />
        <StatusBox
          title="Phone"
          isBad={aiData?.phone_detected}
          badText="Detected"
          goodText="None"
        />
        <StatusBox
          title="Fatigue"
          isBad={aiData?.yawning}
          badText="Yawning"
          goodText="Normal"
          warning={aiData && aiData.mar && aiData.mar > 0.35 && !aiData.yawning}
          warnText="Talking"
        />
      </div>
    </div>
  );
}

function StatusBox({
  title,
  isBad,
  goodText,
  badText,
  warning,
  warnText,
}: any) {
  // Logic for color states using the "Chocolate & Cream" palette
  let dotColor = "bg-[#A3B18A]"; // Sage Green
  let textColor = "text-[#A3B18A]";
  let borderColor = "border-[#4D392C]";
  let text = goodText;
  let isPulsing = false;

  if (isBad) {
    dotColor = "bg-[#D9534F]"; // Warm Red
    textColor = "text-[#D9534F]";
    borderColor = "border-[#D9534F]/30";
    text = badText;
    isPulsing = true;
  } else if (warning) {
    dotColor = "bg-[#E8B06F]"; // Amber
    textColor = "text-[#E8B06F]";
    borderColor = "border-[#E8B06F]/30";
    text = warnText;
  }

  return (
    <div
      className={`bg-[#2A1E16]/60 p-3 sm:p-4 rounded-xl border transition-all duration-500 hover:scale-[1.02] ${borderColor}`}
    >
      <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#BFA899] mb-2">
        {title}
      </div>
      
      <div className="flex items-center gap-2.5">
        {/* Status Indicator Dot */}
        <div className="relative flex items-center justify-center w-2 h-2">
          {isPulsing && (
            <div
              className={`absolute w-4 h-4 rounded-full opacity-30 animate-ping ${dotColor}`}
            ></div>
          )}
          <div className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shadow-lg ${dotColor}`}></div>
        </div>

        {/* Status Label */}
        <span className={`text-xs sm:text-sm font-bold tracking-tight truncate ${textColor}`}>
          {text}
        </span>
      </div>
    </div>
  );
}
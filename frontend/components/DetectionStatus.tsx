"use client";

import React from "react";
import { AIResponse } from "../types";

interface DetectionStatusProps {
  aiData: AIResponse | null;
  nerdMode: boolean; // Controls 2x2 Sidebar vs 1x4 HUD Bar
}

export default function DetectionStatus({ aiData, nerdMode }: DetectionStatusProps) {
  return (
    <div 
      className={`bg-[var(--card)] border border-[var(--border)] shadow-2xl transition-all duration-500 ease-in-out ${
        nerdMode 
          ? "p-6 rounded-[2.5rem] flex flex-col gap-4 h-full" 
          : "p-3 sm:p-4 rounded-3xl h-fit w-full"
      }`}
    >
      {nerdMode && (
        <h3 className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.3em] mb-2 animate-in fade-in slide-in-from-top-1 duration-700">
          Neural Sensor Array
        </h3>
      )}

      {/* 
          HUD Mode (nerdMode=false): Horizontal 4-column layout
          Nerd Mode (nerdMode=true): Compact 2x2 grid for sidebar
      */}
      <div 
        className={`grid transition-all duration-500 ${
          nerdMode 
            ? "grid-cols-2 gap-3" 
            : "grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3"
        }`}
      >
        <StatusBox
          title="Eyes"
          isBad={aiData?.drowsy}
          badText="Closed"
          goodText="Open"
          nerdMode={nerdMode}
        />
        <StatusBox
          title="Focus"
          isBad={aiData?.head_distracted}
          badText="Away"
          goodText="Locked"
          warning={!aiData?.face_detected}
          warnText="Lost"
          nerdMode={nerdMode}
        />
        <StatusBox
          title="Mobile"
          isBad={aiData?.phone_detected}
          badText="Detected"
          goodText="None"
          nerdMode={nerdMode}
        />
        <StatusBox
          title="Fatigue"
          isBad={aiData?.yawning}
          badText="Yawning"
          goodText="Normal"
          warning={aiData && aiData.mar && aiData.mar > 0.35 && !aiData.yawning}
          warnText="Talking"
          nerdMode={nerdMode}
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
  nerdMode,
}: any) {
  // Use Global CSS Variables for Status Colors
  let color = "var(--success)"; // Sage Green
  let text = goodText;
  let isPulsing = false;

  if (isBad) {
    color = "var(--alert)"; // Warm Red
    text = badText;
    isPulsing = true;
  } else if (warning) {
    color = "var(--accent)"; // Orange/Amber
    text = warnText;
  }

  return (
    <div
      className={`bg-[var(--background)]/1 rounded-2xl border transition-all duration-500 overflow-hidden flex flex-col justify-center border-[var(--border)] ${
        nerdMode 
          ? "p-4 sm:p-5 hover:bg-[var(--background)]/60 hover:border-[var(--accent)]/30" 
          : "p-2 sm:p-3 items-center text-center"
      }`}
    >
      {/* Sensor Title */}
      <div className={`font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1.5 ${
        nerdMode ? "text-[10px]" : "text-[8px]"
      }`}>
        {title}
      </div>
      
      {/* Status Data Row */}
      <div className={`flex items-center gap-2 ${!nerdMode && "justify-center"}`}>
        <div className="relative flex items-center justify-center w-2 h-2 flex-shrink-0">
          {isPulsing && (
            <div
              className="absolute w-4 h-4 rounded-full opacity-40 animate-ping"
              style={{ backgroundColor: color }}
            ></div>
          )}
          <div 
            className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shadow-lg transition-colors duration-500" 
            style={{ backgroundColor: color }}
          ></div>
        </div>

        <span className={`font-bold tracking-tight truncate transition-colors duration-300 ${
          nerdMode ? "text-xs" : "text-[11px]"
        }`} style={{ color: color }}>
          {text}
        </span>
      </div>
    </div>
  );
}
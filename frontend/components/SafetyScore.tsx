"use client";

import React from "react";

interface SafetyScoreProps {
  score: number;
  nerdMode: boolean;
}

export default function SafetyScore({ score, nerdMode }: SafetyScoreProps) {
  const roundedScore = Math.round(score);

  const getStatusColor = () => {
    if (score >= 80) return "var(--accent)";
    if (score >= 50) return "var(--accent-soft)";
    return "var(--alert)";
  };

  const color = getStatusColor();

  const statusText =
    score >= 80
      ? "SYSTEM SECURE — OPTIMAL"
      : score >= 50
        ? "CAUTION — DISTRACTION"
        : "CRITICAL — PULL OVER";

  return (
    <div className="bg-[var(--card)] p-6 rounded-[2.5rem] border border-[var(--border)] flex flex-col items-center relative overflow-hidden transition-all duration-500 min-h-[300px] justify-center">
      
      {/* Subtle background atmosphere - removed heavy blur/glow */}
      <div
        className="absolute top-0 w-full h-32 bg-gradient-to-b from-[var(--border)]/10 to-transparent pointer-events-none"
      ></div>

      <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] w-full text-left mb-6 z-10">
        Safety Speedometer
      </h3>

      {/* The Gauge */}
      <div className="relative w-64 h-40 flex justify-center overflow-hidden z-10">
        <svg
          className="absolute top-0 w-full h-full"
          viewBox="0 0 100 60"
        >
          {/* Background Path */}
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke="var(--border)"
            strokeWidth="10"
            strokeLinecap="round"
            className="opacity-20"
          />

          {/* Active Progress Path - Removed drop-shadow for a clean, sharp look */}
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - roundedScore}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text Readout */}
        <div className="absolute bottom-2 flex flex-col items-center">
          <span className="text-7xl font-black tracking-tighter text-white">
            {roundedScore}
          </span>
          <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em] -mt-2">
            Safety Rank
          </span>
        </div>
      </div>

      {/* Status Footer */}
      <p className={`text-[10px] font-black tracking-widest uppercase mt-4 z-10 text-center ${score < 50 ? 'text-[var(--alert)]' : 'text-[var(--text-secondary)]'}`}>
        {statusText}
      </p>

      {/* Mini Visual Segments */}
      <div className="mt-3 flex justify-center gap-1.5 z-10">
        {[...Array(5)].map((_, i) => (
            <div 
                key={i} 
                className="w-8 h-1 rounded-full transition-all duration-700" 
                style={{ 
                    backgroundColor: (roundedScore / 20) > i ? color : 'var(--border)',
                    opacity: (roundedScore / 20) > i ? 1 : 0.2
                }} 
            />
        ))}
      </div>

      {/* Nerd Mode Detail Bar */}
      {nerdMode && (
        <div className="w-full mt-6 flex items-center gap-4 z-10">
          <span className="text-[8px] font-black text-[var(--border)] uppercase">Min</span>
          <div className="flex-1 h-[3px] bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${roundedScore}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-[8px] font-black text-[var(--border)] uppercase">Max</span>
        </div>
      )}
    </div>
  );
}
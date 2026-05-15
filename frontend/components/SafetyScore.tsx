import React from "react";

export default function SafetyScore({ score }: { score: number }) {
  const roundedScore = Math.round(score);

  // Gauge Math
  const strokeDasharray = 125.6; // Refined for the semi-circle path length
  const strokeDashoffset = strokeDasharray - (strokeDasharray * roundedScore) / 100;

  // Aesthetic Logic using the Refined Image Palette
  // --accent: #E8B06F (Amber)
  // --text-secondary: #BFA899 (Taupe)
  // --alert: #D9534F (Warm Red)
  const color = score >= 80 
    ? "#E8B06F"    // Amber for Good
    : score >= 50 
      ? "#BFA899" // Taupe/Beige for Warning
      : "#D9534F";   // Desaturated Red for Critical

  const statusText =
    score >= 80
      ? "SYSTEM SECURE — OPTIMAL FOCUS"
      : score >= 50
        ? "CAUTION — PERSISTENT DISTRACTION"
        : "CRITICAL — PULL OVER IMMEDIATELY";

  return (
    <div className="bg-[#3D2B1F] p-6 rounded-2xl border border-[#4D392C] flex flex-col items-center shadow-2xl relative overflow-hidden transition-all duration-500">
      
      {/* Background Atmosphere - Using the color variable for the glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] opacity-10 pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: color }}
      ></div>

      {/* Label with Luxury Tracking */}
      <h3 className="text-[10px] font-bold text-[#E8B06F] uppercase tracking-[0.2em] w-full text-left mb-8 z-10 opacity-80">
        Performance Index
      </h3>

      {/* Semi-circular Gauge */}
      <div className="relative w-56 h-36 flex justify-center overflow-hidden z-10">
        <svg
          className="absolute top-0 w-full h-full drop-shadow-2xl"
          viewBox="0 0 100 60"
          aria-hidden
        >
          {/* Background Track - Darker brown to match the theme */}
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke="#4D392C"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Active Progress Path */}
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0px 0px 6px ${color}80)` }}
          />
        </svg>

        {/* Center Score Text */}
        <div className="absolute bottom-4 flex flex-col items-center">
          <span
            className="text-6xl font-black tracking-tighter transition-colors duration-700 text-white"
          >
            {roundedScore}
          </span>
          <span className="text-[9px] font-bold text-[#BFA899] uppercase tracking-[0.3em] -mt-1">
            Safety Rank
          </span>
        </div>
      </div>

      {/* Status Description */}
      <p className={`text-[10px] font-bold tracking-widest uppercase mt-4 z-10 text-center ${score < 50 ? 'text-[#D9534F]' : 'text-[#BFA899]'}`}>
        {statusText}
      </p>

      {/* Bottom Minimalist Progress Bar */}
      <div className="w-full mt-8 flex items-center gap-4 z-10">
        <span className="text-[9px] font-black text-[#4D392C] uppercase">Min</span>
        <div className="flex-1 h-[4px] bg-[#4D392C] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 relative"
            style={{ width: `${roundedScore}%`, backgroundColor: color }}
          >
            {/* Glossy overlay on the bar */}
            <div className="absolute inset-0 bg-white/10"></div>
          </div>
        </div>
        <span className="text-[9px] font-black text-[#4D392C] uppercase">Max</span>
      </div>
    </div>
  );
}
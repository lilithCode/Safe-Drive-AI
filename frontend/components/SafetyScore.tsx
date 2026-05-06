// filepath: ./AI Projects/SafeDrive/frontend/components/SafetyScore.tsx
import React from "react";

export default function SafetyScore({ score }: { score: number }) {
  const roundedScore = Math.round(score);
  const strokeDasharray = 251.2; // Circumference of r=40
  const strokeDashoffset =
    strokeDasharray - (strokeDasharray * roundedScore) / 100;

  const color = score >= 80 ? "#10b981" : score >= 50 ? "#eab308" : "#ef4444";
  const statusText =
    score >= 80
      ? "Good — stay focused"
      : score >= 50
        ? "Warning — pay attention"
        : "Critical — pull over";

  return (
    <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-zinc-800 flex flex-col items-center">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider w-full text-left mb-6">
        Safety Score
      </h3>

      <div className="relative w-48 h-32 flex justify-center overflow-hidden">
        <svg className="absolute top-0 w-full h-full" viewBox="0 0 100 100">
          {/* Background Arc */}
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke="#3f3f46"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Foreground Arc */}
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute bottom-2 flex flex-col items-center">
          <span className="text-5xl font-bold" style={{ color }}>
            {roundedScore}
          </span>
        </div>
      </div>

      <p className="text-sm text-zinc-400 mt-2">{statusText}</p>

      {/* Score Bar */}
      <div className="w-full mt-6 flex items-center gap-2">
        <span className="text-xs text-zinc-600">0</span>
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${roundedScore}%`, backgroundColor: color }}
          ></div>
        </div>
        <span className="text-xs text-zinc-600">100</span>
      </div>
    </div>
  );
}

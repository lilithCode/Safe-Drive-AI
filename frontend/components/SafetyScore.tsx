import React from "react";

export default function SafetyScore({ score }: { score: number }) {
  const roundedScore = Math.round(score);

  // Stroke circumference for an arc with radius r = 40:
  // circumference = 2 * Math.PI * r ≈ 251.2
  const strokeDasharray = 251.2;

  const strokeDashoffset =
    strokeDasharray - (strokeDasharray * roundedScore) / 100;

  // Color & status mapping based on thresholds:
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#eab308" : "#ef4444";
  const statusText =
    score >= 80
      ? "Good — stay focused"
      : score >= 50
        ? "Warning — pay attention"
        : "Critical — pull over";

  return (
    <div className="bg-[#121214] p-6 rounded-2xl border border-zinc-800/80 flex flex-col items-center shadow-lg relative overflow-hidden">
      {/* Small background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[60px] opacity-20 pointer-events-none"
        style={{ backgroundColor: color }}
      ></div>

      {/* Small header label */}
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest w-full text-left mb-6 z-10">
        Safety Score
      </h3>

      {/* Semi-circular SVG with numeric center */}
      <div className="relative w-48 h-32 flex justify-center overflow-hidden z-10">
        <svg
          className="absolute top-0 w-full h-full"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke="#27272a"
            strokeWidth="8"
            strokeLinecap="round"
          />

          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out drop-shadow-md"
            style={{ filter: `drop-shadow(0px 0px 6px ${color}80)` }}
          />
        </svg>

        <div className="absolute bottom-2 flex flex-col items-center">
          <span
            className="text-5xl font-black drop-shadow-sm"
            style={{ color }}
            aria-label={`Safety score ${roundedScore} percent`}
          >
            {roundedScore}
          </span>
        </div>
      </div>

      <p className="text-sm font-medium text-zinc-300 mt-2 z-10">
        {statusText}
      </p>

      <div className="w-full mt-6 flex items-center gap-3 z-10">
        <span className="text-xs font-bold text-zinc-600">0</span>
        <div
          className="flex-1 h-2 bg-zinc-800/80 rounded-full overflow-hidden ring-1 ring-white/5"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={roundedScore}
        >
          <div
            className="h-full rounded-full transition-all duration-700 relative"
            style={{ width: `${roundedScore}%`, backgroundColor: color }}
          >
            <div className="absolute inset-0 bg-white/20"></div>
          </div>
        </div>
        <span className="text-xs font-bold text-zinc-600">100</span>
      </div>
    </div>
  );
}

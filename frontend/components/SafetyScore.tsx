

// "use client";

// import React from "react";

// interface SafetyScoreProps {
//   score: number;
//   nerdMode: boolean; // Dynamic structure mode controller
// }

// export default function SafetyScore({ score, nerdMode }: SafetyScoreProps) {
//   const roundedScore = Math.round(score);

//   // Gauge Math
//   const strokeDasharray = 125.6; // Semi-circle path length
//   const strokeDashoffset = strokeDasharray - (strokeDasharray * roundedScore) / 100;

//   // Aesthetic Logic using the Refined Image Palette
//   // --accent: #E8B06F (Amber)
//   // --text-secondary: #BFA899 (Taupe)
//   // --alert: #D9534F (Warm Red)
//   const color = score >= 80 
//     ? "#E8B06F"    // Amber for Good
//     : score >= 50 
//       ? "#BFA899" // Taupe/Beige for Warning
//       : "#D9534F";   // Desaturated Red for Critical

//   const statusText =
//     score >= 80
//       ? "SYSTEM SECURE — OPTIMAL FOCUS"
//       : score >= 50
//         ? "CAUTION — PERSISTENT DISTRACTION"
//         : "CRITICAL — PULL OVER IMMEDIATELY";

//   return (
//     <div className="bg-[#3D2B1F] p-5 sm:p-6 rounded-2xl border border-[#4D392C] flex flex-col items-center shadow-2xl relative overflow-hidden transition-all duration-500">
      
//       {/* Background Atmosphere - Using the color variable for the glow */}
//       <div
//         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] opacity-10 pointer-events-none transition-colors duration-1000"
//         style={{ backgroundColor: color }}
//       ></div>

//       {/* Label with Luxury Tracking */}
//       <h3 className="text-[10px] font-bold text-[#E8B06F] uppercase tracking-[0.2em] w-full text-left mb-6 z-10 opacity-80">
//         Performance Index
//       </h3>

//       {/* Semi-circular Gauge */}
//       <div className="relative w-56 h-36 flex justify-center overflow-hidden z-10">
//         <svg
//           className="absolute top-0 w-full h-full drop-shadow-2xl"
//           viewBox="0 0 100 60"
//           aria-hidden
//         >
//           {/* Background Track - Darker brown to match the theme */}
//           <path
//             d="M 10,50 A 40,40 0 0,1 90,50"
//             fill="none"
//             stroke="#4D392C"
//             strokeWidth="8"
//             strokeLinecap="round"
//           />

//           {/* Active Progress Path */}
//           <path
//             d="M 10,50 A 40,40 0 0,1 90,50"
//             fill="none"
//             stroke={color}
//             strokeWidth="8"
//             strokeLinecap="round"
//             strokeDasharray={strokeDasharray}
//             strokeDashoffset={strokeDashoffset}
//             className="transition-all duration-1000 ease-out"
//             style={{ filter: `drop-shadow(0px 0px 6px ${color}80)` }}
//           />
//         </svg>

//         {/* Center Score Text */}
//         <div className="absolute bottom-4 flex flex-col items-center">
//           <span
//             className="text-6xl font-black tracking-tighter transition-colors duration-700 text-white"
//           >
//             {roundedScore}
//           </span>
//           <span className="text-[9px] font-bold text-[#BFA899] uppercase tracking-[0.3em] -mt-1">
//             Safety Rank
//           </span>
//         </div>
//       </div>

//       {/* Status Description */}
//       <p className={`text-[10px] font-bold tracking-widest uppercase mt-2 z-10 text-center ${score < 50 ? 'text-[#D9534F]' : 'text-[#BFA899]'}`}>
//         {statusText}
//       </p>

//       {/* Bottom Minimalist Progress Bar - Rendered purely in Nerd Mode calibration */}
//       {nerdMode && (
//         <div className="w-full mt-6 flex items-center gap-4 z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
//           <span className="text-[9px] font-black text-[#4D392C] uppercase">Min</span>
//           <div className="flex-1 h-[4px] bg-[#4D392C] rounded-full overflow-hidden">
//             <div
//               className="h-full rounded-full transition-all duration-1000 relative"
//               style={{ width: `${roundedScore}%`, backgroundColor: color }}
//             >
//               <div className="absolute inset-0 bg-white/10"></div>
//             </div>
//           </div>
//           <span className="text-[9px] font-black text-[#4D392C] uppercase">Max</span>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import React from "react";

interface SafetyScoreProps {
  score: number;
  nerdMode: boolean; 
}

export default function SafetyScore({ score, nerdMode }: SafetyScoreProps) {
  const roundedScore = Math.round(score);

  // Dynamic Colors using CSS Variables for consistency
  const getStatusColor = () => {
    if (score >= 80) return "var(--accent)";      // Orange/Amber
    if (score >= 50) return "var(--accent-soft)"; // Yellow
    return "var(--alert)";                        // Red
  };

  const color = getStatusColor();

  const statusText =
    score >= 80
      ? "SYSTEM SECURE — OPTIMAL"
      : score >= 50
        ? "CAUTION — DISTRACTION"
        : "CRITICAL — PULL OVER";

  return (
    <div className="bg-[var(--card)] p-5 sm:p-6 rounded-[2.5rem] border border-[var(--border)] flex flex-col items-center shadow-2xl relative overflow-hidden transition-all duration-500 min-h-[300px] justify-center">
      
      {/* Background Atmosphere Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[100px] opacity-10 pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: color }}
      ></div>

      {/* Header Label */}
      <h3 className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.3em] w-full text-left mb-6 z-10 opacity-80">
        Safety Speedometer
      </h3>

      {/* The Gauge */}
      <div className="relative w-64 h-40 flex justify-center overflow-hidden z-10">
        <svg
          className="absolute top-0 w-full h-full drop-shadow-2xl"
          viewBox="0 0 100 60"
        >
          {/* Background Path (Muted) */}
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke="var(--border)"
            strokeWidth="10"
            strokeLinecap="round"
            className="opacity-20"
          />

          {/* Active Progress Path */}
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            pathLength="100"   /* The Pro Trick: Maps the whole path to 100 units */
            strokeDasharray="100"
            strokeDashoffset={100 - roundedScore} /* Moves exactly with the score */
            className="transition-all"
            style={{ 
                filter: `drop-shadow(0px 0px 8px ${color})`,
                // Fast transition for real-time feel
                transition: 'stroke-dashoffset 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.5s ease'
            }}
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
      <p className={`text-[10px] font-black tracking-widest uppercase mt-4 z-10 text-center transition-colors duration-500 ${score < 50 ? 'text-[var(--alert)]' : 'text-white'}`}>
        {statusText}
      </p>

      {/* Mini Visual Segments (Speedometer style) */}
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
        <div className="w-full mt-6 flex items-center gap-4 z-10 animate-in fade-in slide-in-from-bottom-2">
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
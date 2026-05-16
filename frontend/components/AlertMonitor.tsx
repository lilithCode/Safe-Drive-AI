import React from "react";
import {
  AlertTriangle,
  Phone,
  EyeOff,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { AIResponse } from "../types";

/**
 * PALETTE MAPPING:
 * Surface: #3D2B1F (Dark Chocolate)
 * Border: #4D392C (Deep Brown)
 * Accent: #E8B06F (Amber)
 * Text: #FFFFFF (White) & #BFA899 (Taupe)
 * Success: #A3B18A (Sage)
 * Alert: #D9534F (Warm Red)
 */

export default function AlertMonitor({
  aiData,
}: {
  aiData: AIResponse | null;
}) {
  return (
    <div className="bg-[#3D2B1F] p-5 sm:p-6 rounded-2xl border border-[#4D392C] shadow-xl transition-all duration-300">
      <h3 className="text-[10px] sm:text-xs font-bold text-[#E8B06F] uppercase tracking-[0.2em] mb-5">
        Live Status Monitor
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        <AlertItem
          active={aiData?.drowsy}
          icon={<EyeOff size={20} />}
          activeText="Drowsiness Detected!"
          inactiveText="Eyes Focused"
        />
        <AlertItem
          active={aiData?.phone_detected}
          icon={<Phone size={20} />}
          activeText="Cell Phone Detected!"
          inactiveText="Hands Free"
        />
        <AlertItem
          active={aiData?.head_distracted}
          icon={<AlertTriangle size={20} />}
          activeText="Looking Away!"
          inactiveText="Head Focused"
        />
        <AlertItem
          active={aiData?.yawning}
          icon={<Activity size={20} />}
          activeText="Driver Yawning!"
          inactiveText="No Fatigue"
        />
      </div>
    </div>
  );
}

function AlertItem({ active, icon, activeText, inactiveText }: any) {
  return (
    <div
      className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-500 ${
        active 
          ? "bg-[#D9534F]/10 border-[#D9534F]/40 text-[#D9534F] shadow-[0_0_15px_rgba(217,83,79,0.1)]" 
          : "bg-[#2A1E16]/50 border-[#4D392C] text-[#BFA899]"
      }`}
    >
      <div className={`transition-transform duration-500 ${active ? "scale-110" : "scale-100"}`}>
        {active ? (
          icon
        ) : (
          <CheckCircle2 size={20} className="text-[#A3B18A]" strokeWidth={2.5} />
        )}
      </div>
      
      <div className="flex flex-col">
        <span className={`text-sm font-bold tracking-wide transition-colors duration-300 ${active ? "text-[#D9534F]" : "text-white"}`}>
          {active ? activeText : inactiveText}
        </span>
        <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50">
          {active ? "Immediate Action" : "System Normal"}
        </span>
      </div>

      {/* Pulsing indicator for active alerts */}
      {active && (
        <div className="ml-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9534F] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D9534F]"></span>
          </span>
        </div>
      )}
    </div>
  );
}
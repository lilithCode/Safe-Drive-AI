import React from "react";
import { ShieldCheck } from "lucide-react";

interface Props {
  isConnected: boolean;
  isEmergency: boolean;
}

export default function Header({ isConnected, isEmergency }: Props) {
  return (
    <header className="flex justify-between items-center mb-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
          <ShieldCheck size={26} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">
            SafeDrive AI
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            Real-time driver monitoring
          </p>
        </div>
      </div>

      <div className="hidden md:flex bg-zinc-900/80 border border-zinc-800/80 rounded-full p-1 shadow-inner">
        <div className="px-6 py-1.5 bg-zinc-800 text-zinc-100 text-sm font-semibold rounded-full shadow-sm">
          Dashboard
        </div>
        <div className="px-6 py-1.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer text-sm font-medium">
          Analytics
        </div>
        <div className="px-6 py-1.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer text-sm font-medium">
          Settings
        </div>
      </div>

      <div className="flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-800/80 pl-2.5 pr-5 py-2 rounded-full backdrop-blur-md">
        <div
          className={`w-2.5 h-2.5 rounded-full ${isConnected && !isEmergency ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"}`}
        ></div>
        <span className="text-xs font-bold text-zinc-300 tracking-wide uppercase">
          {isEmergency
            ? "EMERGENCY"
            : isConnected
              ? "System Active"
              : "Connecting..."}
        </span>
      </div>
    </header>
  );
}

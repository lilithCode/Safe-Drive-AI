// filepath: ./AI Projects/SafeDrive/frontend/components/Header.tsx
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
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight leading-tight">
            SafeDrive AI
          </h1>
          <p className="text-xs text-zinc-500">Real-time driver monitoring</p>
        </div>
      </div>

      <div className="hidden md:flex bg-zinc-900/80 border border-zinc-800 rounded-full p-1">
        <div className="px-5 py-1.5 bg-zinc-800 text-zinc-200 text-sm font-medium rounded-full">
          Dashboard
        </div>
        <div className="px-5 py-1.5 text-zinc-500 text-sm font-medium">
          Analytics
        </div>
        <div className="px-5 py-1.5 text-zinc-500 text-sm font-medium">
          Settings
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#1e1e1e] border border-zinc-800 pl-2 pr-4 py-1.5 rounded-full">
        <div
          className={`w-2.5 h-2.5 rounded-full ${isConnected && !isEmergency ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`}
        ></div>
        <span className="text-xs font-semibold text-zinc-300">
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

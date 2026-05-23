"use client";

import React, { useState } from "react";
import { AlertCircle, AlertTriangle, Info, Terminal, Filter, Clock } from "lucide-react";

interface AlertHistoryProps {
  logs: any[];
  isModalView?: boolean;
}

export default function AlertHistory({ logs, isModalView = false }: AlertHistoryProps) {
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  // Show all logs in Nerd Mode, or apply filter in Modal View
  const filteredLogs = isModalView 
    ? logs.filter((log) => severityFilter === "all" ? true : log.type === severityFilter)
    : logs;

  return (
    <div className={`bg-[#3D2B1F] w-full h-full flex flex-col transition-all duration-300 overflow-hidden ${isModalView ? "p-4 sm:p-6" : "p-3"}`}>
      
      {/* Terminal Header - Slimmer in Nerd Mode */}
      <div className={`flex items-center justify-between border-b border-[#4D392C] ${isModalView ? "pb-4 mb-4" : "pb-2 mb-3"} shrink-0`}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#E8B06F]/10 border border-[#E8B06F]/20 rounded-lg text-[#E8B06F]">
            <Terminal size={isModalView ? 16 : 12} />
          </div>
          <div>
            <h3 className={`${isModalView ? "text-sm" : "text-[11px]"} font-black text-white uppercase tracking-wider leading-none`}>
              {isModalView ? "System Analytics Terminal" : "Live Event Log"}
            </h3>
            {isModalView && (
              <p className="text-[9px] text-[#BFA899] uppercase tracking-widest mt-1 font-bold opacity-60">
                Diagnostic Security Trace
              </p>
            )}
          </div>
        </div>
        {!isModalView && (
            <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8B06F] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8B06F]"></span>
                </span>
                <span className="text-[9px] font-black text-[#E8B06F] uppercase">Live</span>
            </div>
        )}
      </div>

      {/* Filters - ONLY shown in Modal View */}
      {isModalView && (
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#2A1E16]/40 p-1.5 rounded-xl border border-[#4D392C] shrink-0">
          <div className="flex items-center gap-1.5 px-1 text-[9px] font-black text-[#BFA899] uppercase tracking-wider opacity-60 mr-1">
            <Filter size={10} strokeWidth={3} />
            Filter:
          </div>
          <FilterTab active={severityFilter === "all"} label="ALL" count={logs.length} onClick={() => setSeverityFilter("all")} />
          <FilterTab active={severityFilter === "critical"} label="CRITICAL" count={logs.filter(l => l.type === "critical").length} color="text-[#D9534F]" onClick={() => setSeverityFilter("critical")} />
          <FilterTab active={severityFilter === "warning"} label="WARNINGS" count={logs.filter(l => l.type === "warning").length} color="text-[#E8B06F]" onClick={() => setSeverityFilter("warning")} />
        </div>
      )}

      {/* Log Stream */}
      <div className={`w-full flex-1 overflow-y-auto pr-1 custom-scrollbar`}>
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40 py-4">
            <Info size={20} className="text-[#BFA899] mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#BFA899]">
              No Events Logged
            </p>
          </div>
        ) : (
          <div className={`${isModalView ? "space-y-3" : "space-y-2"} pb-4`}>
            {filteredLogs.map((log, idx) => (
              <div
                key={log.id || idx}
                className={`flex items-center gap-3 bg-[#2A1E16]/50 rounded-xl border border-[#4D392C] hover:border-[#E8B06F]/20 transition-all group animate-in fade-in slide-in-from-left-2 duration-300 ${isModalView ? "p-4" : "p-2.5"}`}
              >
                {/* Severity Icon */}
                <div
                  className={`p-1.5 rounded-lg border shrink-0 ${
                    log.type === "critical"
                      ? "bg-[#D9534F]/10 text-[#D9534F] border-[#D9534F]/20"
                      : "bg-[#E8B06F]/10 text-[#E8B06F] border-[#E8B06F]/20"
                  }`}
                >
                  {log.type === "critical" ? <AlertCircle size={14} /> : <AlertTriangle size={14} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-black text-white text-[11px] uppercase tracking-tight truncate">
                      {log.title || "AI FLAG"}
                    </span>
                    <span className="font-mono text-[9px] text-[#E8B06F]/60 flex items-center gap-1">
                       <Clock size={8}/> {log.time}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-[#BFA899] truncate opacity-80 italic">
                    {log.desc || log.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4D392C; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #E8B06F; }
      `}</style>
    </div>
  );
}

function FilterTab({ label, count, active, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
        active ? "bg-[#E8B06F] text-[#3D2B1F]" : "text-[#BFA899] hover:bg-[#2A1E16]"
      }`}
    >
      <span className={active ? "" : color}>{label}</span>
      <span className="opacity-50">{count}</span>
    </button>
  );
}
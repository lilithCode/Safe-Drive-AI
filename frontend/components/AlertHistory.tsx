"use client";

import React, { useState } from "react";
import { AlertCircle, AlertTriangle, Info, Terminal, Filter } from "lucide-react";

interface AlertHistoryProps {
  logs: any[];
  isModalView?: boolean;
}

export default function AlertHistory({ logs, isModalView = false }: AlertHistoryProps) {
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  // Telemetry stream classification sorting routine
  const filteredLogs = logs.filter((log) => {
    if (severityFilter === "all") return true;
    return log.type === severityFilter;
  });

  return (
    <div className="bg-[#3D2B1F] w-full  h-full rounded-2xl border-0 sm:border sm:border-[#4D392C] p-2 sm:p-4 flex flex-col transition-all duration-300 overflow-hidden">
      
      {/* Terminal Header Row */}
      <div className="flex items-center justify-between border-b border-[#4D392C] pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#E8B06F]/10 border border-[#E8B06F]/20 rounded-lg text-[#E8B06F]">
            <Terminal size={14} />
          </div>
          <div>
            <h3 className="text-[13px] font-black text-white uppercase tracking-wider leading-none">
              System Analytics Terminal
            </h3>
            <p className="text-[9px] text-[#BFA899] uppercase tracking-widest mt-1 font-bold opacity-60">
              Live Diagnostic Security Logs
            </p>
          </div>
        </div>
      </div>

      {/* Severity Filter Controller Tabs Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#2A1E16]/40 p-1.5 rounded-xl border border-[#4D392C] shrink-0">
        <div className="flex items-center gap-1.5 px-1 text-[9px] font-black text-[#BFA899] uppercase tracking-wider opacity-60 mr-1">
          <Filter size={10} strokeWidth={3} />
          Filter:
        </div>

        <FilterTab active={severityFilter === "all"} label="ALL" count={logs.length} onClick={() => setSeverityFilter("all")} />
        <FilterTab active={severityFilter === "critical"} label="CRITICAL" count={logs.filter(l => l.type === "critical").length} color="text-[#D9534F]" onClick={() => setSeverityFilter("critical")} />
        <FilterTab active={severityFilter === "warning"} label="WARNINGS" count={logs.filter(l => l.type === "warning").length} color="text-[#E8B06F]" onClick={() => setSeverityFilter("warning")} />
      </div>

      {/* Log Stream Content Container - Adapts to take up the full screen height in modal view */}
      <div className={`w-full flex-1 overflow-y-auto pr-1 custom-scrollbar ${isModalView ? "h-full" : "min-h-[130px]"}`}>
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center bg-[#2A1E16]/20 rounded-xl border border-dashed border-[#4D392C]/40 py-8">
            <div className="w-9 h-9 rounded-full bg-[#2A1E16] flex items-center justify-center mb-2 border border-[#4D392C]">
              <Info size={15} className="text-[#BFA899]" />
            </div>
            <p className="text-xs font-bold text-[#BFA899]">
              No streams filtered under this severity tier.
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 bg-[#2A1E16]/50 p-3.5 rounded-xl border border-[#4D392C] hover:border-[#E8B06F]/20 transition-all group animate-in fade-in duration-200"
              >
                {/* Contextual Icon Display */}
                <div
                  className={`p-2 rounded-lg border shrink-0 ${
                    log.type === "critical"
                      ? "bg-[#D9534F]/10 text-[#D9534F] border-[#D9534F]/20"
                      : log.type === "warning"
                      ? "bg-[#E8B06F]/10 text-[#E8B06F] border-[#E8B06F]/20"
                      : "bg-[#BFA899]/10 text-[#BFA899] border-[#BFA899]/20"
                  }`}
                >
                  {log.type === "critical" ? (
                    <AlertCircle size={15} strokeWidth={2.5} />
                  ) : log.type === "warning" ? (
                    <AlertTriangle size={15} strokeWidth={2.5} />
                  ) : (
                    <Info size={15} strokeWidth={2.5} />
                  )}
                </div>

                {/* Telemetry Text Body */}
                <div className="flex-1 min-w-0">
                  <div className="font-black text-white text-xs sm:text-sm tracking-tight truncate">
                    {log.title || "Alert Log Trace"}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-[#BFA899] truncate mt-0.5 opacity-80">
                    <span className="font-mono text-[#E8B06F]/70">{log.time}</span>
                    <span className="mx-2 opacity-30">•</span>
                    {log.desc || log.message}
                  </div>
                </div>

                {/* Side Tag Badge */}
                <div
                  className={`hidden xs:block text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider border shrink-0 ${
                    log.type === "critical"
                      ? "bg-[#D9534F]/10 border-[#D9534F]/20 text-[#D9534F]"
                      : log.type === "warning"
                      ? "bg-[#E8B06F]/10 border-[#E8B06F]/20 text-[#E8B06F]"
                      : "bg-[#BFA899]/10 border-[#BFA899]/20 text-[#BFA899]"
                  }`}
                >
                  {log.type || "trace"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Styled Terminal Scrollbar Config */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4D392C;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #E8B06F;
        }
      `}</style>
    </div>
  );
}

// Sub-component tab controller button
function FilterTab({ label, count, active, color, onClick }: { label: string, count: number, active: boolean, color?: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-2 rounded-md text-[12px] font-black uppercase tracking-wider transition-all select-none flex items-center gap-1.5 ${
        active 
          ? "bg-[#E8B06F] text-[#3D2B1F] shadow-sm font-black" 
          : "text-[#BFA899] hover:bg-[#2A1E16]/80 hover:text-white"
      }`}
    >
      <span className={active ? "text-inherit" : color}>{label}</span>
      <span className={`text-[12px] font-mono px-1 rounded-sm ${active ? "bg-[#3D2B1F]/20 text-[#3D2B1F]" : "bg-[#3D2B1F] text-[#BFA899]"}`}>
        {count}
      </span>
    </button>
  );
}
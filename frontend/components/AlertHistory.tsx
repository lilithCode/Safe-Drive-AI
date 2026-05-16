import React from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

export default function AlertHistory({ logs }: { logs: any[] }) {
  /**
   * PALETTE REFERENCE:
   * Background: #F2E8D9 (Cream)
   * Card: #3D2B1F (Dark Chocolate)
   * Accent: #E8B06F (Warm Amber)
   * Text Primary: #FFFFFF (White)
   * Text Secondary: #BFA899 (Taupe/Beige)
   * Border: #4D392C (Deep Brown)
   * Alert (Critical): #D9534F (Warm Red)
   */

  return (
    <div className="bg-[#3D2B1F] rounded-2xl border border-[#4D392C] p-4 sm:p-6 flex-1 shadow-2xl transition-all duration-300">
      <h3 className="text-[10px] sm:text-xs font-bold text-[#E8B06F] uppercase tracking-[0.2em] mb-5">
        Alert History
      </h3>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <div className="w-12 h-12 rounded-full bg-[#2A1E16] flex items-center justify-center mb-3 border border-[#4D392C]">
            <Info size={20} className="text-[#BFA899]" />
          </div>
          <p className="text-sm font-medium text-[#BFA899]">
            No alerts recorded yet. Drive safely!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 sm:gap-4 bg-[#2A1E16]/50 p-3 sm:p-4 rounded-xl border border-[#4D392C] hover:border-[#E8B06F]/30 transition-all group"
            >
              {/* Icon Container with Contextual Colors */}
              <div
                className={`p-2 sm:p-2.5 rounded-lg border transition-transform group-hover:scale-110 ${
                  log.type === "critical"
                    ? "bg-[#D9534F]/10 text-[#D9534F] border-[#D9534F]/20"
                    : log.type === "warning"
                    ? "bg-[#E8B06F]/10 text-[#E8B06F] border-[#E8B06F]/20"
                    : "bg-[#BFA899]/10 text-[#BFA899] border-[#BFA899]/20"
                }`}
              >
                {log.type === "critical" ? (
                  <AlertCircle size={18} className="sm:w-5 sm:h-5" strokeWidth={2} />
                ) : log.type === "warning" ? (
                  <AlertTriangle size={18} className="sm:w-5 sm:h-5" strokeWidth={2} />
                ) : (
                  <Info size={18} className="sm:w-5 sm:h-5" strokeWidth={2} />
                )}
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate">
                  {log.title}
                </div>
                <div className="text-[11px] sm:text-xs font-medium text-[#BFA899] truncate mt-0.5">
                  {log.time} <span className="mx-1 opacity-30">•</span> {log.desc}
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`hidden xs:block text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${
                  log.type === "critical"
                    ? "bg-[#D9534F]/10 border-[#D9534F]/20 text-[#D9534F]"
                    : log.type === "warning"
                    ? "bg-[#E8B06F]/10 border-[#E8B06F]/20 text-[#E8B06F]"
                    : "bg-[#BFA899]/10 border-[#BFA899]/20 text-[#BFA899]"
                }`}
              >
                {log.type}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Internal CSS for the scrollbar to keep the theme clean */}
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
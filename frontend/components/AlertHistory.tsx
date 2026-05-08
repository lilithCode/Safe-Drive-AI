import React from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

export default function AlertHistory({ logs }: { logs: any[] }) {
  return (
    <div className="bg-[#121214] rounded-2xl border border-zinc-800/80 p-6 flex-1 shadow-lg">
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">
        Alert History
      </h3>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
            <Info size={20} className="text-zinc-700" />
          </div>
          <p className="text-sm font-medium">
            No alerts recorded yet. Drive safely!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-4 bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800/60 hover:bg-zinc-800/40 transition-colors"
            >
              <div
                className={`p-2.5 rounded-xl ${log.type === "critical" ? "bg-red-500/10 text-red-500 border border-red-500/20" : log.type === "warning" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"}`}
              >
                {log.type === "critical" ? (
                  <AlertCircle size={20} strokeWidth={2.5} />
                ) : log.type === "warning" ? (
                  <AlertTriangle size={20} strokeWidth={2.5} />
                ) : (
                  <Info size={20} strokeWidth={2.5} />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-zinc-200 text-sm mb-0.5">
                  {log.title}
                </div>
                <div className="text-xs font-medium text-zinc-500">
                  {log.time} <span className="mx-1.5 text-zinc-700">•</span>{" "}
                  {log.desc}
                </div>
              </div>
              <div
                className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${log.type === "critical" ? "bg-red-500/15 text-red-400" : log.type === "warning" ? "bg-yellow-500/15 text-yellow-400" : "bg-blue-500/15 text-blue-400"}`}
              >
                {log.type}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

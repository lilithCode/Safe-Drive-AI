// filepath: ./AI Projects/SafeDrive/frontend/components/AlertHistory.tsx
import React from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

export default function AlertHistory({ logs }: { logs: any[] }) {
  return (
    <div className="bg-[#1e1e1e] rounded-2xl border border-zinc-800 p-6 flex-1">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
        Alert History
      </h3>

      {logs.length === 0 ? (
        <div className="text-center text-zinc-600 py-8 text-sm">
          No alerts recorded yet. Drive safely!
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-4 bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-800/50"
            >
              <div
                className={`p-2 rounded-lg ${log.type === "critical" ? "bg-red-500/10 text-red-500" : log.type === "warning" ? "bg-yellow-500/10 text-yellow-500" : "bg-blue-500/10 text-blue-500"}`}
              >
                {log.type === "critical" ? (
                  <AlertCircle size={20} />
                ) : log.type === "warning" ? (
                  <AlertTriangle size={20} />
                ) : (
                  <Info size={20} />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-zinc-200 text-sm">
                  {log.title}
                </div>
                <div className="text-xs text-zinc-500">
                  {log.time} — {log.desc}
                </div>
              </div>
              <div
                className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize ${log.type === "critical" ? "bg-red-500/20 text-red-400" : log.type === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}
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

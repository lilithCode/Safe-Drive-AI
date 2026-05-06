import React from "react";
import {
  AlertTriangle,
  Phone,
  EyeOff,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { AIResponse } from "../types";

export default function AlertMonitor({
  aiData,
}: {
  aiData: AIResponse | null;
}) {
  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
      <h3 className="text-slate-400 font-medium mb-4">Live Status Monitor</h3>
      <div className="space-y-3">
        <AlertItem
          active={aiData?.drowsy}
          icon={<EyeOff />}
          activeText="Drowsiness Detected!"
          inactiveText="Eyes Focused"
        />
        <AlertItem
          active={aiData?.phone_detected}
          icon={<Phone />}
          activeText="Cell Phone Detected!"
          inactiveText="Hands Free"
        />
        <AlertItem
          active={aiData?.head_distracted}
          icon={<AlertTriangle />}
          activeText="Looking Away!"
          inactiveText="Head Focused"
        />
        <AlertItem
          active={aiData?.yawning}
          icon={<Activity />}
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
      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
        active
          ? "bg-red-500/10 border-red-500/50 text-red-500"
          : "bg-slate-800/50 border-slate-700 text-slate-400"
      }`}
    >
      {active ? icon : <CheckCircle2 className="text-green-500" />}
      <span className="font-medium">{active ? activeText : inactiveText}</span>
    </div>
  );
}

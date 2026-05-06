// filepath: ./AI Projects/SafeDrive/frontend/components/DetectionStatus.tsx
import React from "react";
import { AIResponse } from "../types";

export default function DetectionStatus({
  aiData,
}: {
  aiData: AIResponse | null;
}) {
  return (
    <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-zinc-800">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
        Detection Status
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <StatusBox
          title="Eyes"
          isBad={aiData?.drowsy}
          badText="Closed"
          goodText="Open"
        />
        <StatusBox
          title="Head pose"
          isBad={aiData?.head_distracted}
          badText="Tilted/Away"
          goodText="Forward"
          warning={!aiData?.face_detected}
          warnText="Not Found"
        />
        <StatusBox
          title="Phone"
          isBad={aiData?.phone_detected}
          badText="Detected"
          goodText="None"
        />
        <StatusBox
          title="Yawning"
          isBad={aiData?.yawning}
          badText="Detected"
          goodText="None"
          warning={aiData?.mar && aiData.mar > 0.4 && !aiData.yawning}
          warnText="Talking"
        />
      </div>
    </div>
  );
}

function StatusBox({
  title,
  isBad,
  goodText,
  badText,
  warning,
  warnText,
}: any) {
  let color = "bg-green-500";
  let text = goodText;

  if (isBad) {
    color = "bg-red-500";
    text = badText;
  } else if (warning) {
    color = "bg-yellow-500";
    text = warnText;
  }

  return (
    <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
      <div className="text-xs text-zinc-500 mb-1.5">{title}</div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-sm font-medium text-zinc-200">{text}</span>
      </div>
    </div>
  );
}

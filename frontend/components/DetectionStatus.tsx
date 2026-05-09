import React from "react";
import { AIResponse } from "../types";

export default function DetectionStatus({
  aiData,
}: {
  aiData: AIResponse | null;
}) {
  return (
    <div className="bg-[#121214] p-6 rounded-2xl border border-zinc-800/80 shadow-lg">
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
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
          warning={aiData?.mar && aiData.mar > 0.35 && !aiData.yawning}
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
  let color = "bg-emerald-500";
  let textColor = "text-emerald-400";
  let text = goodText;
  let isPulsing = false;

  if (isBad) {
    color = "bg-red-500";
    textColor = "text-red-400";
    text = badText;
    isPulsing = true;
  } else if (warning) {
    color = "bg-yellow-500";
    textColor = "text-yellow-400";
    text = warnText;
  }

  return (
    <div
      className={`bg-zinc-900/40 p-3.5 rounded-xl border backdrop-blur-sm transition-all ${isBad ? "border-red-900/50 bg-red-950/10" : warning ? "border-yellow-900/30" : "border-zinc-800/60"}`}
    >
      <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 mb-2">
        {title}
      </div>
      <div className="flex items-center gap-2.5">
        <div className={`relative flex items-center justify-center w-2 h-2`}>
          {isPulsing && (
            <div
              className={`absolute w-4 h-4 rounded-full opacity-40 animate-ping ${color}`}
            ></div>
          )}
          <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${color}`}></div>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{text}</span>
      </div>
    </div>
  );
}

import React from "react";
import { Car, Play, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  appState: "IDLE" | "INITIALIZING" | "READY";
  onInitialize: () => void;
  onStart: () => void;
}

export default function StartScreen({
  appState,
  onInitialize,
  onStart,
}: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center text-white">
      {appState === "IDLE" && <Car className="text-blue-500 w-20 h-20 mb-6" />}
      {appState === "INITIALIZING" && (
        <Loader2 className="animate-spin text-blue-500 w-20 h-20 mb-6" />
      )}
      {appState === "READY" && (
        <CheckCircle2 className="text-green-500 w-20 h-20 mb-6" />
      )}

      <h1 className="text-4xl font-bold mb-4">
        SafeDrive <span className="text-blue-500">AI</span>
      </h1>

      {appState === "IDLE" && (
        <>
          <p className="text-zinc-400 mb-8 max-w-md text-center">
            Real-time driver monitoring system. Initialize the core systems to
            set up AI models and request camera permissions.
          </p>
          <button
            onClick={onInitialize}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Initialize AI Engine
          </button>
        </>
      )}

      {appState === "INITIALIZING" && (
        <div className="flex flex-col items-center">
          <p className="text-zinc-300 mb-2 font-medium">Loading AI Models...</p>
          <p className="text-zinc-500 text-sm mb-8">
            Calibrating neural networks and camera streams...
          </p>
          <div className="w-48 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-[pulse_1s_ease-in-out_infinite] w-full origin-left scale-x-50"></div>
          </div>
        </div>
      )}

      {appState === "READY" && (
        <>
          <p className="text-green-400 mb-8 max-w-md text-center font-medium">
            System initialization complete. Neural networks are loaded and
            standing by.
          </p>
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-[0_0_20px_rgba(22,163,74,0.4)]"
          >
            <Play className="w-5 h-5" /> Let's Drive
          </button>
        </>
      )}
    </div>
  );
}

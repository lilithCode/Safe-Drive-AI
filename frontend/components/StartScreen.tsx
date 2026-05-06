import React from "react";
import { Car, Play } from "lucide-react";

interface Props {
  onStart: () => void;
}

export default function StartScreen({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white">
      <Car className="text-blue-500 w-20 h-20 mb-6" />
      <h1 className="text-4xl font-bold mb-4">
        SafeDrive <span className="text-blue-500">AI</span>
      </h1>
      <p className="text-slate-400 mb-8 max-w-md text-center">
        Real-time driver monitoring system. Click start to grant camera
        permissions and enable audio alerts.
      </p>
      <button
        onClick={onStart}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
      >
        <Play className="w-5 h-5" /> Start Monitoring
      </button>
    </div>
  );
}

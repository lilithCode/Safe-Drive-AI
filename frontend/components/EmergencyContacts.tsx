import React from "react";
import { Phone, Siren } from "lucide-react";

export default function EmergencyContacts({ isEmergency, onTriggerSOS }: any) {
  return (
    <div className="bg-[#121214] p-6 rounded-2xl border border-zinc-800/80 shadow-lg">
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
        Emergency Controls
      </h3>

      <button
        onClick={onTriggerSOS}
        disabled={isEmergency}
        className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all mb-5 shadow-sm
          ${
            isEmergency
              ? "bg-red-950/80 text-red-500 border border-red-900/80 cursor-not-allowed"
              : "bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          }`}
      >
        <Siren
          className={`w-5 h-5 ${isEmergency ? "animate-pulse" : ""}`}
          strokeWidth={2.5}
        />
        {isEmergency ? "SOS ACTIVE — SHARING LOCATION" : "TRIGGER SOS ALARM"}
      </button>

      <div className="space-y-2.5">
        <Contact name="Ahmed (Brother)" phone="123-456-7890" init="A" />
        <Contact name="Emergency Services" phone="911" init="E" alert />
      </div>
    </div>
  );
}

function Contact({ name, phone, init, alert }: any) {
  return (
    <div className="flex items-center justify-between bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
      <div className="flex items-center gap-3.5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${alert ? "bg-red-500/10 text-red-500" : "bg-zinc-800 text-zinc-300"}`}
        >
          {init || name.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-bold text-zinc-200">{name}</div>
          <div className="text-xs font-medium text-zinc-500">{phone}</div>
        </div>
      </div>
      <button className="p-2.5 bg-zinc-800/80 rounded-lg text-zinc-300 hover:bg-white hover:text-black transition-all shadow-sm">
        <Phone size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}

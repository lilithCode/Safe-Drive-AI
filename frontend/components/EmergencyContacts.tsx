// filepath: ./AI Projects/SafeDrive/frontend/components/EmergencyContacts.tsx
import React from "react";
import { Phone, Siren } from "lucide-react";

export default function EmergencyContacts({ isEmergency, onTriggerSOS }: any) {
  return (
    <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-zinc-800">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
        Emergency Controls
      </h3>

      <button
        onClick={onTriggerSOS}
        disabled={isEmergency}
        className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mb-4
          ${
            isEmergency
              ? "bg-red-900/50 text-red-400 border border-red-900 cursor-not-allowed"
              : "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30"
          }`}
      >
        <Siren className="w-5 h-5" />
        {isEmergency ? "SOS ACTIVE — SHARING LOCATION" : "TRIGGER SOS ALARM"}
      </button>

      <div className="space-y-2">
        <Contact name="Ahmed (Brother)" phone="123-456-7890" />
        <Contact name="Emergency Services" phone="911" />
      </div>
    </div>
  );
}

function Contact({ name, phone }: any) {
  return (
    <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
          {name.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-200">{name}</div>
          <div className="text-xs text-zinc-500">{phone}</div>
        </div>
      </div>
      <button className="p-2 bg-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors">
        <Phone size={14} />
      </button>
    </div>
  );
}

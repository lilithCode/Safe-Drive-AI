"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Sliders, Volume2, ShieldAlert, Monitor, Zap, RefreshCcw, UserPlus, Eye, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResetConfig: () => void;
  refreshConfig: () => void; 
}

export default function SettingsPanel({ isOpen, onClose, onResetConfig, refreshConfig }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // --- INTERNAL UI STATES ---
  const [eyeSensitivity, setEyeSensitivity] = useState(0.25);
  const [warningDelay, setWarningDelay] = useState(1.5);
  const [sosDelay, setSosDelay] = useState(3.5);
  const [showMesh, setShowMesh] = useState(true);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Guardian Logic
  const [guardians, setGuardians] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuardian, setNewGuardian] = useState({ name: "", number: "" });
  const [inputError, setInputError] = useState("");

  // Load existing config into UI states whenever panel opens
  useEffect(() => {
    if (isOpen) {
      const config = localStorage.getItem("safedrive_user_config");
      if (config) {
        const parsed = JSON.parse(config);
        setGuardians(parsed.guardians || []);
        setEyeSensitivity(parsed.eyeSensitivity || 0.25);
        setWarningDelay(parsed.warningDelay || 1.5);
        setSosDelay(parsed.sosDelay || 3.5);
        setAlarmEnabled(parsed.alarmEnabled !== false);
        setVoiceEnabled(parsed.voiceEnabled !== false);
        setShowMesh(parsed.showMesh !== false);
      }
    }
  }, [isOpen]);

  // --- LOGIC: SAVE & SYNC ---
  const syncToStorage = (updatedFields: any) => {
    const config = JSON.parse(localStorage.getItem("safedrive_user_config") || "{}");
    const newConfig = { ...config, ...updatedFields };
    localStorage.setItem("safedrive_user_config", JSON.stringify(newConfig));
    refreshConfig(); // Notifies Dashboard to update its logic immediately
  };

  const handleAddGuardian = () => {
    const { name, number } = newGuardian;
    if (!name) return setInputError("Name is required");
    if (!number.startsWith("03")) return setInputError("Must start with '03'");
    if (number.length !== 11) return setInputError("Exactly 11 digits required");

    const formattedNumber = "92" + number.substring(1);
    const updatedList = [...guardians, { name, phone: formattedNumber }];
    
    setGuardians(updatedList);
    syncToStorage({ guardians: updatedList });
    
    setNewGuardian({ name: "", number: "" });
    setInputError("");
    setIsAddModalOpen(false);
  };

  const removeGuardian = (index: number) => {
    const updatedList = guardians.filter((_, i) => i !== index);
    setGuardians(updatedList);
    syncToStorage({ guardians: updatedList });
  };

  useGSAP(() => {
    if (isOpen) {
      gsap.to(panelRef.current, { x: 0, opacity: 1, duration: 0.8, ease: "expo.out" });
      gsap.to(backdropRef.current, { opacity: 1, duration: 0.5, pointerEvents: "auto" });
    } else {
      gsap.to(panelRef.current, { x: 50, opacity: 0, duration: 0.6, ease: "power4.in" });
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.5, pointerEvents: "none" });
    }
  }, [isOpen]);

  return (
    <>
      <div ref={backdropRef} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] opacity-0 pointer-events-none transition-opacity duration-500" />

      <div ref={panelRef} className="fixed top-6 right-6 bottom-6 w-full max-w-[420px] bg-[#120D0A] rounded-[2.5rem] z-[70] shadow-2xl border border-[#2A2421] translate-x-[110%] opacity-0 overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-[#2A2421]/50 bg-[#120D0A]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#FF954F]/10 rounded-xl flex items-center justify-center text-[#FF954F] border border-[#FF954F]/20">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-white font-black uppercase tracking-widest text-sm leading-none">Calibration</h2>
              <p className="text-[10px] font-bold text-[#8E8884] uppercase tracking-tighter mt-1">System Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-[#8E8884] hover:text-[#FF954F] hover:bg-white/5 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">
          
          {/* Section: AI Perception */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#FF954F]">
              <Eye size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">AI Perception</h3>
            </div>
            
            {/* Eye Sensitivity Mapper */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#8E8884] uppercase tracking-widest ml-1">Eye Sensitivity</label>
              <div className="grid grid-cols-3 gap-2 bg-[#1C1714] p-1.5 rounded-2xl border border-[#2A2421]">
                {[
                    { label: "Small", val: 0.20 }, 
                    { label: "Medium", val: 0.25 }, 
                    { label: "Large", val: 0.30 }
                ].map((opt) => (
                  <button 
                    key={opt.label} 
                    onClick={() => { setEyeSensitivity(opt.val); syncToStorage({ eyeSensitivity: opt.val }); }} 
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${eyeSensitivity === opt.val ? "bg-[#FF954F] text-[#120D0A]" : "text-[#8E8884] hover:text-white"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Delay Sliders */}
            <SliderSetting 
                label="Warning Audio Delay" 
                value={warningDelay} 
                min={0.5} max={2.0} 
                unit="s" 
                onChange={(e: any) => { const v = parseFloat(e.target.value); setWarningDelay(v); syncToStorage({ warningDelay: v }); }} 
            />
            <SliderSetting 
                label="SOS Trigger Delay" 
                value={sosDelay} 
                min={2.5} max={5.0} 
                unit="s" 
                onChange={(e: any) => { const v = parseFloat(e.target.value); setSosDelay(v); syncToStorage({ sosDelay: v }); }} 
            />
          </section>

          {/* Section: Audio Alerts */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#FF954F]">
              <Volume2 size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Audio Feedback</h3>
            </div>
            <div className="space-y-3">
              <ToggleSetting 
                label="Master Alarm Beep" 
                checked={alarmEnabled} 
                onClick={() => { setAlarmEnabled(!alarmEnabled); syncToStorage({ alarmEnabled: !alarmEnabled }); }} 
              />
              <ToggleSetting 
                label="AI Voice Assistance" 
                checked={voiceEnabled} 
                onClick={() => { setVoiceEnabled(!voiceEnabled); syncToStorage({ voiceEnabled: !voiceEnabled }); }} 
              />
            </div>
          </section>

          {/* Section: Guardian Network */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#4ADE80]">
                    <UserPlus size={14} />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Guardians</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="px-3 py-1.5 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-lg text-[9px] font-black text-[#4ADE80] uppercase tracking-tighter hover:bg-[#4ADE80] hover:text-[#120D0A] transition-all">+ Add New</button>
            </div>
            <div className="space-y-3">
               {guardians.map((g, i) => (
                 <div key={i} className="flex items-center justify-between bg-[#1C1714] border border-[#2A2421] p-4 rounded-2xl group">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[#120D0A] flex items-center justify-center text-[10px] font-black text-[#FF954F] border border-[#2A2421] uppercase">{g.name.charAt(0)}</div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase">{g.name}</span>
                            <span className="text-[10px] font-bold text-[#8E8884] tracking-widest">+{g.phone}</span>
                        </div>
                    </div>
                    <button onClick={() => removeGuardian(i)} className="p-2 text-[#8E8884] hover:text-[#FF4D4D] transition-colors"><Trash2 size={14}/></button>
                 </div>
               ))}
            </div>
          </section>

          {/* Section: Visuals */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#8E8884]">
              <Monitor size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">HUD Visuals</h3>
            </div>
            <ToggleSetting 
                label="Show Face Mesh" 
                checked={showMesh} 
                onClick={() => { setShowMesh(!showMesh); syncToStorage({ showMesh: !showMesh }); }} 
            />
          </section>

          {/* Section: Maintenance */}
          <section className="space-y-6 pb-12">
            <div className="flex items-center gap-2 text-[#FF4D4D]">
              <RefreshCcw size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Maintenance</h3>
            </div>
            <button onClick={() => { if(window.confirm("RESET EVERYTHING?")) onResetConfig(); }} className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-red-500/20">Wipe System Profile</button>
          </section>
        </div>

        {/* --- ADD GUARDIAN DIALOG --- */}
        {isAddModalOpen && (
          <div className="absolute inset-0 z-[80] bg-[#120D0A]/95 flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="w-full space-y-8">
               <div className="text-center">
                 <div className="w-16 h-16 bg-[#4ADE80]/10 rounded-2xl flex items-center justify-center text-[#4ADE80] mx-auto mb-4 border border-[#4ADE80]/20"><UserPlus size={32}/></div>
                 <h2 className="text-xl font-black uppercase tracking-tighter text-white">Add Guardian</h2>
                 <p className="text-[10px] font-bold text-[#8E8884] uppercase tracking-widest mt-1">Use Pakistani 03 format</p>
               </div>
               <div className="space-y-4">
                  <InputField label="Name" placeholder="Ahmed Ali" value={newGuardian.name} onChange={(e:any) => setNewGuardian({...newGuardian, name: e.target.value})} />
                  <InputField label="WhatsApp Number" placeholder="03XXXXXXXXX" maxLength={11} value={newGuardian.number} onChange={(e:any) => setNewGuardian({...newGuardian, number: e.target.value})} />
                  {inputError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><AlertCircle size={14}/> {inputError}</div>}
                  <div className="flex gap-2 pt-4">
                    <button onClick={() => { setIsAddModalOpen(false); setInputError(""); }} className="flex-1 py-4 border border-[#2A2421] rounded-xl font-black text-[10px] uppercase text-white">Cancel</button>
                    <button onClick={handleAddGuardian} className="flex-[2] py-4 bg-[#4ADE80] text-[#120D0A] rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Save Contact</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2A2421; border-radius: 10px; }
      `}</style>
    </>
  );
}

function InputField({ label, value, onChange, placeholder, maxLength }: any) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-[9px] font-black text-[#8E8884] uppercase tracking-widest ml-1">{label}</label>
        <input type="text" placeholder={placeholder} maxLength={maxLength} value={value} onChange={onChange} className="bg-[#1C1714] border border-[#2A2421] rounded-xl px-4 py-4 text-white text-sm focus:border-[#FF954F] outline-none transition-all font-medium" />
      </div>
    );
}

function SliderSetting({ label, value, min, max, unit = "", onChange }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-black text-[#8E8884] uppercase tracking-widest">{label}</label>
        <span className="text-xs font-black text-white bg-[#1C1714] px-3 py-1 rounded-lg border border-[#2A2421] tabular-nums">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step="0.1" value={value} onChange={onChange} className="w-full h-1 bg-[#2A2421] appearance-none cursor-pointer accent-[#FF954F] rounded-full" />
    </div>
  );
}

function ToggleSetting({ label, checked, onClick, danger }: any) {
  return (
    <div onClick={onClick} className="flex justify-between items-center bg-[#1C1714] rounded-2xl border border-[#2A2421] p-5 cursor-pointer hover:border-[#FF954F]/20 transition-all group">
      <span className="font-black text-white uppercase tracking-tight text-[11px] group-hover:text-[#FF954F] transition-colors">{label}</span>
      <div className={`w-11 h-6 rounded-full relative p-1 transition-all duration-300 ${checked ? (danger ? "bg-[#FF4D4D]" : "bg-[#FF954F]") : "bg-[#2A2421]"}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </div>
  );
}
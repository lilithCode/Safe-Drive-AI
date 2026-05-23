// "use client";

// import React, { useEffect, useRef } from "react";
// import { X, Sliders, Volume2, ShieldAlert, Monitor, Zap, RefreshCcw } from "lucide-react";
// import gsap from "gsap";
// import { useGSAP } from "@gsap/react";

// interface Props {
//   isOpen: boolean;
//   onClose: () => void;
//   onResetConfig: () => void; // New Prop for resetting profile
// }

// export default function SettingsPanel({ isOpen, onClose, onResetConfig }: Props) {
//   const panelRef = useRef<HTMLDivElement>(null);
//   const backdropRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleEsc = (e: KeyboardEvent) => {
//       if (e.key === "Escape") onClose();
//     };
//     window.addEventListener("keydown", handleEsc);
//     return () => window.removeEventListener("keydown", handleEsc);
//   }, [onClose]);

//   useGSAP(() => {
//     if (isOpen) {
//       gsap.to(panelRef.current, { x: 0, opacity: 1, duration: 0.8, ease: "expo.out" });
//       gsap.to(backdropRef.current, { opacity: 1, duration: 0.5, pointerEvents: "auto" });
//     } else {
//       gsap.to(panelRef.current, { x: 50, opacity: 0, duration: 0.6, ease: "power4.in" });
//       gsap.to(backdropRef.current, { opacity: 0, duration: 0.5, pointerEvents: "none" });
//     }
//   }, [isOpen]);

//   return (
//     <>
//       {/* Dimmed Backdrop */}
//       <div 
//         ref={backdropRef}
//         onClick={onClose}
//         className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] opacity-0 pointer-events-none transition-opacity duration-500"
//       />

//       {/* Floating Calibration Card */}
//       <div 
//         ref={panelRef}
//         className="fixed bottom-6 right-6 bottom-6 w-full max-w-[420px] max-h-[85vh] bg-[#120D0A] rounded-[2.5rem] z-[70] shadow-2xl border border-[#2A2421] translate-x-[110%] opacity-0 overflow-hidden flex flex-col"
//       >
//         {/* Header */}
//         <div className="p-8 pb-4 flex items-center justify-between border-b border-[#2A2421]/50 bg-[#120D0A]/80 backdrop-blur-md sticky top-0 z-20">
//           <div className="flex items-center gap-4">
//             <div className="w-10 h-10 bg-[#FF954F]/10 rounded-xl flex items-center justify-center text-[#FF954F] border border-[#FF954F]/20">
//               <Sliders size={20} />
//             </div>
//             <div>
//               <h2 className="text-white font-black uppercase tracking-widest text-sm leading-none">Settings</h2>
//               <p className="text-[10px] font-bold text-[#8E8884] uppercase tracking-tighter mt-1">System Calibration</p>
//             </div>
//           </div>
//           <button 
//             onClick={onClose}
//             className="w-10 h-10 rounded-full flex items-center justify-center text-[#8E8884] hover:text-[#FF954F] hover:bg-white/5 transition-all active:scale-95"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         {/* Scrollable Content */}
//         <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">
          
//           {/* Neural Sensitivity */}
//           <section className="space-y-6">
//             <div className="flex items-center gap-2 text-[#FF954F]">
//               <Zap size={14} />
//               <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Neural sensitivity</h3>
//             </div>
//             <div className="space-y-8">
//               <SliderSetting label="Drowsiness EAR" value={0.25} min={0.1} max={0.4} />
//               <SliderSetting label="Distraction Timeout" value={2.0} min={1.0} max={5.0} unit="s" />
//             </div>
//           </section>

//           {/* Audio Feedback */}
//           <section className="space-y-6">
//             <div className="flex items-center gap-2 text-[#FF954F]">
//               <Volume2 size={14} />
//               <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Audio Feedback</h3>
//             </div>
//             <div className="grid grid-cols-1 gap-3">
//               <ToggleSetting label="Master Alarm" checked={true} />
//               <ToggleSetting label="Voice AI Assistance" checked={true} />
//             </div>
//           </section>

//           {/* Emergency Protocol */}
//           <section className="space-y-6">
//             <div className="flex items-center gap-2 text-[#FF4D4D]">
//               <ShieldAlert size={14} />
//               <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Emergency Protocol</h3>
//             </div>
//             <div className="space-y-3">
//                 <ToggleSetting label="Autonomous SOS Call" checked={false} danger />
//             </div>
//           </section>

//           {/* Display Visuals */}
//           <section className="space-y-6">
//             <div className="flex items-center gap-2 text-[#FF954F]/60">
//               <Monitor size={14} />
//               <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Display Visuals</h3>
//             </div>
//             <div className="grid grid-cols-2 gap-3">
//               <ToggleSetting label="Face Mesh" checked={true} small />
//               <ToggleSetting label="Telemetry" checked={true} small />
//             </div>
//           </section>

//           {/* DANGER ZONE: RESET */}
//           <section className="space-y-6 pb-12">
//             <div className="flex items-center gap-2 text-[#FF4D4D]">
//               <RefreshCcw size={14} />
//               <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">System Reset</h3>
//             </div>
//             <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
//                 <p className="text-[10px] text-red-400 font-bold uppercase tracking-tight leading-relaxed">
//                     Warning: This will clear your name, phone number, and linked WhatsApp session.
//                 </p>
//                 <button 
//                   onClick={() => {
//                       if(window.confirm("ARE YOU SURE? This will restart the setup process.")) {
//                           onResetConfig();
//                       }
//                   }}
//                   className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-red-500/20"
//                 >
//                   Clear System Profile
//                 </button>
//             </div>
//           </section>
//         </div>
//       </div>

//       <style jsx>{`
//         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
//         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
//         .custom-scrollbar::-webkit-scrollbar-thumb { background: #2A2421; border-radius: 10px; }
//       `}</style>
//     </>
//   );
// }

// function SliderSetting({ label, value, min, max, unit = "" }: any) {
//   return (
//     <div className="space-y-4">
//       <div className="flex justify-between items-end">
//         <label className="text-[10px] font-black text-[#8E8884] uppercase tracking-widest">{label}</label>
//         <span className="text-xs font-black text-white tabular-nums bg-[#1C1714] px-3 py-1 rounded-lg border border-[#2A2421]">
//           {value}{unit}
//         </span>
//       </div>
//       <div className="relative h-6 flex items-center">
//         <input 
//           type="range" 
//           min={min} 
//           max={max} 
//           step="0.01"
//           className="w-full h-1 bg-[#2A2421] appearance-none cursor-pointer accent-[#FF954F] rounded-full" 
//         />
//       </div>
//     </div>
//   );
// }

// function ToggleSetting({ label, checked, danger, small }: any) {
//   return (
//     <div className={`flex justify-between items-center bg-[#1C1714] rounded-2xl border border-[#2A2421] transition-all ${small ? "p-3 flex-col gap-3 items-start" : "p-5"}`}>
//       <span className={`font-black text-white uppercase tracking-tight ${small ? "text-[9px]" : "text-[11px]"}`}>{label}</span>
//       <div className={`w-11 h-6 rounded-full relative p-1 cursor-pointer transition-all duration-300 ${checked ? (danger ? "bg-[#FF4D4D]" : "bg-[#FF954F]") : "bg-[#2A2421]"}`}>
//         <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Sliders, Volume2, ShieldAlert, Monitor, Zap, RefreshCcw, UserPlus, Eye, Phone, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResetConfig: () => void;
}

export default function SettingsPanel({ isOpen, onClose, onResetConfig }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // --- STATE MANAGEMENT ---
  const [eyeSize, setEyeSize] = useState("Medium");
  const [sosDelay, setSosDelay] = useState(3.0);
  const [showMesh, setShowMesh] = useState(true);
  
  // Guardian State
  const [guardians, setGuardians] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuardian, setNewGuardian] = useState({ name: "", number: "" });
  const [inputError, setInputError] = useState("");

  // Load existing guardians from LocalStorage
  useEffect(() => {
    const config = localStorage.getItem("safedrive_user_config");
    if (config) {
      const parsed = JSON.parse(config);
      // Ensure guardians is always an array
      setGuardians(parsed.guardians || [{ name: parsed.guardianName, number: parsed.guardianNumber }]);
    }
  }, [isOpen]);

  // --- LOGIC: Pakistan Number Validation & Conversion ---
  const handleAddGuardian = () => {
    const { name, number } = newGuardian;

    if (!name) {
      setInputError("Please enter a name");
      return;
    }

    // 1. Check if starts with 03
    if (!number.startsWith("03")) {
      setInputError("Number must start with '03'");
      return;
    }

    // 2. Check length (standard PK number is 11 digits: 03xx-xxxxxxx)
    if (number.length !== 11) {
      setInputError("Number must be exactly 11 digits");
      return;
    }

    // 3. Convert 03... to 923...
    const formattedNumber = "92" + number.substring(1);

    const updatedList = [...guardians, { name, number: formattedNumber }];
    setGuardians(updatedList);

    // Save to LocalStorage
    const config = JSON.parse(localStorage.getItem("safedrive_user_config") || "{}");
    localStorage.setItem("safedrive_user_config", JSON.stringify({ ...config, guardians: updatedList }));

    // Reset and Close
    setNewGuardian({ name: "", number: "" });
    setInputError("");
    setIsAddModalOpen(false);
  };

  const removeGuardian = (index: number) => {
    const updatedList = guardians.filter((_, i) => i !== index);
    setGuardians(updatedList);
    const config = JSON.parse(localStorage.getItem("safedrive_user_config") || "{}");
    localStorage.setItem("safedrive_user_config", JSON.stringify({ ...config, guardians: updatedList }));
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
      {/* Backdrop */}
      <div ref={backdropRef} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] opacity-0 pointer-events-none transition-opacity duration-500" />

      {/* Main Side Panel */}
      <div ref={panelRef} className="fixed top-6 right-6 bottom-6 w-full max-w-[420px] bg-[#120D0A] rounded-[2.5rem] z-[70] shadow-2xl border border-[#2A2421] translate-x-[110%] opacity-0 overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-[#2A2421]/50 bg-[#120D0A]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#FF954F]/10 rounded-xl flex items-center justify-center text-[#FF954F] border border-[#FF954F]/20">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-white font-black uppercase tracking-widest text-sm leading-none">Settings</h2>
              <p className="text-[10px] font-bold text-[#8E8884] uppercase tracking-tighter mt-1">System Calibration</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-[#8E8884] hover:text-[#FF954F] hover:bg-white/5 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">
          
          {/* AI Perception */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#FF954F]">
              <Eye size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">AI Perception</h3>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#8E8884] uppercase tracking-widest ml-1">Sensitivity Profile</label>
              <div className="grid grid-cols-3 gap-2 bg-[#1C1714] p-1.5 rounded-2xl border border-[#2A2421]">
                {["Small", "Medium", "Large"].map((size) => (
                  <button key={size} onClick={() => setEyeSize(size)} className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${eyeSize === size ? "bg-[#FF954F] text-[#120D0A]" : "text-[#8E8884] hover:text-white"}`}>{size}</button>
                ))}
              </div>
            </div>
            <SliderSetting label="SOS Automation Delay" value={sosDelay} min={1.0} max={10.0} unit="s" onChange={(e: any) => setSosDelay(parseFloat(e.target.value))} />
          </section>

          {/* Audio & Alerts */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#FF954F]">
              <Volume2 size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Audio & Alerts</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <ToggleSetting label="Master Alarm Beep" checked={true} />
              <ToggleSetting label="AI Voice Assistance" checked={true} />
            </div>
          </section>

          {/* Guardian Network */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#4ADE80]">
                    <UserPlus size={14} />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Guardian Network</h3>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3 py-1 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-lg text-[9px] font-black text-[#4ADE80] uppercase tracking-tighter hover:bg-[#4ADE80] hover:text-[#120D0A] transition-all"
                >
                  + Add New
                </button>
            </div>

            <div className="space-y-3">
               {guardians.map((g, i) => (
                 <div key={i} className="flex items-center justify-between bg-[#1C1714] border border-[#2A2421] p-4 rounded-2xl group">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[#120D0A] flex items-center justify-center text-[10px] font-black text-white border border-[#2A2421]">{g.name.charAt(0)}</div>
                        <div>
                            <p className="text-xs font-bold text-white">{g.name}</p>
                            <p className="text-[10px] font-bold text-[#8E8884] tracking-widest">+{g.number}</p>
                        </div>
                    </div>
                    <button onClick={() => removeGuardian(i)} className="p-2 text-[#8E8884] hover:text-[#FF4D4D] transition-colors"><Trash2 size={14}/></button>
                 </div>
               ))}
            </div>
          </section>

          {/* Visuals */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#8E8884]">
              <Monitor size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Display visuals</h3>
            </div>
            <ToggleSetting label="Show Face Mesh in HUD" checked={showMesh} onClick={() => setShowMesh(!showMesh)} />
          </section>

          {/* Reset */}
          <section className="space-y-6 pb-12">
            <div className="flex items-center gap-2 text-[#FF4D4D]">
              <RefreshCcw size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Maintenance</h3>
            </div>
            <button onClick={() => { if(window.confirm("RESET SYSTEM?")) onResetConfig(); }} className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20">Clear System Profile</button>
          </section>
        </div>

        {/* --- NESTED ADD GUARDIAN DIALOG --- */}
        {isAddModalOpen && (
          <div className="absolute inset-0 z-[80] bg-[#120D0A]/95 flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="w-full space-y-8">
               <div className="text-center">
                 <div className="w-16 h-16 bg-[#4ADE80]/10 rounded-2xl flex items-center justify-center text-[#4ADE80] mx-auto mb-4 border border-[#4ADE80]/20"><UserPlus size={32}/></div>
                 <h2 className="text-xl font-black uppercase tracking-tighter text-white">Add Guardian</h2>
                 <p className="text-[10px] font-bold text-[#8E8884] uppercase tracking-widest mt-1 text-center">Use Pakistani 03 format</p>
               </div>

               <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-[#8E8884] uppercase tracking-widest">Guardian Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ahmed Tahir" 
                      value={newGuardian.name}
                      onChange={(e) => setNewGuardian({...newGuardian, name: e.target.value})}
                      className="w-full bg-[#1C1714] border border-[#2A2421] rounded-xl px-4 py-4 text-white text-sm focus:border-[#FF954F] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-[#8E8884] uppercase tracking-widest">WhatsApp Number (e.g. 03001234567)</label>
                    <input 
                      type="text" 
                      placeholder="03xxxxxxxxxx" 
                      maxLength={11}
                      value={newGuardian.number}
                      onChange={(e) => setNewGuardian({...newGuardian, number: e.target.value})}
                      className="w-full bg-[#1C1714] border border-[#2A2421] rounded-xl px-4 py-4 text-white text-sm focus:border-[#FF954F] outline-none tracking-[0.2em]"
                    />
                  </div>

                  {inputError && (
                    <div className="flex items-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/5 p-3 rounded-lg border border-red-500/20">
                        <AlertCircle size={14}/> {inputError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button onClick={() => { setIsAddModalOpen(false); setInputError(""); }} className="flex-1 py-4 border border-[#2A2421] rounded-xl font-black text-[10px] uppercase tracking-widest text-white">Cancel</button>
                    <button onClick={handleAddGuardian} className="flex-[2] py-4 bg-[#4ADE80] text-[#120D0A] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Add Guardian</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Sub-components
function SliderSetting({ label, value, min, max, unit = "", onChange }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-black text-[#8E8884] uppercase tracking-widest">{label}</label>
        <span className="text-xs font-black text-white bg-[#1C1714] px-3 py-1 rounded-lg border border-[#2A2421]">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step="0.1" value={value} onChange={onChange} className="w-full h-1 bg-[#2A2421] appearance-none cursor-pointer accent-[#FF954F] rounded-full" />
    </div>
  );
}

function ToggleSetting({ label, checked, onClick, danger }: any) {
  return (
    <div onClick={onClick} className="flex justify-between items-center bg-[#1C1714] rounded-2xl border border-[#2A2421] p-5 cursor-pointer hover:border-[#FF954F]/20 transition-all">
      <span className="font-black text-white uppercase tracking-tight text-[11px]">{label}</span>
      <div className={`w-11 h-6 rounded-full relative p-1 transition-all duration-300 ${checked ? (danger ? "bg-[#FF4D4D]" : "bg-[#FF954F]") : "bg-[#2A2421]"}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </div>
  );
}
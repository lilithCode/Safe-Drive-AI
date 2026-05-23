"use client";

import React, { useState, useEffect } from "react";
import { User, Shield, CheckCircle2, Loader2, QrCode, Server, Smartphone, Plus, Trash2, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  onComplete: (data: any) => void;
}

export default function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0); 
  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState("INITIALIZING");
  const [errorMessage, setErrorMessage] = useState("");
  
const [formData, setFormData] = useState({
  senderMode: "SYSTEM", 
  driverName: "",
  driverNumber: "",
  guardians: [{ name: "", phone: "" }], 
  alarmEnabled: true, // Default to ON
  voiceEnabled: true  // Default to ON
});
  // --- VALIDATION HELPERS ---
  const isValidPKNumber = (num: string) => num.startsWith("03") && num.length === 11;

  const formatToInternational = (num: string) => {
    if (num.startsWith("0")) return "92" + num.substring(1);
    return num;
  };

  // --- LOGIC: NEXT STEPS & SAVING ---
  const handleGoToStep2 = () => {
    if (!isValidPKNumber(formData.driverNumber)) {
        setErrorMessage("Driver number must be 11 digits starting with 03");
        return;
    }
    setErrorMessage("");
    setStep(2);
  };

  const handleFinalize = () => {
    // 1. Format the driver number
    const formattedDriver = formatToInternational(formData.driverNumber);
    
    // 2. Format all guardian numbers
    const formattedGuardians = formData.guardians.map(g => ({
        ...g,
        phone: formatToInternational(g.phone)
    }));

    const finalData = {
        ...formData,
        driverNumber: formattedDriver,
        guardians: formattedGuardians
    };

    localStorage.setItem("safedrive_user_config", JSON.stringify(finalData));
    
    if (formData.senderMode === "SYSTEM") {
        onComplete(finalData);
    } else {
        setStep(3); // Go to QR scan
    }
  };

  useEffect(() => {
    if (step === 3 && formData.senderMode === "PERSONAL" && formData.driverNumber) {
      // Use the already formatted number for the bridge ID
      const formattedID = formatToInternational(formData.driverNumber);
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:3001/get-qr?id=${formattedID}`);
          const data = await res.json();
          setQrCode(data.qr);
          setStatus(data.status);

          if (data.status === "CONNECTED") {
            clearInterval(interval);
            setTimeout(() => onComplete(JSON.parse(localStorage.getItem("safedrive_user_config")!)), 1500);
          }
        } catch (e) { console.error("Bridge unreachable"); }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // --- DYNAMIC FIELD HANDLERS ---
  const handleGuardianChange = (index: number, key: "name" | "phone", value: string) => {
    const updatedGuardians = [...formData.guardians];
    updatedGuardians[index][key] = value;
    setFormData({ ...formData, guardians: updatedGuardians });
  };

  const addGuardianField = () => {
    setFormData({ ...formData, guardians: [...formData.guardians, { name: "", phone: "" }] });
  };

  const removeGuardianField = (index: number) => {
    if (formData.guardians.length === 1) return;
    setFormData({ ...formData, guardians: formData.guardians.filter((_, i) => i !== index) });
  };

  const isStep1Valid = formData.driverName.trim() !== "" && isValidPKNumber(formData.driverNumber);
  const isStep2Valid = formData.guardians.every(g => g.name.trim() !== "" && isValidPKNumber(g.phone));

  return (
    <div className="fixed inset-0 z-[100] bg-[#120D0A] flex items-center justify-center p-4 font-sans overflow-y-auto">
      <div className="bg-[#1C1714] border border-[#2A2421] w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-auto max-h-[95vh] flex flex-col transition-all">

        {/* STEP 0: SENDER MODE */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-[#FF954F]">Transmission</h2>
              <p className="text-[#8E8884] text-[10px] font-bold uppercase mt-2 tracking-widest">Select your alert protocol</p>
            </div>
            <div className="grid gap-3">
              <button onClick={() => { setFormData({...formData, senderMode: "SYSTEM"}); setStep(1); }} className="flex items-center gap-4 p-5 bg-[#120D0A] border border-[#2A2421] rounded-2xl hover:border-[#FF954F] transition-all text-left group">
                <div className="p-3 bg-[#FF954F]/10 rounded-xl text-[#FF954F] group-hover:scale-110 transition-transform"><Server size={24}/></div>
                <div><h3 className="font-bold text-sm">System Number</h3><p className="text-[9px] text-[#8E8884] uppercase font-bold tracking-tight">Standard SafeDrive Bridge</p></div>
              </button>
              <button onClick={() => { setFormData({...formData, senderMode: "PERSONAL"}); setStep(1); }} className="flex items-center gap-4 p-5 bg-[#120D0A] border border-[#2A2421] rounded-2xl hover:border-[#FF954F] transition-all text-left group">
                <div className="p-3 bg-[#FF954F]/10 rounded-xl text-[#FF954F] group-hover:scale-110 transition-transform"><Smartphone size={24}/></div>
                <div><h3 className="font-bold text-sm">Personal Link</h3><p className="text-[9px] text-[#8E8884] uppercase font-bold tracking-tight">Private Identity Connection</p></div>
              </button>
            </div>
          </div>
        )}

        {/* COMMON HEADER */}
        {step > 0 && (
            <div className="text-center mb-5 shrink-0 animate-in fade-in">
                <div className="w-14 h-14 bg-[#FF954F]/10 rounded-2xl flex items-center justify-center text-[#FF954F] mx-auto mb-3 border border-[#FF954F]/20">
                    {step === 1 ? <User size={28} /> : step === 2 ? <Shield size={28} /> : <QrCode size={28} />}
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter">
                    {step === 1 ? "Driver Profile" : step === 2 ? "Emergency Circle" : "Link Account"}
                </h2>
            </div>
        )}

        {/* STEP 1: DRIVER INFO */}
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right">
            <InputField label="Full Name" value={formData.driverName} onChange={(v: any) => setFormData({ ...formData, driverName: v })} />
            <InputField label="WhatsApp Number (03xxxxxxxxx)" placeholder="03211234567" value={formData.driverNumber} onChange={(v: any) => setFormData({ ...formData, driverNumber: v })} />
            
            {formData.driverNumber.length > 0 && !isValidPKNumber(formData.driverNumber) && (
                <p className="text-[9px] text-orange-400 font-bold uppercase flex items-center gap-1"><AlertCircle size={12}/> Must be 11 digits starting with 03</p>
            )}

            <button onClick={handleGoToStep2} disabled={!isStep1Valid} className="w-full py-4 bg-[#FF954F] text-[#120D0A] rounded-xl font-black text-xs uppercase tracking-widest mt-4 disabled:opacity-20 transition-all">Continue</button>
          </div>
        )}

        {/* STEP 2: GUARDIAN LIST */}
        {step === 2 && (
          <div className="flex flex-col flex-1 overflow-hidden animate-in slide-in-from-right">
            <div className="space-y-5 overflow-y-auto flex-1 pr-1 max-h-[40vh] custom-setup-scrollbar">
              {formData.guardians.map((guardian, index) => (
                <div key={index} className="p-4 bg-[#120D0A] border border-[#2A2421] rounded-2xl relative space-y-3">
                  {formData.guardians.length > 1 && (
                    <button onClick={() => removeGuardianField(index)} className="absolute top-3 right-3 text-[#8E8884] hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                  )}
                  <div className="text-[9px] font-black text-[#FF954F] opacity-60 uppercase tracking-wider">Contact #{index + 1}</div>
                  <InputField label="Name" value={guardian.name} onChange={(v: any) => handleGuardianChange(index, "name", v)} />
                  <InputField label="WhatsApp (03xxxxxxxxx)" placeholder="03xxxxxxxxx" value={guardian.phone} onChange={(v: any) => handleGuardianChange(index, "phone", v)} />
                </div>
              ))}
            </div>

            <button onClick={addGuardianField} className="mt-3 w-full py-2.5 border border-dashed border-[#2A2421] text-[#FF954F] bg-[#FF954F]/5 rounded-xl text-xs font-bold uppercase hover:bg-[#FF954F]/10 transition-all shrink-0">+ Add Extra Guardian</button>

            <div className="flex gap-2 mt-5 shrink-0">
                <button onClick={() => setStep(1)} className="flex-1 py-4 border border-[#2A2421] text-white rounded-xl font-black text-xs uppercase">Back</button>
                <button onClick={handleFinalize} disabled={!isStep2Valid} className="flex-[2] py-4 bg-[#4ADE80] text-[#120D0A] rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-20 transition-all">
                    {formData.senderMode === "SYSTEM" ? "Finish Setup" : "Next: Link WA"}
                </button>
            </div>
          </div>
        )}

        {/* STEP 3: QR CODE */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center space-y-6 animate-in zoom-in">
            <div className="p-4 bg-white rounded-2xl shadow-xl shrink-0">
              {qrCode ? <QRCodeSVG value={qrCode} size={200} /> : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-zinc-100 rounded-xl text-zinc-400">
                  {status === "CONNECTED" ? <CheckCircle2 size={48} className="text-green-500 animate-bounce" /> : <Loader2 size={40} className="animate-spin" />}
                </div>
              )}
            </div>
            <div className="py-2 px-4 bg-[#120D0A] rounded-full border border-[#2A2421] shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF954F]">Status: {status.replace(/_/g, " ")}</span>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-setup-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-setup-scrollbar::-webkit-scrollbar-thumb { background: #2A2421; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: any) {
  return (
    <div className="flex flex-col gap-1.5 text-left w-full">
      <label className="text-[8px] font-black text-[#8E8884] uppercase tracking-widest ml-0.5">{label}</label>
      <input 
        type="text" 
        value={value} 
        placeholder={placeholder} 
        maxLength={11}
        onChange={(e) => onChange(e.target.value)} 
        className="bg-[#120D0A] border border-[#2A2421] rounded-xl px-3.5 py-3 text-white text-xs focus:outline-none focus:border-[#FF954F] transition-all w-full font-medium tracking-widest" 
      />
    </div>
  );
}
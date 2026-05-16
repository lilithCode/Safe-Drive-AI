"use client";

import React, { useState, useEffect } from "react";
import { User, Shield, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  onComplete: (data: any) => void;
}

export default function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState("INITIALIZING");
  const [formData, setFormData] = useState({
    driverName: "",
    driverNumber: "",
    guardianName: "",
    guardianNumber: "",
  });

  // Polling logic: Ask bridge for QR associated with THIS driver's number
  useEffect(() => {
    if (step === 3 && formData.driverNumber) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:3001/get-qr?id=${formData.driverNumber}`);
          const data = await res.json();
          setQrCode(data.qr);
          setStatus(data.status);

          if (data.status === "CONNECTED") {
            clearInterval(interval);
            setTimeout(handleSave, 1500);
          }
        } catch (e) { console.error("Bridge unreachable"); }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step, formData.driverNumber]);

  const handleSave = () => {
    localStorage.setItem("safedrive_user_config", JSON.stringify(formData));
    onComplete(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#120D0A] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#1C1714] border border-[#2A2421] w-full max-w-md rounded-3xl p-8 shadow-2xl text-white">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF954F]/10 rounded-2xl flex items-center justify-center text-[#FF954F] mx-auto mb-4 border border-[#FF954F]/20">
            {step === 1 ? <User size={32} /> : step === 2 ? <Shield size={32} /> : <QrCode size={32} />}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            {step === 1 ? "Driver Profile" : step === 2 ? "Guardian Info" : "Link WhatsApp"}
          </h2>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <InputField label="Full Name" value={formData.driverName} onChange={(v:any) => setFormData({...formData, driverName: v})} />
            <InputField label="Your Phone (WhatsApp)" placeholder="923XXXXXXXXX" value={formData.driverNumber} onChange={(v:any) => setFormData({...formData, driverNumber: v})} />
            <button onClick={() => setStep(2)} disabled={!formData.driverName || !formData.driverNumber} className="w-full py-4 bg-[#FF954F] text-[#120D0A] rounded-xl font-black text-xs uppercase tracking-widest mt-4">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <InputField label="Guardian Name" value={formData.guardianName} onChange={(v:any) => setFormData({...formData, guardianName: v})} />
            <InputField label="Guardian WhatsApp" placeholder="923XXXXXXXXX" value={formData.guardianNumber} onChange={(v:any) => setFormData({...formData, guardianNumber: v})} />
            <button onClick={() => setStep(3)} disabled={!formData.guardianName || !formData.guardianNumber} className="w-full py-4 bg-[#FF954F] text-[#120D0A] rounded-xl font-black text-xs uppercase tracking-widest mt-4">Generate Link Code</button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-white rounded-2xl">
              {qrCode ? <QRCodeSVG value={qrCode} size={200} /> : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-zinc-100 rounded-xl text-zinc-400">
                  {status === "CONNECTED" ? <CheckCircle2 size={48} className="text-green-500 animate-bounce" /> : <Loader2 size={40} className="animate-spin" />}
                </div>
              )}
            </div>
            <div className="py-2 px-4 bg-[#120D0A] rounded-full border border-[#2A2421]">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF954F]">Status: {status.replace(/_/g, " ")}</span>
            </div>
            {status === "CONNECTED" && <p className="text-[#4ADE80] text-sm font-bold animate-pulse">Device Linked Successfully!</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: any) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <label className="text-[9px] font-black text-[#8E8884] uppercase tracking-widest ml-1">{label}</label>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="bg-[#120D0A] border border-[#2A2421] rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:border-[#FF954F]" />
    </div>
  );
}
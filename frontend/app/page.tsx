"use client";

import React, { useEffect, useRef, useState, memo, useCallback } from "react";
import Webcam from "react-webcam";
import { AIResponse } from "../types";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ShieldAlert, X, Send, CheckCircle } from "lucide-react";

import Header from "../components/Header";
import VideoFeed from "../components/VideoFeed";
import SafetyScore from "../components/SafetyScore";
import DetectionStatus from "../components/DetectionStatus";
import AlertHistory from "../components/AlertHistory";
import EmergencyContacts from "../components/EmergencyContacts";
import StartScreen from "../components/StartScreen";
import SettingsPanel from "../components/SettingsPanel";
import SetupWizard from "../components/SetupWizard";
import { useAudio } from "../hooks/useAudio"; 

const MemoHeader = memo(Header);
const MemoVideoFeed = memo(VideoFeed);
const MemoSafetyScore = memo(SafetyScore);
const MemoDetectionStatus = memo(DetectionStatus);
const MemoAlertHistory = memo(AlertHistory);
const MemoEmergencyContacts = memo(EmergencyContacts);

export default function Dashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);


const { playAlarm, speak } = useAudio();
const lastVoiceAlertRef = useRef<number>(0);
const VOICE_COOLDOWN = 5000;

const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
const drowsyTimerRef = useRef<NodeJS.Timeout | null>(null);

const isAutoSOSTriggered = useRef(false);
const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
const driveStartTime = useRef<number>(Date.now());

  // --- CORE STATE ---
  const [appState, setAppState] = useState<"IDLE" | "INITIALIZING" | "READY" | "DRIVING">("IDLE");
  const [isEmergency, setIsEmergency] = useState(false);
  const [nerdMode, setNerdMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [safetyScore, setSafetyScore] = useState(100);
  const [alertsToday, setAlertsToday] = useState(0);
  const [driveTime, setDriveTime] = useState(0); 
  const [alertLogs, setAlertLogs] = useState<any[]>([]);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);

  const [userConfig, setUserConfig] = useState<any>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  // --- 1. CONFIG LOADER & HYDRATION ---
  const refreshConfig = useCallback(() => {
    const savedConfig = localStorage.getItem("safedrive_user_config");
    if (savedConfig) {
      let parsed = JSON.parse(savedConfig);
      
      // Safety Hydration: Ensure new timer keys exist
      let needsUpdate = false;
      if (parsed.alarmEnabled === undefined) { parsed.alarmEnabled = true; needsUpdate = true; }
      if (parsed.voiceEnabled === undefined) { parsed.voiceEnabled = true; needsUpdate = true; }
      if (parsed.warningDelay === undefined) { parsed.warningDelay = 1.5; needsUpdate = true; }
      if (parsed.sosDelay === undefined) { parsed.sosDelay = 3.5; needsUpdate = true; }
      
      if (needsUpdate) localStorage.setItem("safedrive_user_config", JSON.stringify(parsed));
      
      setUserConfig(parsed);
      setNeedsSetup(false);
    } else {
      setNeedsSetup(true);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
    const savedLogs = localStorage.getItem("safedrive_alert_logs");
    if (savedLogs) setAlertLogs(JSON.parse(savedLogs));
  }, [refreshConfig]);

  const addLog = useCallback((title: string, desc: string, type: "critical" | "warning") => {
    setAlertLogs((prev) => {
      const newLog = { id: Date.now(), time: new Date().toLocaleTimeString(), title, desc, type };
      const updated = [newLog, ...prev].slice(0, 50);
      localStorage.setItem("safedrive_alert_logs", JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    if (appState !== "DRIVING") return;
    const interval = setInterval(() => {
      setDriveTime(Math.floor((Date.now() - driveStartTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [appState]);

  // --- 2. SOS EXECUTION ---
  const executeSOS = useCallback(async (targetPhone?: string) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSosCountdown(null);
    setIsEmergency(true);
    
    addLog("SOS EXECUTED", "Sequential emergency packets initiated.", "critical");
    if (userConfig?.voiceEnabled) speak("Emergency sequence confirmed. Alerting guardians.");

    if (!userConfig) return;
    const activeId = userConfig.senderMode === "SYSTEM" ? "SYSTEM_ADMIN" : userConfig.driverNumber;
    const targetList = targetPhone ? [targetPhone] : userConfig.guardians.map((g: any) => g.phone);

    const sendPacketToTarget = async (phone: string, isFollowUp: boolean, lat: number | null, lng: number | null, video: string | null) => {
      const screenshot = webcamRef.current?.getScreenshot();
      try {
        await fetch("http://localhost:8000/api/sos/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeId,
            latitude: lat,
            longitude: lng,
            guardian_number: phone,
            driver_name: userConfig.driverName,
            image: !video ? screenshot : null,
            video: video,
            is_follow_up: isFollowUp
          }),
        });
      } catch (error) { console.error(`SOS failed for ${phone}`, error); }
    };

    const stream = (webcamRef.current?.video as any)?.srcObject as MediaStream;
    if (stream) {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const capturedVideo = reader.result as string;
          for (const phone of targetList) {
             await sendPacketToTarget(phone, true, null, null, capturedVideo);
          }
        };
      };
      mediaRecorder.start();
      setTimeout(() => { if(mediaRecorder.state !== "inactive") mediaRecorder.stop() }, 5000);
    }

    // Geolocation & Sequential Chain
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          for (const phone of targetList) {
            await sendPacketToTarget(phone, false, lat, lng, null); // Initial
            setTimeout(() => sendPacketToTarget(phone, true, null, null, null), 5000); 
            setTimeout(() => sendPacketToTarget(phone, true, null, null, null), 10000);
          }
        },
        async () => {
          for (const phone of targetList) {
            await sendPacketToTarget(phone, false, null, null, null);
            setTimeout(() => sendPacketToTarget(phone, true, null, null, null), 5000);
          }
        }
      );
    }
  }, [userConfig, addLog, speak]);

  const triggerSOS = useCallback((type: "AI" | "MANUAL", targetPhone?: string) => {
    if (isEmergency || sosCountdown !== null) return;
    if (type === "MANUAL") executeSOS(targetPhone);
    else {
      setSosCountdown(5);
      if (userConfig?.voiceEnabled) speak("Critical alert! Initializing emergency sequence.");
      countdownIntervalRef.current = setInterval(() => {
        setSosCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) { executeSOS(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isEmergency, sosCountdown, executeSOS, speak, userConfig]);

  // --- 3. RECOVERY ---
  const resetEmergency = () => {
    setIsEmergency(false);
    isAutoSOSTriggered.current = false;
    setSosCountdown(null);
    setSafetyScore(100);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (userConfig?.voiceEnabled) speak("Safety mode resumed.");
  };

  const cancelPendingAISOS = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSosCountdown(null);
    isAutoSOSTriggered.current = false;
    addLog("SOS ABORTED", "Driver dismissed the AI alert.", "warning");
  };

  // --- 4. AI WEBSOCKET & PERSISTENCE ENGINE ---
useGSAP(() => {
  const targets = document.querySelectorAll(".dashboard-animate");
  if (targets.length === 0) return; 

  gsap.set(".dashboard-animate", { opacity: 0, y: 20 });
  gsap.to(".dashboard-animate", { 
    opacity: 1, 
    y: 0, 
    stagger: 0.06, 
    ease: "power2.out", 
    duration: 0.8 
  });
}, { dependencies: [appState], scope: containerRef });

  useEffect(() => {
    if (appState !== "DRIVING" || isEmergency) return;
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/video");
    wsRef.current = ws;
    const sendNextFrame = () => {
      if (webcamRef.current && ws.readyState === WebSocket.OPEN) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) ws.send(imageSrc);
        setTimeout(sendNextFrame, 180);
      }
    };
    ws.onopen = () => { setIsConnected(true); sendNextFrame(); };
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      try {
        const rawData: AIResponse = JSON.parse(event.data);
        setAiData(rawData);
        
        setSafetyScore(prev => {
            let p = 0;
            if (rawData.drowsy) p += 4;
            if (rawData.phone_detected) p += 4;
            if (rawData.head_distracted) p += 1.5;
            if (p > 0) return Math.max(0, prev - p);
            return Math.min(100, prev + 0.3);
        });

        // --- PERSISTENCE & TIMING ENGINE ---
        const warnDelay = (userConfig?.warningDelay || 1.5) * 1000;
        const sosDelay = (userConfig?.sosDelay || 3.5) * 1000;
        const now = Date.now();
        const canSpeak = now - lastVoiceAlertRef.current > VOICE_COOLDOWN;
if (rawData.drowsy && !drowsyTimerRef.current) {
  addLog("Drowsiness", "Eyelid closure detected.", "warning");
}

if (rawData.phone_detected && !warningTimerRef.current) {
  addLog("Mobile Usage", "Distraction via handheld device.", "critical");
}

        if (rawData.drowsy || rawData.phone_detected || rawData.head_distracted) {
            // A. Handle Warning (Audio)
            if (!warningTimerRef.current) {
                warningTimerRef.current = setTimeout(() => {
                    if (rawData.drowsy && userConfig?.alarmEnabled) playAlarm();
                    if (canSpeak && userConfig?.voiceEnabled) {
                        speak(rawData.drowsy ? "Wake up!" : "Look at the road!");
                        lastVoiceAlertRef.current = now;
                    }
                    addLog("Distraction", "Persistence threshold met.", "warning");
                }, warnDelay);
            }

            // B. Handle SOS Trigger (Only for sleep or mobile)
            const isCritical = rawData.drowsy || rawData.phone_detected;
            if (isCritical && !isAutoSOSTriggered.current && !sosCountdown) {
                if (!drowsyTimerRef.current) {
                    drowsyTimerRef.current = setTimeout(() => {
                        isAutoSOSTriggered.current = true;
                        triggerSOS("AI");
                    }, sosDelay);
                }
            }
        } else {
            // C. RESET TIMERS (Blink Safety)
            if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
            if (drowsyTimerRef.current) { clearTimeout(drowsyTimerRef.current); drowsyTimerRef.current = null; }
        }

      } catch (err) { console.error(err); }
    };
    return () => { 
        if (wsRef.current) wsRef.current.close(); 
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (drowsyTimerRef.current) clearTimeout(drowsyTimerRef.current);
    };
  }, [appState, isEmergency, triggerSOS, sosCountdown, addLog, playAlarm, speak, userConfig]);

  if (needsSetup) return <SetupWizard onComplete={(data) => { setUserConfig(data); setNeedsSetup(false); }} />;
  if (appState !== "DRIVING") return <StartScreen appState={appState} onInitialize={() => { setAppState("INITIALIZING"); setTimeout(() => setAppState("READY"), 1500); }} onStart={() => setAppState("DRIVING")} />;

  return (
    <div ref={containerRef} className="h-screen bg-[var(--background)] text-white p-4 overflow-hidden flex flex-col font-sans">
      <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col">
        <MemoHeader isConnected={isConnected} isEmergency={isEmergency} onOpenSettings={() => setIsSettingsOpen(true)} onOpenAnalytics={() => setIsHistoryOpen(true)} nerdMode={nerdMode} setNerdMode={setNerdMode} isModalOpen={isHistoryOpen} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 mt-4">
          <div className={`${nerdMode ? "lg:col-span-8" : "lg:col-span-9"} flex flex-col gap-4 min-h-0 transition-all duration-500`}>
            <div className="flex-1 rounded-[2.5rem] bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden relative transform-gpu">
              <MemoVideoFeed webcamRef={webcamRef} canvasRef={canvasRef} aiData={aiData} isEmergency={isEmergency} alertsToday={alertsToday} driveTime={driveTime} safetyScore={safetyScore} nerdMode={nerdMode} />
              {isEmergency && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-50 animate-in fade-in">
                  <button onClick={resetEmergency} className="group flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full font-black uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all"><CheckCircle className="text-green-600 w-6 h-6"/> I am Safe - Resume AI</button>
                </div>
              )}
            </div>
            {!nerdMode ? <MemoDetectionStatus aiData={aiData} nerdMode={false} /> : (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-5 h-40 overflow-hidden shadow-2xl">
                    <MemoAlertHistory logs={alertLogs.slice(0, 3)} />
                </div>
            )}
          </div>

          <div className={`${nerdMode ? "lg:col-span-4" : "lg:col-span-3"} flex flex-col gap-4 min-h-0 overflow-y-auto pr-1 custom-scrollbar transition-all duration-500`}>
            <MemoSafetyScore score={safetyScore} nerdMode={nerdMode} />
            {nerdMode && <div className="animate-in slide-in-from-right duration-500"><MemoDetectionStatus aiData={aiData} nerdMode={true} /></div>}
            <MemoEmergencyContacts isEmergency={isEmergency} onTriggerSOS={(phone) => triggerSOS("MANUAL", phone)} userConfig={userConfig} />
          </div>
        </div>

        {sosCountdown !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[var(--card)] border-2 border-[var(--alert)] w-full max-w-lg rounded-[3rem] p-10 text-center relative overflow-hidden shadow-2xl font-sans">
                <div className="relative z-10">
                    <div className="p-4 bg-[var(--alert)]/10 rounded-full text-[var(--alert)] w-fit mx-auto mb-6 animate-bounce"><ShieldAlert size={56} /></div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">AI ALERT DETECTED</h2>
                    <div className="text-9xl font-black text-white tabular-nums my-10">{sosCountdown}</div>
                    <div className="flex gap-4">
                      <button onClick={cancelPendingAISOS} className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-white hover:bg-white/10 transition-colors">Abort</button>
                      <button onClick={() => executeSOS()} className="flex-1 py-5 bg-[var(--alert)] text-white rounded-2xl font-black uppercase shadow-xl hover:bg-red-600 transition-colors">Send Now</button>
                    </div>
                </div>
            </div>
          </div>
        )}

        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} refreshConfig={refreshConfig} onResetConfig={() => { localStorage.clear(); window.location.reload(); }} />
        {isHistoryOpen && <HistoryModalWrapper logs={alertLogs} onClose={() => setIsHistoryOpen(false)} />}
      </div>
    </div>
  );
}

function HistoryModalWrapper({ logs, onClose }: { logs: any[]; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    tl.fromTo(modalRef.current, { opacity: 0, scale: 0.93, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.5)" }, "-=0.15");
  }, { scope: modalRef });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div ref={backdropRef} className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={modalRef} className="relative w-full max-w-4xl h-[80vh] bg-[var(--card)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl z-10 flex flex-col overflow-hidden font-sans">
        <button onClick={onClose} className="absolute top-4 right-4 text-[10px] font-black uppercase text-[var(--text-secondary)] hover:text-white transition-colors">✕ Close Terminal</button>
        <div className="flex-1 w-full h-full overflow-hidden mt-8"><MemoAlertHistory logs={logs} isModalView={true} /></div>
      </div>
    </div>
  );
}
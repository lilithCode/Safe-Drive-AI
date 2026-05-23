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

  // --- PERSISTENCE & AUTO-SOS REFS ---
  const drowsyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoSOSTriggered = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const driveStartTime = useRef<number>(Date.now());

  // --- CORE STATE ---
  // This must be declared BEFORE any useEffects
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

  const [userConfig, setUserConfig] = useState<any>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  // 1. Load configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem("safedrive_user_config");
    if (savedConfig) setUserConfig(JSON.parse(savedConfig));
    else setNeedsSetup(true);
  }, []);

  // 2. Timer Logic (This was causing your error - now appState is defined above)
  useEffect(() => {
    if (appState !== "DRIVING") return;
    driveStartTime.current = Date.now();
    const interval = setInterval(() => {
      setDriveTime(Math.floor((Date.now() - driveStartTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [appState]);

  // --- SOS EXECUTION ---
  const executeSOS = useCallback(async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSosCountdown(null);
    setIsEmergency(true);

    if (!userConfig) return;
    const activeId = userConfig.senderMode === "SYSTEM" ? "SYSTEM_ADMIN" : userConfig.driverNumber;

    const sendPacket = async (isFollowUp: boolean, lat: number | null = null, lng: number | null = null, videoBlob: string | null = null) => {
      const screenshot = webcamRef.current?.getScreenshot();
      try {
        await fetch("http://localhost:8000/api/sos/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeId,
            latitude: lat,
            longitude: lng,
            guardian_number: userConfig.guardians[0]?.phone || "923270707947",
            driver_name: userConfig.driverName,
            image: !videoBlob ? screenshot : null,
            video: videoBlob,
            is_follow_up: isFollowUp
          }),
        });
      } catch (error) { console.error("SOS Error:", error); }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await sendPacket(false, pos.coords.latitude, pos.coords.longitude);
          setTimeout(() => sendPacket(true), 5000);
          setTimeout(() => sendPacket(true), 10000);
        },
        async () => {
          await sendPacket(false, null, null);
          setTimeout(() => sendPacket(true), 5000);
          setTimeout(() => sendPacket(true), 10000);
        }
      );
    }
  }, [userConfig]);

  const [sosCountdown, setSosCountdown] = useState<number | null>(null);

  const triggerSOS = useCallback((type: "AI" | "MANUAL") => {
    if (isEmergency || sosCountdown !== null) return;
    if (type === "MANUAL") executeSOS();
    else {
      setSosCountdown(5);
      countdownIntervalRef.current = setInterval(() => {
        setSosCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) { executeSOS(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isEmergency, sosCountdown, executeSOS]);

  // AI WebSocket Logic
  useEffect(() => {
    if (appState !== "DRIVING" || isEmergency) return;
    const ws = new WebSocket("ws://localhost:8000/ws/video");
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
        
        // Safety Score
        setSafetyScore(prev => {
            let p = 0;
            if (rawData.drowsy) p += 4;
            if (rawData.phone_detected) p += 4;
            if (p > 0) return Math.max(0, prev - p);
            return Math.min(100, prev + 0.3);
        });

        if (rawData.drowsy && !isEmergency && !isAutoSOSTriggered.current && sosCountdown === null) {
          if (!drowsyTimerRef.current) {
            drowsyTimerRef.current = setTimeout(() => { isAutoSOSTriggered.current = true; triggerSOS("AI"); }, 3000);
          }
        } else if (!rawData.drowsy && drowsyTimerRef.current) {
          clearTimeout(drowsyTimerRef.current);
          drowsyTimerRef.current = null;
        }

        if (rawData?.alert) {
            setAlertsToday(prev => prev + 1);
            setAlertLogs(p => [{ id: Date.now(), time: new Date().toLocaleTimeString(), title: "Incident", desc: rawData.alert, type: "warning" }, ...p.slice(0, 19)]);
        }
      } catch (err) { console.error(err); }
    };
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [appState, isEmergency, triggerSOS, sosCountdown]);

  if (needsSetup) return <SetupWizard onComplete={(data) => { setUserConfig(data); setNeedsSetup(false); }} />;
  if (appState !== "DRIVING") return <StartScreen appState={appState} onInitialize={() => { setAppState("INITIALIZING"); setTimeout(() => setAppState("READY"), 1500); }} onStart={() => setAppState("DRIVING")} />;

  return (
    <div ref={containerRef} className="h-screen bg-[var(--background)] text-white p-4 overflow-hidden flex flex-col font-sans">
      <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col">
        
        <MemoHeader isConnected={isConnected} isEmergency={isEmergency} onOpenSettings={() => setIsSettingsOpen(true)} onOpenAnalytics={() => setIsHistoryOpen(true)} nerdMode={nerdMode} setNerdMode={setNerdMode} isModalOpen={isHistoryOpen} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 mt-4">
          
          {/* LEFT: Hero Feed */}
          <div className="lg:col-span-8 flex flex-col gap-4 min-h-0 transition-all duration-500">
            <div className="flex-1 rounded-[2.5rem] bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden relative transform-gpu">
              <MemoVideoFeed webcamRef={webcamRef} canvasRef={canvasRef} aiData={aiData} isEmergency={isEmergency} alertsToday={alertsToday} driveTime={driveTime} safetyScore={safetyScore} nerdMode={nerdMode} />
              {isEmergency && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-50 animate-in fade-in">
                  <button onClick={() => { setIsEmergency(false); isAutoSOSTriggered.current=false; }} className="bg-white text-black px-10 py-5 rounded-full font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl"><CheckCircle size={20} className="text-green-600"/> I am Safe - Resume AI</button>
                </div>
              )}
            </div>
            
            {/* Dynamic Bottom: Sensor Bar (HUD) vs Logs (Nerd) */}
            {!nerdMode ? (
                <MemoDetectionStatus aiData={aiData} nerdMode={false} />
            ) : (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-5 h-40 overflow-hidden shadow-2xl">
                    <h3 className="text-[10px] font-black text-[#8E8884] uppercase tracking-widest mb-3 px-1">Live Incident Terminal</h3>
                    <MemoAlertHistory logs={alertLogs.slice(0, 3)} />
                </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
            <MemoSafetyScore score={safetyScore} nerdMode={nerdMode} />
            {nerdMode && <MemoDetectionStatus aiData={aiData} nerdMode={true} />}
            <MemoEmergencyContacts isEmergency={isEmergency} onTriggerSOS={() => triggerSOS("MANUAL")} userConfig={userConfig} />
          </div>
        </div>

        {/* SOS INTERCEPT MODAL */}
        {sosCountdown !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[var(--card)] border-2 border-[var(--alert)] w-full max-w-lg rounded-[3rem] p-10 shadow-[0_0_60px_rgba(255,77,77,0.3)] text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="p-4 bg-[var(--alert)]/10 rounded-full text-[var(--alert)] w-fit mx-auto mb-6 animate-bounce"><ShieldAlert size={56} /></div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">AI ALERT TRIGGERED</h2>
                <div className="text-9xl font-black text-white tabular-nums my-10">{sosCountdown}</div>
                <div className="flex gap-4">
                  <button onClick={() => { if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); setSosCountdown(null); isAutoSOSTriggered.current = false; }} className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-white">Abort</button>
                  <button onClick={executeSOS} className="flex-1 py-5 bg-[var(--alert)] text-white rounded-2xl font-black uppercase shadow-xl">Send Now</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onResetConfig={() => { localStorage.removeItem("safedrive_user_config"); window.location.reload(); }} />
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
      <div ref={modalRef} className="relative w-full max-w-4xl h-[80vh] bg-[var(--card)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl z-10 flex flex-col overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-white">✕ Close Terminal</button>
        <div className="flex-1 w-full h-full overflow-hidden mt-8"><MemoAlertHistory logs={logs} /></div>
      </div>
    </div>
  );
}
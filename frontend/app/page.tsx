

"use client";

import React, { useEffect, useRef, useState, memo, useCallback } from "react";
import Webcam from "react-webcam";
import { AIResponse } from "../types";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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

  // Persistence Tracking Refs
  const drowsyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoSOSTriggered = useRef(false);

  // UI Structure Mode Controller
  const [nerdMode, setNerdMode] = useState(false);

  // Modal Control state for checking full alert history popups
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [appState, setAppState] = useState<"IDLE" | "INITIALIZING" | "READY" | "DRIVING">("IDLE");
  const [isConnected, setIsConnected] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [safetyScore, setSafetyScore] = useState(100);
  const [alertsToday, setAlertsToday] = useState(0);
  const [driveTime, setDriveTime] = useState(0);
  const [alertLogs, setAlertLogs] = useState<any[]>([]);

  const [userConfig, setUserConfig] = useState<any>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Load configuration from browser memory
  useEffect(() => {
    const savedConfig = localStorage.getItem("safedrive_user_config");
    if (savedConfig) {
      setUserConfig(JSON.parse(savedConfig));
    } else {
      setNeedsSetup(true);
    }
  }, []);

  // --- FULL SOS SEQUENCE: TEXT + 3 PICS + 5S VIDEO ---
  const handleSOS = useCallback(async () => {
    const activeId = userConfig?.senderMode === "SYSTEM" ? "SYSTEM_ADMIN" : userConfig?.driverNumber;
    if (!activeId) return;

    setIsEmergency(true);
    console.log(`🚨 SOS Sequence Initiated for ${activeId}`);

    const sendPacket = async (isFollowUp: boolean, lat: number | null = null, lng: number | null = null, videoBlob: string | null = null) => {
      const screenshot = webcamRef.current?.getScreenshot();
      try {
        await fetch("http://127.0.0.1:8000/api/sos/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeId,
            latitude: lat,
            longitude: lng,
            guardian_number: userConfig.guardianNumber,
            driver_name: userConfig.driverName,
            image: !videoBlob ? screenshot : null,
            video: videoBlob,
            is_follow_up: isFollowUp
          }),
        });
      } catch (error) { console.error("SOS Packet Failed", error); }
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
        reader.onloadend = () => sendPacket(true, null, null, reader.result as string);
      };
      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 5000);
    }

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
        },
        { timeout: 5000 }
      );
    }
  }, [userConfig]);

  // Entrance Animation
  useGSAP(() => {
    if (appState !== "DRIVING") return;
    gsap.set(".dashboard-animate", { opacity: 0, y: 30 });
    gsap.to(".dashboard-animate", { opacity: 1, y: 0, stagger: 0.06, ease: "power3.out", duration: 0.9 });
  }, { dependencies: [appState], scope: containerRef });

  // AI WebSocket Connection + AUTO SOS LOGIC
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

        if (rawData.drowsy && !isEmergency && !isAutoSOSTriggered.current) {
          if (!drowsyTimerRef.current) {
            console.log("⚠️ Drowsiness detected. Starting countdown...");
            drowsyTimerRef.current = setTimeout(() => {
              isAutoSOSTriggered.current = true;
              handleSOS();
            }, 3000);
          }
        } else if (!rawData.drowsy) {
          if (drowsyTimerRef.current) {
            clearTimeout(drowsyTimerRef.current);
            drowsyTimerRef.current = null;
          }
        }

        if (rawData?.alert) {
          setAlertsToday((prev) => prev + 1);
          setAlertLogs((prev) => [
            { id: Date.now(), time: new Date().toLocaleTimeString(), title: "System Flag Triggered", desc: rawData.alert, type: "warning" },
            ...prev.slice(0, 19)
          ]);
        }
      } catch (err) { console.error(err); }
    };

    return () => { 
        if (wsRef.current) wsRef.current.close(); 
        if (drowsyTimerRef.current) clearTimeout(drowsyTimerRef.current);
    };
  }, [appState, isEmergency, handleSOS]);

  if (needsSetup) return <SetupWizard onComplete={(data) => { setUserConfig(data); setNeedsSetup(false); }} />;
  if (appState !== "DRIVING") return <StartScreen appState={appState} onInitialize={() => { setAppState("INITIALIZING"); setTimeout(() => setAppState("READY"), 1500); }} onStart={() => setAppState("DRIVING")} />;

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] p-2 sm:p-4 lg:p-4 font-sans overflow-x-hidden">
      <div className="max-w-[1700px] mx-auto">
        
        {/* Header Section */}
        <div className="dashboard-animate relative z-99999999">
          <MemoHeader 
            isConnected={isConnected} 
            isEmergency={isEmergency} 
            onOpenSettings={() => setIsSettingsOpen(true)} 
            onOpenAnalytics={() => setIsHistoryOpen(true)}
            nerdMode={nerdMode}
            setNerdMode={setNerdMode}
          />
        </div>

        {/* Dynamic Layout Matrix Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 mt-4">
          
          {/* Main Visual Feeds Area */}
          <div className={`${nerdMode ? "lg:col-span-8" : "lg:col-span-9"} flex flex-col transition-all duration-500 gap-4 lg:gap-5`}>
            
            <div className="dashboard-animate rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden transform-gpu">
              <MemoVideoFeed 
                webcamRef={webcamRef} 
                screenshotFormat="image/jpeg" 
                videoConstraints={{ width: 1280, height: 720 }} 
                canvasRef={canvasRef} 
                aiData={aiData} 
                isEmergency={isEmergency} 
                alertsToday={alertsToday} 
                driveTime={driveTime} 
                safetyScore={safetyScore} 
                nerdMode={nerdMode}
              />
            </div>
            
            {/* Simple HUD Mode Element */}
            {!nerdMode && (
              <div className="dashboard-animate transform-gpu animate-in fade-in duration-300">
                <MemoDetectionStatus aiData={aiData} nerdMode={nerdMode} />
              </div>
            )}
            
            {/* Nerd Mode Element (Shows top 3 logs inline) */}
            {nerdMode && (
              <div className="dashboard-animate rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden transform-gpu animate-in fade-in slide-in-from-bottom-4 duration-300">
                <MemoAlertHistory logs={alertLogs.slice(0, 3)} />
              </div>
            )}
          </div>

          {/* Right Sided Telemetry Column Cluster */}
          <div className={`${nerdMode ? "lg:col-span-4" : "lg:col-span-3"} flex flex-col gap-4 lg:gap-5 transition-all duration-500`}>
            
            <div className="dashboard-animate transform-gpu">
              <MemoSafetyScore score={safetyScore} nerdMode={nerdMode} />
            </div>
            
            {nerdMode && (
              <div className="dashboard-animate transform-gpu animate-in fade-in duration-300">
                <MemoDetectionStatus aiData={aiData} nerdMode={nerdMode} />
              </div>
            )}
            
            <div className="dashboard-animate transform-gpu">
              <MemoEmergencyContacts isEmergency={isEmergency} onTriggerSOS={handleSOS}  userConfig={userConfig} />
            </div>
          </div>
        </div>

        {/* Floating Overlay Large Modal Box for Alert Terminal logs */}
        {isHistoryOpen && (
          <HistoryModalWrapper 
            logs={alertLogs} 
            onClose={() => setIsHistoryOpen(false)} 
          />
        )}

        {/* System Settings Panel */}
        <SettingsPanel 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          onResetConfig={() => {
            localStorage.removeItem("safedrive_user_config");
            isAutoSOSTriggered.current = false;
            window.location.reload();
          }} 
        />
      </div>
    </div>
  );
}

/* GSAP Animated Component Wrapper to keep Header unblurred & animate the scaling modal flawlessly */
function HistoryModalWrapper({ logs, onClose }: { logs: any[]; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    // Fade backdrop in lightly without crushing the display contrast
    tl.fromTo(backdropRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.25, ease: "power2.out" }
    );
    // Elastic scaling bounce popup transition
    tl.fromTo(modalRef.current, 
      { opacity: 0, scale: 0.93, y: 20 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.5)" },
      "-=0.15"
    );
  }, { scope: modalRef });


  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 pointer-events-auto">
      {/* Reduced background blur [2px] to maintain underlying view legibility */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 bg-[#1A110A]/70 backdrop-blur-[2px]" 
        onClick={onClose} 
      />
      
      {/* Maximum estate layout modal container box with considerable, neat margins */}
      <div 
        ref={modalRef}
        className="relative w-[70vw] max-w-[calc(100vw-32px)] h-[80vh] bottom-0  sm:max-w-[calc(100vw-64px)] sm:max-h-[calc(100vh-64px)] md:max-w-[calc(100vw-96px)] md:max-h-[calc(100vh-96px)] bg-[#3D2B1F] rounded-2xl border border-[#4D392C] p-4 sm:p-6 shadow-2xl z-10 flex flex-col overflow-hidden"
      >
        {/* Floating Close Action Button Tag */}
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={onClose}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl bg-[#2A1E16] text-[#BFA899] border border-[#4D392C] hover:text-white active:scale-95 transition-all"
          >
            ✕ Close Terminal
          </button>
        </div>

        {/* Content View Expansion Container */}
        <div className="flex-1 w-full h-full overflow-hidden mt-8 sm:mt-2">
          <MemoAlertHistory logs={logs} isModalView={true} />
        </div>
      </div>
    </div>
  );
}
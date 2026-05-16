"use client";

import React, { useEffect, useRef, useState, memo } from "react";
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

  // Entrance Animation
  useGSAP(() => {
    if (appState !== "DRIVING") return;
    gsap.set(".dashboard-animate", { opacity: 0, y: 30 });
    gsap.to(".dashboard-animate", { opacity: 1, y: 0, stagger: 0.06, ease: "power3.out", duration: 0.9 });
  }, { dependencies: [appState], scope: containerRef });

  // AI WebSocket Connection
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
        if (rawData?.alert) {
          setAlertsToday((prev) => prev + 1);
          setAlertLogs((prev) => [{ time: new Date().toLocaleTimeString(), message: rawData.alert }, ...prev.slice(0, 9)]);
        }
      } catch (err) { console.error(err); }
    };
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [appState, isEmergency]);

  // --- SOS LOGIC: TEXT + 3 PICS + 5S VIDEO ---
  const handleSOS = async () => {
    const dNumber = userConfig?.driverNumber;
    if (!dNumber) return;

    setIsEmergency(true);
    console.log("SOS Initiated for Driver:", dNumber);

    const sendPacket = async (isFollowUp: boolean, lat: number | null = null, lng: number | null = null, videoBlob: string | null = null) => {
      const screenshot = webcamRef.current?.getScreenshot();
      try {
        await fetch("http://127.0.0.1:8000/api/sos/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: dNumber,
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

    // 1. Setup Video Recording (RESTORED)
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

    // 2. Handle Location & Immediate Text + Photos
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await sendPacket(false, pos.coords.latitude, pos.coords.longitude); // Text + Pic 1
          setTimeout(() => sendPacket(true), 5000);  // Pic 2
          setTimeout(() => sendPacket(true), 10000); // Pic 3
        },
        async () => {
          await sendPacket(false, null, null); // Fallback
          setTimeout(() => sendPacket(true), 5000);
          setTimeout(() => sendPacket(true), 10000);
        },
        { timeout: 5000 }
      );
    }
  };

  if (needsSetup) {
    return <SetupWizard onComplete={(data) => { setUserConfig(data); setNeedsSetup(false); }} />;
  }

  if (appState !== "DRIVING") {
    return <StartScreen appState={appState} onInitialize={() => { setAppState("INITIALIZING"); setTimeout(() => setAppState("READY"), 1500); }} onStart={() => setAppState("DRIVING")} />;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] p-4 lg:p-6 font-sans overflow-hidden">
      <div className="max-w-[1600px] mx-auto">
        <div className="dashboard-animate">
          <MemoHeader isConnected={isConnected} isEmergency={isEmergency} onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="dashboard-animate rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden transform-gpu">
              <MemoVideoFeed webcamRef={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ width: 1280, height: 720 }} canvasRef={canvasRef} aiData={aiData} isEmergency={isEmergency} alertsToday={alertsToday} driveTime={driveTime} safetyScore={safetyScore} />
            </div>
            <div className="dashboard-animate rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden transform-gpu">
              <MemoAlertHistory logs={alertLogs} />
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="dashboard-animate"><MemoSafetyScore score={safetyScore} /></div>
            <div className="dashboard-animate"><MemoDetectionStatus aiData={aiData} /></div>
            <div className="dashboard-animate"><MemoEmergencyContacts isEmergency={isEmergency} onTriggerSOS={handleSOS} /></div>
          </div>
        </div>

        <SettingsPanel 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          onResetConfig={() => { localStorage.removeItem("safedrive_user_config"); window.location.reload(); }} 
        />
      </div>
    </div>
  );
}
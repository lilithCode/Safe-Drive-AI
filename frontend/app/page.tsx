"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { AIResponse } from "../types";

import Header from "../components/Header";
import VideoFeed from "../components/VideoFeed";
import SafetyScore from "../components/SafetyScore";
import DetectionStatus from "../components/DetectionStatus";
import AlertHistory from "../components/AlertHistory";
import EmergencyContacts from "../components/EmergencyContacts";
import StartScreen from "../components/StartScreen";

export default function Dashboard() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [appState, setAppState] = useState<
    "IDLE" | "INITIALIZING" | "READY" | "DRIVING"
  >("IDLE");
  const [isConnected, setIsConnected] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [safetyScore, setSafetyScore] = useState(100);

  const [alertsToday, setAlertsToday] = useState(0);
  const [driveTime, setDriveTime] = useState(0);
  const [alertLogs, setAlertLogs] = useState<any[]>([]);

  const lastAlertTime = useRef<number>(0);
  const yawnFramesRef = useRef<number>(0);
  const closedEyesFramesRef = useRef<number>(0); // Tracks consecutive frames eyes are closed
  const penaltyFrames = useRef<number>(0);
  const safeFrames = useRef<number>(0);
  const driveStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (appState !== "DRIVING") return;
    const interval = setInterval(() => {
      setDriveTime(Math.floor((Date.now() - driveStartTime.current) / 60000));
    }, 60000);
    return () => clearInterval(interval);
  }, [appState]);

  // Sync Loop WebSocket connection (Prevents Backend Crash/Overload)
  useEffect(() => {
    if (appState !== "DRIVING" || isEmergency) return;

    const ws = new WebSocket("ws://localhost:8000/ws/video");

    // Function sends ONE frame
    const sendNextFrame = () => {
      if (webcamRef.current && ws.readyState === WebSocket.OPEN) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          ws.send(imageSrc);
        } else {
          // If screenshot failed (e.g. video loading), try again shortly
          setTimeout(sendNextFrame, 50);
        }
      }
    };

    ws.onopen = () => {
      setIsConnected(true);
      sendNextFrame(); 
    };

    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const rawData: AIResponse = JSON.parse(event.data);

      // Yawning persistence filter
      if (rawData.yawning) yawnFramesRef.current += 1;
      else yawnFramesRef.current = 0;

      // Blink vs Drowsy filter: Ignores normal blinks.
      if (rawData.drowsy) closedEyesFramesRef.current += 1;
      else closedEyesFramesRef.current = 0;

      const filteredData = {
        ...rawData,
        yawning: yawnFramesRef.current >= 2,
        drowsy: closedEyesFramesRef.current >= 2, 
      };

      setAiData(filteredData);
      updateSafetyScore(filteredData);
      triggerAudioAlerts(filteredData);

      setTimeout(sendNextFrame, 50);
    };

    return () => {
      ws.close();
    };
  }, [appState, isEmergency]);

  const handleInitialize = () => {
    setAppState("INITIALIZING");
    setTimeout(() => {
      setAppState("READY");
    }, 2500);
  };

  const handleStartDrive = () => {
    setAppState("DRIVING");
    driveStartTime.current = Date.now();

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
      audioCtxRef.current.resume();
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const unlockAudio = new SpeechSynthesisUtterance(
        "System Active. Monitoring started.",
      );
      unlockAudio.volume = 1;
      window.speechSynthesis.speak(unlockAudio);
    }
  };

  const logAlert = (
    title: string,
    desc: string,
    type: "critical" | "warning" | "info",
  ) => {
    setAlertLogs((prev) =>
      [
        {
          id: Date.now(),
          title,
          desc,
          time: new Date().toLocaleTimeString(),
          type,
        },
        ...prev,
      ].slice(0, 5),
    );
    setAlertsToday((prev) => prev + 1);
  };

  const updateSafetyScore = useCallback((data: AIResponse) => {
    setSafetyScore((prev) => {
      let isUnsafe = false;
      let currentPenalty = 0;

      if (!data.face_detected) {
        isUnsafe = true;
        currentPenalty = 1;
      }
      if (data.drowsy) {
        isUnsafe = true;
        currentPenalty = 4; 
      }
      if (data.phone_detected) {
        isUnsafe = true;
        currentPenalty = 3;
      }
      if (data.head_distracted) {
        isUnsafe = true;
        currentPenalty = 1.5;
      }
      if (data.yawning) {
        isUnsafe = true;
        currentPenalty = 1;
      }

      if (isUnsafe) {
        safeFrames.current = 0;
        penaltyFrames.current += 1;
        if (penaltyFrames.current >= 2)
          return Math.max(0, prev - currentPenalty);
        return prev;
      } else {
        penaltyFrames.current = 0;
        safeFrames.current += 1;
        if (safeFrames.current >= 2) return Math.min(100, prev + 1);
        return prev;
      }
    });
  }, []);

  const playBeep = () => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(600, audioCtxRef.current.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.2);
  };

  const triggerAudioAlerts = useCallback((data: AIResponse) => {
    const now = Date.now();

    // Give the 5 seconds to boot up before triggering any warnings
    if (now - driveStartTime.current < 5000) return;
    // Cooldown prevents spamming
    if (now - lastAlertTime.current < 4000) return;

    let message = "";
    if (data.drowsy) {
      message = "Wake up! Drowsiness detected.";
      logAlert(
        "Eyes closed",
        `EAR dropped to ${data.ear?.toFixed(2)}`,
        "critical",
      );
    } else if (data.phone_detected) {
      message = "Please put your phone away.";
      logAlert("Phone detected", "Distracted by phone", "critical");
    } else if (!data.face_detected) {
      message = "Please look at the camera.";
      logAlert("Face lost", "Camera view obscured", "warning");
    } else if (data.head_distracted) {
      message = "Keep your eyes on the road.";
      logAlert("Head tilted", "Looking away from road", "warning");
    } else if (data.yawning) {
      message = "You seem tired. Please take a break.";
      logAlert("Yawning detected", "Fatigue risk", "info");
    }

    if (message !== "") {
      lastAlertTime.current = now;
      playBeep();

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }, 100);
      }
    }
  }, []);

  if (appState !== "DRIVING") {
    return (
      <StartScreen
        appState={appState}
        onInitialize={handleInitialize}
        onStart={handleStartDrive}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-zinc-100 p-4 lg:p-6 font-sans">
      <Header isConnected={isConnected} isEmergency={isEmergency} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 max-w-[1600px] mx-auto">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <VideoFeed
            webcamRef={webcamRef}
            canvasRef={canvasRef}
            aiData={aiData}
            isEmergency={isEmergency}
            alertsToday={alertsToday}
            driveTime={driveTime}
            safetyScore={safetyScore}
          />
          <AlertHistory logs={alertLogs} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <SafetyScore score={safetyScore} />
          <DetectionStatus aiData={aiData} />
          <EmergencyContacts
            isEmergency={isEmergency}
            onTriggerSOS={() => setIsEmergency(true)}
          />
        </div>
      </div>
    </div>
  );
}

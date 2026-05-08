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

export default function Dashboard() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [safetyScore, setSafetyScore] = useState(100);

  const [alertsToday, setAlertsToday] = useState(0);
  const [driveTime, setDriveTime] = useState(0); // in minutes
  const [alertLogs, setAlertLogs] = useState<any[]>([]);

  const lastAlertTime = useRef<number>(0);
  const yawnFramesRef = useRef<number>(0);
  const penaltyFrames = useRef<number>(0);
  const safeFrames = useRef<number>(0);
  const driveStartTime = useRef<number>(Date.now());

  //set up drive timer
  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => {
      setDriveTime(Math.floor((Date.now() - driveStartTime.current) / 60000)); //like 12:15 - 12:00 = 15 minutes
    }, 60000);
    return () => clearInterval(interval); // When this component unmounts, stop the interval
  }, [hasStarted]);

  // WebSocket connection
  useEffect(() => {
    if (!hasStarted || isEmergency) return;

    const ws = new WebSocket("ws://localhost:8000/ws/video"); //connects to the backend python server
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const rawData: AIResponse = JSON.parse(event.data); // event is the message from the backend

      // Yawning detection requires 3 consecutive frames of yawning to trigger alert
      // This will prevent from false positives when the driver is just talking
      if (rawData.yawning) yawnFramesRef.current += 1;
      else yawnFramesRef.current = 0;

      const filteredData = { ...rawData, yawning: yawnFramesRef.current >= 3 }; //spread rawDATA and add yawing only if frames are greater than 3

      setAiData(filteredData);
      updateSafetyScore(filteredData);
      triggerAudioAlerts(filteredData);
    };

    //clean up function after the component is unmounted
    return () => ws.close();
  }, [hasStarted, isEmergency]);

  //video dealing from webcam
  useEffect(() => {
    if (!isConnected || !hasStarted || isEmergency) return;

    const interval = setInterval(() => {
      if (webcamRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        //only if webCam exists and websocket connetions are open
        const imageSrc = webcamRef.current.getScreenshot(); //return a base64 string text image
        if (imageSrc) wsRef.current.send(imageSrc); //sends that base64 image to websocket back
      }
    }, 250); // 4 FPS (as 1/0.25 = 4 ) this will run 4 times per sec

    return () => clearInterval(interval);
  }, [isConnected, hasStarted, isEmergency]);

  const handleStartMonitoring = () => {
    setHasStarted(true);
    driveStartTime.current = Date.now();

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
      audioCtxRef.current.resume();
    }

    // Play an welcome audio message
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const unlockAudio = new SpeechSynthesisUtterance(
        "System Active. Monitoring started.",
      );
      unlockAudio.volume = 1;
      window.speechSynthesis.speak(unlockAudio);
    }
  };

  // Logs alerts with a timestamp and type (critical, warning, info) to display in the AlertHistory component
  const logAlert = (
    title: string,
    desc: string,
    type: "critical" | "warning" | "info",
  ) => {
    setAlertLogs(
      (prev) =>
        [
          {
            id: Date.now(),
            title,
            desc,
            time: new Date().toLocaleTimeString(),
            type,
          },
          ...prev,
        ].slice(0, 5), // Keep only the latest 5 alerts in the log
    );
    setAlertsToday((prev) => prev + 1);
  };

  // Scoring Logic
  const updateSafetyScore = useCallback((data: AIResponse) => {
    // getting the current score and then applying penalty or reward based on the data from the backend
    setSafetyScore((prev) => {
      let isUnsafe = false;
      let currentPenalty = 0;

      if (!data.face_detected) {
        isUnsafe = true;
        currentPenalty = 1;
      }
      if (data.drowsy) {
        isUnsafe = true;
        currentPenalty = 3;
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
        // Require 3 consecutive unsafe frames before dropping score
        if (penaltyFrames.current >= 3)
          return Math.max(0, prev - currentPenalty); // makes sure the scroes dn't go negative
        return prev;
      } else {
        penaltyFrames.current = 0;
        safeFrames.current += 1;
        // Require 2 consecutive safe frames to start healing score
        if (safeFrames.current >= 2) return Math.min(100, prev + 1); // makes sure that scores don't exceed the max 100
        return prev;
      }
    });
  }, []);

  // Plays a short beep sound using Web Audio API to alert the driver before the speech synthesis message is read out loud
  const playBeep = () => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator(); //creates a sound wave generator
    const gain = audioCtxRef.current.createGain(); //gain node to control the volume of the beep
    osc.connect(gain); //connects the oscillator to the gain node
    gain.connect(audioCtxRef.current.destination); //connects the gain node to the audio output (speakers)
    osc.type = "square"; // square wave for a sharper beep sound
    osc.frequency.setValueAtTime(600, audioCtxRef.current.currentTime); // 600 Hz beep
    gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime); // Volume control at 5%
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.2); // Beep duration of 0.2 seconds
  };

  const triggerAudioAlerts = useCallback((data: AIResponse) => {
    const now = Date.now();
    // 4000ms cooldown gives the voice enough time to actually finish reading the message
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
        window.speechSynthesis.cancel(); // Stop any ongoing speech

        // This setTimeout is crucial! It stops Chrome from skipping the message.
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = 1.0; // Standard speed for max clarity
          window.speechSynthesis.speak(utterance);
        }, 100);
      }
    }
  }, []);

  if (!hasStarted) {
    //This is the loading page
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center text-white">
        <h1 className="text-4xl font-bold mb-4">
          SafeDrive <span className="text-blue-500">AI</span>
        </h1>
        <p className="text-zinc-400 mb-8">Ready to monitor your drive.</p>
        <button
          onClick={handleStartMonitoring}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-semibold transition-all"
        >
          Start System
        </button>
      </div>
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

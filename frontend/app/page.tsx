// "use client";

// import React, { useEffect, useRef, useState, memo } from "react";
// import Webcam from "react-webcam";
// import { AIResponse } from "../types";

// // GSAP
// import gsap from "gsap";
// import { useGSAP } from "@gsap/react";

// import Header from "../components/Header";
// import VideoFeed from "../components/VideoFeed";
// import SafetyScore from "../components/SafetyScore";
// import DetectionStatus from "../components/DetectionStatus";
// import AlertHistory from "../components/AlertHistory";
// import EmergencyContacts from "../components/EmergencyContacts";
// import StartScreen from "../components/StartScreen";
// import SettingsPanel from "../components/SettingsPanel";

// // -----------------------------
// // MEMOIZED COMPONENTS
// // Prevent unnecessary rerenders
// // -----------------------------
// const MemoHeader = memo(Header);
// const MemoVideoFeed = memo(VideoFeed);
// const MemoSafetyScore = memo(SafetyScore);
// const MemoDetectionStatus = memo(DetectionStatus);
// const MemoAlertHistory = memo(AlertHistory);
// const MemoEmergencyContacts = memo(EmergencyContacts);

// export default function Dashboard() {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
//   const webcamRef = useRef<Webcam>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   const wsRef = useRef<WebSocket | null>(null);

//   const [appState, setAppState] = useState<
//     "IDLE" | "INITIALIZING" | "READY" | "DRIVING"
//   >("IDLE");

//   const [isConnected, setIsConnected] = useState(false);
//   const [isEmergency, setIsEmergency] = useState(false);

//   const [aiData, setAiData] = useState<AIResponse | null>(null);

//   const [safetyScore, setSafetyScore] = useState(100);
//   const [alertsToday, setAlertsToday] = useState(0);
//   const [driveTime, setDriveTime] = useState(0);
//   const [alertLogs, setAlertLogs] = useState<any[]>([]);

//   // ----------------------------------------
//   // SUPER SMOOTH GSAP ENTRANCE
//   // ----------------------------------------
//   useGSAP(
//     () => {
//       if (appState !== "DRIVING") return;

//       // Kill old animations
//       gsap.killTweensOf(".dashboard-animate");

//       // Set initial state
//       gsap.set(".dashboard-animate", {
//         opacity: 0,
//         y: 30,
//         willChange: "transform, opacity",
//       });

//       // Optimized timeline
//       const tl = gsap.timeline({
//         defaults: {
//           ease: "power3.out",
//           duration: 0.9,
//         },
//       });

//       tl.to(".dashboard-animate", {
//         opacity: 1,
//         y: 0,
//         stagger: 0.06,
//         clearProps: "willChange",
//       });
//     },
//     {
//       dependencies: [appState],
//       scope: containerRef,
//     }
//   );

//   // ----------------------------------------
//   // WEBSOCKET LOGIC
//   // Optimized for less stress
//   // ----------------------------------------
//   useEffect(() => {
//     if (appState !== "DRIVING" || isEmergency) return;

//     // Delay websocket slightly so animation finishes first
//     const connectDelay = setTimeout(() => {
//       const ws = new WebSocket("ws://localhost:8000/ws/video");

//       wsRef.current = ws;

//       const sendNextFrame = () => {
//         if (
//           webcamRef.current &&
//           ws.readyState === WebSocket.OPEN
//         ) {
//           const imageSrc = webcamRef.current.getScreenshot();

//           if (imageSrc) {
//             ws.send(imageSrc);
//           }

//           // Slightly slower = MUCH smoother UI
//           setTimeout(sendNextFrame, 180);
//         }
//       };

//       ws.onopen = () => {
//         setIsConnected(true);
//         sendNextFrame();
//       };

//       ws.onclose = () => {
//         setIsConnected(false);
//       };

//       ws.onmessage = (event) => {
//         try {
//           const rawData: AIResponse = JSON.parse(event.data);

//           // Use React batching naturally
//           setAiData(rawData);

//           // Example updates
//           if (rawData?.alert) {
//             setAlertsToday((prev) => prev + 1);

//             setAlertLogs((prev) => [
//               {
//                 time: new Date().toLocaleTimeString(),
//                 message: rawData.alert,
//               },
//               ...prev.slice(0, 9),
//             ]);
//           }
//         } catch (err) {
//           console.error(err);
//         }
//       };
//     }, 1000); // wait for animation first

//     return () => {
//       clearTimeout(connectDelay);

//       if (wsRef.current) {
//         wsRef.current.close();
//       }
//     };
//   }, [appState, isEmergency]);

//   // ----------------------------------------
//   // INITIALIZE APP
//   // ----------------------------------------
//   const handleInitialize = () => {
//     setAppState("INITIALIZING");

//     setTimeout(() => {
//       setAppState("READY");
//     }, 1500);
//   };

//   const handleStartDrive = () => {
//     setAppState("DRIVING");
//   };

//   // ----------------------------------------
//   // START SCREEN
//   // ----------------------------------------
//   if (appState !== "DRIVING") {
//     return (
//       <StartScreen
//         appState={appState}
//         onInitialize={handleInitialize}
//         onStart={handleStartDrive}
//       />
//     );
//   }


//   //  CAPTURING COORDINATES FOR LOCCATION SHARING 
// const handleSOS = async () => {
//   console.log("SOS Initiated...");
//   setIsEmergency(true);

//   const sendToBackend = async (lat: number | null, lng: number | null) => {
//     try {
//       await fetch("http://localhost:8000/api/sos/whatsapp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           latitude: lat,
//           longitude: lng,
//           guardian_number: "92370707947",
//           driver_name: "Hamza"
//         }),
//       });
//       console.log("SOS Signal sent to server.");
//     } catch (error) {
//       console.error("Backend Error:", error);
//     }
//   };

//   if ("geolocation" in navigator) {
//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         sendToBackend(pos.coords.latitude, pos.coords.longitude);
//       },
//       (err) => {
//         console.warn("Browser GPS failed. Letting backend find location via IP...");
//         sendToBackend(null, null); // Backend will take over now
//       },
//       { timeout: 5000 }
//     );
//   } else {
//     sendToBackend(null, null);
//   }
// };

//   return (
//     <div
//       ref={containerRef}
//       className="min-h-screen bg-[#F2E8D9] text-[#3D2B1F] p-4 lg:p-6 font-sans overflow-hidden"
//     >
//       <div className="max-w-[1600px] mx-auto">

//         {/* HEADER */}
//         <div className="dashboard-animate">
//           <MemoHeader
//             isConnected={isConnected}
//             isEmergency={isEmergency}
//             onOpenSettings={() => setIsSettingsOpen(true)}
//           />
//         </div>

//         {/* MAIN GRID */}
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">

//           {/* LEFT SIDE */}
//           <div className="lg:col-span-8 flex flex-col gap-5">

//             <div
//               className="
//                 dashboard-animate
//                 rounded-2xl
//                 bg-[#3D2B1F]
//                 shadow-lg
//                 overflow-hidden
//                 transform-gpu
//               "
//             >
//               <MemoVideoFeed
//                 webcamRef={webcamRef}
//                 canvasRef={canvasRef}
//                 aiData={aiData}
//                 isEmergency={isEmergency}
//                 alertsToday={alertsToday}
//                 driveTime={driveTime}
//                 safetyScore={safetyScore}
//               />
//             </div>

//             <div
//               className="
//                 dashboard-animate
//                 rounded-2xl
//                 bg-[#3D2B1F]
//                 shadow-lg
//                 overflow-hidden
//                 transform-gpu
//               "
//             >
//               <MemoAlertHistory logs={alertLogs} />
//             </div>
//           </div>

//           {/* RIGHT SIDE */}
//           <div className="lg:col-span-4 flex flex-col gap-5">

//             <div
//               className="
//                 dashboard-animate
//                 rounded-2xl
//                 bg-[#3D2B1F]
//                 shadow-lg
//                 overflow-hidden
//                 transform-gpu
//               "
//             >
//               <MemoSafetyScore score={safetyScore} />
//             </div>

//             <div
//               className="
//                 dashboard-animate
//                 rounded-2xl
//                 bg-[#3D2B1F]
//                 shadow-lg
//                 overflow-hidden
//                 transform-gpu
//               "
//             >
//               <MemoDetectionStatus aiData={aiData} />
//             </div>

//             <div
//               className="
//                 dashboard-animate
//                 rounded-2xl
//                 bg-[#3D2B1F]
//                 shadow-lg
//                 overflow-hidden
//                 transform-gpu
//               "
//             >
// <MemoEmergencyContacts
//   isEmergency={isEmergency}
//   onTriggerSOS={handleSOS} // Use our new handleSOS function
// />
//             </div>
//           </div>
//         </div>

//         {/* SETTINGS PANEL (Preserved from first code) */}
//         <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import Webcam from "react-webcam";
import { AIResponse } from "../types";

// GSAP
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

  // ENTRANCE ANIMATION
  useGSAP(() => {
    if (appState !== "DRIVING") return;
    gsap.set(".dashboard-animate", { opacity: 0, y: 30 });
    gsap.to(".dashboard-animate", {
      opacity: 1,
      y: 0,
      stagger: 0.06,
      ease: "power3.out",
      duration: 0.9,
    });
  }, { dependencies: [appState], scope: containerRef });

  // WEBSOCKET (BACK TO LOCAL)
  useEffect(() => {
    if (appState !== "DRIVING" || isEmergency) return;

    // const ws = new WebSocket("ws://localhost:8000/ws/video");
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
          setAlertLogs((prev) => [{
            time: new Date().toLocaleTimeString(),
            message: rawData.alert,
          }, ...prev.slice(0, 9)]);
        }
      } catch (err) { console.error(err); }
    };

    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [appState, isEmergency]);

  const handleInitialize = () => {
    setAppState("INITIALIZING");
    setTimeout(() => setAppState("READY"), 1500);
  };

  // SOS LOGIC (BACK TO LOCAL)
  const handleSOS = async () => {
    console.log("SOS Initiated...");
    setIsEmergency(true);

    const sendToBackend = async (lat: number | null, lng: number | null) => {
      try {
        const response = await fetch("http://localhost:8000/api/sos/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            guardian_number: "923270707947",
            driver_name: "Hamza"
          }),
        });
        console.log("SOS Sent successfully");
      } catch (error) {
        console.error("Backend Error:", error);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendToBackend(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.warn("GPS failed, using IP fallback");
          sendToBackend(null, null);
        },
        { timeout: 5000 }
      );
    } else {
      sendToBackend(null, null);
    }
  };

  if (appState !== "DRIVING") {
    return <StartScreen appState={appState} onInitialize={handleInitialize} onStart={() => setAppState("DRIVING")} />;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] p-4 lg:p-6 font-sans overflow-hidden">
      <div className="max-w-[1600px] mx-auto">
        <div className="dashboard-animate">
          <MemoHeader isConnected={isConnected} isEmergency={isEmergency} onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="dashboard-animate rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden">
              <MemoVideoFeed webcamRef={webcamRef} canvasRef={canvasRef} aiData={aiData} isEmergency={isEmergency} alertsToday={alertsToday} driveTime={driveTime} safetyScore={safetyScore} />
            </div>
            <div className="dashboard-animate rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden">
              <MemoAlertHistory logs={alertLogs} />
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="dashboard-animate">
              <MemoSafetyScore score={safetyScore} />
            </div>
            <div className="dashboard-animate">
              <MemoDetectionStatus aiData={aiData} />
            </div>
            <div className="dashboard-animate">
              <MemoEmergencyContacts isEmergency={isEmergency} onTriggerSOS={handleSOS} />
            </div>
          </div>
        </div>

        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </div>
  );
}
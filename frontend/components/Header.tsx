"use client";

import React, { useRef, useEffect, useState } from "react";
import { ShieldCheck, LayoutDashboard, BarChart3, Settings, Terminal } from "lucide-react";
import gsap from "gsap";

interface Props {
  isConnected: boolean;
  isEmergency: boolean;
  onOpenSettings: () => void;
  onOpenAnalytics?: () => void;
  nerdMode: boolean;
  setNerdMode: (mode: boolean) => void;
  isModalOpen: boolean; // Added this to trigger header glow/scale
}

export default function Header({ 
  isConnected, isEmergency, onOpenSettings, onOpenAnalytics, nerdMode, setNerdMode, isModalOpen 
}: Props) {
  const headerRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef(null);
  const navRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const [activeLabel, setActiveLabel] = useState("HUD Core");

  // Handle Header Glow & Scale Animation
  useEffect(() => {
    if (isModalOpen || isEmergency) {
      gsap.to(headerRef.current, {
        scale: 1.02,
        boxShadow: "0 0 20px rgba(232, 176, 95, 0.2)",
        duration: 0.4,
        ease: "power2.out"
      });
    } else {
      gsap.to(headerRef.current, {
        scale: 1,
        boxShadow: "0 0 0px rgba(0,0,0,0)",
        duration: 0.4,
        ease: "power2.in"
      });
    }
  }, [isModalOpen, isEmergency]);

  useEffect(() => {
    const activeEl = navRef.current?.querySelector(`[data-label="${activeLabel}"]`) as HTMLElement;
    if (activeEl && pillRef.current) {
      gsap.to(pillRef.current, {
        x: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        duration: 0.5,
        ease: "power3.out"
      });
    }
  }, [activeLabel]);

  const handleNavClick = (label: string, action: () => void) => {
    setActiveLabel(label);
    action();
  };

  return (
    <header 
      ref={headerRef}
      className="flex flex-wrap justify-between items-center max-w-[1600px] mx-auto gap-4 px-2 sm:px-0 transition-all duration-500"
    >
      {/* Brand Section */}
      <div ref={brandRef} className="flex items-center gap-4 cursor-pointer">
        <div className="relative w-12 h-12 bg-[var(--card)] border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--accent)] shadow-2xl">
          <ShieldCheck size={24} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-[var(--card)] tracking-tighter uppercase leading-none">
            SafeDrive <span className="text-[var(--accent)]">AI</span>
          </h1>
        </div>
      </div>

      {/* Navigation Cluster Dock */}
      <nav ref={navRef} className="relative flex items-center bg-[var(--card)] border border-[var(--border)] rounded-full p-1.5 shadow-xl">
        <div ref={pillRef} className="absolute h-[calc(100%-12px)] bg-[var(--accent)] rounded-full shadow-lg z-0" />
        
        <NavLink label="HUD Core" icon={<LayoutDashboard size={14}/>} active={activeLabel === "HUD Core"} onClick={() => handleNavClick("HUD Core", () => setNerdMode(false))} />
        <NavLink label="Nerd Mode" icon={<Terminal size={14}/>} active={activeLabel === "Nerd Mode"} onClick={() => handleNavClick("Nerd Mode", () => setNerdMode(true))} />
        <NavLink label="Analytics Logs" icon={<BarChart3 size={14}/>} active={activeLabel === "Analytics Logs"} onClick={() => handleNavClick("Analytics Logs", onOpenAnalytics!)} />
        <NavLink label="Settings" icon={<Settings size={14}/>} active={activeLabel === "Settings"} onClick={() => handleNavClick("Settings", onOpenSettings)} />
      </nav>

      {/* Status Badge */}
      <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] pl-3 pr-5 py-2.5 rounded-full shadow-xl">
        <div className={`w-2.5 h-2.5 rounded-full ${isEmergency ? "bg-[var(--alert)] animate-pulse" : "bg-[var(--success)]"}`}></div>
        <span className="text-[10px] font-bold tracking-widest uppercase">{isEmergency ? "Emergency" : "Active & Secure"}</span>
      </div>
    </header>
  );
}

function NavLink({ label, icon, active, onClick }: any) {
  return (
    <div 
      data-label={label}
      onClick={onClick}
      className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wider cursor-pointer transition-colors duration-300 ${active ? "text-[#3D2B1F]" : "text-[var(--text-secondary)]"}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}
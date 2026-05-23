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
  isModalOpen: boolean; 
}

export default function Header({ 
  isConnected, isEmergency, onOpenSettings, onOpenAnalytics, nerdMode, setNerdMode, isModalOpen 
}: Props) {
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  
  const [activeLabel, setActiveLabel] = useState("HUD Core");
  const [lastFunctionalTab, setLastFunctionalTab] = useState("HUD Core");

  // Animate pill movement
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

  // Reset tab when modal closes
  // This hook ensures that when isModalOpen becomes false, 
  // the pill snaps back to the last functional tab (HUD Core or Dev Mode)
  useEffect(() => {
    if (!isModalOpen) {
      setActiveLabel(lastFunctionalTab);
    }
  }, [isModalOpen, lastFunctionalTab]);

  const handleNavClick = (label: string, action: () => void, isFunctional: boolean) => {
    // Only update the "lastFunctionalTab" if it's one of the main HUD/Dev views
    if (isFunctional) {
      setLastFunctionalTab(label);
    }
    // Always update activeLabel so the pill moves to the clicked item
    setActiveLabel(label);
    action();
  };

  return (
    <header 
      ref={headerRef}
      className="flex flex-wrap justify-between w-full items-center max-w-[1700px] mx-auto gap-6 px-6 py-4 animate-in slide-in-from-bottom-8 duration-700"
    >
      {/* 2. Brand Section (Center) */}
      <div className="flex items-center gap-4 cursor-pointer">
        <div className="w-10 h-10 bg-[var(--card)] border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--accent)]">
          <ShieldCheck size={20} />
        </div>
        <h1 className="text-xl font-black text-[var(--card)] tracking-tighter uppercase leading-none">
          SafeDrive <span className="text-[var(--accent)]">AI</span>
        </h1>
      </div>

      {/* 3. Navigation Dock (Moved to Right) */}
      <nav ref={navRef} className="relative flex items-center bg-[var(--card)] border border-[var(--border)] rounded-full p-1.5 shadow-xl ">
        <div ref={pillRef} className="absolute h-[calc(100%-12px)] bg-[var(--accent)] rounded-full shadow-lg z-0" />
        
        <NavLink label="HUD Core" icon={<LayoutDashboard size={14}/>} active={activeLabel === "HUD Core"} onClick={() => handleNavClick("HUD Core", () => setNerdMode(false), true)} />
        <NavLink label="Dev Mode" icon={<Terminal size={14}/>} active={activeLabel === "Dev Mode"} onClick={() => handleNavClick("Dev Mode", () => setNerdMode(true), true)} />
        <NavLink label="History" icon={<BarChart3 size={14}/>} active={activeLabel === "History"} onClick={() => handleNavClick("History", onOpenAnalytics!, false)} />
        <NavLink label="Settings" icon={<Settings size={14}/>} active={activeLabel === "Settings"} onClick={() => handleNavClick("Settings", onOpenSettings, false)} />
      </nav>

      {/* 1. Status Badge (Moved to Left) */}
      <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] pl-3 pr-5 py-2.5 rounded-full shadow-xl">
        <div className={`w-2.5 h-2.5 rounded-full ${isEmergency ? "bg-[var(--alert)] animate-pulse" : "bg-[var(--success)]"}`}></div>
        <span className="text-[10px] font-bold tracking-widest uppercase">{isEmergency ? "Emergency" : "System Secure"}</span>
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
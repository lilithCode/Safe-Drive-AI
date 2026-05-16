"use client";

import React, { useRef } from "react";
import { ShieldCheck, LayoutDashboard, BarChart3, Settings } from "lucide-react";
import gsap from "gsap";

interface Props {
  isConnected: boolean;
  isEmergency: boolean;
  onOpenSettings: () => void;
}

export default function Header({ isConnected, isEmergency, onOpenSettings }: Props) {
  const brandRef = useRef(null);

  const handleLogoHover = () => {
    gsap.to(brandRef.current, { scale: 1.05, duration: 0.3, ease: "power2.out" });
  };

  const handleLogoLeave = () => {
    gsap.to(brandRef.current, { scale: 1, duration: 0.3, ease: "power2.in" });
  };

  return (
    <header className="flex flex-wrap justify-between items-center mb-8 max-w-[1600px] mx-auto gap-4 px-2 sm:px-0">
      
      {/* Brand Section */}
      <div 
        ref={brandRef}
        onMouseEnter={handleLogoHover}
        onMouseLeave={handleLogoLeave}
        className="flex items-center gap-4 cursor-pointer"
      >
        <div className="relative group">
          <div className="absolute -inset-1 bg-[var(--accent)] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative w-12 h-12 bg-[var(--card)] border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--accent)] shadow-2xl">
            <ShieldCheck size={24} strokeWidth={2} />
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-black text-[var(--card)] tracking-tighter uppercase leading-none">
            SafeDrive <span className="text-[var(--accent)]">AI</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-8 h-[1px] bg-[var(--accent)]/40"></span>
            <p className="text-[9px] text-[var(--accent-soft)] font-bold uppercase tracking-[0.2em]">
              Autonomous Monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden lg:flex items-center bg-[var(--card)] border border-[var(--border)] rounded-full p-1.5 shadow-xl">
        <NavLink icon={<LayoutDashboard size={14}/>} label="Dashboard" active />
        <NavLink icon={<BarChart3 size={14}/>} label="Analytics" />
        <NavLink 
          icon={<Settings size={14}/>} 
          label="Settings" 
          onClick={onOpenSettings} 
        />
      </nav>

      {/* Connection / Status Badge */}
      <div className={`flex items-center gap-3 bg-[var(--card)] border ${isEmergency ? 'border-[var(--alert)]' : 'border-[var(--border)]'} pl-3 pr-5 py-2.5 rounded-full shadow-xl transition-all duration-500`}>
        <div className="relative flex items-center justify-center">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-1000 ${
              isEmergency 
                ? "bg-[var(--alert)] animate-pulse shadow-[0_0_12px_rgba(217,83,79,0.6)]" 
                : isConnected 
                  ? "bg-[var(--success)] animate-pulse shadow-[0_0_12px_rgba(163,177,138,0.6)]" 
                  : "bg-[var(--border)]"
            }`}
          ></div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none mb-0.5">
            System Status
          </span>
          <span className={`text-[10px] font-bold tracking-widest uppercase ${
            isEmergency ? "text-[var(--alert)]" : "text-[var(--text-primary)]"
          }`}>
            {isEmergency ? "Emergency Alert" : isConnected ? "Active & Secure" : "Establishing..."}
          </span>
        </div>
      </div>
    </header>
  );
}

function NavLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  const linkRef = useRef(null);

  const onEnter = () => {
    if (!active) {
      gsap.to(linkRef.current, { backgroundColor: "rgba(232, 176, 111, 0.1)", color: "var(--accent)", duration: 0.3 });
    }
  };

  const onLeave = () => {
    if (!active) {
      gsap.to(linkRef.current, { backgroundColor: "transparent", color: "var(--text-secondary)", duration: 0.3 });
    }
  };

  return (
    <div 
      ref={linkRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wider transition-all cursor-pointer
        ${active 
          ? "bg-[var(--accent)] text-[var(--card)] shadow-lg shadow-[var(--accent)]/20" 
          : "text-[var(--text-secondary)]"
        }
      `}
    >
      {icon}
      {label}
    </div>
  );
}
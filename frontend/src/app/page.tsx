"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import PlaybookLogo from "@/components/PlaybookLogo";
import { useTheme } from "@/context/ThemeContext";

function SplashContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFrozen = searchParams?.get("freeze") === "true";
  const { currentTheme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING TACTICAL PROTOCOLS...");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const navigatedRef = useRef(false);

  const navigateToCommand = () => {
    if (navigatedRef.current || isFrozen) return;
    navigatedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      router.replace("/dynasty-room?arena=command");
    }, 250);
  };

  useEffect(() => {
    if (isFrozen) {
      setProgress(75);
      setStatusText("COMPILING ACTION CENTER COCKPIT...");
      return;
    }

    const startTime = Date.now();
    const duration = 1200; // 1.2 second fast snappy splash

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(current);

      if (current < 30) {
        setStatusText("INITIALIZING TACTICAL PROTOCOLS...");
      } else if (current < 65) {
        setStatusText("SYNCING LEAGUE ROSTERS & QUANT TIERS...");
      } else if (current < 90) {
        setStatusText("COMPILING ACTION CENTER COCKPIT...");
      } else {
        setStatusText("WAR ROOM READY • ENTERING COMMAND ARENA");
      }

      if (current < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(navigateToCommand, 150);
      }
    };

    const frame = requestAnimationFrame(updateProgress);
    const backupTimer = setTimeout(navigateToCommand, 1800);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(backupTimer);
    };
  }, []);

  return (
    <main 
      onClick={navigateToCommand}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-4 select-none cursor-pointer overflow-hidden transition-opacity duration-300 ${
        isFadingOut ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Ambient background glow matching current active theme */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-25 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${currentTheme.primary} 0%, transparent 70%)`,
        }}
      />

      {/* Tactical field yard grid watermark */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px"
        }}
      />

      {/* Main Center Content Box */}
      <div className="relative z-10 flex flex-col items-center max-w-sm text-center space-y-6">
        
        {/* Animated Shield Logo with Rotating Radar Crosshairs */}
        <div className="relative flex items-center justify-center">
          {/* Rotating tactical radar ring */}
          <div 
            className="absolute w-32 h-32 rounded-full border border-dashed border-zinc-700/60 animate-[spin_12s_linear_infinite] pointer-events-none"
          />
          {/* Secondary counter-rotating ring */}
          <div 
            className="absolute w-28 h-28 rounded-full border border-dotted pointer-events-none animate-[spin_8s_linear_infinite_reverse]"
            style={{ borderColor: `${currentTheme.primary}40` }}
          />
          
          {/* Large Animated Shield Logo */}
          <div 
            className="p-3.5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl transition-transform transform duration-300 hover:scale-105"
            style={{
              boxShadow: `0 0 35px ${currentTheme.glow}`,
              borderColor: `${currentTheme.primary}50`
            }}
          >
            <PlaybookLogo size={76} animated={true} />
          </div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-center gap-1.5 leading-none">
            <h1 className="text-3xl sm:text-4xl font-black italic tracking-wider text-white font-sans">
              BLINDSIDE{" "}
              <span 
                style={{ 
                  color: currentTheme.primary,
                  textShadow: `0 0 16px ${currentTheme.glow}`
                }}
              >
                DYNASTY
              </span>
            </h1>
          </div>
          <p className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.25em] text-zinc-400 uppercase">
            Tactical War Room • Quant Engine
          </p>
        </div>

        {/* HUD Progress Bar & Status Readout */}
        <div className="w-full max-w-[280px] space-y-2.5 pt-2">
          {/* Status ticker */}
          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-zinc-400 truncate flex items-center gap-1.5">
              <span 
                className="w-1.5 h-1.5 rounded-full animate-ping inline-block"
                style={{ backgroundColor: currentTheme.primary }}
              />
              {statusText}
            </span>
            <span className="text-zinc-500 pl-2 shrink-0">{progress}%</span>
          </div>

          {/* Glowing Progress Track */}
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 shadow-inner">
            <div 
              className="h-full rounded-full transition-all duration-75 ease-out"
              style={{ 
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${currentTheme.primary}, #34d399)`,
                boxShadow: `0 0 10px ${currentTheme.primary}`
              }}
            />
          </div>
        </div>

        {/* Discreet manual bypass / enter button */}
        <div className="pt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToCommand();
            }}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800/60 hover:border-zinc-700 bg-zinc-900/40"
          >
            <span>Tap anywhere to launch</span>
            <ArrowRight size={12} />
          </button>
        </div>

      </div>

      {/* Bottom Subtitle / Tagline */}
      <footer className="absolute bottom-6 text-center text-[10px] font-mono text-zinc-600 tracking-wider uppercase">
        Sleeper • ESPN • Yahoo Dynasty Management
      </footer>
    </main>
  );
}

export default function AppSplashScreen() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-zinc-950" />}>
      <SplashContent />
    </Suspense>
  );
}

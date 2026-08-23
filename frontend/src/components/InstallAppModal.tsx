"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, CheckCircle2, Sparkles, ExternalLink, X, Shield, ArrowRight, Layers, Flame } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import PlaybookLogo from "./PlaybookLogo";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const { currentTheme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Check if already running standalone
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install on Android:\n1. Tap the 3 dots (⋮) in Chrome\n2. Tap 'Install app' or 'Add to Home screen'");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal Header with Playbook Logo */}
        <div className="flex items-center gap-4">
          <PlaybookLogo size={48} animated={true} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tight">
                DOWNLOAD & INSTALL APP
              </h2>
            </div>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
              Android Standalone WebAPK & Native App
            </p>
          </div>
        </div>

        {/* App Status Banner */}
        <div className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Full-Screen Mobile Experience</p>
              <p className="text-[11px] text-zinc-400">Zero address bars • Standalone icon • Fast caching</p>
            </div>
          </div>
          {isInstalled && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 size={12} /> Installed
            </span>
          )}
        </div>

        {/* Option 1: Instant Android 1-Click Install */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest block">
            Option 1: Instant 1-Tap Mobile Install (Recommended)
          </span>

          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(249,115,22,0.35)] flex items-center justify-center gap-2.5"
          >
            <Download size={18} />
            <span>Install App on Android Home Screen</span>
          </button>
        </div>

        {/* Option 2: Step-By-Step Chrome Browser Install Guide */}
        <div className="bg-zinc-950/90 rounded-2xl p-4 border border-zinc-800 space-y-2.5 font-mono text-xs text-zinc-300">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
            📋 2-Step Manual Install for Android Chrome:
          </span>
          <div className="flex items-start gap-2.5 text-zinc-300">
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
            <span>Tap the browser menu <strong>(⋮ 3 vertical dots)</strong> in Chrome / Brave.</span>
          </div>
          <div className="flex items-start gap-2.5 text-zinc-300">
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
            <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
          </div>
        </div>

        {/* GitHub APK Builder Link */}
        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" />
            <span>Capacitor Native APK Package</span>
          </div>
          <a
            href="https://github.com/Insolublenitrate/dynasty-brain/releases"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>GitHub Releases</span>
            <ExternalLink size={12} />
          </a>
        </div>

      </div>
    </div>
  );
}

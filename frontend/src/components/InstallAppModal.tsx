"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, CheckCircle2, Sparkles, ExternalLink, X, Shield, ArrowRight, Layers, Flame, Apple, Play, Compass, HardHat } from "lucide-react";
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
  const [activePlatform, setActivePlatform] = useState<"android" | "ios">("android");

  useEffect(() => {
    // Auto-detect iOS vs Android
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent || "";
      if (/iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) {
        setActivePlatform("ios");
      } else {
        setActivePlatform("android");
      }
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

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
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
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
              <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tight font-sans">
                INSTALL BLINDSIDE DYNASTY
              </h2>
            </div>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
              Mobile App & Standalone War Room
            </p>
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 font-mono text-xs font-bold">
          <button
            onClick={() => setActivePlatform("android")}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activePlatform === "android"
                ? "bg-zinc-800 text-white shadow-md border border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone size={16} className="text-emerald-400" />
            <span>Android (APK / PWA)</span>
          </button>

          <button
            onClick={() => setActivePlatform("ios")}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activePlatform === "ios"
                ? "bg-zinc-800 text-white shadow-md border border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Apple size={16} className="text-zinc-200" />
            <span className="flex items-center gap-1.5">
              <span>Apple iOS</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Film Room
              </span>
            </span>
          </button>
        </div>

        {/* App Status Banner */}
        <div className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Smartphone size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Full-Screen Mobile Experience</p>
              <p className="text-[11px] text-zinc-400">Zero address bars • Standalone home icon • Fast caching</p>
            </div>
          </div>
          {isInstalled && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 size={12} /> Installed
            </span>
          )}
        </div>

        {/* ANDROID CONTENT */}
        {activePlatform === "android" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Primary: Direct APK Sideload Download */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Smartphone size={13} /> Option 1: Native Android App (.APK)
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                  v1.1 (Latest Release)
                </span>
              </div>

              <a
                href="/downloads/BlindsideDynasty-v1.1.apk"
                download="BlindsideDynasty-v1.1.apk"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2.5 group"
              >
                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                <span>Download Android APK v1.1 (28 MB)</span>
              </a>

              <div className="space-y-1.5 text-[11px] font-mono text-zinc-400 pt-1">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">1</span>
                  <span>Tap <strong>"Download Android APK v1.1"</strong> above.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">2</span>
                  <span>When downloaded, tap <strong>BlindsideDynasty-v1.1.apk</strong> in your notification bar and select <strong>"Install"</strong> (or "Update").</span>
                </div>
              </div>
            </div>

            {/* Secondary: Instant Chrome WebAPK (PWA) */}
            <div className="bg-zinc-950/90 rounded-2xl p-4 border border-zinc-800 space-y-3 font-mono text-xs text-zinc-300">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <Flame size={12} /> Option 2: Instant Chrome WebAPK
                </span>
                <span className="text-[9px] text-zinc-500 uppercase">Zero APK File</span>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-all border border-zinc-700 flex items-center justify-center gap-2"
              >
                <Download size={15} className="text-amber-400" />
                <span>Add to Home Screen (Instant PWA)</span>
              </button>

              <div className="text-[11px] text-zinc-400 space-y-1 pt-1">
                <p>Or tap the <strong>3 vertical dots (⋮)</strong> in Chrome / Brave &rarr; select <strong>"Install app"</strong>.</p>
              </div>
            </div>
          </div>
        )}

        {/* IOS CONTENT (UNDER CONSTRUCTION / FILM ROOM) */}
        {activePlatform === "ios" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Witty Football Construction / Film Room Banner */}
            <div className="bg-amber-950/30 border-2 border-amber-600/50 rounded-2xl p-4 space-y-2 relative overflow-hidden">
              <div className="flex items-center gap-2.5 text-amber-400">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Compass size={18} className="animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest block text-amber-400">
                    IN THE FILM ROOM • PRACTICE SQUAD
                  </span>
                  <h4 className="text-sm font-black text-white italic tracking-tight">
                    OFFICIAL REVIEW: iOS APP STORE LAUNCH
                  </h4>
                </div>
              </div>

              <p className="text-[11px] text-zinc-300 font-sans leading-relaxed pt-1">
                Coach is currently breaking down game film and running two-a-days to push the native iOS app through Apple's goal line defense. <strong>Official App Store release is in the Red Zone!</strong>
              </p>
            </div>

            {/* The "Call An Audible" Workaround Play */}
            <div className="bg-zinc-950/90 rounded-2xl p-4 border border-zinc-800 space-y-3 font-mono text-xs text-zinc-300">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Flame size={12} /> CALL AN AUDIBLE: Run Safari Home Screen Play
                </span>
                <span className="text-[9px] text-zinc-500 uppercase">Available Today</span>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-bold text-white font-sans text-xs">Snap the Ball in Safari</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Tap the <strong>Share button</strong> at the bottom toolbar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-bold text-white font-sans text-xs">Hit the Open Receiver</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-bold text-white font-sans text-xs">Touchdown!</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Tap <strong>Add</strong> in the top right. Blindside Dynasty launches in full-screen on your iPhone!</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Capacitor Cross-Platform Native Project Link */}
        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" />
            <span>Capacitor iOS & Android Engine</span>
          </div>
          <a
            href="https://github.com/Insolublenitrate/dynasty-brain"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>GitHub Sync</span>
            <ExternalLink size={12} />
          </a>
        </div>

      </div>
    </div>
  );
}

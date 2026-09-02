"use client";

import React, { useState, useEffect, Suspense } from "react";
import { 
  Database, GraduationCap, Radar, Trophy, Settings, Flame, Search, 
  Sparkles, Smartphone, Activity, HelpCircle, ChevronDown, Target, 
  CalendarDays, Crown, Briefcase, BookOpen, Compass
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import SettingsModal from "@/components/SettingsModal";
import InstallAppModal from "@/components/InstallAppModal";
import TacticalGlossaryModal from "@/components/TacticalGlossaryModal";
import WarRoomTour from "@/components/WarRoomTour";
import PlaybookLogo from "@/components/PlaybookLogo";
import { useTheme } from "@/context/ThemeContext";
import { useLeague } from "@/context/LeagueContext";

function TopNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentArena = searchParams.get("arena") || "command";
  const { leagueName, leagueId } = useLeague();
  const { currentTheme } = useTheme();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  // Auto-launch tour for first-time visitors
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasCompletedTour = localStorage.getItem("blindside_tour_completed");
      if (!hasCompletedTour) {
        // Small delay so page finishes loading
        const timer = setTimeout(() => {
          setIsTourOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const mainArenas = [
    { id: "command", href: "/dynasty-room?arena=command", label: "Command", icon: Target, isDynasty: true },
    { id: "matchups", href: "/dynasty-room?arena=matchups", label: "Matchups", icon: CalendarDays, isDynasty: true },
    { id: "power", href: "/dynasty-room?arena=power", label: "Power", icon: Crown, isDynasty: true },
    { id: "trade", href: "/dynasty-room?arena=trade", label: "Trade", icon: Briefcase, isDynasty: true },
    { id: "madden", href: "/ask-madden", label: "Ask Madden", icon: Sparkles, isDynasty: false },
  ];

  const secondaryTools = [
    { href: "/glossary", label: "Field Guide Encyclopedia", icon: BookOpen },
    { href: "/player-analyzer", label: "Player Analyzer", icon: Search },
    { href: "/cross-reference", label: "Cross Reference Radar", icon: Radar },
    { href: "/top-performers", label: "Top Performers", icon: Trophy },
    { href: "/rookie-analyzer", label: "Rookie Draft Board", icon: GraduationCap },
    { href: "/war-room", label: "Draft War Room", icon: Flame },
    { href: "/database", label: "Player Database", icon: Database },
    { href: "/support", label: "Help & Sync Guide", icon: HelpCircle },
  ];

  const isArenaActive = (item: typeof mainArenas[0]) => {
    if (item.isDynasty) {
      return (pathname === "/dynasty-room" || pathname === "/") && currentArena === item.id;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <>
      <header className="bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Logo + League Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dynasty-room" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <PlaybookLogo size={34} animated={true} />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black text-white italic tracking-wider font-sans leading-none">
                  BLINDSIDE <span style={{ color: currentTheme.primary, textShadow: `0 0 8px ${currentTheme.glow}` }}>DYNASTY</span>
                </span>
                {leagueName && (
                  <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[140px] sm:max-w-[200px] mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    {leagueName}
                  </span>
                )}
              </div>
            </Link>
          </div>
          
          {/* Center Navigation Links (Desktop 5 Arenas) */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80 shadow-inner">
            {mainArenas.map((item) => {
              const active = isArenaActive(item);
              const Icon = item.icon;
              return (
                <Link 
                  key={item.id} 
                  href={item.href} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
                    active 
                      ? "bg-zinc-800 text-white shadow-md border border-zinc-700" 
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                  style={active ? { color: currentTheme.primary } : {}}
                >
                  <Icon size={14} className={active ? "stroke-[2.5]" : "stroke-[1.75]"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* More Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                onBlur={() => setTimeout(() => setIsToolsMenuOpen(false), 200)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-all font-semibold"
              >
                <span>More</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isToolsMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isToolsMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                    Quant & Scouting Tools
                  </div>
                  {secondaryTools.map((tool) => {
                    const ToolIcon = tool.icon;
                    const isToolActive = pathname === tool.href;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={() => setIsToolsMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                          isToolActive 
                            ? "bg-zinc-800 text-white font-bold" 
                            : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        <ToolIcon size={14} style={isToolActive ? { color: currentTheme.primary } : {}} />
                        <span>{tool.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions: Field Guide, Tour, Get App, Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Tour Button */}
            <button
              onClick={() => setIsTourOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono font-bold shadow-sm"
              title="Launch Guided War Room Tour"
            >
              <Compass size={14} style={{ color: currentTheme.primary }} />
              <span className="hidden sm:inline">Tour</span>
            </button>

            {/* Field Guide Glossary Button */}
            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono font-bold shadow-sm"
              title="Open Tactical Metric Field Guide"
            >
              <BookOpen size={14} className="text-amber-400" />
              <span className="hidden md:inline">Field Guide</span>
            </button>

            {/* Mobile App Download Button */}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono font-bold shadow-sm"
              title="Download & Install Mobile App"
            >
              <Smartphone size={14} className="text-emerald-400" />
              <span className="hidden xl:inline">Get App</span>
            </button>

            {/* Settings Button */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-1.5 text-xs font-mono font-bold"
              title="League & Theme Settings"
            >
              <Settings size={16} className="transition-transform hover:rotate-45" />
              <span className="hidden 2xl:inline text-zinc-300">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Field Guide Glossary Modal */}
      <TacticalGlossaryModal 
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      {/* Interactive Guided Tour */}
      <WarRoomTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onOpenGlossary={() => {
          setIsTourOpen(false);
          setIsGlossaryOpen(true);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </>
  );
}

export default function TopNav() {
  return (
    <Suspense fallback={
      <header className="bg-zinc-950/90 border-b border-zinc-800/80 sticky top-0 z-40 h-16">
        <div className="max-w-[1440px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-white font-black italic">BLINDSIDE DYNASTY</div>
        </div>
      </header>
    }>
      <TopNavInner />
    </Suspense>
  );
}

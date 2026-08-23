"use client";

import React, { useState } from "react";
import { Database, GraduationCap, Radar, Trophy, Settings, Flame, Search, Sparkles, Smartphone, Activity, HelpCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SettingsModal from "@/components/SettingsModal";
import InstallAppModal from "@/components/InstallAppModal";
import PlaybookLogo from "@/components/PlaybookLogo";
import { useTheme } from "@/context/ThemeContext";

export default function TopNav() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const { currentTheme } = useTheme();

  const navItems = [
    { href: "/dynasty-room", label: "Dynasty Room", icon: Activity },
    { href: "/ask-madden", label: "Ask Madden 🎙️", icon: Sparkles },
    { href: "/player-analyzer", label: "Player Analyzer", icon: Search },
    { href: "/cross-reference", label: "Cross Reference", icon: Radar },
    { href: "/top-performers", label: "Top Performers", icon: Trophy },
    { href: "/database", label: "Database", icon: Database },
    { href: "/rookie-analyzer", label: "Rookies", icon: GraduationCap },
    { href: "/war-room", label: "War Room", icon: Flame },
    { href: "/support", label: "Support", icon: HelpCircle },
  ];

  const getLinkClasses = (path: string) => {
    const isActive = pathname === path || (path === "/dynasty-room" && pathname === "/");
    return `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
      isActive 
        ? "bg-zinc-800/90 text-white shadow-lg border border-accent glow-accent-sm" 
        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent"
    }`;
  };

  return (
    <>
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo with Animated X & O Tactical Playbook */}
          <Link href="/dynasty-room" className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0">
            <PlaybookLogo size={36} animated={true} />
            <h1 className="text-xl md:text-2xl font-black text-white italic tracking-wider hidden sm:block font-sans">
              WAIVER <span style={{ color: currentTheme.primary, textShadow: `0 0 10px ${currentTheme.glow}` }}>WIRETAP</span>
            </h1>
          </Link>
          
          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={getLinkClasses(item.href)}>
                  <Icon size={16} style={pathname === item.href || (item.href === "/dynasty-room" && pathname === "/") ? { color: currentTheme.primary } : {}} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Install App Button & Settings Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
              title="Download & Install Android App"
            >
              <Smartphone size={15} className="text-emerald-400" />
              <span className="hidden sm:inline">Get App</span>
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Open Theme & League Settings"
            >
              <Settings size={18} className="transition-transform hover:rotate-45" />
              <span className="hidden xl:inline text-zinc-300">Settings</span>
            </button>
          </div>
        </div>
      </header>

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

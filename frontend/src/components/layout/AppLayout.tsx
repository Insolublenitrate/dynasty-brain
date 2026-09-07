"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import PlaybookBackground from "@/components/PlaybookBackground";
import { useTheme } from "@/context/ThemeContext";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { carbonEnabled, playbookEnabled, cleanMode } = useTheme();
  const isSplash = pathname === "/";

  if (isSplash) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center relative select-none">
        {children}
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden flex flex-col ${
      cleanMode 
        ? 'bg-[#09090b] clean-view' 
        : (carbonEnabled ? 'bg-carbon-mesh' : 'bg-zinc-950')
    } text-zinc-100 transition-colors relative ${cleanMode ? 'selection:bg-zinc-800' : 'selection:bg-orange-500/30'}`}>
      {/* Animated Coaches Playbook Background Layer (Suppressed in Clean Mode) */}
      {!cleanMode && playbookEnabled && <PlaybookBackground />}
      
      <TopNav />
      <main className="flex-1 flex flex-col w-full max-w-full min-w-0 pb-28 sm:pb-16 relative overflow-x-hidden">
        <div className="w-full max-w-[1440px] mx-auto px-2.5 sm:px-6 lg:px-8 pt-0 sm:pt-2 flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </main>

      {/* Sticky Native-App Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}


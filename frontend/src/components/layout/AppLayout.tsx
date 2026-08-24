"use client";

import React, { ReactNode } from "react";
import TopNav from "@/components/TopNav";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import PlaybookBackground from "@/components/PlaybookBackground";
import { useTheme } from "@/context/ThemeContext";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { carbonEnabled, playbookEnabled } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col ${carbonEnabled ? 'bg-carbon-mesh' : 'bg-zinc-950'} text-zinc-100 transition-colors relative selection:bg-orange-500/30`}>
      {/* Animated Coaches Playbook Background Layer */}
      {playbookEnabled && <PlaybookBackground />}
      
      <TopNav />
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8 relative z-10">
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1 flex flex-col">
          {children}
        </div>
      </main>

      {/* Sticky Native-App Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}


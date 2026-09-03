"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import PlaybookBackground from "@/components/PlaybookBackground";
import { useTheme } from "@/context/ThemeContext";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { carbonEnabled, playbookEnabled } = useTheme();
  const isSplash = pathname === "/";

  if (isSplash) {
    return (
      <div className="min-h-screen w-full max-w-[100vw] overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center relative select-none">
        {children}
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full max-w-[100vw] overflow-x-clip flex flex-col ${carbonEnabled ? 'bg-carbon-mesh' : 'bg-zinc-950'} text-zinc-100 transition-colors relative selection:bg-orange-500/30`}>
      {/* Animated Coaches Playbook Background Layer */}
      {playbookEnabled && <PlaybookBackground />}
      
      <TopNav />
      <main className="flex-1 flex flex-col w-full max-w-[100vw] min-w-0 pb-28 sm:pb-16 relative">
        <div className="w-full max-w-[1440px] mx-auto px-2.5 sm:px-6 lg:px-8 pt-0 sm:pt-2 flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </main>

      {/* Sticky Native-App Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}


"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Target, CalendarDays, Crown, Briefcase, Sparkles, Users } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

function MobileBottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentArena = searchParams.get("arena") || "command";
  const { currentTheme } = useTheme();

  const NAV_ITEMS = [
    { id: "command", href: "/dynasty-room?arena=command", label: "Command", icon: Target, isDynastyTab: true },
    { id: "players", href: "/dynasty-room?arena=players", label: "Players", icon: Users, isDynastyTab: true },
    { id: "matchups", href: "/dynasty-room?arena=matchups", label: "Matchups", icon: CalendarDays, isDynastyTab: true },
    { id: "power", href: "/dynasty-room?arena=power", label: "Power", icon: Crown, isDynastyTab: true },
    { id: "trade", href: "/dynasty-room?arena=trade", label: "Trade", icon: Briefcase, isDynastyTab: true },
    { id: "madden", href: "/ask-madden", label: "Madden", icon: Sparkles, isDynastyTab: false },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 w-full max-w-[100vw] overflow-x-hidden bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] pb-safe">
      <div className="flex items-center justify-around h-16 px-1 max-w-[100vw]">
        {NAV_ITEMS.map((item) => {
          let isActive = false;
          if (item.id === "players") {
            isActive = ((pathname === "/dynasty-room" || pathname === "/") && currentArena === "players") ||
              pathname.startsWith("/player-analyzer") ||
              pathname.startsWith("/database") ||
              pathname.startsWith("/rookie-analyzer") ||
              pathname.startsWith("/top-performers") ||
              pathname.startsWith("/radar") ||
              pathname.startsWith("/cross-reference") ||
              pathname.startsWith("/players");
          } else if (item.isDynastyTab) {
            isActive = (pathname === "/dynasty-room" || pathname === "/") && currentArena === item.id;
          } else {
            isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full relative py-1 transition-all duration-200"
            >
              {/* Active Glow Pill */}
              {isActive && (
                <span 
                  className="absolute top-0 w-8 h-1 rounded-full shadow-lg transition-all animate-in fade-in zoom-in-95 duration-200"
                  style={{ 
                    backgroundColor: currentTheme.primary,
                    boxShadow: `0 0 12px ${currentTheme.glow}`
                  }}
                />
              )}

              <div 
                className={`p-1 rounded-xl transition-all ${
                  isActive ? "scale-110" : "text-zinc-400 hover:text-zinc-200"
                }`}
                style={isActive ? { color: currentTheme.primary } : {}}
              >
                <Icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-[1.75]"} />
              </div>

              <span 
                className={`text-[10px] font-mono tracking-wider transition-all uppercase ${
                  isActive ? "font-black" : "font-semibold text-zinc-400"
                }`}
                style={isActive ? { color: currentTheme.primary } : {}}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  );
}

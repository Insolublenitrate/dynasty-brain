"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Target, CalendarDays, Crown, Briefcase, Sparkles, Users } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { 
  navigateDynasty, 
  getSavedDynastyState, 
  SUB_TO_ARENA_MAP, 
  DEFAULT_SUB_MAP, 
  DynastyArena,
  DynastyNavDetail
} from "@/utils/navigation";

function MobileBottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subParam = searchParams.get("sub");
  const rawArena = searchParams.get("arena") as DynastyArena | null;
  const initialArena: DynastyArena = 
    (subParam && SUB_TO_ARENA_MAP[subParam]) || 
    (rawArena && DEFAULT_SUB_MAP[rawArena] ? rawArena : null) || 
    getSavedDynastyState().arena || 
    "command";
  const [currentArena, setCurrentArena] = useState<DynastyArena>(initialArena);

  useEffect(() => {
    const handleDynastyChange = (e: Event) => {
      const detail = (e as CustomEvent<DynastyNavDetail>).detail;
      if (detail?.arena) {
        setCurrentArena(detail.arena);
      }
    };
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('sub');
      const arena = params.get('arena') as DynastyArena | null;
      const targetArena = (sub && SUB_TO_ARENA_MAP[sub]) || (arena && DEFAULT_SUB_MAP[arena] ? arena : null) || currentArena;
      setCurrentArena(targetArena);
    };
    window.addEventListener('dynasty_arena_change', handleDynastyChange);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('dynasty_arena_change', handleDynastyChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentArena]);

  useEffect(() => {
    if (!rawArena && !subParam) return;
    const target = (subParam && SUB_TO_ARENA_MAP[subParam]) || (rawArena && DEFAULT_SUB_MAP[rawArena] ? rawArena : null);
    if (target && target !== currentArena) {
      setCurrentArena(target);
    }
  }, [rawArena, subParam]);

  const { currentTheme } = useTheme();

  const NAV_ITEMS: Array<{ id: DynastyArena | "madden"; href: string; label: string; icon: any; isDynastyTab: boolean; defaultSub?: string }> = [
    { id: "command", href: "/dynasty-room/?arena=command&sub=action", label: "Command", icon: Target, isDynastyTab: true, defaultSub: "action" },
    { id: "players", href: "/dynasty-room/?arena=players&sub=analyzer", label: "Players", icon: Users, isDynastyTab: true, defaultSub: "analyzer" },
    { id: "matchups", href: "/dynasty-room/?arena=matchups&sub=slate", label: "Matchups", icon: CalendarDays, isDynastyTab: true, defaultSub: "slate" },
    { id: "power", href: "/dynasty-room/?arena=power&sub=tiers", label: "Power", icon: Crown, isDynastyTab: true, defaultSub: "tiers" },
    { id: "trade", href: "/dynasty-room/?arena=trade&sub=architect", label: "Trade", icon: Briefcase, isDynastyTab: true, defaultSub: "architect" },
    { id: "madden", href: "/ask-madden/", label: "Madden", icon: Sparkles, isDynastyTab: false },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 w-full max-w-full overflow-hidden bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] pb-safe">
      <div className="flex items-center justify-around h-16 px-1 w-full max-w-full overflow-hidden">
        {NAV_ITEMS.map((item) => {
          const isDynastyPath = pathname.startsWith("/dynasty-room") || pathname === "/";
          let isActive = false;
          if (item.id === "players") {
            isActive = (isDynastyPath && currentArena === "players") ||
              pathname.startsWith("/player-analyzer") ||
              pathname.startsWith("/database") ||
              pathname.startsWith("/rookie-analyzer") ||
              pathname.startsWith("/top-performers") ||
              pathname.startsWith("/radar") ||
              pathname.startsWith("/cross-reference") ||
              pathname.startsWith("/players");
          } else if (item.isDynastyTab) {
            isActive = isDynastyPath && currentArena === item.id;
          } else {
            isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => {
                if (item.isDynastyTab && (pathname.startsWith("/dynasty-room") || pathname === "/")) {
                  e.preventDefault();
                  navigateDynasty(item.id as DynastyArena, item.defaultSub);
                }
              }}
              className="flex flex-col items-center justify-center w-full h-full relative py-1 transition-all duration-200 active:scale-95"
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

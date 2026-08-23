"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Flame, Database, BarChart3, Users, LayoutDashboard, Settings } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MAIN_NAV = [
  { href: "/dynasty-room", label: "Dynasty Room", icon: Users },
  { href: "/player-analyzer", label: "Research", icon: BarChart3 },
  { href: "/war-room", label: "War Room", icon: Flame },
  { href: "/database", label: "Database", icon: Database },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex flex-col w-64 h-full bg-card border-r border-border">
      <div className="p-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-neon-orange via-neon-green to-neon-blue bg-clip-text text-transparent tracking-tighter">
          Dynasty Brain
        </h1>
        <p className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase mt-1">
          V3 Premium Analytics
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {MAIN_NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all duration-200 group",
                isActive 
                  ? "bg-neon-orange/10 text-neon-orange" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon 
                size={20} 
                className={cn(
                  "transition-all duration-200",
                  isActive ? "drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "group-hover:stroke-foreground"
                )} 
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors rounded-xl hover:bg-muted">
          <Settings size={20} />
          <span className="text-sm font-semibold">Settings</span>
        </div>
      </div>
    </div>
  );
}

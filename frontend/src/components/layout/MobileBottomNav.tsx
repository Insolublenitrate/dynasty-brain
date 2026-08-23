"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Flame, Database, BarChart3, Users } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_ITEMS = [
  { href: "/dynasty-room", label: "Dynasty", icon: Users },
  { href: "/player-analyzer", label: "Research", icon: BarChart3 },
  { href: "/war-room", label: "War Room", icon: Flame },
  { href: "/database", label: "Database", icon: Database },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                isActive ? "text-neon-orange" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                size={22}
                className={cn(
                  "transition-all duration-200",
                  isActive ? "stroke-current drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "stroke-[1.5]"
                )}
              />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

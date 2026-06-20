"use client";

import { Activity, Database, GraduationCap, Radar, Trophy, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  const getLinkClasses = (path: string) => {
    const isActive = pathname === path || (path === '/dynasty-room' && pathname === '/');
    return `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
      isActive 
        ? 'bg-slate-800 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)] border border-slate-700' 
        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
    }`;
  };

  return (
    <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/dynasty-room" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)]">
            <Activity size={20} className="text-slate-950" />
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white italic tracking-wider hidden sm:block">
            DYNASTY<span className="text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">BRAIN</span>
          </h1>
        </Link>
        
        {/* Navigation Links */}
        <nav className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
          <Link href="/dynasty-room" className={getLinkClasses("/dynasty-room")}>
            <Activity size={16} /> <span className="hidden md:inline">Dynasty Room</span>
          </Link>
          <Link href="/top-performers" className={getLinkClasses("/top-performers")}>
            <Trophy size={16} /> <span className="hidden md:inline">Top Performers</span>
          </Link>
          <Link href="/database" className={getLinkClasses("/database")}>
            <Database size={16} /> <span className="hidden md:inline">Database</span>
          </Link>
          <Link href="/rookie-analyzer" className={getLinkClasses("/rookie-analyzer")}>
            <GraduationCap size={16} /> <span className="hidden md:inline">Rookies</span>
          </Link>
          <Link href="/radar" className={getLinkClasses("/radar")}>
            <Radar size={16} /> <span className="hidden md:inline">Compare</span>
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button className="text-slate-500 hover:text-cyan-400 transition-colors p-2 rounded-full hover:bg-slate-800">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

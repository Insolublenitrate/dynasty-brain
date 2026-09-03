"use client";

import { useState } from "react";
import { LayoutDashboard, Radar, Target, Settings, GitCompareArrows, BarChart3, Database, Trophy, Shuffle, Swords, Briefcase, Calendar, Search, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLeague } from "@/context/LeagueContext";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { seasonYear, setSeasonYear } = useLeague();

  const getLinkClasses = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
      isActive 
        ? "bg-indigo-500/10 text-indigo-400" 
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
    }`;
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tighter">
          Blindside Dynasty
        </h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tighter">
            Blindside Dynasty
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-1">A KBD Product</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 md:mt-0 overflow-y-auto pt-6 md:pt-0">
          <Link href="/" className={getLinkClasses("/")} onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            <span>League Analyzer</span>
          </Link>
          <Link href="/dynasty-room" className={getLinkClasses("/dynasty-room")} onClick={closeSidebar}>
            <Search size={20} />
            <span>Dynasty Room</span>
          </Link>
          <Link href="/top-performers" className={getLinkClasses("/top-performers")} onClick={closeSidebar}>
            <Trophy size={20} />
            <span>Top Performers</span>
          </Link>
          <Link href="/player-analyzer" className={getLinkClasses("/player-analyzer")} onClick={closeSidebar}>
            <BarChart3 size={20} />
            <span>Player Analyzer</span>
          </Link>
          <Link href="/database" className={getLinkClasses("/database")} onClick={closeSidebar}>
            <Database size={20} />
            <span>Player Database</span>
          </Link>
          <Link href="/rookie-analyzer" className={getLinkClasses("/rookie-analyzer")} onClick={closeSidebar}>
            <GraduationCap size={20} />
            <span>Rookie Analyzer</span>
          </Link>
          <Link href="/radar" className={getLinkClasses("/radar")} onClick={closeSidebar}>
            <Radar size={20} />
            <span>Player Compare</span>
          </Link>
          <Link href="/cross-reference" className={getLinkClasses("/cross-reference")} onClick={closeSidebar}>
            <Shuffle size={20} />
            <span>Cross Reference</span>
          </Link>
          <Link href="/matrix" className={getLinkClasses("/matrix")} onClick={closeSidebar}>
            <Swords size={20} />
            <span>Team Power Matrix</span>
          </Link>
          <Link href="/trade" className={getLinkClasses("/trade")} onClick={closeSidebar}>
            <Briefcase size={20} />
            <span>Trade Architect</span>
          </Link>
          <Link href="/glossary" className={getLinkClasses("/glossary")} onClick={closeSidebar}>
            <Settings size={20} />
            <span>Glossary</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          
          <div className="flex items-center space-x-3 px-3 py-2 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
            <Settings size={20} />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </div>
      </div>
    </>
  );
}

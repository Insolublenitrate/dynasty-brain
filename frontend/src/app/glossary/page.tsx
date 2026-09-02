"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  BookOpen, Search, ArrowLeft, Crown, Target, CalendarDays, 
  Briefcase, Trophy, Activity, Sparkles, HelpCircle, Shield, Zap, ChevronRight 
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { EXPANDED_GLOSSARY } from "@/components/TacticalGlossaryModal";

export default function GlossaryPage() {
  const { currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Metrics", icon: BookOpen },
    { id: "power", label: "Power & Matrix", icon: Crown },
    { id: "roster", label: "Roster Intel & Age", icon: Target },
    { id: "matchups", label: "Matchups & Spreads", icon: CalendarDays },
    { id: "trade", label: "Draft & Trade Capital", icon: Briefcase },
    { id: "bounty", label: "Bounties & AI Coach", icon: Trophy },
    { id: "nfl", label: "NFL NextGen Metrics", icon: Activity },
  ];

  const filteredTerms = useMemo(() => {
    return EXPANDED_GLOSSARY.filter((term) => {
      const matchesCategory = activeCategory === "all" || term.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      return matchesCategory && (
        term.name.toLowerCase().includes(q) ||
        (term.shortName && term.shortName.toLowerCase().includes(q)) ||
        term.summary.toLowerCase().includes(q) ||
        (term.formula && term.formula.toLowerCase().includes(q)) ||
        term.tacticalAdvice.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen pb-24 max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 pt-1 sm:pt-2 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <Link 
            href="/dynasty-room" 
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to War Room</span>
          </Link>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-zinc-700 bg-zinc-900 shadow-inner"
              style={{ color: currentTheme.primary }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white italic tracking-tight font-sans">
                DYNASTY FIELD GUIDE
              </h1>
              <p className="text-zinc-400 text-[11px] sm:text-xs font-mono tracking-wider uppercase mt-0.5">
                The complete handbook of proprietary models and formulas
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dynasty-room?arena=command"
          className="hidden sm:flex px-4 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-200 transition-all items-center gap-2 self-start sm:self-auto shadow-md"
        >
          <Sparkles size={14} style={{ color: currentTheme.primary }} />
          <span>Launch War Room</span>
        </Link>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-zinc-950/90 border border-zinc-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl backdrop-blur-xl">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search all 45+ metrics, formulas, or strategies (e.g., Max PF, Age Cliff, Z-Score, YPRR, Spread)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-sans shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-zinc-800 text-white border-zinc-600 shadow-md"
                    : "bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
                style={isActive ? { color: currentTheme.primary, borderColor: currentTheme.primary } : {}}
              >
                <Icon size={14} className={isActive ? "stroke-[2.5]" : "stroke-[1.75]"} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTerms.map((term) => (
          <div
            key={term.id}
            className="bg-zinc-950/70 border border-zinc-800/90 hover:border-zinc-700/90 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-lg hover:shadow-2xl transition-all group backdrop-blur-sm hover:bg-zinc-900/40"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500 block mb-0.5">
                    {term.category.toUpperCase()}
                  </span>
                  <h3 className="text-base font-black text-white font-sans tracking-tight">
                    {term.name}
                  </h3>
                </div>
                {term.shortName && (
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-900 text-[10px] font-mono font-bold text-zinc-300 border border-zinc-800 shrink-0">
                    {term.shortName}
                  </span>
                )}
              </div>

              {/* Definition */}
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                {term.summary}
              </p>

              {/* Formula */}
              {term.formula && (
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5 font-mono text-[11px] text-zinc-300">
                  <span className="text-zinc-500 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Formula / Definition:</span>
                  <span style={{ color: currentTheme.primary }}>{term.formula}</span>
                </div>
              )}

              {/* Benchmarks */}
              {term.benchmarks && (
                <div className="space-y-1 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/70 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-emerald-400">
                    <span className="text-[9px] uppercase text-zinc-500 font-bold">Elite:</span>
                    <span>{term.benchmarks.elite}</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-400">
                    <span className="text-[9px] uppercase text-zinc-500 font-bold">Average:</span>
                    <span>{term.benchmarks.average}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-400">
                    <span className="text-[9px] uppercase text-zinc-500 font-bold">Danger:</span>
                    <span>{term.benchmarks.warning}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tactical Takeaway */}
            <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-3 text-xs text-emerald-300 flex items-start gap-2.5">
              <Sparkles size={15} className="shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <strong className="text-emerald-200 block text-[10px] uppercase tracking-wider font-bold font-mono">
                  Tactical Play:
                </strong>
                <p className="font-sans leading-relaxed text-emerald-300/90 text-[11px] mt-0.5">
                  {term.tacticalAdvice}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

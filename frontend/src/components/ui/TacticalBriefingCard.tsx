"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Target, Zap, Shield, HelpCircle, BookOpen, Compass } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export interface BriefingPoint {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  text: string;
  color?: string;
}

interface TacticalBriefingCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  points: BriefingPoint[];
  defaultOpen?: boolean;
  className?: string;
}

export default function TacticalBriefingCard({
  title,
  subtitle,
  badge = "HOW TO READ THIS BOARD",
  points,
  defaultOpen = false,
  className = ""
}: TacticalBriefingCardProps) {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-zinc-950/80 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${className}`}>
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 text-left hover:bg-zinc-900/40 transition-colors"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-zinc-700/60 bg-zinc-900 shadow-inner"
            style={{ color: currentTheme.primary }}
          >
            <Compass size={17} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800/90 border border-zinc-700/60 text-zinc-300">
                {badge}
              </span>
              <span className="text-xs font-bold text-white font-sans truncate">
                {title}
              </span>
            </div>
            {subtitle && (
              <p className="text-[11px] text-zinc-400 font-sans truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono font-bold text-zinc-400">
          <span className="hidden sm:inline text-[11px] text-zinc-400">
            {isOpen ? "Collapse Guide" : "Read Guide"}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-zinc-800/60 bg-zinc-900/30 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {points.map((pt, idx) => {
              const Icon = pt.icon || Target;
              return (
                <div 
                  key={idx} 
                  className="bg-zinc-950/70 border border-zinc-800/90 p-3.5 rounded-xl flex flex-col gap-1.5 relative overflow-hidden group hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
                      style={pt.color ? { color: pt.color } : { color: currentTheme.primary }}
                    >
                      <Icon size={14} />
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-200">
                      {pt.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    {pt.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

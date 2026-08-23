import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SubMetric {
  label: string;
  value: string | number;
}

interface LiveMetricCardProps {
  title: string;
  metricValue: string | number;
  playerName: string;
  team: string;
  rank: number;
  totalPlayers: number;
  vsLastWeek: number;
  subMetrics: SubMetric[];
  isPositive?: boolean;
}

export function LiveMetricCard({
  title,
  metricValue,
  playerName,
  team,
  rank,
  totalPlayers,
  vsLastWeek,
  subMetrics,
  isPositive = true,
}: LiveMetricCardProps) {
  const vsColor = vsLastWeek >= 0 ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.4)]';
  const glowClass = isPositive ? 'shadow-[0_0_30px_rgba(52,211,153,0.05)] border-emerald-500/20' : 'shadow-[0_0_30px_rgba(249,115,22,0.05)] border-orange-500/20';
  const textGradient = isPositive ? 'from-emerald-400 to-teal-300' : 'from-orange-400 to-amber-300';

  return (
    <div className={cn("relative bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 sm:p-6 overflow-hidden flex flex-col justify-between w-full min-h-[290px] transition-all hover:border-zinc-700 shadow-xl", glowClass)}>
      
      {/* Background Accent Gradient */}
      <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2 bg-gradient-to-br to-transparent", isPositive ? 'from-emerald-500/10' : 'from-orange-500/10')}></div>

      {/* Header */}
      <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-widest font-black">
        <div className="flex items-center gap-2">
          <Activity size={16} className={isPositive ? "text-emerald-400" : "text-orange-400"} />
          <span className="text-zinc-200 font-bold">{title}</span>
          <span className="text-zinc-700">•</span>
          <span className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]">LEAGUE LEADER</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 text-[9px] font-mono font-bold">QUALIFIED</span>
        </div>
      </div>

      {/* Main Metric & Rank */}
      <div className="flex justify-between items-start my-3 z-10">
        <div>
          <div className={cn(`text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r bg-clip-text text-transparent`, textGradient)}>
            {(Number(metricValue) > 0 ? '+' : '')}{metricValue}
          </div>
          <div className="text-lg sm:text-xl font-black text-white mt-2 tracking-wide flex items-center gap-2.5">
            <span>{playerName}</span>
            <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400">{team}</span>
          </div>
        </div>
        
        <div className="text-right flex flex-col gap-2.5">
          <div className="bg-zinc-950/90 px-3 py-2 rounded-xl border border-zinc-800 flex flex-col items-end shadow-inner">
            <div className="text-[9px] text-zinc-400 uppercase font-black tracking-wider">Rank</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-baseline gap-0.5">
              {rank}<span className="text-zinc-500 text-sm font-bold">/{totalPlayers}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[9px] text-zinc-400 uppercase font-black tracking-wider">vs Last Wk</div>
            <div className={cn("text-sm sm:text-base font-black font-mono flex items-center gap-1", vsColor)}>
              {vsLastWeek >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {(vsLastWeek > 0 ? '+' : '')}{vsLastWeek}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Metrics Grid (Mobile 2x2 or 4-col with clean padding) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 z-10 bg-zinc-950/80 rounded-xl p-3 sm:p-3.5 border border-zinc-800 shadow-inner">
        {subMetrics.map((sm, idx) => (
          <div key={idx} className={cn("flex flex-col", idx !== 0 && idx % 2 !== 0 ? 'sm:border-l sm:border-zinc-800 sm:pl-3' : '', idx >= 2 ? 'sm:border-l sm:border-zinc-800 sm:pl-3' : '')}>
            <div className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold truncate">
              {sm.label}
            </div>
            <div className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
              {sm.value}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

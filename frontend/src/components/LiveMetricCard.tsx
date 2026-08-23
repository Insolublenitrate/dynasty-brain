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
  const vsColor = vsLastWeek >= 0 ? 'text-neon-green drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.4)]';
  const glowClass = isPositive ? 'shadow-[0_0_30px_rgba(34,197,94,0.05)] border-neon-green/20' : 'shadow-[0_0_30px_rgba(249,115,22,0.05)] border-neon-orange/20';
  const textGradient = isPositive ? 'from-neon-green to-emerald-400' : 'from-neon-orange to-red-400';

  return (
    <div className={cn("relative bg-card/80 backdrop-blur-md border rounded-2xl p-6 overflow-hidden flex flex-col gap-4 w-full min-h-[320px] transition-all hover:bg-muted/30", glowClass)}>
      
      {/* Background Accent Gradient */}
      <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2 bg-gradient-to-br to-transparent", isPositive ? 'from-neon-green/10' : 'from-neon-orange/10')}></div>

      {/* Header */}
      <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest font-black">
        <div className="flex items-center gap-2">
          <Activity size={16} className={isPositive ? "text-neon-green" : "text-neon-orange"} />
          <span className="text-foreground">{title}</span>
          <span className="text-border px-2">•</span>
          <span className="text-neon-blue drop-shadow-[0_0_5px_rgba(14,165,233,0.4)]">LEAGUE LEADER</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-background border border-border text-muted-foreground shadow-inner">AUTO</span>
        </div>
      </div>

      {/* Main Metric & Rank */}
      <div className="flex justify-between items-start mt-4 z-10 flex-1">
        <div>
          <div className={cn(`text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-r bg-clip-text text-transparent drop-shadow-sm`, textGradient)}>
            {(Number(metricValue) > 0 ? '+' : '')}{metricValue}
          </div>
          <div className="text-xl font-bold text-foreground mt-4 tracking-wide flex items-center gap-3">
            {playerName} 
            <span className="px-2 py-0.5 rounded bg-background border border-border text-[10px] font-black text-muted-foreground">{team}</span>
          </div>
        </div>
        
        <div className="text-right flex flex-col gap-4 mt-2">
          <div className="bg-background/80 p-3 rounded-xl border border-border backdrop-blur-sm flex flex-col items-end shadow-inner">
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Rank</div>
            <div className="text-2xl font-black text-foreground flex items-baseline gap-0.5">
              {rank}<span className="text-muted-foreground text-lg font-medium">/{totalPlayers}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">VS LAST WK</div>
            <div className={cn("text-lg font-black flex items-center gap-1", vsColor)}>
              {vsLastWeek >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {(vsLastWeek > 0 ? '+' : '')}{vsLastWeek}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Metrics Grid (Ticker Style) */}
      <div className="mt-auto grid grid-cols-4 gap-4 z-10 bg-background/80 rounded-xl p-4 border border-border shadow-inner">
        {subMetrics.map((sm, idx) => (
          <div key={idx} className={cn("flex flex-col", idx !== 0 ? 'border-l border-border pl-4' : '')}>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1 truncate">
              {sm.label}
            </div>
            <div className="text-xl font-black text-foreground font-mono tracking-tight">
              {sm.value}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

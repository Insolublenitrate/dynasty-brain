import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

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
  const vsColor = vsLastWeek >= 0 ? 'text-emerald-400' : 'text-rose-400';
  const glowClass = isPositive ? 'shadow-[0_0_30px_rgba(52,211,153,0.05)]' : 'shadow-[0_0_30px_rgba(251,113,133,0.05)]';
  const gradientText = isPositive ? 'from-emerald-400 to-teal-300' : 'from-rose-400 to-orange-300';

  return (
    <div className={`relative bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 overflow-hidden flex flex-col gap-4 w-full min-h-[320px] transition-all hover:bg-slate-800/60 ${glowClass}`}>
      
      {/* Background Accent Gradient */}
      <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${isPositive ? 'from-emerald-500/10' : 'from-rose-500/10'} to-transparent rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2`}></div>

      {/* Header */}
      <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-bold">
        <div className="flex items-center gap-2">
          <Activity size={16} className={isPositive ? "text-emerald-500" : "text-rose-500"} />
          <span className="text-slate-300">{title}</span>
          <span className="text-slate-600 px-2">•</span>
          <span className="text-indigo-400">LEAGUE LEADER</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-[10px] text-slate-300 shadow-inner">AUTO</span>
        </div>
      </div>

      {/* Main Metric & Rank */}
      <div className="flex justify-between items-start mt-4 z-10 flex-1">
        <div>
          <div className={`text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-r ${gradientText} bg-clip-text text-transparent drop-shadow-sm`}>
            {(Number(metricValue) > 0 ? '+' : '')}{metricValue}
          </div>
          <div className="text-xl font-bold text-white mt-4 tracking-wide flex items-center gap-3">
            {playerName} 
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300">{team}</span>
          </div>
        </div>
        
        <div className="text-right flex flex-col gap-4 mt-2">
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm flex flex-col items-end">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Rank</div>
            <div className="text-2xl font-black text-white flex items-baseline gap-0.5">
              {rank}<span className="text-slate-500 text-lg font-medium">/{totalPlayers}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">VS LAST WK</div>
            <div className={`text-lg font-bold flex items-center gap-1 ${vsColor}`}>
              {vsLastWeek >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {(vsLastWeek > 0 ? '+' : '')}{vsLastWeek}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Metrics Grid (Ticker Style) */}
      <div className="mt-auto grid grid-cols-4 gap-4 z-10 bg-slate-950/40 rounded-xl p-4 border border-slate-800/80 shadow-inner">
        {subMetrics.map((sm, idx) => (
          <div key={idx} className={`flex flex-col ${idx !== 0 ? 'border-l border-slate-800/60 pl-4' : ''}`}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 truncate">
              {sm.label}
            </div>
            <div className="text-xl font-black text-slate-200 font-mono tracking-tight">
              {sm.value}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

import React from 'react';
import { 
  Zap, 
  Shield, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Award, 
  Flame, 
  Target,
  ChevronUp,
  ChevronDown,
  Coins,
  Cpu
} from 'lucide-react';

/**
 * 1. Trade Archetype Badge (Replaces emojis)
 */
export function TraderArchetypeBadge({ badge, className = '' }: { badge: string; className?: string }) {
  const normalized = badge?.toLowerCase() || '';

  if (normalized.includes('shark')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 shadow-sm ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <Zap size={10} className="shrink-0 text-cyan-300" />
        <span>Shark Volume</span>
      </span>
    );
  }

  if (normalized.includes('active')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 shadow-sm ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <Activity size={10} className="shrink-0 text-emerald-300" />
        <span>Active Trader</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-zinc-900/90 text-zinc-400 border border-zinc-700/60 shadow-sm ${className}`}>
      <Shield size={10} className="shrink-0 text-zinc-500" />
      <span>Hodler</span>
    </span>
  );
}

/**
 * 2. Luck Rating & Schedule Evaluation Badge (Replaces emojis)
 */
export function LuckRatingBadge({ rating, delta, className = '' }: { rating: string; delta?: number; className?: string }) {
  const normalized = rating?.toLowerCase() || '';
  const dVal = typeof delta === 'number' ? delta : 0;

  if (normalized.includes('paper tiger') || dVal >= 6.0) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-amber-950/60 text-amber-300 border border-amber-800/60 shadow-sm ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <TrendingUp size={11} className="text-amber-400" />
        <span>Schedule Beneficiary</span>
      </span>
    );
  }

  if (normalized.includes('favorable') || dVal >= 2.0) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shadow-sm ${className}`}>
        <TrendingUp size={11} className="text-emerald-400" />
        <span>Favorable Run</span>
      </span>
    );
  }

  if (normalized.includes('hard-luck') || normalized.includes('cursed') || dVal <= -6.0) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-rose-950/60 text-rose-300 border border-rose-800/60 shadow-sm ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        <TrendingDown size={11} className="text-rose-400" />
        <span>High Adversity</span>
      </span>
    );
  }

  if (normalized.includes('unlucky') || dVal <= -2.0) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-red-950/40 text-red-300 border border-red-800/50 shadow-sm ${className}`}>
        <TrendingDown size={11} className="text-red-400" />
        <span>Unlucky Draw</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-zinc-900/90 text-zinc-300 border border-zinc-700/60 shadow-sm ${className}`}>
      <Scale size={11} className="text-cyan-400" />
      <span>Skill Parity</span>
    </span>
  );
}

/**
 * 3. Tactical Positional Pill
 */
export function PositionPill({ pos, className = '' }: { pos: string; className?: string }) {
  const p = pos?.toUpperCase() || '';
  
  let colors = 'bg-zinc-800 text-zinc-300 border-zinc-700';
  if (p === 'QB') colors = 'bg-sky-950/80 text-sky-400 border-sky-800/70';
  else if (p === 'RB') colors = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/70';
  else if (p === 'WR') colors = 'bg-purple-950/80 text-purple-400 border-purple-800/70';
  else if (p === 'TE') colors = 'bg-amber-950/80 text-amber-400 border-amber-800/70';
  else if (p === 'FLEX') colors = 'bg-cyan-950/80 text-cyan-400 border-cyan-800/70';
  else if (p === 'K' || p === 'DEF') colors = 'bg-zinc-800 text-zinc-400 border-zinc-700';

  return (
    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-mono font-black tracking-wider uppercase border shadow-xs ${colors} ${className}`}>
      {p}
    </span>
  );
}

/**
 * 4. Tactical Tier & Archetype Badge (Replaces emojis)
 */
export function TacticalTierBadge({ tier, archetype, className = '' }: { tier?: string; archetype?: string; className?: string }) {
  const arch = archetype?.toLowerCase() || '';

  if (arch.includes('win-now') || arch.includes('goliath') || tier === 'Tier S') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-950/70 text-emerald-400 border border-emerald-700/60 shadow-xs ${className}`}>
        <Award size={11} className="text-emerald-300" />
        <span>Win-Now Core</span>
      </span>
    );
  }

  if (arch.includes('apex') || arch.includes('juggernaut')) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-orange-950/70 text-orange-400 border border-orange-700/60 shadow-xs ${className}`}>
        <Flame size={11} className="text-orange-300" />
        <span>Dynasty Apex</span>
      </span>
    );
  }

  if (arch.includes('rebuild') || arch.includes('struggle')) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-950/70 text-cyan-400 border border-cyan-700/60 shadow-xs ${className}`}>
        <TrendingUp size={11} className="text-cyan-300" />
        <span>Asset Accumulator</span>
      </span>
    );
  }

  if (arch.includes('rb factory') || arch.includes('ground')) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-zinc-900 text-amber-400 border border-amber-800/60 shadow-xs ${className}`}>
        <Target size={11} className="text-amber-400" />
        <span>RB Heavyweight</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-zinc-900 text-zinc-400 border border-zinc-800 shadow-xs ${className}`}>
      <Cpu size={11} className="text-zinc-500" />
      <span>{tier || 'Active Tier'}</span>
    </span>
  );
}

/**
 * 5. Tactical Delta Metric Badge
 */
export function TacticalDeltaBadge({ val, unit = '%', isPositive = true, className = '' }: { val: string | number; unit?: string; isPositive?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'} ${className}`}>
      {isPositive ? <ChevronUp size={12} className="stroke-[3]" /> : <ChevronDown size={12} className="stroke-[3]" />}
      <span>{val}{unit}</span>
    </span>
  );
}

/**
 * 6. Tactical Cash / Bounty Visual Tag
 */
export function BountyVisualTag({ amount, label = "Max PF Bounty", className = '' }: { amount: string | number; label?: string; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 shadow-inner ${className}`}>
      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
        <Coins size={13} />
      </div>
      <div>
        <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400/80 block leading-tight">{label}</span>
        <span className="text-xs font-mono font-black text-emerald-300">{amount}</span>
      </div>
    </div>
  );
}

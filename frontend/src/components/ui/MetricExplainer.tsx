"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Info, TrendingUp, AlertTriangle, Sparkles, ChevronRight, X, BookOpen } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export interface MetricDefinition {
  id: string;
  name: string;
  shortName?: string;
  category: "power" | "roster" | "matchups" | "trade" | "bounty" | "nfl";
  summary: string;
  formula?: string;
  benchmarks?: {
    elite: string;
    average: string;
    warning: string;
  };
  tacticalAdvice: string;
}

export const METRIC_DICTIONARY: Record<string, MetricDefinition> = {
  max_pf: {
    id: "max_pf",
    name: "Max PF (Maximum Potential Points)",
    shortName: "Max PF",
    category: "power",
    summary: "The total fantasy points a roster would have scored if the manager had set the mathematically perfect, optimal starting lineup every single week.",
    formula: "Sum of highest-scoring players per eligible roster slot each week across the entire season.",
    benchmarks: {
      elite: "2,800+ pts (Championship Contender)",
      average: "2,300 - 2,500 pts (Playoff Bubble)",
      warning: "< 2,000 pts (Productive Rebuilder)"
    },
    tacticalAdvice: "Max PF measures true roster firepower and completely eliminates benching mistakes and luck. Dynasty leagues use Max PF for reverse rookie draft order to prevent intentional lineup tanking."
  },
  z_score: {
    id: "z_score",
    name: "Composite Z-Score Power Rating",
    shortName: "Power Score",
    category: "power",
    summary: "A standardized power ranking score on a 0–100 scale (where 50.0 is the exact league average) combining starter ceiling, future draft equity, and roster depth.",
    formula: "70% × Standardized Starter Max PF + 30% × Standardized Draft Capital Value.",
    benchmarks: {
      elite: "60.0+ (Tier S / Dynasty Goliath)",
      average: "48.0 - 52.0 (Tier B / Retooling Core)",
      warning: "< 40.0 (Tier D / Rebuild Mode)"
    },
    tacticalAdvice: "A score above 55 means your team should buy veteran win-now pieces. A score below 45 means you should trade aging assets for future 1st round draft picks."
  },
  draft_capital: {
    id: "draft_capital",
    name: "Future Draft Capital Index",
    shortName: "Draft Capital",
    category: "trade",
    summary: "The quantitative valuation of all multi-year draft picks owned by a franchise, evaluated via time-value depreciation and consensus rookie pick valuation curves.",
    formula: "Sum of consensus point values across all Round 1–4 picks owned over the next 3–4 draft classes.",
    benchmarks: {
      elite: "18,000+ pts (3+ Future 1st Rounders)",
      average: "14,000 - 16,000 pts (Standard Draft Allocation)",
      warning: "< 10,000 pts (Draft Depleted)"
    },
    tacticalAdvice: "Draft picks appreciate dramatically in value right before rookie drafts (April/May). Trade picks during draft week for proven young studs at peak market hype."
  },
  age_cliff: {
    id: "age_cliff",
    name: "Positional Age Cliff Risk",
    shortName: "Age Cliff",
    category: "roster",
    summary: "The historical statistical threshold where NFL player fantasy production and market trade value sharply decline due to wear-and-tear and career longevity curves.",
    formula: "RBs: Age 27+ | WRs: Age 29+ | TEs: Age 30+ | QBs: Age 33+",
    benchmarks: {
      elite: "Avg Roster Age < 24.5 (High Dynasty Longevity)",
      average: "Avg Roster Age 25.0 - 26.5 (Balanced)",
      warning: "Avg Roster Age > 27.5 (Imminent Value Collapse)"
    },
    tacticalAdvice: "Sell running backs 1 year BEFORE they turn 27 to capture peak value. Once an RB hits 28, their trade liquidity in dynasty drops by up to 60% regardless of current production."
  },
  spread: {
    id: "spread",
    name: "Projected Point Spread",
    shortName: "Spread",
    category: "matchups",
    summary: "The projected point differential between two opposing fantasy rosters in a given week based on player projection models, matchup difficulty, and consensus projections.",
    formula: "Team A Projected Starter Score - Team B Projected Starter Score.",
    benchmarks: {
      elite: "-15.0+ pts (Heavy Favorite)",
      average: "± 3.0 pts (Toss-up Matchup)",
      warning: "+15.0+ pts (Major Underdog)"
    },
    tacticalAdvice: "In tight spreads (under 5 points), bench safe floor players in favor of high-variance 'boom' upside candidates in your flex slots."
  },
  win_prob: {
    id: "win_prob",
    name: "Logistic Win Probability",
    shortName: "Win %",
    category: "matchups",
    summary: "A logistic probability model calculating a team's exact percentage chance of winning a matchup based on projected point margins and variance distributions.",
    formula: "1 / (1 + 10^((Opponent_Proj - Your_Proj) / 35.0)) × 100%",
    benchmarks: {
      elite: "75.0%+ (High Confidence Win)",
      average: "45.0% - 55.0% (Coin Flip)",
      warning: "< 25.0% (Upset Needed)"
    },
    tacticalAdvice: "Use win probabilities to plan waiver wire aggression: spend FAAB before high-leverage weeks against divisional rivals."
  },
  bench_blunder: {
    id: "bench_blunder",
    name: "Bench Blunder Index (Monday Autopsy)",
    shortName: "Bench Blunder",
    category: "matchups",
    summary: "Quantifies the exact fantasy points a manager left on the bench when a higher-scoring reserve player sat while a lower-scoring starter played.",
    formula: "Sum of (Optimal Starter Points - Actual Starter Points) for all suboptimal lineup decisions.",
    benchmarks: {
      elite: "< 5.0 pts (Master Strategist)",
      average: "10.0 - 18.0 pts (Standard Variance)",
      warning: "> 25.0 pts (Costly Coaching Blunder)"
    },
    tacticalAdvice: "Check your historical Monday Autopsy to see if you are systematically over-trusting veteran names over emerging young bench targets."
  },
  lineup_efficiency: {
    id: "lineup_efficiency",
    name: "Lineup Efficiency %",
    shortName: "Lineup Eff %",
    category: "matchups",
    summary: "The percentage of your team's theoretical maximum possible starting score that you actually started on game day.",
    formula: "(Actual Starting Points / Optimal Starting Points) × 100%",
    benchmarks: {
      elite: "95.0%+ (Near Flawless Lineup Setting)",
      average: "85.0% - 90.0% (Average Efficiency)",
      warning: "< 80.0% (Significant Points Left on Table)"
    },
    tacticalAdvice: "Teams with deep rosters naturally have lower lineup efficiency. Consolidate 2-for-1 depth pieces into elite tier-1 weekly set-and-forget starters."
  },
  bounty_vault: {
    id: "bounty_vault",
    name: "Bounty Vault & Side-Pots",
    shortName: "Bounty Vault",
    category: "bounty",
    summary: "An automated incentive ledger tracking weekly high-score cash prizes, division leader bounties, and underdog payout pots to keep all managers engaged all season.",
    formula: "Automated ranking of weekly top scores and season achievement milestones.",
    benchmarks: {
      elite: "Weekly High Scorer ($ Payout Winner)",
      average: "Top 5 Contender",
      warning: "Zero Bounties Claimed"
    },
    tacticalAdvice: "Even when eliminated from playoffs, target weekly high-score bounties by streaming high-upside matchup plays for cash prizes."
  },
  archetype: {
    id: "archetype",
    name: "Dynasty Lifecycle Archetype",
    shortName: "Archetype",
    category: "power",
    summary: "A behavioral classification assigned to each franchise based on its roster composition, draft capital, starter power, and competitive window.",
    formula: "Algorithmic clustering across 6 distinct profiles: Goliath, Juggernaut, Ground & Pound, Retool, Rebuild, and Purgatory.",
    benchmarks: {
      elite: "The Championship Goliath / Dynasty Apex",
      average: "The Balanced Contender",
      warning: "Dynasty Purgatory (Immediate Action Required)"
    },
    tacticalAdvice: "Identify your true archetype to stop 'straddling the middle'. If in Purgatory, sell aging players immediately to shift to a clean Rebuild."
  },
  starter_firepower: {
    id: "starter_firepower",
    name: "Starter Firepower Score",
    shortName: "Starter Power",
    category: "roster",
    summary: "The raw scoring ceiling of your designated starting lineup slots (QB, RB, WR, TE, FLEX, SF) relative to the rest of the league.",
    formula: "Sum of projected/actual fantasy points produced exclusively by starting slots.",
    benchmarks: {
      elite: "Top 2 in League (Championship Ready)",
      average: "Rank 5 - 8 in League",
      warning: "Bottom 3 in League"
    },
    tacticalAdvice: "Dynasty championships are won by starting lineup ceiling, not bench depth. In 10-12 team leagues, 2 superstars beat 4 good players every time."
  }
};

interface MetricExplainerProps {
  term: string;
  label?: string;
  className?: string;
  size?: "xs" | "sm" | "md";
  showName?: boolean;
}

export default function MetricExplainer({
  term,
  label,
  className = "",
  size = "xs",
  showName = false
}: MetricExplainerProps) {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const def = METRIC_DICTIONARY[term.toLowerCase()] || {
    id: term,
    name: label || term.toUpperCase(),
    summary: `Metric information for ${label || term}.`,
    category: "power" as const,
    tacticalAdvice: "Evaluate how this metric relates to your team's overall dynasty strategy."
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const sizeClasses = {
    xs: "p-0.5 text-[10px]",
    sm: "p-1 text-xs",
    md: "px-2 py-1 text-xs font-semibold"
  };

  return (
    <div className={`relative inline-flex items-center gap-1 ${className}`} ref={popoverRef}>
      {showName && (
        <span className="font-mono text-zinc-300 text-xs font-bold">
          {label || def.shortName || def.name}
        </span>
      )}
      
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title={`Click for explainer: ${def.name}`}
        className={`inline-flex items-center justify-center rounded-full text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 transition-all hover:scale-110 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 ${sizeClasses[size]}`}
        style={isOpen ? { color: currentTheme.primary, borderColor: currentTheme.primary } : {}}
      >
        <HelpCircle size={size === "xs" ? 12 : 14} />
      </button>

      {/* Interactive Tooltip Card / Popover */}
      {isOpen && (
        <div 
          className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 p-3.5 bg-zinc-950/95 border border-zinc-700/90 rounded-2xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-200 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.primary }} />
              <h4 className="text-xs font-black text-white font-sans tracking-wide">
                {def.name}
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded-lg"
            >
              <X size={13} />
            </button>
          </div>

          {/* Definition */}
          <p className="text-[11px] text-zinc-300 leading-relaxed mb-2.5 font-sans">
            {def.summary}
          </p>

          {/* Formula if available */}
          {def.formula && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 mb-2 font-mono text-[10px] text-zinc-300">
              <span className="text-zinc-500 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Calculation Formula:</span>
              <span style={{ color: currentTheme.primary }}>{def.formula}</span>
            </div>
          )}

          {/* Benchmarks if available */}
          {def.benchmarks && (
            <div className="space-y-1 mb-2.5 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80 font-mono text-[10px]">
              <div className="flex justify-between items-center text-emerald-400">
                <span className="text-[9px] uppercase text-zinc-500">Elite:</span>
                <span>{def.benchmarks.elite}</span>
              </div>
              <div className="flex justify-between items-center text-amber-400">
                <span className="text-[9px] uppercase text-zinc-500">Average:</span>
                <span>{def.benchmarks.average}</span>
              </div>
              <div className="flex justify-between items-center text-rose-400">
                <span className="text-[9px] uppercase text-zinc-500">Danger:</span>
                <span>{def.benchmarks.warning}</span>
              </div>
            </div>
          )}

          {/* Tactical Takeaway */}
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-2 text-[10px] text-emerald-300 flex items-start gap-1.5">
            <Sparkles size={13} className="shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <strong className="text-emerald-200 block text-[9px] uppercase tracking-wider font-bold">Tactical Action:</strong>
              <p className="font-sans leading-tight mt-0.5 text-emerald-300/90">{def.tacticalAdvice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

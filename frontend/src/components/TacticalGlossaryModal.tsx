"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, X, BookOpen, Sparkles, Filter, Target, CalendarDays, 
  Crown, Briefcase, Trophy, Zap, AlertTriangle, Shield, CheckCircle2,
  TrendingUp, Activity, HelpCircle, ArrowRight
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { METRIC_DICTIONARY, MetricDefinition } from "@/components/ui/MetricExplainer";

// Expanded terms catalog for the full Field Guide
export const EXPANDED_GLOSSARY: MetricDefinition[] = [
  ...Object.values(METRIC_DICTIONARY),
  {
    id: "true_power_matrix",
    name: "True Power Matrix (4 Quadrants)",
    shortName: "Power Matrix",
    category: "power",
    summary: "A 2-dimensional strategic map plotting Starter Max PF (X-axis) against Future Draft Capital (Y-axis). Identifies where every team sits in its multi-year competitive lifecycle.",
    formula: "X = Active Season Max PF | Y = 3-Year Future Draft Pick Valuation.",
    benchmarks: {
      elite: "Top-Right: Dynasty Juggernaut (High Max PF + High Draft Capital)",
      average: "Bottom-Right: All-In Contender | Top-Left: Rebuilder",
      warning: "Bottom-Left: Dynasty Purgatory (Low Points + Low Capital)"
    },
    tacticalAdvice: "Never get trapped in the bottom-left Purgatory quadrant. If you can't realistically finish top 3, immediately sell veterans to move into the top-left Rebuild quadrant."
  },
  {
    id: "dynasty_purgatory",
    name: "Dynasty Purgatory (The Danger Zone)",
    shortName: "Purgatory",
    category: "power",
    summary: "The worst position in dynasty fantasy football: a roster that misses the playoffs but has insufficient draft picks and young talent to execute a meaningful rebuild.",
    formula: "Max PF < League Median AND Draft Capital Score < League Median.",
    benchmarks: {
      elite: "Zero Teams in Purgatory",
      average: "1-2 Teams Trapped",
      warning: "Your Franchise is Flagged in Purgatory"
    },
    tacticalAdvice: "Declare a 2-year productive struggle. Trade every running back and player over age 26 for future 1st and 2nd round rookie picks."
  },
  {
    id: "championship_goliath",
    name: "The Championship Goliath Archetype",
    shortName: "Goliath",
    category: "power",
    summary: "A juggernaut roster built around peak-age elite weekly starters with a wide scoring advantage over the rest of the league.",
    formula: "Starter Firepower Rank 1-2 + High Win-Now Production.",
    benchmarks: {
      elite: "Composite Power Score > 62.0",
      average: "N/A",
      warning: "N/A"
    },
    tacticalAdvice: "Protect your championship window. Trade your late future 1st round picks for high-floor veteran handcuffs and elite flex reinforcements."
  },
  {
    id: "productive_struggle",
    name: "The Productive Struggle Archetype",
    shortName: "Rebuild Apex",
    category: "power",
    summary: "A strategically engineered rebuild where a manager intentionally suppresses current Max PF while hoarding massive future draft capital and elite young WRs/QBs.",
    formula: "Draft Capital Top 2 in League + Sub-24 Average Roster Age.",
    benchmarks: {
      elite: "4+ Future 1st Round Picks Owned",
      average: "2-3 Future 1sts",
      warning: "Rebuilding without 1st round pick ownership"
    },
    tacticalAdvice: "Anchor your rebuild with elite young wide receivers and quarterbacks. Never spend high draft capital on running backs until your team is ready to compete."
  },
  {
    id: "monte_carlo",
    name: "Monte Carlo Matchup Simulator (10,000 Iterations)",
    shortName: "Monte Carlo",
    category: "matchups",
    summary: "A statistical simulation engine that runs 10,000 simulated head-to-head matchups between any two fantasy rosters using player projection curves, boom/bust variance, and injury probabilities.",
    formula: "10,000 random walk iterations based on Gaussian scoring distributions per starter.",
    benchmarks: {
      elite: "Simulated Win Rate > 70%",
      average: "Simulated Win Rate 45% - 55%",
      warning: "Simulated Win Rate < 30%"
    },
    tacticalAdvice: "Use Monte Carlo simulations before finalizing blockbuster trades to test how acquiring a superstar shifts your simulated championship playoff odds."
  },
  {
    id: "trade_arbitrage",
    name: "Dynasty Trade Arbitrage & Value Asymmetry",
    shortName: "Arbitrage",
    category: "trade",
    summary: "Exploiting differing player valuations between dynasty consensus rankings, actual weekly points production, and opposing managers' cognitive biases.",
    formula: "Market Value Gap = (Quant Output Expected Points) - (Consensus Market Price).",
    benchmarks: {
      elite: "+15% Net Value Gain Per Trade",
      average: "Even Value Exchanges",
      warning: "Selling at Market Trough / Buying at Peak"
    },
    tacticalAdvice: "Buy injured stars in October/November from desperate win-now contenders who cannot afford empty roster spots during their playoff push."
  },
  {
    id: "coach_madden_ai",
    name: "Coach Madden AI (Telestrator & Voice Synthesis)",
    shortName: "Coach Madden",
    category: "bounty",
    summary: "An interactive generative AI advisor that ingests your real Sleeper, ESPN, or Yahoo league standings, rosters, and trade history to deliver tactical chalk-talk breakdowns in 3 distinct coaching personas.",
    formula: "Retrieval-Augmented Quant Pipeline powered by high-speed neural LLM reasoning.",
    benchmarks: {
      elite: "Chalk Talk (X's and O's) | Hype Coach (BOOM!) | GM Mode (Cold Quant)",
      average: "N/A",
      warning: "N/A"
    },
    tacticalAdvice: "Ask Coach Madden: 'What trades should I make with the last place team?' or 'Analyze my Week 1 starter flex dilemmas'."
  },
  {
    id: "epa_play",
    name: "EPA / Play (Expected Points Added per Play)",
    shortName: "EPA / Play",
    category: "nfl",
    summary: "Measures the net points a player adds to their real NFL team on each snap relative to historical down-and-distance baselines. The gold standard of real-world efficiency.",
    formula: "(Expected Points After Play) - (Expected Points Before Play).",
    benchmarks: {
      elite: "> +0.20 EPA/play for QBs | > +0.10 EPA/rush for RBs",
      average: "+0.00 to +0.05 EPA/play",
      warning: "< -0.05 EPA/play (High Replacement Risk)"
    },
    tacticalAdvice: "Players with high EPA/play are trusted by NFL coaching staffs with more high-value red zone and 3rd down touches."
  },
  {
    id: "cpoe",
    name: "CPOE (Completion % Over Expected)",
    shortName: "CPOE",
    category: "nfl",
    summary: "Measures a quarterback's true passing accuracy by comparing their actual completion percentage to expected completion rate based on receiver separation, pass rush pressure, and throw distance.",
    formula: "Actual Completion % - Expected Completion % based on NextGen tracking.",
    benchmarks: {
      elite: "+4.5%+ (Elite Precision Passer)",
      average: "-1.0% to +1.0% (League Average)",
      warning: "< -3.0% (Inaccurate / Bench Risk)"
    },
    tacticalAdvice: "Target wide receivers tied to high-CPOE quarterbacks; their catchable ball rate and fantasy efficiency will be substantially higher."
  },
  {
    id: "yprr",
    name: "YPRR (Yards Per Route Run)",
    shortName: "YPRR",
    category: "nfl",
    summary: "The single most predictive metric for wide receiver breakout potential. Measures total receiving yards divided by total passing routes run.",
    formula: "Total Receiving Yards / Total Routes Run.",
    benchmarks: {
      elite: "> 2.40 YPRR (Alpha WR1 Territory)",
      average: "1.60 - 1.90 YPRR (Solid WR2/3)",
      warning: "< 1.30 YPRR (Rotational / Depth Piece)"
    },
    tacticalAdvice: "Buy young rookie wide receivers who post 2.00+ YPRR on limited snap counts before their offensive play-calling volume expands in Year 2."
  },
  {
    id: "adot",
    name: "aDOT (Average Depth of Target)",
    shortName: "aDOT",
    category: "nfl",
    summary: "The average distance in yards downfield that a pass travels past the line of scrimmage when thrown to a receiver.",
    formula: "Total Air Yards on Targets / Total Targets.",
    benchmarks: {
      elite: "13.0+ yards (Deep Downfield Threat)",
      average: "9.0 - 11.0 yards (All-Field Weapon)",
      warning: "< 6.5 yards (Gadget / Low Ceiling)"
    },
    tacticalAdvice: "Pair high-aDOT receivers with high-target slot receivers to construct a resilient weekly fantasy starting lineup balance."
  },
  {
    id: "target_share",
    name: "Target Share %",
    shortName: "Target Share",
    category: "nfl",
    summary: "The percentage of a team's total pass attempts directed at a specific receiver while on the field.",
    formula: "(Player Targets / Team Total Pass Attempts) × 100%",
    benchmarks: {
      elite: "> 25.0% (True Volume Monster)",
      average: "17.0% - 21.0% (Solid Contributor)",
      warning: "< 14.0% (Volatile Role)"
    },
    tacticalAdvice: "Target share is earned, not given. Players with 22%+ target shares are virtually immune to game-script benching."
  }
];

interface TacticalGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export default function TacticalGlossaryModal({
  isOpen,
  onClose,
  initialCategory = "all"
}: TacticalGlossaryModalProps) {
  const { currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const categories = [
    { id: "all", label: "All Terms", icon: BookOpen },
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

      const matchesSearch = 
        term.name.toLowerCase().includes(q) ||
        (term.shortName && term.shortName.toLowerCase().includes(q)) ||
        term.summary.toLowerCase().includes(q) ||
        (term.formula && term.formula.toLowerCase().includes(q)) ||
        term.tacticalAdvice.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-6 pb-20 sm:pb-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[82dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-zinc-700 bg-zinc-900 shadow-inner"
              style={{ color: currentTheme.primary }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  BLINDSIDE FIELD GUIDE
                </span>
                <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                  • {EXPANDED_GLOSSARY.length} Metrics & Strategic Models
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white font-sans tracking-wide mt-0.5">
                Tactical Metric Encyclopedia & Dynasty Glossary
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-all shadow-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 sm:p-6 border-b border-zinc-800/80 bg-zinc-950 space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by metric name, calculation formula, or tactical strategy (e.g. Max PF, Age Cliff, Z-Score)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-sans shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-zinc-800 text-white border-zinc-600 shadow-md"
                      : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                  style={isActive ? { color: currentTheme.primary, borderColor: currentTheme.primary } : {}}
                >
                  <Icon size={13} className={isActive ? "stroke-[2.5]" : "stroke-[1.75]"} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredTerms.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <HelpCircle size={36} className="mx-auto text-zinc-600 animate-bounce" />
              <p className="text-zinc-400 font-mono text-sm">No metrics matched "{searchQuery}"</p>
              <button
                onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                className="text-xs text-emerald-400 underline font-mono"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTerms.map((term) => (
                <div 
                  key={term.id}
                  className="bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-md transition-all hover:bg-zinc-900/80 group"
                >
                  <div className="space-y-2.5">
                    {/* Header: Name + Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500 block mb-0.5">
                          {term.category.toUpperCase()}
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-white font-sans tracking-tight">
                          {term.name}
                        </h4>
                      </div>
                      {term.shortName && (
                        <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300 border border-zinc-700">
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
                      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 font-mono text-[11px] text-zinc-300">
                        <span className="text-zinc-500 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Mathematical Formula:</span>
                        <span style={{ color: currentTheme.primary }}>{term.formula}</span>
                      </div>
                    )}

                    {/* Benchmarks */}
                    {term.benchmarks && (
                      <div className="space-y-1 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/70 font-mono text-[10px]">
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

                  {/* Tactical Action Plan */}
                  <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2 mt-1">
                    <Sparkles size={14} className="shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <strong className="text-emerald-200 block text-[9px] uppercase tracking-wider font-bold">Dynasty War Room Action:</strong>
                      <p className="font-sans leading-relaxed text-emerald-300/90 text-[11px] mt-0.5">
                        {term.tacticalAdvice}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3.5 sm:px-7 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>💡 Pro Tip: Hover or tap any <strong className="text-zinc-200">(?)</strong> icon anywhere in the app for instant context.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

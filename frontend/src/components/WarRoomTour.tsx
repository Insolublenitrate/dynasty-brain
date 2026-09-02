"use client";

import React, { useState, useEffect } from "react";
import { 
  Target, Crown, CalendarDays, Briefcase, Sparkles, ChevronRight, 
  ChevronLeft, X, Shield, ArrowRight, CheckCircle2, Radar, Swords, Zap, 
  HelpCircle, TrendingUp, AlertTriangle, Coins, BookOpen, Flame, Compass,
  Layers, Users, ArrowRightLeft, Award
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface WarRoomTourProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGlossary?: () => void;
}

interface TourStep {
  step: number;
  badge: string;
  arena: string;
  title: string;
  tagline: string;
  icon: any;
  color: string;
  borderColor: string;
  iconColor: string;
  previewType: 'command' | 'power' | 'matchups' | 'trade' | 'madden';
  features: {
    title: string;
    description: string;
    icon: any;
    color: string;
  }[];
  proTip: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    badge: "MODULE 1 OF 5",
    arena: "COMMAND ARENA",
    title: "Franchise Command & Positional Age Cliffs",
    tagline: "Spot aging vulnerabilities, starter firepower deficits, and your exact dynasty lifecycle stage.",
    icon: Target,
    color: "from-purple-500/20 to-indigo-500/20",
    borderColor: "border-purple-500/40",
    iconColor: "text-purple-400",
    previewType: "command",
    features: [
      {
        title: "Positional Age Cliff Alarms",
        description: "Running backs age 27+, wide receivers age 29+, and tight ends age 30+ face steep statistical drop-offs and rapid asset devaluation. The system flags these assets before the market sells.",
        icon: AlertTriangle,
        color: "#fb7185"
      },
      {
        title: "Starter Firepower vs Empty Bench Points",
        description: "Titles are won in the starting lineup. The app isolates your starting roster's true weekly PPG baseline (e.g., 138.5 PPG) from inflated bench production.",
        icon: Flame,
        color: "#f97316"
      },
      {
        title: "5-Point Positional Radar",
        description: "Instant visual diagnostic comparing your QB, RB, WR, TE, and Future Draft Capital against the 12-team league median.",
        icon: Radar,
        color: "#38bdf8"
      }
    ],
    proTip: "Navigate to the Command tab and click 'Roster Intel' to audit which veterans on your roster are entering their final peak value season."
  },
  {
    step: 2,
    badge: "MODULE 2 OF 5",
    arena: "POWER ARENA",
    title: "True Power Matrix & Standardized Z-Scores",
    tagline: "Eliminate schedule luck with 2D Max PF quadrant mapping and composite dynasty tiering.",
    icon: Crown,
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/40",
    iconColor: "text-amber-400",
    previewType: "power",
    features: [
      {
        title: "The 4-Quadrant Lifecycle Matrix",
        description: "Plots Max Potential Points (Max PF) against 3-Year Future Draft Capital to categorize every franchise into Juggernauts, Contenders, Rebuilders, or Dynasty Purgatory.",
        icon: Layers,
        color: "#fbbf24"
      },
      {
        title: "70/30 Composite Power Score",
        description: "Blends 70% active starter production with 30% future draft pick equity on a standardized 0-100 scale, where 50.0 represents exact league average.",
        icon: TrendingUp,
        color: "#34d399"
      },
      {
        title: "Escaping Dynasty Purgatory",
        description: "Teams in the bottom-left quadrant (low points + low picks) receive clear AI trade recommendations to commit to a productive rebuild.",
        icon: Shield,
        color: "#f43f5e"
      }
    ],
    proTip: "Hover or tap on any team's bubble in the True Power Matrix to see their exact draft pick portfolio and composite rank."
  },
  {
    step: 3,
    badge: "MODULE 3 OF 5",
    arena: "MATCHUPS ARENA",
    title: "18-Week Preseason Spreads & Monday Autopsy",
    tagline: "Full season schedule modeling, logistic win probabilities, and coaching blunder index.",
    icon: CalendarDays,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/40",
    iconColor: "text-cyan-400",
    previewType: "matchups",
    features: [
      {
        title: "Preseason Quant Point Spreads",
        description: "Before games kickoff, all 18 weekly matchups feature modeled point spreads (e.g., -6.5) and logistic win probabilities derived from multi-year player projection baselines.",
        icon: CalendarDays,
        color: "#38bdf8"
      },
      {
        title: "Monday Autopsy (Bench Blunders)",
        description: "Quantifies the exact fantasy points left on your bench each week and calculates your Lineup Efficiency % to evaluate coaching execution.",
        icon: Award,
        color: "#a855f7"
      },
      {
        title: "All-Time Rivalries & Multi-Season Records",
        description: "Tracks all-time head-to-head records, margin-of-victory trends, and blowout history across your league's entire history.",
        icon: Swords,
        color: "#ef4444"
      }
    ],
    proTip: "Use the Week Selector in the Matchups tab to simulate upcoming playoff paths and identify easy schedule stretches."
  },
  {
    step: 4,
    badge: "MODULE 4 OF 5",
    arena: "TRADE ARENA",
    title: "Trade Architect & Post-Execution Autopsy",
    tagline: "Evaluate multi-team trades with pick depreciation modeling and track post-trade realized scoring.",
    icon: Briefcase,
    color: "from-teal-500/20 to-emerald-500/20",
    borderColor: "border-teal-500/40",
    iconColor: "text-teal-400",
    previewType: "trade",
    features: [
      {
        title: "Multi-Team Trade Architect",
        description: "Model 2-team and 3-team blockbuster trades with instant fair-value calculations, player age penalties, and draft pick valuation curves.",
        icon: ArrowRightLeft,
        color: "#2dd4bf"
      },
      {
        title: "Trade Autopsy & Realized Points",
        description: "Tracks the exact real-world fantasy points produced by all sides of a completed trade since execution date to see who won the deal.",
        icon: Award,
        color: "#fbbf24"
      },
      {
        title: "Draft Capital Inflation/Depreciation",
        description: "Draft picks gain 15-25% market value right before rookie drafts. The system guides you on optimal buy/sell timing windows.",
        icon: TrendingUp,
        color: "#34d399"
      }
    ],
    proTip: "Check the Traded Players tab to see how former stars perform after leaving your roster."
  },
  {
    step: 5,
    badge: "MODULE 5 OF 5",
    arena: "AI COACH & BOUNTIES",
    title: "Coach Madden AI & High-Stakes Bounty Vault",
    tagline: "Voice-powered tactical chalkboard analysis and automated weekly cash side-pot ledgers.",
    icon: Sparkles,
    color: "from-amber-500/20 to-rose-500/20",
    borderColor: "border-amber-500/40",
    iconColor: "text-amber-400",
    previewType: "madden",
    features: [
      {
        title: "Coach Madden AI (Chalk Talk & GM Mode)",
        description: "Ask John Madden about your roster weaknesses, waiver wire targets, or trade proposals with authentic football wisdom and audio playback.",
        icon: Sparkles,
        color: "#fbbf24"
      },
      {
        title: "The Bounty Vault (Weekly Cash Races)",
        description: "Official ledger for weekly high-score payouts ($10/wk), regular season Max PF crown ($60), and league championship prize pots.",
        icon: Coins,
        color: "#34d399"
      },
      {
        title: "Interactive Field Guide Encyclopedia",
        description: "Tap the (?) icons on any table or click 'Field Guide' in the navigation bar to access definitions and benchmarks for 45+ quant metrics.",
        icon: BookOpen,
        color: "#38bdf8"
      }
    ],
    proTip: "Click 'Ask Madden' in the top bar and select 'Chalk Talk' for an in-depth breakdown of your next matchup."
  }
];

export default function WarRoomTour({
  isOpen,
  onClose,
  onOpenGlossary
}: WarRoomTourProps) {
  const { currentTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("blindside_tour_completed", "true");
    }
    onClose();
  };

  const handleStepJump = (idx: number) => {
    setCurrentStep(idx);
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl relative overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Strip with Step Selector Tabs */}
        <div className="shrink-0 bg-zinc-900/90 border-b border-zinc-800 p-3 sm:p-4 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${step.borderColor} bg-zinc-950 shadow-inner`}
              >
                <StepIcon size={18} className={step.iconColor} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-400">
                    {step.badge}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span 
                    className="text-[10px] font-mono font-black uppercase tracking-wider"
                    style={{ color: currentTheme.primary }}
                  >
                    {step.arena}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white font-sans tracking-wide">
                  {step.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-all shrink-0"
              title="Close Tour"
            >
              <X size={16} />
            </button>
          </div>

          {/* Segmented Step Progress Navigation Tabs */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1">
            {TOUR_STEPS.map((s, idx) => {
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <button
                  key={s.step}
                  onClick={() => handleStepJump(idx)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "shadow-md" 
                      : isPast
                        ? "bg-zinc-700 hover:bg-zinc-600"
                        : "bg-zinc-850 hover:bg-zinc-800"
                  }`}
                  style={isActive ? { backgroundColor: currentTheme.primary } : {}}
                  title={`Step ${s.step}: ${s.arena}`}
                />
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5 custom-scrollbar">
          
          {/* Subtitle / Tagline Banner */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm text-zinc-200 font-sans leading-relaxed">
            {step.tagline}
          </div>

          {/* Specific Visual Mock / Tactical Preview Box */}
          {step.previewType === 'command' && (
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-purple-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                  <Shield size={13} className="text-purple-400" /> Positional Risk Diagnostic Preview
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                  LIVE TELEMETRY
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-zinc-900/90 border border-rose-500/40 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-rose-400 font-bold block text-[11px]">⚠️ RB Derrick Henry</span>
                    <span className="text-[10px] text-zinc-400">Age 30.2 · Cliff Threshold Exceeded</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-black">HIGH RISK</span>
                </div>
                <div className="bg-zinc-900/90 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold block text-[11px]">✅ WR Marvin Harrison Jr.</span>
                    <span className="text-[10px] text-zinc-400">Age 22.1 · Blue-Chip Asset</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black">PRIME</span>
                </div>
              </div>
            </div>
          )}

          {step.previewType === 'power' && (
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                  <Layers size={13} className="text-amber-400" /> True Power Matrix 4-Quadrant Map
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                  2D SCATTER PLOT
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-center">
                <div className="bg-zinc-900/80 border border-blue-500/40 rounded-xl p-2">
                  <span className="text-blue-400 font-bold block">CONTENDER (Top-L)</span>
                  <span className="text-[9px] text-zinc-400">High Max PF • Low Picks</span>
                </div>
                <div className="bg-zinc-900/80 border border-emerald-500/40 rounded-xl p-2">
                  <span className="text-emerald-400 font-bold block">🏆 JUGGERNAUT (Top-R)</span>
                  <span className="text-[9px] text-zinc-400">High Max PF • High Picks</span>
                </div>
                <div className="bg-zinc-900/80 border border-rose-500/40 rounded-xl p-2">
                  <span className="text-rose-400 font-bold block">⚠️ PURGATORY (Bot-L)</span>
                  <span className="text-[9px] text-zinc-400">Low Max PF • Low Picks</span>
                </div>
                <div className="bg-zinc-900/80 border border-purple-500/40 rounded-xl p-2">
                  <span className="text-purple-400 font-bold block">REBUILDER (Bot-R)</span>
                  <span className="text-[9px] text-zinc-400">Low Max PF • High Picks</span>
                </div>
              </div>
            </div>
          )}

          {step.previewType === 'matchups' && (
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-cyan-400" /> Modeled 18-Week Matchup Slate
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                  SPREAD ENGINE
                </span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">Dynasty Reign</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-black text-[10px]">-6.5 Fav</span>
                </div>
                <div className="text-center text-zinc-400 text-[10px]">
                  <span>63.8% Win Prob · 134.2 vs 127.7 Proj</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">+6.5 Dog</span>
                  <span className="text-zinc-300 font-bold">Gridiron Gods</span>
                </div>
              </div>
            </div>
          )}

          {step.previewType === 'trade' && (
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-teal-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                  <ArrowRightLeft size={13} className="text-teal-400" /> Multi-Asset Trade Architect Evaluator
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[9px] font-bold">
                  ARBITRAGE ENGINE
                </span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <span className="text-rose-400 text-[10px] block">SENDING</span>
                  <span className="text-white font-bold text-[11px]">2027 1st + CMC (Age 29)</span>
                </div>
                <div className="text-center px-2 py-1 rounded bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-bold">
                  FAIR • +18.4 Value
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 text-[10px] block">RECEIVING</span>
                  <span className="text-white font-bold text-[11px]">Bijan Robinson (Age 23)</span>
                </div>
              </div>
            </div>
          )}

          {step.previewType === 'madden' && (
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" /> Coach Madden AI Chalk-Talk
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                  VOICE ADVISOR
                </span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs font-sans text-amber-200/90 italic leading-relaxed">
                "BOOM! You've got an elite WR room, but your RB2 is averaging 6.1 PPG. Look at the Rebuilding teams in the Power Matrix and flip a future 2nd for a workhorse back!"
              </div>
            </div>
          )}

          {/* 3 Core Tactical Highlights */}
          <div className="space-y-2.5">
            {step.features.map((feat, i) => {
              const FeatIcon = feat.icon;
              return (
                <div 
                  key={i} 
                  className="bg-zinc-900/60 border border-zinc-800/80 p-3 sm:p-3.5 rounded-2xl flex items-start gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div 
                    className="p-1.5 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0 mt-0.5" 
                    style={{ color: feat.color }}
                  >
                    <FeatIcon size={15} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white font-sans tracking-wide">
                      {feat.title}
                    </h5>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed mt-0.5">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tactical Pro Tip Callout */}
          <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5">
            <Sparkles size={15} style={{ color: currentTheme.primary }} className="shrink-0 mt-0.5" />
            <div className="text-[11px] sm:text-xs font-mono text-zinc-300 leading-relaxed">
              <strong className="text-white">PRO TIP: </strong>
              {step.proTip}
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-zinc-800 bg-zinc-950/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <label className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Don't show on startup</span>
            </label>

            {onOpenGlossary && (
              <button
                type="button"
                onClick={onOpenGlossary}
                className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 underline underline-offset-2 transition-colors sm:ml-2"
              >
                <BookOpen size={12} className="text-amber-400" />
                <span>Field Guide</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}

            {currentStep < TOUR_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2 rounded-xl text-xs font-mono font-black text-black transition-all flex items-center gap-1.5 shadow-lg hover:brightness-110 cursor-pointer"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <span>Next Module</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl text-xs font-mono font-black text-black transition-all flex items-center gap-1.5 shadow-lg hover:brightness-110 cursor-pointer"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Sparkles size={14} />
                <span>Enter War Room</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

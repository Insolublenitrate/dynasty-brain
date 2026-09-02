"use client";

import React, { useState, useEffect } from "react";
import { 
  Target, Crown, CalendarDays, Briefcase, Sparkles, ChevronRight, 
  ChevronLeft, X, Shield, ArrowRight, CheckCircle2, Radar, Swords, Zap, HelpCircle
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface WarRoomTourProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGlossary?: () => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    badge: "STEP 1 OF 4 • COMMAND ARENA",
    title: "Command Center & Roster Diagnostics",
    subtitle: "Spot positional age cliffs, starter firepower, and immediate roster vulnerabilities.",
    icon: Target,
    color: "from-purple-500/20 to-indigo-500/20",
    borderColor: "border-purple-500/40",
    iconColor: "text-purple-400",
    highlights: [
      {
        title: "Positional Age Cliff Audits",
        desc: "Instant flags for running backs age 27+, wide receivers age 29+, and tight ends age 30+ before their trade value collapses."
      },
      {
        title: "Starter Firepower vs Bench Depth",
        desc: "Separates weekly starting lineup ceiling from empty bench points so you know if your team can realistically win a title."
      },
      {
        title: "5-Point Positional Radar",
        desc: "Visualizes QB, RB, WR, TE, and Draft Capital strength relative to the 12-team league median."
      }
    ]
  },
  {
    step: 2,
    badge: "STEP 2 OF 4 • POWER ARENA",
    title: "True Power Matrix & Power Rankings",
    subtitle: "Eliminate schedule luck with 2D Max PF quadrant mapping and standardized Z-scores.",
    icon: Crown,
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/40",
    iconColor: "text-amber-400",
    highlights: [
      {
        title: "4-Quadrant Lifecycle Matrix",
        desc: "Plots Max PF against 3-Year Future Draft Capital to classify every team as a Goliath, Juggernaut, Rebuilder, or Purgatory."
      },
      {
        title: "Composite Z-Score Tiers (Tier S to D)",
        desc: "70% Starter Firepower + 30% Draft Capital equity, centered on a 0-100 scale where 50.0 is exact league average."
      },
      {
        title: "Escaping Dynasty Purgatory",
        desc: "If your team lacks elite starters and high draft capital, the app gives you clear trade instructions to rebuild."
      }
    ]
  },
  {
    step: 3,
    badge: "STEP 3 OF 4 • MATCHUPS ARENA",
    title: "18-Week Schedule & Monday Autopsy",
    subtitle: "Projected point spreads, logistic win probabilities, and bench blunder accountability.",
    icon: CalendarDays,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/40",
    iconColor: "text-cyan-400",
    highlights: [
      {
        title: "Preseason Quant Projections & Spreads",
        desc: "Full 18-week schedule with modeled point spreads and win probabilities for all unplayed matchups."
      },
      {
        title: "Monday Autopsy (Bench Blunders)",
        desc: "Quantifies exact fantasy points left on the bench and reveals whether suboptimal coaching cost you weekly wins."
      },
      {
        title: "All-Time Rivalry & Blowout Records",
        desc: "Historical head-to-head records and highest-scoring blowouts across your league's entire multi-year history."
      }
    ]
  },
  {
    step: 4,
    badge: "STEP 4 OF 4 • TACTICAL TOOLS",
    title: "Coach Madden AI & Trade Architect",
    subtitle: "Real-time AI voice chalk-talk and multi-asset trade arbitrage evaluators.",
    icon: Sparkles,
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/40",
    iconColor: "text-emerald-400",
    highlights: [
      {
        title: "Coach Madden AI (3 Coaching Personas)",
        desc: "Ask John Madden about your roster, waiver targets, or trade ideas in Chalk Talk (tactical), Hype (BOOM!), or GM Mode."
      },
      {
        title: "Trade Architect & Capital Index",
        desc: "Multi-player and multi-draft pick trade evaluator with future draft pick depreciation modeling."
      },
      {
        title: "Bounty Vault & Weekly Side-Pots",
        desc: "Automated weekly high-score payouts and side-pot ledgers to keep managers battling all 18 weeks."
      }
    ]
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
    // Reset to step 0 when modal is opened
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleFinish = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("blindside_tour_completed", "true");
    }
    onClose();
  };

  if (!isOpen) return null;

  const stepData = TOUR_STEPS[currentStep];
  const Icon = stepData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${stepData.borderColor} bg-zinc-900 shadow-inner`}
            >
              <Icon size={20} className={stepData.iconColor} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-400 block">
                {stepData.badge}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white font-sans tracking-wide">
                {stepData.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Body */}
        <div className="p-5 sm:p-7 space-y-5">
          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
            {stepData.subtitle}
          </p>

          {/* Highlights Grid */}
          <div className="space-y-3">
            {stepData.highlights.map((h, i) => (
              <div 
                key={i} 
                className="bg-zinc-900/60 border border-zinc-800/80 p-3.5 sm:p-4 rounded-2xl flex items-start gap-3 group hover:border-zinc-700 transition-colors"
              >
                <div className="p-1.5 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0 mt-0.5" style={{ color: currentTheme.primary }}>
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white font-sans tracking-wide">
                    {h.title}
                  </h5>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed mt-0.5">
                    {h.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Step Progress Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {TOUR_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? "w-8 shadow-sm" 
                    : "w-2 bg-zinc-800 hover:bg-zinc-700"
                }`}
                style={index === currentStep ? { backgroundColor: currentTheme.primary } : {}}
              />
            ))}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="px-5 py-4 sm:px-7 border-t border-zinc-800 bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-400 font-mono cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Don't show automatically on start</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 transition-all flex items-center gap-1.5"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}

            {currentStep < TOUR_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2 rounded-xl text-xs font-mono font-black text-black transition-all flex items-center gap-1.5 shadow-lg hover:brightness-110"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <span>Next Step</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl text-xs font-mono font-black text-black transition-all flex items-center gap-1.5 shadow-lg hover:brightness-110"
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

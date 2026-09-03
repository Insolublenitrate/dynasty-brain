"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Crown, Sparkles, Search, Radar, Trophy, Flame, Smartphone, Apple, 
  ArrowRight, CheckCircle2, ChevronRight, Shield, Download, Zap, Activity,
  Layers, BarChart3, HelpCircle, ExternalLink, Play, Volume2, Swords,
  Target, Briefcase, ArrowRightLeft, Users, CalendarDays, Radio, Coins,
  GraduationCap, TrendingUp
} from "lucide-react";
import PlaybookLogo from "@/components/PlaybookLogo";
import InstallAppModal from "@/components/InstallAppModal";
import { useTheme } from "@/context/ThemeContext";
import { TacticalTierBadge } from "@/components/ui/TacticalVisualAids";

const ARENA_DEEP_DIVES = [
  {
    id: "command",
    name: "Command",
    subtitle: "My Franchise Tactical Hub",
    badge: "FRANCHISE COCKPIT",
    icon: Target,
    color: "from-orange-500/20 to-amber-500/20",
    border: "border-orange-500/40",
    iconColor: "text-orange-400",
    href: "/dynasty-room?arena=command",
    subtabs: ["Action Center", "Roster Intel", "Franchise Diagnostics"],
    overview: "The central nervous system for your team. Action Center synthesizes live market discrepancies, urgent waiver pickups, and buy-low/sell-high windows.",
    pillars: [
      {
        title: "AI Action Center",
        desc: "Automated daily briefing highlighting active championship leverage, urgent trade opportunities, and roster risk factors.",
        icon: Zap
      },
      {
        title: "Roster Firepower & Age Cliffs",
        desc: "Empirical age depreciation alerts on every player, contract runways, and starter vs. bench PPG firepower splits.",
        icon: Crown
      },
      {
        title: "Franchise Diagnostics",
        desc: "Full positional surplus and deficit grades, Superflex QB security ratings, and comprehensive draft capital inventory.",
        icon: Activity
      }
    ]
  },
  {
    id: "players",
    name: "Players",
    subtitle: "Scouting & Quantitative Intel",
    badge: "SCOUTING LAB",
    icon: Users,
    color: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/40",
    iconColor: "text-cyan-400",
    href: "/dynasty-room?arena=players",
    subtabs: ["Analyzer", "Database", "Rookies", "Leaders", "Cross-Ref"],
    overview: "Deep-dive quantitative player research. From 25+ metric 2D scatter correlations to NCAA college dominator rookie boards and side-by-side radars.",
    pillars: [
      {
        title: "25+ Metric Cross-Reference",
        desc: "Customizable X/Y scatter plot correlating EPA/play, VORP, Target Share, Air Yards, and CPOE with benchmark crosshairs.",
        icon: Radar
      },
      {
        title: "Head-to-Head Player Radar",
        desc: "Direct multi-dimensional polygon comparison of any two NFL players across volume, efficiency, and red-zone shares.",
        icon: Sparkles
      },
      {
        title: "Rookie Big Board (2024–2026)",
        desc: "NCAA dominator percentiles, breakout age verification, draft capital tracking, and athletic testing profiles.",
        icon: GraduationCap
      }
    ]
  },
  {
    id: "matchups",
    name: "Matchups",
    subtitle: "The Competitive Battlefield",
    badge: "LIVE WAR ROOM",
    icon: Swords,
    color: "from-rose-500/20 to-red-500/20",
    border: "border-rose-500/40",
    iconColor: "text-rose-400",
    href: "/dynasty-room?arena=matchups",
    subtabs: ["Weekly Slate", "Simulator", "Rivalries", "All-Play"],
    overview: "All competition unified into one arena. Live 18-week box scores, 10,000-iteration Monte Carlo odds, and all-time franchise rivalry records.",
    pillars: [
      {
        title: "10,000x Monte Carlo Simulator",
        desc: "Calculates true win probability distributions and allows testing alternate starting lineups before game day.",
        icon: Swords
      },
      {
        title: "Franchise Rivalry Vault",
        desc: "Historical series records against every league manager, largest blowouts, bad beat heartbreaks, and scoring differentials.",
        icon: Flame
      },
      {
        title: "All-Play Schedule Luck Matrix",
        desc: "Uncovers true luck-adjusted records across all weeks to prove who actually built the best roster vs. lucky schedules.",
        icon: Layers
      }
    ]
  },
  {
    id: "power",
    name: "Power & League",
    subtitle: "Dynasty Landscape & Governance",
    badge: "LEAGUE GOVERNANCE",
    icon: Crown,
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/40",
    iconColor: "text-purple-400",
    href: "/dynasty-room?arena=power",
    subtabs: ["Power Tiers", "Lifecycle Matrix", "Records", "Bounties", "Studio"],
    overview: "Statistical Z-Score composite rankings (70% Max PF, 30% Draft Capital) categorizing teams into 4 lifecycle quadrants and league history.",
    pillars: [
      {
        title: "Dynasty Lifecycle Matrix",
        desc: "4-Quadrant strategic map isolating Championship Windows, All-In Contenders, Productive Struggles, and Retooling rosters.",
        icon: Target
      },
      {
        title: "League Bounty Vault",
        desc: "Gamified league cash pot tracking weekly high scorers, rivalry milestones, and custom league trophies.",
        icon: Coins
      },
      {
        title: "Card Studio & Record Book",
        desc: "Generate broadcast-ready social media graphics for trades, power ranks, and all-time franchise records.",
        icon: Radio
      }
    ]
  },
  {
    id: "trade",
    name: "Trade Desk",
    subtitle: "Dealmaking & Market Desk",
    badge: "DEAL DESK",
    icon: ArrowRightLeft,
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/40",
    iconColor: "text-emerald-400",
    href: "/dynasty-room?arena=trade",
    subtabs: ["Trade Architect", "Smart Partners", "Trade Ledger", "Autopsy"],
    overview: "Engineered to win every negotiation. Algorithmic trade partner matchmaking based on complementary surpluses and deficits, plus historical trade autopsies.",
    pillars: [
      {
        title: "Smart Trade Partner Finder",
        desc: "Instantly scans all rival rosters to find high-synergy matches (e.g. your excess RBs for their surplus WRs).",
        icon: Users
      },
      {
        title: "Trade Architect Calculator",
        desc: "Live value balancing evaluating empirical player PPG output against depreciating future draft capital equity.",
        icon: Briefcase
      },
      {
        title: "Trade Autopsy & Trends",
        desc: "Grades every historical league trade in hindsight, tracking who won each deal with live cumulative point differentials.",
        icon: TrendingUp
      }
    ]
  },
  {
    id: "madden",
    name: "Coach Madden AI",
    subtitle: "Voice-Enabled AI War Room",
    badge: "AI CO-PILOT",
    icon: Sparkles,
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/40",
    iconColor: "text-amber-400",
    href: "/ask-madden",
    subtabs: ["Voice AI", "Telestrator", "League Context", "Boom Audio"],
    overview: "Google-style search terminal with voice recognition and authentic John Madden text-to-speech commentary grounded in your live league data.",
    pillars: [
      {
        title: "Authentic Voice Audio",
        desc: "Text-to-speech audio synthesis delivering authentic John Madden cadence, exclamation, and legendary BOOMs.",
        icon: Volume2
      },
      {
        title: "Telestrator Chalkboard",
        desc: "Interactive visual diagrams breaking down trade fairness, player trajectories, and matchup strategy.",
        icon: Play
      },
      {
        title: "Full League Context",
        desc: "Directly ingests your league's rosters, standings, and scoring rules so Madden's advice is tailored specifically to your squad.",
        icon: Shield
      }
    ]
  }
];

const FEATURES = [
  {
    id: "power-tiers",
    icon: Crown,
    badge: "QUANT MODELING",
    title: "Dynasty Power Tiers & Lifecycle Matrix",
    description: "Statistical Z-Score composite modeling (70% Starter Max PF, 30% Draft Capital) categorizing every team into dynamic 4-quadrant lifecycle states and intelligent positional archetypes.",
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/40",
    iconColor: "text-purple-400",
    href: "/dynasty-room?arena=power",
    stats: ["Z-Score Standardization", "4-Quadrant Strategic Map", "Archetype Detection"]
  },
  {
    id: "trade-partner",
    icon: ArrowRightLeft,
    badge: "SMART MATCHMAKER",
    title: "Smart Trade Partner Finder & Architect",
    description: "Algorithmic deal matchmaking scanning all rival rosters for complementary surpluses and deficits, with 1-tap trade builder and draft capital valuation.",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/40",
    iconColor: "text-emerald-400",
    href: "/dynasty-room?arena=trade",
    stats: ["Synergy Compatibility %", "Surplus vs Deficit", "Trade Autopsy"]
  },
  {
    id: "cross-reference",
    icon: Radar,
    badge: "MULTI-DIMENSIONAL",
    title: "25+ Metric Cross-Reference & H2H Radar",
    description: "Customizable scatter plot matrix comparing 25+ statistical dimensions across 5 tactical categories (EPA, VORP, Target Share, Air Yards) plus instant side-by-side player radar.",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/40",
    iconColor: "text-cyan-400",
    href: "/cross-reference",
    stats: ["25+ Metric Combinations", "Quadrant Crosshairs", "Side-by-Side Radar"]
  },
  {
    id: "matchup-hub",
    icon: Swords,
    badge: "THE BATTLEFIELD",
    title: "All-Competition Matchup Hub & Simulator",
    description: "10,000-iteration Monte Carlo win odds, live 18-week box scores, all-time franchise head-to-head rivalry vault, and schedule luck all-play rankings.",
    color: "from-rose-500/20 to-red-500/20",
    border: "border-rose-500/40",
    iconColor: "text-rose-400",
    href: "/dynasty-room?arena=matchups",
    stats: ["Monte Carlo Simulator", "Rivalry Vault", "All-Play Luck Matrix"]
  },
  {
    id: "player-analyzer",
    icon: Search,
    badge: "SCOUTING LAB",
    title: "Player Analyzer & Rookie Big Board",
    description: "Deep dive into 500+ NFL players with strict volume filters, rolling efficiency trends, age-adjusted depreciation, and 2024–2026 NCAA rookie dominator ratings.",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/40",
    iconColor: "text-amber-400",
    href: "/player-analyzer",
    stats: ["NCAA Dominator %", "EPA / Dropback", "Offer Trade 1-Tap"]
  },
  {
    id: "ask-madden",
    icon: Sparkles,
    badge: "AI WAR ROOM",
    title: "Ask Coach Madden (BOOM!)",
    description: "Google-style search interface with voice recognition and text-to-speech audio synthesis. Ingests live Sleeper league standings and trade logs for legendary telestrator roasts.",
    color: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-500/40",
    iconColor: "text-yellow-400",
    href: "/ask-madden",
    stats: ["Voice Audio Synthesis", "Telestrator Chalkboard", "Live League Context"]
  }
];

const LEAGUE_PREVIEWS = [
  { name: "SilkySmooov", rank: "#1", score: "63.4", pf: "3,139.6", cap: "15,883", archetype: "The Championship Goliath", badge: "WIN-NOW", tier: "Tier S" },
  { name: "JacobFry", rank: "#2", score: "59.6", pf: "3,010.8", cap: "15,883", archetype: "The Championship Goliath", badge: "WIN-NOW", tier: "Tier A" },
  { name: "Gilliam34", rank: "#3", score: "57.3", pf: "3,219.0", cap: "12,204", archetype: "The Dynasty Juggernaut", badge: "DYNASTY APEX", tier: "Tier A" },
  { name: "BucksTD", rank: "#6", score: "49.4", pf: "2,834.8", cap: "13,635", archetype: "The Ground & Pound", badge: "RB FACTORY", tier: "Tier B" },
  { name: "InsolubleNitrate", rank: "#10", score: "37.2", pf: "2,045.1", cap: "18,349", archetype: "The Productive Struggle", badge: "REBUILD APEX", tier: "Tier D" },
];

export default function LandingPage() {
  const { currentTheme } = useTheme();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [selectedArenaId, setSelectedArenaId] = useState("command");

  const currentArena = ARENA_DEEP_DIVES.find(a => a.id === selectedArenaId) || ARENA_DEEP_DIVES[0];
  const ArenaIcon = currentArena.icon;

  return (
    <div className="space-y-20 sm:space-y-28 animate-in fade-in duration-700 pb-20">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-2 sm:pt-8 pb-8 text-center max-w-4xl mx-auto space-y-6">
        
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700 shadow-xl backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono font-black text-zinc-300 tracking-wider uppercase">
            NEXT-GEN DYNASTY QUANT TERMINAL & AI WAR ROOM
          </span>
        </div>

        {/* Animated Playbook Hero Logo */}
        <div className="flex justify-center my-2">
          <PlaybookLogo size={72} animated={true} />
        </div>

        {/* Main Headline */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black text-white italic tracking-tight leading-none">
            BLINDSIDE <span style={{ color: currentTheme.primary, textShadow: `0 0 30px ${currentTheme.glow}` }}>DYNASTY</span>
          </h1>
          <p className="text-xl sm:text-2xl font-display font-bold text-zinc-200 tracking-tight">
            Protect Your Roster. Blindside Your League.
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-sans leading-relaxed">
          The tactical command terminal for serious dynasty managers. Real-time multi-platform sync (Sleeper, ESPN, Yahoo), 
          5 specialized arenas, smart trade partner matchmaking, 10,000x Monte Carlo simulations, and <strong>Coach John Madden AI</strong>.
        </p>

        {/* Hero Call-To-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link
            href="/dynasty-room"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 group"
          >
            <span>Launch Tactical War Room</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <Smartphone size={16} className="text-emerald-400" />
            <span>Install Mobile App (iOS & Android)</span>
          </button>
        </div>

        {/* Supported Platforms Micro Badge */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs font-mono text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Apple size={14} className="text-zinc-400" /> Apple iOS
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Smartphone size={14} className="text-emerald-400" /> Android WebAPK
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Shield size={14} className="text-cyan-400" /> Sleeper • ESPN • Yahoo Synced
          </span>
        </div>

      </section>


      {/* ========================================================================= */}
      {/* 2. INTERACTIVE ARENA DEEP DIVE SHOWCASE (NEW REORGANIZED LAYOUT) */}
      {/* ========================================================================= */}
      <section className="space-y-6 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
            Next-Gen Information Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight">
            EXPLORE THE 5 TACTICAL ARENAS
          </h2>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 max-w-xl mx-auto">
            Zero feature silos. Every screen is engineered around a dedicated tactical mission with connected data bridges.
          </p>
        </div>

        {/* Arena Switcher Buttons */}
        <div className="flex items-center justify-center flex-wrap gap-2 p-1.5 bg-zinc-950/80 rounded-2xl border border-zinc-800 max-w-4xl mx-auto shadow-xl">
          {ARENA_DEEP_DIVES.map((arena) => {
            const Icon = arena.icon;
            const isSelected = arena.id === selectedArenaId;
            return (
              <button
                key={arena.id}
                onClick={() => setSelectedArenaId(arena.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  isSelected 
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-700' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={isSelected ? { color: currentTheme.primary } : {}}
              >
                <Icon size={15} />
                <span>{arena.name}</span>
              </button>
            );
          })}
        </div>

        {/* Deep Dive Spotlight Card */}
        <div className={`bg-zinc-900/90 border ${currentArena.border} rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-500`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-zinc-800/80 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner">
                  <ArenaIcon size={24} className={currentArena.iconColor} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 block">
                    {currentArena.badge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight">
                    {currentArena.name.toUpperCase()} <span className="text-zinc-400 font-normal not-italic text-lg sm:text-xl">— {currentArena.subtitle}</span>
                  </h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed pt-1">
                {currentArena.overview}
              </p>
            </div>

            {/* Launch Button */}
            <Link
              href={currentArena.href}
              className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-md"
              style={{ color: currentTheme.primary }}
            >
              <span>Launch {currentArena.name}</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Subtabs Shelf Preview */}
          <div className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                Realigned Arena Sub-Tools:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentArena.subtabs.map((sub, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-zinc-300">
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* 3 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {currentArena.pillars.map((pillar, idx) => {
                const PillarIcon = pillar.icon;
                return (
                  <div key={idx} className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4.5 space-y-2.5 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <PillarIcon size={14} className={currentArena.iconColor} />
                      </div>
                      <h4 className="text-xs font-black font-sans uppercase tracking-wider text-white">
                        {pillar.title}
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. INTERACTIVE FEATURE BENTO GRID */}
      {/* ========================================================================= */}
      <section className="space-y-8 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight">
            BUILT FOR CHAMPIONSHIP DYNASTY MANAGERS
          </h2>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 uppercase tracking-widest">
            6 Specialized Quant Tools Designed to Dominate Your League Meta
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link
                key={feat.id}
                href={feat.href}
                className={`bg-zinc-900/80 hover:bg-zinc-800/80 border ${feat.border} rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] shadow-xl relative overflow-hidden flex flex-col justify-between group`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-md">
                      <Icon size={24} className={feat.iconColor} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-black text-zinc-300 tracking-wider uppercase">
                      {feat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight group-hover:text-amber-400 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-2 font-sans">
                      {feat.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800/80 mt-6 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {feat.stats.map((st, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-zinc-950 text-[10px] font-mono text-zinc-400 border border-zinc-800">
                        {st}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300 pt-1 group-hover:text-white">
                    <span>Explore Tool</span>
                    <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. LIVE LEAGUE DEMONSTRATION & STAT SHOWCASE */}
      {/* ========================================================================= */}
      <section className="bg-zinc-900/90 border-2 border-zinc-700 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
              Live Quant Analytics Showcase
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tight">
              PROVEN ACROSS REAL DYNASTY LEAGUES
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Standardized Z-Scores centered at 50.0 median • 70% Max PF / 30% Future Draft Capital
            </p>
          </div>

          <Link
            href="/dynasty-room?arena=power"
            className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition-colors flex items-center gap-1.5"
          >
            <span>View Full Standings</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Live Standings Table Preview */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                <th className="pb-3">Rank & Team</th>
                <th className="pb-3">Power Score</th>
                <th className="pb-3">Max PF</th>
                <th className="pb-3">Draft Capital</th>
                <th className="pb-3">Dynamic Archetype</th>
                <th className="pb-3 text-right">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {LEAGUE_PREVIEWS.map((team, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 flex items-center gap-2 font-bold text-white font-sans">
                    <span className="text-zinc-500 font-mono text-xs">{team.rank}</span>
                    <span>{team.name}</span>
                  </td>
                  <td className="py-3.5 font-bold text-amber-400">{team.score}</td>
                  <td className="py-3.5 text-zinc-300">{team.pf}</td>
                  <td className="py-3.5 text-emerald-400">{team.cap}</td>
                  <td className="py-3.5">
                    <TacticalTierBadge tier={team.tier} archetype={team.archetype} />
                  </td>
                  <td className="py-3.5 text-right font-bold text-purple-400 font-mono">{team.tier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. MOBILE APP DOWNLOAD & INSTALLATION HUB */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-6 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-zinc-950 border border-zinc-700 shadow-xl mb-2">
          <Smartphone size={32} className="text-emerald-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight">
            TAKE YOUR WAR ROOM EVERYWHERE
          </h2>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 max-w-lg mx-auto uppercase tracking-wider">
            Install on Apple iPhone, iPad, and Android Phones in Seconds
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left font-mono text-xs pt-4">
          
          {/* iOS Card */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm font-sans">
                <Apple size={18} />
                <span>Apple iOS (iPhone / iPad)</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase">
                Film Room
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] font-sans">
              <strong>Native App on Practice Squad</strong> (App Store soon).<br />
              <strong>Audible play:</strong> Open Safari & tap <strong>Share</strong> &rarr; <strong>"Add to Home Screen"</strong> for full-screen mode today!
            </p>
          </div>

          {/* Android Card */}
          <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-sans">
                  <Smartphone size={18} />
                  <span>Android (Native APK & WebAPK)</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                  v1.1 Release
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Install the high-performance native Android app or add directly to home screen via Chrome/Brave.
              </p>
            </div>

            <div className="pt-2">
              <a
                href="/downloads/BlindsideDynasty-v1.1.apk"
                download="BlindsideDynasty-v1.1.apk"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Download size={14} />
                <span>Download APK v1.1 (Direct Install)</span>
              </a>
            </div>
          </div>

        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/downloads/BlindsideDynasty-v1.1.apk"
            download="BlindsideDynasty-v1.1.apk"
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] inline-flex items-center gap-2"
          >
            <Download size={18} />
            <span>Download Android APK v1.1 (Direct)</span>
          </a>

          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-xl inline-flex items-center gap-2"
          >
            <Smartphone size={18} className="text-amber-400" />
            <span>Open Install Guide (iOS & Android)</span>
          </button>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 6. FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-zinc-800/80 pt-10 text-center space-y-4 max-w-5xl mx-auto">
        <div className="flex justify-center">
          <PlaybookLogo size={40} animated={false} showText={true} />
        </div>

        <p className="text-xs font-mono text-zinc-500">
          Blindside Dynasty • Built for Dynasty Champions • Powered by Sleeper, ESPN & Yahoo APIs
        </p>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs font-mono text-zinc-400">
          <Link href="/dynasty-room?arena=command" className="hover:text-white transition-colors">Command</Link>
          <Link href="/dynasty-room?arena=players" className="hover:text-white transition-colors">Players</Link>
          <Link href="/dynasty-room?arena=matchups" className="hover:text-white transition-colors">Matchups</Link>
          <Link href="/dynasty-room?arena=power" className="hover:text-white transition-colors">Power & League</Link>
          <Link href="/dynasty-room?arena=trade" className="hover:text-white transition-colors">Trade Desk</Link>
          <Link href="/ask-madden" className="hover:text-white transition-colors">Ask Madden</Link>
          <Link href="/glossary" className="hover:text-white transition-colors">Metric Glossary</Link>
          <Link href="/support" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">Support & FAQ</Link>
        </div>

        <p className="text-[11px] text-zinc-600 font-mono pt-2">
          Domain: <strong>ffdashboard.kindofabigdill.world</strong> • Blindside Dynasty Tactical GM
        </p>
      </footer>

      {/* Install Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

    </div>
  );
}

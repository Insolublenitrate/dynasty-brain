"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Crown, Sparkles, Search, Radar, Trophy, Flame, Smartphone, Apple, 
  ArrowRight, CheckCircle2, ChevronRight, Shield, Download, Zap, Activity,
  Layers, BarChart3, HelpCircle, ExternalLink, Play, Volume2
} from "lucide-react";
import PlaybookLogo from "@/components/PlaybookLogo";
import InstallAppModal from "@/components/InstallAppModal";
import { useTheme } from "@/context/ThemeContext";

const FEATURES = [
  {
    id: "power-tiers",
    icon: Crown,
    badge: "QUANT MODELING",
    title: "Dynasty Power Tiers & Lifecycle Matrix",
    description: "Statistical Z-Score composite modeling (70% Starter Max PF, 30% Draft Capital) that categorizes every team into dynamic 4-quadrant lifecycle states and intelligent positional archetypes.",
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/40",
    iconColor: "text-purple-400",
    href: "/dynasty-room",
    stats: ["Z-Score Standardization", "4-Quadrant Strategic Map", "Archetype Detection"]
  },
  {
    id: "ask-madden",
    icon: Sparkles,
    badge: "AI WAR ROOM",
    title: "Ask Coach Madden (BOOM!)",
    description: "Google-style search interface with voice recognition and text-to-speech audio synthesis. Ingests live Sleeper league standings, trade logs, and rosters to deliver authentic John Madden telestrator analysis.",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/40",
    iconColor: "text-amber-400",
    href: "/ask-madden",
    stats: ["Voice Speech Synthesis", "Telestrator Chalkboard", "Live League Context"]
  },
  {
    id: "cross-reference",
    icon: Radar,
    badge: "MULTI-DIMENSIONAL",
    title: "25+ Metric Cross-Reference Tool",
    description: "Customizable scatter plot matrix comparing 25+ statistical dimensions across 5 tactical categories (EPA, VORP, Target Share, Air Yards, CPOE) with dynamic quadrant benchmark crosshairs.",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/40",
    iconColor: "text-cyan-400",
    href: "/cross-reference",
    stats: ["25+ Metric Combinations", "Quadrant Crosshairs", "Multi-Position Colors"]
  },
  {
    id: "player-analyzer",
    icon: Search,
    badge: "ADVANCED METRICS",
    title: "Player Analyzer & Value Curves",
    description: "Deep dive into 500+ NFL players with strict positional qualification filters, rolling efficiency trends, age-adjusted depreciation, and contract leverage tiers.",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/40",
    iconColor: "text-emerald-400",
    href: "/player-analyzer",
    stats: ["Strict Volume Filters", "EPA / Dropback", "Air Yards Share"]
  },
  {
    id: "top-performers",
    icon: Trophy,
    badge: "LEADERBOARDS",
    title: "Qualified Top Performers",
    description: "Multi-position leaderboard ribbons with volume thresholds ensuring only qualified rushers, pass catchers, and quarterbacks appear in relevant efficiency metrics.",
    color: "from-yellow-500/20 to-amber-500/20",
    border: "border-yellow-500/40",
    iconColor: "text-yellow-400",
    href: "/top-performers",
    stats: ["Position Ribbon Filters", "Air Yards / Target", "YPRR Leaders"]
  },
  {
    id: "war-room",
    icon: Flame,
    badge: "TRADE AUTOPSY",
    title: "Trade Autopsy & Simulator",
    description: "Historical trade grading engine and 10,000-iteration Monte Carlo head-to-head matchup simulator with rivalry tracking and all-time franchise record books.",
    color: "from-rose-500/20 to-red-500/20",
    border: "border-rose-500/40",
    iconColor: "text-rose-400",
    href: "/war-room",
    stats: ["Monte Carlo Simulator", "Trade Value Ledger", "Franchise Record Books"]
  }
];

const LEAGUE_PREVIEWS = [
  { name: "SilkySmooov", rank: "#1", score: "63.4", pf: "3,139.6", cap: "15,883", archetype: "The Championship Goliath", badge: "🏆 WIN-NOW", tier: "Tier S" },
  { name: "JacobFry", rank: "#2", score: "59.6", pf: "3,010.8", cap: "15,883", archetype: "The Championship Goliath", badge: "🏆 WIN-NOW", tier: "Tier A" },
  { name: "Gilliam34", rank: "#3", score: "57.3", pf: "3,219.0", cap: "12,204", archetype: "The Dynasty Juggernaut", badge: "👑 DYNASTY APEX", tier: "Tier A" },
  { name: "BucksTD", rank: "#6", score: "49.4", pf: "2,834.8", cap: "13,635", archetype: "The Ground & Pound", badge: "🚜 RB FACTORY", tier: "Tier B" },
  { name: "InsolubleNitrate", rank: "#10", score: "37.2", pf: "2,045.1", cap: "18,349", archetype: "The Productive Struggle", badge: "📈 REBUILD APEX", tier: "Tier D" },
];

export default function LandingPage() {
  const { currentTheme } = useTheme();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  return (
    <div className="space-y-20 sm:space-y-28 animate-in fade-in duration-700 pb-20">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-6 sm:pt-16 pb-8 text-center max-w-4xl mx-auto space-y-6">
        
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700 shadow-xl backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono font-black text-zinc-300 tracking-wider uppercase">
            ⚡ NEXT-GEN DYNASTY QUANT ENGINE & AI WAR ROOM
          </span>
        </div>

        {/* Animated Playbook Hero Logo */}
        <div className="flex justify-center my-2">
          <PlaybookLogo size={72} animated={true} />
        </div>

        {/* Main Headline */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white italic tracking-tight font-sans leading-none">
            WAIVER <span style={{ color: currentTheme.primary, textShadow: `0 0 30px ${currentTheme.glow}` }}>WIRETAP</span>
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-zinc-200 tracking-tight font-sans">
            The Unfair Advantage in Dynasty Fantasy Football
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-sans leading-relaxed">
          Real-time Sleeper synchronization, 4-quadrant lifecycle modeling, standardized Z-score power tiers, 
          25+ metric cross-referencing, and legendary tactical breakdowns powered by <strong>Coach John Madden</strong>.
        </p>

        {/* Hero Call-To-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link
            href="/dynasty-room"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 group"
          >
            <span>Launch Web Dashboard</span>
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
            <Shield size={14} className="text-cyan-400" /> Sleeper API Synced
          </span>
        </div>

      </section>


      {/* ========================================================================= */}
      {/* 2. INTERACTIVE FEATURE BENTO GRID */}
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
      {/* 3. LIVE LEAGUE DEMONSTRATION & STAT SHOWCASE */}
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
          </div>

          <Link
            href="/dynasty-room"
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
                    <span className="px-2 py-0.5 rounded-md bg-zinc-950 text-[10px] text-zinc-300 border border-zinc-800">
                      {team.archetype}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-bold text-purple-400">{team.tier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. MOBILE APP DOWNLOAD & INSTALLATION HUB */}
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
                Film Room 🏈
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] font-sans">
              <strong>Native App on Practice Squad</strong> (App Store soon).<br />
              <strong>Audible play:</strong> Open Safari & tap <strong>Share (⎋)</strong> &rarr; <strong>"Add to Home Screen" (➕)</strong> for full-screen mode today!
            </p>
          </div>

          {/* Android Card */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-sans">
              <Smartphone size={18} />
              <span>Android (WebAPK / PWA)</span>
            </div>
            <p className="text-zinc-400 text-[11px] font-sans">
              1. Open Chrome/Brave on Android<br />
              2. Tap <strong>"Get App 📱"</strong> or the <strong>3-dots menu (⋮)</strong><br />
              3. Tap <strong>"Install app"</strong> for instant full-screen app
            </p>
          </div>

        </div>

        <div className="pt-4">
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] inline-flex items-center gap-2"
          >
            <Download size={18} />
            <span>Open Download & Install Guide</span>
          </button>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-zinc-800/80 pt-10 text-center space-y-4 max-w-5xl mx-auto">
        <div className="flex justify-center">
          <PlaybookLogo size={40} animated={false} showText={true} />
        </div>

        <p className="text-xs font-mono text-zinc-500">
          Waiver Wiretap • Built for Dynasty Champions • Powered by Sleeper API & Quant Analytics
        </p>

        <div className="flex justify-center gap-6 text-xs font-mono text-zinc-400">
          <Link href="/dynasty-room" className="hover:text-white transition-colors">Dynasty Room</Link>
          <Link href="/ask-madden" className="hover:text-white transition-colors">Ask Madden</Link>
          <Link href="/player-analyzer" className="hover:text-white transition-colors">Player Analyzer</Link>
          <Link href="/cross-reference" className="hover:text-white transition-colors">Cross Reference</Link>
          <Link href="/war-room" className="hover:text-white transition-colors">War Room</Link>
          <Link href="/support" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">Support & FAQ</Link>
        </div>

        <p className="text-[11px] text-zinc-600 font-mono pt-2">
          Domain: <strong>waiverwiretap.kindofabigdill.com</strong> / <strong>ffdashboard.kindofabigdill.world</strong>
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

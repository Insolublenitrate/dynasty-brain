"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Target, Search, Activity, Crosshair, Briefcase, ArrowRightLeft, 
  AlertTriangle, Swords, Trophy, Crown, Dices, Layers, CalendarDays, Radio, BarChart3
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import ActionCenterTab from '@/components/tabs/ActionCenterTab';
import ScheduleTab from '@/components/tabs/ScheduleTab';
import TeamAnalyzerTab from '@/components/tabs/TeamAnalyzerTab';
import StudioTab from '@/components/tabs/StudioTab';
import MatrixTab from '@/components/tabs/MatrixTab';
import TradeArchitectTab from '@/components/tabs/TradeArchitectTab';
import AutopsyTab from '@/components/tabs/AutopsyTab';
import RivalriesTab from '@/components/tabs/RivalriesTab';
import RecordBookTab from '@/components/tabs/RecordBookTab';
import PowerRankingsTab from '@/components/tabs/PowerRankingsTab';
import MatchupSimulatorTab from '@/components/tabs/MatchupSimulatorTab';

function DynastyRoomContent() {
  const { leagueId, leagueName, isLoading: isLeagueLoading } = useLeague();
  const { currentTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Primary Arena (command, matchups, power, trade)
  const arenaParam = searchParams.get('arena') || 'command';
  const [activeArena, setActiveArena] = useState(arenaParam);

  // Sub-tab selectors for multi-module arenas
  const [commandSub, setCommandSub] = useState<'action' | 'studio'>('action');
  const [powerSub, setPowerSub] = useState<'matrix' | 'tiers' | 'rivalries' | 'records' | 'simulator'>('matrix');
  const [tradeSub, setTradeSub] = useState<'architect' | 'team' | 'autopsy'>('architect');

  useEffect(() => {
    if (arenaParam && arenaParam !== activeArena) {
      setActiveArena(arenaParam);
    }
  }, [arenaParam]);

  const handleArenaChange = (newArena: string) => {
    setActiveArena(newArena);
    router.push(`/dynasty-room?arena=${newArena}`, { scroll: false });
  };

  const TICKER_MESSAGES = [
    "🚨 INJURY ALERT: Monitor player practice reports before weekly lineup lock.",
    "💸 CASH CHASE: The Bounty Board leader extends their Max PF lead in the division.",
    "📉 PURGATORY WARNING: Teams in the lower-left quadrant should initiate a strategic retooling.",
    "🔥 QUANT TAKE: Draft pick depreciation accelerates by 18% post-draft. Trade picks during the rookie hype apex.",
    "⚡ TRADE ARBITRAGE: Multiple buy-low candidates identified in the Action Center.",
    "⚔️ RIVALRY ALERT: Check the 10x10 Head-to-Head series records in the Rivalries tab.",
    "🎲 TALE OF THE TAPE: Run 10,000 Monte Carlo simulations on any two rosters in the Matchup Simulator."
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] pb-24 md:pb-16">
      
      {/* ── STICKY ARENA CONTROLLER & SUB-NAV ──────────────────────────── */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-16 z-30 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3 mb-6 shadow-xl">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Main 4 Arena Switcher (Mobile & Desktop) */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 shadow-inner overflow-x-auto hide-scrollbar">
            <button
              onClick={() => handleArenaChange('command')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                activeArena === 'command'
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={activeArena === 'command' ? { color: currentTheme.primary } : {}}
            >
              <Target size={14} className={activeArena === 'command' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              <span>Command</span>
            </button>

            <button
              onClick={() => handleArenaChange('matchups')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                activeArena === 'matchups'
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={activeArena === 'matchups' ? { color: currentTheme.primary } : {}}
            >
              <CalendarDays size={14} className={activeArena === 'matchups' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              <span>Matchups</span>
            </button>

            <button
              onClick={() => handleArenaChange('power')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                activeArena === 'power'
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={activeArena === 'power' ? { color: currentTheme.primary } : {}}
            >
              <Crown size={14} className={activeArena === 'power' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              <span>Power & League</span>
            </button>

            <button
              onClick={() => handleArenaChange('trade')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                activeArena === 'trade'
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={activeArena === 'trade' ? { color: currentTheme.primary } : {}}
            >
              <Briefcase size={14} className={activeArena === 'trade' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              <span>Trade Hub</span>
            </button>
          </div>

          {/* Contextual Sub-View Segmented Pills */}
          {activeArena === 'command' && (
            <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80 self-start sm:self-auto overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setCommandSub('action')}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                  commandSub === 'action' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={commandSub === 'action' ? { color: currentTheme.primary } : {}}
              >
                <Target size={12} />
                <span>Action Center</span>
              </button>
              <button
                onClick={() => setCommandSub('studio')}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                  commandSub === 'studio' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={commandSub === 'studio' ? { color: currentTheme.primary } : {}}
              >
                <Radio size={12} />
                <span>The Studio Feed</span>
              </button>
            </div>
          )}

          {activeArena === 'power' && (
            <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80 self-start sm:self-auto overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setPowerSub('matrix')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  powerSub === 'matrix' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={powerSub === 'matrix' ? { color: currentTheme.primary } : {}}
              >
                2x2 Matrix
              </button>
              <button
                onClick={() => setPowerSub('tiers')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  powerSub === 'tiers' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={powerSub === 'tiers' ? { color: currentTheme.primary } : {}}
              >
                Power Tiers
              </button>
              <button
                onClick={() => setPowerSub('rivalries')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  powerSub === 'rivalries' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={powerSub === 'rivalries' ? { color: currentTheme.primary } : {}}
              >
                Rivalries & All-Play
              </button>
              <button
                onClick={() => setPowerSub('records')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  powerSub === 'records' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={powerSub === 'records' ? { color: currentTheme.primary } : {}}
              >
                Record Book
              </button>
              <button
                onClick={() => setPowerSub('simulator')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  powerSub === 'simulator' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={powerSub === 'simulator' ? { color: currentTheme.primary } : {}}
              >
                Matchup Sim
              </button>
            </div>
          )}

          {activeArena === 'trade' && (
            <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80 self-start sm:self-auto overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setTradeSub('architect')}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                  tradeSub === 'architect' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={tradeSub === 'architect' ? { color: currentTheme.primary } : {}}
              >
                <Briefcase size={12} />
                <span>Trade Architect</span>
              </button>
              <button
                onClick={() => setTradeSub('team')}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                  tradeSub === 'team' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={tradeSub === 'team' ? { color: currentTheme.primary } : {}}
              >
                <Search size={12} />
                <span>Team Analyzer</span>
              </button>
              <button
                onClick={() => setTradeSub('autopsy')}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                  tradeSub === 'autopsy' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={tradeSub === 'autopsy' ? { color: currentTheme.primary } : {}}
              >
                <ArrowRightLeft size={12} />
                <span>Trade Autopsy</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── ARENA CONTENT VIEWS ────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto animate-in fade-in duration-300">
        {/* Arena 1: Command */}
        {activeArena === 'command' && (
          <div>
            {commandSub === 'action' && <ActionCenterTab />}
            {commandSub === 'studio' && <StudioTab />}
          </div>
        )}

        {/* Arena 2: Matchups & Schedule */}
        {activeArena === 'matchups' && <ScheduleTab />}

        {/* Arena 3: Power & League */}
        {activeArena === 'power' && (
          <div>
            {powerSub === 'matrix' && <MatrixTab />}
            {powerSub === 'tiers' && <PowerRankingsTab />}
            {powerSub === 'rivalries' && <RivalriesTab />}
            {powerSub === 'records' && <RecordBookTab />}
            {powerSub === 'simulator' && <MatchupSimulatorTab />}
          </div>
        )}

        {/* Arena 4: Trade Hub */}
        {activeArena === 'trade' && (
          <div>
            {tradeSub === 'architect' && <TradeArchitectTab />}
            {tradeSub === 'team' && <TeamAnalyzerTab />}
            {tradeSub === 'autopsy' && <AutopsyTab />}
          </div>
        )}
      </div>

      {/* ── PERSISTENT TICKER (Mobile Aware Spacing) ────────────────────── */}
      <div className="fixed bottom-16 md:bottom-0 left-0 w-full bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/90 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.7)]">
        <div className="flex items-stretch h-8 sm:h-9">
          <div 
            className="text-zinc-950 font-black italic px-3 sm:px-4 flex items-center justify-center gap-1.5 z-20 shadow-md text-[11px] sm:text-xs tracking-wider shrink-0"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <AlertTriangle size={13} className="stroke-[2.5]" /> 
            <span>BREAKING</span>
          </div>
          
          <div className="flex-1 overflow-hidden relative flex items-center bg-zinc-900/40">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10"></div>
            
            <div className="animate-marquee-slow whitespace-nowrap inline-flex items-center text-[11px] sm:text-xs font-mono">
              {[...TICKER_MESSAGES, ...TICKER_MESSAGES].map((msg, i) => (
                <span key={i} className="text-zinc-300 inline-flex items-center">
                  <span className="mx-4 text-zinc-600">|</span>
                  {msg}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function DynastyRoomPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading War Room Arena...</p>
      </div>
    }>
      <DynastyRoomContent />
    </Suspense>
  );
}

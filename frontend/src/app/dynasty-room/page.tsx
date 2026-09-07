"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Target, Search, Activity, Crosshair, Briefcase, ArrowRightLeft, 
  AlertTriangle, Swords, Trophy, Crown, Dices, Layers, CalendarDays, Radio, BarChart3, Coins, TrendingUp,
  Users, Database, GraduationCap, Radar, Flame
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import ActionCenterTab from '@/components/tabs/ActionCenterTab';
import RosterIntelTab from '@/components/tabs/RosterIntelTab';
import ScheduleTab from '@/components/tabs/ScheduleTab';
import TeamAnalyzerTab from '@/components/tabs/TeamAnalyzerTab';
import StudioTab from '@/components/tabs/StudioTab';
import BountyVaultTab from '@/components/tabs/BountyVaultTab';
import MatrixTab from '@/components/tabs/MatrixTab';
import TradeArchitectTab from '@/components/tabs/TradeArchitectTab';
import AutopsyTab from '@/components/tabs/AutopsyTab';
import TradedPlayersTab from '@/components/tabs/TradedPlayersTab';
import RivalriesTab from '@/components/tabs/RivalriesTab';
import RecordBookTab from '@/components/tabs/RecordBookTab';
import PowerRankingsTab from '@/components/tabs/PowerRankingsTab';
import MatchupSimulatorTab from '@/components/tabs/MatchupSimulatorTab';
import PlayerAnalyzerTab from '@/components/tabs/PlayerAnalyzerTab';
import PlayerDatabaseTab from '@/components/tabs/PlayerDatabaseTab';
import RookieAnalyzerTab from '@/components/tabs/RookieAnalyzerTab';
import TopPerformersTab from '@/components/tabs/TopPerformersTab';
import PlayerCompareTab from '@/components/tabs/PlayerCompareTab';
import CrossReferenceTab from '@/components/tabs/CrossReferenceTab';
import TradePartnerTab from '@/components/tabs/TradePartnerTab';
import DraftCapitalTab from '@/components/tabs/DraftCapitalTab';

function DynastyRoomContent() {
  const { leagueId, leagueName, isLoading: isLeagueLoading } = useLeague();
  const { currentTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Primary Arena (command, matchups, power, trade)
  const arenaParam = searchParams.get('arena') || 'command';
  const subParam = searchParams.get('sub');
  const [activeArena, setActiveArena] = useState(arenaParam);

  // Sub-tab selectors for multi-module arenas
  const [commandSub, setCommandSub] = useState<'action' | 'roster' | 'diagnostics'>((subParam as any) || 'action');
  const [matchupsSub, setMatchupsSub] = useState<'slate' | 'simulator' | 'rivalries' | 'allplay'>((subParam as any) || 'slate');
  const [playersSub, setPlayersSub] = useState<'analyzer' | 'database' | 'rookies' | 'leaders' | 'crossref' | 'compare'>((subParam as any) || 'analyzer');
  const [powerSub, setPowerSub] = useState<'tiers' | 'matrix' | 'records' | 'bounties' | 'studio'>((subParam as any) || 'tiers');
  const [tradeSub, setTradeSub] = useState<'architect' | 'partners' | 'capital' | 'ledger' | 'autopsy'>((subParam as any) || 'architect');
  const [selectedAutopsyTradeId, setSelectedAutopsyTradeId] = useState<string | null>(searchParams.get('trade_id') || null);

  useEffect(() => {
    if (arenaParam && arenaParam !== activeArena) {
      setActiveArena(arenaParam);
    }
  }, [arenaParam]);

  useEffect(() => {
    if (subParam) {
      if (['action', 'roster', 'diagnostics'].includes(subParam)) setCommandSub(subParam as any);
      if (['slate', 'simulator', 'rivalries', 'allplay'].includes(subParam)) setMatchupsSub(subParam as any);
      if (['analyzer', 'database', 'rookies', 'leaders', 'crossref', 'compare'].includes(subParam)) setPlayersSub(subParam as any);
      if (['tiers', 'matrix', 'records', 'bounties', 'studio'].includes(subParam)) setPowerSub(subParam as any);
      if (['architect', 'partners', 'capital', 'ledger', 'autopsy'].includes(subParam)) setTradeSub(subParam as any);
    } else {
      // If arena switched without subParam, ensure the active arena has a valid sub selected
      if (!['action', 'roster', 'diagnostics'].includes(commandSub)) setCommandSub('action');
      if (!['slate', 'simulator', 'rivalries', 'allplay'].includes(matchupsSub)) setMatchupsSub('slate');
      if (!['analyzer', 'database', 'rookies', 'leaders', 'crossref', 'compare'].includes(playersSub)) setPlayersSub('analyzer');
      if (!['tiers', 'matrix', 'records', 'bounties', 'studio'].includes(powerSub)) setPowerSub('tiers');
      if (!['architect', 'partners', 'capital', 'ledger', 'autopsy'].includes(tradeSub)) setTradeSub('architect');
    }
  }, [arenaParam, subParam, commandSub, matchupsSub, playersSub, powerSub, tradeSub]);

  const handleArenaChange = (newArena: string) => {
    setActiveArena(newArena);
    router.push(`/dynasty-room?arena=${newArena}`, { scroll: false });
  };

  const TICKER_MESSAGES = [
    "[INJURY INTEL] Monitor player practice reports before weekly lineup lock.",
    "[BOUNTY LEDGER] The Bounty Board leader extends their Max PF lead in the division.",
    "[PURGATORY WARNING] Teams in the lower-left quadrant should initiate a strategic retooling.",
    "[QUANT TAKE] Draft pick depreciation accelerates post-draft. Trade picks during rookie hype apex.",
    "[ARBITRAGE ALERT] Multiple buy-low candidates identified in the Action Center.",
    "[RIVALRY INTEL] Check the 10x10 Head-to-Head series records in the Rivals tab.",
    "[SIMULATION LAB] Run 10,000 Monte Carlo simulations on any two rosters in the Matchup Simulator."
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] w-full max-w-full overflow-x-hidden">
      
      {/* ── STICKY ARENA CONTROLLER & SUB-NAV (SEAMLESS FLUSH DOCK WITH ZERO DEAD SPACE) ────────────── */}
      <div className={`${activeArena === 'matchups' ? 'hidden sm:block' : 'block'} -mx-2.5 sm:-mx-6 lg:-mx-8 px-2.5 sm:px-6 lg:px-8 border-b border-zinc-800/90 bg-zinc-950 sticky top-14 sm:top-16 z-30 py-1.5 sm:py-2 shadow-xl`}>
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          
          {/* Main 4 Arena Switcher (Desktop / Tablet Only - Mobile uses Bottom Nav) */}
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
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
              onClick={() => handleArenaChange('players')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                activeArena === 'players'
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={activeArena === 'players' ? { color: currentTheme.primary } : {}}
            >
              <Users size={14} className={activeArena === 'players' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              <span>Players</span>
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

          {/* Contextual Sub-View Segmented Controls (Full Width Grid on Mobile - Zero Scrolling) */}
          {activeArena === 'command' && (
            <div className="grid grid-cols-3 w-full sm:w-auto sm:flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
              <button
                onClick={() => setCommandSub('action')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  commandSub === 'action' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={commandSub === 'action' ? { color: currentTheme.primary } : {}}
              >
                <Target size={13} className="shrink-0" />
                <span className="truncate">Action</span>
              </button>
              <button
                onClick={() => setCommandSub('roster')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  commandSub === 'roster' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={commandSub === 'roster' ? { color: currentTheme.primary } : {}}
              >
                <Crown size={13} className="shrink-0" />
                <span className="truncate">Roster</span>
              </button>
              <button
                onClick={() => setCommandSub('diagnostics')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  commandSub === 'diagnostics' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={commandSub === 'diagnostics' ? { color: currentTheme.primary } : {}}
              >
                <Activity size={13} className="shrink-0" />
                <span className="truncate">Diagnostics</span>
              </button>
            </div>
          )}

          {activeArena === 'players' && (
            <div className="grid grid-cols-5 w-full sm:w-auto sm:flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
              <button
                onClick={() => setPlayersSub('analyzer')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  playersSub === 'analyzer' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={playersSub === 'analyzer' ? { color: currentTheme.primary } : {}}
              >
                <Search size={13} className="shrink-0" />
                <span className="truncate">Analyzer</span>
              </button>
              <button
                onClick={() => setPlayersSub('database')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  playersSub === 'database' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={playersSub === 'database' ? { color: currentTheme.primary } : {}}
              >
                <Database size={13} className="shrink-0" />
                <span className="truncate">Database</span>
              </button>
              <button
                onClick={() => setPlayersSub('rookies')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  playersSub === 'rookies' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={playersSub === 'rookies' ? { color: currentTheme.primary } : {}}
              >
                <GraduationCap size={13} className="shrink-0" />
                <span className="truncate">Rookies</span>
              </button>
              <button
                onClick={() => setPlayersSub('leaders')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  playersSub === 'leaders' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={playersSub === 'leaders' ? { color: currentTheme.primary } : {}}
              >
                <Trophy size={13} className="shrink-0" />
                <span className="truncate">Leaders</span>
              </button>
              <button
                onClick={() => setPlayersSub('crossref')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  playersSub === 'crossref' || playersSub === 'compare' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={(playersSub === 'crossref' || playersSub === 'compare') ? { color: currentTheme.primary } : {}}
              >
                <Radar size={13} className="shrink-0" />
                <span className="truncate">Cross-Ref</span>
              </button>
            </div>
          )}

          {activeArena === 'matchups' && (
            <div className="grid grid-cols-4 w-full sm:w-auto sm:flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
              <button
                onClick={() => setMatchupsSub('slate')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  matchupsSub === 'slate' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={matchupsSub === 'slate' ? { color: currentTheme.primary } : {}}
              >
                <CalendarDays size={13} className="shrink-0" />
                <span className="truncate">Slate</span>
              </button>
              <button
                onClick={() => setMatchupsSub('simulator')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  matchupsSub === 'simulator' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={matchupsSub === 'simulator' ? { color: currentTheme.primary } : {}}
              >
                <Swords size={13} className="shrink-0" />
                <span className="truncate">Simulator</span>
              </button>
              <button
                onClick={() => setMatchupsSub('rivalries')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  matchupsSub === 'rivalries' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={matchupsSub === 'rivalries' ? { color: currentTheme.primary } : {}}
              >
                <Flame size={13} className="shrink-0" />
                <span className="truncate">Rivalries</span>
              </button>
              <button
                onClick={() => setMatchupsSub('allplay')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  matchupsSub === 'allplay' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={matchupsSub === 'allplay' ? { color: currentTheme.primary } : {}}
              >
                <Layers size={13} className="shrink-0" />
                <span className="truncate">All-Play</span>
              </button>
            </div>
          )}

          {activeArena === 'power' && (
            <div className="grid grid-cols-5 w-full sm:w-auto sm:flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
              <button
                onClick={() => setPowerSub('tiers')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  powerSub === 'tiers' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={powerSub === 'tiers' ? { color: currentTheme.primary } : {}}
              >
                <Crown size={13} className="shrink-0" />
                <span className="truncate">Tiers</span>
              </button>
              <button
                onClick={() => setPowerSub('matrix')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  powerSub === 'matrix' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={powerSub === 'matrix' ? { color: currentTheme.primary } : {}}
              >
                <Target size={13} className="shrink-0" />
                <span className="truncate">Matrix</span>
              </button>
              <button
                onClick={() => setPowerSub('records')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  powerSub === 'records' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={powerSub === 'records' ? { color: currentTheme.primary } : {}}
              >
                <Trophy size={13} className="shrink-0" />
                <span className="truncate">Records</span>
              </button>
              <button
                onClick={() => setPowerSub('bounties')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  powerSub === 'bounties' ? 'bg-emerald-500 text-zinc-950 shadow-md font-black' : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <Coins size={13} className="shrink-0 text-emerald-400" />
                <span className="truncate">Bounties</span>
              </button>
              <button
                onClick={() => setPowerSub('studio')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  powerSub === 'studio' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={powerSub === 'studio' ? { color: currentTheme.primary } : {}}
              >
                <Radio size={13} className="shrink-0" />
                <span className="truncate">Studio</span>
              </button>
            </div>
          )}

          {activeArena === 'trade' && (
            <div className="grid grid-cols-5 w-full sm:w-auto sm:flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
              <button
                onClick={() => setTradeSub('architect')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  tradeSub === 'architect' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={tradeSub === 'architect' ? { color: currentTheme.primary } : {}}
              >
                <Briefcase size={13} className="shrink-0" />
                <span className="truncate">Architect</span>
              </button>
              <button
                onClick={() => setTradeSub('partners')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  tradeSub === 'partners' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={tradeSub === 'partners' ? { color: currentTheme.primary } : {}}
              >
                <Users size={13} className="shrink-0" />
                <span className="truncate">Partners</span>
              </button>
              <button
                onClick={() => setTradeSub('capital')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  tradeSub === 'capital' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={tradeSub === 'capital' ? { color: currentTheme.primary } : {}}
              >
                <Coins size={13} className="shrink-0" />
                <span className="truncate">Capital</span>
              </button>
              <button
                onClick={() => setTradeSub('ledger')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  tradeSub === 'ledger' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={tradeSub === 'ledger' ? { color: currentTheme.primary } : {}}
              >
                <TrendingUp size={13} className="shrink-0" />
                <span className="truncate">Ledger</span>
              </button>
              <button
                onClick={() => setTradeSub('autopsy')}
                className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center ${
                  tradeSub === 'autopsy' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={tradeSub === 'autopsy' ? { color: currentTheme.primary } : {}}
              >
                <ArrowRightLeft size={13} className="shrink-0" />
                <span className="truncate">Autopsy</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── ARENA CONTENT VIEWS ────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto pt-3 sm:pt-4 animate-in fade-in duration-300">
        {/* Arena 1: Command */}
        {activeArena === 'command' && (
          <div>
            {commandSub === 'action' && <ActionCenterTab />}
            {commandSub === 'roster' && <RosterIntelTab />}
            {commandSub === 'diagnostics' && <TeamAnalyzerTab />}
          </div>
        )}

        {/* Arena 2: Players */}
        {activeArena === 'players' && (
          <div>
            {playersSub === 'analyzer' && <PlayerAnalyzerTab />}
            {playersSub === 'database' && <PlayerDatabaseTab />}
            {playersSub === 'rookies' && <RookieAnalyzerTab />}
            {playersSub === 'leaders' && <TopPerformersTab />}
            {(playersSub === 'crossref' || playersSub === 'compare') && <CrossReferenceTab />}
          </div>
        )}

        {/* Arena 3: Matchups */}
        {activeArena === 'matchups' && (
          <div>
            {matchupsSub === 'slate' && <ScheduleTab initialViewMode="slate" />}
            {matchupsSub === 'simulator' && <MatchupSimulatorTab />}
            {matchupsSub === 'rivalries' && <RivalriesTab />}
            {matchupsSub === 'allplay' && <ScheduleTab initialViewMode="allplay" />}
          </div>
        )}

        {/* Arena 4: Power & League */}
        {activeArena === 'power' && (
          <div>
            {powerSub === 'tiers' && <PowerRankingsTab />}
            {powerSub === 'matrix' && <MatrixTab />}
            {powerSub === 'records' && <RecordBookTab />}
            {powerSub === 'bounties' && <BountyVaultTab />}
            {powerSub === 'studio' && <StudioTab />}
          </div>
        )}

        {/* Arena 5: Trade Hub */}
        {activeArena === 'trade' && (
          <div>
            {tradeSub === 'architect' && <TradeArchitectTab />}
            {tradeSub === 'partners' && (
              <TradePartnerTab 
                onSelectPartner={(rosterId) => {
                  router.push(`/dynasty-room?arena=trade&sub=architect&partner_roster=${rosterId}`, { scroll: false });
                  setTradeSub('architect');
                }} 
              />
            )}
            {tradeSub === 'capital' && (
              <DraftCapitalTab 
                onSelectTeamForTrade={(rosterId) => {
                  router.push(`/dynasty-room?arena=trade&sub=architect&partner_roster=${rosterId}`, { scroll: false });
                  setTradeSub('architect');
                }} 
              />
            )}
            {tradeSub === 'ledger' && (
              <TradedPlayersTab 
                onSelectTradeForAutopsy={(tradeId) => {
                  setSelectedAutopsyTradeId(tradeId);
                  setTradeSub('autopsy');
                  router.push(`/dynasty-room?arena=trade&sub=autopsy&trade_id=${tradeId}`, { scroll: false });
                }}
              />
            )}
            {tradeSub === 'autopsy' && (
              <AutopsyTab 
                selectedTrade={selectedAutopsyTradeId || undefined} 
              />
            )}
          </div>
        )}
      </div>

      {/* ── PERSISTENT TICKER (Mobile Aware Spacing - Zero Overflow) ────────────────────── */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 w-full max-w-full overflow-hidden bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/90 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.7)]">
        <div className="flex items-stretch h-8 sm:h-9 w-full max-w-full overflow-hidden">
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

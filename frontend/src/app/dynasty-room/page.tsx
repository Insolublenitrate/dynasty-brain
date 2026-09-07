"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Target, Search, Activity, Crosshair, Briefcase, ArrowRightLeft, 
  AlertTriangle, Swords, Trophy, Crown, Dices, Layers, CalendarDays, Radio, BarChart3, Coins, TrendingUp,
  Users, Database, GraduationCap, Radar, Flame, FlaskConical, Zap, X, Sparkles, ChevronRight
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

  // Focus Mode (Manager Mode) vs Analyst Pro (All 23 Modules)
  const [focusMode, setFocusMode] = useState<boolean>(true);
  const [isLabModalOpen, setIsLabModalOpen] = useState<boolean>(false);
  const [labSearchQuery, setLabSearchQuery] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('blindside_focus_mode');
      if (saved !== null) {
        setFocusMode(saved !== 'false');
      }
    }
  }, []);

  const toggleFocusMode = (mode: boolean) => {
    setFocusMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('blindside_focus_mode', mode ? 'true' : 'false');
    }
  };

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
    if (typeof window !== 'undefined' && window.scrollY > 40) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  const jumpToModule = (arena: string, sub: string) => {
    setActiveArena(arena);
    if (arena === 'command') setCommandSub(sub as any);
    if (arena === 'players') setPlayersSub(sub as any);
    if (arena === 'matchups') setMatchupsSub(sub as any);
    if (arena === 'power') setPowerSub(sub as any);
    if (arena === 'trade') setTradeSub(sub as any);
    setIsLabModalOpen(false);
    router.push(`/dynasty-room?arena=${arena}&sub=${sub}`, { scroll: false });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLabModalOpen) {
        setIsLabModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLabModalOpen]);

  const TACTICAL_MODULES = [
    { id: 'action', arena: 'command', sub: 'action', title: 'Action Center', category: 'Command', desc: 'Urgent roster warnings, market arbitrage alerts, and prioritized trade actions.', icon: Target, badge: 'Urgent Ops' },
    { id: 'roster', arena: 'command', sub: 'roster', title: 'Roster Intel', category: 'Command', desc: 'Age curves, cliff warnings, positional depth grades, and direct player shopping.', icon: Radar, badge: 'Life Cycle' },
    { id: 'diagnostics', arena: 'command', sub: 'diagnostics', title: 'Team Diagnostics', category: 'Command', desc: 'Radar chart overlays and positional strengths vs league median.', icon: Activity, badge: 'Radar Lab' },
    
    { id: 'architect', arena: 'trade', sub: 'architect', title: 'Trade Architect', category: 'Trade', desc: 'Multi-asset trade builder with 1-click pick auto-balancing & Sleeper proposals.', icon: Briefcase, badge: 'Auto-Balance' },
    { id: 'partners', arena: 'trade', sub: 'partners', title: 'Trade Partner Finder', category: 'Trade', desc: 'Algorithmic buyer/seller matching with 1-click deal blueprints.', icon: ArrowRightLeft, badge: 'Blueprints' },
    { id: 'capital', arena: 'trade', sub: 'capital', title: 'Draft Capital Matrix', category: 'Trade', desc: 'Multi-year pick inventory across all 12 franchises with surplus tracking.', icon: Coins, badge: 'Picks' },
    { id: 'ledger', arena: 'trade', sub: 'ledger', title: 'Trade Ledger', category: 'Trade', desc: 'League-wide completed trade transactions with detailed asset logs.', icon: Layers, badge: 'Log' },
    { id: 'autopsy', arena: 'trade', sub: 'autopsy', title: 'Trade Autopsy', category: 'Trade', desc: 'Post-trade performance retrospectives and historical win/loss tracking.', icon: Swords, badge: 'Post-Mortem' },
    
    { id: 'analyzer', arena: 'players', sub: 'analyzer', title: 'Player Valuation', category: 'Players', desc: 'Production vs market valuation regression, WAR/VORP, and dynasty tiering.', icon: TrendingUp, badge: 'Valuation' },
    { id: 'database', arena: 'players', sub: 'database', title: 'Player Database', category: 'Players', desc: 'Comprehensive filterable player database with advanced opportunity stats.', icon: Database, badge: 'Stats' },
    { id: 'rookies', arena: 'players', sub: 'rookies', title: 'Rookie Class Scout', category: 'Players', desc: 'Rookie rankings, NFL draft capital value weighting, and breakout metrics.', icon: GraduationCap, badge: 'Class Scout' },
    { id: 'leaders', arena: 'players', sub: 'leaders', title: 'Metric Leaders', category: 'Players', desc: 'Air yards, target share, red zone touches, and efficiency leaderboards.', icon: BarChart3, badge: 'Efficiency' },
    { id: 'crossref', arena: 'players', sub: 'crossref', title: 'Player Comparison', category: 'Players', desc: 'Direct stat-for-stat visual radar and production overlay between any two players.', icon: Crosshair, badge: 'Radar Overlay' },
    
    { id: 'slate', arena: 'matchups', sub: 'slate', title: 'Matchup Slate', category: 'Matchups', desc: 'Current week matchups, projected point spreads, and win probability models.', icon: CalendarDays, badge: 'Odds' },
    { id: 'simulator', arena: 'matchups', sub: 'simulator', title: 'Monte Carlo Simulator', category: 'Matchups', desc: '10,000 game simulation engine testing boom/bust distributions.', icon: Dices, badge: '10k Engine' },
    { id: 'rivalries', arena: 'matchups', sub: 'rivalries', title: '10x10 Head-to-Head', category: 'Matchups', desc: 'Lifetime head-to-head records, all-time scoring margins, and rivalries.', icon: Flame, badge: 'Rivalries' },
    { id: 'allplay', arena: 'matchups', sub: 'allplay', title: 'All-Play Standings', category: 'Matchups', desc: 'Schedule-independent luck analysis: records if playing all teams weekly.', icon: Trophy, badge: 'Luck Analysis' },
    
    { id: 'tiers', arena: 'power', sub: 'tiers', title: 'Dynasty Power Tiers', category: 'League', desc: 'Holistic power rankings combining starter strength, depth, and future capital.', icon: Crown, badge: 'Tiering' },
    { id: 'matrix', arena: 'power', sub: 'matrix', title: 'Landscape Matrix', category: 'League', desc: 'Contender vs Rebuilder 4-quadrant plot identifying strategic windows.', icon: Target, badge: '4-Quadrant' },
    { id: 'records', arena: 'power', sub: 'records', title: 'League Record Book', category: 'League', desc: 'All-time single-game scoring records, largest blowouts, and streaks.', icon: Trophy, badge: 'Records' },
    { id: 'bounties', arena: 'power', sub: 'bounties', title: 'Bounty Vault', category: 'League', desc: 'Live league bounties, cash milestones, and special award trackers.', icon: Coins, badge: 'Bounties' },
    { id: 'studio', arena: 'power', sub: 'studio', title: 'Recap Studio', category: 'League', desc: 'AI-generated weekly recaps, commissioner announcements, and exportable graphics.', icon: Radio, badge: 'AI Newsletter' }
  ];

  const filteredLabModules = TACTICAL_MODULES.filter(m => 
    !labSearchQuery.trim() ||
    m.title.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    m.desc.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    m.badge.toLowerCase().includes(labSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] w-full max-w-full overflow-x-clip">
      
      {/* ── STICKY ARENA CONTROLLER & SUB-NAV (SEAMLESS FLUSH DOCK WITH ZERO DEAD SPACE) ────────────── */}
      <div className={`${activeArena === 'matchups' ? 'hidden sm:block' : 'block'} -mx-2.5 sm:-mx-6 lg:-mx-8 px-2.5 sm:px-6 lg:px-8 border-b border-zinc-800/90 bg-zinc-950 sticky top-14 sm:top-16 z-30 py-1.5 sm:py-2 shadow-xl`}>
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          
          {/* Main Arenas Switcher: In Focus Mode: 3 Core Pillars + Lab Button. In Pro Mode: 5 Arenas */}
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
            {focusMode ? (
              <>
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

                <button
                  onClick={() => handleArenaChange('power')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                    activeArena === 'power' || activeArena === 'matchups'
                      ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={activeArena === 'power' || activeArena === 'matchups' ? { color: currentTheme.primary } : {}}
                >
                  <Crown size={14} className={activeArena === 'power' || activeArena === 'matchups' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
                  <span>League</span>
                </button>

                <button
                  onClick={() => setIsLabModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shrink-0 shadow-sm"
                  title="Open Tactical Lab: Access all 17 advanced analytical modules"
                >
                  <FlaskConical size={14} />
                  <span>Lab (17)</span>
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Right side: Sub-View Controls + Experience Mode Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* Contextual Sub-View Controls */}
            {activeArena === 'command' && (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
                <button
                  onClick={() => setCommandSub('action')}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    commandSub === 'action' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={commandSub === 'action' ? { color: currentTheme.primary } : {}}
                >
                  <Target size={13} className="shrink-0" />
                  <span>Action Center</span>
                </button>
                <button
                  onClick={() => setCommandSub('roster')}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    commandSub === 'roster' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={commandSub === 'roster' ? { color: currentTheme.primary } : {}}
                >
                  <Crown size={13} className="shrink-0" />
                  <span>Roster Intel</span>
                </button>
                {!focusMode && (
                  <button
                    onClick={() => setCommandSub('diagnostics')}
                    className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                      commandSub === 'diagnostics' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    style={commandSub === 'diagnostics' ? { color: currentTheme.primary } : {}}
                  >
                    <Activity size={13} className="shrink-0" />
                    <span>Diagnostics</span>
                  </button>
                )}
              </div>
            )}

            {activeArena === 'trade' && (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
                <button
                  onClick={() => setTradeSub('architect')}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    tradeSub === 'architect' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={tradeSub === 'architect' ? { color: currentTheme.primary } : {}}
                >
                  <Briefcase size={13} className="shrink-0" />
                  <span>Architect</span>
                </button>
                <button
                  onClick={() => setTradeSub('partners')}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    tradeSub === 'partners' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={tradeSub === 'partners' ? { color: currentTheme.primary } : {}}
                >
                  <Users size={13} className="shrink-0" />
                  <span>Partners</span>
                </button>
                {!focusMode && (
                  <>
                    <button
                      onClick={() => setTradeSub('capital')}
                      className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                        tradeSub === 'capital' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={tradeSub === 'capital' ? { color: currentTheme.primary } : {}}
                    >
                      <Coins size={13} className="shrink-0" />
                      <span>Capital</span>
                    </button>
                    <button
                      onClick={() => setTradeSub('ledger')}
                      className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                        tradeSub === 'ledger' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={tradeSub === 'ledger' ? { color: currentTheme.primary } : {}}
                    >
                      <TrendingUp size={13} className="shrink-0" />
                      <span>Ledger</span>
                    </button>
                    <button
                      onClick={() => setTradeSub('autopsy')}
                      className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                        tradeSub === 'autopsy' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={tradeSub === 'autopsy' ? { color: currentTheme.primary } : {}}
                    >
                      <ArrowRightLeft size={13} className="shrink-0" />
                      <span>Autopsy</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {(activeArena === 'power' || (focusMode && activeArena === 'matchups')) && (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
                <button
                  onClick={() => {
                    handleArenaChange('power');
                    setPowerSub('tiers');
                  }}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    activeArena === 'power' && powerSub === 'tiers' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={activeArena === 'power' && powerSub === 'tiers' ? { color: currentTheme.primary } : {}}
                >
                  <Crown size={13} className="shrink-0" />
                  <span>Power Tiers</span>
                </button>
                <button
                  onClick={() => {
                    handleArenaChange('matchups');
                    setMatchupsSub('slate');
                  }}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    activeArena === 'matchups' && matchupsSub === 'slate' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={activeArena === 'matchups' && matchupsSub === 'slate' ? { color: currentTheme.primary } : {}}
                >
                  <CalendarDays size={13} className="shrink-0" />
                  <span>Matchups Slate</span>
                </button>
                {!focusMode && (
                  <>
                    <button
                      onClick={() => setPowerSub('matrix')}
                      className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                        powerSub === 'matrix' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={powerSub === 'matrix' ? { color: currentTheme.primary } : {}}
                    >
                      <Target size={13} className="shrink-0" />
                      <span>Matrix</span>
                    </button>
                    <button
                      onClick={() => setPowerSub('records')}
                      className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                        powerSub === 'records' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={powerSub === 'records' ? { color: currentTheme.primary } : {}}
                    >
                      <Trophy size={13} className="shrink-0" />
                      <span>Records</span>
                    </button>
                    <button
                      onClick={() => setPowerSub('bounties')}
                      className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                        powerSub === 'bounties' ? 'bg-emerald-500 text-zinc-950 font-black' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      <Coins size={13} className="shrink-0" />
                      <span>Bounties</span>
                    </button>
                    <button
                      onClick={() => setPowerSub('studio')}
                      className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                        powerSub === 'studio' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={powerSub === 'studio' ? { color: currentTheme.primary } : {}}
                    >
                      <Radio size={13} className="shrink-0" />
                      <span>Studio</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {!focusMode && activeArena === 'matchups' && (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
                <button
                  onClick={() => setMatchupsSub('slate')}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    matchupsSub === 'slate' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={matchupsSub === 'slate' ? { color: currentTheme.primary } : {}}
                >
                  <CalendarDays size={13} className="shrink-0" />
                  <span>Slate</span>
                </button>
                <button
                  onClick={() => setMatchupsSub('simulator')}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    matchupsSub === 'simulator' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={matchupsSub === 'simulator' ? { color: currentTheme.primary } : {}}
                >
                  <Swords size={13} className="shrink-0" />
                  <span>Simulator</span>
                </button>
                <button
                  onClick={() => setMatchupsSub('rivalries')}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    matchupsSub === 'rivalries' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={matchupsSub === 'rivalries' ? { color: currentTheme.primary } : {}}
                >
                  <Flame size={13} className="shrink-0" />
                  <span>Rivalries</span>
                </button>
                <button
                  onClick={() => setMatchupsSub('allplay')}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    matchupsSub === 'allplay' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={matchupsSub === 'allplay' ? { color: currentTheme.primary } : {}}
                >
                  <Layers size={13} className="shrink-0" />
                  <span>All-Play</span>
                </button>
              </div>
            )}

            {activeArena === 'players' && (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1 sm:p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
                <button
                  onClick={() => setPlayersSub('analyzer')}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    playersSub === 'analyzer' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={playersSub === 'analyzer' ? { color: currentTheme.primary } : {}}
                >
                  <Search size={13} className="shrink-0" />
                  <span>Analyzer</span>
                </button>
                <button
                  onClick={() => setPlayersSub('rookies')}
                  className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                    playersSub === 'rookies' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={playersSub === 'rookies' ? { color: currentTheme.primary } : {}}
                >
                  <GraduationCap size={13} className="shrink-0" />
                  <span>Rookies</span>
                </button>
                {!focusMode && (
                  <>
                    <button
                      onClick={() => setPlayersSub('database')}
                      className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                        playersSub === 'database' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={playersSub === 'database' ? { color: currentTheme.primary } : {}}
                    >
                      <Database size={13} className="shrink-0" />
                      <span>Database</span>
                    </button>
                    <button
                      onClick={() => setPlayersSub('leaders')}
                      className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                        playersSub === 'leaders' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={playersSub === 'leaders' ? { color: currentTheme.primary } : {}}
                    >
                      <Trophy size={13} className="shrink-0" />
                      <span>Leaders</span>
                    </button>
                    <button
                      onClick={() => setPlayersSub('crossref')}
                      className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 text-center ${
                        playersSub === 'crossref' || playersSub === 'compare' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={(playersSub === 'crossref' || playersSub === 'compare') ? { color: currentTheme.primary } : {}}
                    >
                      <Radar size={13} className="shrink-0" />
                      <span>Cross-Ref</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Experience Mode Toggle Pill */}
            <div className="flex items-center bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 shadow-inner shrink-0">
              <button
                onClick={() => toggleFocusMode(true)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                  focusMode 
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={focusMode ? { color: currentTheme.primary } : {}}
                title="Manager Focus Mode: Simplified essential workflows"
              >
                <Zap size={12} className={focusMode ? 'fill-current' : ''} />
                <span className="hidden sm:inline">Manager</span>
                <span className="sm:hidden">Focus</span>
              </button>
              <button
                onClick={() => toggleFocusMode(false)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                  !focusMode 
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={!focusMode ? { color: currentTheme.primary } : {}}
                title="Analyst Pro: All 23 tactical modules"
              >
                <Activity size={12} />
                <span>Pro (23)</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── ARENA CONTENT VIEWS ────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto pt-2 sm:pt-3.5 pb-28 md:pb-14 animate-in fade-in duration-300">
        {/* Subtle Manager Focus Mode Bar (Desktop & Tablet) */}
        {focusMode && (
          <div className="hidden sm:flex mb-3 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="inline-flex items-center gap-1 font-semibold text-zinc-200">
                <Zap size={13} className="text-amber-400" /> Manager Focus Mode
              </span>
              <span className="hidden md:inline text-zinc-600">|</span>
              <span className="hidden md:inline text-zinc-400">Essential views prioritized. Access all 17 advanced deep dives in the Tactical Lab anytime.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsLabModalOpen(true)}
                className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-colors shadow-sm"
              >
                <FlaskConical size={12} />
                <span>Open Lab (17)</span>
              </button>
              <button
                onClick={() => toggleFocusMode(false)}
                className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Switch to Pro →
              </button>
            </div>
          </div>
        )}

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

      {/* ── TACTICAL LAB MODAL (17 ADVANCED DEEP DIVES) ────────────────── */}
      {isLabModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLabModalOpen(false)}
        >
          <div 
            className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800/90 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <FlaskConical size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase font-mono">
                      Tactical Lab
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                      {filteredLabModules.length} Modules
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Quick-launch any deep analytical engine directly into your War Room.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLabModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                aria-label="Close Lab Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search / Filter bar */}
            <div className="p-3 sm:p-4 border-b border-zinc-800/60 bg-zinc-900/30 flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter tactical engines by name, category, or keyword..."
                  value={labSearchQuery}
                  onChange={(e) => setLabSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700/70 rounded-xl text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all font-mono"
                />
              </div>
              {labSearchQuery && (
                <button
                  onClick={() => setLabSearchQuery('')}
                  className="text-xs font-mono text-zinc-400 hover:text-zinc-200 px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Modules Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLabModules.map((module) => {
                const IconComponent = module.icon;
                const isCurrentlyActive = activeArena === module.arena && (
                  (module.arena === 'command' && commandSub === module.sub) ||
                  (module.arena === 'trade' && tradeSub === module.sub) ||
                  (module.arena === 'players' && playersSub === module.sub) ||
                  (module.arena === 'matchups' && matchupsSub === module.sub) ||
                  (module.arena === 'power' && powerSub === module.sub)
                );

                return (
                  <button
                    key={module.id}
                    onClick={() => jumpToModule(module.arena, module.sub)}
                    className={`group text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isCurrentlyActive
                        ? 'bg-zinc-800/90 border-amber-500/60 shadow-lg'
                        : 'bg-zinc-900/60 hover:bg-zinc-800/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 group-hover:text-amber-400 transition-colors">
                            <IconComponent size={15} />
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                            {module.category}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {module.badge}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {module.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-400 group-hover:text-zinc-200">
                      <span>Launch Engine</span>
                      <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-zinc-800/90 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
              <span className="font-mono text-[11px]">
                Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">K</kbd> anywhere for instant spotlight search.
              </span>
              <button
                onClick={() => {
                  toggleFocusMode(!focusMode);
                  setIsLabModalOpen(false);
                }}
                className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2"
              >
                {focusMode ? 'Switch permanently to Analyst Pro (All 23)' : 'Switch to Manager Focus Mode'}
              </button>
            </div>
          </div>
        </div>
      )}

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

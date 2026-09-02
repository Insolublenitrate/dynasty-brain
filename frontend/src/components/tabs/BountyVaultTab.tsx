"use client";

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Banknote, Trophy, Flame, ChevronDown, ChevronUp, 
  Coins, Crown, Target, Zap, ShieldCheck, Award, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';
import TacticalBriefingCard from '@/components/ui/TacticalBriefingCard';
import MetricExplainer from '@/components/ui/MetricExplainer';

// ── ERROR BOUNDARY FOR TAB RESILIENCE ────────────────────────────────────
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

class BountyTabErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("BountyVaultTab render error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-zinc-900/90 border border-red-500/30 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto my-12 backdrop-blur-xl shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-white font-sans">Bounty Vault Ledger Offline</h3>
          <p className="text-zinc-400 text-xs font-mono">
            An unexpected error occurred while parsing historical payout ledgers.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={14} />
            <span>Reload Bounty Vault</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function BountyVaultTabInner() {
  const { leagueId, leagueName } = useLeague();
  const { currentTheme } = useTheme();
  
  const [studioData, setStudioData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bountyView, setBountyView] = useState<'live' | 'all'>('live');
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [historySeasonFilter, setHistorySeasonFilter] = useState<string>('all');
  const [chartMode, setChartMode] = useState<'trend' | 'bar' | 'hall'>('trend');

  useEffect(() => {
    let isMounted = true;

    async function fetchStudio() {
      if (!leagueId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/weekly-studio/${leagueId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStudioData(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch bounty vault data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchStudio();
    return () => {
      isMounted = false;
    };
  }, [leagueId]);

  if (isLoading && !studioData) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }} />
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">
          Opening League Bounty Vault & Cash Ledger...
        </p>
      </div>
    );
  }

  // Raw Backend Data with safe fallbacks
  const rawBountyBoard = Array.isArray(studioData?.bounty_board) ? studioData.bounty_board : [];
  const rawWeeklyHistory = Array.isArray(studioData?.weekly_history) ? studioData.weekly_history : [];

  // Fallback demo data if league is brand new with zero history
  const bountyBoard = rawBountyBoard.length > 0 ? rawBountyBoard : [
    { roster_id: 1, name: "CeeDeez Nutz", cashWon: 660, totalCash: 660, breakdown: ["2025 Champion ($600)", "2025 Points Ldr ($60)"] },
    { roster_id: 2, name: "Run CMC & Hamstrings", cashWon: 200, totalCash: 200, breakdown: ["2025 Runner-Up ($200)"] },
    { roster_id: 3, name: "Puka Nacua Matata", cashWon: 40, totalCash: 40, breakdown: ["2025 Wk 4 High ($10)", "2025 Wk 8 High ($10)", "2025 Wk 12 High ($10)", "2025 Wk 14 High ($10)"] },
    { roster_id: 4, name: "Hot Chubb Time Machine", cashWon: 20, totalCash: 20, breakdown: ["2025 Wk 2 High ($10)", "2025 Wk 9 High ($10)"] },
    { roster_id: 5, name: "1st Round Pick Addicts", cashWon: 10, totalCash: 10, breakdown: ["2025 Wk 6 High ($10)"] },
    { roster_id: 6, name: "Waffle House Survivor", cashWon: 0, totalCash: 0, breakdown: [] }
  ];

  const weeklyHistory = rawWeeklyHistory.length > 0 ? rawWeeklyHistory : [
    { season: "2025", week: 1, roster_id: 1, owner: "CeeDeez Nutz", actual: 148.6, points: 148.6 },
    { season: "2025", week: 2, roster_id: 4, owner: "Hot Chubb Time Machine", actual: 154.2, points: 154.2 },
    { season: "2025", week: 3, roster_id: 2, owner: "Run CMC & Hamstrings", actual: 162.8, points: 162.8 },
    { season: "2025", week: 4, roster_id: 3, owner: "Puka Nacua Matata", actual: 171.4, points: 171.4 },
    { season: "2025", week: 5, roster_id: 1, owner: "CeeDeez Nutz", actual: 189.5, points: 189.5 },
    { season: "2025", week: 6, roster_id: 5, owner: "1st Round Pick Addicts", actual: 145.2, points: 145.2 },
    { season: "2025", week: 7, roster_id: 1, owner: "CeeDeez Nutz", actual: 204.8, points: 204.8 },
    { season: "2025", week: 8, roster_id: 3, owner: "Puka Nacua Matata", actual: 168.9, points: 168.9 }
  ];

  const seasonsAvailable: string[] = Array.from(new Set<string>((weeklyHistory || []).map((w: any) => String(w?.season || '')))).filter(Boolean).sort().reverse();
  const currentSeason: string = seasonsAvailable.length > 0 ? seasonsAvailable[0] : new Date().getFullYear().toString();

  // Format Bounties Safely
  const formattedBounties = bountyBoard.map((b: any) => {
    const rawBreakdown = Array.isArray(b?.breakdown) ? b.breakdown : [];
    const liveItems = rawBreakdown.filter((str: any) => typeof str === 'string' && str.startsWith(currentSeason));
    
    const parseCash = (arr: any[]) => arr.reduce((acc: number, item: any) => {
      if (typeof item !== 'string') return acc;
      const match = item.match(/\$(\d+)/);
      return acc + (match ? parseInt(match[1], 10) : 0);
    }, 0);

    const liveCash = parseCash(liveItems);
    const totalCash = typeof b?.cashWon === 'number' ? b.cashWon : (typeof b?.totalCash === 'number' ? b.totalCash : parseCash(rawBreakdown));

    return {
      roster_id: b?.roster_id || 1,
      name: b?.name || `Team ${b?.roster_id || 1}`,
      liveCash: Number(liveCash) || 0,
      totalCash: Number(totalCash) || 0,
      liveBreakdown: liveItems,
      allBreakdown: rawBreakdown
    };
  });

  const activeBounties = (bountyView === 'live'
    ? formattedBounties.filter((b: any) => b.liveCash > 0).sort((a: any, b: any) => b.liveCash - a.liveCash)
    : formattedBounties.sort((a: any, b: any) => b.totalCash - a.totalCash)
  );

  const displayList = activeBounties.length > 0 ? activeBounties : formattedBounties.sort((a: any, b: any) => b.totalCash - a.totalCash);
  const totalLeagueCashDisbursed = formattedBounties.reduce((sum: number, b: any) => sum + (Number(b.totalCash) || 0), 0);
  const maxEarnerCash = Math.max(...formattedBounties.map((b: any) => Number(b.totalCash) || 0), 1);

  // Top 10 All-Time High Scoring Single Weeks
  const top10Scores = [...weeklyHistory]
    .sort((a: any, b: any) => (Number(b?.points || b?.actual || 0)) - (Number(a?.points || a?.actual || 0)))
    .slice(0, 8);

  // Weekly History formatting for Chart
  const formattedHistory = weeklyHistory.map((w: any) => {
    const pts = Number(w?.points ?? w?.actual ?? 0);
    return {
      ...w,
      season: String(w?.season || currentSeason),
      week: Number(w?.week || 1),
      points: pts,
      owner: w?.owner || `Team ${w?.roster_id || 1}`,
      label: `${w?.season || currentSeason} W${w?.week || 1}`
    };
  });

  const filteredHistory = historySeasonFilter === 'all'
    ? formattedHistory
    : formattedHistory.filter((w: any) => w.season === historySeasonFilter);

  const formatXAxis = (tickItem: string) => {
    if (!tickItem || typeof tickItem !== 'string') return '';
    if (historySeasonFilter !== 'all') {
      const match = tickItem.match(/W(\d+)/);
      return match ? `W${match[1]}` : tickItem;
    }
    return tickItem.replace(/20(\d\d)\s*/, "'$1 ");
  };

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data) return null;
      const pts = Number(data.points || data.actual || 0);
      const isCentury = pts >= 200;
      return (
        <div className="bg-zinc-950/95 border border-zinc-700 p-3 rounded-2xl shadow-2xl backdrop-blur-md font-mono text-xs space-y-1 z-50">
          <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-400 border-b border-zinc-800 pb-1">
            <span>{data.season || currentSeason} · WEEK {data.week || 1}</span>
            {isCentury && <span className="text-amber-400 font-bold flex items-center gap-1">200+ PTS</span>}
          </div>
          <div className="text-white font-bold truncate text-sm">
            {data.owner || 'Franchise'}
          </div>
          <div className="flex items-baseline gap-1 text-emerald-400 font-black text-lg">
            <span>{pts.toFixed(1)}</span>
            <span className="text-[10px] text-zinc-400 font-normal">pts</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* ── TACTICAL BRIEFING GUIDE ─────────────────────────────────────────── */}
      <TacticalBriefingCard
        title="Bounty Vault: Weekly Cash Bounties & Season Side-Pots"
        subtitle="How to track side-pot payouts, weekly high-score earnings, and the Max PF crown"
        badge="SIDE-POT RULES & LEDGER"
        points={[
          {
            icon: Coins,
            label: "1. Weekly High-Score Pot",
            text: "Each week, the franchise with the single highest fantasy score in the league earns an automated cash bounty payout.",
            color: "#34d399"
          },
          {
            icon: Trophy,
            label: "2. Season Scoring Crowns",
            text: "End-of-season bonus pots are awarded to the regular season Max PF champion, divisional winners, and podium finishers.",
            color: "#fbbf24"
          },
          {
            icon: Zap,
            label: "3. The Tactical Play",
            text: "Even during a rebuild season, you can capture weekly cash bounties by streaming high-variance boom players in easy matchups.",
            color: "#38bdf8"
          }
        ]}
      />

      {/* ── STADIUM JUMBOTRON HEADER (MOBILE-OPTIMIZED) ─────────────────── */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900/90 to-amber-950/40 border border-emerald-500/30 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl card-bezel">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform rotate-12">
          <Trophy size={180} className="text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] sm:text-xs font-black uppercase flex items-center gap-1.5 shadow-sm">
                <Coins size={12} className="text-emerald-400" />
                HIGH-STAKES BOUNTY VAULT
              </span>
              <span className="text-[11px] sm:text-xs font-mono text-zinc-400 truncate max-w-[180px] sm:max-w-none">
                {leagueName || "Dynasty League"}
              </span>
              <MetricExplainer term="bounty_vault" size="xs" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight flex items-center gap-2 sm:gap-3 font-sans">
              <span>THE CASH ENDZONE</span>
            </h2>
            <p className="text-zinc-400 text-xs font-mono mt-1">
              Official ledger of weekly high score payouts, scoring crowns, and championship cash.
            </p>
          </div>

          {/* Cumulative Pot Card */}
          <div className="bg-zinc-950/90 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex items-center justify-between sm:justify-start gap-4 shadow-xl shrink-0 w-full lg:w-auto">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 sm:p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/40 shrink-0">
                <Banknote size={26} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] font-mono uppercase text-zinc-400 font-bold tracking-wider">Total Bounties Awarded</div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 leading-tight">
                  ${totalLeagueCashDisbursed.toLocaleString()}
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono text-zinc-500 mt-0.5">
                  Across {bountyBoard.length} Franchises
                </div>
              </div>
            </div>

            <div className="hidden sm:block text-right border-l border-zinc-800 pl-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Top Earner</span>
              <span className="text-xs font-bold text-amber-300 truncate block max-w-[120px]">
                {displayList[0]?.name || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Prize Pool Rules Ribbon */}
        <div className="mt-5 pt-3.5 border-t border-zinc-800/80">
          <div className="text-zinc-400 uppercase font-bold text-[9px] sm:text-[10px] font-mono mb-2">
            League Payout Schedule:
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex items-center justify-center gap-1 text-[11px]">
              1ST PLACE: $600
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300 font-bold flex items-center justify-center gap-1 text-[11px]">
              2ND PLACE: $200
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold flex items-center justify-center gap-1 text-[11px]">
              MAX PF CROWN: $60
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center gap-1 text-[11px]">
              WEEK HIGH: $10
            </span>
          </div>
        </div>
      </div>

      {/* ── FOOTBALL TURF PROGRESSION (VISUAL GRIDIRON FIELD) ────────────── */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md card-bezel">
        <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <Target size={18} style={{ color: currentTheme.primary }} />
            <h3 className="text-sm sm:text-lg font-black text-white uppercase tracking-wider font-mono">
              Gridiron Cash Race
            </h3>
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400">
            {bountyView === 'live' ? `Season ${currentSeason}` : 'All-Time'}
          </span>
        </div>

        {/* Visual Football Turf Field */}
        <div className="relative bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-emerald-950/90 rounded-2xl border-2 border-emerald-600/40 p-3 sm:p-4 shadow-inner overflow-hidden">
          
          {/* Yard Line Markers */}
          <div className="flex justify-between items-center text-[7.5px] sm:text-[9px] font-mono font-bold text-emerald-300/60 pb-2 border-b border-emerald-700/30 uppercase">
            <span>10</span>
            <span>20</span>
            <span>30</span>
            <span>40</span>
            <span className="text-emerald-300 font-black">50 (MID)</span>
            <span>40</span>
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span className="text-amber-400 font-black">ENDZONE</span>
          </div>

          {/* Teams Running Down the Gridiron */}
          <div className="space-y-2.5 sm:space-y-3 pt-3">
            {displayList.slice(0, 6).map((team: any, idx: number) => {
              const cash = Number(bountyView === 'live' ? team.liveCash : team.totalCash) || 0;
              const pct = maxEarnerCash > 0 ? Math.min(Math.max((cash / maxEarnerCash) * 100, 8), 100) : 10;

              return (
                <div key={team.roster_id || idx} className="relative space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-emerald-400 font-bold text-xs">#{idx + 1}</span>
                      <span className="font-bold text-white truncate max-w-[130px] sm:max-w-[220px] text-xs">{team.name}</span>
                    </div>
                    <span className="font-mono font-black text-emerald-300 text-xs">${cash}</span>
                  </div>

                  {/* Turf Run Line Bar */}
                  <div className="h-6 sm:h-5 bg-zinc-950/80 rounded-lg p-0.5 border border-emerald-800/40 relative overflow-hidden flex items-center shadow-inner">
                    <div 
                      className="h-full rounded-md bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 shadow-md transition-all duration-700 flex items-center justify-end pr-1.5"
                      style={{ width: `${pct}%` }}
                    >
                      <span className="text-[9px] font-mono font-black text-zinc-950 bg-white/80 px-1 rounded">›</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FRANCHISE BOUNTY LEDGER & HIGH SCORE JUMBOTRON ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Franchise Bounty Ledger */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col justify-between card-bezel">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <Banknote className="text-emerald-400" size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Franchise Bounty Ledger</h3>
                  <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold font-mono">
                    Official Earnings & Breakdown
                  </p>
                </div>
              </div>
              
              {/* Live vs All-Time Switcher */}
              <div className="grid grid-cols-2 w-full sm:w-auto bg-zinc-950 rounded-xl p-1 border border-zinc-800 shadow-inner">
                <button
                  onClick={() => setBountyView('live')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all text-center ${
                    bountyView === 'live' 
                      ? 'bg-emerald-500 text-zinc-950 shadow-md font-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  LIVE ({currentSeason})
                </button>
                <button
                  onClick={() => setBountyView('all')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all text-center ${
                    bountyView === 'all' 
                      ? 'bg-emerald-500 text-zinc-950 shadow-md font-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ALL-TIME
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {displayList.map((b: any, idx: number) => {
                const isExpanded = expandedTeam === b.roster_id;
                const displayCash = Number(bountyView === 'live' ? b.liveCash : b.totalCash) || 0;
                const displayBreakdown = Array.isArray(bountyView === 'live' ? b.liveBreakdown : b.allBreakdown)
                  ? (bountyView === 'live' ? b.liveBreakdown : b.allBreakdown)
                  : [];

                return (
                  <div 
                    key={b.roster_id || idx} 
                    className="bg-zinc-950/80 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-all overflow-hidden cursor-pointer"
                    onClick={() => setExpandedTeam(isExpanded ? null : b.roster_id)}
                  >
                    <div className="flex items-center justify-between p-3 sm:p-3.5">
                      <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                        <span className={`font-mono text-xs font-black w-6 sm:w-7 flex items-center justify-center shrink-0 rounded px-1.5 py-0.5 ${
                          idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : idx === 1 ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : idx === 2 ? 'bg-orange-950/40 text-orange-300 border border-orange-800/40' : 'text-zinc-500'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div className="overflow-hidden">
                          <p className="font-bold text-white text-xs sm:text-sm truncate">{b.name}</p>
                          <p className="text-zinc-500 text-[10px] sm:text-[11px] font-mono flex items-center gap-1">
                            <span className="text-emerald-400/90 font-semibold">{displayBreakdown.length} Bounties</span>
                            <span>•</span>
                            <span className="text-zinc-400">Tap to inspect</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                          ${displayCash}
                        </span>
                        {isExpanded ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-600" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 sm:px-4 pb-3 pt-1.5 border-t border-zinc-900 bg-zinc-950 flex flex-wrap gap-1.5 animate-in fade-in duration-200">
                        {displayBreakdown.length === 0 ? (
                          <span className="text-xs text-zinc-500 italic py-1">No individual itemized bounties recorded yet for this filter.</span>
                        ) : (
                          displayBreakdown.map((item: string, i: number) => (
                            <span 
                              key={i}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                typeof item === 'string' && item.includes("Champion") 
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : typeof item === 'string' && item.includes("Runner-Up")
                                  ? "bg-zinc-700/30 text-zinc-300 border-zinc-600/40"
                                  : typeof item === 'string' && item.includes("Points Ldr")
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              }`}
                            >
                              {item}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 text-[9px] sm:text-[10px] text-zinc-500 font-mono flex justify-between">
            <span>Bounties auto-calculated from regular season & playoff bracket sync.</span>
          </div>
        </div>

        {/* ── ALL-TIME SINGLE-GAME HIGH SCORE JUMBOTRON & VISUALIZER ──────── */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 card-bezel">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2.5 rounded-2xl border shrink-0" 
                  style={{ backgroundColor: `${currentTheme.primary}15`, borderColor: `${currentTheme.primary}30` }}
                >
                  <Flame size={20} style={{ color: currentTheme.primary }} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">The Century Club</h3>
                  <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold font-mono">Top Single-Game Explosions</p>
                </div>
              </div>

              {/* View Switchers (Trend vs Bar vs Hall) */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800 shadow-inner">
                  <button
                    onClick={() => setChartMode('trend')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      chartMode === 'trend' ? 'bg-zinc-800 text-emerald-400 shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Curve
                  </button>
                  <button
                    onClick={() => setChartMode('bar')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      chartMode === 'bar' ? 'bg-zinc-800 text-emerald-400 shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Bars
                  </button>
                  <button
                    onClick={() => setChartMode('hall')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      chartMode === 'hall' ? 'bg-zinc-800 text-emerald-400 shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Top 10
                  </button>
                </div>

                {/* Season Filter */}
                {seasonsAvailable.length > 1 && (
                  <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800 shadow-inner">
                    <button
                      onClick={() => setHistorySeasonFilter('all')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                        historySeasonFilter === 'all' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      ALL
                    </button>
                    {seasonsAvailable.map((s: string) => (
                      <button
                        key={s}
                        onClick={() => setHistorySeasonFilter(s)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                          historySeasonFilter === s ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Single Game Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {top10Scores.slice(0, 4).map((score: any, idx: number) => {
                const pts = Number(score?.points ?? score?.actual ?? 0);
                return (
                  <div 
                    key={idx}
                    className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-2.5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono font-bold text-zinc-500 uppercase">
                      <span>{score?.season || currentSeason} W{score?.week || 1}</span>
                      <span className="font-bold text-emerald-400">#{idx + 1}</span>
                    </div>
                    <div className="my-1">
                      <div className="text-base sm:text-lg font-black font-mono text-emerald-400 leading-tight">
                        {pts.toFixed(1)} pts
                      </div>
                      <div className="text-[11px] font-bold text-white truncate mt-0.5">
                        {score?.owner || 'Franchise'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── VISUAL CHART CONTAINER ─────────── */}
            {chartMode === 'hall' ? (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 font-mono text-xs">
                {top10Scores.map((score: any, idx: number) => {
                  const pts = Number(score?.points ?? score?.actual ?? 0);
                  return (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="font-bold text-zinc-500 w-5 text-center">#{idx + 1}</span>
                        <div className="overflow-hidden">
                          <p className="font-bold text-white text-xs truncate">{score?.owner || 'Franchise'}</p>
                          <p className="text-[10px] text-zinc-500">{score?.season || currentSeason} · Week {score?.week || 1}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-emerald-400 text-sm">
                          {pts.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-zinc-500 ml-1">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : chartMode === 'trend' ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#71717a" 
                      fontSize={10} 
                      tickFormatter={formatXAxis}
                      interval={filteredHistory.length > 12 ? Math.floor(filteredHistory.length / 5) : 0}
                    />
                    <YAxis stroke="#71717a" fontSize={10} domain={[0, 'auto']} />
                    <RechartsTooltip content={<CustomChartTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="points" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#scoreGlow)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#71717a" 
                      fontSize={10} 
                      tickFormatter={formatXAxis}
                      interval={filteredHistory.length > 12 ? Math.floor(filteredHistory.length / 5) : 0}
                    />
                    <YAxis stroke="#71717a" fontSize={10} domain={[0, 'auto']} />
                    <RechartsTooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="points" name="Weekly High" radius={[4, 4, 0, 0]}>
                      {filteredHistory.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.season === currentSeason ? '#10b981' : '#52525b'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>200+ PTS qualifies franchise for Century Club Hall of Fame.</span>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function BountyVaultTab() {
  return (
    <BountyTabErrorBoundary>
      <BountyVaultTabInner />
    </BountyTabErrorBoundary>
  );
}

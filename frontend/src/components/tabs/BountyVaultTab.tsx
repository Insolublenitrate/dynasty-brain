"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell
} from 'recharts';
import { 
  Banknote, Trophy, Flame, ChevronDown, ChevronUp, Sparkles, 
  Coins, ShieldCheck, Crown, Target, DollarSign, Award, Zap
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function BountyVaultTab() {
  const { leagueId, leagueName } = useLeague();
  const { currentTheme } = useTheme();
  
  const [studioData, setStudioData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bountyView, setBountyView] = useState<'live' | 'all'>('live');
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [historySeasonFilter, setHistorySeasonFilter] = useState<string>('all');

  useEffect(() => {
    if (!leagueId) return;

    async function fetchStudio() {
      setIsLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/weekly-studio/${leagueId}`);
        if (res.ok) {
          const data = await res.json();
          setStudioData(data);
        }
      } catch (err) {
        console.error("Failed to fetch bounty vault data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudio();
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

  const bountyBoard = studioData?.bounty_board || [];
  const weeklyHistory = studioData?.weekly_history || [];

  const seasonsAvailable: string[] = Array.from(new Set<string>((weeklyHistory || []).map((w: any) => String(w.season || '')))).filter(Boolean).sort().reverse();
  const currentSeason: string = seasonsAvailable.length > 0 ? seasonsAvailable[0] : new Date().getFullYear().toString();

  // Format Bounties
  const formattedBounties = bountyBoard.map((b: any) => {
    const liveItems = (b.breakdown || []).filter((str: string) => str.startsWith(currentSeason));
    const liveCash = liveItems.reduce((acc: number, str: string) => {
      const match = str.match(/\$(\d+)/);
      return acc + (match ? parseInt(match[1]) : 0);
    }, 0);
    const totalCash = b.cashWon || (b.breakdown || []).reduce((acc: number, str: string) => {
      const match = str.match(/\$(\d+)/);
      return acc + (match ? parseInt(match[1]) : 0);
    }, 0);

    return {
      ...b,
      liveCash,
      totalCash,
      liveBreakdown: liveItems,
      allBreakdown: b.breakdown || []
    };
  });

  const activeBounties = (bountyView === 'live'
    ? formattedBounties.filter((b: any) => b.liveCash > 0).sort((a: any, b: any) => b.liveCash - a.liveCash)
    : formattedBounties.sort((a: any, b: any) => b.totalCash - a.totalCash)
  );

  const displayList = activeBounties.length > 0 ? activeBounties : formattedBounties.sort((a: any, b: any) => b.totalCash - a.totalCash);

  const totalLeagueCashDisbursed = formattedBounties.reduce((sum: number, b: any) => sum + (b.totalCash || 0), 0);
  const maxEarnerCash = Math.max(...formattedBounties.map((b: any) => b.totalCash || 0), 1);

  // Top 10 All-Time High Scoring Single Weeks (Jumbotron Hall of Fame)
  const top10Scores = [...weeklyHistory]
    .sort((a: any, b: any) => (b.points || b.actual || 0) - (a.points || a.actual || 0))
    .slice(0, 8);

  // Weekly History formatting for Chart
  const formattedHistory = weeklyHistory.map((w: any) => ({
    ...w,
    points: typeof w.points === 'number' ? w.points : (typeof w.actual === 'number' ? w.actual : 0),
    label: `${w.season} W${w.week}`
  }));

  const filteredHistory = historySeasonFilter === 'all'
    ? formattedHistory
    : formattedHistory.filter((w: any) => w.season === historySeasonFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* ── STADIUM JUMBOTRON HEADER ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900/90 to-amber-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform rotate-12">
          <Trophy size={180} className="text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-black uppercase flex items-center gap-1.5 shadow-sm">
                <Coins size={13} className="text-emerald-400 animate-bounce" />
                HIGH-STAKES BOUNTY VAULT
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {leagueName || "Dynasty League"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight flex items-center gap-3 font-sans">
              <span>🏈 THE CASH ENDZONE</span>
            </h2>
            <p className="text-zinc-400 text-xs font-mono mt-1">
              Official ledger of weekly high score payouts, season scoring crowns, and championship cash.
            </p>
          </div>

          {/* Cumulative Pot Card */}
          <div className="bg-zinc-950/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xl shrink-0">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/40">
              <Banknote size={28} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold tracking-wider">Total Bounties Awarded</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                ${totalLeagueCashDisbursed.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Across {bountyBoard.length} Franchises
              </div>
            </div>
          </div>
        </div>

        {/* Prize Pool Rules Ribbon */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
          <span className="text-zinc-400 uppercase font-bold text-[10px]">Payout Grid:</span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
            🏆 1st: $600
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold flex items-center gap-1">
            🥈 2nd: $200
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold flex items-center gap-1">
            👑 Max Pts: $60
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1">
            ⚡ Weekly High: $10
          </span>
        </div>
      </div>

      {/* ── FOOTBALL TURF PROGRESSION (VISUAL GRIDIRON FIELD) ────────────── */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Target size={18} style={{ color: currentTheme.primary }} />
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
              Gridiron Cash Race
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {bountyView === 'live' ? `Season ${currentSeason} Payouts` : 'All-Time Bankroll'}
          </span>
        </div>

        {/* Visual Football Turf Field */}
        <div className="relative bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-emerald-950/90 rounded-2xl border-2 border-emerald-600/40 p-4 shadow-inner overflow-hidden">
          
          {/* Yard Line Markers */}
          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-emerald-300/60 pb-2 border-b border-emerald-700/30 uppercase">
            <span>OWN 10</span>
            <span>20</span>
            <span>30</span>
            <span>40</span>
            <span className="text-emerald-300 font-black">50 (MIDFIELD)</span>
            <span>40</span>
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span className="text-amber-400 font-black">💰 ENDZONE</span>
          </div>

          {/* Teams Running Down the Gridiron */}
          <div className="space-y-3 pt-3">
            {displayList.slice(0, 5).map((team: any, idx: number) => {
              const cash = bountyView === 'live' ? team.liveCash : team.totalCash;
              const pct = Math.min(Math.max((cash / maxEarnerCash) * 100, 8), 100);

              return (
                <div key={team.roster_id} className="relative space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">{idx === 0 ? '👑' : `#${idx + 1}`}</span>
                      <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">{team.name}</span>
                    </div>
                    <span className="font-mono font-black text-emerald-300">${cash}</span>
                  </div>

                  {/* Turf Run Line Bar */}
                  <div className="h-5 bg-zinc-950/70 rounded-lg p-0.5 border border-emerald-800/40 relative overflow-hidden flex items-center">
                    <div 
                      className="h-full rounded-md bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 shadow-lg transition-all duration-700 flex items-center justify-end pr-1.5"
                      style={{ width: `${pct}%` }}
                    >
                      <span className="text-[10px] select-none">🏈</span>
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
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
              <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800 shadow-inner">
                <button
                  onClick={() => setBountyView('live')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    bountyView === 'live' 
                      ? 'bg-emerald-500 text-zinc-950 shadow-md' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  LIVE ({currentSeason})
                </button>
                <button
                  onClick={() => setBountyView('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    bountyView === 'all' 
                      ? 'bg-emerald-500 text-zinc-950 shadow-md' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ALL-TIME
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {displayList.map((b: any, idx: number) => {
                const isExpanded = expandedTeam === b.roster_id;
                const displayCash = bountyView === 'live' ? b.liveCash : b.totalCash;
                const displayBreakdown = bountyView === 'live' ? b.liveBreakdown : b.allBreakdown;

                return (
                  <div 
                    key={b.roster_id} 
                    className="bg-zinc-950/80 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-all overflow-hidden cursor-pointer"
                    onClick={() => setExpandedTeam(isExpanded ? null : b.roster_id)}
                  >
                    <div className="flex items-center justify-between p-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-sm font-black w-6 flex items-center justify-center ${
                          idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-700' : 'text-zinc-500'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>
                        <div>
                          <p className="font-bold text-white text-sm">{b.name}</p>
                          <p className="text-zinc-500 text-[11px] font-mono flex items-center gap-1.5">
                            <span className="text-emerald-400/90 font-semibold">{displayBreakdown.length} Bounties</span>
                            <span>•</span>
                            <span className="text-zinc-400">Tap to inspect</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-emerald-400 text-base">
                          ${displayCash}
                        </span>
                        {isExpanded ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-600" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-3.5 pt-1.5 border-t border-zinc-900 bg-zinc-950 flex flex-wrap gap-1.5 animate-in fade-in duration-200">
                        {displayBreakdown.length === 0 ? (
                          <span className="text-xs text-zinc-500 italic py-1">No individual itemized bounties recorded yet for this filter.</span>
                        ) : (
                          displayBreakdown.map((item: string, i: number) => (
                            <span 
                              key={i}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                item.includes("Champion") 
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : item.includes("Runner-Up")
                                  ? "bg-zinc-700/30 text-zinc-300 border-zinc-600/40"
                                  : item.includes("Points Ldr")
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

          <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono flex justify-between">
            <span>Bounties auto-calculated from regular season & playoff bracket sync.</span>
          </div>
        </div>

        {/* All-Time Single-Game High Score Leaderboard & Chart */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2.5 rounded-2xl border" 
                  style={{ backgroundColor: `${currentTheme.primary}15`, borderColor: `${currentTheme.primary}30` }}
                >
                  <Flame size={20} style={{ color: currentTheme.primary }} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">The Century Club</h3>
                  <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold font-mono">Top Single-Game Explosions</p>
                </div>
              </div>

              {seasonsAvailable.length > 1 && (
                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800 shadow-inner">
                  <button
                    onClick={() => setHistorySeasonFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      historySeasonFilter === 'all' 
                        ? 'bg-zinc-800 text-white shadow' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    ALL
                  </button>
                  {seasonsAvailable.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setHistorySeasonFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        historySeasonFilter === s 
                          ? 'bg-zinc-800 text-white shadow' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Top 6 High Score Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
              {top10Scores.slice(0, 6).map((score: any, idx: number) => (
                <div 
                  key={idx}
                  className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">{score.season} W{score.week}</span>
                    <span className="text-xs">{idx === 0 ? '🔥🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⚡'}</span>
                  </div>
                  <div className="my-1.5">
                    <div className="text-base sm:text-lg font-black font-mono" style={{ color: currentTheme.primary }}>
                      {(score.points || score.actual || 0).toFixed(1)} pts
                    </div>
                    <div className="text-[11px] font-bold text-white truncate">
                      {score.owner}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progression Chart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#71717a" 
                    fontSize={9} 
                    interval={filteredHistory.length > 20 ? 3 : 1}
                  />
                  <YAxis stroke="#71717a" fontSize={9} domain={['auto', 'auto']} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} pts (${item.payload.owner})`,
                      'High Score'
                    ]}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}
                  />
                  <Bar dataKey="points" name="Weekly High" radius={[4, 4, 0, 0]}>
                    {filteredHistory.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.season === currentSeason ? currentTheme.primary : '#52525b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>Historical max scores across regular season match slates.</span>
          </div>
        </div>

      </div>

    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import { 
  Activity, Swords, Banknote, AlertTriangle, Zap, Flame, Trophy, ChevronDown, ChevronUp, Skull, ShieldAlert, Sparkles
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function StudioTab({ studioData: initialData }: { studioData?: any }) {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [studioData, setStudioData] = useState<any>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [bountyView, setBountyView] = useState<'live' | 'all'>('live');
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [historySeasonFilter, setHistorySeasonFilter] = useState<string>('all');

  useEffect(() => {
    if (initialData) {
      setStudioData(initialData);
      return;
    }
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
        console.error("Failed to fetch studio data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudio();
  }, [leagueId, initialData]);

  if (isLoading && !studioData) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">Broadcasting Studio Feeds...</p>
      </div>
    );
  }

  if (!studioData || studioData.error) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center shadow-xl">
        <Activity className="mx-auto mb-4 opacity-40" size={48} style={{ color: currentTheme.primary }} />
        <h3 className="text-xl font-bold text-white mb-2">No Broadcast Studio Data Available</h3>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          {studioData?.error || "Please verify league data is ingested into the Quant Engine database."}
        </p>
      </div>
    );
  }

  const { marquee_matchup, bounty_board, monday_autopsy, weekly_history } = studioData;
  
  const seasonsAvailable: string[] = Array.from(new Set<string>((weekly_history || []).map((w: any) => String(w.season || '')))).filter(Boolean).sort().reverse();
  const currentSeason: string = seasonsAvailable.length > 0 ? seasonsAvailable[0] : new Date().getFullYear().toString();
  
  // Weekly History formatting
  const formatted_history = (weekly_history || []).map((w: any) => ({
    ...w,
    points: typeof w.points === 'number' ? w.points : (typeof w.actual === 'number' ? w.actual : 0),
    expected: typeof w.expected === 'number' ? w.expected : 0,
    label: `${w.season} Wk ${w.week}`
  }));

  const filtered_history = historySeasonFilter === 'all'
    ? formatted_history
    : formatted_history.filter((w: any) => w.season === historySeasonFilter);

  // Bounty Board formatting
  const formatted_bounty = (bounty_board || []).map((b: any) => {
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

  const filtered_bounty = bountyView === 'live'
    ? formatted_bounty.filter((b: any) => b.liveCash > 0).sort((a: any, b: any) => b.liveCash - a.liveCash)
    : formatted_bounty.sort((a: any, b: any) => b.totalCash - a.totalCash);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      
      {/* Marquee Matchup Banner ("THE FRAUD CHECK") */}
      <div 
        className="bg-zinc-900/90 backdrop-blur-md border-l-4 p-6 rounded-2xl shadow-2xl relative overflow-hidden group border border-zinc-800"
        style={{ borderLeftColor: currentTheme.primary, boxShadow: `0 0 35px ${currentTheme.subtle}` }}
      >
        <div 
          className="absolute -top-10 -right-10 p-4 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none"
          style={{ color: currentTheme.primary }}
        >
          <Swords size={260} />
        </div>
        
        <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <Activity className="animate-pulse" size={18} style={{ color: currentTheme.primary }} />
            <h2 className="font-black tracking-[0.25em] text-xs uppercase" style={{ color: currentTheme.primary }}>
              {marquee_matchup?.title || "Marquee Matchup of the Week"}
            </h2>
          </div>
          <span className="px-2.5 py-1 bg-zinc-950/80 rounded-md text-[10px] font-mono uppercase text-zinc-400 border border-zinc-800">
            Season {marquee_matchup?.season || currentSeason} • Wk {marquee_matchup?.week || 1}
          </span>
        </div>

        <h3 className="text-3xl md:text-5xl font-black text-white italic mb-6 tracking-tight relative z-10 drop-shadow-lg flex items-center gap-3">
          <span>THE FRAUD CHECK</span>
          <span className="text-xs font-mono font-normal not-italic px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            High Stakes
          </span>
        </h3>
        
        <div className="flex flex-col md:flex-row items-center justify-between bg-zinc-950/90 p-6 rounded-xl border border-zinc-800/90 relative z-10 shadow-inner">
          <div className="text-center w-full md:w-1/3 mb-4 md:mb-0">
            <p className="text-zinc-400 font-mono text-xs mb-1 tracking-wider uppercase">Team Alpha</p>
            <p className="text-xl md:text-2xl font-black text-white">{marquee_matchup?.teamA?.name || 'Team 1'}</p>
            <p className="font-mono mt-2 text-base md:text-lg font-bold" style={{ color: currentTheme.primary }}>
              Output: {marquee_matchup?.teamA?.proj || 0} pts
            </p>
          </div>
          
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center my-4 md:my-0">
            <div className="text-3xl md:text-4xl font-black text-zinc-600 italic">VS</div>
            <div className="mt-3 px-4 py-1.5 bg-zinc-900 rounded-lg text-xs text-zinc-300 font-mono border border-zinc-800 shadow-inner flex items-center gap-2">
              <span>SPREAD:</span>
              <span className="font-bold" style={{ color: currentTheme.primary }}>{marquee_matchup?.spread || 0} PTS</span>
            </div>
          </div>
          
          <div className="text-center w-full md:w-1/3">
            <p className="text-zinc-400 font-mono text-xs mb-1 tracking-wider uppercase">Team Beta</p>
            <p className="text-xl md:text-2xl font-black text-white">{marquee_matchup?.teamB?.name || 'Team 2'}</p>
            <p className="font-mono mt-2 text-base md:text-lg font-bold" style={{ color: currentTheme.primary }}>
              Output: {marquee_matchup?.teamB?.proj || 0} pts
            </p>
          </div>
        </div>
      </div>

      {/* Monday Morning Autopsy & Heartbreak Clinic */}
      {monday_autopsy && (
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Skull className="text-rose-400" size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Monday Morning Autopsy</h3>
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded text-[10px] font-mono uppercase font-bold border border-rose-500/30">
                    Heartbreak Clinic
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Closest defeat & coaching miscalculations in {monday_autopsy.season} Week {monday_autopsy.week}
                </p>
              </div>
            </div>

            <div className="px-3.5 py-1.5 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs flex items-center gap-2 self-start md:self-auto">
              <span className="text-zinc-500 uppercase">Deficit:</span>
              <span className="font-black text-rose-400">-{monday_autopsy.margin} PTS</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Victim</p>
                <p className="text-lg font-black text-white mt-1">{monday_autopsy.victim}</p>
                <p className="text-xs text-zinc-400 mt-1">Score: <span className="font-mono font-bold text-zinc-200">{monday_autopsy.team_score || monday_autopsy.started?.points} pts</span></p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-zinc-500 italic">
                Toughest beat of the season
              </div>
            </div>

            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Opponent</p>
                <p className="text-lg font-black text-zinc-300 mt-1">{monday_autopsy.opponent || 'Opponent'}</p>
                <p className="text-xs text-zinc-400 mt-1">Score: <span className="font-mono font-bold text-zinc-200">{monday_autopsy.opponent_score || 'N/A'} pts</span></p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-emerald-400/90 font-mono font-semibold">
                Captured victory by {monday_autopsy.margin} pts
              </div>
            </div>

            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Quant Autopsy Take</p>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Lineup volatility cost this roster the win. Optimal bench swap threshold was within <strong className="text-rose-400">{monday_autopsy.margin} pts</strong>.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Bench Potential:</span>
                <span className="text-emerald-400 font-bold">+{monday_autopsy.benched?.points} pts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bounty Board & High Score Progression Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Cash Tracker / Bounty Board */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 relative shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <Banknote className="text-emerald-400" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">The Bounty Board</h3>
                  <p className="text-zinc-400 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">
                    Weekly Highs & Trophy Payouts
                  </p>
                </div>
              </div>
              
              <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800 shadow-inner">
                <button
                  onClick={() => setBountyView('live')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    bountyView === 'live' 
                      ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  LIVE ({currentSeason})
                </button>
                <button
                  onClick={() => setBountyView('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    bountyView === 'all' 
                      ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ALL TIME
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filtered_bounty.length === 0 ? (
                <p className="text-zinc-500 text-sm italic py-8 text-center">No bounties claimed for this season view.</p>
              ) : (
                filtered_bounty.map((b: any, idx: number) => {
                  const isExpanded = expandedTeam === b.roster_id;
                  const displayCash = bountyView === 'live' ? b.liveCash : b.totalCash;
                  const displayBreakdown = bountyView === 'live' ? b.liveBreakdown : b.allBreakdown;

                  return (
                    <div 
                      key={idx} 
                      className="bg-zinc-950/80 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-all overflow-hidden cursor-pointer"
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
                            <p className="text-zinc-500 text-[11px] font-mono flex items-center gap-1">
                              <span>{displayBreakdown.length} bounties</span>
                              <span>•</span>
                              <span className="text-zinc-400">Click to view items</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-emerald-400 text-base">
                            ${displayCash}
                          </span>
                          {isExpanded ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-600" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-3 pt-1 border-t border-zinc-900 bg-zinc-950/95 flex flex-wrap gap-1.5 animate-in fade-in duration-200">
                          {displayBreakdown.map((item: string, i: number) => (
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
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Prizes: 1st: $600 • 2nd: $200 • Max Pts: $60 • Weekly: $10</span>
          </div>
        </div>

        {/* Weekly High Score Progression Chart */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2.5 rounded-xl border" 
                  style={{ backgroundColor: `${currentTheme.primary}15`, borderColor: `${currentTheme.primary}30` }}
                >
                  <Flame size={22} style={{ color: currentTheme.primary }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Weekly High Score Progression</h3>
                  <p className="text-zinc-400 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">Max PF Output by Week</p>
                </div>
              </div>

              {seasonsAvailable.length > 1 && (
                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800 shadow-inner">
                  <button
                    onClick={() => setHistorySeasonFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
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

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filtered_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#71717a" 
                    fontSize={10} 
                    interval={filtered_history.length > 20 ? 2 : 0}
                  />
                  <YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} pts (${item.payload.owner})`,
                      'High Output'
                    ]}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}
                  />
                  <Bar dataKey="points" name="Weekly High Pts" radius={[4, 4, 0, 0]}>
                    {filtered_history.map((entry: any, index: number) => (
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

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Highlighted bars indicate current season ({currentSeason})</span>
            <span className="text-zinc-400 font-bold">Max: {Math.max(...filtered_history.map((h: any) => h.points || 0), 0)} pts</span>
          </div>
        </div>

      </div>

    </div>
  );
}

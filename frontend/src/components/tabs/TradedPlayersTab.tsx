"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, ArrowRightLeft, Activity, Award, 
  ShieldAlert, CheckCircle2, Search, Filter, Sparkles, Zap, ChevronRight, UserCheck
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function TradedPlayersTab() {
  const { leagueId, leagueName } = useLeague();
  const { currentTheme } = useTheme();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [trajectoryFilter, setTrajectoryFilter] = useState<'all' | 'surge' | 'dip' | 'qb' | 'rb' | 'wr' | 'te'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!leagueId) return;

    async function fetchTradedPlayerTrends() {
      setIsLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/traded-player-trends/${leagueId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch traded player trends:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTradedPlayerTrends();
  }, [leagueId]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }} />
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">
          Computing Traded Player Trajectories & ROI Audits...
        </p>
      </div>
    );
  }

  const tradedPlayers = Array.isArray(data?.traded_players) ? data.traded_players : [];
  const teamScorecards = Array.isArray(data?.team_scorecards) ? data.team_scorecards : [];
  const summary = data?.summary || {};

  // Filter players
  const filteredPlayers = tradedPlayers.filter((p: any) => {
    // Team Filter
    if (selectedTeamFilter !== 'all') {
      const rId = parseInt(selectedTeamFilter, 10);
      if (p.to_roster_id !== rId && p.from_roster_id !== rId) return false;
    }

    // Trajectory Filter
    if (trajectoryFilter === 'surge' && p.ppg_delta < 1.0) return false;
    if (trajectoryFilter === 'dip' && p.ppg_delta >= 0.0) return false;
    if (trajectoryFilter === 'qb' && p.position !== 'QB') return false;
    if (trajectoryFilter === 'rb' && p.position !== 'RB') return false;
    if (trajectoryFilter === 'wr' && p.position !== 'WR') return false;
    if (trajectoryFilter === 'te' && p.position !== 'TE') return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.player_name?.toLowerCase().includes(q);
      const matchTeam = p.to_team?.toLowerCase().includes(q) || p.from_team?.toLowerCase().includes(q);
      if (!matchName && !matchTeam) return false;
    }

    return true;
  });

  const selectedTeamScorecard = teamScorecards.find((t: any) => String(t.roster_id) === selectedTeamFilter);

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border border-zinc-700 p-2 rounded-xl shadow-xl font-mono text-xs">
          <div className="text-zinc-400 text-[10px]">{d.label}</div>
          <div className="text-emerald-400 font-bold">{Number(d.points).toFixed(1)} pts</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* ── HEADER SUMMARY JUMBOTRON ──────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teal-950/60 via-zinc-900/90 to-emerald-950/40 border border-teal-500/30 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl card-bezel">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform rotate-12">
          <ArrowRightLeft size={180} className="text-teal-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 font-mono text-[10px] sm:text-xs font-black uppercase flex items-center gap-1.5 shadow-sm">
                <Activity size={12} className="text-teal-400" />
                POST-TRADE PERFORMANCE TRACKER
              </span>
              <span className="text-[11px] sm:text-xs font-mono text-zinc-400 truncate max-w-[180px] sm:max-w-none">
                {leagueName || "Dynasty League"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight font-sans">
              TRADED PLAYER TRENDS & ROI
            </h2>
            <p className="text-zinc-400 text-xs font-mono mt-1 max-w-xl">
              Track how traded players have performed on their new franchises. Discover which managers consistently win transactions and extract fantasy surplus value.
            </p>
          </div>

          {/* Aggregate Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3.5 shadow-md">
              <span className="text-[9px] font-mono uppercase text-zinc-500 block font-bold">Total Traded Assets</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white leading-tight">
                {tradedPlayers.length}
              </span>
            </div>
            <div className="bg-zinc-950/90 border border-emerald-500/30 rounded-2xl p-3.5 shadow-md">
              <span className="text-[9px] font-mono uppercase text-emerald-400 block font-bold">Top Arbitrageur</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-300 truncate block mt-0.5 max-w-[120px]">
                {summary.top_trader || "N/A"}
              </span>
            </div>
            <div className="bg-zinc-950/90 border border-teal-500/30 rounded-2xl p-3.5 shadow-md col-span-2 sm:col-span-1">
              <span className="text-[9px] font-mono uppercase text-teal-400 block font-bold">Breakout Trade Asset</span>
              <span className="text-xs sm:text-sm font-bold text-teal-300 truncate block mt-0.5">
                {summary.biggest_winner_player || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FRANCHISE TRADE REPORT CARDS (HORIZONTAL SCROLL) ─────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={16} style={{ color: currentTheme.primary }} />
            <h3 className="text-xs sm:text-sm font-mono font-black text-white uppercase tracking-wider">
              Franchise Trade Report Cards
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            Tap a team to isolate their transaction ledger
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          <button
            onClick={() => setSelectedTeamFilter('all')}
            className={`p-3.5 rounded-2xl border transition-all text-left shrink-0 w-44 flex flex-col justify-between ${
              selectedTeamFilter === 'all'
                ? 'bg-zinc-900 border-teal-500/60 shadow-lg'
                : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold">League Overview</div>
              <div className="text-sm font-bold text-white mt-0.5">All Franchises</div>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] font-mono text-teal-400 font-bold">
              {tradedPlayers.length} Traded Players
            </div>
          </button>

          {teamScorecards.map((t: any) => {
            const isSelected = selectedTeamFilter === String(t.roster_id);
            const isPositive = t.net_points >= 0;

            return (
              <button
                key={t.roster_id}
                onClick={() => setSelectedTeamFilter(isSelected ? 'all' : String(t.roster_id))}
                className={`p-3.5 rounded-2xl border transition-all text-left shrink-0 w-52 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-zinc-900 border-teal-500 shadow-xl ring-1 ring-teal-500/50'
                    : 'bg-zinc-950/80 border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono font-bold text-zinc-400">
                      Grade: {t.grade}
                    </span>
                    <span className={`text-[9px] font-mono font-bold ${
                      t.badge === 'Shark Arbitrageur' ? 'text-teal-400' : isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {t.badge}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[170px]">
                    {t.name}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-end justify-between font-mono text-xs">
                  <div>
                    <span className="text-[8.5px] text-zinc-500 uppercase block">Net Trade PTS</span>
                    <span className={`font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? `+${t.net_points}` : t.net_points}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8.5px] text-zinc-500 uppercase block">Win Rate</span>
                    <span className="font-bold text-zinc-300">
                      {t.win_rate}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ISOLATED TEAM TRADE AUDIT CALLOUT (WHEN SELECTED) ───────────── */}
      {selectedTeamScorecard && (
        <div className="bg-zinc-900/90 border border-teal-500/40 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md card-bezel animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 font-mono text-[10px] font-bold uppercase border border-teal-500/30">
                  Franchise Trade Audit
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {selectedTeamScorecard.trades_count} Completed Trades
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white mt-1">
                {selectedTeamScorecard.name} Trade Ledger
              </h3>
            </div>

            <div className="flex items-center gap-4 bg-zinc-950/80 rounded-2xl p-3 border border-zinc-800">
              <div className="text-center px-2">
                <span className="text-[9px] font-mono uppercase text-zinc-500 block">Trade Win Rate</span>
                <span className="text-base sm:text-lg font-black font-mono text-teal-400">
                  {selectedTeamScorecard.win_rate}%
                </span>
              </div>
              <div className="h-8 w-[1px] bg-zinc-800" />
              <div className="text-center px-2">
                <span className="text-[9px] font-mono uppercase text-zinc-500 block">Net Points Delta</span>
                <span className={`text-base sm:text-lg font-black font-mono ${
                  selectedTeamScorecard.net_points >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {selectedTeamScorecard.net_points >= 0 ? `+${selectedTeamScorecard.net_points}` : selectedTeamScorecard.net_points}
                </span>
              </div>
              <div className="h-8 w-[1px] bg-zinc-800" />
              <div className="text-center px-2">
                <span className="text-[9px] font-mono uppercase text-zinc-500 block">Trade Grade</span>
                <span className="text-base sm:text-lg font-black font-mono text-amber-400">
                  {selectedTeamScorecard.grade}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER & SEARCH CONTROLS ───────────────────────────────────── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Trajectory Filter Buttons */}
        <div className="grid grid-cols-4 sm:flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setTrajectoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all text-center ${
              trajectoryFilter === 'all' ? 'bg-teal-500 text-zinc-950 font-black shadow' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All ({tradedPlayers.length})
          </button>
          <button
            onClick={() => setTrajectoryFilter('surge')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all text-center flex items-center justify-center gap-1 ${
              trajectoryFilter === 'surge' ? 'bg-emerald-500 text-zinc-950 font-black shadow' : 'bg-zinc-950 text-emerald-400 hover:text-white border border-zinc-800'
            }`}
          >
            <TrendingUp size={12} />
            <span>Surging</span>
          </button>
          <button
            onClick={() => setTrajectoryFilter('dip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all text-center flex items-center justify-center gap-1 ${
              trajectoryFilter === 'dip' ? 'bg-rose-500 text-white font-black shadow' : 'bg-zinc-950 text-rose-400 hover:text-white border border-zinc-800'
            }`}
          >
            <TrendingDown size={12} />
            <span>Regrets</span>
          </button>
          <button
            onClick={() => setTrajectoryFilter('rb')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all text-center ${
              trajectoryFilter === 'rb' ? 'bg-zinc-800 text-white font-black shadow' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            RBs
          </button>
          <button
            onClick={() => setTrajectoryFilter('wr')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all text-center ${
              trajectoryFilter === 'wr' ? 'bg-zinc-800 text-white font-black shadow' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            WRs
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search player or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* ── TRADED PLAYERS PERFORMANCE CARDS ───────────────────────────── */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-12 text-center shadow-xl">
          <ArrowRightLeft className="mx-auto mb-3 opacity-30 text-zinc-500" size={40} />
          <h4 className="text-lg font-bold text-white">No Matching Traded Players</h4>
          <p className="text-xs font-mono text-zinc-500 mt-1">Adjust your team or trajectory filter to view more trades.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPlayers.map((player: any, idx: number) => {
            const isSurging = player.ppg_delta >= 0;

            return (
              <div 
                key={player.player_id || idx}
                className="bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all backdrop-blur-md card-bezel space-y-4"
              >
                <div>
                  {/* Top Bar: Position Pill & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border uppercase ${
                        player.position === 'QB' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        player.position === 'RB' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        player.position === 'WR' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                        player.position === 'TE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}>
                        {player.position} · {player.nfl_team}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {player.trade_season} Week {player.trade_week} Trade
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border uppercase flex items-center gap-1 ${
                      isSurging 
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}>
                      {isSurging ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      <span>{player.status_badge}</span>
                    </span>
                  </div>

                  {/* Player Name & Headline Output */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight font-sans">
                        {player.player_name}
                      </h3>
                      <p className="text-zinc-400 text-xs font-mono mt-0.5">
                        {player.verdict}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 leading-tight">
                        {Number(player.total_pts_new_team).toFixed(1)}
                      </div>
                      <span className="text-[9px] font-mono uppercase text-zinc-500 block">
                        PTS on New Team
                      </span>
                    </div>
                  </div>

                  {/* Trade Exchange Path (From Team -> To Team) */}
                  <div className="bg-zinc-950/80 rounded-2xl p-3 border border-zinc-800/80 my-3 grid grid-cols-2 items-center gap-2 text-xs font-mono">
                    <div className="overflow-hidden">
                      <span className="text-[9px] text-zinc-500 uppercase block font-bold">Sent Away By</span>
                      <span className="font-bold text-zinc-300 truncate block">{player.from_team}</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 block">{player.pre_trade_ppg} PPG Before</span>
                    </div>
                    
                    <div className="text-right overflow-hidden border-l border-zinc-800 pl-2">
                      <span className="text-[9px] text-teal-400 uppercase block font-bold">Acquired By</span>
                      <span className="font-bold text-white truncate block">{player.to_team}</span>
                      <span className={`text-[10px] font-bold mt-0.5 block ${isSurging ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {player.post_trade_ppg} PPG ({isSurging ? `+${player.ppg_delta}` : player.ppg_delta})
                      </span>
                    </div>
                  </div>

                  {/* Post-Trade Scoring Trend (Mini Recharts Bar Graph) */}
                  {Array.isArray(player.weekly_scores) && player.weekly_scores.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>Post-Trade Scoring History:</span>
                        <span>{player.games_played || player.weekly_scores.length} Games Active</span>
                      </div>
                      <div className="h-16 w-full bg-zinc-950/50 rounded-xl p-1 border border-zinc-800/50">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={player.weekly_scores} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <XAxis dataKey="label" stroke="#52525b" fontSize={8} />
                            <YAxis hide domain={[0, 'auto']} />
                            <RechartsTooltip content={<CustomChartTooltip />} />
                            <Bar dataKey="points" radius={[2, 2, 0, 0]}>
                              {player.weekly_scores.map((entry: any, i: number) => (
                                <Cell 
                                  key={`cell-${i}`} 
                                  fill={Number(entry.points) >= player.pre_trade_ppg ? '#10b981' : '#f43f5e'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                </div>

                <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>Net Fantasy Value Impact:</span>
                  <span className={`font-bold ${isSurging ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isSurging ? `+${player.ppg_delta} PPG Surplus` : `${player.ppg_delta} PPG Deficit`}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

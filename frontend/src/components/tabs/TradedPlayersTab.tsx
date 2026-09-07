"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, ArrowRightLeft, Activity, Award, 
  ShieldAlert, CheckCircle2, Search, Filter, Sparkles, Zap, 
  ChevronRight, UserCheck, Ticket, Star, Calendar, Clock, 
  ArrowRight, Layers, FileText, BarChart3, User
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

interface TradedPlayersTabProps {
  onSelectTradeForAutopsy?: (tradeId: string) => void;
}

export default function TradedPlayersTab({ onSelectTradeForAutopsy }: TradedPlayersTabProps) {
  const { leagueId, leagueName, myRosterId } = useLeague();
  const { currentTheme } = useTheme();

  // Data states
  const [trendsData, setTrendsData] = useState<any>(null);
  const [tradesList, setTradesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation & View Mode: 'feed' | 'trajectory' | 'scorecards'
  const [activeView, setActiveView] = useState<'feed' | 'trajectory' | 'scorecards'>('feed');

  // Filters
  const [teamFilter, setTeamFilter] = useState<string>('all'); // 'all', 'my_team', or specific roster_id string
  const [trajectoryFilter, setTrajectoryFilter] = useState<'all' | 'surge' | 'dip' | 'qb' | 'rb' | 'wr' | 'te'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!leagueId) return;

    async function loadLedgerData() {
      setIsLoading(true);
      try {
        const apiUrl = getApiUrl();
        const [trendsRes, tradesRes] = await Promise.all([
          fetch(`${apiUrl}/api/quant/traded-player-trends/${leagueId}`),
          fetch(`${apiUrl}/api/quant/trades/${leagueId}`)
        ]);

        if (trendsRes.ok) {
          const tJson = await trendsRes.json();
          setTrendsData(tJson);
        }

        if (tradesRes.ok) {
          const tradesJson = await tradesRes.json();
          if (Array.isArray(tradesJson)) {
            setTradesList(tradesJson);
          }
        }
      } catch (err) {
        console.error("Failed to fetch trade ledger data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLedgerData();
  }, [leagueId]);

  const tradedPlayers = Array.isArray(trendsData?.traded_players) ? trendsData.traded_players : [];
  const teamScorecards = Array.isArray(trendsData?.team_scorecards) ? trendsData.team_scorecards : [];
  const summary = trendsData?.summary || {};

  // Count user trades
  const myTradesCount = tradesList.filter((t: any) => {
    if (!myRosterId) return false;
    const teamA = t.team_a?.roster_id;
    const teamB = t.team_b?.roster_id;
    const allIds = Array.isArray(t.all_roster_ids) ? t.all_roster_ids : [];
    return teamA === myRosterId || teamB === myRosterId || allIds.includes(myRosterId);
  }).length;

  // Filtered Completed Trades Feed
  const filteredTrades = tradesList.filter((trade: any) => {
    // Team filter
    if (teamFilter === 'my_team') {
      if (!myRosterId) return true;
      const allIds = Array.isArray(trade.all_roster_ids) ? trade.all_roster_ids : [trade.team_a?.roster_id, trade.team_b?.roster_id];
      if (!allIds.includes(myRosterId)) return false;
    } else if (teamFilter !== 'all') {
      const targetId = parseInt(teamFilter, 10);
      const allIds = Array.isArray(trade.all_roster_ids) ? trade.all_roster_ids : [trade.team_a?.roster_id, trade.team_b?.roster_id];
      if (!allIds.includes(targetId)) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const teamAName = trade.team_a?.name?.toLowerCase() || '';
      const teamBName = trade.team_b?.name?.toLowerCase() || '';
      const assetsA = (trade.team_a?.received || trade.team_a?.received_assets || []).map((a: any) => a.name?.toLowerCase()).join(' ');
      const assetsB = (trade.team_b?.received || trade.team_b?.received_assets || []).map((a: any) => a.name?.toLowerCase()).join(' ');
      
      const matchesSearch = teamAName.includes(q) || teamBName.includes(q) || assetsA.includes(q) || assetsB.includes(q);
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Filtered Player Trajectory list
  const filteredPlayers = tradedPlayers.filter((p: any) => {
    // Team Filter
    if (teamFilter === 'my_team') {
      if (myRosterId && p.to_roster_id !== myRosterId && p.from_roster_id !== myRosterId) return false;
    } else if (teamFilter !== 'all') {
      const rId = parseInt(teamFilter, 10);
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

  // Filtered Scorecards
  const filteredScorecards = teamScorecards.filter((t: any) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name?.toLowerCase().includes(q) || t.owner_name?.toLowerCase().includes(q);
    }
    return true;
  });

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

  if (isLoading && !trendsData && tradesList.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }} />
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">
          Loading Dynasty Trade Ledger & Performance Audits...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* ── HEADER JUMBOTRON ──────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teal-950/50 via-zinc-900/90 to-emerald-950/40 border border-teal-500/30 rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform rotate-12">
          <ArrowRightLeft size={160} className="text-teal-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 font-mono text-[10px] sm:text-xs font-black uppercase flex items-center gap-1.5 shadow-sm">
                <Activity size={12} className="text-teal-400" />
                HISTORICAL TRANSACTIONS ARCHIVE
              </span>
              <span className="text-[11px] sm:text-xs font-mono text-zinc-400">
                {leagueName || "Dynasty League"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white italic tracking-tight font-sans">
              DYNASTY TRADE LEDGER
            </h2>
            <p className="text-zinc-400 text-xs font-mono mt-1 max-w-xl">
              Chronological feed of bilateral trades, post-trade asset trajectories, and manager scorecards.
            </p>
          </div>

          {/* Aggregate Stat Pills */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3 shadow-md text-center">
              <span className="text-[9px] font-mono uppercase text-zinc-500 block font-bold">Total Deals</span>
              <span className="text-lg sm:text-xl font-black font-mono text-white leading-tight">
                {tradesList.length > 0 ? tradesList.length : tradedPlayers.length}
              </span>
            </div>
            <div className="bg-zinc-950/90 border border-emerald-500/30 rounded-2xl p-3 shadow-md text-center">
              <span className="text-[9px] font-mono uppercase text-emerald-400 block font-bold">Top Arbitrageur</span>
              <span className="text-xs font-bold text-emerald-300 truncate block mt-0.5 max-w-[100px] mx-auto">
                {summary.top_trader || "N/A"}
              </span>
            </div>
            <div className="bg-zinc-950/90 border border-teal-500/30 rounded-2xl p-3 shadow-md text-center">
              <span className="text-[9px] font-mono uppercase text-teal-400 block font-bold">Breakout Player</span>
              <span className="text-xs font-bold text-teal-300 truncate block mt-0.5 max-w-[100px] mx-auto">
                {summary.biggest_winner_player || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── VIEW SWITCHER & FILTERS COMMAND BAR ────────────────────── */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveView('feed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
              activeView === 'feed'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            style={activeView === 'feed' ? { color: currentTheme.primary } : {}}
          >
            <FileText size={13} />
            <span>Completed Deals Feed</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-zinc-900 rounded-full text-zinc-400 font-mono">
              {tradesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('trajectory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
              activeView === 'trajectory'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            style={activeView === 'trajectory' ? { color: currentTheme.primary } : {}}
          >
            <TrendingUp size={13} />
            <span>Player Post-Trade ROI</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-zinc-900 rounded-full text-zinc-400 font-mono">
              {tradedPlayers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('scorecards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
              activeView === 'scorecards'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            style={activeView === 'scorecards' ? { color: currentTheme.primary } : {}}
          >
            <Award size={13} />
            <span>Manager Report Cards</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-zinc-900 rounded-full text-zinc-400 font-mono">
              {teamScorecards.length}
            </span>
          </button>
        </div>

        {/* Right Side Controls: Franchise Quick-Filter + Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          
          {/* 1-Click "My Franchise Deals" vs "All" */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setTeamFilter('all')}
              className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                teamFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All League
            </button>

            {myRosterId && (
              <button
                onClick={() => setTeamFilter(teamFilter === 'my_team' ? 'all' : 'my_team')}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 ${
                  teamFilter === 'my_team'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Star size={11} className={teamFilter === 'my_team' ? 'text-emerald-400 fill-emerald-400' : 'text-zinc-500'} />
                <span>My Deals ({myTradesCount})</span>
              </button>
            )}

            {/* Franchise Selector Dropdown */}
            {teamScorecards.length > 0 && (
              <select
                value={teamFilter === 'all' || teamFilter === 'my_team' ? '' : teamFilter}
                onChange={(e) => setTeamFilter(e.target.value || 'all')}
                className="bg-transparent text-zinc-300 text-xs font-mono font-bold px-2 py-1 focus:outline-none cursor-pointer border-l border-zinc-800"
              >
                <option value="" className="bg-zinc-900 text-zinc-400">Filter Team...</option>
                {teamScorecards.map((t: any) => (
                  <option key={t.roster_id} value={String(t.roster_id)} className="bg-zinc-900 text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-52 shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder={
                activeView === 'feed' 
                  ? "Search deals..." 
                  : activeView === 'trajectory' 
                  ? "Search player..." 
                  : "Search manager..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
            />
          </div>

        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── VIEW 1: COMPLETED DEALS FEED (NATURAL TRANSACTION LOG) ──── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeView === 'feed' && (
        <div className="space-y-4">
          {/* Active Filter Indicator */}
          {teamFilter !== 'all' && (
            <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-mono">
              <span className="text-zinc-400">
                Filtered to: <strong className="text-white">
                  {teamFilter === 'my_team' ? 'My Franchise Deals' : teamScorecards.find((t: any) => String(t.roster_id) === teamFilter)?.name || `Roster ${teamFilter}`}
                </strong> ({filteredTrades.length} trades)
              </span>
              <button
                onClick={() => setTeamFilter('all')}
                className="text-zinc-400 hover:text-white underline text-[11px]"
              >
                Clear filter
              </button>
            </div>
          )}

          {filteredTrades.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center shadow-xl">
              <ArrowRightLeft className="mx-auto mb-3 opacity-30 text-zinc-500" size={40} />
              <h4 className="text-base font-bold text-white">No Completed Deals Found</h4>
              <p className="text-xs font-mono text-zinc-500 mt-1">Try clearing your team filter or search terms.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredTrades.map((trade: any, idx: number) => {
                const isUserDeal = myRosterId && (
                  trade.team_a?.roster_id === myRosterId || 
                  trade.team_b?.roster_id === myRosterId ||
                  (Array.isArray(trade.all_roster_ids) && trade.all_roster_ids.includes(myRosterId))
                );

                const teamAReceived = trade.team_a?.received_assets || trade.team_a?.received || [];
                const teamBReceived = trade.team_b?.received_assets || trade.team_b?.received || [];

                return (
                  <div
                    key={trade.transaction_id || idx}
                    className={`bg-zinc-900/90 border rounded-3xl p-4 sm:p-5 shadow-xl transition-all backdrop-blur-md flex flex-col justify-between ${
                      isUserDeal 
                        ? 'border-emerald-500/40 hover:border-emerald-500/60 bg-gradient-to-r from-emerald-950/15 via-zinc-900/90 to-zinc-900/90' 
                        : 'border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    {/* Top Deal Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 font-bold flex items-center gap-1">
                          <Calendar size={11} className="text-zinc-500" />
                          <span>{trade.date || 'Past Season'}</span>
                        </span>
                        {trade.season && (
                          <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                            {trade.season} · Wk {trade.week || 1}
                          </span>
                        )}
                        {isUserDeal && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                            <Star size={10} className="fill-emerald-400" />
                            <span>Your Deal</span>
                          </span>
                        )}
                      </div>

                      {/* Run Autopsy Link */}
                      <button
                        onClick={() => {
                          if (onSelectTradeForAutopsy) {
                            onSelectTradeForAutopsy(trade.transaction_id);
                          } else {
                            window.location.href = `/dynasty-room?arena=trade&sub=autopsy&trade_id=${trade.transaction_id}`;
                          }
                        }}
                        className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 border border-zinc-700 hover:border-zinc-600 shadow-sm group"
                        style={{ color: currentTheme.primary }}
                      >
                        <span>Quant Autopsy</span>
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    {/* Bilateral Trade Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-3.5 items-stretch">
                      
                      {/* Side A */}
                      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-800/60">
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xs text-white shrink-0">
                                {trade.team_a?.name ? trade.team_a.name.slice(0, 2).toUpperCase() : `R${trade.team_a?.roster_id}`}
                              </div>
                              <div className="truncate">
                                <span className="text-xs sm:text-sm font-bold text-white truncate block">
                                  {trade.team_a?.name || `Roster ${trade.team_a?.roster_id}`}
                                </span>
                                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block">
                                  Acquired Assets
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 font-bold shrink-0">
                              {teamAReceived.length} Asset{teamAReceived.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {teamAReceived.length === 0 ? (
                              <span className="text-[11px] font-mono text-zinc-500 italic">No assets listed</span>
                            ) : (
                              teamAReceived.map((asset: any, aIdx: number) => (
                                <div 
                                  key={aIdx} 
                                  className="flex items-center justify-between bg-zinc-900/90 px-2.5 py-1.5 rounded-xl border border-zinc-800/70 text-xs font-mono"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {asset.type === 'draft_pick' || asset.type === 'pick' || asset.position === 'PICK' ? (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[9px] shrink-0 flex items-center gap-1">
                                        <Ticket size={9} />
                                        <span>PICK</span>
                                      </span>
                                    ) : (
                                      <span className={`px-1.5 py-0.5 rounded font-black text-[9px] border shrink-0 ${
                                        asset.position === 'QB' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                        asset.position === 'RB' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                        asset.position === 'WR' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                                        asset.position === 'TE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                        'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                      }`}>
                                        {asset.position || 'FLEX'}
                                      </span>
                                    )}
                                    <span className="font-bold text-zinc-200 truncate">
                                      {asset.name}
                                    </span>
                                  </div>
                                  {asset.team && (
                                    <span className="text-[10px] text-zinc-500 shrink-0 font-bold">
                                      {asset.team}
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Side B */}
                      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-800/60">
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xs text-white shrink-0">
                                {trade.team_b?.name ? trade.team_b.name.slice(0, 2).toUpperCase() : `R${trade.team_b?.roster_id}`}
                              </div>
                              <div className="truncate">
                                <span className="text-xs sm:text-sm font-bold text-white truncate block">
                                  {trade.team_b?.name || `Roster ${trade.team_b?.roster_id}`}
                                </span>
                                <span className="text-[9px] font-mono text-teal-400 font-bold uppercase block">
                                  Acquired Assets
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 font-bold shrink-0">
                              {teamBReceived.length} Asset{teamBReceived.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {teamBReceived.length === 0 ? (
                              <span className="text-[11px] font-mono text-zinc-500 italic">No assets listed</span>
                            ) : (
                              teamBReceived.map((asset: any, bIdx: number) => (
                                <div 
                                  key={bIdx} 
                                  className="flex items-center justify-between bg-zinc-900/90 px-2.5 py-1.5 rounded-xl border border-zinc-800/70 text-xs font-mono"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {asset.type === 'draft_pick' || asset.type === 'pick' || asset.position === 'PICK' ? (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[9px] shrink-0 flex items-center gap-1">
                                        <Ticket size={9} />
                                        <span>PICK</span>
                                      </span>
                                    ) : (
                                      <span className={`px-1.5 py-0.5 rounded font-black text-[9px] border shrink-0 ${
                                        asset.position === 'QB' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                        asset.position === 'RB' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                        asset.position === 'WR' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                                        asset.position === 'TE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                        'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                      }`}>
                                        {asset.position || 'FLEX'}
                                      </span>
                                    )}
                                    <span className="font-bold text-zinc-200 truncate">
                                      {asset.name}
                                    </span>
                                  </div>
                                  {asset.team && (
                                    <span className="text-[10px] text-zinc-500 shrink-0 font-bold">
                                      {asset.team}
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Status Footnote */}
                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Transaction ID: {trade.transaction_id}</span>
                      <span className="text-zinc-400 font-bold uppercase">{trade.status || 'Complete'}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── VIEW 2: PLAYER POST-TRADE TRAJECTORY (ROI AUDIT) ───────── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeView === 'trajectory' && (
        <div className="space-y-4">
          
          {/* Trajectory Filter Pills */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <Filter size={12} style={{ color: currentTheme.primary }} /> Status:
            </span>
            {[
              { id: 'all', label: `All (${tradedPlayers.length})` },
              { id: 'surge', label: 'Surging Only', icon: TrendingUp, color: 'text-emerald-400' },
              { id: 'dip', label: 'Regrets Only', icon: TrendingDown, color: 'text-rose-400' },
              { id: 'qb', label: 'QBs' },
              { id: 'rb', label: 'RBs' },
              { id: 'wr', label: 'WRs' },
              { id: 'te', label: 'TEs' },
            ].map(f => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setTrajectoryFilter(f.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1 ${
                    trajectoryFilter === f.id 
                      ? 'bg-zinc-800 text-white shadow border border-zinc-700' 
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                  style={trajectoryFilter === f.id ? { color: currentTheme.primary } : {}}
                >
                  {Icon && <Icon size={11} className={f.color || ''} />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center shadow-xl">
              <Activity className="mx-auto mb-3 opacity-30 text-zinc-500" size={40} />
              <h4 className="text-base font-bold text-white">No Matching Traded Players</h4>
              <p className="text-xs font-mono text-zinc-500 mt-1">Adjust your filters to display player performance.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlayers.map((player: any, idx: number) => {
                const isSurging = player.ppg_delta >= 0;

                return (
                  <div 
                    key={player.player_id || idx}
                    className="bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all backdrop-blur-md space-y-3.5"
                  >
                    <div>
                      {/* Top Bar: Position Pill & Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
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
                            {player.trade_season} Wk {player.trade_week}
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
                          <h3 className="text-lg font-black text-white tracking-tight font-sans">
                            {player.player_name}
                          </h3>
                          <p className="text-zinc-400 text-xs font-mono mt-0.5">
                            {player.verdict}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-lg sm:text-xl font-black font-mono text-emerald-400 leading-tight">
                            {Number(player.total_pts_new_team).toFixed(1)}
                          </div>
                          <span className="text-[9px] font-mono uppercase text-zinc-500 block font-bold">
                            PTS on New Team
                          </span>
                        </div>
                      </div>

                      {/* Trade Exchange Path */}
                      <div className="bg-zinc-950/80 rounded-2xl p-2.5 border border-zinc-800/80 my-3 grid grid-cols-2 items-center gap-2 text-xs font-mono">
                        <div className="overflow-hidden">
                          <span className="text-[9px] text-zinc-500 uppercase block font-bold">Sent Away By</span>
                          <span className="font-bold text-zinc-300 truncate block">{player.from_team}</span>
                          <span className="text-[10px] text-zinc-500 mt-0.5 block">{player.pre_trade_ppg} PPG Prior</span>
                        </div>
                        
                        <div className="text-right overflow-hidden border-l border-zinc-800 pl-2">
                          <span className="text-[9px] text-teal-400 uppercase block font-bold">Acquired By</span>
                          <span className="font-bold text-white truncate block">{player.to_team}</span>
                          <span className={`text-[10px] font-bold mt-0.5 block ${isSurging ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {player.post_trade_ppg} PPG ({isSurging ? `+${player.ppg_delta}` : player.ppg_delta})
                          </span>
                        </div>
                      </div>

                      {/* Scoring Bar Graph */}
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

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Net Impact:</span>
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
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── VIEW 3: MANAGER REPORT CARDS (RESPONSIVE SCORECARD GRID) ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeView === 'scorecards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-zinc-400">
              Franchise trade grades based on post-deal fantasy points surplus, trade volume, and win percentage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredScorecards.map((t: any) => {
              const isPositive = t.net_points >= 0;
              const isMyRoster = myRosterId && t.roster_id === myRosterId;

              return (
                <div
                  key={t.roster_id}
                  className={`bg-zinc-900/90 border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all backdrop-blur-md ${
                    isMyRoster 
                      ? 'border-emerald-500/50 ring-1 ring-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-zinc-900/90' 
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    {/* Header: Grade & Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono font-black text-amber-400 shadow-inner">
                        Grade {t.grade}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase truncate max-w-[130px] ${
                        t.badge === 'Shark Arbitrageur' ? 'text-teal-400' : isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {t.badge}
                      </span>
                    </div>

                    {/* Team Name */}
                    <div className="mt-1">
                      <h4 className="text-sm sm:text-base font-black text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{t.name}</span>
                        {isMyRoster && (
                          <Star size={12} className="text-emerald-400 fill-emerald-400 shrink-0" />
                        )}
                      </h4>
                      <p className="text-[11px] text-zinc-500 font-mono truncate">
                        {t.owner_name ? `@${t.owner_name}` : `Roster ${t.roster_id}`}
                      </p>
                    </div>

                    {/* Metrics Strip */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-800/80 font-mono text-xs">
                      <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/60">
                        <span className="text-[9px] text-zinc-500 uppercase block font-bold">Net Trade PTS</span>
                        <span className={`text-sm font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? `+${t.net_points}` : t.net_points}
                        </span>
                      </div>
                      <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/60">
                        <span className="text-[9px] text-zinc-500 uppercase block font-bold">Win Rate</span>
                        <span className="text-sm font-black text-white">
                          {t.win_rate}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: View in Feed */}
                  <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {t.trades_count} deal{t.trades_count !== 1 ? 's' : ''} logged
                    </span>
                    <button
                      onClick={() => {
                        setTeamFilter(String(t.roster_id));
                        setActiveView('feed');
                      }}
                      className="text-xs font-mono font-bold text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
                      style={{ color: currentTheme.primary }}
                    >
                      <span>View Deals</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}


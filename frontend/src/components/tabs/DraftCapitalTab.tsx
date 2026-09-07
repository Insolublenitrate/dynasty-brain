"use client";

import React, { useState, useEffect } from 'react';
import { 
  Coins, Sparkles, TrendingUp, ShieldAlert, ShieldCheck, 
  ArrowRight, Filter, Search, Award, Info, AlertTriangle, 
  Layers, CheckCircle2, ChevronRight, Zap, Target
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';
import TacticalBriefingCard from '@/components/ui/TacticalBriefingCard';
import MetricExplainer from '@/components/ui/MetricExplainer';

interface PickItem {
  season: string;
  round: number;
  original_team: string;
  is_original: boolean;
  estimated_value: number;
}

interface TeamDraftMatrix {
  roster_id: number;
  team_name: string;
  avatar: string | null;
  total_picks: number;
  round_1_count: number;
  round_2_count: number;
  round_3_count: number;
  round_4_count: number;
  total_equity: number;
  liquidity_tier: string;
  tier_color: string;
  strategy: string;
  picks_by_season: Record<string, PickItem[]>;
}

interface DraftCapitalTabProps {
  onSelectTeamForTrade?: (rosterId: number) => void;
}

export default function DraftCapitalTab({ onSelectTeamForTrade }: DraftCapitalTabProps) {
  const { leagueId, myRosterId } = useLeague();
  const { currentTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ average_equity: number; teams: TeamDraftMatrix[] } | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!leagueId) return;

    async function fetchMatrix() {
      setLoading(false);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/draft-capital-matrix/${leagueId}`);
        if (res.ok) {
          const json = await res.json();
          if (!json.error) {
            setData(json);
          }
        }
      } catch (err) {
        console.error("Failed to fetch draft capital matrix:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatrix();
  }, [leagueId]);

  const teams = data?.teams || [];
  const myTeam = teams.find(t => t.roster_id === myRosterId) || teams[0];
  const topHoarder = teams[0];
  const mostDepleted = teams[teams.length - 1];

  const filteredTeams = teams.filter(t => {
    if (activeFilter === 'HOARDERS' && t.liquidity_tier !== 'War Chest Hoarder') return false;
    if (activeFilter === 'LIQUID' && t.liquidity_tier !== 'High Liquidity') return false;
    if (activeFilter === 'LEVERAGED' && t.liquidity_tier !== 'Leveraged Contender') return false;
    if (activeFilter === 'BANKRUPT' && t.liquidity_tier !== 'Pick Bankrupt') return false;
    if (searchQuery && !t.team_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'War Chest Hoarder':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'High Liquidity':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'Standard / Balanced':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Leveraged Contender':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  };

  const getRoundBadge = (round: number) => {
    switch (round) {
      case 1:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black';
      case 2:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold';
      case 3:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* ── TACTICAL BRIEFING CARD ─────────────────────────────────────────── */}
      <TacticalBriefingCard
        title="Draft Capital Liquidity Board & War Chest Matrix"
        subtitle="3-Year draft pick inventory, equity valuations, and liquidity leverage across all 10 franchises"
        badge="DYNASTY CURRENCY INTELLIGENCE"
        points={[
          {
            icon: Coins,
            label: "1. The Most Liquid Asset",
            text: "Draft picks never tear ACLs or lose snaps. They consistently appreciate in trade market value as rookie draft hype peaks in spring.",
            color: "#f59e0b"
          },
          {
            icon: Target,
            label: "2. Target Pick Hoarders",
            text: "Teams designated as 'War Chest Hoarders' hold surplus 1sts. They are primed to overpay for your win-now veterans to spark a championship run.",
            color: "#10b981"
          },
          {
            icon: AlertTriangle,
            label: "3. Exploit Pick-Bankrupt Teams",
            text: "Teams with 0 future 1st/2nd round picks face structural stagnation if starters get injured. Pressure them into distressed asset sales.",
            color: "#ef4444"
          }
        ]}
      />

      {/* ── LEAGUE DRAFT SUMMARY METRICS BAR ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono font-bold">
            <Coins size={14} style={{ color: currentTheme.primary }} />
            <span>MY WAR CHEST</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {myTeam?.round_1_count || 0}
            </span>
            <span className="text-xs text-amber-400 font-mono font-bold">Future 1sts</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">
            {myTeam?.total_equity?.toLocaleString() || 0} Total Equity Pts
          </p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono font-bold">
            <Award size={14} className="text-emerald-400" />
            <span>TOP HOARDER</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-black text-white truncate">
              {topHoarder?.team_name || "—"}
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-mono">
            {topHoarder?.round_1_count} 1sts • {topHoarder?.total_equity?.toLocaleString()} pts
          </p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono font-bold">
            <ShieldAlert size={14} className="text-rose-400" />
            <span>MOST DEPLETED</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-black text-white truncate">
              {mostDepleted?.team_name || "—"}
            </span>
          </div>
          <p className="text-[11px] text-rose-400 mt-1 font-mono">
            {mostDepleted?.round_1_count} 1sts • {mostDepleted?.total_equity?.toLocaleString()} pts
          </p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono font-bold">
            <TrendingUp size={14} className="text-cyan-400" />
            <span>LEAGUE AVERAGE</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {data?.average_equity?.toLocaleString() || "—"}
            </span>
            <span className="text-xs text-zinc-500 font-mono">pts / team</span>
          </div>
          <p className="text-[11px] text-cyan-400 mt-1 font-mono">
            3-Year Valuation Baseline
          </p>
        </div>
      </div>

      {/* ── CONTROLS & FILTER ROW ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Franchises' },
            { id: 'HOARDERS', label: 'War Chest Hoarders' },
            { id: 'LIQUID', label: 'High Liquidity' },
            { id: 'LEVERAGED', label: 'Leveraged Contenders' },
            { id: 'BANKRUPT', label: 'Pick Bankrupt' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                activeFilter === f.id
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={activeFilter === f.id ? { color: currentTheme.primary } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search franchise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
          />
        </div>
      </div>

      {/* ── FRANCHISE WAR CHEST MATRIX ─────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredTeams.map((team, rankIdx) => {
          const isMe = team.roster_id === myRosterId;
          const maxEquity = topHoarder?.total_equity || 30000;
          const equityPct = Math.round((team.total_equity / maxEquity) * 100);

          return (
            <div
              key={team.roster_id}
              className={`bg-zinc-900/90 border rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all ${
                isMe ? 'border-orange-500/60 bg-zinc-900/95 ring-1 ring-orange-500/20' : 'border-zinc-800/90 hover:border-zinc-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Team Identity & Vitals */}
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center font-mono font-black text-white shrink-0 overflow-hidden">
                    {team.avatar ? (
                      <img src={`https://sleepercdn.com/avatars/${team.avatar}`} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{rankIdx + 1}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-white font-display">
                        {team.team_name}
                      </h3>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-orange-500/20 text-orange-400 border border-orange-500/40">
                          YOU
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getTierBadge(team.liquidity_tier)}`}>
                        {team.liquidity_tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {team.strategy}
                    </p>
                  </div>
                </div>

                {/* Pick Inventory by Season (2026, 2027, 2028) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
                  {['2026', '2027', '2028'].map(season => {
                    const seasonPicks = team.picks_by_season[season] || [];
                    return (
                      <div key={season} className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400 mb-1.5 border-b border-zinc-800/60 pb-1">
                          <span>{season} PICKS</span>
                          <span className="text-zinc-500">{seasonPicks.length} Total</span>
                        </div>
                        {seasonPicks.length === 0 ? (
                          <span className="text-[10px] font-mono text-zinc-600 italic">None Owned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {seasonPicks.map((p, idx) => (
                              <span
                                key={`${season}-${idx}`}
                                title={`${p.season} Rd ${p.round} (Orig: ${p.original_team})`}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getRoundBadge(p.round)}`}
                              >
                                Rd {p.round}
                                {!p.is_original && (
                                  <span className="text-[8px] opacity-75 ml-0.5 font-sans">★</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Equity Gauge & Trade Action */}
                <div className="flex items-center justify-between lg:justify-end gap-4 min-w-[200px] border-t lg:border-t-0 border-zinc-800/80 pt-3 lg:pt-0">
                  <div className="text-left lg:text-right font-mono">
                    <div className="text-xs text-zinc-400 font-bold">TOTAL EQUITY</div>
                    <div className="text-base sm:text-lg font-black text-amber-400">
                      {team.total_equity.toLocaleString()} pts
                    </div>
                    <div className="w-28 sm:w-32 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(10, equityPct))}%` }}
                      />
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      onClick={() => {
                        if (onSelectTeamForTrade) {
                          onSelectTeamForTrade(team.roster_id);
                        } else {
                          window.location.href = `/dynasty-room?arena=trade&sub=architect&partner_roster=${team.roster_id}`;
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold border border-zinc-700 hover:border-zinc-600 transition-all flex items-center gap-1 shrink-0"
                      style={{ color: currentTheme.primary }}
                    >
                      <span>TRADE</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

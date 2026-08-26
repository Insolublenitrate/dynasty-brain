"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Info, AlertTriangle, TrendingUp, 
  Search, Users, Crown, Zap, Sparkles, CheckCircle2, ChevronRight,
  Flame, Award, Layers, Target, Coins, ShieldCheck
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function RosterIntelTab() {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [rostersList, setRostersList] = useState<any[]>([]);
  const [selectedRosterId, setSelectedRosterId] = useState<number>(1);
  const [rosterData, setRosterData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [benchFilter, setBenchFilter] = useState<'ALL' | 'QB' | 'RB' | 'WR' | 'TE' | 'TAXI' | 'IR'>('ALL');

  useEffect(() => {
    if (!leagueId) return;
    async function fetchRosterList() {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}`);
        if (res.ok) {
          const mData = await res.json();
          if (Array.isArray(mData) && mData.length > 0) {
            setRostersList(mData);
            setSelectedRosterId(mData[0].roster_id);
          }
        }
      } catch (err) {
        console.error('Failed to load roster selector list:', err);
      }
    }
    fetchRosterList();
  }, [leagueId]);

  useEffect(() => {
    if (!leagueId || !selectedRosterId) return;
    async function fetchRosterDetails() {
      setIsLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/roster-details/${leagueId}/${selectedRosterId}`);
        if (res.ok) {
          const data = await res.json();
          if (!data.error) {
            setRosterData(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch detailed roster breakdown:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRosterDetails();
  }, [leagueId, selectedRosterId]);

  const getPositionBadgeClass = (pos: string) => {
    switch (pos) {
      case 'QB':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'RB':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'WR':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'TE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const getCliffRiskBadge = (risk: string) => {
    if (risk.includes('HIGH')) {
      return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    } else if (risk.includes('MEDIUM')) {
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  };

  if (isLoading && !rosterData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: currentTheme.primary, borderTopColor: 'transparent' }} />
        <span className="text-xs font-mono text-zinc-400 tracking-wider uppercase">Decrypting Franchise Roster Telemetry...</span>
      </div>
    );
  }

  if (!rosterData || !rosterData.team_info) {
    return (
      <div className="p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-zinc-300 font-bold">No roster telemetry available for this team.</p>
      </div>
    );
  }

  const { team_info, starters, bench, taxi, reserve, position_audits, draft_picks, diagnostics } = rosterData;

  let filteredBench = bench || [];
  if (benchFilter === 'TAXI') filteredBench = taxi || [];
  else if (benchFilter === 'IR') filteredBench = reserve || [];
  else if (benchFilter !== 'ALL') {
    filteredBench = bench.filter((p: any) => p.position === benchFilter);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ── FRANCHISE COMMAND HEADER & SELECTOR ──────────────────────── */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10" style={{ background: currentTheme.primary }} />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950 border border-zinc-700/80 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              {team_info.avatar ? (
                <img src={team_info.avatar} alt={team_info.team_name} className="w-full h-full object-cover" />
              ) : (
                <Crown size={28} style={{ color: currentTheme.primary }} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                  {team_info.team_name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Rank #{team_info.rank} of {team_info.total_teams}
                </span>
              </div>
              
              <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-zinc-400 flex-wrap">
                <span className="text-white font-bold">{team_info.wins}-{team_info.losses}{team_info.ties ? `-${team_info.ties}` : ''} Record</span>
                <span className="text-zinc-600">•</span>
                <span>{team_info.total_fpts.toLocaleString()} Total FPTS</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400 font-bold">{team_info.starter_total_ppg} Starter PPG Baseline</span>
              </div>
            </div>
          </div>

          {/* Team Switcher Selector */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <span className="text-xs font-mono text-zinc-400 shrink-0">Switch Franchise:</span>
            <select
              className="bg-zinc-950 border border-zinc-700 text-white rounded-xl px-3.5 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 min-w-[220px] shadow-lg cursor-pointer"
              value={selectedRosterId}
              onChange={(e) => setSelectedRosterId(Number(e.target.value))}
            >
              {rostersList.map((r: any) => (
                <option key={r.roster_id} value={r.roster_id}>
                  #{r.rank_composite || r.roster_id} · {r.team_name} ({r.tier_label || 'Active'})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Tactical Telemetry Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800/80 font-mono text-xs">
          <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Starters Firepower</span>
            <span className="text-base font-black text-white mt-0.5 block">{team_info.starter_total_ppg} <span className="text-[10px] text-zinc-400 font-normal">PPG</span></span>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Bench Depth Firepower</span>
            <span className="text-base font-black text-white mt-0.5 block">{team_info.bench_total_ppg} <span className="text-[10px] text-zinc-400 font-normal">PPG</span></span>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total Roster Size</span>
            <span className="text-base font-black text-white mt-0.5 block">{(starters.length + bench.length + taxi.length)} <span className="text-[10px] text-zinc-400 font-normal">Players</span></span>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Future Draft Picks</span>
            <span className="text-base font-black text-emerald-400 mt-0.5 block">{draft_picks.length} <span className="text-[10px] text-zinc-400 font-normal">Owned</span></span>
          </div>
        </div>

      </div>

      {/* ── BLINDSIDE DIAGNOSTICS & ACTION PLAN ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Franchise Strengths */}
        <div className="bg-zinc-900/80 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className="text-emerald-400" />
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Franchise Strengths</h4>
          </div>
          <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed font-sans">
            {diagnostics.strengths.map((s: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Blindside Vulnerabilities */}
        <div className="bg-zinc-900/80 border border-rose-500/20 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={16} className="text-rose-400" />
            <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">Blindside Risks & Traps</h4>
          </div>
          <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed font-sans">
            {diagnostics.vulnerabilities.map((v: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">!</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actionable GM Playbook */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Target size={16} style={{ color: currentTheme.primary }} />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Manager Action Plan</h4>
            </div>
            <span className="font-coach text-[11px] text-amber-400 rotate-[-2deg]">BOOM CALL!</span>
          </div>
          <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed font-sans">
            {diagnostics.action_plan.map((a: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">&rarr;</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* ── POSITIONAL HEALTH & AGE CURVE AUDIT ──────────────────────── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Activity size={18} style={{ color: currentTheme.primary }} />
            <h3 className="text-base font-bold text-white tracking-tight font-display">
              Positional Health & Age Cliff Audit
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Calculated vs Dynasty Age Depreciation Curves</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['QB', 'RB', 'WR', 'TE'].map((pos) => {
            const audit = position_audits[pos];
            if (!audit) return null;
            return (
              <div key={pos} className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-black border ${getPositionBadgeClass(pos)}`}>
                    {pos} ROOM
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getCliffRiskBadge(audit.cliff_risk)}`}>
                    {audit.cliff_risk}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                  <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                    <span className="text-[9px] text-zinc-400 uppercase block">Starters</span>
                    <span className="text-xs font-black text-white mt-0.5 block">{audit.starter_quality}</span>
                  </div>
                  <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                    <span className="text-[9px] text-zinc-400 uppercase block">Depth</span>
                    <span className="text-xs font-black text-white mt-0.5 block">{audit.depth_grade}</span>
                  </div>
                  <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                    <span className="text-[9px] text-zinc-400 uppercase block">Avg Age</span>
                    <span className="text-xs font-black text-white mt-0.5 block">{audit.avg_age} y</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed pt-1">
                  {audit.summary}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE STARTING LINEUP (SLOT-BY-SLOT) ────────────────────── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Crown size={18} style={{ color: currentTheme.primary }} />
            <h3 className="text-base font-bold text-white tracking-tight font-display">
              Active Starters Lineup ({starters.length} Slots)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            Total Firepower: {team_info.starter_total_ppg} PPG
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {starters.map((p: any, idx: number) => (
            <div 
              key={p.id || idx}
              className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-3.5 transition-all space-y-2.5 relative group shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-mono font-black text-xs text-white shrink-0">
                    {p.slot || `S${idx+1}`}
                  </span>
                  <div>
                    <h5 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {p.name}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span className={`font-bold ${getPositionBadgeClass(p.position).split(' ')[1]}`}>{p.position}</span>
                      <span>•</span>
                      <span>{p.team}</span>
                      <span>•</span>
                      <span>Age {p.age}</span>
                    </div>
                  </div>
                </div>

                <span className="font-mono font-black text-sm text-emerald-400 shrink-0">
                  {p.ppg} <span className="text-[10px] text-zinc-400 font-normal">PPG</span>
                </span>
              </div>

              {/* Volume & Telemetry Bar */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-zinc-800/60 font-mono text-[10px] text-center">
                <div className="bg-zinc-900/40 rounded p-1">
                  <span className="text-zinc-400 block text-[9px]">Snap %</span>
                  <span className="font-bold text-white">{p.snap_share_pct}%</span>
                </div>
                <div className="bg-zinc-900/40 rounded p-1">
                  <span className="text-zinc-400 block text-[9px]">{p.position === 'RB' ? 'Carries/G' : 'Target %'}</span>
                  <span className="font-bold text-white">{p.target_share_pct}%</span>
                </div>
                <div className="bg-zinc-900/40 rounded p-1">
                  <span className="text-zinc-400 block text-[9px]">Ceiling</span>
                  <span className="font-bold text-amber-400">{p.ceiling}</span>
                </div>
              </div>

              {p.injury_status && (
                <div className="absolute top-2 right-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                    {p.injury_status}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── BENCH DEPTH & PIPELINE ──────────────────────────────────── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Layers size={18} style={{ color: currentTheme.primary }} />
            <h3 className="text-base font-bold text-white tracking-tight font-display">
              Bench Depth & Pipeline ({filteredBench.length} Players)
            </h3>
          </div>

          {/* Position Filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full font-mono text-xs">
            {(['ALL', 'QB', 'RB', 'WR', 'TE', 'TAXI', 'IR'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setBenchFilter(filter)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
                  benchFilter === filter
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={benchFilter === filter ? { color: currentTheme.primary } : {}}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredBench.length === 0 ? (
          <p className="text-xs font-mono text-zinc-400 py-6 text-center">No bench players found matching this filter.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBench.map((p: any) => (
              <div 
                key={p.id}
                className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] border shrink-0 ${getPositionBadgeClass(p.position)}`}>
                    {p.position}
                  </span>
                  <div className="min-w-0">
                    <h6 className="text-xs font-bold text-white truncate">{p.name}</h6>
                    <span className="text-[10px] font-mono text-zinc-400 block">
                      {p.team} · Age {p.age} · {p.role_tag}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="text-xs font-bold text-zinc-300 block">{p.ppg} PPG</span>
                  <span className="text-[9px] text-zinc-400">{p.slot || 'BN'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FUTURE DRAFT CAPITAL WAR CHEST ──────────────────────────── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Coins size={18} className="text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight font-display">
              Future Draft Capital War Chest ({draft_picks.length} Picks)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Time-Value-of-Money Evaluated</span>
        </div>

        {draft_picks.length === 0 ? (
          <p className="text-xs font-mono text-zinc-400 py-4 text-center">No future draft picks currently held in reserve.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {draft_picks.map((pick: any, idx: number) => {
              const isFirst = pick.round === 1;
              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border font-mono text-xs flex flex-col justify-between space-y-1.5 ${
                    isFirst 
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
                      : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white">{pick.season} Rd {pick.round}</span>
                    {isFirst && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                        ALPHA 1ST
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate">
                    {pick.is_original ? 'Own Pick' : `via ${pick.original_team}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

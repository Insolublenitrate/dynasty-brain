"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Trophy, Sparkles, Filter, Layers, Zap } from "lucide-react";
import SeasonSelector from '@/components/SeasonSelector';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function TopPerformersTab() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonYear, setSeasonYear] = useState("2024");
  const [positionScope, setPositionScope] = useState<string>("SKILL"); // 'SKILL', 'WR', 'RB', 'TE', 'QB', 'ALL'

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=${seasonYear}`);
        const json = await res.json();
        if (Array.isArray(json)) setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [seasonYear]);

  // Position Scoped Dataset for General Leaderboards (PPG, Fantasy Points)
  const scopedData = useMemo(() => {
    return data.filter(p => {
      if ((p.games_played || 0) < 6) return false;
      if (positionScope === "SKILL") return p.position === "WR" || p.position === "RB" || p.position === "TE";
      if (positionScope === "ALL") return true;
      return p.position === positionScope;
    });
  }, [data, positionScope]);

  // Strict Qualifier function for metric leaderboards
  const getQualifiedTopN = (
    metric: string, 
    filterFn: (p: any) => boolean, 
    n = 5
  ) => {
    return [...data]
      .filter(p => p[metric] !== null && p[metric] !== undefined && filterFn(p))
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, n);
  };

  const Leaderboard = ({ 
    title, 
    metric, 
    formatFn, 
    filterFn,
    qualifierNote
  }: {
    title: string;
    metric: string;
    formatFn?: (v: number) => string;
    filterFn: (p: any) => boolean;
    qualifierNote: string;
  }) => (
    <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm sm:text-base font-black text-white italic tracking-tight flex items-center gap-2">
            <Trophy size={18} style={{ color: currentTheme.primary }} /> {title}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 block mb-3 uppercase tracking-wider">{qualifierNote}</span>

        <div className="space-y-2.5">
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-11 bg-zinc-800/60 rounded-xl"></div>)}
            </div>
          ) : (
            getQualifiedTopN(metric, filterFn).map((p, i) => (
              <div key={p.player_id} className="flex justify-between items-center bg-zinc-950/80 p-2.5 sm:p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-zinc-500 font-mono font-bold w-4 text-xs">{i + 1}.</span>
                  <div className="truncate">
                    <div className="font-bold text-white text-xs sm:text-sm truncate">{p.player_name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{p.position} • {p.recent_team}</div>
                  </div>
                </div>
                <div className="font-mono font-black text-xs sm:text-sm flex-shrink-0" style={{ color: currentTheme.primary }}>
                  {formatFn ? formatFn(p[metric]) : p[metric]}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-3 sm:pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
            <Trophy size={28} style={{ color: currentTheme.primary }} /> TOP PERFORMERS
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            NFL statistical leaders with strict position qualification and minimum volume filters.
          </p>
        </div>
        <SeasonSelector currentSeason={seasonYear} onSeasonChange={setSeasonYear} />
      </div>

      {/* Position Scope Filter Ribbon for General Stats */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-zinc-900/60 p-2 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold px-2">
          <Filter size={14} style={{ color: currentTheme.primary }} />
          <span>SCORED POSITION FILTER:</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {[
            { label: "SKILL (WR/RB/TE)", key: "SKILL" },
            { label: "WR", key: "WR" },
            { label: "RB", key: "RB" },
            { label: "TE", key: "TE" },
            { label: "QB", key: "QB" },
            { label: "ALL", key: "ALL" },
          ].map((scope) => (
            <button
              key={scope.key}
              onClick={() => setPositionScope(scope.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                positionScope === scope.key
                  ? "bg-zinc-800 text-white shadow-md border border-zinc-700"
                  : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-900"
              }`}
            >
              {scope.label}
            </button>
          ))}
        </div>
      </div>

      {/* Qualified Category Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Points Per Game */}
        <Leaderboard 
          title="Points Per Game (PPR)" 
          metric="ppg" 
          formatFn={(v: number) => `${v.toFixed(1)} PPG`}
          filterFn={(p) => {
            if ((p.games_played || 0) < 6) return false;
            if (positionScope === "SKILL") return p.position === "WR" || p.position === "RB" || p.position === "TE";
            if (positionScope === "ALL") return true;
            return p.position === positionScope;
          }}
          qualifierNote={`Filter: ${positionScope} (Min 6 Games)`}
        />

        {/* 2. Total Fantasy Points */}
        <Leaderboard 
          title="Total Fantasy Points" 
          metric="fantasy_points_ppr" 
          formatFn={(v: number) => `${v.toFixed(1)} pts`} 
          filterFn={(p) => {
            if ((p.games_played || 0) < 6) return false;
            if (positionScope === "SKILL") return p.position === "WR" || p.position === "RB" || p.position === "TE";
            if (positionScope === "ALL") return true;
            return p.position === positionScope;
          }}
          qualifierNote={`Filter: ${positionScope} (Min 6 Games)`}
        />

        {/* 3. Estimated YPRR (WR / TE Strictly Qualified) */}
        <Leaderboard 
          title="YPRR (Yds / Route Run)" 
          metric="yprr_approx" 
          formatFn={(v: number) => `${v.toFixed(2)} YPRR`} 
          filterFn={(p) => (p.position === "WR" || p.position === "TE") && (p.targets || 0) >= 35 && (p.receiving_yards || 0) >= 250 && (p.games_played || 0) >= 6}
          qualifierNote="WR/TE Only (Min 35 Targets, 250+ Yds)"
        />

        {/* 4. Target Share / Rate */}
        <Leaderboard 
          title="Target Rate (Tgts / Snap)" 
          metric="target_rate" 
          formatFn={(v: number) => `${(v * 100).toFixed(1)}%`} 
          filterFn={(p) => (p.position === "WR" || p.position === "TE" || p.position === "RB") && (p.targets || 0) >= 35 && (p.offense_snaps || 0) >= 200 && (p.games_played || 0) >= 6}
          qualifierNote="Skill Positions (Min 35 Tgts, 200+ Snaps)"
        />

        {/* 5. Air Yards per Target */}
        <Leaderboard 
          title="Air Yards per Target" 
          metric="air_yards_per_target" 
          formatFn={(v: number) => `${v.toFixed(1)} yds`} 
          filterFn={(p) => (p.position === "WR" || p.position === "TE") && (p.targets || 0) >= 35 && (p.games_played || 0) >= 6}
          qualifierNote="WR/TE Only (Min 35 Targets)"
        />

        {/* 6. Catch Rate */}
        <Leaderboard 
          title="Catch Rate %" 
          metric="catch_rate" 
          formatFn={(v: number) => `${(v * 100).toFixed(1)}%`} 
          filterFn={(p) => (p.position === "WR" || p.position === "TE" || p.position === "RB") && (p.targets || 0) >= 40 && (p.receptions || 0) >= 25 && (p.games_played || 0) >= 6}
          qualifierNote="Skill Positions (Min 40 Tgts, 25+ Rec)"
        />

        {/* 7. Rush EPA / Attempt */}
        <Leaderboard 
          title="Rushing EPA / Attempt" 
          metric="rush_epa_per_attempt" 
          formatFn={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`} 
          filterFn={(p) => p.position === "RB" && (p.rush_attempts || 0) >= 60 && (p.games_played || 0) >= 6}
          qualifierNote="RB Only (Min 60 Carries)"
        />

        {/* 8. YAC per Reception */}
        <Leaderboard 
          title="YAC / Reception" 
          metric="yac_per_reception" 
          formatFn={(v: number) => `${v.toFixed(1)} yds`} 
          filterFn={(p) => (p.position === "WR" || p.position === "TE" || p.position === "RB") && (p.receptions || 0) >= 25 && (p.games_played || 0) >= 6}
          qualifierNote="Skill Positions (Min 25 Rec)"
        />

        {/* 9. Passing EPA / Play (QB Leaderboard) */}
        <Leaderboard 
          title="Passing EPA / Play" 
          metric="pass_epa_per_play" 
          formatFn={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`} 
          filterFn={(p) => p.position === "QB" && (p.pass_attempts || 0) >= 150 && (p.games_played || 0) >= 6}
          qualifierNote="QB Only (Min 150 Pass Attempts)"
        />

      </div>
    </div>
  );
}

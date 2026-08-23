"use client";

import React, { useState, useEffect } from 'react';
import { BarChart3, Trophy, Sparkles } from "lucide-react";
import SeasonSelector from '@/components/SeasonSelector';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function TopPerformers() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonYear, setSeasonYear] = useState("2024");

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

  const getTopN = (metric: string, n=5) => {
    return [...data]
      .filter(p => p[metric] !== null && p[metric] !== undefined && p.games_played > 5)
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, n);
  };

  const Leaderboard = ({ title, metric, formatFn }: any) => (
    <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Trophy size={18} style={{ color: currentTheme.primary }} /> {title}
      </h3>
      <div className="space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-zinc-800/60 rounded-xl"></div>)}
          </div>
        ) : (
          getTopN(metric).map((p, i) => (
            <div key={p.player_id} className="flex justify-between items-center bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 font-mono font-bold w-4">{i + 1}.</span>
                <div>
                  <div className="font-bold text-white text-sm">{p.player_name}</div>
                  <div className="text-xs text-zinc-500 font-mono">{p.position} • {p.recent_team}</div>
                </div>
              </div>
              <div className="font-mono font-black text-sm" style={{ color: currentTheme.primary }}>
                {formatFn ? formatFn(p[metric]) : p[metric]}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
            <Trophy size={28} style={{ color: currentTheme.primary }} /> TOP PERFORMERS
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            NFL statistical leaders across volume and efficiency metrics.
          </p>
        </div>
        <SeasonSelector currentSeason={seasonYear} onSeasonChange={setSeasonYear} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Leaderboard 
          title="Points Per Game (PPR)" 
          metric="ppg" 
          formatFn={(v: number) => `${v.toFixed(1)} PPG`} 
        />
        <Leaderboard 
          title="Estimated YPRR" 
          metric="yprr_approx" 
          formatFn={(v: number) => `${v.toFixed(2)} YPRR`} 
        />
        <Leaderboard 
          title="Target Share" 
          metric="target_rate" 
          formatFn={(v: number) => `${(v * 100).toFixed(1)}%`} 
        />
        <Leaderboard 
          title="Total Fantasy Points" 
          metric="fantasy_points" 
          formatFn={(v: number) => `${v.toFixed(1)} pts`} 
        />
        <Leaderboard 
          title="Snap %" 
          metric="offense_pct" 
          formatFn={(v: number) => `${(v * 100).toFixed(0)}%`} 
        />
        <Leaderboard 
          title="Catch Rate" 
          metric="catch_rate" 
          formatFn={(v: number) => `${(v * 100).toFixed(1)}%`} 
        />
      </div>
    </div>
  );
}

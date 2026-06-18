"use client";

import { useState, useEffect } from 'react';
import { BarChart3, Trophy } from "lucide-react";

export default function TopPerformers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=2025`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getTopN = (metric: string, n=5) => {
    return [...data]
      .filter(p => p[metric] !== null && p[metric] !== undefined && p.games_played > 5)
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, n);
  };

  const Leaderboard = ({ title, metric, formatFn }: any) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
        <Trophy className="text-amber-400" size={18} /> {title}
      </h3>
      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-800 rounded"></div>)}
          </div>
        ) : (
          getTopN(metric).map((p, i) => (
            <div key={p.player_id} className="flex justify-between items-center border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-bold w-4">{i + 1}.</span>
                <div>
                  <div className="font-medium text-slate-200">{p.player_name}</div>
                  <div className="text-xs text-slate-500">{p.position} • {p.recent_team}</div>
                </div>
              </div>
              <div className="font-bold text-indigo-400">
                {formatFn ? formatFn(p[metric]) : p[metric]}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <BarChart3 className="text-emerald-500" /> Top Performers
        </h1>
        <p className="text-slate-400 mt-2">The most efficient players in the NFL across key underlying metrics (min 5 games).</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Leaderboard title="Points Per Game" metric="ppg" formatFn={(v: number) => v.toFixed(1)} />
        <Leaderboard title="Total Receptions" metric="receptions" formatFn={(v: number) => v.toFixed(0)} />
        <Leaderboard title="Est. Yards Per Route Run" metric="yprr_approx" formatFn={(v: number) => v.toFixed(2)} />
        <Leaderboard title="Target Rate" metric="target_rate" formatFn={(v: number) => `${(v * 100).toFixed(1)}%`} />
        <Leaderboard title="Catch Rate" metric="catch_rate" formatFn={(v: number) => `${(v * 100).toFixed(1)}%`} />
        <Leaderboard title="Total Fantasy Points" metric="fantasy_points" formatFn={(v: number) => v.toFixed(1)} />
      </div>
    </div>
  );
}

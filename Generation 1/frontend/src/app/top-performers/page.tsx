"use client";

import { useState, useEffect } from 'react';
import { BarChart3, Trophy, Activity, Search } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { useLeague } from '@/context/LeagueContext';
import SeasonSelector from '@/components/SeasonSelector';

export default function TopPerformers() {
  const { seasonYear } = useLeague();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minVolume, setMinVolume] = useState(30);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=${seasonYear}&t=${new Date().getTime()}`, { cache: "no-store" });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [seasonYear]);

  const getScatterData = () => {
    return [...data]
      .filter(p => p.targets !== null && p.yprr_approx !== null && p.games_played > 5 && (p.targets || 0) >= minVolume)
      .map(p => ({
        name: p.player_name,
        targets: p.targets,
        yprr: p.yprr_approx,
        team: p.recent_team
      }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold">{payload[0].payload.fullName || payload[0].payload.name}</p>
          <p className="text-slate-400 text-sm mb-1">{payload[0].payload.team}</p>
          {payload.map((entry: any, index: number) => (
             <p key={index} className="font-medium" style={{ color: entry.color || entry.fill }}>
               {entry.name || 'Score'}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const LeaderboardList = ({ title, metric, color = "#6366f1" }: any) => {
    const sortedData = [...data]
      .filter(p => p[metric] !== null && p[metric] !== undefined && p.games_played > 5 && (p.targets || 0) >= minVolume)
      .sort((a, b) => b[metric] - a[metric]);

    const displayData = sortedData.slice(0, 5).map((p, idx) => ({
      ...p,
      rank: idx + 1,
      isSearched: false
    }));

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[400px]">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Trophy className="text-amber-400" size={18} /> {title}
        </h3>
        <div className="flex-1 w-full overflow-y-auto pr-2">
          {loading ? (
             <div className="flex h-full items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
             </div>
          ) : displayData.length === 0 ? (
             <div className="flex h-full items-center justify-center text-slate-500 text-sm text-center">
               No players meet the minimum volume threshold.
             </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayData.map(p => (
                <div key={p.player_id} className={`flex items-center justify-between p-3 rounded-lg border ${p.isSearched ? 'bg-indigo-900/40 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'} transition-all`}>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 font-mono font-bold w-6 text-right">#{p.rank}</span>
                    <div>
                      <div className={`font-bold ${p.isSearched ? 'text-white' : 'text-slate-200'}`}>{p.player_name}</div>
                      <div className="text-xs text-slate-500">{p.recent_team} • {p.position}</div>
                    </div>
                  </div>
                  <div className="font-bold text-xl" style={{ color: p.isSearched ? '#fff' : color }}>
                    {typeof p[metric] === 'number' && p[metric] % 1 !== 0 ? p[metric].toFixed(2) : p[metric]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const scatterData = getScatterData();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BarChart3 className="text-emerald-500" /> Top Performers
          </h1>
          <p className="text-slate-400 mt-2 mb-4">Filter and visualize the most efficient players in the NFL.</p>
          <SeasonSelector />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto relative z-30">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full sm:w-56 md:w-64">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">Minimum Targets</label>
              <span className="text-indigo-400 font-bold">{minVolume}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="150" 
              step="5"
              value={minVolume} 
              onChange={(e) => setMinVolume(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="text-rose-400" size={18} /> Efficiency vs Volume
          </h3>
          <div className="flex-1 w-full relative">
            {loading ? (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
               </div>
            ) : scatterData.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                 No players meet the minimum volume threshold.
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <XAxis 
                    type="number" 
                    dataKey="targets" 
                    name="Targets" 
                    stroke="#64748b" 
                    label={{ value: 'Total Targets', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="yprr" 
                    name="YPRR" 
                    stroke="#64748b" 
                    label={{ value: 'Yards Per Route Run', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} 
                  />
                  <ZAxis type="number" range={[40, 40]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Players" data={scatterData} fill="#10b981" isAnimationActive={false} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <LeaderboardList title="Est. Yards Per Route Run" metric="yprr_approx" color="#10b981" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <LeaderboardList title="Points Per Game" metric="ppg" color="#8b5cf6" />
        <LeaderboardList title="Total Receptions" metric="receptions" color="#3b82f6" />
        <LeaderboardList title="Target Rate" metric="target_rate" color="#f59e0b" />
        <LeaderboardList title="Total Fantasy Points" metric="fantasy_points_ppr" color="#6366f1" />
      </div>
    </div>
  );
}

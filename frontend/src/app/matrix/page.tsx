"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

import { useLeague } from '@/context/LeagueContext';
import { useRouter } from 'next/navigation';

export default function PowerMatrix() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { leagueId, isLoading: isLeagueLoading } = useLeague();
  const router = useRouter();

  useEffect(() => {
    if (isLeagueLoading) return;
    if (!leagueId) {
      router.push('/login');
      return;
    }

    async function fetchData() {
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}`);
        if (!res.ok) throw new Error("Failed to fetch matrix data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [leagueId, isLeagueLoading, router]);

  if (isLeagueLoading) return null;

  // Calculate medians for the grid axes
  const xMedian = data.length > 0 ? [...data].sort((a,b) => a.max_pf - b.max_pf)[Math.floor(data.length/2)].max_pf : 1500;
  const yMedian = data.length > 0 ? [...data].sort((a,b) => a.future_capital_score - b.future_capital_score)[Math.floor(data.length/2)].future_capital_score : 5000;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl text-sm">
          <div className="flex items-center gap-3 mb-3">
            {p.avatar && <img src={`https://sleepercdn.com/avatars/${p.avatar}`} className="w-8 h-8 rounded-full" alt="avatar" />}
            <div>
              <p className="font-bold text-slate-100">{p.team_name}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">{p.lifecycle_state}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400">Max PF: <span className="text-slate-200 font-mono">{p.max_pf.toFixed(1)}</span></p>
            <p className="text-slate-400">Future Draft Capital: <span className="text-slate-200 font-mono">{p.future_capital_score.toFixed(0)}</span></p>
            <p className="text-slate-400 pt-2 border-t border-slate-800 mt-2">Action: <span className="font-semibold text-emerald-400">{p.action_recommendation}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getDotColor = (state: string) => {
    switch (state) {
      case 'Contender': return '#6366f1'; // indigo-500
      case 'Fraud': return '#f43f5e'; // rose-500
      case 'Rebuild': return '#10b981'; // emerald-500
      case 'Purgatory': return '#64748b'; // slate-500
      default: return '#94a3b8';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Target className="text-indigo-500" /> Team Power Matrix
        </h1>
        <p className="text-slate-400 mt-2">Visualizing roster strength vs future draft capital to classify league lifecycle states.</p>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-8 relative min-h-[500px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              
              <XAxis 
                type="number" 
                dataKey="max_pf" 
                name="Max PF" 
                domain={['dataMin - 100', 'dataMax + 100']}
                stroke="#475569"
                tick={{fill: '#94a3b8', fontSize: 12}}
                tickFormatter={(value) => value.toFixed(0)}
                label={{ value: 'Current Contender Score (Max PF)', position: 'insideBottom', offset: -30, fill: '#64748b', fontSize: 12, fontWeight: 600, style: { textTransform: 'uppercase', letterSpacing: '0.1em' } }}
              />
              
              <YAxis 
                type="number" 
                dataKey="future_capital_score" 
                name="Future Draft Capital" 
                domain={['dataMin - 1000', 'dataMax + 1000']}
                stroke="#475569"
                tick={{fill: '#94a3b8', fontSize: 12}}
                tickFormatter={(value) => value.toFixed(0)}
                label={{ value: 'Future Draft Capital Value', angle: -90, position: 'insideLeft', offset: -20, fill: '#64748b', fontSize: 12, fontWeight: 600, style: { textTransform: 'uppercase', letterSpacing: '0.1em' } }}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
              
              <ReferenceLine x={xMedian} stroke="#334155" strokeDasharray="5 5" />
              <ReferenceLine y={yMedian} stroke="#334155" strokeDasharray="5 5" />

              <Scatter name="Teams" data={data}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getDotColor(entry.lifecycle_state)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
        
        {/* Quadrant Labels */}
        {!loading && (
          <>
            <div className="absolute top-12 right-12 opacity-30 pointer-events-none z-0">
              <span className="text-xl font-bold uppercase tracking-wider text-indigo-500">Strong Contender</span>
            </div>
            <div className="absolute top-12 left-32 opacity-30 pointer-events-none z-0">
              <span className="text-xl font-bold uppercase tracking-wider text-emerald-500">Productive Struggle</span>
            </div>
            <div className="absolute bottom-24 left-32 opacity-30 pointer-events-none z-0">
              <span className="text-xl font-bold uppercase tracking-wider text-slate-500">Purgatory</span>
            </div>
            <div className="absolute bottom-24 right-12 opacity-30 pointer-events-none z-0">
              <span className="text-xl font-bold uppercase tracking-wider text-rose-500">Fraudulent Contender</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

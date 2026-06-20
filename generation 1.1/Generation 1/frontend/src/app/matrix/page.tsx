"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

import { useLeague } from '@/context/LeagueContext';
import { useRouter } from 'next/navigation';

export default function PowerMatrix() {
  const [data, setData] = useState([]);
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}&t=${Date.now()}`);
        if (!res.ok) throw new Error("Failed to fetch matrix data");
        const json = await res.json();
        if (json.error || !Array.isArray(json)) {
          console.error("Backend error or non-array:", json);
          setData([]);
        } else {
          setData(json);
        }
      } catch (err) {
        console.error(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [leagueId, isLeagueLoading, router]);

  if (isLeagueLoading) return null;

  // Calculate medians for the grid axes
  const xMedian = data.length > 0 ? [...data].sort((a,b) => a.power_index - b.power_index)[Math.floor(data.length/2)].power_index : 1500;
  const yMedian = data.length > 0 ? [...data].sort((a,b) => a.health_score - b.health_score)[Math.floor(data.length/2)].health_score : 50;

  const CustomTooltip = ({ active, payload }: { active?: any, payload?: any }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl text-sm min-w-[280px]">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-800">
            {p.avatar && <img src={`https://sleepercdn.com/avatars/${p.avatar}`} className="w-10 h-10 rounded-full" alt="avatar" />}
            <div>
              <p className="font-bold text-slate-100 text-base">{p.team_name}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">{p.lifecycle_state}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2 mb-3">
            <p className="text-slate-400 text-xs">Power Index</p>
            <p className="text-slate-200 font-mono text-right">{p.power_index.toFixed(1)}</p>
            
            <p className="text-slate-400 text-xs">Health Score</p>
            <p className="text-slate-200 font-mono text-right">{p.health_score.toFixed(1)} <span className="text-xs text-slate-500">/ 100</span></p>
          </div>
          
          <div className="bg-slate-800/50 rounded p-2 space-y-1 mb-2">
            <p className="text-xs text-slate-400 flex justify-between"><span>Max PF:</span> <span className="text-slate-300 font-mono">{p.max_pf.toFixed(0)}</span></p>
            <p className="text-xs text-slate-400 flex justify-between"><span>Point Diff:</span> <span className="text-slate-300 font-mono">{p.point_differential > 0 ? '+' : ''}{p.point_differential.toFixed(1)}</span></p>
            <p className="text-xs text-slate-400 flex justify-between"><span>Draft Capital:</span> <span className="text-slate-300 font-mono">{p.future_capital_score.toFixed(0)}</span></p>
            <p className="text-xs text-slate-400 flex justify-between" title="Trades / Year"><span>Trade Freq:</span> <span className="text-slate-300 font-mono">{p.trade_frequency.toFixed(1)}</span></p>
            <p className="text-xs text-slate-400 flex justify-between"><span>Draft Hit Rate:</span> <span className="text-slate-300 font-mono">{(p.draft_success_rate * 100).toFixed(1)}%</span></p>
          </div>
          
          <p className="text-xs mt-2 text-slate-300"><span className="text-slate-500">Action:</span> <span className="font-semibold text-emerald-400">{p.action_recommendation}</span></p>
        </div>
      );
    }
    return null;
  };

  const getDotColor = (state: string) => {
    switch (state) {
      case 'Dynasty Juggernaut': return '#6366f1'; // indigo-500
      case 'All-In Contender': return '#f43f5e'; // rose-500
      case 'Rebuilding': return '#10b981'; // emerald-500
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
        <p className="text-slate-400 mt-2">Visualizing roster power against long-term dynasty health and manager habits.</p>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-8 overflow-x-auto">
        {loading ? (
          <div className="flex h-[400px] md:h-[500px] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="h-[400px] md:h-[500px] min-w-[800px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                
                <XAxis 
                  type="number" 
                  dataKey="power_index" 
                  name="Power Index" 
                  domain={['dataMin - 100', 'dataMax + 100']}
                  stroke="#475569"
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  tickFormatter={(value) => value.toFixed(0)}
                  label={{ value: 'Current Power Index (Scoring & Efficiency)', position: 'insideBottom', offset: -30, fill: '#64748b', fontSize: 12, fontWeight: 600, style: { textTransform: 'uppercase', letterSpacing: '0.1em' } }}
                />
                
                <YAxis 
                  type="number" 
                  dataKey="health_score" 
                  name="Health Score" 
                  domain={[0, 100]}
                  stroke="#475569"
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  tickFormatter={(value) => value.toFixed(0)}
                  label={{ value: 'Dynasty Health Score', angle: -90, position: 'insideLeft', offset: -20, fill: '#64748b', fontSize: 12, fontWeight: 600, style: { textTransform: 'uppercase', letterSpacing: '0.1em' } }}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
                
                <ReferenceLine x={xMedian} stroke="#334155" strokeDasharray="5 5" />
                <ReferenceLine y={yMedian} stroke="#334155" strokeDasharray="5 5" />

                <Scatter name="Teams" data={data}>
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getDotColor(entry.lifecycle_state)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            
            {/* Quadrant Labels */}
            <div className="hidden md:block">
              <div className="absolute top-12 right-12 opacity-30 pointer-events-none z-0">
                <span className="text-xl font-bold uppercase tracking-wider text-indigo-500">Dynasty Juggernaut</span>
              </div>
              <div className="absolute top-12 left-32 opacity-30 pointer-events-none z-0">
                <span className="text-xl font-bold uppercase tracking-wider text-emerald-500">Rebuilding</span>
              </div>
              <div className="absolute bottom-24 left-32 opacity-30 pointer-events-none z-0">
                <span className="text-xl font-bold uppercase tracking-wider text-slate-500">Purgatory</span>
              </div>
              <div className="absolute bottom-24 right-12 opacity-30 pointer-events-none z-0">
                <span className="text-xl font-bold uppercase tracking-wider text-rose-500">All-In Contender</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

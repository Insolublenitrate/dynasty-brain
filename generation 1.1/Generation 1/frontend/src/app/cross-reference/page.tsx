"use client";

import { useState, useEffect } from 'react';
import { GitCompareArrows } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLeague } from '@/context/LeagueContext';

const METRICS = [
  { id: 'ppg', label: 'Points Per Game (Est)' },
  { id: 'total_yards', label: 'Total Yards' },
  { id: 'yprr_approx', label: 'Est. YPRR' },
  { id: 'target_rate', label: 'Target Rate' },
  { id: 'catch_rate', label: 'Catch Rate' },
  { id: 'targets', label: 'Total Targets' },
  { id: 'yac_per_reception', label: 'YAC/Rec' },
  { id: 'air_yards_per_target', label: 'Air Yards/Tgt' }
];

export default function CrossReference() {
  const { seasonYear } = useLeague();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [xMetric, setXMetric] = useState('target_rate');
  const [yMetric, setYMetric] = useState('ppg');
  const [position, setPosition] = useState('WR');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=${seasonYear}`);
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

  const chartData = data
    .filter(p => p.position && p.position.includes(position) && p.games_played > 5 && p[xMetric] != null && p[yMetric] != null)
    .map(p => ({
      ...p,
      x: p[xMetric],
      y: p[yMetric]
    }));

  const CustomTooltip = ({ active, payload }: { active?: any, payload?: any }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl text-sm">
          <p className="font-bold text-slate-100">{p.player_name} ({p.recent_team})</p>
          <p className="text-slate-400 mt-2">{METRICS.find(m => m.id === xMetric)?.label}: <span className="text-slate-200">{typeof p.x === 'number' && p.x < 2 ? p.x.toFixed(2) : p.x.toFixed(1)}</span></p>
          <p className="text-slate-400">{METRICS.find(m => m.id === yMetric)?.label}: <span className="text-slate-200">{typeof p.y === 'number' && p.y < 2 ? p.y.toFixed(2) : p.y.toFixed(1)}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <GitCompareArrows className="text-rose-500" /> Cross Reference
        </h1>
        <p className="text-slate-400 mt-2">Deep dive into underlying metric correlations.</p>
      </div>

      <div className="grid grid-cols-2 lg:flex lg:flex-row gap-4 lg:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="col-span-2 lg:col-span-1 flex flex-col lg:flex-row gap-1 lg:gap-3 lg:items-center">
          <label className="text-sm font-medium text-slate-400">Position:</label>
          <select 
            className="w-full lg:w-auto bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white"
            value={position} onChange={e => setPosition(e.target.value)}
          >
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 lg:flex-row lg:gap-3 lg:items-center lg:ml-4">
          <label className="text-sm font-medium text-slate-400">X-Axis:</label>
          <select 
            className="w-full lg:w-auto bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white"
            value={xMetric} onChange={e => setXMetric(e.target.value)}
          >
            {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 lg:flex-row lg:gap-3 lg:items-center lg:ml-4">
          <label className="text-sm font-medium text-slate-400">Y-Axis:</label>
          <select 
            className="w-full lg:w-auto bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white"
            value={yMetric} onChange={e => setYMetric(e.target.value)}
          >
            {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-8 overflow-x-auto">
        {loading ? (
          <div className="flex h-[400px] md:h-[500px] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          </div>
        ) : (
          <div className="h-[400px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" dataKey="x" stroke="#475569" tick={{fill: '#94a3b8'}} />
                <YAxis type="number" dataKey="y" stroke="#475569" tick={{fill: '#94a3b8'}} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
                <Scatter name="Players" data={chartData}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#f43f5e" />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

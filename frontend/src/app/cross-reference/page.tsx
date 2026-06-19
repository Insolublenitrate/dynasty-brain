"use client";

import { useState, useEffect } from 'react';
import { GitCompareArrows } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import SeasonSelector from '@/components/SeasonSelector';

const METRICS = [
  { id: 'ppg', label: 'Points Per Game' },
  { id: 'fantasy_points', label: 'Total Fantasy Points' },
  { id: 'yprr_approx', label: 'Est. YPRR' },
  { id: 'target_rate', label: 'Target Rate' },
  { id: 'catch_rate', label: 'Catch Rate' },
  { id: 'offense_pct', label: 'Snap %' },
];

export default function CrossReference() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [xMetric, setXMetric] = useState('target_rate');
  const [yMetric, setYMetric] = useState('ppg');
  const [position, setPosition] = useState('WR');
  const [seasonYear, setSeasonYear] = useState("2024");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
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
    .filter(p => p.position === position && p.games_played > 5 && p[xMetric] != null && p[yMetric] != null)
    .map(p => ({
      ...p,
      x: p[xMetric],
      y: p[yMetric]
    }));

  const CustomTooltip = ({ active, payload }: any) => {
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
        <p className="text-slate-400 mt-2 mb-4">Deep dive into underlying metric correlations.</p>
        <SeasonSelector value={seasonYear} onChange={setSeasonYear} />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="text-sm font-medium text-slate-400">Position:</label>
          <select 
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white w-full sm:w-auto"
            value={position} onChange={e => setPosition(e.target.value)}
          >
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:ml-4">
          <label className="text-sm font-medium text-slate-400 whitespace-nowrap">X-Axis:</label>
          <select 
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white w-full sm:w-auto"
            value={xMetric} onChange={e => setXMetric(e.target.value)}
          >
            {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:ml-4">
          <label className="text-sm font-medium text-slate-400 whitespace-nowrap">Y-Axis:</label>
          <select 
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white w-full sm:w-auto"
            value={yMetric} onChange={e => setYMetric(e.target.value)}
          >
            {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 h-[550px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

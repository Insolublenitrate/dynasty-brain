"use client";

import React, { useState, useEffect } from 'react';
import { Radar, Sparkles } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import SeasonSelector from '@/components/SeasonSelector';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

const METRICS = [
  { id: 'ppg', label: 'Points Per Game' },
  { id: 'fantasy_points', label: 'Total Fantasy Points' },
  { id: 'yprr_approx', label: 'Est. YPRR' },
  { id: 'target_rate', label: 'Target Rate' },
  { id: 'catch_rate', label: 'Catch Rate' },
  { id: 'offense_pct', label: 'Snap %' },
];

export default function CrossReference() {
  const { currentTheme } = useTheme();
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

  const chartData = data
    .filter(p => p.position === position && p.games_played > 4 && p[xMetric] != null && p[yMetric] != null)
    .map(p => ({
      ...p,
      x: p[xMetric],
      y: p[yMetric]
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl text-xs z-50">
          <p className="font-bold text-white text-sm mb-1">{p.player_name} ({p.recent_team})</p>
          <div className="space-y-1 font-mono">
            <p className="text-zinc-400">{METRICS.find(m => m.id === xMetric)?.label}: <span className="text-white font-bold">{typeof p.x === 'number' && p.x < 2 ? p.x.toFixed(2) : p.x.toFixed(1)}</span></p>
            <p className="text-zinc-400">{METRICS.find(m => m.id === yMetric)?.label}: <span className="font-bold" style={{ color: currentTheme.primary }}>{typeof p.y === 'number' && p.y < 2 ? p.y.toFixed(2) : p.y.toFixed(1)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
            <Radar size={28} style={{ color: currentTheme.primary }} /> CROSS REFERENCE
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            Analyze underlying metric correlations across player cohorts.
          </p>
        </div>
        <SeasonSelector currentSeason={seasonYear} onSeasonChange={setSeasonYear} />
      </div>

      {/* Controls Bar */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap gap-4 items-center justify-between pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Position:</span>
            <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
              {['QB', 'RB', 'WR', 'TE'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    position === pos 
                      ? 'bg-zinc-800 text-white shadow-md border' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  style={position === pos ? { borderColor: currentTheme.border, color: currentTheme.primary } : {}}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">X-Axis:</label>
              <select 
                value={xMetric} 
                onChange={e => setXMetric(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {METRICS.map(m => (
                  <option key={`x-${m.id}`} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Y-Axis:</label>
              <select 
                value={yMetric} 
                onChange={e => setYMetric(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {METRICS.map(m => (
                  <option key={`y-${m.id}`} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[460px] w-full bg-zinc-950/80 p-4 rounded-xl border border-zinc-800">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name={METRICS.find(m => m.id === xMetric)?.label} 
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  label={{ value: `${METRICS.find(m => m.id === xMetric)?.label} →`, position: 'bottom', offset: 10, fill: '#71717a', fontSize: 11 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name={METRICS.find(m => m.id === yMetric)?.label} 
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  label={{ value: `${METRICS.find(m => m.id === yMetric)?.label} →`, angle: -90, position: 'left', offset: 0, fill: '#71717a', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter name="Players" data={chartData}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={currentTheme.primary} 
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Radar, Sparkles, Search, Filter, ArrowUpDown, ChevronRight, User } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import SeasonSelector from '@/components/SeasonSelector';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

const METRICS = [
  { id: 'ppg', label: 'Points Per Game (PPG)' },
  { id: 'fantasy_points', label: 'Total Fantasy Points' },
  { id: 'yprr_approx', label: 'Est. Yards Per Route Run (YPRR)' },
  { id: 'target_rate', label: 'Target Rate %' },
  { id: 'catch_rate', label: 'Catch Rate %' },
  { id: 'offense_pct', label: 'Offense Snap %' },
  { id: 'games_played', label: 'Games Played' },
];

export default function CrossReference() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [xMetric, setXMetric] = useState('target_rate');
  const [yMetric, setYMetric] = useState('ppg');
  const [position, setPosition] = useState('WR');
  const [seasonYear, setSeasonYear] = useState("2024");
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

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

  const chartData = useMemo(() => {
    return data
      .filter(p => p.position === position && p.games_played >= 4 && p[xMetric] != null && p[yMetric] != null)
      .map(p => ({
        ...p,
        x: Number(p[xMetric]),
        y: Number(p[yMetric])
      }));
  }, [data, position, xMetric, yMetric]);

  // Compute dynamic domain bounds with 8% padding
  const xValues = chartData.map(d => d.x).filter(v => typeof v === 'number' && !isNaN(v));
  const yValues = chartData.map(d => d.y).filter(v => typeof v === 'number' && !isNaN(v));
  
  const rawMinX = xValues.length ? Math.min(...xValues) : 0;
  const rawMaxX = xValues.length ? Math.max(...xValues) : 100;
  const rawMinY = yValues.length ? Math.min(...yValues) : 0;
  const rawMaxY = yValues.length ? Math.max(...yValues) : 30;

  const minX = rawMinX < 0 ? Math.floor(rawMinX * 1.1) : Math.max(0, Math.floor(rawMinX * 0.9));
  const maxX = rawMaxX < 2 ? Number((rawMaxX * 1.1).toFixed(2)) : Math.ceil(rawMaxX * 1.08);
  const minY = rawMinY < 0 ? Math.floor(rawMinY * 1.1) : Math.max(0, Math.floor(rawMinY * 0.9));
  const maxY = rawMaxY < 2 ? Number((rawMaxY * 1.1).toFixed(2)) : Math.ceil(rawMaxY * 1.08);

  const xLabel = METRICS.find(m => m.id === xMetric)?.label || xMetric;
  const yLabel = METRICS.find(m => m.id === yMetric)?.label || yMetric;

  // Filtered leaderboard table below
  const filteredPlayers = useMemo(() => {
    return chartData
      .filter(p => !playerSearch || p.player_name.toLowerCase().includes(playerSearch.toLowerCase()))
      .sort((a, b) => b.y - a.y);
  }, [chartData, playerSearch]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl text-xs z-50 min-w-[210px] max-w-[260px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <p className="font-bold text-white text-sm truncate">{p.player_name}</p>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300">
              {p.recent_team || p.position}
            </span>
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-sans">{xLabel}:</span>
              <span className="text-white font-bold">{p.x < 2 ? p.x.toFixed(2) : p.x.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-sans">{yLabel}:</span>
              <span className="font-bold" style={{ color: currentTheme.primary }}>{p.y < 2 ? p.y.toFixed(2) : p.y.toFixed(1)}</span>
            </div>
            <div className="pt-2 mt-1 border-t border-zinc-800 text-[10px] text-zinc-500 font-sans flex justify-between">
              <span>Games: {p.games_played}</span>
              <span>Snaps: {p.offense_pct}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-2.5">
            <Radar size={26} style={{ color: currentTheme.primary }} /> CROSS REFERENCE
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            Analyze metric correlations & efficiency cohorts
          </p>
        </div>
        <SeasonSelector currentSeason={seasonYear} onSeasonChange={setSeasonYear} />
      </div>

      {/* Controls Container */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
        
        {/* Position Selectors */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Position:</span>
            <div className="grid grid-cols-4 sm:flex bg-zinc-950 rounded-xl p-1 border border-zinc-800 w-full sm:w-auto">
              {['QB', 'RB', 'WR', 'TE'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
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

          <span className="text-xs font-mono text-zinc-500 self-end sm:self-center">
            {chartData.length} Qualified Players (Min 4 GP)
          </span>
        </div>

        {/* Metric Dropdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              X-Axis Metric
            </label>
            <select 
              value={xMetric} 
              onChange={e => setXMetric(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            >
              {METRICS.map(m => (
                <option key={`x-${m.id}`} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Y-Axis Metric
            </label>
            <select 
              value={yMetric} 
              onChange={e => setYMetric(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            >
              {METRICS.map(m => (
                <option key={`y-${m.id}`} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-[360px] sm:h-[460px] md:h-[520px] w-full bg-zinc-950/90 p-2 sm:p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
              <p className="text-zinc-500 text-xs font-mono">Loading Cohort Analytics...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 25, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name={xLabel} 
                  domain={[minX, maxX]}
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  label={{ 
                    value: `${xLabel} →`, 
                    position: 'bottom', 
                    offset: 8, 
                    fill: '#71717a', 
                    fontSize: 10,
                    fontWeight: 600
                  }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name={yLabel} 
                  domain={[minY, maxY]}
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  label={{ 
                    value: `${yLabel} →`, 
                    angle: -90, 
                    position: 'left', 
                    offset: 5, 
                    fill: '#71717a', 
                    fontSize: 10,
                    fontWeight: 600
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter 
                  name="Players" 
                  data={chartData}
                  onClick={(node) => setSelectedPlayer(node.payload)}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={selectedPlayer?.player_name === entry.player_name ? '#ffffff' : currentTheme.primary} 
                      stroke={selectedPlayer?.player_name === entry.player_name ? currentTheme.primary : '#ffffff'}
                      strokeWidth={selectedPlayer?.player_name === entry.player_name ? 3 : 1}
                      r={selectedPlayer?.player_name === entry.player_name ? 7 : 5}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        <p className="text-[11px] text-zinc-500 font-mono text-center block sm:hidden">
          💡 Tap any player dot to highlight them in the cohort directory below
        </p>
      </div>

      {/* Cohort Leaderboard Directory */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <User size={20} style={{ color: currentTheme.primary }} />
            <div>
              <h4 className="text-base font-bold text-white">Cohort Rankings & Metric Breakdown</h4>
              <p className="text-xs text-zinc-400">Ranked by {yLabel}</p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
            <input 
              type="text"
              placeholder="Search cohort..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredPlayers.length === 0 ? (
            <p className="text-zinc-500 text-xs italic py-6 text-center col-span-full">No players match the search criteria.</p>
          ) : (
            filteredPlayers.map((player, idx) => {
              const isSelected = selectedPlayer?.player_name === player.player_name;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPlayer(isSelected ? null : player)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected 
                      ? 'bg-zinc-800 border-zinc-500 shadow-md' 
                      : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="font-mono text-xs text-zinc-500 w-5 font-bold">#{idx + 1}</span>
                    <div>
                      <p className="font-bold text-white text-xs truncate">{player.player_name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {player.recent_team || player.position} • {player.games_played} GP
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: currentTheme.primary }}>
                      {player.y < 2 ? player.y.toFixed(2) : player.y.toFixed(1)} <span className="text-[9px] text-zinc-400 font-sans">Y</span>
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {player.x < 2 ? player.x.toFixed(2) : player.x.toFixed(1)} <span className="text-[9px] text-zinc-500 font-sans">X</span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}

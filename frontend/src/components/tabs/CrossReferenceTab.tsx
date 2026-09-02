"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Radar, Sparkles, Search, Filter, ArrowUpDown, ChevronRight, User, Layers, Crosshair } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import SeasonSelector from '@/components/SeasonSelector';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';
import PlayerCompareTab from '@/components/tabs/PlayerCompareTab';

export const METRIC_CATEGORIES = [
  {
    category: "Fantasy Value & Output",
    metrics: [
      { id: 'ppg', label: 'Points Per Game (PPG)', format: 'float' },
      { id: 'fantasy_points_ppr', label: 'Total Fantasy Points (PPR)', format: 'float' },
      { id: 'vorp', label: 'Value Over Replacement (VORP)', format: 'float' },
      { id: 'consistency', label: 'Consistency Score (0-100)', format: 'float' },
      { id: 'games_played', label: 'Games Played', format: 'int' },
    ]
  },
  {
    category: "Receiving & Target Quality",
    metrics: [
      { id: 'targets', label: 'Total Targets', format: 'int' },
      { id: 'receptions', label: 'Total Receptions', format: 'int' },
      { id: 'receiving_yards', label: 'Receiving Yards', format: 'int' },
      { id: 'redzone_targets', label: 'Red Zone Targets', format: 'int' },
      { id: 'yprr_approx', label: 'Est. Yards Per Route Run (YPRR)', format: 'float' },
      { id: 'air_yards_per_target', label: 'Air Yards Per Target (aDOT)', format: 'float' },
      { id: 'yac_per_reception', label: 'Yards After Catch (YAC / Rec)', format: 'float' },
      { id: 'target_rate', label: 'Target Rate % (Targets / Snap)', format: 'pct' },
      { id: 'catch_rate', label: 'Catch Rate % (Rec / Target)', format: 'pct' },
      { id: 'rec_epa_per_target', label: 'Receiving EPA / Target', format: 'float' },
    ]
  },
  {
    category: "Rushing & Ground Efficiency",
    metrics: [
      { id: 'rush_attempts', label: 'Rushing Attempts (Carries)', format: 'int' },
      { id: 'rushing_yards', label: 'Rushing Yards', format: 'int' },
      { id: 'yards_per_carry', label: 'Yards Per Carry (YPC)', format: 'float' },
      { id: 'redzone_rush_attempts', label: 'Red Zone Rush Attempts', format: 'int' },
      { id: 'rush_epa_per_attempt', label: 'Rushing EPA / Attempt', format: 'float' },
    ]
  },
  {
    category: "Quarterback & Passing Precision",
    metrics: [
      { id: 'pass_epa_per_play', label: 'Passing EPA / Play (Dropback EPA)', format: 'float' },
      { id: 'cpoe', label: 'Completion % Over Expected (CPOE)', format: 'pct' },
      { id: 'pass_attempts', label: 'Pass Attempts', format: 'int' },
    ]
  },
  {
    category: "Snap Volume & Playing Time",
    metrics: [
      { id: 'offense_pct', label: 'Offense Snap Share %', format: 'pct' },
      { id: 'offense_snaps', label: 'Total Offensive Snaps', format: 'int' },
    ]
  }
];

const ALL_METRICS = METRIC_CATEGORIES.flatMap(c => c.metrics);

const POSITION_COLORS: Record<string, string> = {
  'WR': '#22c55e', // Emerald Green (Loaded)
  'RB': '#a855f7', // Royal Purple (Strong)
  'TE': '#eab308', // Gold / Amber (Weak)
  'QB': '#f97316', // Orange / Amber (Elite)
  'FLEX': '#38bdf8', // Sky Blue / Cyan
  'DEF': '#64748b', // Slate
};

const REPLACEMENT_LEVELS: Record<string, number> = {
  'QB': 12,
  'RB': 24,
  'WR': 36,
  'TE': 12
};

export default function CrossReferenceTab() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [xMetric, setXMetric] = useState('target_rate');
  const [yMetric, setYMetric] = useState('ppg');
  const [position, setPosition] = useState('WR'); // 'SKILL', 'WR', 'RB', 'TE', 'QB', 'ALL'
  const [seasonYear, setSeasonYear] = useState("2024");
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [showCrosshairs, setShowCrosshairs] = useState(true);
  const [subTool, setSubTool] = useState<'scatter' | 'headtohead'>('scatter');

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

  // Derived metric calculations and position filtering
  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Calculate VORP Baselines
    const baselines: Record<string, number> = {};
    ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
      const sorted = data
        .filter(p => p.position === pos)
        .sort((a, b) => (b.fantasy_points_ppr || b.fantasy_points || 0) - (a.fantasy_points_ppr || a.fantasy_points || 0));
      const idx = Math.min(REPLACEMENT_LEVELS[pos] || 12, sorted.length - 1);
      baselines[pos] = sorted[idx]?.fantasy_points_ppr || sorted[idx]?.fantasy_points || 0;
    });

    return data
      .filter(p => {
        if ((p.games_played || 0) < 4) return false;
        if (position === 'SKILL') return p.position === 'WR' || p.position === 'RB' || p.position === 'TE';
        if (position === 'ALL') return true;
        return p.position === position;
      })
      .map(p => {
        const pos = p.position?.includes('WR') ? 'WR' : p.position;
        const baseline = baselines[pos] || 0;
        const fantasyPts = p.fantasy_points_ppr ?? p.fantasy_points ?? 0;
        const vorpVal = Number((fantasyPts - baseline).toFixed(1));
        
        let consistencyVal = 75;
        if (p.games_played > 0) {
          const efficiency = (p.rec_epa_per_target || 0) + (p.rush_epa_per_attempt || 0) + (p.pass_epa_per_play || 0);
          consistencyVal = Math.min(99, Math.max(10, 50 + (efficiency * 20) + (p.games_played * 2)));
        }

        const ypc = (p.rush_attempts || 0) >= 10 ? Number(((p.rushing_yards || 0) / p.rush_attempts).toFixed(2)) : 0;

        const record = {
          ...p,
          fantasy_points_ppr: fantasyPts,
          vorp: vorpVal,
          consistency: Number(consistencyVal.toFixed(1)),
          yards_per_carry: ypc
        };

        const xRaw = record[xMetric];
        const yRaw = record[yMetric];

        return {
          ...record,
          x: xRaw != null ? Number(xRaw) : 0,
          y: yRaw != null ? Number(yRaw) : 0
        };
      })
      .filter(p => p.x != null && !isNaN(p.x) && p.y != null && !isNaN(p.y));
  }, [data, position, xMetric, yMetric]);

  // Compute dynamic domain bounds with 8% padding
  const xValues = chartData.map(d => d.x).filter(v => typeof v === 'number' && !isNaN(v));
  const yValues = chartData.map(d => d.y).filter(v => typeof v === 'number' && !isNaN(v));
  
  const rawMinX = xValues.length ? Math.min(...xValues) : 0;
  const rawMaxX = xValues.length ? Math.max(...xValues) : 100;
  const rawMinY = yValues.length ? Math.min(...yValues) : 0;
  const rawMaxY = yValues.length ? Math.max(...yValues) : 30;

  const avgX = xValues.length ? Number((xValues.reduce((a, b) => a + b, 0) / xValues.length).toFixed(2)) : 0;
  const avgY = yValues.length ? Number((yValues.reduce((a, b) => a + b, 0) / yValues.length).toFixed(2)) : 0;

  const minX = rawMinX < 0 ? Math.floor(rawMinX * 1.15) : Math.max(0, Math.floor(rawMinX * 0.9));
  const maxX = rawMaxX < 2 ? Number((rawMaxX * 1.12).toFixed(2)) : Math.ceil(rawMaxX * 1.08);
  const minY = rawMinY < 0 ? Math.floor(rawMinY * 1.15) : Math.max(0, Math.floor(rawMinY * 0.9));
  const maxY = rawMaxY < 2 ? Number((rawMaxY * 1.12).toFixed(2)) : Math.ceil(rawMaxY * 1.08);

  const xMeta = ALL_METRICS.find(m => m.id === xMetric);
  const yMeta = ALL_METRICS.find(m => m.id === yMetric);
  const xLabel = xMeta?.label || xMetric;
  const yLabel = yMeta?.label || yMetric;

  // Filtered leaderboard table below
  const filteredPlayers = useMemo(() => {
    return chartData
      .filter(p => !playerSearch || p.player_name.toLowerCase().includes(playerSearch.toLowerCase()))
      .sort((a, b) => b.y - a.y);
  }, [chartData, playerSearch]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      const dotColor = POSITION_COLORS[p.position] || currentTheme.primary;

      return (
        <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl text-xs z-50 min-w-[220px] max-w-[280px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <p className="font-bold text-white text-sm truncate">{p.player_name}</p>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white" style={{ backgroundColor: dotColor }}>
              {p.position} • {p.recent_team || 'FA'}
            </span>
          </div>
          <div className="space-y-2 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-sans">{xLabel}:</span>
              <span className="text-white font-bold">
                {xMeta?.format === 'pct' ? `${(p.x * 100).toFixed(1)}%` : p.x < 2 ? p.x.toFixed(2) : p.x.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-sans">{yLabel}:</span>
              <span className="font-bold text-cyan-400">
                {yMeta?.format === 'pct' ? `${(p.y * 100).toFixed(1)}%` : p.y < 2 ? p.y.toFixed(2) : p.y.toFixed(1)}
              </span>
            </div>
            <div className="pt-2 mt-1 border-t border-zinc-800 text-[10px] text-zinc-500 font-sans flex justify-between">
              <span>{p.games_played} Games</span>
              <span>{p.fantasy_points_ppr?.toFixed(1)} Pts</span>
              <span>VORP: {p.vorp}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-2.5">
            <Radar size={26} style={{ color: currentTheme.primary }} /> ADVANCED CROSS REFERENCE
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            Correlate 25+ advanced volume, efficiency, EPA, and fantasy metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono font-bold">
            <button
              onClick={() => setSubTool('scatter')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subTool === 'scatter' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={subTool === 'scatter' ? { color: currentTheme.primary } : {}}
            >
              Scatter Analysis
            </button>
            <button
              onClick={() => setSubTool('headtohead')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subTool === 'headtohead' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={subTool === 'headtohead' ? { color: currentTheme.primary } : {}}
            >
              H2H Radar
            </button>
          </div>
          {subTool === 'scatter' && (
            <SeasonSelector currentSeason={seasonYear} onSeasonChange={setSeasonYear} />
          )}
        </div>
      </div>

      {subTool === 'headtohead' ? (
        <PlayerCompareTab />
      ) : (
        <>
          {/* Controls Container */}
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
        
        {/* Position Selectors Ribbon */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Filter size={14} style={{ color: currentTheme.primary }} /> Position:
            </span>
            <div className="flex flex-wrap bg-zinc-950 rounded-xl p-1 border border-zinc-800 gap-1">
              {[
                { label: "SKILL (WR/RB/TE)", key: "SKILL" },
                { label: "WR", key: "WR" },
                { label: "RB", key: "RB" },
                { label: "TE", key: "TE" },
                { label: "QB", key: "QB" },
                { label: "ALL", key: "ALL" },
              ].map(pos => (
                <button
                  key={pos.key}
                  onClick={() => setPosition(pos.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                    position === pos.key 
                      ? 'bg-zinc-800 text-white shadow-md border border-zinc-700' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  style={position === pos.key ? { color: currentTheme.primary } : {}}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center">
            <button
              onClick={() => setShowCrosshairs(!showCrosshairs)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                showCrosshairs ? 'bg-zinc-800 border-zinc-600 text-zinc-200' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
              }`}
            >
              <Crosshair size={13} style={{ color: currentTheme.primary }} />
              <span>{showCrosshairs ? "Crosshairs: ON" : "Crosshairs: OFF"}</span>
            </button>
            <span className="text-xs font-mono text-zinc-500">
              {chartData.length} Players Qualified
            </span>
          </div>
        </div>

        {/* Categorized Metric Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          
          {/* X-Axis Metric */}
          <div className="bg-zinc-950/90 p-3 sm:p-4 rounded-xl border border-zinc-800/80">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              X-Axis Metric (Horizontal)
            </label>
            <select 
              value={xMetric} 
              onChange={e => setXMetric(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-bold rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
            >
              {METRIC_CATEGORIES.map(cat => (
                <optgroup key={`x-cat-${cat.category}`} label={cat.category}>
                  {cat.metrics.map(m => (
                    <option key={`x-${m.id}`} value={m.id}>{m.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Y-Axis Metric */}
          <div className="bg-zinc-950/90 p-3 sm:p-4 rounded-xl border border-zinc-800/80">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Y-Axis Metric (Vertical)
            </label>
            <select 
              value={yMetric} 
              onChange={e => setYMetric(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-bold rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
            >
              {METRIC_CATEGORIES.map(cat => (
                <optgroup key={`y-cat-${cat.category}`} label={cat.category}>
                  {cat.metrics.map(m => (
                    <option key={`y-${m.id}`} value={m.id}>{m.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Player Highlight HUD Banner */}
        {selectedPlayer && (
          <div className="bg-zinc-950 p-3 sm:p-4 rounded-xl border border-zinc-700 flex justify-between items-center animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-xs border border-zinc-700">
                {selectedPlayer.position}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{selectedPlayer.player_name} ({selectedPlayer.recent_team || 'FA'})</h4>
                <p className="text-[11px] font-mono text-zinc-400">
                  {xLabel}: <strong className="text-white">{selectedPlayer.x}</strong> • {yLabel}: <strong className="text-cyan-400">{selectedPlayer.y}</strong>
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800"
            >
              Clear Focus
            </button>
          </div>
        )}

        {/* Chart Canvas */}
        <div className="h-[380px] sm:h-[480px] md:h-[540px] w-full bg-zinc-950/90 p-2 sm:p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
              <p className="text-zinc-500 text-xs font-mono">Synthesizing Cross-Reference Scatter...</p>
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
                    fill: '#a1a1aa', 
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
                    fill: '#a1a1aa', 
                    fontSize: 10,
                    fontWeight: 600
                  }}
                />
                
                {/* Benchmark Crosshairs */}
                {showCrosshairs && (
                  <>
                    <ReferenceLine x={avgX} stroke="#3f3f46" strokeDasharray="4 4" label={{ value: `Avg X: ${avgX}`, fill: '#71717a', fontSize: 9, position: 'insideTopRight' }} />
                    <ReferenceLine y={avgY} stroke="#3f3f46" strokeDasharray="4 4" label={{ value: `Avg Y: ${avgY}`, fill: '#71717a', fontSize: 9, position: 'insideTopRight' }} />
                  </>
                )}

                <Tooltip content={<CustomTooltip />} />
                <Scatter 
                  name="Players" 
                  data={chartData}
                  onClick={(node) => setSelectedPlayer(node.payload)}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => {
                    const isSelected = selectedPlayer?.player_name === entry.player_name;
                    const posColor = POSITION_COLORS[entry.position] || currentTheme.primary;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isSelected ? '#ffffff' : posColor} 
                        stroke={isSelected ? currentTheme.primary : '#09090b'}
                        strokeWidth={isSelected ? 3 : 1}
                        r={isSelected ? 8 : 5}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Position Color Legend */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-zinc-500 font-sans uppercase font-bold text-[10px]">Position Legend:</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> WR</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> RB</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> TE</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> QB</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> FLEX</span>
          </div>
          <span className="text-[11px] text-zinc-500">Tap any player dot to highlight</span>
        </div>

      </div>

      {/* Cohort Player Leaderboard */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers size={18} style={{ color: currentTheme.primary }} /> Cohort Player Leaderboard
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Ranked by {yLabel}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search cohort..."
              value={playerSearch}
              onChange={e => setPlayerSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-500 uppercase font-mono sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 px-3 text-right">{xLabel}</th>
                <th className="py-2.5 px-3 text-right">{yLabel}</th>
                <th className="py-2.5 px-3 text-right">VORP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 font-mono">
              {filteredPlayers.slice(0, 50).map((p, idx) => {
                const isSelected = selectedPlayer?.player_name === p.player_name;
                const posColor = POSITION_COLORS[p.position] || currentTheme.primary;
                return (
                  <tr 
                    key={p.player_id || idx} 
                    onClick={() => setSelectedPlayer(p)}
                    className={`hover:bg-zinc-800/40 cursor-pointer transition-colors ${isSelected ? 'bg-zinc-800/80 border-l-2' : ''}`}
                    style={isSelected ? { borderLeftColor: currentTheme.primary } : {}}
                  >
                    <td className="py-2.5 px-3 text-zinc-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: posColor }}></span>
                      <span>{p.player_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400">{p.recent_team || p.position}</td>
                    <td className="py-2.5 px-3 text-right text-zinc-200">
                      {xMeta?.format === 'pct' ? `${(p.x * 100).toFixed(1)}%` : p.x < 2 ? p.x.toFixed(2) : p.x.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black" style={{ color: currentTheme.primary }}>
                      {yMeta?.format === 'pct' ? `${(p.y * 100).toFixed(1)}%` : p.y < 2 ? p.y.toFixed(2) : p.y.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400">
                      {p.vorp}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

    </div>
  );
}

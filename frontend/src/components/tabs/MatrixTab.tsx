"use client";

import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, ReferenceArea, Cell
} from 'recharts';
import { Crosshair, Info, TrendingUp, AlertTriangle, Shield, Sparkles, ChevronRight, Trophy, Zap, Skull, History } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function MatrixTab({ matrixData: initialData }: { matrixData?: any[] }) {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [matrixData, setMatrixData] = useState<any[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setMatrixData(initialData);
      return;
    }
    if (!leagueId) return;

    async function fetchMatrix() {
      setIsLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setMatrixData(data);
        }
      } catch (err) {
        console.error("Failed to fetch matrix data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMatrix();
  }, [leagueId, initialData]);

  if (isLoading && matrixData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">Calculating Power Matrix...</p>
      </div>
    );
  }

  const getDotColor = (state: string) => {
    switch (state) {
      case 'Dynasty Juggernaut': return '#a855f7'; // Purple 500
      case 'All-In Contender': return currentTheme.primary; // Primary Accent
      case 'Rebuilding': return '#10b981'; // Emerald 500
      case 'Purgatory': return '#ef4444'; // Red 500
      case 'Middle of the Pack': return '#eab308'; // Yellow 500
      default: return '#94a3b8';
    }
  };

  const xValues = matrixData.map(d => d.max_pf).filter(v => typeof v === 'number');
  const yValues = matrixData.map(d => d.future_capital_score).filter(v => typeof v === 'number');
  
  const minX = xValues.length ? Math.floor(Math.min(...xValues) * 0.92) : 1000;
  const maxX = xValues.length ? Math.ceil(Math.max(...xValues) * 1.08) : 3000;
  const minY = yValues.length ? Math.max(0, Math.floor(Math.min(...yValues) * 0.85)) : 0;
  const maxY = yValues.length ? Math.ceil(Math.max(...yValues) * 1.15) : 10000;

  const xMedian = matrixData.length > 0 ? [...matrixData].sort((a,b) => a.max_pf - b.max_pf)[Math.floor(matrixData.length/2)]?.max_pf || 1500 : 1500;
  const yMedian = matrixData.length > 0 ? [...matrixData].sort((a,b) => a.future_capital_score - b.future_capital_score)[Math.floor(matrixData.length/2)]?.future_capital_score || 5000 : 5000;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl text-sm z-50 relative min-w-[210px] max-w-[280px]">
          <div className="flex items-center gap-3 mb-2.5 pb-2.5 border-b border-zinc-800">
            {p.avatar ? (
              <img src={`https://sleepercdn.com/avatars/${p.avatar}`} className="w-9 h-9 rounded-full border-2 border-zinc-700 object-cover" alt="avatar" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-xs">
                {p.team_name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="font-bold text-white text-sm truncate">{p.team_name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: getDotColor(p.lifecycle_state) }}>
                {p.lifecycle_state}
              </p>
            </div>
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-sans">Max PF</span>
              <span className="text-white font-bold">{p.max_pf?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-sans">Draft Capital</span>
              <span className="text-white font-bold">{p.future_capital_score?.toFixed(0)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-zinc-800 font-sans">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-0.5">Recommendation</p>
              <p className="font-bold text-emerald-400 text-xs">{p.action_recommendation}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      
      {/* Main Matrix Card */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        
        {/* Header and Legend */}
        <div className="mb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-2.5">
              <Crosshair size={26} style={{ color: currentTheme.primary }} /> POWER MATRIX
            </h3>
            <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
              Roster Production (Max PF) vs Future Draft Capital
            </p>
          </div>
          
          {/* Legend Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-bold bg-zinc-950 p-2 sm:p-2.5 rounded-xl border border-zinc-800/90">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentTheme.primary }}></span> Contender
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Juggernaut
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Rebuilder
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Purgatory
            </span>
          </div>
        </div>

        {/* 4-Quadrant Strategic Navigation HUD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="bg-purple-950/20 border border-purple-900/40 rounded-xl p-2.5 flex items-start gap-2">
            <Trophy size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider block">Top Right (Q1)</span>
              <p className="text-xs font-black text-purple-200 leading-tight">Championship Window</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">High Max PF • High Capital</p>
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-2.5 flex items-start gap-2">
            <Zap size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">Top Left (Q2)</span>
              <p className="text-xs font-black text-emerald-200 leading-tight">Productive Struggle</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Young Core • High Capital</p>
            </div>
          </div>

          <div className="bg-orange-950/20 border border-orange-900/40 rounded-xl p-2.5 flex items-start gap-2">
            <History size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[9px] font-mono text-orange-400 font-bold uppercase tracking-wider block">Bottom Right (Q4)</span>
              <p className="text-xs font-black text-orange-200 leading-tight">Aging Giant</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">High Max PF • Low Capital</p>
            </div>
          </div>

          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-2.5 flex items-start gap-2">
            <Skull size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider block">Bottom Left (Q3)</span>
              <p className="text-xs font-black text-red-200 leading-tight">The Abyss</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Low Max PF • Low Capital</p>
            </div>
          </div>
        </div>

        {/* Scatter Chart Container */}
        <div className="h-[360px] sm:h-[460px] md:h-[520px] w-full bg-zinc-950/90 p-2 sm:p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: -5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              
              {/* Subtle Quadrant Color Tint Areas */}
              <ReferenceArea 
                x1={xMedian} 
                x2={maxX}
                y1={yMedian} 
                y2={maxY}
                fill="#a855f7" 
                fillOpacity={0.04} 
              />
              <ReferenceArea 
                x1={minX} 
                x2={xMedian}
                y1={yMedian} 
                y2={maxY}
                fill="#10b981" 
                fillOpacity={0.04} 
              />
              <ReferenceArea 
                x1={minX} 
                x2={xMedian}
                y1={minY} 
                y2={yMedian}
                fill="#ef4444" 
                fillOpacity={0.04} 
              />
              <ReferenceArea 
                x1={xMedian} 
                x2={maxX}
                y1={minY} 
                y2={yMedian}
                fill="#f97316" 
                fillOpacity={0.04} 
              />

              <XAxis 
                type="number" 
                dataKey="max_pf" 
                name="Max PF" 
                domain={[minX, maxX]}
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                label={{ 
                  value: 'Roster Power (Max PF) →', 
                  position: 'bottom', 
                  offset: 10, 
                  fill: '#71717a', 
                  fontSize: 10,
                  fontWeight: 600
                }}
              />
              <YAxis 
                type="number" 
                dataKey="future_capital_score" 
                name="Draft Capital" 
                domain={[minY, maxY]}
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                label={{ 
                  value: 'Draft Capital Score →', 
                  angle: -90, 
                  position: 'left', 
                  offset: 5, 
                  fill: '#71717a', 
                  fontSize: 10,
                  fontWeight: 600
                }}
              />
              <ReferenceLine x={xMedian} stroke="#3f3f46" strokeDasharray="4 4" strokeWidth={1.5} />
              <ReferenceLine y={yMedian} stroke="#3f3f46" strokeDasharray="4 4" strokeWidth={1.5} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Scatter 
                name="Teams" 
                data={matrixData}
                onClick={(node) => setSelectedTeam(node.payload)}
                cursor="pointer"
              >
                {matrixData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getDotColor(entry.lifecycle_state)} 
                    stroke="#ffffff"
                    strokeWidth={selectedTeam?.roster_id === entry.roster_id ? 3 : 1.5}
                    r={selectedTeam?.roster_id === entry.roster_id ? 8 : 6}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Quick mobile hint */}
        <p className="text-[11px] text-zinc-500 font-mono text-center mt-3 block sm:hidden">
          💡 Tap dots to inspect team quadrant metrics below
        </p>
      </div>

      {/* League Directory / Team Quadrant Breakdown Grid */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <Shield size={20} style={{ color: currentTheme.primary }} />
            <h4 className="text-base font-bold text-white">League Roster Lifecycle Breakdown</h4>
          </div>
          <span className="text-xs font-mono text-zinc-400">{matrixData.length} Rosters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matrixData.map((team, idx) => {
            const isSelected = selectedTeam?.roster_id === team.roster_id;
            const dotColor = getDotColor(team.lifecycle_state);

            return (
              <div
                key={idx}
                onClick={() => setSelectedTeam(isSelected ? null : team)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-zinc-800/90 border-zinc-500 shadow-lg' 
                    : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {team.avatar ? (
                      <img src={`https://sleepercdn.com/avatars/${team.avatar}`} className="w-7 h-7 rounded-full border border-zinc-700 object-cover flex-shrink-0" alt="avatar" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0">
                        {team.team_name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <p className="font-bold text-white text-sm truncate">{team.team_name}</p>
                  </div>
                  
                  <span 
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex-shrink-0"
                    style={{ backgroundColor: `${dotColor}20`, color: dotColor, border: `1px solid ${dotColor}40` }}
                  >
                    {team.lifecycle_state}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-zinc-900">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-sans">Max PF:</span>{' '}
                    <span className="text-white font-bold">{team.max_pf?.toFixed(1)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 text-[10px] uppercase font-sans">Capital:</span>{' '}
                    <span className="text-white font-bold">{team.future_capital_score?.toFixed(0)}</span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">{team.action_recommendation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, ReferenceArea, Cell
} from 'recharts';
import { 
  Crosshair, Info, TrendingUp, AlertTriangle, Shield, Sparkles, 
  ChevronRight, Trophy, Zap, Skull, History, Crown, LayoutGrid, ListFilter
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';
import TacticalBriefingCard from '@/components/ui/TacticalBriefingCard';
import MetricExplainer from '@/components/ui/MetricExplainer';

export default function MatrixTab({ matrixData: initialData }: { matrixData?: any[] }) {
  const { leagueId, leagueName } = useLeague();
  const { currentTheme } = useTheme();
  const [matrixData, setMatrixData] = useState<any[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'quadrant_grid' | 'list'>('quadrant_grid');

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
      case 'All-In Contender': return '#f59e0b'; // Amber 500
      case 'Rebuilding': return '#10b981'; // Emerald 500
      case 'Purgatory': return '#ef4444'; // Red 500
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

  // Group teams by exact 4 quadrants matching backend quant lifecycle states
  const quadrantTeams = {
    topLeft: matrixData.filter(t => t.lifecycle_state === 'Rebuilding'),
    topRight: matrixData.filter(t => t.lifecycle_state === 'Dynasty Juggernaut'),
    bottomLeft: matrixData.filter(t => t.lifecycle_state === 'Purgatory'),
    bottomRight: matrixData.filter(t => t.lifecycle_state === 'All-In Contender')
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl text-sm z-50 relative min-w-[220px] max-w-[290px]">
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
              <span className="text-zinc-400 font-sans">Max PF (Power)</span>
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

  const renderTeamCard = (team: any) => {
    const isSelected = selectedTeam?.roster_id === team.roster_id;
    const dotColor = getDotColor(team.lifecycle_state);

    return (
      <div
        key={team.roster_id}
        onClick={() => setSelectedTeam(isSelected ? null : team)}
        className={`p-3 rounded-xl border transition-all cursor-pointer ${
          isSelected 
            ? 'bg-zinc-800/95 border-zinc-400 shadow-xl scale-[1.02]' 
            : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            {team.avatar ? (
              <img src={`https://sleepercdn.com/avatars/${team.avatar}`} className="w-6 h-6 rounded-full border border-zinc-700 object-cover flex-shrink-0" alt="avatar" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0">
                {team.team_name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <p className="font-bold text-white text-xs truncate">{team.team_name}</p>
          </div>
          
          <span 
            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex-shrink-0"
            style={{ backgroundColor: `${dotColor}20`, color: dotColor, border: `1px solid ${dotColor}40` }}
          >
            {team.lifecycle_state}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 text-[11px] font-mono pt-1.5 border-t border-zinc-900">
          <div>
            <span className="text-zinc-500 text-[9px] uppercase font-sans">Max PF:</span>{' '}
            <span className="text-white font-bold">{team.max_pf?.toFixed(1)}</span>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 text-[9px] uppercase font-sans">Cap:</span>{' '}
            <span className="text-white font-bold">{team.future_capital_score?.toFixed(0)}</span>
          </div>
        </div>

        <div className="mt-1.5 text-[10px] text-zinc-400 font-sans flex items-center gap-1">
          <span className="text-emerald-400 font-semibold truncate">{team.action_recommendation}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3.5 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* ── TACTICAL BRIEFING GUIDE ─────────────────────────────────────────── */}
      <TacticalBriefingCard
        title="Dynasty Lifecycle Matrix: Reading the 4 Strategic Quadrants"
        subtitle="Where your franchise stands in multi-year championship contention vs rebuilding"
        badge="STRATEGIC WAR MAP"
        points={[
          {
            icon: Crosshair,
            label: "1. The 4 Quadrants",
            text: "Top-Right = Apex Juggernaut (High points + High picks). Bottom-Right = All-In Contender. Top-Left = Rebuilder. Bottom-Left = Dynasty Purgatory.",
            color: "#a855f7"
          },
          {
            icon: Zap,
            label: "2. Why Max PF (X-Axis)",
            text: "Max PF calculates what your roster scores with mathematically optimal weekly lineups, stripping away lucky head-to-head records and benching errors.",
            color: "#38bdf8"
          },
          {
            icon: Shield,
            label: "3. The Tactical Play",
            text: "Never stay in Purgatory (bottom-left). If you aren't a top-3 contender, immediately sell aging veterans for future 1st round draft capital.",
            color: "#34d399"
          }
        ]}
      />

      {/* ── MAIN 2x2 VISUAL MATRIX GRAPH ─────────────────────────────────── */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden">
        
        {/* Header and Filter Legend */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm">
                <Crosshair size={12} className="text-purple-400" />
                QUANT POWER MATRIX · 2X2 MAP
              </span>
              <span className="text-xs font-mono text-zinc-400">{leagueName}</span>
              <MetricExplainer term="true_power_matrix" size="xs" />
            </div>
            <h3 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight flex items-center gap-3">
              <span>DYNASTY LIFECYCLE MATRIX</span>
            </h3>
            <div className="flex items-center gap-3 text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
              <span className="flex items-center gap-1">
                Horizontal: Roster Output (Max PF) <MetricExplainer term="max_pf" size="xs" />
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                Vertical: Draft Capital (Picks) <MetricExplainer term="draft_capital" size="xs" />
              </span>
            </div>
          </div>
          
          {/* Interactive Legend Filters (Responsive Grid on Mobile - Zero Horizontal Scrolling) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold bg-zinc-950 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-zinc-800/90 shadow-inner">
            <button
              onClick={() => setSelectedQuadrant(selectedQuadrant === 'juggernaut' ? null : 'juggernaut')}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg sm:rounded-xl transition-all ${
                selectedQuadrant === 'juggernaut' ? 'bg-purple-500/30 border border-purple-500/60 text-purple-200 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span> <span className="truncate">Juggernaut ({quadrantTeams.topRight.length})</span>
            </button>
            <button
              onClick={() => setSelectedQuadrant(selectedQuadrant === 'rebuild' ? null : 'rebuild')}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg sm:rounded-xl transition-all ${
                selectedQuadrant === 'rebuild' ? 'bg-emerald-500/30 border border-emerald-500/60 text-emerald-200 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span> <span className="truncate">Rebuilding ({quadrantTeams.topLeft.length})</span>
            </button>
            <button
              onClick={() => setSelectedQuadrant(selectedQuadrant === 'contender' ? null : 'contender')}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg sm:rounded-xl transition-all ${
                selectedQuadrant === 'contender' ? 'bg-amber-500/30 border border-amber-500/60 text-amber-200 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span> <span className="truncate">Contender ({quadrantTeams.bottomRight.length})</span>
            </button>
            <button
              onClick={() => setSelectedQuadrant(selectedQuadrant === 'purgatory' ? null : 'purgatory')}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg sm:rounded-xl transition-all ${
                selectedQuadrant === 'purgatory' ? 'bg-red-500/30 border border-red-500/60 text-red-200 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span> <span className="truncate">Purgatory ({quadrantTeams.bottomLeft.length})</span>
            </button>
          </div>
        </div>

        {/* ── 2x2 STRATEGIC QUADRANT HUD (MATCHES VISUAL GRAPH CORNERS) ─── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          
          {/* Top-Left Quadrant HUD: Rebuilding / Productive Struggle */}
          <div 
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'rebuild' ? null : 'rebuild')}
            className={`border rounded-2xl p-3 flex items-start justify-between gap-2 cursor-pointer transition-all ${
              selectedQuadrant === 'rebuild' ? 'bg-emerald-950/60 border-emerald-500 shadow-lg' : 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Zap size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                  TOP-LEFT (Q2)
                </span>
                <p className="text-xs sm:text-sm font-black text-emerald-200 leading-tight">
                  Productive Struggle
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 hidden sm:block">Low Max PF • High Draft Capital</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black">
              {quadrantTeams.topLeft.length}
            </span>
          </div>

          {/* Top-Right Quadrant HUD: Dynasty Juggernaut */}
          <div 
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'juggernaut' ? null : 'juggernaut')}
            className={`border rounded-2xl p-3 flex items-start justify-between gap-2 cursor-pointer transition-all ${
              selectedQuadrant === 'juggernaut' ? 'bg-purple-950/60 border-purple-500 shadow-lg' : 'bg-purple-950/20 border-purple-900/40 hover:border-purple-700/60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Crown size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider block">
                  TOP-RIGHT (Q1)
                </span>
                <p className="text-xs sm:text-sm font-black text-purple-200 leading-tight">
                  Dynasty Juggernaut
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 hidden sm:block">High Max PF • High Draft Capital</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-black">
              {quadrantTeams.topRight.length}
            </span>
          </div>

          {/* Bottom-Left Quadrant HUD: The Abyss / Purgatory */}
          <div 
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'purgatory' ? null : 'purgatory')}
            className={`border rounded-2xl p-3 flex items-start justify-between gap-2 cursor-pointer transition-all ${
              selectedQuadrant === 'purgatory' ? 'bg-red-950/60 border-red-500 shadow-lg' : 'bg-red-950/20 border-red-900/40 hover:border-red-700/60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Skull size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider block">
                  BOTTOM-LEFT (Q3)
                </span>
                <p className="text-xs sm:text-sm font-black text-red-200 leading-tight">
                  The Abyss / Retool
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 hidden sm:block">Low Max PF • Low Draft Capital</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono text-xs font-black">
              {quadrantTeams.bottomLeft.length}
            </span>
          </div>

          {/* Bottom-Right Quadrant HUD: All-In Contender */}
          <div 
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'contender' ? null : 'contender')}
            className={`border rounded-2xl p-3 flex items-start justify-between gap-2 cursor-pointer transition-all ${
              selectedQuadrant === 'contender' ? 'bg-amber-950/60 border-amber-500 shadow-lg' : 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Trophy size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                  BOTTOM-RIGHT (Q4)
                </span>
                <p className="text-xs sm:text-sm font-black text-amber-200 leading-tight">
                  All-In Contender
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 hidden sm:block">High Max PF • Low Draft Capital</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-black">
              {quadrantTeams.bottomRight.length}
            </span>
          </div>

        </div>

        {/* Scatter Chart Container */}
        <div className="h-[360px] sm:h-[460px] md:h-[520px] w-full bg-zinc-950/95 p-2 sm:p-4 rounded-2xl border border-zinc-800 relative overflow-hidden shadow-inner">
          
          {/* Corner Watermark Badges to make visual alignment unmistakable */}
          <div className="absolute top-3 left-4 pointer-events-none opacity-40 flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 uppercase">
            <Zap size={11} /> <span>Q2: PRODUCTIVE STRUGGLE</span>
          </div>
          <div className="absolute top-3 right-4 pointer-events-none opacity-40 flex items-center gap-1 text-[10px] font-mono font-bold text-purple-400 uppercase">
            <Crown size={11} /> <span>Q1: DYNASTY JUGGERNAUT</span>
          </div>
          <div className="absolute bottom-9 left-4 pointer-events-none opacity-40 flex items-center gap-1 text-[10px] font-mono font-bold text-red-400 uppercase">
            <Skull size={11} /> <span>Q3: THE ABYSS</span>
          </div>
          <div className="absolute bottom-9 right-4 pointer-events-none opacity-40 flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 uppercase">
            <Trophy size={11} /> <span>Q4: ALL-IN CONTENDER</span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 25, right: 25, bottom: 30, left: -5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              
              {/* Subtle Quadrant Color Tint Areas */}
              <ReferenceArea 
                x1={xMedian} 
                x2={maxX}
                y1={yMedian} 
                y2={maxY}
                fill="#a855f7" 
                fillOpacity={selectedQuadrant === 'juggernaut' ? 0.12 : 0.04} 
              />
              <ReferenceArea 
                x1={minX} 
                x2={xMedian}
                y1={yMedian} 
                y2={maxY}
                fill="#10b981" 
                fillOpacity={selectedQuadrant === 'rebuild' ? 0.12 : 0.04} 
              />
              <ReferenceArea 
                x1={minX} 
                x2={xMedian}
                y1={minY} 
                y2={yMedian}
                fill="#ef4444" 
                fillOpacity={selectedQuadrant === 'purgatory' ? 0.12 : 0.04} 
              />
              <ReferenceArea 
                x1={xMedian} 
                x2={maxX}
                y1={minY} 
                y2={yMedian}
                fill="#f59e0b" 
                fillOpacity={selectedQuadrant === 'contender' ? 0.12 : 0.04} 
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
                {matrixData.map((entry, index) => {
                  const isSelected = selectedTeam?.roster_id === entry.roster_id;
                  const isHighlighted = !selectedQuadrant || 
                    (selectedQuadrant === 'juggernaut' && entry.lifecycle_state === 'Dynasty Juggernaut') ||
                    (selectedQuadrant === 'rebuild' && entry.lifecycle_state === 'Rebuilding') ||
                    (selectedQuadrant === 'contender' && entry.lifecycle_state === 'All-In Contender') ||
                    (selectedQuadrant === 'purgatory' && entry.lifecycle_state === 'Purgatory');

                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getDotColor(entry.lifecycle_state)} 
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 1.5}
                      opacity={isHighlighted ? 1 : 0.25}
                      r={isSelected ? 9 : 6}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Mobile tap hint */}
        <p className="text-[11px] text-zinc-500 font-mono text-center mt-3 block sm:hidden">
          Tap any dot or quadrant card to filter teams below
        </p>
      </div>

      {/* ── MATCHING 2x2 QUADRANT BREAKDOWN GRID ────────────────────────── */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-4 sm:p-7 shadow-2xl space-y-6">
        
        {/* Section Header with View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <LayoutGrid size={22} className="text-purple-400" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-bold text-white">2x2 Quadrant Breakdown</h4>
              <p className="text-zinc-400 text-xs font-mono">
                Teams grouped by their exact position on the Power Matrix graph
              </p>
            </div>
          </div>

          <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800 shadow-inner self-start sm:self-auto">
            <button
              onClick={() => setViewMode('quadrant_grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'quadrant_grid' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={13} />
              <span>2x2 Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ListFilter size={13} />
              <span>Ranked List</span>
            </button>
          </div>
        </div>

        {/* Mode A: 2x2 Spatial Quadrant Box Layout (Directly mirrors graph) */}
        {viewMode === 'quadrant_grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Box 1 (Top-Left): Productive Struggle / Rebuilders */}
            <div className="bg-zinc-950/70 border-2 border-emerald-900/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-emerald-900/30">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-emerald-400" />
                    <span className="font-black text-sm text-emerald-300 uppercase font-mono">
                      Top-Left: Productive Struggle
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    {quadrantTeams.topLeft.length} Rosters
                  </span>
                </div>
                <div className="space-y-2">
                  {quadrantTeams.topLeft.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-3 text-center">No rosters currently in this quadrant.</p>
                  ) : (
                    quadrantTeams.topLeft.map(renderTeamCard)
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 text-[10px] font-mono text-zinc-500 border-t border-zinc-900">
                Low Max PF · High Draft Capital Equity
              </div>
            </div>

            {/* Box 2 (Top-Right): Dynasty Juggernauts */}
            <div className="bg-zinc-950/70 border-2 border-purple-900/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-purple-900/30">
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-purple-400" />
                    <span className="font-black text-sm text-purple-300 uppercase font-mono">
                      Top-Right: Dynasty Juggernaut
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                    {quadrantTeams.topRight.length} Rosters
                  </span>
                </div>
                <div className="space-y-2">
                  {quadrantTeams.topRight.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-3 text-center">No rosters currently in this quadrant.</p>
                  ) : (
                    quadrantTeams.topRight.map(renderTeamCard)
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 text-[10px] font-mono text-zinc-500 border-t border-zinc-900">
                High Max PF · High Draft Capital Equity
              </div>
            </div>

            {/* Box 3 (Bottom-Left): The Abyss / Purgatory */}
            <div className="bg-zinc-950/70 border-2 border-red-900/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-red-900/30">
                  <div className="flex items-center gap-2">
                    <Skull size={16} className="text-red-400" />
                    <span className="font-black text-sm text-red-300 uppercase font-mono">
                      Bottom-Left: The Abyss / Purgatory
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono text-[10px] font-bold">
                    {quadrantTeams.bottomLeft.length} Rosters
                  </span>
                </div>
                <div className="space-y-2">
                  {quadrantTeams.bottomLeft.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-3 text-center">No rosters currently in this quadrant.</p>
                  ) : (
                    quadrantTeams.bottomLeft.map(renderTeamCard)
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 text-[10px] font-mono text-zinc-500 border-t border-zinc-900">
                Low Max PF · Low Draft Capital Equity
              </div>
            </div>

            {/* Box 4 (Bottom-Right): All-In Contenders */}
            <div className="bg-zinc-950/70 border-2 border-amber-900/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-amber-900/30">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" />
                    <span className="font-black text-sm text-amber-300 uppercase font-mono">
                      Bottom-Right: All-In Contender
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                    {quadrantTeams.bottomRight.length} Rosters
                  </span>
                </div>
                <div className="space-y-2">
                  {quadrantTeams.bottomRight.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-3 text-center">No rosters currently in this quadrant.</p>
                  ) : (
                    quadrantTeams.bottomRight.map(renderTeamCard)
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 text-[10px] font-mono text-zinc-500 border-t border-zinc-900">
                High Max PF · Low Draft Capital Equity
              </div>
            </div>

          </div>
        ) : (
          /* Mode B: Ranked List View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matrixData.map(renderTeamCard)}
          </div>
        )}

      </div>

    </div>
  );
}


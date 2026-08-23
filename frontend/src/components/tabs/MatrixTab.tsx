"use client";

import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { Crosshair, Info, TrendingUp, AlertTriangle } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function MatrixTab({ matrixData: initialData }: { matrixData?: any[] }) {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [matrixData, setMatrixData] = useState<any[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);

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
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
      </div>
    );
  }

  const getDotColor = (state: string) => {
    switch (state) {
      case 'Dynasty Juggernaut': return '#8b5cf6'; // Violet 500
      case 'All-In Contender': return currentTheme.primary; // Accent color
      case 'Rebuilding': return '#10b981'; // Emerald 500
      case 'Purgatory': return '#ef4444'; // Red 500
      case 'Middle of the Pack': return '#eab308'; // Yellow 500
      default: return '#94a3b8';
    }
  };

  const xMedian = matrixData.length > 0 ? [...matrixData].sort((a,b) => a.max_pf - b.max_pf)[Math.floor(matrixData.length/2)]?.max_pf || 1500 : 1500;
  const yMedian = matrixData.length > 0 ? [...matrixData].sort((a,b) => a.future_capital_score - b.future_capital_score)[Math.floor(matrixData.length/2)]?.future_capital_score || 5000 : 5000;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl text-sm z-50 relative min-w-[220px]">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-800">
            {p.avatar && <img src={`https://sleepercdn.com/avatars/${p.avatar}`} className="w-10 h-10 rounded-full border-2 border-zinc-700" alt="avatar" />}
            <div>
              <p className="font-bold text-white text-base">{p.team_name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: currentTheme.primary }}>
                {p.lifecycle_state}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Max PF</span>
              <span className="text-white font-mono font-bold">{p.max_pf?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Draft Capital</span>
              <span className="text-white font-mono font-bold">{p.future_capital_score?.toFixed(0)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Recommendation</p>
              <p className="font-bold text-emerald-400 text-xs">{p.action_recommendation}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
              <Crosshair size={28} style={{ color: currentTheme.primary }} /> POWER MATRIX
            </h3>
            <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
              Roster Production vs Future Draft Capital (Quadrants defined by league medians)
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentTheme.primary }}></span> Contender</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Juggernaut</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Rebuilder</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Purgatory</span>
          </div>
        </div>

        <div className="h-[440px] md:h-[520px] w-full bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 relative">
          {/* Quadrant Labels */}
          <div className="absolute top-6 right-6 text-right pointer-events-none z-0">
            <span className="text-[11px] font-black uppercase tracking-widest text-purple-400/50 bg-purple-950/20 px-2.5 py-1 rounded-md border border-purple-900/30">
              Championship Window
            </span>
          </div>
          <div className="absolute top-6 left-16 pointer-events-none z-0">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400/50 bg-emerald-950/20 px-2.5 py-1 rounded-md border border-emerald-900/30">
              Productive Struggle
            </span>
          </div>
          <div className="absolute bottom-16 left-16 pointer-events-none z-0">
            <span className="text-[11px] font-black uppercase tracking-widest text-red-400/50 bg-red-950/20 px-2.5 py-1 rounded-md border border-red-900/30">
              The Abyss (Purgatory)
            </span>
          </div>
          <div className="absolute bottom-16 right-6 text-right pointer-events-none z-0">
            <span className="text-[11px] font-black uppercase tracking-widest text-orange-400/50 bg-orange-950/20 px-2.5 py-1 rounded-md border border-orange-900/30">
              Aging Giant (Retool)
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis 
                type="number" 
                dataKey="max_pf" 
                name="Max PF" 
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                label={{ value: 'Roster Power (Max PF) →', position: 'bottom', offset: 10, fill: '#71717a', fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="future_capital_score" 
                name="Draft Capital" 
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                label={{ value: 'Future Capital Score →', angle: -90, position: 'left', offset: 0, fill: '#71717a', fontSize: 11 }}
              />
              <ReferenceLine x={xMedian} stroke="#3f3f46" strokeDasharray="4 4" strokeWidth={1.5} />
              <ReferenceLine y={yMedian} stroke="#3f3f46" strokeDasharray="4 4" strokeWidth={1.5} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Scatter name="Teams" data={matrixData}>
                {matrixData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getDotColor(entry.lifecycle_state)} 
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

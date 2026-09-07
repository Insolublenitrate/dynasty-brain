"use client";

import { useState, useEffect } from 'react';
import { Radar as RadarIcon, Search } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import SeasonSelector from '@/components/SeasonSelector';
import { getApiUrl } from '@/config/api';

const RADAR_METRICS = [
  { key: 'target_rate', label: 'Target Rate', max: 0.35 },
  { key: 'catch_rate', label: 'Catch Rate', max: 1.0 },
  { key: 'yprr_approx', label: 'YPRR', max: 3.5 },
  { key: 'ppg', label: 'PPG', max: 25.0 },
  { key: 'offense_pct', label: 'Snap %', max: 100.0 },
];

export default function PlayerCompareTab({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const { currentTheme } = useTheme();
  const [playersData, setPlayersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [player1Search, setPlayer1Search] = useState('Justin Jefferson');
  const [player2Search, setPlayer2Search] = useState('CeeDee Lamb');
  
  const [player1, setPlayer1] = useState<any>(null);
  const [player2, setPlayer2] = useState<any>(null);
  const [seasonYear, setSeasonYear] = useState("2024");

  const { leagueId, isLoading: isLeagueLoading } = useLeague();
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=${seasonYear}`);
        const json = await res.json();
        setPlayersData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [seasonYear]);

  useEffect(() => {
    if (playersData.length > 0) {
      const p1 = playersData.find(p => p.player_name.toLowerCase().includes(player1Search.toLowerCase()));
      const p2 = playersData.find(p => p.player_name.toLowerCase().includes(player2Search.toLowerCase()));
      if (p1) setPlayer1(p1);
      if (p2) setPlayer2(p2);
    }
  }, [playersData, player1Search, player2Search]);

  const normalizeData = () => {
    if (!player1 || !player2) return [];
    
    return RADAR_METRICS.map(metric => {
      // Normalize to 0-100 scale based on defined max values for a clean radar chart
      const val1 = Math.min((player1[metric.key] / metric.max) * 100, 100);
      const val2 = Math.min((player2[metric.key] / metric.max) * 100, 100);
      
      return {
        subject: metric.label,
        A: val1 || 0,
        B: val2 || 0,
        fullMark: 100,
        rawA: player1[metric.key] || 0,
        rawB: player2[metric.key] || 0
      };
    });
  };

  const chartData = normalizeData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-lg shadow-xl text-sm">
          <p className="font-bold text-zinc-100 mb-2">{label}</p>
          <p className="text-amber-400">
            {player1?.player_name}: {payload[0].payload.rawA.toFixed(2)}
          </p>
          <p className="text-rose-400">
            {player2?.player_name}: {payload[1].payload.rawB.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLeagueLoading) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-3 sm:space-y-5 h-full flex flex-col">
      {!hideHeader && (
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <RadarIcon className="text-amber-500" size={24} /> Player Radar
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 mb-3">Compare player profiles side-by-side using multi-dimensional radar charts.</p>
          <SeasonSelector value={seasonYear} onChange={setSeasonYear} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
          <label className="text-sm font-medium text-zinc-400">Player 1 (Blue)</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
            <input 
              type="text" 
              value={player1Search}
              onChange={e => setPlayer1Search(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Search player..."
            />
          </div>
          {player1 && <p className="text-xs text-amber-400 mt-1">Found: {player1.player_name} ({player1.recent_team})</p>}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
          <label className="text-sm font-medium text-zinc-400">Player 2 (Red)</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
            <input 
              type="text" 
              value={player2Search}
              onChange={e => setPlayer2Search(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Search player..."
            />
          </div>
          {player2 && <p className="text-xs text-rose-400 mt-1">Found: {player2.player_name} ({player2.recent_team})</p>}
        </div>
      </div>

      <div className="w-full h-[360px] sm:h-[460px] bg-zinc-900 border border-zinc-800 rounded-xl p-2 sm:p-4 relative">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : (!player1 || !player2) ? (
          <div className="flex h-full items-center justify-center text-zinc-500 text-xs sm:text-sm">
            Search for two valid players to display radar chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 11}} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name={player1.player_name} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              <Radar name={player2.player_name} dataKey="B" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Direct Head-to-Head Stat Comparison Breakdown */}
      {player1 && player2 && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 sm:p-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <span className="text-[11px] font-mono font-bold text-indigo-400 truncate max-w-[40%]">
              {player1.player_name} ({player1.recent_team || 'FA'})
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
              VS
            </span>
            <span className="text-[11px] font-mono font-bold text-rose-400 truncate max-w-[40%] text-right">
              {player2.player_name} ({player2.recent_team || 'FA'})
            </span>
          </div>

          <div className="divide-y divide-zinc-800/60 font-mono text-xs">
            {RADAR_METRICS.map(m => {
              const val1 = player1[m.key] ?? 0;
              const val2 = player2[m.key] ?? 0;
              const isP1Higher = val1 > val2;
              const isP2Higher = val2 > val1;
              const formatVal = (v: number) => {
                if (m.key === 'target_rate' || m.key === 'catch_rate') {
                  return `${(v * 100).toFixed(1)}%`;
                }
                if (m.key === 'offense_pct') {
                  return `${v.toFixed(1)}%`;
                }
                return v.toFixed(2);
              };
              return (
                <div key={m.key} className="py-2 flex items-center justify-between gap-2">
                  <span className={`w-20 sm:w-28 text-left font-bold ${isP1Higher ? 'text-indigo-400 font-black' : 'text-zinc-400'}`}>
                    {formatVal(val1)} {isP1Higher && '▲'}
                  </span>
                  <span className="text-[11px] text-zinc-300 font-sans text-center flex-1 font-semibold truncate">
                    {m.label}
                  </span>
                  <span className={`w-20 sm:w-28 text-right font-bold ${isP2Higher ? 'text-rose-400 font-black' : 'text-zinc-400'}`}>
                    {isP2Higher && '▲'} {formatVal(val2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { Radar as RadarIcon, Search } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useLeague } from '@/context/LeagueContext';
import { useRouter } from 'next/navigation';

const RADAR_METRICS = [
  { key: 'target_rate', label: 'Target Rate', max: 0.35 },
  { key: 'catch_rate', label: 'Catch Rate', max: 1.0 },
  { key: 'yprr_approx', label: 'YPRR', max: 3.5 },
  { key: 'ppg', label: 'PPG', max: 25.0 },
  { key: 'offense_pct', label: 'Snap %', max: 1.0 },
];

export default function PlayerRadar() {
  const [playersData, setPlayersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [player1Search, setPlayer1Search] = useState('Justin Jefferson');
  const [player2Search, setPlayer2Search] = useState('CeeDee Lamb');
  
  const [player1, setPlayer1] = useState<any>(null);
  const [player2, setPlayer2] = useState<any>(null);

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
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=2025`);
        const json = await res.json();
        setPlayersData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [leagueId, isLeagueLoading, router]);

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
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl text-sm">
          <p className="font-bold text-slate-100 mb-2">{label}</p>
          <p className="text-indigo-400">
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
    <div className="max-w-6xl mx-auto space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <RadarIcon className="text-indigo-500" /> Player Radar
        </h1>
        <p className="text-slate-400 mt-2">Compare player profiles side-by-side using multi-dimensional radar charts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <label className="text-sm font-medium text-slate-400">Player 1 (Blue)</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input 
              type="text" 
              value={player1Search}
              onChange={e => setPlayer1Search(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search player..."
            />
          </div>
          {player1 && <p className="text-xs text-indigo-400 mt-1">Found: {player1.player_name} ({player1.recent_team})</p>}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <label className="text-sm font-medium text-slate-400">Player 2 (Red)</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input 
              type="text" 
              value={player2Search}
              onChange={e => setPlayer2Search(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Search player..."
            />
          </div>
          {player2 && <p className="text-xs text-rose-400 mt-1">Found: {player2.player_name} ({player2.recent_team})</p>}
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-8 min-h-[500px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (!player1 || !player2) ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Search for two valid players to display radar chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 12}} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name={player1.player_name} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              <Radar name={player2.player_name} dataKey="B" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

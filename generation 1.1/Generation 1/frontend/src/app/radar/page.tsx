"use client";

import { useState, useEffect } from 'react';
import { Radar as RadarIcon, Search, AlertTriangle } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useLeague } from '@/context/LeagueContext';
import { useRouter } from 'next/navigation';
import SeasonSelector from '@/components/SeasonSelector';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [player1Search, setPlayer1Search] = useState('J.Chase');
  const [player2Search, setPlayer2Search] = useState('A.St. Brown');
  
  const [player1, setPlayer1] = useState<any>(null);
  const [player2, setPlayer2] = useState<any>(null);

  const { leagueId, isLoading: isLeagueLoading, seasonYear } = useLeague();
  const router = useRouter();

  useEffect(() => {
    if (isLeagueLoading) return;
    if (!leagueId) {
      router.push('/login');
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=${seasonYear}`);
        if (!res.ok) throw new Error("Failed to fetch from backend");
        const json = await res.json();
        if (json.error || !Array.isArray(json)) {
          console.error("Backend returned error or non-array:", json);
          setErrorMsg(json.error || "Failed to load player data.");
          setPlayersData([]);
        } else {
          setPlayersData(json);
          setErrorMsg(null);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Network error or backend is down.");
        setPlayersData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [leagueId, isLeagueLoading, router, seasonYear]);

  // Re-sync player objects when season (and thus playersData) changes
  useEffect(() => {
    if (playersData.length > 0) {
      if (!player1 && !player2) {
        // Initial load default players
        const p1 = playersData.find(p => p.player_name?.toLowerCase().includes('chase'));
        const p2 = playersData.find(p => p.player_name?.toLowerCase().includes('st. brown'));
        if (p1) setPlayer1(p1);
        if (p2) setPlayer2(p2);
      } else {
        // Season changed, find same players in new data
        if (player1) {
          const newP1 = playersData.find(p => p.player_name === player1.player_name);
          if (newP1) setPlayer1(newP1);
        }
        if (player2) {
          const newP2 = playersData.find(p => p.player_name === player2.player_name);
          if (newP2) setPlayer2(newP2);
        }
      }
    }
  }, [playersData]);

  const normalizeData = () => {
    if (!player1 || !player2) return [];
    
    return RADAR_METRICS.map(metric => {
      // Normalize to 0-100 scale based on defined max values for a clean radar chart
      const val1 = Math.min(((player1[metric.key] || 0) / metric.max) * 100, 100);
      const val2 = Math.min(((player2[metric.key] || 0) / metric.max) * 100, 100);
      
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

  const CustomTooltip = ({ active, payload, label }: { active?: any, payload?: any, label?: any }) => {
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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <RadarIcon className="text-indigo-500" /> Player Radar
          </h1>
          {!loading && !errorMsg && (
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
              {playersData.length} players loaded
            </span>
          )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-slate-400">Compare player profiles side-by-side using multi-dimensional radar charts.</p>
          <SeasonSelector />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 relative">
          <label className="text-sm font-medium text-slate-400">Player 1 (Blue)</label>
          <div className="relative">
            <button 
              className="absolute left-3 top-2.5 text-slate-500 hover:text-indigo-400 cursor-pointer"
              onClick={() => {
                const p = playersData.find(p => p.player_name?.toLowerCase().includes(player1Search.toLowerCase().trim()));
                setPlayer1(p || null);
              }}
            >
              <Search size={18} />
            </button>
            <input 
              type="text" 
              value={player1Search}
              onChange={e => {
                setPlayer1Search(e.target.value);
                if (e.target.value.trim().length > 2) {
                  const p = playersData.find(p => p.player_name?.toLowerCase().includes(e.target.value.toLowerCase().trim()));
                  setPlayer1(p || null);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              placeholder="Search player..."
            />
          </div>
          {player1 && <p className="text-xs text-indigo-400 mt-1">Found: {player1.player_name} ({player1.recent_team})</p>}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 relative">
          <label className="text-sm font-medium text-slate-400">Player 2 (Red)</label>
          <div className="relative">
            <button 
              className="absolute left-3 top-2.5 text-slate-500 hover:text-rose-400 cursor-pointer"
              onClick={() => {
                const p = playersData.find(p => p.player_name?.toLowerCase().includes(player2Search.toLowerCase().trim()));
                setPlayer2(p || null);
              }}
            >
              <Search size={18} />
            </button>
            <input 
              type="text" 
              value={player2Search}
              onChange={e => {
                setPlayer2Search(e.target.value);
                if (e.target.value.trim().length > 2) {
                  const p = playersData.find(p => p.player_name?.toLowerCase().includes(e.target.value.toLowerCase().trim()));
                  setPlayer2(p || null);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-rose-500"
              placeholder="Search player..."
            />
          </div>
          {player2 && <p className="text-xs text-rose-400 mt-1">Found: {player2.player_name} ({player2.recent_team})</p>}
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-8 overflow-x-auto">
        {loading ? (
          <div className="flex h-[350px] md:h-[500px] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col h-[350px] md:h-[500px] items-center justify-center text-rose-500 gap-2">
            <AlertTriangle size={32} />
            <p className="font-semibold">{errorMsg}</p>
            <p className="text-sm text-slate-400">The player database may still be syncing in the background. Please wait a few seconds and try again.</p>
          </div>
        ) : (!player1 || !player2) ? (
          <div className="flex h-[350px] md:h-[500px] items-center justify-center text-slate-500">
            Search for two valid players to display radar chart.
          </div>
        ) : (
          <div className="space-y-12">
            <div className="h-[350px] md:h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="55%" data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 12}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={player1.player_name} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  <Radar name={player2.player_name} dataKey="B" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Tale of the Tape Section */}
            <div className="mt-8 border-t border-slate-800 pt-8">
              <h2 className="text-2xl font-bold text-white text-center mb-8 uppercase tracking-widest text-slate-300">Tale of the Tape</h2>
              <div className="space-y-6 max-w-4xl mx-auto">
                {[
                  { label: "Targets", key: "targets" },
                  { label: "Redzone Targets", key: "redzone_targets" },
                  { label: "Receptions", key: "receptions" },
                  { label: "Receiving Yards", key: "receiving_yards" },
                  { label: "Air Yards / Target", key: "air_yards_per_target", isFloat: true },
                  { label: "YAC / Reception", key: "yac_per_reception", isFloat: true },
                  { label: "Rush Attempts", key: "rush_attempts" },
                  { label: "Redzone Rush Att", key: "redzone_rush_attempts" },
                  { label: "Rushing Yards", key: "rushing_yards" },
                ].map(metric => {
                  const val1 = player1[metric.key] || 0;
                  const val2 = player2[metric.key] || 0;
                  const maxVal = Math.max(val1, val2) || 1; // Prevent division by zero
                  const w1 = (val1 / maxVal) * 100;
                  const w2 = (val2 / maxVal) * 100;
                  const display1 = metric.isFloat ? val1.toFixed(1) : val1;
                  const display2 = metric.isFloat ? val2.toFixed(1) : val2;

                  return (
                    <div key={metric.key} className="flex flex-col items-center">
                      <div className="w-full flex justify-between text-sm mb-1 font-semibold">
                        <span className="text-indigo-400 w-16 text-left">{display1}</span>
                        <span className="text-slate-300 uppercase tracking-wider text-xs">{metric.label}</span>
                        <span className="text-rose-400 w-16 text-right">{display2}</span>
                      </div>
                      <div className="w-full flex h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-1/2 flex justify-end bg-slate-950">
                          <div 
                            className="h-full bg-indigo-500 rounded-l-full transition-all duration-500" 
                            style={{ width: `${w1}%` }} 
                          />
                        </div>
                        <div className="w-1/2 flex justify-start bg-slate-950 border-l border-slate-800">
                          <div 
                            className="h-full bg-rose-500 rounded-r-full transition-all duration-500" 
                            style={{ width: `${w2}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

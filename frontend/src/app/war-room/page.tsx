"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Flame, Play, Terminal, Zap, Activity, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { GitCompareArrows } from 'lucide-react';

const SCENARIOS = [
  "MATCHUP PREVIEW",
  "TRADE AUTOPSY",
  "BENCH BLUNDER (Shoulda/Coulda)"
];

export default function WarRoomPage() {
  const { leagueId, isLoading: isLeagueLoading } = useLeague();
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rosters, setRosters] = useState<any[]>([]);
  
  // Data for segments
  const [recentMatchups, setRecentMatchups] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  
  const [selectedMatchupIndex, setSelectedMatchupIndex] = useState(0);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState(0);

  // Tale of the Tape Data
  const [teamAData, setTeamAData] = useState<any>(null);
  const [teamBData, setTeamBData] = useState<any>(null);

  const hasAutoFired = useRef(false);

  useEffect(() => {
    async function fetchBaseData() {
      if (!leagueId) return;
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
        
        // Fetch rosters
        const matrixRes = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}`);
        const rostersData = await matrixRes.json();
        if (Array.isArray(rostersData)) setRosters(rostersData);

        // Fetch recent data
        const matchupsRes = await fetch(`${apiUrl}/api/ai/recent-matchups`);
        const matchupsData = await matchupsRes.json();
        if (Array.isArray(matchupsData)) setRecentMatchups(matchupsData);

        const tradesRes = await fetch(`${apiUrl}/api/ai/recent-trades`);
        const tradesData = await tradesRes.json();
        if (Array.isArray(tradesData)) setRecentTrades(tradesData);
        
      } catch (err) {
        console.error("Failed to fetch base data", err);
      }
    }
    fetchBaseData();
  }, [leagueId]);

  // Load specific team data when a matchup is selected
  useEffect(() => {
    if (!leagueId || rosters.length === 0) return;
    
    async function loadTeamData() {
      if (scenario === "MATCHUP PREVIEW" && recentMatchups.length > 0) {
        const matchup = recentMatchups[selectedMatchupIndex];
        // In a real app we'd fetch the opponent, here we just use another random roster to compare
        const teamAId = matchup.roster_id;
        const teamBId = rosters.find(r => r.roster_id !== teamAId)?.roster_id || rosters[0].roster_id;
        
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
        try {
          const [resA, resB] = await Promise.all([
            fetch(`${apiUrl}/api/quant/team-analyzer/${leagueId}/${teamAId}`),
            fetch(`${apiUrl}/api/quant/team-analyzer/${leagueId}/${teamBId}`)
          ]);
          setTeamAData(await resA.json());
          setTeamBData(await resB.json());
        } catch (e) {
          console.error(e);
        }
      }
    }
    loadTeamData();
  }, [scenario, selectedMatchupIndex, recentMatchups, rosters, leagueId]);

  useEffect(() => {
    if (hasAutoFired.current) return;
    if (recentMatchups.length === 0 && recentTrades.length === 0) return;
    hasAutoFired.current = true;
    
    const autoFire = async () => {
      setLoading(true);
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
        let payload = {};
        let finalScenario = "LIVE TICKER"; // Start with a hot take

        if (recentMatchups.length > 0) {
          payload = recentMatchups[0];
          finalScenario = "MATCHUP PREVIEW";
        }
        setScenario(finalScenario);

        const genRes = await fetch(`${apiUrl}/api/ai/war-room`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenario: finalScenario,
            data_payload: payload
          })
        });
        const genData = await genRes.json();
        if (genData.error) {
          setOutput(`Error from AI engine: ${genData.error}`);
        } else {
          setOutput(genData.text);
        }
      } catch (err) {
        setOutput("Network error connecting to War Room AI.");
      } finally {
        setLoading(false);
      }
    };
    
    autoFire();
  }, [recentMatchups, recentTrades]);

  const handleGenerate = async () => {
    setLoading(true);
    setOutput("");
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
      
      let payload = {};
      if (scenario === "MATCHUP PREVIEW" && recentMatchups.length > 0) {
        payload = recentMatchups[selectedMatchupIndex];
      } else if (scenario === "TRADE AUTOPSY" && recentTrades.length > 0) {
        payload = recentTrades[selectedTradeIndex];
      } else {
        payload = { message: "No context provided" };
      }

      const res = await fetch(`${apiUrl}/api/ai/war-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          data_payload: payload
        })
      });
      const data = await res.json();
      if (data.error) {
        setOutput(`Error from AI engine: ${data.error}`);
      } else {
        setOutput(data.text);
      }
    } catch (err) {
      setOutput("Network error connecting to War Room AI.");
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (rosterId: any) => {
    const r = rosters.find(r => r.roster_id === parseInt(rosterId));
    return r ? r.team_name : `Team ${rosterId}`;
  };

  // Build comparative radar data
  const getComparativeRadarData = () => {
    if (!teamAData || !teamAData.positional_radar || !teamBData || !teamBData.positional_radar) return [];
    return teamAData.positional_radar.map((itemA: any) => {
      const itemB = teamBData.positional_radar.find((i: any) => i.position === itemA.position);
      return {
        position: itemA.position,
        teamA: itemA.team_score,
        teamB: itemB ? itemB.team_score : 0,
        fullMark: 100
      };
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans flex flex-col">
      {/* Ticker Header */}
      <div className="bg-red-600 text-white font-bold py-2 overflow-hidden flex items-center shadow-lg border-b border-red-800">
        <div className="bg-black px-4 py-1 ml-2 rounded text-xs tracking-widest uppercase flex items-center gap-2 z-10 shrink-0">
          <Activity size={14} className="text-red-500 animate-pulse" />
          Live News
        </div>
        <div className="flex-1 overflow-hidden relative ml-4">
          <div className="whitespace-nowrap animate-marquee flex gap-8 items-center text-sm">
            {recentTrades.map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-red-300">BREAKING TRADE:</span> 
                {Object.keys(t.consenter_roster_ids || {}).map(id => getTeamName(id)).join(' & ')} swapped assets in Week {t.week}!
                <span className="opacity-50 px-4">•</span>
              </span>
            ))}
            <span>RUMOR: AI Host preparing devastating statistical takedown of {rosters.length > 0 ? getTeamName(rosters[0].roster_id) : "league average managers"}.</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent flex items-center gap-3">
              <Flame size={40} className="text-orange-500" />
              The Dynasty War Room
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">
              Live broadcast dashboard. Ruthless, data-driven roasts powered by AI.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Stage (Left) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Visual Dashboard */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl relative overflow-hidden min-h-[500px] flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
              
              {scenario === "MATCHUP PREVIEW" && teamAData && teamBData ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                    <Users size={24} className="text-amber-400"/> Matchup Visualizer
                  </h3>
                  
                  <div className="grid grid-cols-3 items-center text-center mb-8 bg-zinc-950 p-4 sm:p-6 rounded-xl border border-zinc-800">
                    <div className="space-y-1 sm:space-y-2 overflow-hidden">
                      <h4 className="text-sm sm:text-2xl font-black text-blue-400 truncate px-1">{getTeamName(teamAData.roster_id)}</h4>
                      <div className="text-3xl sm:text-5xl font-black text-white">{Math.round(teamAData.power_index)}</div>
                      <div className="text-[10px] sm:text-sm text-zinc-400 uppercase tracking-widest hidden sm:block">Power Index</div>
                    </div>
                    <div className="text-2xl sm:text-4xl font-black text-zinc-700 italic">VS</div>
                    <div className="space-y-1 sm:space-y-2 overflow-hidden">
                      <h4 className="text-sm sm:text-2xl font-black text-red-400 truncate px-1">{getTeamName(teamBData.roster_id)}</h4>
                      <div className="text-3xl sm:text-5xl font-black text-white">{Math.round(teamBData.power_index)}</div>
                      <div className="text-[10px] sm:text-sm text-zinc-400 uppercase tracking-widest hidden sm:block">Power Index</div>
                    </div>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Max PF', teamA: teamAData.max_pf, teamB: teamBData.max_pf },
                        { name: 'Expected Pts', teamA: teamAData.expected_pts, teamB: teamBData.expected_pts },
                        { name: 'Draft Capital', teamA: teamAData.future_capital_value, teamB: teamBData.future_capital_value }
                      ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <Legend />
                        <Bar name={getTeamName(teamAData.roster_id)} dataKey="teamA" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar name={getTeamName(teamBData.roster_id)} dataKey="teamB" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : scenario === "TRADE AUTOPSY" && recentTrades.length > 0 ? (
                <div className="space-y-8 animate-in fade-in duration-500 text-center">
                   <h3 className="text-2xl font-black text-white uppercase tracking-wider flex justify-center items-center gap-2 mb-6">
                    <GitCompareArrows size={24} className="text-green-400"/> Trade Analyzer
                  </h3>
                  <div className="bg-zinc-950 p-8 rounded-xl border border-zinc-800">
                    <h4 className="text-xl font-bold text-zinc-300 mb-4">Assets Exchanged in Week {recentTrades[selectedTradeIndex]?.week}</h4>
                    <p className="text-lg text-zinc-400">
                      Teams involved: <span className="font-bold text-white">{Object.keys(recentTrades[selectedTradeIndex]?.consenter_roster_ids || {}).map(id => getTeamName(id)).join(' & ')}</span>
                    </p>
                    {/* Placeholder for complex trade visuals */}
                    <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500">
                       Select a trade to view exact player and pick movements (live integration pending).
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-600 space-y-4 h-full">
                  <Flame size={64} className="opacity-20" />
                  <p className="text-lg font-medium text-center max-w-sm">
                    Awaiting segment selection...
                  </p>
                </div>
              )}
            </div>


          </div>

          {/* Segment Producer Controls (Right) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Activity size={20} className="text-red-400" />
                Show Producer
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Select Segment</label>
                  <div className="grid grid-cols-1 gap-2">
                    {SCENARIOS.map(s => (
                      <button
                        key={s}
                        onClick={() => setScenario(s)}
                        className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                          scenario === s 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {scenario === "MATCHUP PREVIEW" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Target Matchup</label>
                    <select 
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500"
                      value={selectedMatchupIndex}
                      onChange={(e) => setSelectedMatchupIndex(Number(e.target.value))}
                    >
                      {recentMatchups.length === 0 && <option>No recent matchups</option>}
                      {recentMatchups.map((m, i) => (
                        <option key={i} value={i}>
                          Week {m.week} - {getTeamName(m.roster_id)} Matchup
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {scenario === "TRADE AUTOPSY" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Target Trade</label>
                    <select 
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500"
                      value={selectedTradeIndex}
                      onChange={(e) => setSelectedTradeIndex(Number(e.target.value))}
                    >
                      {recentTrades.length === 0 && <option>No recent trades</option>}
                      {recentTrades.map((t, i) => (
                        <option key={i} value={i}>
                          Week {t.week} - Teams {Object.keys(t.consenter_roster_ids || {}).join(', ')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button 
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-4 mt-4 rounded-xl font-black text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg hover:shadow-orange-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-pulse flex items-center gap-2"><Activity size={20}/> ANALYZING DATA...</span>
                  ) : (
                    <>
                      <Play size={24} /> LOAD VISUALS
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp size={16} /> Broadcast Stats
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <span className="text-zinc-300">Total Rosters</span>
                  <span className="text-white font-bold">{rosters.length}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <span className="text-zinc-300">Monitored Trades</span>
                  <span className="text-white font-bold">{recentTrades.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">AI Confidence</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><AlertTriangle size={14}/> 99.9%</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* CSS for marquee */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
      `}} />
    </div>
  );
}

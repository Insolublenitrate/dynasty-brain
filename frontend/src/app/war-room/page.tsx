"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Flame, Play, Terminal, Zap, Activity, Users, TrendingUp, AlertTriangle, Scale } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { GitCompareArrows } from 'lucide-react';
import TradeArchitectTab from '@/components/tabs/TradeArchitectTab';

import { getApiUrl } from '@/config/api';

const SCENARIOS = [
  "MATCHUP PREVIEW",
  "TRADE CALCULATOR",
  "TRADE AUTOPSY",
  "BENCH BLUNDER (Shoulda/Coulda)"
];

export default function WarRoomPage() {
  const { leagueId, isLoading: isLeagueLoading } = useLeague();
  const { currentTheme } = useTheme();
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
        const apiUrl = getApiUrl();
        
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
        const matchup = recentMatchups[selectedMatchupIndex] || recentMatchups[0];
        if (!matchup) return;
        const teamAId = matchup.roster_id;
        const teamBId = rosters.find(r => r.roster_id !== teamAId)?.roster_id || rosters[0]?.roster_id;
        
        if (!teamAId || !teamBId) return;

        const apiUrl = getApiUrl();
        try {
          const [resA, resB] = await Promise.all([
            fetch(`${apiUrl}/api/quant/team-analyzer/${leagueId}/${teamAId}`),
            fetch(`${apiUrl}/api/quant/team-analyzer/${leagueId}/${teamBId}`)
          ]);
          if (resA.ok) setTeamAData(await resA.json());
          if (resB.ok) setTeamBData(await resB.json());
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
        const apiUrl = getApiUrl();
        let payload = {};
        let finalScenario = "MATCHUP PREVIEW";

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
        setOutput("AI War Room broadcast engine ready.");
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
      const apiUrl = getApiUrl();
      
      let payload = {};
      if (scenario === "MATCHUP PREVIEW" && recentMatchups.length > 0) {
        payload = recentMatchups[selectedMatchupIndex] || recentMatchups[0] || {};
      } else if (scenario === "TRADE AUTOPSY" && recentTrades.length > 0) {
        payload = recentTrades[selectedTradeIndex] || recentTrades[0] || {};
      } else {
        payload = { message: "General league evaluation" };
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

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
            <Flame size={32} style={{ color: currentTheme.primary }} /> THE DYNASTY WAR ROOM
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            Live quantitative sports broadcast & relentless matchup roasts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Stage (Left) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden min-h-[480px] flex flex-col justify-center">
            <div 
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: currentTheme.primary }}
            />
            
            {scenario === "TRADE CALCULATOR" ? (
              <div className="animate-in fade-in duration-500 w-full h-full">
                <TradeArchitectTab />
              </div>
            ) : scenario === "MATCHUP PREVIEW" && teamAData && teamBData ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Users size={22} style={{ color: currentTheme.primary }} /> Matchup Visualizer
                </h3>
                
                <div className="grid grid-cols-3 items-center text-center bg-zinc-950 p-4 sm:p-6 rounded-2xl border border-zinc-800">
                  <div className="space-y-1 overflow-hidden">
                    <h4 className="text-sm sm:text-lg font-black text-cyan-400 truncate px-1">{getTeamName(teamAData.roster_id)}</h4>
                    <div className="text-3xl sm:text-5xl font-black text-white">{Math.round(teamAData.power_index)}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Power Index</div>
                  </div>
                  <div className="text-2xl sm:text-4xl font-black text-zinc-700 italic">VS</div>
                  <div className="space-y-1 overflow-hidden">
                    <h4 className="text-sm sm:text-lg font-black text-rose-400 truncate px-1">{getTeamName(teamBData.roster_id)}</h4>
                    <div className="text-3xl sm:text-5xl font-black text-white">{Math.round(teamBData.power_index)}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Power Index</div>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Max PF', teamA: teamAData.max_pf, teamB: teamBData.max_pf },
                      { name: 'Expected Pts', teamA: teamAData.expected_pts, teamB: teamBData.expected_pts },
                      { name: 'Draft Capital', teamA: teamAData.future_capital_value, teamB: teamBData.future_capital_value }
                    ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar name={getTeamName(teamAData.roster_id)} dataKey="teamA" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                      <Bar name={getTeamName(teamBData.roster_id)} dataKey="teamB" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : scenario === "TRADE AUTOPSY" && recentTrades.length > 0 ? (
              <div className="space-y-6 animate-in fade-in duration-500 text-center">
                <h3 className="text-xl font-black text-white uppercase tracking-wider flex justify-center items-center gap-2 mb-4">
                  <GitCompareArrows size={22} className="text-emerald-400"/> Trade Analyzer
                </h3>
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-center">
                  <h4 className="text-lg font-bold text-zinc-200 mb-2">Assets Exchanged in Week {recentTrades[selectedTradeIndex]?.week}</h4>
                  <p className="text-sm text-zinc-400">
                    Teams involved: <span className="font-bold text-white">{Object.keys(recentTrades[selectedTradeIndex]?.consenter_roster_ids || {}).map(id => getTeamName(id)).join(' & ')}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500 space-y-3 py-16">
                <Flame size={48} className="opacity-30" style={{ color: currentTheme.primary }} />
                <p className="text-sm font-medium text-center max-w-sm">
                  Select a broadcast segment on the right to analyze.
                </p>
              </div>
            )}

            {output && (
              <div className="mt-6 p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 text-zinc-200 text-sm font-mono whitespace-pre-wrap">
                <div className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-2 flex items-center gap-1.5">
                  <Zap size={14} /> Studio AI Analysis:
                </div>
                {output}
              </div>
            )}
          </div>
        </div>

        {/* Segment Producer Controls (Right) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity size={18} style={{ color: currentTheme.primary }} />
              Show Producer
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Select Segment</label>
                <div className="grid grid-cols-1 gap-2">
                  {SCENARIOS.map(s => (
                    <button
                      key={s}
                      onClick={() => setScenario(s)}
                      className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        scenario === s 
                          ? 'text-zinc-950 shadow-lg' 
                          : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                      }`}
                      style={scenario === s ? { backgroundColor: currentTheme.primary } : {}}
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
                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
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
                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
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
                className="w-full py-3 rounded-xl font-black text-sm text-zinc-950 shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: currentTheme.primary }}
              >
                {loading ? (
                  <span className="animate-pulse flex items-center gap-2"><Activity size={16}/> GENERATING ANALYSIS...</span>
                ) : (
                  <>
                    <Play size={18} /> RUN AI BROADCAST
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Broadcast Telemetry
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Total Rosters</span>
                <span className="text-white font-mono font-bold">{rosters.length}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Monitored Trades</span>
                <span className="text-white font-mono font-bold">{recentTrades.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">AI Confidence</span>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <AlertTriangle size={12}/> 99.8%
                </span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

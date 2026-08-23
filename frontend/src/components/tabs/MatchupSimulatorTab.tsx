"use client";

import React, { useState, useEffect } from 'react';
import { Dices, Sparkles, Swords, Trophy, Shield, TrendingUp, ArrowRight, Play, RefreshCw, BarChart3, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function MatchupSimulatorTab() {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [rosters, setRosters] = useState<any[]>([]);
  const [teamA, setTeamA] = useState<number>(1);
  const [teamB, setTeamB] = useState<number>(2);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!leagueId) return;

    async function fetchRosters() {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/rivalries/${leagueId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.rosters && json.rosters.length >= 2) {
            setRosters(json.rosters);
            setTeamA(json.rosters[0].roster_id);
            setTeamB(json.rosters[1].roster_id);
            runSimulation(json.rosters[0].roster_id, json.rosters[1].roster_id);
          }
        }
      } catch (err) {
        console.error("Failed to load rosters for simulation:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRosters();
  }, [leagueId]);

  async function runSimulation(tA = teamA, tB = teamB) {
    if (!leagueId) return;
    setSimulating(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/quant/matchup-simulator/${leagueId}?team_a=${tA}&team_b=${tB}`);
      if (res.ok) {
        const json = await res.json();
        setSimResult(json);
      }
    } catch (err) {
      console.error("Failed to run matchup simulation:", err);
    } finally {
      setSimulating(false);
    }
  }

  if (loading || rosters.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Monte Carlo Simulator...</p>
      </div>
    );
  }

  const { team_a, team_b, spread, favored_team, histogram = [], positional_edges = [] } = simResult || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-2.5">
            <Dices size={28} style={{ color: currentTheme.primary }} /> MONTE CARLO MATCHUP SIMULATOR
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            10,000 Game Tale-of-the-Tape Simulation & Volatility Ceiling/Floor Projections
          </p>
        </div>
      </div>

      {/* Matchup Selection Bar */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
          
          {/* Team A Selector */}
          <div className="sm:col-span-2 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Home Team
            </label>
            <select
              value={teamA}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTeamA(val);
                runSimulation(val, teamB);
              }}
              className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {rosters.map((r: any) => (
                <option key={`a-${r.roster_id}`} value={r.roster_id} disabled={r.roster_id === teamB}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* VS & Simulate Button */}
          <div className="sm:col-span-1 flex flex-col items-center justify-center">
            <button
              onClick={() => runSimulation()}
              disabled={simulating}
              className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg w-full justify-center bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600"
              style={{ borderColor: currentTheme.border }}
            >
              <RefreshCw size={14} className={simulating ? "animate-spin" : ""} />
              {simulating ? "Simulating..." : "Simulate"}
            </button>
          </div>

          {/* Team B Selector */}
          <div className="sm:col-span-2 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Away Team
            </label>
            <select
              value={teamB}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTeamB(val);
                runSimulation(teamA, val);
              }}
              className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {rosters.map((r: any) => (
                <option key={`b-${r.roster_id}`} value={r.roster_id} disabled={r.roster_id === teamA}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Tale of the Tape Scoreboard */}
      {simResult && team_a && team_b && (
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
          
          {/* Clash Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Team A Card */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              team_a.win_prob >= 50 
                ? 'bg-gradient-to-br from-emerald-950/30 to-zinc-950 border-emerald-500/40 shadow-lg' 
                : 'bg-zinc-950/80 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                  {team_a.avatar ? (
                    <img src={`https://sleepercdn.com/avatars/${team_a.avatar}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-zinc-700 object-cover flex-shrink-0" alt="avatar" />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-sm sm:text-base flex-shrink-0">
                      {team_a.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h3 className="text-base sm:text-xl font-black text-white truncate">{team_a.name}</h3>
                    <span className="text-[11px] font-mono text-zinc-400 block">Median: {team_a.projected_median} pts</span>
                  </div>
                </div>

                <div className="text-right font-mono flex-shrink-0">
                  <span className="text-2xl sm:text-3xl font-black" style={{ color: team_a.win_prob >= 50 ? '#10b981' : '#a1a1aa' }}>
                    {team_a.win_prob}%
                  </span>
                  <span className="text-[9px] text-zinc-500 uppercase block font-sans">Win Prob</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-zinc-900">
                <div className="bg-zinc-900/60 p-2 rounded-xl text-center">
                  <span className="text-zinc-500 text-[9px] uppercase font-sans block">90th% Ceiling</span>
                  <span className="text-emerald-400 font-bold text-xs sm:text-sm">{team_a.ceiling_90} pts</span>
                </div>
                <div className="bg-zinc-900/60 p-2 rounded-xl text-center">
                  <span className="text-zinc-500 text-[9px] uppercase font-sans block">10th% Floor</span>
                  <span className="text-red-400 font-bold text-xs sm:text-sm">{team_a.floor_10} pts</span>
                </div>
              </div>
            </div>

            {/* Team B Card */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              team_b.win_prob >= 50 
                ? 'bg-gradient-to-br from-emerald-950/30 to-zinc-950 border-emerald-500/40 shadow-lg' 
                : 'bg-zinc-950/80 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                  {team_b.avatar ? (
                    <img src={`https://sleepercdn.com/avatars/${team_b.avatar}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-zinc-700 object-cover flex-shrink-0" alt="avatar" />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-sm sm:text-base flex-shrink-0">
                      {team_b.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h3 className="text-base sm:text-xl font-black text-white truncate">{team_b.name}</h3>
                    <span className="text-[11px] font-mono text-zinc-400 block">Median: {team_b.projected_median} pts</span>
                  </div>
                </div>

                <div className="text-right font-mono flex-shrink-0">
                  <span className="text-2xl sm:text-3xl font-black" style={{ color: team_b.win_prob >= 50 ? '#10b981' : '#a1a1aa' }}>
                    {team_b.win_prob}%
                  </span>
                  <span className="text-[9px] text-zinc-500 uppercase block font-sans">Win Prob</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-zinc-900">
                <div className="bg-zinc-900/60 p-2 rounded-xl text-center">
                  <span className="text-zinc-500 text-[9px] uppercase font-sans block">90th% Ceiling</span>
                  <span className="text-emerald-400 font-bold text-xs sm:text-sm">{team_b.ceiling_90} pts</span>
                </div>
                <div className="bg-zinc-900/60 p-2 rounded-xl text-center">
                  <span className="text-zinc-500 text-[9px] uppercase font-sans block">10th% Floor</span>
                  <span className="text-red-400 font-bold text-xs sm:text-sm">{team_b.floor_10} pts</span>
                </div>
              </div>
            </div>

          </div>

          {/* Spread Summary */}
          <div className="bg-zinc-950 p-3 sm:p-4 rounded-xl border border-zinc-800 text-center flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
            <span className="text-zinc-400">
              Projected Spread: <strong className="text-white">{favored_team} -{spread} pts</strong>
            </span>
            <span className="text-emerald-400 font-bold">
              10,000 Monte Carlo Iterations Complete
            </span>
          </div>

          {/* Positional Advantage Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} style={{ color: currentTheme.primary }} /> Positional Tale of the Tape
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {positional_edges.map((edge: any) => (
                <div key={edge.position} className="bg-zinc-950/80 border border-zinc-800/80 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">{edge.position}</span>
                  <p className="text-xs font-bold text-white mt-1 truncate">{edge.advantage}</p>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 block mt-0.5">{edge.delta}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Distribution Chart */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={16} style={{ color: currentTheme.primary }} /> Simulation Volatility Distribution
            </h4>
            <div className="h-[220px] sm:h-[280px] w-full bg-zinc-950/90 p-2 sm:p-3 rounded-xl border border-zinc-800">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogram} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="range" stroke="#71717a" fontSize={9} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={9} tickLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '11px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                  <Bar dataKey="team_a_count" name={team_a.name} fill={currentTheme.primary} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="team_b_count" name={team_b.name} fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

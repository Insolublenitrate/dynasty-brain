"use client";

import React, { useState, useEffect } from 'react';
import { Swords, Shield, Skull, Sparkles, AlertCircle, TrendingUp, Trophy, ArrowRight, UserCheck, Flame } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function RivalriesTab() {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPair, setSelectedPair] = useState<{ r1: number; r2: number } | null>(null);

  useEffect(() => {
    if (!leagueId) return;

    async function fetchRivalries() {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/rivalries/${leagueId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.rosters && json.rosters.length >= 2) {
            setSelectedPair({ r1: json.rosters[0].roster_id, r2: json.rosters[1].roster_id });
          }
        }
      } catch (err) {
        console.error("Failed to fetch rivalries:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRivalries();
  }, [leagueId]);

  if (loading || !data) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">Calculating Rivalries & All-Play Matrix...</p>
      </div>
    );
  }

  const { rosters = [], matrix = {}, all_play_standings = [], revenge_games = [] } = data;
  const ownerMap = Object.fromEntries(rosters.map((r: any) => [r.roster_id, r.name]));

  const activePairDetails = selectedPair ? matrix[selectedPair.r1]?.[selectedPair.r2] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-2.5">
            <Swords size={28} style={{ color: currentTheme.primary }} /> RIVALRIES & ALL-PLAY MATRIX
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            Lifetime Head-to-Head Records, True-Skill All-Play Standings & Revenge Game Alerts
          </p>
        </div>
      </div>

      {/* Traitor / Revenge Game Alert Banner */}
      {revenge_games.length > 0 && (
        <div className="bg-zinc-900/90 border border-orange-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-3">
            <Flame size={20} className="text-orange-500" />
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Revenge Game / Former Asset Watch
            </h4>
            <span className="px-2 py-0.5 rounded bg-orange-950/60 border border-orange-800/60 text-[10px] font-mono text-orange-400 font-bold">
              {revenge_games.length} Active Traded Assets
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {revenge_games.map((rg: any, idx: number) => (
              <div key={idx} className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white truncate">{rg.player_name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400">{rg.position}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Now on <strong className="text-white">{rg.current_team_name}</strong>
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>Traded by {rg.former_team_name}</span>
                  <span className="text-orange-400 font-bold">{rg.trade_season} Wk {rg.trade_week}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All-Play "True Skill" vs Actual Standings Table */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Trophy size={22} style={{ color: currentTheme.primary }} />
            <div>
              <h3 className="text-lg font-bold text-white">All-Play "True Skill" Standings & Luck Index</h3>
              <p className="text-xs text-zinc-400">Performance if every team played all 9 opponents every single week</p>
            </div>
          </div>
          <span className="text-xs font-mono text-zinc-500 self-start sm:self-center">
            {all_play_standings.length} Teams Scored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-mono uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Manager</th>
                <th className="py-2.5 px-3 text-center">All-Play Record</th>
                <th className="py-2.5 px-3 text-center">All-Play Win%</th>
                <th className="py-2.5 px-3 text-center">Actual Record</th>
                <th className="py-2.5 px-3 text-center">Actual Win%</th>
                <th className="py-2.5 px-3 text-center">Luck Delta</th>
                <th className="py-2.5 px-3 text-right">Luck Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {all_play_standings.map((team: any) => {
                const isLucky = team.luck_delta > 0;
                const isSeverelyUnlucky = team.luck_delta <= -5.0;
                const isPaperTiger = team.luck_delta >= 5.0;

                return (
                  <tr key={team.roster_id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-zinc-400">#{team.rank}</td>
                    <td className="py-3 px-3 font-sans font-bold text-white flex items-center gap-2">
                      {team.avatar ? (
                        <img src={`https://sleepercdn.com/avatars/${team.avatar}`} className="w-6 h-6 rounded-full border border-zinc-700 object-cover" alt="avatar" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-white font-bold">
                          {team.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{team.name}</span>
                    </td>
                    <td className="py-3 px-3 text-center text-white font-bold">{team.wins}-{team.losses}</td>
                    <td className="py-3 px-3 text-center text-zinc-300 font-bold">{team.all_play_pct}%</td>
                    <td className="py-3 px-3 text-center text-zinc-400">{team.actual_wins}-{team.actual_losses}</td>
                    <td className="py-3 px-3 text-center text-zinc-400">{team.actual_pct}%</td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={isLucky ? 'text-emerald-400' : 'text-red-400'}>
                        {team.luck_delta > 0 ? `+${team.luck_delta}%` : `${team.luck_delta}%`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                        isPaperTiger ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50' :
                        isSeverelyUnlucky ? 'bg-red-950/60 text-red-400 border border-red-800/50' :
                        isLucky ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {team.luck_rating}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive 10x10 Head-to-Head Rivalry Grid */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Shield size={22} style={{ color: currentTheme.primary }} />
            <div>
              <h3 className="text-lg font-bold text-white">Lifetime Head-to-Head Rivalry Matrix</h3>
              <p className="text-xs text-zinc-400">Tap any cell to inspect pairwise historical series breakdown</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded bg-emerald-500"></span> Leading</span>
            <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded bg-red-500"></span> Trailing</span>
            <span className="flex items-center gap-1 text-zinc-400"><span className="w-2 h-2 rounded bg-zinc-600"></span> Tied</span>
          </div>
        </div>

        {/* Matrix Scrollable Grid */}
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-zinc-500 font-mono text-[10px] uppercase">Manager</th>
                {rosters.map((opp: any) => (
                  <th key={opp.roster_id} className="p-2 text-[10px] font-mono text-zinc-400 whitespace-nowrap min-w-[70px]">
                    {opp.name?.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rosters.map((r1: any) => (
                <tr key={r1.roster_id} className="border-t border-zinc-800/60">
                  <td className="p-2 text-left font-bold text-white whitespace-nowrap font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.primary }}></span>
                    <span className="truncate max-w-[110px]">{r1.name}</span>
                  </td>
                  {rosters.map((r2: any) => {
                    if (r1.roster_id === r2.roster_id) {
                      return (
                        <td key={r2.roster_id} className="p-1.5 bg-zinc-950/40 text-zinc-700 font-mono">
                          —
                        </td>
                      );
                    }

                    const rec = matrix[r1.roster_id]?.[r2.roster_id];
                    if (!rec) return <td key={r2.roster_id} className="p-1.5 text-zinc-600">0-0</td>;

                    const isWinning = rec.wins > rec.losses;
                    const isLosing = rec.losses > rec.wins;
                    const isSelected = selectedPair?.r1 === r1.roster_id && selectedPair?.r2 === r2.roster_id;

                    return (
                      <td 
                        key={r2.roster_id} 
                        onClick={() => setSelectedPair({ r1: r1.roster_id, r2: r2.roster_id })}
                        className={`p-1.5 cursor-pointer font-mono font-bold transition-all ${
                          isSelected ? 'ring-2 ring-orange-500 rounded' : ''
                        } ${
                          isWinning 
                            ? 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60' 
                            : isLosing 
                            ? 'bg-red-950/40 text-red-400 hover:bg-red-900/60' 
                            : 'bg-zinc-950/60 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {rec.wins}-{rec.losses}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pairwise Inspection Panel */}
        {selectedPair && activePairDetails && (
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 mt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-base font-black text-white">{ownerMap[selectedPair.r1]}</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] font-mono text-zinc-300 font-bold">vs</span>
              <span className="text-base font-black text-zinc-300">{ownerMap[selectedPair.r2]}</span>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-zinc-500 uppercase text-[9px] block">Record</span>
                <span className="font-bold text-white text-sm">{activePairDetails.wins}W - {activePairDetails.losses}L</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[9px] block">Win %</span>
                <span className="font-bold text-emerald-400 text-sm">{activePairDetails.win_pct}%</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[9px] block">Total Points</span>
                <span className="font-bold text-zinc-300 text-sm">{activePairDetails.pts_for} vs {activePairDetails.pts_against}</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

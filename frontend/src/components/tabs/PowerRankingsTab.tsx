"use client";

import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Shield, TrendingUp, Zap, Clock, Trophy, AlertTriangle, Layers, Info, HelpCircle } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function PowerRankingsTab() {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFormula, setShowFormula] = useState(false);

  useEffect(() => {
    if (!leagueId) return;

    async function fetchRankings() {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/power-rankings/${leagueId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch power rankings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, [leagueId]);

  if (loading || !data) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">Synthesizing Dynasty Power Tiers...</p>
      </div>
    );
  }

  const { power_rankings = [], league_benchmarks = {} } = data;

  // Group by Tier
  const tiers = Array.from(new Set(power_rankings.map((t: any) => t.tier)));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header & Methodology Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-2.5">
            <Crown size={28} style={{ color: currentTheme.primary }} /> DYNASTY POWER TIERS & BUILD METAS
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            Standardized Quant Model (Starter Power + Future Draft Capital + Roster Depth)
          </p>
        </div>

        <button
          onClick={() => setShowFormula(!showFormula)}
          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-bold transition-all flex items-center gap-2 shadow-md"
        >
          <HelpCircle size={15} style={{ color: currentTheme.primary }} />
          <span>{showFormula ? "Hide Methodology" : "How Tiers Are Calculated"}</span>
        </button>
      </div>

      {/* Methodology Explainer Card (Expandable) */}
      {showFormula && (
        <div className="bg-zinc-900/90 border border-zinc-700 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Info size={18} style={{ color: currentTheme.primary }} />
            <span>Mathematical Tiering & Power Score Methodology</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            The Dynasty Power Model normalizes all teams against league-wide statistical distributions ($Z$-scores) centered on a <strong>0–100 scale</strong> where <strong>50.0 is the exact league median</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-purple-400 font-bold block mb-1">55% Starter Firepower</span>
              <p className="text-zinc-400 text-[11px] font-sans">Max PF (Optimal points potential) measuring true weekly starting lineup ceiling.</p>
            </div>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold block mb-1">35% Draft Capital Equity</span>
              <p className="text-zinc-400 text-[11px] font-sans">Total value of 2025–2027 draft pick inventory evaluated via Time-Value-of-Money depreciation.</p>
            </div>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-blue-400 font-bold block mb-1">10% Roster Depth</span>
              <p className="text-zinc-400 text-[11px] font-sans">Active bench asset count and insulation against injuries and bye weeks.</p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-zinc-400 font-mono flex flex-wrap gap-4">
            <span>• League Mean Max PF: <strong>{league_benchmarks.mean_max_pf || 2677} pts</strong></span>
            <span>• League Mean Capital: <strong>{league_benchmarks.mean_capital || 15800} pts</strong></span>
            <span>• 1.0 Z-Score $\approx$ 15 Rating Points</span>
          </div>
        </div>
      )}

      {/* Tier Groupings */}
      <div className="space-y-6">
        {tiers.map((tierName: any) => {
          const tierTeams = power_rankings.filter((t: any) => t.tier === tierName);
          const tierColor = tierTeams[0]?.tier_color || '#a855f7';

          return (
            <div key={tierName} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              
              {/* Tier Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tierColor }}></span>
                  <h3 className="text-lg font-black text-white italic tracking-tight">{tierName}</h3>
                </div>
                <span className="text-xs font-mono text-zinc-400">{tierTeams.length} Teams</span>
              </div>

              {/* Teams in Tier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tierTeams.map((team: any) => (
                  <div 
                    key={team.roster_id}
                    className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-md"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="text-base font-black font-mono text-zinc-500">#{team.rank}</span>
                          {team.avatar ? (
                            <img src={`https://sleepercdn.com/avatars/${team.avatar}`} className="w-8 h-8 rounded-full border border-zinc-700 object-cover" alt="avatar" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-xs">
                              {team.name?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white text-sm truncate">{team.name}</p>
                            <p className="text-[10px] font-mono text-zinc-400">Record: {team.record} • {team.max_pf} Max PF</p>
                          </div>
                        </div>

                        <div className="text-right font-mono flex-shrink-0">
                          <span className="text-base sm:text-lg font-black text-white">{team.composite_score}</span>
                          <span className="text-[9px] text-zinc-500 uppercase block font-sans">Power Rating</span>
                        </div>
                      </div>

                      {/* Build Archetype & Longevity Meter */}
                      <div className="flex items-center justify-between gap-2 my-2.5">
                        <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-200">
                          {team.badge}
                        </span>

                        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                          <Clock size={13} className="text-amber-400" />
                          <span>Window: <strong className="text-white">{team.longevity} yrs</strong></span>
                        </div>
                      </div>

                      {/* Sub-Score Bars (0-100 normalized) */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-900 text-center font-mono text-[11px]">
                        <div>
                          <span className="text-zinc-500 text-[9px] uppercase font-sans block">Starters</span>
                          <span className="text-white font-bold">{team.starter_score}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[9px] uppercase font-sans block">Depth</span>
                          <span className="text-zinc-300 font-bold">{team.depth_score}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[9px] uppercase font-sans block">Draft Capital</span>
                          <span className="text-emerald-400 font-bold">{team.capital_score}</span>
                        </div>
                      </div>

                      {/* AI / Quant Tactical Blurb */}
                      <p className="text-xs text-zinc-400 mt-2.5 font-sans leading-relaxed italic">
                        "{team.blurb}"
                      </p>
                    </div>

                    <div className="mt-3 pt-2 text-[10px] font-mono text-zinc-500 flex justify-between border-t border-zinc-900/60">
                      <span>Avg Starter Age: {team.avg_age}</span>
                      <span>Cap Equity: {team.future_capital_score?.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

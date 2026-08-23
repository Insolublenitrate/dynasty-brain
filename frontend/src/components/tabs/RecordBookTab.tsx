"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Skull, Zap, ArrowRight, Shield, Award, TrendingUp, AlertTriangle, Briefcase } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function RecordBookTab() {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId) return;

    async function fetchRecords() {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/record-book/${leagueId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch record book:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, [leagueId]);

  if (loading || !data) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">Unlocking All-Time Dynasty Records...</p>
      </div>
    );
  }

  const { records = {}, fleece_leaderboard = [] } = data;
  const { highest_week, closest_game, biggest_blowout, highest_combined, longest_win_streak, longest_loss_streak } = records;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-2.5">
            <Trophy size={28} style={{ color: currentTheme.primary }} /> LEAGUE RECORD BOOK & HALL OF SHAME
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            All-Time Scoring Superlatives, Historical Demolitions & Trade Fleece Leaderboard
          </p>
        </div>
      </div>

      {/* Superlative Trophy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Highest Single Week */}
        {highest_week && (
          <div className="bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400" /> All-Time Scoring Apex
              </span>
              <span className="text-zinc-500 font-mono text-xs">{highest_week.season} Wk {highest_week.week}</span>
            </div>
            
            <div className="my-2">
              <h3 className="text-3xl font-black text-white font-mono">{highest_week.score} <span className="text-sm text-zinc-400 font-sans">PTS</span></h3>
              <p className="text-base font-bold text-amber-200 mt-1">{highest_week.owner}</p>
            </div>
            
            <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800/80">
              The highest single-week points explosion recorded in league history.
            </p>
          </div>
        )}

        {/* Closest Game / Heartbreak Defeat */}
        {closest_game && (
          <div className="bg-gradient-to-br from-purple-950/40 via-zinc-900 to-zinc-950 border border-purple-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Skull size={14} className="text-purple-400" /> Narrowest Heartbreak Beat
              </span>
              <span className="text-zinc-500 font-mono text-xs">{closest_game.season} Wk {closest_game.week}</span>
            </div>
            
            <div className="my-2">
              <h3 className="text-3xl font-black text-white font-mono">{closest_game.margin} <span className="text-sm text-zinc-400 font-sans">PTS DIFF</span></h3>
              <p className="text-sm font-bold text-white mt-1">
                <strong className="text-emerald-400">{closest_game.winner}</strong> ({closest_game.winner_score}) def.{' '}
                <span className="text-red-400">{closest_game.loser}</span> ({closest_game.loser_score})
              </p>
            </div>
            
            <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800/80">
              The closest matchup margin ever decided on a stat correction or final play.
            </p>
          </div>
        )}

        {/* Biggest Blowout Demolition */}
        {biggest_blowout && (
          <div className="bg-gradient-to-br from-red-950/40 via-zinc-900 to-zinc-950 border border-red-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={14} className="text-red-400" /> Biggest Blowout Demolition
              </span>
              <span className="text-zinc-500 font-mono text-xs">{biggest_blowout.season} Wk {biggest_blowout.week}</span>
            </div>
            
            <div className="my-2">
              <h3 className="text-3xl font-black text-white font-mono">{biggest_blowout.margin} <span className="text-sm text-zinc-400 font-sans">PTS MARGIN</span></h3>
              <p className="text-sm font-bold text-white mt-1">
                <strong className="text-emerald-400">{biggest_blowout.winner}</strong> ({biggest_blowout.winner_score}) over{' '}
                <span className="text-zinc-400">{biggest_blowout.loser}</span> ({biggest_blowout.loser_score})
              </p>
            </div>
            
            <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800/80">
              The most lopsided blowout beatdown in recorded league matchups.
            </p>
          </div>
        )}

        {/* Highest Combined Shootout */}
        {highest_combined && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-wider">Highest Combined Shootout</span>
              <span className="text-zinc-500 font-mono text-xs">{highest_combined.season} Wk {highest_combined.week}</span>
            </div>
            <h3 className="text-2xl font-black text-white font-mono">{highest_combined.combined_score} <span className="text-xs text-zinc-400 font-sans">COMBINED PTS</span></h3>
            <p className="text-xs text-zinc-300 mt-1 font-semibold">
              {highest_combined.team_a} ({highest_combined.score_a}) vs {highest_combined.team_b} ({highest_combined.score_b})
            </p>
          </div>
        )}

        {/* Longest Win Streak */}
        {longest_win_streak && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Longest Win Streak</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">Unstoppable Run</span>
            </div>
            <h3 className="text-2xl font-black text-white font-mono">{longest_win_streak.streak} <span className="text-xs text-zinc-400 font-sans">GAMES IN A ROW</span></h3>
            <p className="text-xs text-zinc-300 mt-1 font-semibold">{longest_win_streak.owner}</p>
          </div>
        )}

        {/* Longest Loss Streak */}
        {longest_loss_streak && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-red-400 uppercase font-bold tracking-wider">Longest Cold Slump</span>
              <span className="text-xs font-mono text-red-400 font-bold">The Drought</span>
            </div>
            <h3 className="text-2xl font-black text-white font-mono">{longest_loss_streak.streak} <span className="text-xs text-zinc-400 font-sans">CONSECUTIVE LOSSES</span></h3>
            <p className="text-xs text-zinc-300 mt-1 font-semibold">{longest_loss_streak.owner}</p>
          </div>
        )}

      </div>

      {/* Historical Trade Fleece Leaderboard */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Briefcase size={22} style={{ color: currentTheme.primary }} />
            <div>
              <h3 className="text-lg font-bold text-white">Historical Trade Activity & Fleece Leaderboard</h3>
              <p className="text-xs text-zinc-400">Total trade volume and dynasty trade equity generated across league history</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fleece_leaderboard.map((trader: any) => (
            <div key={trader.roster_id} className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-sm font-bold font-mono text-zinc-500 w-5">#{trader.rank}</span>
                <div>
                  <p className="text-sm font-bold text-white truncate">{trader.name}</p>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 inline-block mt-0.5">
                    {trader.badge}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono flex-shrink-0">
                <p className="text-sm font-bold text-white">{trader.trades_completed} Trades</p>
                <p className="text-[11px] font-bold" style={{ color: currentTheme.primary }}>
                  +{trader.total_fleece_score} VORP
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

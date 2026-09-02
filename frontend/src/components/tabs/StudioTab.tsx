"use client";

import React, { useState, useEffect } from 'react';
import { 
  Activity, Swords, Zap, Flame, Trophy, ChevronDown, ChevronUp, 
  Skull, ShieldAlert, Sparkles, Radio, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/config/api';

export default function StudioTab({ studioData: initialData }: { studioData?: any }) {
  const { leagueId, leagueName } = useLeague();
  const { currentTheme } = useTheme();
  const router = useRouter();
  
  const [studioData, setStudioData] = useState<any>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setStudioData(initialData);
      return;
    }
    if (!leagueId) return;

    async function fetchStudio() {
      setIsLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/weekly-studio/${leagueId}`);
        if (res.ok) {
          const data = await res.json();
          setStudioData(data);
        }
      } catch (err) {
        console.error("Failed to fetch studio data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudio();
  }, [leagueId, initialData]);

  if (isLoading && !studioData) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">Broadcasting Studio Feeds...</p>
      </div>
    );
  }

  if (!studioData || studioData.error) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center shadow-xl">
        <Activity className="mx-auto mb-4 opacity-40" size={48} style={{ color: currentTheme.primary }} />
        <h3 className="text-xl font-bold text-white mb-2">No Broadcast Studio Data Available</h3>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          {studioData?.error || "Please verify league data is ingested into the Quant Engine database."}
        </p>
      </div>
    );
  }

  const { marquee_matchup, monday_autopsy, weekly_history } = studioData;
  const isAutopsyActive = monday_autopsy && monday_autopsy.margin > 0 && monday_autopsy.victim !== "No Major Blunders Detected";

  return (
    <div className="space-y-3.5 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* ── BROADCAST STUDIO BANNER ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm">
              <Radio size={12} className="animate-pulse text-red-400" />
              LIVE ON AIR · GAME DAY STUDIO
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {leagueName}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight font-sans">
            THE STUDIO BROADCAST
          </h2>
        </div>

        {/* Quick Link to Bounty Vault */}
        <button
          onClick={() => router.push('/dynasty-room?arena=command')}
          className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-all text-xs font-mono font-bold flex items-center gap-2 self-start sm:self-auto shadow-md"
        >
          <span>View Cash Bounty Vault</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* ── MARQUEE MATCHUP BANNER ("THE FRAUD CHECK") ──────────────────── */}
      <div 
        className="bg-zinc-900/90 backdrop-blur-md border-l-4 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden group border border-zinc-800"
        style={{ borderLeftColor: currentTheme.primary, boxShadow: `0 0 35px ${currentTheme.subtle}` }}
      >
        <div 
          className="absolute -top-10 -right-10 p-4 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none"
          style={{ color: currentTheme.primary }}
        >
          <Swords size={260} />
        </div>
        
        <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Activity className="animate-pulse" size={18} style={{ color: currentTheme.primary }} />
            <h2 className="font-black tracking-[0.25em] text-xs uppercase" style={{ color: currentTheme.primary }}>
              {marquee_matchup?.title || "Marquee Matchup of the Week"}
            </h2>
          </div>
          <span className="px-2.5 py-1 bg-zinc-950/80 rounded-md text-[10px] font-mono uppercase text-zinc-400 border border-zinc-800">
            Season {marquee_matchup?.season || "2026"} • Wk {marquee_matchup?.week || 1}
          </span>
        </div>

        <h3 className="text-3xl sm:text-5xl font-black text-white italic mb-6 tracking-tight relative z-10 drop-shadow-lg flex items-center gap-3">
          <span>THE FRAUD CHECK</span>
          <span className="text-xs font-mono font-normal not-italic px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            High Stakes
          </span>
        </h3>
        
        <div className="flex flex-col md:flex-row items-center justify-between bg-zinc-950/90 p-6 rounded-2xl border border-zinc-800/90 relative z-10 shadow-inner">
          <div className="text-center w-full md:w-1/3 mb-4 md:mb-0">
            <p className="text-zinc-400 font-mono text-xs mb-1 tracking-wider uppercase">Team Alpha</p>
            <p className="text-xl sm:text-2xl font-black text-white">{marquee_matchup?.teamA?.name || 'Team 1'}</p>
            <p className="font-mono mt-2 text-base sm:text-lg font-bold" style={{ color: currentTheme.primary }}>
              Output: {marquee_matchup?.teamA?.proj || 0} pts
            </p>
          </div>
          
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center my-4 md:my-0">
            <div className="text-3xl sm:text-4xl font-black text-zinc-600 italic">VS</div>
            <div className="mt-3 px-4 py-1.5 bg-zinc-900 rounded-lg text-xs text-zinc-300 font-mono border border-zinc-800 shadow-inner flex items-center gap-2">
              <span>SPREAD:</span>
              <span className="font-bold" style={{ color: currentTheme.primary }}>{marquee_matchup?.spread || 0} PTS</span>
            </div>
          </div>
          
          <div className="text-center w-full md:w-1/3">
            <p className="text-zinc-400 font-mono text-xs mb-1 tracking-wider uppercase">Team Beta</p>
            <p className="text-xl sm:text-2xl font-black text-white">{marquee_matchup?.teamB?.name || 'Team 2'}</p>
            <p className="font-mono mt-2 text-base sm:text-lg font-bold" style={{ color: currentTheme.primary }}>
              Output: {marquee_matchup?.teamB?.proj || 0} pts
            </p>
          </div>
        </div>
      </div>

      {/* ── MONDAY MORNING AUTOPSY & HEARTBREAK CLINIC ──────────────────── */}
      {isAutopsyActive ? (
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <Skull className="text-rose-400" size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Monday Morning Autopsy</h3>
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded text-[10px] font-mono uppercase font-bold border border-rose-500/30">
                    Heartbreak Clinic
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Closest defeat & coaching miscalculations in {monday_autopsy.season} Week {monday_autopsy.week}
                </p>
              </div>
            </div>

            <div className="px-3.5 py-1.5 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs flex items-center gap-2 self-start md:self-auto">
              <span className="text-zinc-500 uppercase">Deficit:</span>
              <span className="font-black text-rose-400">-{monday_autopsy.margin} PTS</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Victim</p>
                <p className="text-lg font-black text-white mt-1">{monday_autopsy.victim}</p>
                <p className="text-xs text-zinc-400 mt-1">Score: <span className="font-mono font-bold text-zinc-200">{monday_autopsy.team_score || monday_autopsy.started?.points} pts</span></p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-zinc-500 italic">
                Toughest beat of the season
              </div>
            </div>

            <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Opponent</p>
                <p className="text-lg font-black text-zinc-300 mt-1">{monday_autopsy.opponent || 'Opponent'}</p>
                <p className="text-xs text-zinc-400 mt-1">Score: <span className="font-mono font-bold text-zinc-200">{monday_autopsy.opponent_score || 'N/A'} pts</span></p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-emerald-400/90 font-mono font-semibold">
                Captured victory by {monday_autopsy.margin} pts
              </div>
            </div>

            <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Quant Autopsy Take</p>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Lineup volatility cost this roster the win. Optimal bench swap threshold was within <strong className="text-rose-400">{monday_autopsy.margin} pts</strong>.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Bench Potential:</span>
                <span className="text-emerald-400 font-bold">+{monday_autopsy.benched?.points} pts</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shrink-0">
            <CheckCircle2 size={24} className="text-emerald-400" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Preseason Lineup & Slate Calibration</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              All league lineups are currently in preseason calibration. Live Monday Morning Autopsies and bench regret tracking will activate immediately upon Week 1 kickoff!
            </p>
          </div>
        </div>
      )}

    </div>
  );
}


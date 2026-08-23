"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Activity, Swords, Banknote, AlertTriangle, Zap, Flame 
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function StudioTab({ studioData: initialData }: { studioData?: any }) {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [studioData, setStudioData] = useState<any>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [bountyView, setBountyView] = useState<'live' | 'all'>('live');

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
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" style={{ borderColor: currentTheme.primary }}></div>
      </div>
    );
  }

  if (!studioData) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center shadow-xl">
        <Activity className="mx-auto mb-4 opacity-40 text-orange-500" size={48} />
        <h3 className="text-xl font-bold text-white mb-2">No Broadcast Data Available</h3>
        <p className="text-zinc-400 text-sm">Please make sure league data is ingested for the current season.</p>
      </div>
    );
  }

  const { marquee_matchup, bounty_board, monday_autopsy, weekly_history } = studioData;
  
  const currentSeason = (weekly_history || []).length > 0 ? Math.max(...(weekly_history || []).map((w: any) => parseInt(w.season))).toString() : new Date().getFullYear().toString();
  
  const filtered_history = bountyView === 'live' 
    ? (weekly_history || []).filter((w: any) => w.season === currentSeason)
    : (weekly_history || []);

  const filtered_bounty = bountyView === 'live'
    ? (bounty_board || []).map((b: any) => ({
        ...b,
        cashWon: (b.breakdown || []).filter((str: string) => str.startsWith(currentSeason)).reduce((acc: number, str: string) => {
          const match = str.match(/\$(\d+)/);
          return acc + (match ? parseInt(match[1]) : 0);
        }, 0)
      })).filter((b: any) => b.cashWon > 0).sort((a: any, b: any) => b.cashWon - a.cashWon)
    : (bounty_board || []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Marquee Matchup */}
      <div 
        className="bg-zinc-900/80 backdrop-blur-md border-l-4 p-6 rounded-r-2xl shadow-xl relative overflow-hidden group border border-zinc-800"
        style={{ borderLeftColor: currentTheme.primary, boxShadow: `0 0 30px ${currentTheme.subtle}` }}
      >
        <div 
          className="absolute -top-10 -right-10 p-4 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none"
          style={{ color: currentTheme.primary }}
        >
          <Swords size={250} />
        </div>
        
        <div className="flex items-center gap-2 mb-2 relative z-10">
          <Activity className="animate-pulse" size={18} style={{ color: currentTheme.primary }} />
          <h2 className="font-bold tracking-[0.2em] text-xs uppercase" style={{ color: currentTheme.primary }}>
            Marquee Matchup of the Week
          </h2>
        </div>
        <h3 className="text-3xl md:text-5xl font-black text-white italic mb-6 tracking-tight relative z-10 drop-shadow-lg">
          THE FRAUD CHECK
        </h3>
        
        <div className="flex flex-col md:flex-row items-center justify-between bg-zinc-950/90 p-6 rounded-xl border border-zinc-800 relative z-10 shadow-inner">
          <div className="text-center w-full md:w-1/3 mb-4 md:mb-0">
            <p className="text-zinc-400 font-mono text-xs mb-1 tracking-wider uppercase">Team 1</p>
            <p className="text-xl md:text-2xl font-black text-white">{marquee_matchup?.teamA?.name || 'Unknown'}</p>
            <p className="font-mono mt-2 text-base md:text-lg font-bold" style={{ color: currentTheme.primary }}>
              Proj: {marquee_matchup?.teamA?.proj || 0} pts
            </p>
          </div>
          
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center my-4 md:my-0">
            <div className="text-3xl md:text-4xl font-black text-zinc-600 italic">VS</div>
            <div className="mt-3 px-4 py-1.5 bg-zinc-900 rounded-lg text-xs text-zinc-400 font-mono border border-zinc-800 shadow-inner">
              SPREAD: {marquee_matchup?.spread || 0}
            </div>
          </div>
          
          <div className="text-center w-full md:w-1/3">
            <p className="text-zinc-400 font-mono text-xs mb-1 tracking-wider uppercase">Team 2</p>
            <p className="text-xl md:text-2xl font-black text-white">{marquee_matchup?.teamB?.name || 'Unknown'}</p>
            <p className="font-mono mt-2 text-base md:text-lg font-bold" style={{ color: currentTheme.primary }}>
              Proj: {marquee_matchup?.teamB?.proj || 0} pts
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Cash Tracker */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 relative shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Banknote className="text-emerald-400" size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">The Bounty Board</h3>
                <p className="text-zinc-400 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">Weekly High Output / Payouts</p>
              </div>
            </div>
            
            <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800 shadow-inner">
              <button
                onClick={() => setBountyView('live')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  bountyView === 'live' 
                    ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                LIVE SEASON
              </button>
              <button
                onClick={() => setBountyView('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  bountyView === 'all' 
                    ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ALL TIME
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {filtered_bounty.length === 0 ? (
              <p className="text-zinc-500 text-sm italic py-8 text-center">No bounties claimed for this view.</p>
            ) : (
              filtered_bounty.map((b: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-mono text-sm font-black w-6">#{idx + 1}</span>
                    <div>
                      <p className="font-bold text-white text-sm">{b.name}</p>
                      <p className="text-zinc-500 text-[11px] font-mono">{b.breakdown.length} bounties</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-emerald-400 text-base">
                    ${bountyView === 'live' ? b.cashWon : b.totalCash}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly High Score Progression Chart */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20" style={{ borderColor: currentTheme.border }}>
                <Flame size={22} style={{ color: currentTheme.primary }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Weekly High Score Progression</h3>
                <p className="text-zinc-400 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">Max PF Output by Week</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filtered_history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="week" stroke="#71717a" fontSize={11} tickFormatter={(w) => `Wk ${w}`} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="points" name="Weekly High Pts" fill={currentTheme.primary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

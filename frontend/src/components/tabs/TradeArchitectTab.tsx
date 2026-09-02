"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ArrowRightLeft, UserPlus, X, Briefcase, Sparkles, Scale, Ticket, Plus } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

interface TradeAsset {
  id: string;
  name: string;
  subtitle: string;
  type: 'player' | 'pick';
  value: number; // PPG equivalent or Dynasty value
  meta?: any;
}

const COMMON_PICKS = [
  { name: '2025 Early 1st', value: 18.0, subtitle: 'Top 4 Projected' },
  { name: '2025 Mid 1st', value: 14.5, subtitle: 'Pick 1.05 - 1.08' },
  { name: '2025 Late 1st', value: 11.5, subtitle: 'Pick 1.09 - 1.12' },
  { name: '2025 2nd Round', value: 8.0, subtitle: 'Round 2' },
  { name: '2025 3rd Round', value: 4.5, subtitle: 'Round 3' },
  { name: '2026 1st Round', value: 13.5, subtitle: 'Future Capital' },
  { name: '2026 2nd Round', value: 7.0, subtitle: 'Future Capital' },
  { name: '2027 1st Round', value: 12.5, subtitle: 'Future Capital' },
];

export default function TradeArchitectTab() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [teamA, setTeamA] = useState<TradeAsset[]>([]);
  const [teamB, setTeamB] = useState<TradeAsset[]>([]);
  const [addingTo, setAddingTo] = useState<'A' | 'B'>('A');

  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=2024`);
        const json = await res.json();
        if (Array.isArray(json)) setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return data.filter(p => p.player_name?.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 6);
  }, [data, searchTerm]);

  const addPlayer = (player: any) => {
    const asset: TradeAsset = {
      id: `p-${player.player_id}`,
      name: player.player_name,
      subtitle: `${player.position} • ${player.recent_team || 'FA'}`,
      type: 'player',
      value: player.ppg || 0,
      meta: player,
    };

    if (addingTo === 'A') {
      if (!teamA.find(a => a.id === asset.id)) setTeamA([...teamA, asset]);
    } else {
      if (!teamB.find(a => a.id === asset.id)) setTeamB([...teamB, asset]);
    }
    setSearchTerm('');
  };

  const addPick = (pick: typeof COMMON_PICKS[0]) => {
    const asset: TradeAsset = {
      id: `pick-${pick.name}-${Date.now()}`,
      name: pick.name,
      subtitle: pick.subtitle,
      type: 'pick',
      value: pick.value,
    };

    if (addingTo === 'A') {
      setTeamA([...teamA, asset]);
    } else {
      setTeamB([...teamB, asset]);
    }
  };

  const removeAsset = (side: 'A' | 'B', id: string) => {
    if (side === 'A') setTeamA(teamA.filter(p => p.id !== id));
    else setTeamB(teamB.filter(p => p.id !== id));
  };

  const sumValue = (team: TradeAsset[]) => {
    return team.reduce((acc, p) => acc + (p.value || 0), 0);
  };

  const valA = sumValue(teamA);
  const valB = sumValue(teamB);
  const diff = valA - valB;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-2.5">
            <Briefcase size={24} style={{ color: currentTheme.primary }} /> TRADE ARCHITECT
          </h2>
          <p className="text-zinc-400 text-[11px] sm:text-xs font-semibold tracking-wider uppercase mt-0.5">
            Build, balance, and optimize dynasty trades using empirical player output and draft pick capital.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 relative shadow-xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* TEAM A */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold" style={{ color: currentTheme.primary }}>Team A Receives</h3>
              <span 
                className="px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-sm"
                style={{ backgroundColor: currentTheme.subtle, color: currentTheme.primary, borderColor: currentTheme.border }}
              >
                {valA.toFixed(1)} PPG Value
              </span>
            </div>
            
            <div className="space-y-2 min-h-[160px]">
              {teamA.length === 0 && (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-semibold uppercase tracking-wider border-2 border-dashed border-zinc-800 rounded-xl p-8">
                  No assets added to Team A
                </div>
              )}
              {teamA.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    {a.type === 'pick' ? (
                      <Ticket size={16} className="text-amber-400 shrink-0" />
                    ) : (
                      <UserPlus size={16} className="text-zinc-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-white text-sm">{a.name}</div>
                      <div className="text-xs text-zinc-500 font-mono">{a.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-xs text-zinc-300">{a.value.toFixed(1)} PPG</span>
                    <button onClick={() => removeAsset('A', a.id)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { setAddingTo('A'); document.getElementById('tradeSearch')?.focus(); }}
              className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all border border-dashed ${
                addingTo === 'A' 
                  ? 'bg-zinc-800 text-white shadow-md' 
                  : 'text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-white'
              }`}
              style={addingTo === 'A' ? { borderColor: currentTheme.border, color: currentTheme.primary } : {}}
            >
              <Plus size={16} /> Add Asset to Team A
            </button>
          </div>

          {/* TEAM B */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-cyan-400">Team B Receives</h3>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
                {valB.toFixed(1)} PPG Value
              </span>
            </div>
            
            <div className="space-y-2 min-h-[160px]">
              {teamB.length === 0 && (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-semibold uppercase tracking-wider border-2 border-dashed border-zinc-800 rounded-xl p-8">
                  No assets added to Team B
                </div>
              )}
              {teamB.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    {a.type === 'pick' ? (
                      <Ticket size={16} className="text-amber-400 shrink-0" />
                    ) : (
                      <UserPlus size={16} className="text-zinc-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-white text-sm">{a.name}</div>
                      <div className="text-xs text-zinc-500 font-mono">{a.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-xs text-zinc-300">{a.value.toFixed(1)} PPG</span>
                    <button onClick={() => removeAsset('B', a.id)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { setAddingTo('B'); document.getElementById('tradeSearch')?.focus(); }}
              className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all border border-dashed ${
                addingTo === 'B' 
                  ? 'bg-zinc-800 text-white shadow-md' 
                  : 'text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-white'
              }`}
              style={addingTo === 'B' ? { borderColor: 'rgba(6, 182, 212, 0.4)', color: '#06b6d4' } : {}}
            >
              <Plus size={16} /> Add Asset to Team B
            </button>
          </div>

        </div>

        {/* Trade Asset Adder Toolbar */}
        <div className="pt-6 border-t border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              Adding to: <span className="text-white font-black">{addingTo === 'A' ? 'Team A' : 'Team B'}</span>
            </span>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setAddingTo('A')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  addingTo === 'A' ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
                style={addingTo === 'A' ? { backgroundColor: currentTheme.primary } : {}}
              >
                Team A
              </button>
              <button 
                type="button" 
                onClick={() => setAddingTo('B')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  addingTo === 'B' ? 'bg-cyan-400 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Team B
              </button>
            </div>
          </div>

          {/* Quick Draft Pick Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
              <Ticket size={13} className="text-amber-400" /> Insert Draft Capital:
            </span>
            <div className="flex flex-wrap gap-2">
              {COMMON_PICKS.map((pick) => (
                <button
                  key={pick.name}
                  type="button"
                  onClick={() => addPick(pick)}
                  className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 rounded-lg text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Plus size={12} className="text-amber-400" />
                  <span>{pick.name}</span>
                  <span className="text-zinc-500 text-[10px] font-mono">({pick.value}p)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Player Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              id="tradeSearch"
              type="text"
              placeholder={`Search and add player to Team ${addingTo}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-20">
                {searchResults.map(p => (
                  <button
                    key={p.player_id}
                    onClick={() => addPlayer(p)}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800/80 flex items-center justify-between border-b border-zinc-800/50 last:border-0 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{p.player_name}</div>
                      <div className="text-xs text-zinc-400 font-mono">{p.position} • {p.recent_team || 'FA'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-300">{(p.ppg || 0).toFixed(1)} PPG</span>
                      <Plus size={16} style={{ color: currentTheme.primary }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trade Verdict Evaluation Card */}
        {(teamA.length > 0 || teamB.length > 0) && (
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                style={{ backgroundColor: currentTheme.subtle, borderColor: currentTheme.border }}
              >
                <Scale size={20} style={{ color: currentTheme.primary }} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-mono">Trade Verdict</div>
                <div className="text-sm font-black text-white font-coach tracking-wide">
                  {Math.abs(diff) < 2 
                    ? "BALANCED FAIR TRADE" 
                    : diff > 0 
                      ? `TEAM A FAVORED (+${diff.toFixed(1)} PPG VALUE)` 
                      : `TEAM B FAVORED (+${Math.abs(diff).toFixed(1)} PPG VALUE)`
                  }
                </div>
              </div>
            </div>
            <button
              onClick={() => { setTeamA([]); setTeamB([]); }}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors"
            >
              Reset Board
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

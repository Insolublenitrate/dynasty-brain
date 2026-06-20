"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, ArrowRightLeft, UserPlus, X, Briefcase } from 'lucide-react';

export default function TradeArchitect() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [teamA, setTeamA] = useState<any[]>([]);
  const [teamB, setTeamB] = useState<any[]>([]);
  const [addingTo, setAddingTo] = useState<'A' | 'B'>('A');

  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=2025`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return data.filter(p => p.player_name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
  }, [data, searchTerm]);

  const addPlayer = (player: any) => {
    if (addingTo === 'A') {
      if (!teamA.find(p => p.player_id === player.player_id)) setTeamA([...teamA, player]);
    } else {
      if (!teamB.find(p => p.player_id === player.player_id)) setTeamB([...teamB, player]);
    }
    setSearchTerm('');
  };

  const removePlayer = (side: 'A' | 'B', id: string) => {
    if (side === 'A') setTeamA(teamA.filter(p => p.player_id !== id));
    else setTeamB(teamB.filter(p => p.player_id !== id));
  };

  const sumValue = (team: any[]) => {
    return team.reduce((acc, p) => acc + (p.ppg || 0), 0);
  };

  const valA = sumValue(teamA);
  const valB = sumValue(teamB);
  const diff = valA - valB;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Briefcase className="text-indigo-500" /> Trade Architect
        </h1>
        <p className="text-slate-400 mt-2">Evaluate and optimize your trades by comparing player values.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* TEAM A */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xl font-bold text-indigo-400">Team A Receives</h2>
              <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-sm font-bold border border-indigo-500/20">
                {valA.toFixed(1)} PPG
              </span>
            </div>
            
            <div className="space-y-2 min-h-[150px]">
              {teamA.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-lg p-6">
                  Add players to Team A
                </div>
              )}
              {teamA.map(p => (
                <div key={p.player_id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-3 rounded-lg">
                  <div>
                    <div className="font-bold text-white">{p.player_name}</div>
                    <div className="text-xs text-slate-400">{p.position} - {p.recent_team}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-slate-300">{(p.ppg || 0).toFixed(1)} PPG</span>
                    <button onClick={() => removePlayer('A', p.player_id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { setAddingTo('A'); document.getElementById('tradeSearch')?.focus(); }}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors border border-dashed ${addingTo === 'A' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/50' : 'text-slate-400 border-slate-700 hover:bg-slate-800'}`}
            >
              <UserPlus size={18} /> Add to Team A
            </button>
          </div>

          {/* TEAM B */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xl font-bold text-emerald-400">Team B Receives</h2>
              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold border border-emerald-500/20">
                {valB.toFixed(1)} PPG
              </span>
            </div>
            
            <div className="space-y-2 min-h-[150px]">
              {teamB.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-lg p-6">
                  Add players to Team B
                </div>
              )}
              {teamB.map(p => (
                <div key={p.player_id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-3 rounded-lg">
                  <div>
                    <div className="font-bold text-white">{p.player_name}</div>
                    <div className="text-xs text-slate-400">{p.position} - {p.recent_team}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-slate-300">{(p.ppg || 0).toFixed(1)} PPG</span>
                    <button onClick={() => removePlayer('B', p.player_id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { setAddingTo('B'); document.getElementById('tradeSearch')?.focus(); }}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors border border-dashed ${addingTo === 'B' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50' : 'text-slate-400 border-slate-700 hover:bg-slate-800'}`}
            >
              <UserPlus size={18} /> Add to Team B
            </button>
          </div>
        </div>

        {/* Search Bar Overlay */}
        <div className="mt-8 pt-6 border-t border-slate-800 relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Player Search</span>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">Adding to Team {addingTo}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              id="tradeSearch"
              type="text" 
              placeholder={`Search for players to add to Team ${addingTo}...`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
            {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map((p, idx) => (
                <button
                  key={`${p.player_id}-${idx}`}
                  className="w-full text-left px-4 py-3 hover:bg-slate-700 flex items-center justify-between transition-colors border-b border-slate-700/50 last:border-0"
                  onClick={() => addPlayer(p)}
                >
                  <div>
                    <span className="font-bold text-white">{p.player_name}</span>
                    <span className="ml-2 text-xs text-slate-400">{p.position} - {p.recent_team}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-300">{(p.ppg || 0).toFixed(1)} PPG</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trade Evaluation Summary */}
      {(teamA.length > 0 || teamB.length > 0) && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ArrowRightLeft size={120} />
          </div>
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            Trade Evaluation
          </h2>
          
          <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
            <div className={`text-center flex-1 ${diff > 0 ? 'scale-110 transition-transform' : 'opacity-70'}`}>
              <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Team A Value</div>
              <div className={`text-5xl font-black ${diff > 0 ? 'text-indigo-400' : 'text-slate-300'}`}>
                {valA.toFixed(1)}
              </div>
            </div>

            <div className="text-slate-600 flex-shrink-0">
              <ArrowRightLeft size={32} />
            </div>

            <div className={`text-center flex-1 ${diff < 0 ? 'scale-110 transition-transform' : 'opacity-70'}`}>
              <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Team B Value</div>
              <div className={`text-5xl font-black ${diff < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {valB.toFixed(1)}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center pt-8 border-t border-slate-800/50">
            {diff === 0 ? (
              <span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg font-bold text-lg border border-slate-700">Perfectly Balanced Trade</span>
            ) : diff > 0 ? (
              <div className="flex flex-col items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg font-bold text-lg border border-indigo-500/30">
                  Team A Wins by {Math.abs(diff).toFixed(1)} PPG
                </span>
                <p className="text-slate-400 text-sm max-w-md">Team A is receiving more overall value based on historical points per game.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg font-bold text-lg border border-emerald-500/30">
                  Team B Wins by {Math.abs(diff).toFixed(1)} PPG
                </span>
                <p className="text-slate-400 text-sm max-w-md">Team B is receiving more overall value based on historical points per game.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

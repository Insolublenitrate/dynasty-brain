"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowDown, ArrowUp, Database } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import SeasonSelector from '@/components/SeasonSelector';
import { getApiUrl } from '@/config/api';

export default function PlayerDatabaseTab() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonYear, setSeasonYear] = useState("2024");

  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'ppg', direction: 'desc' });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=${seasonYear}`);
        if (!res.ok) throw new Error('Failed to fetch players');
        const json = await res.json();
        if (Array.isArray(json)) setData(json);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [seasonYear]);

  const handleSort = (key: string) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter(p => p.player_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (positionFilter !== 'ALL') {
      filtered = filtered.filter(p => p.position === positionFilter);
    }

    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key] || 0;
      const bVal = b[sortConfig.key] || 0;
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, positionFilter, sortConfig]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
            <Database size={28} style={{ color: currentTheme.primary }} /> PLAYER DATABASE
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            Explore and query advanced player stats, efficiency ratings, and usage splits.
          </p>
        </div>
        <SeasonSelector currentSeason={seasonYear} onSeasonChange={setSeasonYear} />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search by player name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1 shrink-0">
            <Filter size={14} /> Position:
          </span>
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
            {['ALL', 'QB', 'RB', 'WR', 'TE'].map(pos => (
              <button
                key={pos}
                onClick={() => setPositionFilter(pos)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  positionFilter === pos
                    ? 'bg-zinc-800 text-white shadow border'
                    : 'text-zinc-400 hover:text-white'
                }`}
                style={positionFilter === pos ? { borderColor: currentTheme.border, color: currentTheme.primary } : {}}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('player_name')}>
                  Player {sortConfig.key === 'player_name' && (sortConfig.direction === 'asc' ? <ArrowUp className="inline ml-1 w-3 h-3" /> : <ArrowDown className="inline ml-1 w-3 h-3" />)}
                </th>
                <th className="py-3 px-4">Pos</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('games_played')}>
                  GP {sortConfig.key === 'games_played' && (sortConfig.direction === 'asc' ? <ArrowUp className="inline ml-1 w-3 h-3" /> : <ArrowDown className="inline ml-1 w-3 h-3" />)}
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ppg')}>
                  PPG {sortConfig.key === 'ppg' && (sortConfig.direction === 'asc' ? <ArrowUp className="inline ml-1 w-3 h-3" /> : <ArrowDown className="inline ml-1 w-3 h-3" />)}
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('fantasy_points')}>
                  Total Pts {sortConfig.key === 'fantasy_points' && (sortConfig.direction === 'asc' ? <ArrowUp className="inline ml-1 w-3 h-3" /> : <ArrowDown className="inline ml-1 w-3 h-3" />)}
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('yprr_approx')}>
                  Est. YPRR {sortConfig.key === 'yprr_approx' && (sortConfig.direction === 'asc' ? <ArrowUp className="inline ml-1 w-3 h-3" /> : <ArrowDown className="inline ml-1 w-3 h-3" />)}
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('target_rate')}>
                  Target Share {sortConfig.key === 'target_rate' && (sortConfig.direction === 'asc' ? <ArrowUp className="inline ml-1 w-3 h-3" /> : <ArrowDown className="inline ml-1 w-3 h-3" />)}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 font-sans">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: currentTheme.primary }}></div>
                    Loading player database...
                  </td>
                </tr>
              ) : processedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 font-sans">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                processedData.slice(0, 100).map((player) => (
                  <tr key={player.player_id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-white text-sm">
                      {player.player_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {player.position}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-sans">
                      {player.recent_team || 'FA'}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300">
                      {player.games_played}
                    </td>
                    <td className="py-3 px-4 text-right font-bold" style={{ color: currentTheme.primary }}>
                      {player.ppg ? player.ppg.toFixed(1) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300">
                      {player.fantasy_points ? player.fantasy_points.toFixed(1) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      {player.yprr_approx ? player.yprr_approx.toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300">
                      {player.target_rate ? `${(player.target_rate * 100).toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

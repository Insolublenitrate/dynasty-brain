"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowDown, ArrowUp } from 'lucide-react';

export default function PlayerDatabase() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'ppg', direction: 'desc' });

  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=2024`);
        if (!res.ok) throw new Error('Failed to fetch players');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-rose-500">
        Error loading database: {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Player Database</h1>
        <p className="text-zinc-400 mt-2">Deep level cross-referenced stats. YPRR, Route %, Catch Rate, Target Rate, etc.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search players..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-zinc-500" size={18} />
          <select 
            className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="ALL">All Positions</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
          </select>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="text-xs text-zinc-400 bg-zinc-950 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('player_name')}>
                  Player {sortConfig.key === 'player_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4">Pos</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('games_played')}>
                  G {sortConfig.key === 'games_played' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('ppg')}>
                  PPG {sortConfig.key === 'ppg' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('yprr_approx')}>
                  YPRR (Est) {sortConfig.key === 'yprr_approx' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('catch_rate')}>
                  Catch % {sortConfig.key === 'catch_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('offense_pct')}>
                  Snap % {sortConfig.key === 'offense_pct' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('target_rate')}>
                  Target Rate {sortConfig.key === 'target_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {processedData.map((row) => (
                <tr key={row.player_id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-200">{row.player_name}</td>
                  <td className="px-6 py-4 text-zinc-400">{row.position}</td>
                  <td className="px-6 py-4 text-zinc-400">{row.recent_team}</td>
                  <td className="px-6 py-4 text-zinc-300">{row.games_played}</td>
                  <td className="px-6 py-4 text-zinc-300">{(row.ppg || 0).toFixed(1)}</td>
                  <td className="px-6 py-4 text-zinc-300">{(row.yprr_approx || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-zinc-300">{row.catch_rate !== null ? `${((row.catch_rate || 0) * 100).toFixed(1)}%` : '0%'}</td>
                  <td className="px-6 py-4 text-zinc-300">{row.offense_pct !== null ? `${((row.offense_pct || 0) * 100).toFixed(1)}%` : 'N/A'}</td>
                  <td className="px-6 py-4 text-zinc-300">{row.target_rate !== null ? `${((row.target_rate || 0) * 100).toFixed(1)}%` : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {processedData.length === 0 && (
            <div className="p-8 text-center text-zinc-500">
              No players found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

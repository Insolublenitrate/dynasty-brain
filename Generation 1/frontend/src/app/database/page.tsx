"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowDown, ArrowUp } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import SeasonSelector from '@/components/SeasonSelector';

export default function PlayerDatabase() {
  const { seasonYear } = useLeague();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('Receiving');
  const [sortConfig, setSortConfig] = useState({ key: 'fantasy_points_ppr', direction: 'desc' });
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=${seasonYear}`);
        if (!res.ok) throw new Error('Failed to fetch players');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
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

    // Filter out rows with 0 relevant stats depending on tab
    if (activeTab === 'Receiving') filtered = filtered.filter(p => p.targets > 0);
    if (activeTab === 'Passing') filtered = filtered.filter(p => p.pass_attempts > 0);
    if (activeTab === 'Rushing') filtered = filtered.filter(p => p.rush_attempts > 0);

    if (searchTerm) {
      filtered = filtered.filter(p => p.player_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (positionFilter !== 'ALL') {
      filtered = filtered.filter(p => p.position && p.position.includes(positionFilter));
    }
    
    if (teamFilter !== 'ALL') {
      filtered = filtered.filter(p => p.recent_team === teamFilter);
    }

    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key] || 0;
      const bVal = b[sortConfig.key] || 0;
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, positionFilter, teamFilter, sortConfig, activeTab]);

  const uniqueTeams = useMemo(() => {
    const teams = new Set(data.map(p => p.recent_team).filter(Boolean));
    return ['ALL', ...Array.from(teams).sort()];
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
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

  const renderSortableHeader = (label: string, key: string) => (
    <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort(key)}>
      {label} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Player Database</h1>
          <p className="text-slate-400 mt-2">Deep level cross-referenced stats. YPRR, Route %, Catch Rate, Target Rate, etc.</p>
        </div>
        <SeasonSelector />
      </div>

      <div className="flex flex-col gap-4">
        {/* Main Nav Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          {['Receiving', 'Passing', 'Rushing', 'Movers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white border-b-2 border-indigo-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {['ALL', 'QB', 'RB', 'WR', 'TE', 'DEF'].map(pos => (
              <button
                key={pos}
                onClick={() => setPositionFilter(pos)}
                className={`px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-colors ${
                  positionFilter === pos 
                    ? 'bg-slate-700 text-white ring-1 ring-slate-500' 
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          <div className="w-full md:w-auto flex-shrink-0">
             <select 
               className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 w-full"
               value={teamFilter}
               onChange={(e) => setTeamFilter(e.target.value)}
             >
               {uniqueTeams.map((team: any) => (
                 <option key={team} value={team}>{team === 'ALL' ? 'All Teams' : team}</option>
               ))}
             </select>
          </div>

          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search players..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        {activeTab !== 'Movers' && (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-950/50 uppercase font-bold sticky top-0 shadow-sm z-10">
                <tr>
                  {renderSortableHeader('Player', 'player_name')}
                  <th className="px-6 py-4">Pos</th>
                  <th className="px-6 py-4">Team</th>
                  
                  {activeTab === 'Receiving' && (
                    <>
                      {renderSortableHeader('Tgt', 'targets')}
                      {renderSortableHeader('Rec', 'receptions')}
                      {renderSortableHeader('Yds', 'receiving_yards')}
                      {renderSortableHeader('Catch %', 'catch_rate')}
                      {renderSortableHeader('YPRR', 'yprr_approx')}
                      {renderSortableHeader('Target Rate', 'target_rate')}
                      {renderSortableHeader('Air Yds/Tgt', 'air_yards_per_target')}
                      {renderSortableHeader('YAC/Rec', 'yac_per_reception')}
                    </>
                  )}

                  {activeTab === 'Passing' && (
                    <>
                      {renderSortableHeader('Pass Att', 'pass_attempts')}
                      {renderSortableHeader('EPA/Play', 'pass_epa_per_play')}
                      {renderSortableHeader('CPOE', 'cpoe')}
                    </>
                  )}

                  {activeTab === 'Rushing' && (
                    <>
                      {renderSortableHeader('Rush Att', 'rush_attempts')}
                      {renderSortableHeader('Rush Yds', 'rushing_yards')}
                      {renderSortableHeader('EPA/Att', 'rush_epa_per_attempt')}
                      {renderSortableHeader('RZ Rush', 'redzone_rush_attempts')}
                    </>
                  )}
                  

                  {renderSortableHeader('G', 'games_played')}
                  {renderSortableHeader('Snap %', 'offense_pct')}
                  {renderSortableHeader('Fan Pts', 'fantasy_points_ppr')}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {processedData.map((row: any) => (
                  <tr 
                    key={row.player_id} 
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedPlayer(row)}
                  >
                    <td className="px-6 py-4 font-medium text-indigo-400">{row.player_name}</td>
                    <td className="px-6 py-4 text-slate-400">{row.position}</td>
                    <td className="px-6 py-4 text-slate-400">{row.recent_team}</td>
                    
                    {activeTab === 'Receiving' && (
                      <>
                        <td className="px-6 py-4 text-slate-300">{(row.targets || 0)}</td>
                        <td className="px-6 py-4 text-slate-300">{(row.receptions || 0)}</td>
                        <td className="px-6 py-4 text-slate-300">{(row.receiving_yards || 0)}</td>
                        <td className="px-6 py-4 text-slate-300">{row.catch_rate !== null ? `${((row.catch_rate || 0) * 100).toFixed(1)}%` : '0%'}</td>
                        <td className="px-6 py-4 text-slate-300">{(row.yprr_approx || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-slate-300">{row.target_rate !== null ? `${((row.target_rate || 0) * 100).toFixed(1)}%` : 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-300">{(row.air_yards_per_target || 0).toFixed(1)}</td>
                        <td className="px-6 py-4 text-slate-300">{(row.yac_per_reception || 0).toFixed(1)}</td>
                      </>
                    )}

                    {activeTab === 'Passing' && (
                      <>
                        <td className="px-6 py-4 text-slate-300">{(row.pass_attempts || 0)}</td>
                        <td className="px-6 py-4 text-slate-300">{(row.pass_epa_per_play || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-slate-300">{(row.cpoe || 0).toFixed(1)}</td>
                      </>
                    )}

                    {activeTab === 'Rushing' && (
                      <>
                        <td className="px-6 py-4 text-slate-300">{(row.rush_attempts || 0)}</td>
                        <td className="px-6 py-4 text-slate-300">{(row.rushing_yards || 0)}</td>
                        <td className="px-6 py-4 text-slate-300">{(row.rush_epa_per_attempt || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-slate-300">{(row.redzone_rush_attempts || 0)}</td>
                      </>
                    )}
                    

                    <td className="px-6 py-4 text-slate-300">{row.games_played}</td>
                    <td className="px-6 py-4 text-slate-300">{row.offense_pct !== null ? `${((row.offense_pct || 0) * 100).toFixed(1)}%` : 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-300">{(row.fantasy_points_ppr || 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {processedData.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No players found matching your criteria.
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'Movers' && (
          <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-4 p-8">
            <ArrowUp size={48} className="text-slate-700" />
            <p className="text-lg">Movers data requires historical weekly variance metrics.</p>
            <p className="text-sm text-slate-600">This feature is coming in a future update.</p>
          </div>
        )}
      </div>

      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              onClick={() => setSelectedPlayer(null)}
            >
              ✕
            </button>
            <div className="mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                {selectedPlayer.player_name}
                <span className="text-lg font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">{selectedPlayer.position} - {selectedPlayer.recent_team}</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Targets</div>
                <div className="text-2xl font-bold text-indigo-400">{selectedPlayer.targets || 0}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider">RZ Targets</div>
                <div className="text-2xl font-bold text-rose-400">{selectedPlayer.redzone_targets || 0}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Rush Att</div>
                <div className="text-2xl font-bold text-indigo-400">{selectedPlayer.rush_attempts || 0}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider">RZ Rush</div>
                <div className="text-2xl font-bold text-rose-400">{selectedPlayer.redzone_rush_attempts || 0}</div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white mb-2">Advanced Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                  <span className="text-slate-400">Total Yards</span>
                  <span className="font-bold text-white">{selectedPlayer.total_yards || 0}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                  <span className="text-slate-400">Air Yards / Target</span>
                  <span className="font-bold text-white">{(selectedPlayer.air_yards_per_target || 0).toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                  <span className="text-slate-400">YAC / Reception</span>
                  <span className="font-bold text-white">{(selectedPlayer.yac_per_reception || 0).toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                  <span className="text-slate-400">EPA / Rush Att</span>
                  <span className="font-bold text-white">{(selectedPlayer.rush_epa_per_attempt || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
              <button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                onClick={() => setSelectedPlayer(null)}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

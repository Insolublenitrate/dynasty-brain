"use client";

import { useState, useEffect } from 'react';
import { useLeague } from '@/context/LeagueContext';
import { useRouter } from 'next/navigation';
import { Activity, Search, AlertTriangle } from 'lucide-react';
import SeasonSelector from '@/components/SeasonSelector';

import { LiveMetricCard } from '@/components/LiveMetricCard';

export default function PlayerAnalyzer() {
  const [playersData, setPlayersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [seasonYear, setSeasonYear] = useState("2024");

  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const { leagueId, isLoading: isLeagueLoading } = useLeague();
  const router = useRouter();

  useEffect(() => {
    if (isLeagueLoading) return;
    if (!leagueId) {
      router.push('/login');
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=${seasonYear}&t=${new Date().getTime()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch from backend");
        const json = await res.json();
        if (json.error || !Array.isArray(json)) {
          setErrorMsg(json.error || "Failed to load player data.");
          setPlayersData([]);
        } else {
          setPlayersData(json);
          setErrorMsg(null);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Network error or backend is down.");
        setPlayersData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [leagueId, isLeagueLoading, router, seasonYear]);

  if (isLeagueLoading) return null;

  // Helper to render leaderboards
  const renderLeaderboard = (title: string, sortKey: string, cols: {label: string, key: string, isFloat?: boolean}[]) => {
    const sorted = [...playersData].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)).slice(0, 10);
    
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-800">
          <h3 className="font-semibold text-slate-200">{title}</h3>
        </div>
        <div className="overflow-x-auto flex-1 p-4">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-2 font-medium">Rank</th>
                <th className="pb-2 font-medium">Player</th>
                <th className="pb-2 font-medium">Team</th>
                {cols.map(c => (
                  <th key={c.key} className="pb-2 font-medium text-right">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => (
                <tr key={p.player_id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20">
                  <td className="py-2 text-slate-500">{idx + 1}</td>
                  <td className="py-2 font-medium text-indigo-400">{p.player_name}</td>
                  <td className="py-2 text-slate-300">{p.recent_team}</td>
                  {cols.map(c => (
                    <td key={c.key} className="py-2 text-right text-slate-300">
                      {c.isFloat ? (p[c.key] || 0).toFixed(1) : (p[c.key] || 0)}
                    </td>
                  ))}
                </tr>
              ))}
              {sorted.length === 0 && !loading && (
                <tr>
                  <td colSpan={3 + cols.length} className="py-4 text-center text-slate-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Live Metrics Calculations
  const qbs = playersData.filter(p => p.position === 'QB' && (p.pass_attempts || 0) > 10).sort((a,b) => (b.pass_epa_per_play || 0) - (a.pass_epa_per_play || 0));
  const qbLeader = qbs[0];

  const wrs = playersData.filter(p => p.position && p.position.includes('WR') && (p.targets || 0) > 10).sort((a,b) => (b.air_yards_per_target || 0) - (a.air_yards_per_target || 0));
  const wrLeader = wrs[0];

  const rbs = playersData.filter(p => p.position === 'RB' && (p.rush_attempts || 0) > 10).sort((a,b) => (b.rush_epa_per_attempt || 0) - (a.rush_epa_per_attempt || 0));
  const rbLeader = rbs[0];

  const defs = playersData.filter(p => p.position === 'DEF').map(p => ({...p, pressures: (p.sacks || 0) + (p.qb_hits || 0)})).sort((a,b) => b.pressures - a.pressures);
  const defLeader = defs[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Activity className="text-indigo-500" /> Player Analyzer
            </h1>
            {!loading && !errorMsg && (
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
                {playersData.length} players loaded
              </span>
            )}
          </div>
          <p className="text-slate-400 mt-2 mb-4">Explore league-wide leaderboards for targets, redzone usage, and advanced metrics inspired by NFL Savant.</p>
          <SeasonSelector value={seasonYear} onChange={setSeasonYear} />
        </div>

        {/* Player Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full md:w-64 relative z-50">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-300">Player Search</label>
          </div>
          <div className="relative">
            <button 
              onClick={() => {
                const found = playersData.find(p => p.player_name.toLowerCase() === searchInput.toLowerCase());
                if (found) setSelectedPlayer(found);
                setShowSuggestions(false);
              }}
              className="absolute left-2.5 top-2 text-slate-500 hover:text-indigo-400 cursor-pointer z-10"
            >
              <Search size={16} />
            </button>
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const found = playersData.find(p => p.player_name.toLowerCase() === searchInput.toLowerCase());
                  if (found) setSelectedPlayer(found);
                  setShowSuggestions(false);
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search player..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {showSuggestions && searchInput.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-[100]">
                {playersData
                  .filter(p => p.player_name.toLowerCase().includes(searchInput.toLowerCase()))
                  .slice(0, 10)
                  .map(p => (
                    <div 
                      key={p.player_id}
                      className="px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                      onClick={() => {
                        setSearchInput(p.player_name);
                        setSelectedPlayer(p);
                        setShowSuggestions(false);
                      }}
                    >
                      {p.player_name} <span className="text-xs text-slate-500">{p.recent_team}</span>
                    </div>
                  ))}
                {playersData.filter(p => p.player_name.toLowerCase().includes(searchInput.toLowerCase())).length === 0 && (
                  <div className="px-3 py-2 text-sm text-slate-500 italic">No players found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : errorMsg ? (
        <div className="flex flex-1 flex-col items-center justify-center text-rose-500 gap-2">
          <AlertTriangle size={32} />
          <p className="font-semibold">{errorMsg}</p>
        </div>
      ) : (
        <>
          {/* Live Metric Cards Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {rbLeader && (
              <LiveMetricCard 
                title="RUSH EPA / ATT"
                metricValue={(rbLeader.rush_epa_per_attempt || 0).toFixed(2)}
                playerName={rbLeader.player_name}
                team={rbLeader.recent_team || 'FA'}
                rank={1}
                totalPlayers={rbs.length}
                vsLastWeek={0.12} // Mock Vs Last Wk
                isPositive={(rbLeader.rush_epa_per_attempt || 0) >= 0}
                subMetrics={[
                  { label: "CARRIES", value: rbLeader.rush_attempts || 0 },
                  { label: "RUSH YDS", value: rbLeader.rushing_yards || 0 },
                  { label: "YDS / ATT", value: rbLeader.rush_attempts ? ((rbLeader.rushing_yards || 0) / rbLeader.rush_attempts).toFixed(1) : 0 },
                  { label: "SNAP %", value: ((rbLeader.offense_pct || 0) * 100).toFixed(1) }
                ]}
              />
            )}
            
            {qbLeader && (
              <LiveMetricCard 
                title="EPA / DB"
                metricValue={(qbLeader.pass_epa_per_play || 0).toFixed(2)}
                playerName={qbLeader.player_name}
                team={qbLeader.recent_team || 'FA'}
                rank={1}
                totalPlayers={qbs.length}
                vsLastWeek={0.01}
                isPositive={(qbLeader.pass_epa_per_play || 0) >= 0}
                subMetrics={[
                  { label: "DROPBACKS", value: qbLeader.pass_attempts || 0 },
                  { label: "PASS YDS", value: qbLeader.total_yards - (qbLeader.rushing_yards || 0) },
                  { label: "CPOE %", value: (qbLeader.cpoe || 0).toFixed(1) },
                  { label: "PPG", value: (qbLeader.ppg || 0).toFixed(1) }
                ]}
              />
            )}

            {wrLeader && (
              <LiveMetricCard 
                title="AIR YDS / TGT"
                metricValue={(wrLeader.air_yards_per_target || 0).toFixed(2)}
                playerName={wrLeader.player_name}
                team={wrLeader.recent_team || 'FA'}
                rank={1}
                totalPlayers={wrs.length}
                vsLastWeek={0.15}
                isPositive={(wrLeader.air_yards_per_target || 0) >= 0}
                subMetrics={[
                  { label: "TARGETS", value: wrLeader.targets || 0 },
                  { label: "REC", value: wrLeader.receptions || 0 },
                  { label: "REC YDS", value: wrLeader.receiving_yards || 0 },
                  { label: "CATCH %", value: ((wrLeader.catch_rate || 0) * 100).toFixed(1) }
                ]}
              />
            )}

            {defLeader && (
              <LiveMetricCard 
                title="PRESSURES"
                metricValue={defLeader.pressures}
                playerName={defLeader.player_name}
                team={defLeader.recent_team || 'FA'}
                rank={1}
                totalPlayers={defs.length}
                vsLastWeek={-0.3}
                isPositive={true}
                subMetrics={[
                  { label: "SACKS", value: defLeader.sacks || 0 },
                  { label: "QB HITS", value: defLeader.qb_hits || 0 },
                  { label: "TFL", value: defLeader.tackles_for_loss || 0 },
                  { label: "PASS DEF", value: defLeader.pass_deflections || 0 }
                ]}
              />
            )}
          </div>

          {/* Regular Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {renderLeaderboard("Target Leaders", "targets", [
              { label: "Targets", key: "targets" },
              { label: "Rec", key: "receptions" },
              { label: "Yards", key: "receiving_yards" },
            ])}
            
            {renderLeaderboard("Red Zone Target Leaders", "redzone_targets", [
              { label: "RZ Tgts", key: "redzone_targets" },
              { label: "Targets", key: "targets" },
              { label: "Rec", key: "receptions" },
            ])}

            {renderLeaderboard("Rushing Leaders", "rush_attempts", [
              { label: "Rush Att", key: "rush_attempts" },
              { label: "Rush Yds", key: "rushing_yards" },
              { label: "EPA/Att", key: "rush_epa_per_attempt", isFloat: true },
            ])}

            {renderLeaderboard("Red Zone Rushing Leaders", "redzone_rush_attempts", [
              { label: "RZ Rush", key: "redzone_rush_attempts" },
              { label: "Rush Att", key: "rush_attempts" },
              { label: "Rush Yds", key: "rushing_yards" },
            ])}
            
            {renderLeaderboard("Air Yards Leaders", "air_yards_per_target", [
              { label: "Air Yds/Tgt", key: "air_yards_per_target", isFloat: true },
              { label: "Targets", key: "targets" },
            ])}
            
            {renderLeaderboard("YAC Leaders", "yac_per_reception", [
              { label: "YAC/Rec", key: "yac_per_reception", isFloat: true },
              { label: "Rec", key: "receptions" },
            ])}
          </div>
        </>
      )}

      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 sm:p-8">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl relative max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                  {selectedPlayer.player_name}
                </h2>
                <div className="text-slate-400 font-medium tracking-wide text-sm flex gap-3 mt-1">
                  <span className="bg-slate-700 text-slate-200 px-2.5 py-0.5 rounded">
                    {selectedPlayer.position}
                  </span>
                  <span className="bg-slate-700 text-slate-200 px-2.5 py-0.5 rounded">
                    {selectedPlayer.recent_team || 'FA'}
                  </span>
                  <span>{selectedPlayer.season} Season</span>
                </div>
              </div>
              <button 
                className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-rose-500 hover:text-white transition-colors"
                onClick={() => setSelectedPlayer(null)}
              >
                ✕
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Top Level Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center shadow-inner">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Targets</div>
                  <div className="text-2xl font-black text-indigo-400">{selectedPlayer.targets || 0}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center shadow-inner">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Receptions</div>
                  <div className="text-2xl font-black text-emerald-400">{selectedPlayer.receptions || 0}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center shadow-inner">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Total Yds</div>
                  <div className="text-2xl font-black text-white">{selectedPlayer.total_yards || 0}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center shadow-inner">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Catch %</div>
                  <div className="text-2xl font-black text-slate-300">{selectedPlayer.catch_rate !== null ? `${((selectedPlayer.catch_rate || 0) * 100).toFixed(1)}%` : '0%'}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center shadow-inner">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">RZ Tgts</div>
                  <div className="text-2xl font-black text-rose-400">{selectedPlayer.redzone_targets || 0}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center shadow-inner">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Air Yds/Tgt</div>
                  <div className="text-2xl font-black text-amber-400">{(selectedPlayer.air_yards_per_target || 0).toFixed(1)}</div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Mock Targets by Down */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Targets by Down</h3>
                  <div className="h-48 flex items-end justify-between gap-2 pt-4">
                     <div className="w-full bg-slate-800 rounded-t flex flex-col justify-end relative transition-all hover:bg-slate-700" style={{ height: '35%' }}>
                       <div className="absolute -top-6 w-full text-center text-xs text-indigo-300 font-bold">{Math.round((selectedPlayer.targets || 0) * 0.35)}</div>
                       <div className="bg-indigo-500 h-full w-full rounded-t opacity-80"></div>
                       <div className="text-center text-xs text-slate-400 mt-2 font-semibold">1st</div>
                     </div>
                     <div className="w-full bg-slate-800 rounded-t flex flex-col justify-end relative transition-all hover:bg-slate-700" style={{ height: '40%' }}>
                       <div className="absolute -top-6 w-full text-center text-xs text-indigo-300 font-bold">{Math.round((selectedPlayer.targets || 0) * 0.40)}</div>
                       <div className="bg-indigo-500 h-full w-full rounded-t opacity-80"></div>
                       <div className="text-center text-xs text-slate-400 mt-2 font-semibold">2nd</div>
                     </div>
                     <div className="w-full bg-slate-800 rounded-t flex flex-col justify-end relative transition-all hover:bg-slate-700" style={{ height: '20%' }}>
                       <div className="absolute -top-6 w-full text-center text-xs text-indigo-300 font-bold">{Math.round((selectedPlayer.targets || 0) * 0.20)}</div>
                       <div className="bg-indigo-500 h-full w-full rounded-t opacity-80"></div>
                       <div className="text-center text-xs text-slate-400 mt-2 font-semibold">3rd</div>
                     </div>
                     <div className="w-full bg-slate-800 rounded-t flex flex-col justify-end relative transition-all hover:bg-slate-700" style={{ height: '5%' }}>
                       <div className="absolute -top-6 w-full text-center text-xs text-indigo-300 font-bold">{Math.round((selectedPlayer.targets || 0) * 0.05)}</div>
                       <div className="bg-indigo-500 h-full w-full rounded-t opacity-80"></div>
                       <div className="text-center text-xs text-slate-400 mt-2 font-semibold">4th</div>
                     </div>
                  </div>
                </div>

                {/* Mock Targets by Pass Direction */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Targets by Pass Direction</h3>
                  <div className="grid grid-cols-3 gap-2 h-48 pt-2">
                    {/* Deep Left */}
                    <div className="bg-slate-800/50 rounded flex flex-col items-center justify-center p-2 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                      <span className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Deep Left</span>
                      <span className="text-xl font-bold text-emerald-400">{Math.round((selectedPlayer.targets || 0) * 0.15)}</span>
                    </div>
                    {/* Deep Middle */}
                    <div className="bg-slate-800/50 rounded flex flex-col items-center justify-center p-2 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                      <span className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Deep Mid</span>
                      <span className="text-xl font-bold text-emerald-400">{Math.round((selectedPlayer.targets || 0) * 0.05)}</span>
                    </div>
                    {/* Deep Right */}
                    <div className="bg-slate-800/50 rounded flex flex-col items-center justify-center p-2 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                      <span className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Deep Right</span>
                      <span className="text-xl font-bold text-emerald-400">{Math.round((selectedPlayer.targets || 0) * 0.12)}</span>
                    </div>
                    {/* Short Left */}
                    <div className="bg-slate-800/50 rounded flex flex-col items-center justify-center p-2 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                      <span className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Short Left</span>
                      <span className="text-xl font-bold text-indigo-400">{Math.round((selectedPlayer.targets || 0) * 0.25)}</span>
                    </div>
                    {/* Short Middle */}
                    <div className="bg-slate-800/50 rounded flex flex-col items-center justify-center p-2 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                      <span className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Short Mid</span>
                      <span className="text-xl font-bold text-indigo-400">{Math.round((selectedPlayer.targets || 0) * 0.18)}</span>
                    </div>
                    {/* Short Right */}
                    <div className="bg-slate-800/50 rounded flex flex-col items-center justify-center p-2 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                      <span className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Short Right</span>
                      <span className="text-xl font-bold text-indigo-400">{Math.round((selectedPlayer.targets || 0) * 0.25)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Efficiency Stats */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Advanced Efficiency</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">YAC / Rec</div>
                    <div className="text-2xl font-black text-white">{(selectedPlayer.yac_per_reception || 0).toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Rec EPA / Target</div>
                    <div className="text-2xl font-black text-white">{(selectedPlayer.rec_epa_per_target || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Rush EPA / Att</div>
                    <div className="text-2xl font-black text-white">{(selectedPlayer.rush_epa_per_attempt || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Target Rate</div>
                    <div className="text-2xl font-black text-white">{selectedPlayer.target_rate !== null ? `${((selectedPlayer.target_rate || 0) * 100).toFixed(1)}%` : 'N/A'}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

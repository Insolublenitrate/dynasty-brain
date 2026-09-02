"use client";

import { useState, useEffect, useMemo } from 'react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { Activity, Search, AlertTriangle, Sparkles, Filter } from 'lucide-react';
import SeasonSelector from '@/components/SeasonSelector';
import { LiveMetricCard } from '@/components/LiveMetricCard';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { getApiUrl } from '@/config/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// VORP Baseline ranks (0-indexed)
const REPLACEMENT_LEVELS: Record<string, number> = {
  'QB': 12,
  'RB': 24,
  'WR': 36,
  'TE': 12
};

export default function PlayerAnalyzerTab() {
  const { currentTheme } = useTheme();
  const [playersData, setPlayersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [seasonYear, setSeasonYear] = useState("2024");

  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
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
  }, [seasonYear]);

  // Compute VORP & Consistency
  const enrichedData = useMemo(() => {
    if (!playersData.length) return [];
    
    // Find baselines per position
    const baselines: Record<string, number> = {};
    ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
      const sorted = playersData
        .filter(p => p.position === pos)
        .sort((a, b) => (b.fantasy_points_ppr || 0) - (a.fantasy_points_ppr || 0));
      
      const baselineIdx = Math.min(REPLACEMENT_LEVELS[pos] || 12, sorted.length - 1);
      baselines[pos] = sorted[baselineIdx]?.fantasy_points_ppr || 0;
    });

    return playersData.map(p => {
      const pos = p.position?.includes('WR') ? 'WR' : p.position;
      const baseline = baselines[pos] || 0;
      const vorp = (p.fantasy_points_ppr || 0) - baseline;
      
      let consistency = 75; // Default average
      if (p.games_played > 0) {
          const efficiency = (p.rec_epa_per_target || 0) + (p.rush_epa_per_attempt || 0) + (p.pass_epa_per_play || 0);
          consistency = Math.min(99, Math.max(10, 50 + (efficiency * 20) + (p.games_played * 2)));
      }

      return {
        ...p,
        vorp: Number(vorp.toFixed(1)),
        consistency: Number(consistency.toFixed(1))
      };
    });
  }, [playersData]);

  // Helper to render leaderboards with position and volume qualification
  const renderLeaderboard = (
    title: string, 
    sortKey: string, 
    cols: {label: string, key: string, isFloat?: boolean}[],
    filterFn?: (p: any) => boolean
  ) => {
    let pool = enrichedData;
    if (filterFn) {
      pool = pool.filter(filterFn);
    }

    const sorted = [...pool].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)).slice(0, 10);
    
    return (
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col shadow-xl overflow-hidden hover:border-zinc-700 transition-all">
        <div className="bg-zinc-950/80 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-black text-white uppercase tracking-wider text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            {title}
          </h3>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Min Qualified</span>
        </div>
        <div className="overflow-x-auto flex-1 p-3 sm:p-4">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="pb-2 font-bold uppercase tracking-wider text-[10px] w-8">#</th>
                <th className="pb-2 font-bold uppercase tracking-wider text-[10px]">Player</th>
                <th className="pb-2 font-bold uppercase tracking-wider text-[10px]">Team</th>
                {cols.map(c => (
                  <th key={c.key} className="pb-2 font-bold uppercase tracking-wider text-[10px] text-right">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => (
                <tr key={p.player_id} className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 text-zinc-500 font-mono text-xs">{idx + 1}</td>
                  <td className="py-2.5 font-bold text-white cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => setSelectedPlayer(p)}>
                    <div>{p.player_name}</div>
                    <div className="text-[10px] font-mono text-zinc-500 font-normal">{p.position}</div>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-950 border border-zinc-800 text-zinc-400">{p.recent_team || 'FA'}</span>
                  </td>
                  {cols.map(c => (
                    <td key={c.key} className={cn("py-2.5 text-right font-mono font-bold", 
                      c.key === 'vorp' ? (p[c.key] > 0 ? 'text-emerald-400' : 'text-red-400') : 
                      c.key === 'consistency' ? (p[c.key] >= 80 ? 'text-amber-400' : 'text-zinc-200') : 'text-zinc-200'
                    )}>
                      {c.isFloat ? (p[c.key] || 0).toFixed(1) : (p[c.key] || 0)}
                    </td>
                  ))}
                </tr>
              ))}
              {sorted.length === 0 && !loading && (
                <tr>
                  <td colSpan={3 + cols.length} className="py-8 text-center text-zinc-500 font-bold italic">No qualified players for {seasonYear}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Qualified Live Metrics Calculations
  // 1. QBs strictly with pass attempts >= 150 and games >= 6
  const qbs = enrichedData
    .filter(p => p.position === 'QB' && (p.pass_attempts || 0) >= 150 && (p.games_played || 0) >= 6)
    .sort((a,b) => (b.pass_epa_per_play || 0) - (a.pass_epa_per_play || 0));
  const qbLeader = qbs[0];

  // 2. WRs and TEs strictly with targets >= 40 and games >= 6
  const wrs = enrichedData
    .filter(p => (p.position === 'WR' || p.position === 'TE') && (p.targets || 0) >= 40 && (p.games_played || 0) >= 6)
    .sort((a,b) => (b.air_yards_per_target || 0) - (a.air_yards_per_target || 0));
  const wrLeader = wrs[0];

  // 3. RBs strictly with rush attempts >= 60 and games >= 6
  const rbs = enrichedData
    .filter(p => p.position === 'RB' && (p.rush_attempts || 0) >= 60 && (p.games_played || 0) >= 6)
    .sort((a,b) => (b.rush_epa_per_attempt || 0) - (a.rush_epa_per_attempt || 0));
  const rbLeader = rbs[0];

  // 4. YPRR Leaders (WR/TE strictly with targets >= 40 and rec yards >= 250)
  const yprrReceivers = enrichedData
    .filter(p => (p.position === 'WR' || p.position === 'TE') && (p.targets || 0) >= 40 && (p.receiving_yards || 0) >= 250 && (p.games_played || 0) >= 6)
    .sort((a,b) => (b.yprr_approx || 0) - (a.yprr_approx || 0));
  const yprrLeader = yprrReceivers[0];

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 h-full flex flex-col animate-in fade-in duration-500 pb-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3 uppercase italic">
              <Activity className="text-cyan-400" size={32} /> Player Analyzer
            </h1>
            {!loading && !errorMsg && (
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase bg-zinc-900 text-cyan-400 border border-zinc-800 px-3 py-1 rounded-full shadow-inner">
                {enrichedData.length} PLAYERS LOADED
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1 mb-4">
            Advanced EPA, VORP, Volume Tracking, and Qualified Metric Leaderboards
          </p>
          <SeasonSelector currentSeason={seasonYear} onSeasonChange={setSeasonYear} />
        </div>

        {/* Player Search Bar */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4 w-full md:w-80 relative z-50 shadow-xl">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Player Search</label>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by player name..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />
            {showSuggestions && searchInput && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50">
                {enrichedData
                  .filter(p => p.player_name.toLowerCase().includes(searchInput.toLowerCase()))
                  .slice(0, 8)
                  .map(p => (
                    <div 
                      key={p.player_id}
                      onClick={() => {
                        setSelectedPlayer(p);
                        setSearchInput(p.player_name);
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-2.5 hover:bg-zinc-900 cursor-pointer border-b border-zinc-900 last:border-0 flex justify-between items-center text-xs"
                    >
                      <span className="font-bold text-white">{p.player_name}</span>
                      <span className="font-mono text-zinc-400 text-[10px]">{p.position} • {p.recent_team}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      ) : errorMsg ? (
        <div className="flex flex-1 flex-col items-center justify-center text-red-500 gap-3 py-24">
          <AlertTriangle size={48} />
          <p className="font-black uppercase tracking-widest text-lg">{errorMsg}</p>
        </div>
      ) : (
        <>
          {/* Live Metric Cards Section (Position-Qualified Leaders) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {rbLeader && (
              <LiveMetricCard 
                title="RUSH EPA / ATT"
                metricValue={(rbLeader.rush_epa_per_attempt || 0).toFixed(2)}
                playerName={rbLeader.player_name}
                team={rbLeader.recent_team || 'FA'}
                rank={1}
                totalPlayers={rbs.length}
                vsLastWeek={0.12}
                isPositive={(rbLeader.rush_epa_per_attempt || 0) >= 0}
                subMetrics={[
                  { label: "CARRIES", value: rbLeader.rush_attempts || 0 },
                  { label: "RUSH YDS", value: rbLeader.rushing_yards || 0 },
                  { label: "YDS / ATT", value: rbLeader.rush_attempts ? ((rbLeader.rushing_yards || 0) / rbLeader.rush_attempts).toFixed(1) : 0 },
                  { label: "VORP", value: rbLeader.vorp }
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
                  { label: "PASS ATT", value: qbLeader.pass_attempts || 0 },
                  { label: "PASS EPA", value: (qbLeader.pass_epa_per_play || 0).toFixed(2) },
                  { label: "CPOE %", value: `${(qbLeader.cpoe || 0).toFixed(1)}%` },
                  { label: "VORP", value: qbLeader.vorp }
                ]}
              />
            )}

            {wrLeader && (
              <LiveMetricCard 
                title="AIR YDS / TGT"
                metricValue={(wrLeader.air_yards_per_target || 0).toFixed(1)}
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
                  { label: "VORP", value: wrLeader.vorp }
                ]}
              />
            )}

            {yprrLeader && (
              <LiveMetricCard 
                title="YPRR (ROUTE EFFICIENCY)"
                metricValue={(yprrLeader.yprr_approx || 0).toFixed(2)}
                playerName={yprrLeader.player_name}
                team={yprrLeader.recent_team || 'FA'}
                rank={1}
                totalPlayers={yprrReceivers.length}
                vsLastWeek={0.08}
                isPositive={true}
                subMetrics={[
                  { label: "TARGETS", value: yprrLeader.targets || 0 },
                  { label: "REC YDS", value: yprrLeader.receiving_yards || 0 },
                  { label: "CATCH %", value: `${((yprrLeader.catch_rate || 0) * 100).toFixed(0)}%` },
                  { label: "VORP", value: yprrLeader.vorp }
                ]}
              />
            )}
          </div>

          {/* VORP, Consistency, and Position-Qualified Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderLeaderboard("Most Valuable (VORP)", "vorp", [
              { label: "Points", key: "fantasy_points_ppr", isFloat: true },
              { label: "PPG", key: "ppg", isFloat: true },
              { label: "VORP", key: "vorp", isFloat: true },
            ], (p) => (p.games_played || 0) >= 6)}
            
            {renderLeaderboard("Most Consistent Performers", "consistency", [
              { label: "Points", key: "fantasy_points_ppr", isFloat: true },
              { label: "VORP", key: "vorp", isFloat: true },
              { label: "Consistency", key: "consistency", isFloat: true },
            ], (p) => (p.games_played || 0) >= 6 && ((p.targets || 0) >= 30 || (p.rush_attempts || 0) >= 50 || (p.pass_attempts || 0) >= 100))}

            {renderLeaderboard("Target Leaders (WR / TE / RB)", "targets", [
              { label: "Targets", key: "targets" },
              { label: "Rec", key: "receptions" },
              { label: "Yards", key: "receiving_yards" },
            ], (p) => (p.position === 'WR' || p.position === 'TE' || p.position === 'RB') && (p.targets || 0) >= 30)}
            
            {renderLeaderboard("Red Zone Target Leaders", "redzone_targets", [
              { label: "RZ Tgts", key: "redzone_targets" },
              { label: "Targets", key: "targets" },
              { label: "Rec", key: "receptions" },
            ], (p) => (p.position === 'WR' || p.position === 'TE' || p.position === 'RB') && (p.redzone_targets || 0) >= 4)}

            {renderLeaderboard("Air Yards per Target (WR / TE)", "air_yards_per_target", [
              { label: "Air Yds/Tgt", key: "air_yards_per_target", isFloat: true },
              { label: "Targets", key: "targets" },
              { label: "Rec Yds", key: "receiving_yards" },
            ], (p) => (p.position === 'WR' || p.position === 'TE') && (p.targets || 0) >= 35 && (p.games_played || 0) >= 6)}
            
            {renderLeaderboard("YAC / Reception (WR / TE / RB)", "yac_per_reception", [
              { label: "YAC/Rec", key: "yac_per_reception", isFloat: true },
              { label: "Rec", key: "receptions" },
              { label: "Rec Yds", key: "receiving_yards" },
            ], (p) => (p.position === 'WR' || p.position === 'TE' || p.position === 'RB') && (p.receptions || 0) >= 25 && (p.games_played || 0) >= 6)}
          </div>
        </>
      )}

      {/* Selected Player Dossier Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl relative max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white mb-1 uppercase italic">
                  {selectedPlayer.player_name}
                </h2>
                <div className="flex gap-2">
                  <span className="bg-zinc-900 text-cyan-400 border border-zinc-800 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                    {selectedPlayer.position}
                  </span>
                  <span className="bg-zinc-900 text-orange-400 border border-zinc-800 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                    {selectedPlayer.recent_team || 'FA'}
                  </span>
                  <span className="bg-zinc-900 text-zinc-400 border border-zinc-800 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                    {seasonYear} Season
                  </span>
                </div>
              </div>
              <button 
                className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-red-500 hover:text-white flex items-center justify-center text-zinc-400 transition-colors font-bold"
                onClick={() => setSelectedPlayer(null)}
              >
                ✕
              </button>
            </div>
            
            {/* Stats Summary Grid */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-sans font-bold">Games</div>
                  <div className="text-xl font-black text-white">{selectedPlayer.games_played || 0}</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-sans font-bold">PPR Points</div>
                  <div className="text-xl font-black text-emerald-400">{selectedPlayer.fantasy_points_ppr?.toFixed(1) || 0}</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-sans font-bold">PPG</div>
                  <div className="text-xl font-black text-white">{selectedPlayer.ppg?.toFixed(1) || 0}</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-sans font-bold">VORP</div>
                  <div className={cn("text-xl font-black", (selectedPlayer.vorp || 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {selectedPlayer.vorp?.toFixed(1) || 0}
                  </div>
                </div>
              </div>

              {/* Rushing & Receiving Breakdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-zinc-400 font-sans font-bold uppercase text-[11px] block border-b border-zinc-800 pb-1">Receiving Metrics</span>
                  <div className="flex justify-between"><span>Targets:</span><span className="text-white font-bold">{selectedPlayer.targets || 0}</span></div>
                  <div className="flex justify-between"><span>Receptions:</span><span className="text-white font-bold">{selectedPlayer.receptions || 0}</span></div>
                  <div className="flex justify-between"><span>Receiving Yards:</span><span className="text-white font-bold">{selectedPlayer.receiving_yards || 0}</span></div>
                  <div className="flex justify-between"><span>Air Yds / Target:</span><span className="text-cyan-400 font-bold">{selectedPlayer.air_yards_per_target?.toFixed(1) || 0}</span></div>
                  <div className="flex justify-between"><span>YAC / Reception:</span><span className="text-white font-bold">{selectedPlayer.yac_per_reception?.toFixed(1) || 0}</span></div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-zinc-400 font-sans font-bold uppercase text-[11px] block border-b border-zinc-800 pb-1">Rushing & Efficiency</span>
                  <div className="flex justify-between"><span>Rush Carries:</span><span className="text-white font-bold">{selectedPlayer.rush_attempts || 0}</span></div>
                  <div className="flex justify-between"><span>Rushing Yards:</span><span className="text-white font-bold">{selectedPlayer.rushing_yards || 0}</span></div>
                  <div className="flex justify-between"><span>Rush EPA / Att:</span><span className="text-emerald-400 font-bold">{selectedPlayer.rush_epa_per_attempt?.toFixed(2) || 0}</span></div>
                  <div className="flex justify-between"><span>Pass EPA / Play:</span><span className="text-white font-bold">{selectedPlayer.pass_epa_per_play?.toFixed(2) || 0}</span></div>
                  <div className="flex justify-between"><span>Snap Share:</span><span className="text-white font-bold">{((selectedPlayer.offense_pct || 0) * 100).toFixed(0)}%</span></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

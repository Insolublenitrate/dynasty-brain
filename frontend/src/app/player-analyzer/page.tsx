"use client";

import { useState, useEffect, useMemo } from 'react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { Activity, Search, AlertTriangle, Sparkles } from 'lucide-react';
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

export default function PlayerAnalyzer() {
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
    
    // Find baselines
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
      
      // Mock consistency score (since we only have season aggregates here, we use a heuristic based on EPA/play and catch rate)
      // In a real scenario, this would be computed in python from weekly game logs (Coefficient of Variation).
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

  // Helper to render leaderboards
  const renderLeaderboard = (title: string, sortKey: string, cols: {label: string, key: string, isFloat?: boolean}[]) => {
    const sorted = [...enrichedData].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)).slice(0, 10);
    
    return (
      <div className="bg-card border border-border rounded-xl flex flex-col shadow-lg overflow-hidden group hover:border-neon-blue/30 transition-colors">
        <div className="bg-background/80 px-4 py-3 border-b border-border flex justify-between items-center">
          <h3 className="font-black text-foreground uppercase tracking-widest text-xs">{title}</h3>
        </div>
        <div className="overflow-x-auto flex-1 p-4">
          <table className="w-full min-w-[600px] text-sm text-left">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="pb-2 font-bold uppercase tracking-wider text-[10px]">Rank</th>
                <th className="pb-2 font-bold uppercase tracking-wider text-[10px]">Player</th>
                <th className="pb-2 font-bold uppercase tracking-wider text-[10px]">Team</th>
                {cols.map(c => (
                  <th key={c.key} className="pb-2 font-bold uppercase tracking-wider text-[10px] text-right">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => (
                <tr key={p.player_id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 text-muted-foreground font-mono">{idx + 1}</td>
                  <td className="py-2.5 font-bold text-foreground cursor-pointer hover:text-neon-orange transition-colors" onClick={() => setSelectedPlayer(p)}>{p.player_name}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-background border border-border text-muted-foreground">{p.recent_team || 'FA'}</span>
                  </td>
                  {cols.map(c => (
                    <td key={c.key} className={cn("py-2.5 text-right font-mono font-bold", 
                      c.key === 'vorp' ? (p[c.key] > 0 ? 'text-neon-green' : 'text-red-400') : 
                      c.key === 'consistency' ? (p[c.key] >= 80 ? 'text-neon-orange' : 'text-foreground') : 'text-foreground'
                    )}>
                      {c.isFloat ? (p[c.key] || 0).toFixed(1) : (p[c.key] || 0)}
                    </td>
                  ))}
                </tr>
              ))}
              {sorted.length === 0 && !loading && (
                <tr>
                  <td colSpan={3 + cols.length} className="py-8 text-center text-muted-foreground font-bold italic">No data available for {seasonYear}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Live Metrics Calculations
  const qbs = enrichedData.filter(p => p.position === 'QB' && (p.pass_attempts || 0) > 100).sort((a,b) => (b.pass_epa_per_play || 0) - (a.pass_epa_per_play || 0));
  const qbLeader = qbs[0];

  const wrs = enrichedData.filter(p => p.position && p.position.includes('WR') && (p.targets || 0) > 40).sort((a,b) => (b.air_yards_per_target || 0) - (a.air_yards_per_target || 0));
  const wrLeader = wrs[0];

  const rbs = enrichedData.filter(p => p.position === 'RB' && (p.rush_attempts || 0) > 50).sort((a,b) => (b.rush_epa_per_attempt || 0) - (a.rush_epa_per_attempt || 0));
  const rbLeader = rbs[0];

  const defs = enrichedData.filter(p => p.position === 'DEF').map(p => ({...p, pressures: (p.sacks || 0) + (p.qb_hits || 0)})).sort((a,b) => b.pressures - a.pressures);
  const defLeader = defs[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 h-full flex flex-col animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3 uppercase italic">
              <Activity className="text-neon-blue drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]" size={32} /> Player Analyzer
            </h1>
            {!loading && !errorMsg && (
              <span className="text-[10px] font-black tracking-widest uppercase bg-card text-neon-blue border border-neon-blue/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.15)]">
                {enrichedData.length} PLAYERS
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase mt-2 mb-4">
            Advanced metrics, EPA tracking, and VORP calculations.
          </p>
          <SeasonSelector value={seasonYear} onChange={setSeasonYear} />
        </div>

        {/* Player Search Bar */}
        <div className="bg-card border border-border rounded-xl p-4 w-full md:w-72 relative z-50 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Player Search</label>
          </div>
          <div className="relative">
            <button 
              onClick={() => {
                const found = enrichedData.find(p => p.player_name.toLowerCase() === searchInput.toLowerCase());
                if (found) setSelectedPlayer(found);
                setShowSuggestions(false);
              }}
              className="absolute left-2.5 top-2 text-muted-foreground hover:text-neon-orange cursor-pointer z-10 transition-colors"
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
                  const found = enrichedData.find(p => p.player_name.toLowerCase() === searchInput.toLowerCase());
                  if (found) setSelectedPlayer(found);
                  setShowSuggestions(false);
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search player..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm font-semibold text-foreground focus:outline-none focus:border-neon-orange focus:ring-1 focus:ring-neon-orange transition-all shadow-inner"
            />
            {showSuggestions && searchInput.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-2xl max-h-64 overflow-y-auto z-[100]">
                {enrichedData
                  .filter(p => p.player_name.toLowerCase().includes(searchInput.toLowerCase()))
                  .slice(0, 15)
                  .map(p => (
                    <div 
                      key={p.player_id}
                      className="px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer flex justify-between items-center border-b border-border/50 last:border-0"
                      onClick={() => {
                        setSearchInput('');
                        setSelectedPlayer(p);
                        setShowSuggestions(false);
                      }}
                    >
                      {p.player_name} 
                      <span className="text-[10px] bg-background border border-border px-2 py-0.5 rounded uppercase tracking-wider">{p.recent_team || 'FA'}</span>
                    </div>
                  ))}
                {enrichedData.filter(p => p.player_name.toLowerCase().includes(searchInput.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted-foreground italic font-semibold">No players found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue shadow-[0_0_15px_rgba(14,165,233,0.4)]"></div>
        </div>
      ) : errorMsg ? (
        <div className="flex flex-1 flex-col items-center justify-center text-red-500 gap-3">
          <AlertTriangle size={48} className="drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <p className="font-black uppercase tracking-widest text-lg">{errorMsg}</p>
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
                vsLastWeek={0.12} // Mock
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
                  { label: "DROPBACKS", value: qbLeader.pass_attempts || 0 },
                  { label: "PASS YDS", value: (qbLeader.total_yards || 0) - (qbLeader.rushing_yards || 0) },
                  { label: "CPOE %", value: (qbLeader.cpoe || 0).toFixed(1) },
                  { label: "VORP", value: qbLeader.vorp }
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
                  { label: "VORP", value: wrLeader.vorp }
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

          {/* VORP & Consistency Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {renderLeaderboard("Most Valuable (VORP)", "vorp", [
              { label: "Points", key: "fantasy_points_ppr", isFloat: true },
              { label: "PPG", key: "ppg", isFloat: true },
              { label: "VORP", key: "vorp", isFloat: true },
            ])}
            
            {renderLeaderboard("Most Consistent (Consistency Score)", "consistency", [
              { label: "Points", key: "fantasy_points_ppr", isFloat: true },
              { label: "VORP", key: "vorp", isFloat: true },
              { label: "Rating", key: "consistency", isFloat: true },
            ])}

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
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl w-full max-w-5xl relative max-h-[95vh] overflow-hidden shadow-2xl flex flex-col scale-in-95 animate-in duration-300">
            
            {/* Header */}
            <div className="bg-background/80 border-b border-border p-6 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-3xl font-black text-foreground mb-1 flex items-center gap-3 uppercase italic">
                  {selectedPlayer.player_name}
                </h2>
                <div className="flex gap-2 mt-2">
                  <span className="bg-neon-blue/10 text-neon-blue border border-neon-blue/30 px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase">
                    {selectedPlayer.position}
                  </span>
                  <span className="bg-neon-orange/10 text-neon-orange border border-neon-orange/30 px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase">
                    {selectedPlayer.recent_team || 'FA'}
                  </span>
                  <span className="bg-card text-muted-foreground border border-border px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase">
                    {selectedPlayer.season} Season
                  </span>
                </div>
              </div>
              <button 
                className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors shadow-inner"
                onClick={() => setSelectedPlayer(null)}
              >
                ✕
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Top Level Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-background p-4 rounded-xl border border-border text-center shadow-inner">
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Targets</div>
                  <div className="text-2xl font-black text-foreground">{selectedPlayer.targets || 0}</div>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border text-center shadow-inner">
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Receptions</div>
                  <div className="text-2xl font-black text-foreground">{selectedPlayer.receptions || 0}</div>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border text-center shadow-inner">
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Total Yds</div>
                  <div className="text-2xl font-black text-foreground">{selectedPlayer.total_yards || 0}</div>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border text-center shadow-inner">
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Catch %</div>
                  <div className="text-2xl font-black text-foreground">{selectedPlayer.catch_rate !== null ? `${((selectedPlayer.catch_rate || 0) * 100).toFixed(1)}%` : '0%'}</div>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border text-center shadow-inner">
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">VORP</div>
                  <div className={cn("text-2xl font-black", selectedPlayer.vorp > 0 ? 'text-neon-green drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'text-red-500')}>{selectedPlayer.vorp}</div>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border text-center shadow-inner">
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Consistency</div>
                  <div className="text-2xl font-black text-neon-orange drop-shadow-[0_0_5px_rgba(249,115,22,0.4)]">{(selectedPlayer.consistency || 0).toFixed(1)}</div>
                </div>
              </div>

              {/* Advanced Efficiency Stats */}
              <div className="bg-background/50 border border-border rounded-xl p-6 shadow-inner">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 border-b border-border pb-2">Advanced Efficiency</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">YAC / Rec</div>
                    <div className="text-2xl font-mono font-black text-foreground">{(selectedPlayer.yac_per_reception || 0).toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Rec EPA / Target</div>
                    <div className="text-2xl font-mono font-black text-foreground">{(selectedPlayer.rec_epa_per_target || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Rush EPA / Att</div>
                    <div className="text-2xl font-mono font-black text-foreground">{(selectedPlayer.rush_epa_per_attempt || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Target Rate</div>
                    <div className="text-2xl font-mono font-black text-foreground">{selectedPlayer.target_rate !== null ? `${((selectedPlayer.target_rate || 0) * 100).toFixed(1)}%` : 'N/A'}</div>
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

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { 
  Search, ArrowRightLeft, UserPlus, X, Briefcase, Sparkles, 
  Scale, Ticket, Plus, Coins, ShieldAlert, Copy, CheckCircle2,
  Users, ChevronDown, Check
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLeague } from '@/context/LeagueContext';
import { getApiUrl } from '@/config/api';
import TacticalBriefingCard from '@/components/ui/TacticalBriefingCard';

interface TradeAsset {
  id: string;
  name: string;
  subtitle: string;
  type: 'player' | 'pick';
  value: number; // PPG equivalent or Dynasty value
  meta?: any;
}

const COMMON_PICKS = [
  { name: '2026 Early 1st', value: 18.5, subtitle: 'Top 4 Projected' },
  { name: '2026 Mid 1st', value: 15.0, subtitle: 'Pick 1.05 - 1.08' },
  { name: '2026 Late 1st', value: 12.0, subtitle: 'Pick 1.09 - 1.12' },
  { name: '2026 2nd Round', value: 8.5, subtitle: 'Round 2' },
  { name: '2026 3rd Round', value: 4.5, subtitle: 'Round 3' },
  { name: '2027 1st Round', value: 14.0, subtitle: 'Future Capital' },
  { name: '2027 2nd Round', value: 7.5, subtitle: 'Future Capital' },
  { name: '2028 1st Round', value: 13.0, subtitle: 'Future Capital' },
  { name: '2028 2nd Round', value: 6.5, subtitle: 'Future Capital' },
];

export default function TradeArchitectTab() {
  const { currentTheme } = useTheme();
  const { myRosterId, leagueRosters, leagueId } = useLeague();
  const searchParams = useSearchParams();

  const prefillPlayerName = searchParams?.get('player_name') || searchParams?.get('player');
  const prefillPlayerId = searchParams?.get('player_id');
  const partnerRosterParam = searchParams?.get('partner_roster') || searchParams?.get('partner');
  const blueprintParam = searchParams?.get('blueprint');
  const sendPlayerParam = searchParams?.get('send_player');
  const recvPlayerParam = searchParams?.get('recv_player');
  const sendPickParam = searchParams?.get('send_pick');
  const recvPickParam = searchParams?.get('recv_pick');

  const myTeam = leagueRosters.find((r: any) => r.roster_id === myRosterId) || leagueRosters[0];
  
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    partnerRosterParam ? Number(partnerRosterParam) : null
  );

  const partnerTeam = leagueRosters.find((r: any) => 
    selectedPartnerId ? r.roster_id === selectedPartnerId : r.roster_id !== myTeam?.roster_id
  ) || leagueRosters[1] || leagueRosters[0];

  const [teamAParent] = useAutoAnimate();
  const [teamBParent] = useAutoAnimate();
  const [searchParent] = useAutoAnimate();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [teamA, setTeamA] = useState<TradeAsset[]>([]);
  const [teamB, setTeamB] = useState<TradeAsset[]>([]);
  const [addingTo, setAddingTo] = useState<'A' | 'B'>('A');
  const [copySuccess, setCopySuccess] = useState(false);

  // Sync partner param from URL if changed
  useEffect(() => {
    if (partnerRosterParam) {
      setSelectedPartnerId(Number(partnerRosterParam));
    }
  }, [partnerRosterParam]);

  // Load player metrics database
  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=2024`);
        const json = await res.json();
        if (Array.isArray(json)) setData(json);
      } catch (err) {
        console.error("TradeArchitect data fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Handle URL prefill & blueprint execution
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Direct player prefill (e.g. from Roster Cliff Shopper or Spotlight)
    if (prefillPlayerId || prefillPlayerName) {
      const match = data.find(p => 
        (prefillPlayerId && String(p.player_id) === String(prefillPlayerId)) ||
        (prefillPlayerName && p.player_name?.toLowerCase() === prefillPlayerName.toLowerCase())
      );
      if (match) {
        const asset: TradeAsset = {
          id: `p-${match.player_id}`,
          name: match.player_name,
          subtitle: `${match.position} • ${match.recent_team || 'FA'}`,
          type: 'player',
          value: match.ppg || 0,
          meta: match,
        };
        // If shop_player, it is coming from Team A sending to Team B (so Team B receives it)
        setTeamB(prev => prev.some(a => a.id === asset.id) ? prev : [...prev, asset]);
      }
    }

    // Explicit send / receive params
    if (sendPlayerParam) {
      const match = data.find(p => p.player_name?.toLowerCase() === sendPlayerParam.toLowerCase());
      if (match) {
        const asset: TradeAsset = {
          id: `p-${match.player_id}`,
          name: match.player_name,
          subtitle: `${match.position} • ${match.recent_team || 'FA'}`,
          type: 'player',
          value: match.ppg || 0,
        };
        setTeamB(prev => prev.some(a => a.id === asset.id) ? prev : [...prev, asset]);
      }
    }

    if (recvPlayerParam) {
      const match = data.find(p => p.player_name?.toLowerCase() === recvPlayerParam.toLowerCase());
      if (match) {
        const asset: TradeAsset = {
          id: `p-${match.player_id}`,
          name: match.player_name,
          subtitle: `${match.position} • ${match.recent_team || 'FA'}`,
          type: 'player',
          value: match.ppg || 0,
        };
        setTeamA(prev => prev.some(a => a.id === asset.id) ? prev : [...prev, asset]);
      }
    }

    // Blueprint archetypes pre-assembly
    if (blueprintParam && teamA.length === 0 && teamB.length === 0) {
      if (blueprintParam === 'win_now') {
        // Veteran for future capital + young asset
        const vet = data.find(p => p.position === 'RB' && p.age >= 28 && p.ppg >= 14) || data[0];
        const youngAsset = data.find(p => (p.position === 'WR' || p.position === 'RB') && p.age <= 23 && p.ppg >= 11) || data[1];
        if (vet) {
          setTeamB([{
            id: `p-${vet.player_id}`,
            name: vet.player_name,
            subtitle: `${vet.position} • Age ${vet.age} • Contender Push`,
            type: 'player',
            value: vet.ppg || 14.5
          }]);
        }
        if (youngAsset) {
          setTeamA([
            {
              id: `p-${youngAsset.player_id}`,
              name: youngAsset.player_name,
              subtitle: `${youngAsset.position} • Age ${youngAsset.age} • Rebuild Asset`,
              type: 'player',
              value: youngAsset.ppg || 11.2
            },
            {
              id: `pick-2026-2nd-${Date.now()}`,
              name: '2026 2nd Round',
              subtitle: 'Future Capital',
              type: 'pick',
              value: 8.5
            }
          ]);
        }
      } else if (blueprintParam === 'need_swap') {
        // 1-for-1 positional parity swap
        const assetA = data.find(p => p.position === 'WR' && p.ppg >= 13) || data[0];
        const assetB = data.find(p => p.position === 'RB' && p.ppg >= 13) || data[1];
        if (assetA) {
          setTeamB([{
            id: `p-${assetA.player_id}`,
            name: assetA.player_name,
            subtitle: `${assetA.position} • Surplus Swap`,
            type: 'player',
            value: assetA.ppg || 13.5
          }]);
        }
        if (assetB) {
          setTeamA([{
            id: `p-${assetB.player_id}`,
            name: assetB.player_name,
            subtitle: `${assetB.position} • Need Resolved`,
            type: 'player',
            value: assetB.ppg || 13.8
          }]);
        }
      } else if (blueprintParam === 'consolidation') {
        // 2-for-1 superstar consolidation
        const stud = data.find(p => p.ppg >= 18) || data[0];
        const depth1 = data.find(p => p.ppg >= 12 && p.player_id !== stud?.player_id) || data[1];
        const depth2 = data.find(p => p.ppg >= 10 && p.player_id !== stud?.player_id && p.player_id !== depth1?.player_id) || data[2];
        if (stud) {
          setTeamA([{
            id: `p-${stud.player_id}`,
            name: stud.player_name,
            subtitle: `${stud.position} • Elite Tier 1 Cornerstone`,
            type: 'player',
            value: stud.ppg || 18.5
          }]);
        }
        if (depth1 && depth2) {
          setTeamB([
            {
              id: `p-${depth1.player_id}`,
              name: depth1.player_name,
              subtitle: `${depth1.position} • Starter Depth`,
              type: 'player',
              value: depth1.ppg || 12.0
            },
            {
              id: `p-${depth2.player_id}`,
              name: depth2.player_name,
              subtitle: `${depth2.position} • Flex Starter`,
              type: 'player',
              value: depth2.ppg || 10.5
            }
          ]);
        }
      }
    }
  }, [data, prefillPlayerId, prefillPlayerName, blueprintParam, sendPlayerParam, recvPlayerParam]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return data.filter(p => p.player_name?.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 6);
  }, [data, searchTerm]);

  const addPlayer = (player: any) => {
    const asset: TradeAsset = {
      id: `p-${player.player_id}-${Date.now()}`,
      name: player.player_name,
      subtitle: `${player.position} • ${player.recent_team || 'FA'}`,
      type: 'player',
      value: player.ppg || 0,
      meta: player,
    };

    if (addingTo === 'A') {
      if (!teamA.some(a => a.name === asset.name)) setTeamA([...teamA, asset]);
    } else {
      if (!teamB.some(a => a.name === asset.name)) setTeamB([...teamB, asset]);
    }
    setSearchTerm('');
  };

  const addPick = (pick: typeof COMMON_PICKS[0], targetSide?: 'A' | 'B') => {
    const asset: TradeAsset = {
      id: `pick-${pick.name}-${Date.now()}`,
      name: pick.name,
      subtitle: pick.subtitle,
      type: 'pick',
      value: pick.value,
    };

    const side = targetSide || addingTo;
    if (side === 'A') {
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
  const diff = valA - valB; // positive: Team A receives more value; negative: Team B receives more value
  const absDiff = Math.abs(diff);

  // Parity percentage calculation
  const totalVal = valA + valB;
  const parityPct = totalVal > 0 ? Math.round(Math.max(0, 100 - (absDiff / totalVal) * 100)) : 100;

  // Auto-Balance Recommendation Calculation
  const autoBalanceRecommendation = useMemo(() => {
    if (absDiff < 2.5 || (teamA.length === 0 && teamB.length === 0)) return null;

    // The side with lower value needs an asset to balance
    const recipientSide: 'A' | 'B' = diff > 0 ? 'B' : 'A';
    const receivingTeamName = recipientSide === 'A' ? (myTeam?.team_name || 'Team A') : (partnerTeam?.team_name || 'Team B');

    // Find the pick in COMMON_PICKS closest to absDiff
    let bestPick = COMMON_PICKS[0];
    let minGap = 999;
    for (const pick of COMMON_PICKS) {
      const gap = Math.abs(pick.value - absDiff);
      if (gap < minGap) {
        minGap = gap;
        bestPick = pick;
      }
    }

    const projectedParity = totalVal > 0 
      ? Math.round(100 - (Math.abs(absDiff - bestPick.value) / (totalVal + bestPick.value)) * 100)
      : 98;

    return {
      recipientSide,
      receivingTeamName,
      pick: bestPick,
      projectedParity,
      gap: absDiff
    };
  }, [absDiff, diff, teamA.length, teamB.length, myTeam?.team_name, partnerTeam?.team_name, totalVal]);

  // Copy Sleeper Trade Proposal
  const handleCopyProposal = () => {
    const teamAName = myTeam?.team_name || "Team A";
    const teamBName = partnerTeam?.team_name || "Team B";

    const aReceives = teamA.length > 0 
      ? teamA.map(a => `• ${a.name} (${a.value.toFixed(1)} ${a.type === 'pick' ? 'Pick Eq' : 'PPG'})`).join('\n') 
      : '• (No assets)';
      
    const bReceives = teamB.length > 0 
      ? teamB.map(b => `• ${b.name} (${b.value.toFixed(1)} ${b.type === 'pick' ? 'Pick Eq' : 'PPG'})`).join('\n') 
      : '• (No assets)';

    const text = `🤝 Trade Proposal via Blindside Dynasty War Room:

🏈 ${teamAName} receives:
${aReceives}

🏈 ${teamBName} receives:
${bReceives}

⚖️ Parity Score: ${parityPct}% (${absDiff < 2.5 ? 'Balanced Dynasty Win-Win' : diff > 0 ? `${teamAName} favored by ${absDiff.toFixed(1)}p` : `${teamBName} favored by ${absDiff.toFixed(1)}p`})
📊 Built and verified with Blindside Dynasty`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      
      {/* Header with Partner Selector and Copy Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-2.5">
            <Briefcase size={24} style={{ color: currentTheme.primary }} /> TRADE ARCHITECT
          </h2>
          <p className="text-zinc-400 text-[11px] sm:text-xs font-semibold tracking-wider uppercase mt-0.5">
            Build, balance, and optimize dynasty trades with empirical points and draft equity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Partner Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedPartnerId || partnerTeam?.roster_id || ''}
              onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono font-bold appearance-none pr-7 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            >
              {leagueRosters
                .filter((r: any) => r.roster_id !== myTeam?.roster_id)
                .map((r: any) => (
                  <option key={r.roster_id} value={r.roster_id}>
                    Partner: {r.team_name} (#{r.roster_id})
                  </option>
                ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {/* Copy Proposal Button */}
          <button
            onClick={handleCopyProposal}
            disabled={teamA.length === 0 && teamB.length === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md ${
              copySuccess 
                ? 'bg-emerald-500 text-zinc-950 font-black' 
                : teamA.length === 0 && teamB.length === 0
                  ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-zinc-600'
            }`}
          >
            {copySuccess ? <Check size={14} /> : <Copy size={14} />}
            <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy Sleeper Pitch'}</span>
          </button>
        </div>
      </div>

      {/* ── TACTICAL BRIEFING GUIDE ─────────────────────────────────────────── */}
      <TacticalBriefingCard
        title="Dynasty Trade Machine: The Golden Rules of Trade Value"
        subtitle="How to balance immediate player production with future draft pick liquidity"
        badge="TRADE MACHINE GUIDE"
        points={[
          {
            icon: Ticket,
            label: "1. Draft Pick Liquidity",
            text: "Future 1sts are the most liquid, risk-free asset in dynasty. They never suffer injuries, never get benched, and steadily gain 25%+ in perceived trade value heading into draft day.",
            color: "#fbbf24"
          },
          {
            icon: Scale,
            label: "2. 2-for-1 Consolidation",
            text: "Do not trade three nickels for a quarter. Starting lineup firepower wins titles; three WR3s will never replace an elite top-5 superstar. Require an overpay if downgrading a stud.",
            color: "#38bdf8"
          },
          {
            icon: ArrowRightLeft,
            label: "3. Timeline Asymmetry",
            text: "Trade with teams on the opposite end of the championship timeline. Contenders want immediate points; Rebuilders want rookie picks and young developmental assets.",
            color: "#34d399"
          }
        ]}
      />

      {/* ── SMART AUTO-BALANCE RECOMMENDATION BANNER ──────────────────────── */}
      {autoBalanceRecommendation && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-wider">
                  ⚡ Smart Auto-Balance Suggestion
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {autoBalanceRecommendation.gap.toFixed(1)} PTS DEFICIT
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5 font-mono">
                {diff > 0 ? (myTeam?.team_name || 'Team A') : (partnerTeam?.team_name || 'Team B')} gives significantly more value. Add a <strong className="text-amber-400">{autoBalanceRecommendation.pick.name}</strong> to <strong className="text-white">{autoBalanceRecommendation.receivingTeamName}</strong> to achieve <strong>{autoBalanceRecommendation.projectedParity}% fair parity</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => addPick(autoBalanceRecommendation.pick, autoBalanceRecommendation.recipientSide)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono font-black transition-all flex items-center justify-center gap-1.5 shadow-md shrink-0"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Insert {autoBalanceRecommendation.pick.name} (+{autoBalanceRecommendation.pick.value}p)</span>
          </button>
        </div>
      )}

      {/* Main Trade Board */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-6 relative shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* TEAM A */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2" style={{ color: currentTheme.primary }}>
                  <span className="truncate max-w-[180px] sm:max-w-[220px]">{myTeam?.team_name || "Team A"}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-normal shrink-0">Receives</span>
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">Your Franchise</span>
              </div>
              <div className="text-right">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-sm block"
                  style={{ backgroundColor: currentTheme.subtle, color: currentTheme.primary, borderColor: currentTheme.border }}
                >
                  {valA.toFixed(1)} PPG Value
                </span>
              </div>
            </div>
            
            <div ref={teamAParent} className="space-y-2 min-h-[160px]">
              {teamA.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs font-semibold uppercase tracking-wider border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center space-y-1">
                  <span>No assets added to {myTeam?.team_name || "Team A"}</span>
                  <span className="text-[10px] font-mono text-zinc-600 font-normal">Select players or picks below to add</span>
                </div>
              )}
              {teamA.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {a.type === 'pick' ? (
                      <Ticket size={16} className="text-amber-400 shrink-0" />
                    ) : (
                      <UserPlus size={16} className="text-zinc-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{a.name}</div>
                      <div className="text-xs text-zinc-500 font-mono truncate">{a.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-xs text-zinc-300">{a.value.toFixed(1)}p</span>
                    <button onClick={() => removeAsset('A', a.id)} className="text-zinc-500 hover:text-rose-400 transition-colors p-1">
                      <X size={15} />
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
              <Plus size={16} /> Add Asset to {myTeam?.team_name || "Team A"}
            </button>
          </div>

          {/* TEAM B */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-cyan-400 flex items-center gap-2">
                  <span className="truncate max-w-[180px] sm:max-w-[220px]">{partnerTeam?.team_name || "Team B"}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-normal shrink-0">Receives</span>
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">Trade Partner</span>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm block">
                  {valB.toFixed(1)} PPG Value
                </span>
              </div>
            </div>
            
            <div ref={teamBParent} className="space-y-2 min-h-[160px]">
              {teamB.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs font-semibold uppercase tracking-wider border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center space-y-1">
                  <span>No assets added to {partnerTeam?.team_name || "Team B"}</span>
                  <span className="text-[10px] font-mono text-zinc-600 font-normal">Select players or picks below to add</span>
                </div>
              )}
              {teamB.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {a.type === 'pick' ? (
                      <Ticket size={16} className="text-amber-400 shrink-0" />
                    ) : (
                      <UserPlus size={16} className="text-zinc-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{a.name}</div>
                      <div className="text-xs text-zinc-500 font-mono truncate">{a.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-xs text-zinc-300">{a.value.toFixed(1)}p</span>
                    <button onClick={() => removeAsset('B', a.id)} className="text-zinc-500 hover:text-rose-400 transition-colors p-1">
                      <X size={15} />
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
              <Plus size={16} /> Add Asset to {partnerTeam?.team_name || "Team B"}
            </button>
          </div>

        </div>

        {/* Trade Asset Adder Toolbar */}
        <div className="pt-6 border-t border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              Currently Adding To: <span className="text-white font-black">{addingTo === 'A' ? (myTeam?.team_name || 'Team A') : (partnerTeam?.team_name || 'Team B')}</span>
            </span>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setAddingTo('A')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  addingTo === 'A' ? 'bg-orange-500 text-zinc-950 font-black shadow-md' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
                style={addingTo === 'A' ? { backgroundColor: currentTheme.primary } : {}}
              >
                Team A ({myTeam?.team_name || 'You'})
              </button>
              <button 
                type="button" 
                onClick={() => setAddingTo('B')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  addingTo === 'B' ? 'bg-cyan-400 text-zinc-950 font-black shadow-md' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Team B ({partnerTeam?.team_name || 'Partner'})
              </button>
            </div>
          </div>

          {/* Quick Draft Pick Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
              <Ticket size={13} className="text-amber-400" /> Insert Draft Capital into Team {addingTo}:
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
              placeholder={`Search and add player to Team ${addingTo} (${addingTo === 'A' ? myTeam?.team_name : partnerTeam?.team_name})...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
            />
            {searchResults.length > 0 && (
              <div ref={searchParent} className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-20 max-h-72 overflow-y-auto">
                {searchResults.map(p => (
                  <button
                    key={p.player_id}
                    onClick={() => addPlayer(p)}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800/80 flex items-center justify-between border-b border-zinc-800/50 last:border-0 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{p.player_name}</div>
                      <div className="text-xs text-zinc-400 font-mono">{p.position} • {p.recent_team || 'FA'} {p.age > 0 ? `• Age ${p.age}` : ''}</div>
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
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
                style={{ backgroundColor: currentTheme.subtle, borderColor: currentTheme.border }}
              >
                <Scale size={24} style={{ color: currentTheme.primary }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-mono">Empirical Trade Verdict</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    parityPct >= 90 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    parityPct >= 75 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {parityPct}% PARITY
                  </span>
                </div>
                <div className="text-sm sm:text-base font-black text-white font-coach tracking-wide mt-0.5">
                  {absDiff < 2.5 
                    ? "BALANCED FAIR TRADE (HIGH ACCEPTANCE PROBABILITY)" 
                    : diff > 0 
                      ? `${myTeam?.team_name || 'TEAM A'} FAVORED (+${diff.toFixed(1)} PPG VALUE)` 
                      : `${partnerTeam?.team_name || 'TEAM B'} FAVORED (+${absDiff.toFixed(1)} PPG VALUE)`
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleCopyProposal}
                className="px-3.5 py-2 text-xs font-mono font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                {copySuccess ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copySuccess ? 'Copied!' : 'Copy Proposal'}</span>
              </button>
              <button
                onClick={() => { setTeamA([]); setTeamB([]); }}
                className="px-3.5 py-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-colors"
              >
                Reset Board
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

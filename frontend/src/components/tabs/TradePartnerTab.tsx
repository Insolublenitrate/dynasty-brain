"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, ArrowRightLeft, Sparkles, TrendingUp, ShieldAlert, 
  CheckCircle2, ArrowRight, Zap, Target, Search, Filter,
  Layers, Trophy, AlertTriangle, ChevronDown, ChevronUp, Lightbulb
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

interface TradePartnerTabProps {
  onSelectPartner?: (rosterId: number, teamName: string) => void;
}

export default function TradePartnerTab({ onSelectPartner }: TradePartnerTabProps) {
  const { leagueId, leagueName, myRosterId: globalRosterId, setMyRosterId: setGlobalRosterId } = useLeague();
  const { currentTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPartnerId, setExpandedPartnerId] = useState<number | null>(null);

  const myRosterId = globalRosterId || (teams.length > 0 ? teams[0].roster_id : 1);

  useEffect(() => {
    if (!leagueId) return;

    async function loadMatrixData() {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setTeams(data);
          }
        }
      } catch (err) {
        console.error("Failed to load trade partner data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMatrixData();
  }, [leagueId]);

  // Derive my team's profile
  const myTeam = teams.find(t => t.roster_id === myRosterId) || teams[0];

  // Calculate diverse, mathematically grounded synergy matches
  const partnerMatches = teams
    .filter(t => t.roster_id !== myTeam?.roster_id)
    .map(team => {
      const myWinNow = Number(myTeam?.win_now_score ?? 50);
      const myFuture = Number(myTeam?.future_score ?? 50);
      const myQb = Number(myTeam?.qb_power ?? 60);
      const myRb = Number(myTeam?.rb_power ?? 60);
      const myWr = Number(myTeam?.wr_power ?? 60);
      const myTe = Number(myTeam?.te_power ?? 60);
      const myState = myTeam?.lifecycle_state || 'Balanced';

      const teamWinNow = Number(team?.win_now_score ?? 50);
      const teamFuture = Number(team?.future_score ?? 50);
      const teamQb = Number(team?.qb_power ?? 60);
      const teamRb = Number(team?.rb_power ?? 60);
      const teamWr = Number(team?.wr_power ?? 60);
      const teamTe = Number(team?.te_power ?? 60);
      const teamState = team?.lifecycle_state || 'Balanced';

      let synergyScore = 70;
      let synergyReason = "Lateral Positional Swap: Opportunity to trade depth for starter upgrades";
      let partnerType = "Tier Competitor";
      let badgeColor = "zinc";

      // Positional strengths & needs
      const posScores = [
        { pos: 'QB', power: teamQb },
        { pos: 'RB', power: teamRb },
        { pos: 'WR', power: teamWr },
        { pos: 'TE', power: teamTe }
      ].sort((a, b) => b.power - a.power);

      const strengths: string[] = [];
      const needs: string[] = [];

      posScores.forEach(p => {
        if (p.power >= 66) strengths.push(p.pos);
        else if (p.power <= 58) needs.push(p.pos);
      });

      if (strengths.length === 0) strengths.push(posScores[0].pos);
      if (teamFuture < 50 && !needs.includes('Draft Capital')) needs.push('Draft Capital');
      if (teamFuture >= 75 && !strengths.includes('Draft Capital')) strengths.push('Draft Capital');
      if (needs.length === 0) needs.push(posScores[posScores.length - 1].pos);

      // Check for direct complementary positional needs
      const hasRbDeficit = myRb < 62 && teamRb >= 68;
      const hasWrDeficit = myWr < 62 && teamWr >= 68;
      const hasQbDeficit = myQb < 62 && teamQb >= 68;
      const hasTeDeficit = myTe < 62 && teamTe >= 68;
      const complementaryPositions = (hasRbDeficit ? 1 : 0) + (hasWrDeficit ? 1 : 0) + (hasQbDeficit ? 1 : 0) + (hasTeDeficit ? 1 : 0);

      // Archetype 1: Rebuilder (You) ↔ Win-Now Contender (Them)
      if (myWinNow <= 65 && teamWinNow >= 72) {
        const delta = teamWinNow - myWinNow;
        synergyScore = Math.min(98, Math.round(91 + (delta / 8)));
        partnerType = "Win-Now Buyer";
        badgeColor = "emerald";
        synergyReason = `Championship Buyer: ${team.team_name} boasts top starter firepower (${Math.round(team.max_pf || 3000)} Max PF) and urgently seeks immediate points. Ideal target to sell high-scoring veterans for 2026/2027 draft capital.`;
      }
      // Archetype 2: Contender (You) ↔ Rebuilder / Future Seller (Them)
      else if (myWinNow >= 72 && teamFuture >= 70) {
        const delta = teamFuture - 50;
        synergyScore = Math.min(97, Math.round(90 + (delta / 7)));
        partnerType = "Future Seller";
        badgeColor = "teal";
        synergyReason = `Rookie Capital Seller: ${team.team_name} holds an active rebuilding portfolio (${Math.round((team.future_capital_score || 20000) / 1000)}k pick equity). Trade your bench depth or fringe starters to acquire premium future draft assets.`;
      }
      // Archetype 3: Direct Positional Counterpart (Mutual need resolution)
      else if (complementaryPositions >= 2 || (complementaryPositions >= 1 && Math.abs(myWinNow - teamWinNow) < 25)) {
        synergyScore = Math.min(93, Math.round(85 + (complementaryPositions * 4)));
        partnerType = "Positional Counterpart";
        badgeColor = "cyan";
        const matchPos = hasRbDeficit ? 'RB' : hasWrDeficit ? 'WR' : hasTeDeficit ? 'TE' : 'QB';
        synergyReason = `Positional Need Alignment: Their surplus at ${matchPos} directly solves your roster deficit, while your asset liquidity matches their team requirements.`;
      }
      // Archetype 4: Juggernaut / Purgatory Consolidation
      else if (teamState === 'Purgatory' || myState === 'Purgatory') {
        synergyScore = 84;
        partnerType = "Retool Partner";
        badgeColor = "amber";
        synergyReason = `Structural Retool Match: ${team.team_name} is in a strategic crossroads. Explore multi-asset package deals to consolidate into top-tier weekly cornerstones.`;
      }
      // Archetype 5: Juggernaut ↔ Contender Power Clash
      else if (myWinNow >= 70 && teamWinNow >= 70) {
        synergyScore = Math.max(54, Math.round(68 - Math.abs(teamWinNow - myWinNow) / 3));
        partnerType = "Tier Competitor";
        badgeColor = "rose";
        synergyReason = `Championship Rival: Both franchises are vying for the current season title. High friction on starter trades. Target lateral bye-week swaps or injured stashes.`;
      }
      // Archetype 6: Rebuilder ↔ Rebuilder
      else if (myWinNow < 65 && teamWinNow < 65) {
        synergyScore = Math.max(56, Math.round(66 + (teamFuture > 70 ? 6 : 0)));
        partnerType = "Draft Competitor";
        badgeColor = "zinc";
        synergyReason = `Parallel Rebuild: Both teams are competing for draft slot positioning. Explore lateral rookie-for-rookie swaps or tier-down pick splits.`;
      }
      else {
        synergyScore = Math.round(72 + ((teamWinNow + teamFuture) % 9));
        partnerType = "Market Partner";
        badgeColor = "zinc";
        synergyReason = `Balanced Dynasty Fit: Moderate trade synergy across roster age (${team.roster_age_score || 25.5} yrs) and starter production.`;
      }

      return {
        ...team,
        synergyScore,
        synergyReason,
        partnerType,
        badgeColor,
        strengths,
        needs,
      };
    })
    .sort((a, b) => b.synergyScore - a.synergyScore);

  const filteredMatches = partnerMatches.filter(p => {
    const matchesSearch = searchQuery === '' || 
      p.team_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPhase = selectedPhase === 'ALL' || 
      (selectedPhase === 'BUYER' && p.partnerType.includes('Buyer')) ||
      (selectedPhase === 'SELLER' && (p.partnerType.includes('Seller') || p.partnerType.includes('Draft'))) ||
      (selectedPhase === 'POSITION' && p.partnerType.includes('Positional')) ||
      (selectedPhase === 'HIGH' && p.synergyScore >= 85);

    return matchesSearch && matchesPhase;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-2.5">
            <ArrowRightLeft size={26} style={{ color: currentTheme.primary }} />
            SMART TRADE PARTNER FINDER
          </h2>
          <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
            Algorithmic matchmaking based on franchise timelines, roster surpluses, and positional deficits
          </p>
        </div>

        {/* My Team Selector */}
        {teams.length > 0 && (
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 font-bold">YOUR TEAM:</span>
            <select
              value={myRosterId || ''}
              onChange={(e) => setGlobalRosterId(Number(e.target.value))}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
            >
              {teams.map(t => (
                <option key={t.roster_id} value={t.roster_id} className="bg-zinc-900 text-white">
                  {t.team_name || `Roster ${t.roster_id}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/80 backdrop-blur-md p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter size={13} style={{ color: currentTheme.primary }} /> Filter:
          </span>
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
            {[
              { id: 'ALL', label: 'All Rivals' },
              { id: 'HIGH', label: 'Top Synergy (85%+)' },
              { id: 'BUYER', label: 'Win-Now Buyers' },
              { id: 'SELLER', label: 'Future Sellers' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedPhase(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  selectedPhase === f.id ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={selectedPhase === f.id ? { color: currentTheme.primary } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search rival franchise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-44 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800">
          <p className="text-zinc-400 text-sm font-semibold">No rival franchises match your selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map(partner => {
            const isTopSynergy = partner.synergyScore >= 90;
            return (
              <div
                key={partner.roster_id}
                className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Synergy Pill */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span 
                      className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        partner.partnerType === 'Win-Now Buyer'
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                          : partner.partnerType === 'Future Seller'
                          ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                          : partner.partnerType === 'Positional Counterpart'
                          ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                          : partner.partnerType === 'Retool Partner'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : partner.partnerType === 'Tier Competitor'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : isTopSynergy 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {partner.partnerType}
                    </span>
                    <div className="flex items-center gap-1 font-mono text-xs font-black">
                      <Zap size={13} style={{ color: currentTheme.primary }} />
                      <span className="text-white">{partner.synergyScore}%</span>
                      <span className="text-zinc-500 text-[10px]">MATCH</span>
                    </div>
                  </div>

                  {/* Team Title & Owner */}
                  <h3 className="text-base font-black text-white group-hover:text-zinc-100 transition-colors truncate">
                    {partner.team_name || `Roster ${partner.roster_id}`}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                    {partner.owner_name ? `@${partner.owner_name}` : 'League Rival'}
                  </p>

                  {/* Franchise Vitals */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2.5 bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80 text-center font-mono">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-bold block">WIN-NOW</span>
                      <span className="text-xs font-black text-purple-400">{partner.win_now_score || 50}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-bold block">FUTURE</span>
                      <span className="text-xs font-black text-teal-400">{partner.future_score || 50}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-bold block">MAX PF</span>
                      <span className="text-xs font-black text-emerald-400">
                        {Math.round(partner.max_pf || 0) > 0 ? Math.round(partner.max_pf).toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Rationale Brief */}
                  <div className="mt-2.5 bg-zinc-950/90 p-2.5 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-300 leading-relaxed">
                    {partner.synergyReason}
                  </div>

                  {/* Surplus vs Deficit Tags */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] font-mono">
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-emerald-400 font-bold block mb-1">THEIR SURPLUS:</span>
                      <div className="flex flex-wrap gap-1">
                        {partner.strengths.map((s: string) => (
                          <span key={s} className="bg-emerald-950/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/50 font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-amber-400 font-bold block mb-1">THEIR DEFICIT:</span>
                      <div className="flex flex-wrap gap-1">
                        {partner.needs.map((n: string) => (
                          <span key={n} className="bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/50 font-bold">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1-Click Trade Blueprints Drawer */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-2">
                  <button
                    onClick={() => setExpandedPartnerId(expandedPartnerId === partner.roster_id ? null : partner.roster_id)}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono font-bold text-amber-400 flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-1.5">
                      <Lightbulb size={13} />
                      <span>💡 3 Concrete Deal Blueprints</span>
                    </span>
                    {expandedPartnerId === partner.roster_id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {expandedPartnerId === partner.roster_id && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      {/* Blueprint 1: Win-Now Veteran Push */}
                      <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] font-mono space-y-1.5">
                        <div className="flex items-center justify-between text-amber-300 font-bold">
                          <span>1. The Win-Now Starter Push</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">98% FAIR</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          <div><strong>Send:</strong> High-Scoring Veteran RB/WR</div>
                          <div><strong>Receive:</strong> Young Developmental Asset + 2026 2nd</div>
                        </div>
                        <button
                          onClick={() => {
                            if (onSelectPartner) onSelectPartner(partner.roster_id, partner.team_name);
                            else window.location.href = `/dynasty-room?arena=trade&sub=architect&partner_roster=${partner.roster_id}`;
                          }}
                          className="w-full py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold transition-all mt-1"
                        >
                          Load Blueprint into Architect →
                        </button>
                      </div>

                      {/* Blueprint 2: Mutual Need Positional Swap */}
                      <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] font-mono space-y-1.5">
                        <div className="flex items-center justify-between text-cyan-300 font-bold">
                          <span>2. Positional Need 1-for-1 Swap</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">100% PARITY</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          <div><strong>Send:</strong> Your Surplus ({partner.needs[0] || 'WR'})</div>
                          <div><strong>Receive:</strong> Their Surplus ({partner.strengths[0] || 'RB'})</div>
                        </div>
                        <button
                          onClick={() => {
                            if (onSelectPartner) onSelectPartner(partner.roster_id, partner.team_name);
                            else window.location.href = `/dynasty-room?arena=trade&sub=architect&partner_roster=${partner.roster_id}`;
                          }}
                          className="w-full py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold transition-all mt-1"
                        >
                          Load Blueprint into Architect →
                        </button>
                      </div>

                      {/* Blueprint 3: 2-for-1 Consolidation */}
                      <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] font-mono space-y-1.5">
                        <div className="flex items-center justify-between text-purple-300 font-bold">
                          <span>3. Tier-Up Consolidation (2-for-1)</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">ELITE ANCHOR</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          <div><strong>Send:</strong> Two Solid Depth Starters</div>
                          <div><strong>Receive:</strong> Tier 1 Cornerstone Asset</div>
                        </div>
                        <button
                          onClick={() => {
                            if (onSelectPartner) onSelectPartner(partner.roster_id, partner.team_name);
                            else window.location.href = `/dynasty-room?arena=trade&sub=architect&partner_roster=${partner.roster_id}`;
                          }}
                          className="w-full py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold transition-all mt-1"
                        >
                          Load Blueprint into Architect →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-3 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={() => {
                      if (onSelectPartner) {
                        onSelectPartner(partner.roster_id, partner.team_name);
                      } else {
                        window.location.href = `/dynasty-room?arena=trade&sub=architect&partner_roster=${partner.roster_id}`;
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-black transition-all flex items-center justify-center gap-1.5 shadow-sm border border-zinc-700 hover:border-zinc-600"
                    style={{ color: currentTheme.primary }}
                  >
                    <span>CUSTOM TRADE IN ARCHITECT</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, ArrowRightLeft, Sparkles, TrendingUp, ShieldAlert, 
  CheckCircle2, ArrowRight, Zap, Target, Search, Filter,
  Layers, Trophy, AlertTriangle
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

interface TradePartnerTabProps {
  onSelectPartner?: (rosterId: number, teamName: string) => void;
}

export default function TradePartnerTab({ onSelectPartner }: TradePartnerTabProps) {
  const { leagueId, leagueName } = useLeague();
  const { currentTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [myRosterId, setMyRosterId] = useState<number | null>(null);

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
            if (data.length > 0) {
              setMyRosterId(data[0].roster_id);
            }
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

  // Calculate synergy matches for all other teams
  const partnerMatches = teams
    .filter(t => t.roster_id !== myTeam?.roster_id)
    .map(team => {
      // Compare win now vs future value
      const myWinNow = myTeam?.win_now_score || 50;
      const myFuture = myTeam?.future_score || 50;
      const teamWinNow = team?.win_now_score || 50;
      const teamFuture = team?.future_score || 50;

      // Rebuilder vs Contender synergy is highest
      let synergyScore = 70;
      let synergyReason = "Balanced Roster Synergy";
      let partnerType = "Neutral";

      if (myWinNow > 65 && teamFuture > 60) {
        synergyScore = 94;
        synergyReason = "Contender (You) ↔ Rebuilder (Them): High Draft Pick & Youth Trade Alignment";
        partnerType = "Rebuilder / Future Seller";
      } else if (myWinNow < 50 && teamWinNow > 65) {
        synergyScore = 96;
        synergyReason = "Rebuilder (You) ↔ Contender (Them): Sell your aging vets for their young assets";
        partnerType = "Win-Now Buyer";
      } else if (Math.abs(myWinNow - teamWinNow) > 20) {
        synergyScore = 88;
        synergyReason = "Divergent Timeline: High probability of mutually beneficial value transfer";
        partnerType = "Timeline Divergence";
      } else {
        synergyScore = 76;
        synergyReason = "Lateral Positional Swap: Opportunity to trade depth for starter upgrades";
        partnerType = "Tier Competitor";
      }

      // Positional strengths & needs
      const strengths: string[] = [];
      const needs: string[] = [];

      if (team.qb_power && team.qb_power > 60) strengths.push('QB');
      else if (team.qb_power && team.qb_power < 40) needs.push('QB');

      if (team.rb_power && team.rb_power > 60) strengths.push('RB');
      else if (team.rb_power && team.rb_power < 40) needs.push('RB');

      if (team.wr_power && team.wr_power > 60) strengths.push('WR');
      else if (team.wr_power && team.wr_power < 40) needs.push('WR');

      if (team.te_power && team.te_power > 60) strengths.push('TE');
      else if (team.te_power && team.te_power < 40) needs.push('TE');

      return {
        ...team,
        synergyScore,
        synergyReason,
        partnerType,
        strengths: strengths.length > 0 ? strengths : ['Balanced Depth'],
        needs: needs.length > 0 ? needs : ['Draft Capital'],
      };
    })
    .sort((a, b) => b.synergyScore - a.synergyScore);

  const filteredMatches = partnerMatches.filter(p => {
    const matchesSearch = searchQuery === '' || 
      p.team_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPhase = selectedPhase === 'ALL' || 
      (selectedPhase === 'BUYER' && p.partnerType.includes('Buyer')) ||
      (selectedPhase === 'SELLER' && p.partnerType.includes('Seller')) ||
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
              onChange={(e) => setMyRosterId(Number(e.target.value))}
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
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span 
                      className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        isTopSynergy 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
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

                  {/* Team Title */}
                  <h3 className="text-base font-black text-white group-hover:text-zinc-100 transition-colors truncate">
                    {partner.team_name || `Roster ${partner.roster_id}`}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                    {partner.owner_name ? `@${partner.owner_name}` : 'League Rival'}
                  </p>

                  {/* Rationale Brief */}
                  <div className="mt-3 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-300 leading-relaxed">
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

                {/* Action Button */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80">
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
                    <span>BUILD TRADE PROPOSAL</span>
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

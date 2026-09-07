"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, Activity, ShieldAlert, Trophy, Award, 
  TrendingUp, TrendingDown, CheckCircle2, Ticket, Sparkles 
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';
import TacticalBriefingCard from '@/components/ui/TacticalBriefingCard';
import MetricExplainer from '@/components/ui/MetricExplainer';

export default function AutopsyTab({ 
  autopsyData: initialAutopsy, 
  tradesList: initialTrades,
  selectedTrade: initialSelectedTrade,
  handleTradeSelect: initialHandleSelect 
}: { 
  autopsyData?: any;
  tradesList?: any[];
  selectedTrade?: string;
  handleTradeSelect?: (id: string) => void;
}) {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();

  const [autopsyData, setAutopsyData] = useState<any>(initialAutopsy || null);
  const [tradesList, setTradesList] = useState<any[]>(initialTrades || []);
  const [selectedTrade, setSelectedTrade] = useState<string>(initialSelectedTrade || '');
  const [isLoading, setIsLoading] = useState(!initialAutopsy);

  useEffect(() => {
    if (!leagueId) return;

    async function fetchInitialTrades() {
      if (initialAutopsy && initialTrades) return;
      setIsLoading(true);
      try {
        const apiUrl = getApiUrl();
        const [tradesRes, autopsyRes] = await Promise.all([
          fetch(`${apiUrl}/api/quant/trades/${leagueId}`),
          fetch(`${apiUrl}/api/quant/trade-autopsy/${leagueId}`)
        ]);

        if (tradesRes.ok) {
          const tList = await tradesRes.json();
          if (Array.isArray(tList)) setTradesList(tList);
        }
        if (autopsyRes.ok) {
          const aData = await autopsyRes.json();
          if (!aData.error) setAutopsyData(aData);
        }
      } catch (err) {
        console.error("Failed to load autopsy data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialTrades();
  }, [leagueId, initialAutopsy, initialTrades]);

  useEffect(() => {
    if (initialSelectedTrade && initialSelectedTrade !== selectedTrade) {
      onTradeChange(initialSelectedTrade);
    }
  }, [initialSelectedTrade]);

  const onTradeChange = async (transactionId: string) => {
    setSelectedTrade(transactionId);
    if (initialHandleSelect) {
      initialHandleSelect(transactionId);
      return;
    }
    if (!leagueId) return;

    try {
      const apiUrl = getApiUrl();
      const autopsyRes = await fetch(`${apiUrl}/api/quant/trade-autopsy/${leagueId}?transaction_id=${transactionId}`);
      if (autopsyRes.ok) {
        const aData = await autopsyRes.json();
        if (!aData.error) setAutopsyData(aData);
      }
    } catch (err) {
      console.error("Failed to fetch trade details:", err);
    }
  };

  if (isLoading && !autopsyData) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentTheme.primary }} />
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          Calculating Post-Trade Value Extraction...
        </p>
      </div>
    );
  }

  if (!autopsyData) {
    return (
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-8 text-center shadow-xl card-bezel animate-in fade-in duration-300">
        <ArrowRightLeft className="mx-auto mb-3 opacity-40 text-zinc-500" size={36} />
        <h3 className="text-xl font-black text-white italic mb-1 uppercase tracking-tight">No Trades Detected</h3>
        <p className="text-zinc-400 font-mono text-xs">There are no completed trades recorded in this league yet.</p>
      </div>
    );
  }

  const teamATotal = Number(autopsyData.teamA_total || 0);
  const teamBTotal = Number(autopsyData.teamB_total || 0);
  const teamAWins = teamATotal >= teamBTotal;
  const teamBWins = teamBTotal > teamATotal;
  const netDiff = Number(autopsyData.net_diff_num ?? Math.abs(teamATotal - teamBTotal)).toFixed(1);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* ── TACTICAL BRIEFING GUIDE ─────────────────────────────────────────── */}
      <TacticalBriefingCard
        title="Trade Autopsy: Post-Execution Value Extraction"
        subtitle="Tracking the exact real-world fantasy points produced by all sides of a completed trade"
        badge="POST-TRADE AUDIT"
        points={[
          {
            icon: ArrowRightLeft,
            label: "1. Realized Points Differential",
            text: "Measures actual fantasy points scored by every traded player and rookie draft pick since the trade timestamp.",
            color: "#2dd4bf"
          },
          {
            icon: Activity,
            label: "2. Win/Loss Margin",
            text: "Reveals who extracted net positive scoring value and which manager overpaid based on retrospective performance.",
            color: "#38bdf8"
          },
          {
            icon: Sparkles,
            label: "3. The Tactical Play",
            text: "Audit which league-mates consistently sell low on struggling stars or overvalue short-term injury fill-ins.",
            color: "#34d399"
          }
        ]}
      />

      {/* ── TOP CONTROL & SELECTOR STRIP ──────────────────────────────── */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-md backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <ArrowRightLeft size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-1.5 font-sans">
              Trade Autopsy
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700 font-normal">
                {autopsyData.date || "Completed Trade"}
              </span>
              <MetricExplainer term="trade_arbitrage" size="xs" />
            </h3>
            <p className="text-[11px] font-mono text-zinc-400">
              Actual fantasy points produced by all assets since trade execution date.
            </p>
          </div>
        </div>

        {/* Trade Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select 
            value={selectedTrade}
            onChange={(e) => onTradeChange(e.target.value)}
            className="w-full sm:w-auto bg-zinc-950 border border-zinc-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-teal-500 transition-all shadow-inner truncate max-w-full sm:max-w-xs"
          >
            <option value="">-- Most Recent Trade --</option>
            {tradesList.map(t => (
              <option key={t.transaction_id} value={t.transaction_id}>
                {t.date}: {Array.isArray(t.teams) ? t.teams.join(' / ') : `${t.team_a?.name || 'Team A'} ⇄ ${t.team_b?.name || 'Team B'}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── SCOREBOARD BANNER (WHO WON) ───────────────────────────────── */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 card-bezel">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
            <Trophy size={20} />
          </div>
          <div className="overflow-hidden">
            <span className="text-[9px] font-mono uppercase text-emerald-400 block font-bold tracking-wider">
              Trade Verdict · Surplus Leader
            </span>
            <h4 className="text-sm sm:text-base font-black text-white truncate">
              {autopsyData.winner_name} captured <span className="text-emerald-400 font-mono">+{netDiff} pts</span> net advantage
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 shrink-0 text-xs font-mono">
          <span className="text-zinc-500">Differential:</span>
          <span className="font-black text-emerald-400">+{netDiff} PTS</span>
        </div>
      </div>

      {/* ── DUAL TEAM COMPARISON CARDS (COMPACT SIDE-BY-SIDE ON TABLET+) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        
        {/* TEAM A CARD */}
        <div className={`bg-zinc-900/90 rounded-2xl p-4 border transition-all card-bezel flex flex-col justify-between space-y-3 ${
          teamAWins 
            ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.08)] bg-gradient-to-b from-emerald-950/20 to-zinc-900/90' 
            : 'border-zinc-800/90'
        }`}>
          <div>
            {/* Header: Team Name, Received Badge, Total Points */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800">
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm sm:text-base font-black text-white truncate font-sans">
                    {autopsyData.teamA}
                  </h4>
                  {teamAWins && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-black uppercase border border-emerald-500/40 shrink-0">
                      WINNER
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                  Acquired Assets
                </span>
              </div>

              <div className="text-right shrink-0">
                <div className={`text-base sm:text-lg font-black font-mono leading-tight ${teamAWins ? 'text-emerald-400' : 'text-zinc-200'}`}>
                  {teamATotal.toFixed(1)}
                </div>
                <span className="text-[8.5px] font-mono uppercase text-zinc-500 block">Total PTS</span>
              </div>
            </div>

            {/* Asset List */}
            <div className="space-y-1.5 mt-3">
              {(autopsyData.assetsA || []).map((asset: any, idx: number) => {
                const isPick = asset.type === 'pick' || asset.name?.toLowerCase().includes('round');
                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-zinc-950/80 px-3 py-2 rounded-xl border border-zinc-800/80 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isPick ? (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold border border-indigo-500/30 shrink-0">
                          PICK
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[9px] font-bold border border-teal-500/30 shrink-0">
                          {asset.position || "PLAYER"}
                        </span>
                      )}
                      <span className="text-zinc-200 font-bold truncate">{asset.name}</span>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isPick ? (
                        <span className="text-[10px] text-indigo-300 font-bold bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                          Future Capital
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-black">
                          +{Number(asset.pointsSince || 0).toFixed(1)} pts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>Production Share:</span>
            <span className="font-bold text-zinc-300">
              {((teamATotal / Math.max(teamATotal + teamBTotal, 1)) * 100).toFixed(0)}% of Trade Output
            </span>
          </div>
        </div>

        {/* TEAM B CARD */}
        <div className={`bg-zinc-900/90 rounded-2xl p-4 border transition-all card-bezel flex flex-col justify-between space-y-3 ${
          teamBWins 
            ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.08)] bg-gradient-to-b from-emerald-950/20 to-zinc-900/90' 
            : 'border-zinc-800/90'
        }`}>
          <div>
            {/* Header: Team Name, Received Badge, Total Points */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800">
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm sm:text-base font-black text-white truncate font-sans">
                    {autopsyData.teamB}
                  </h4>
                  {teamBWins && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-black uppercase border border-emerald-500/40 shrink-0">
                      WINNER
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                  Acquired Assets
                </span>
              </div>

              <div className="text-right shrink-0">
                <div className={`text-base sm:text-lg font-black font-mono leading-tight ${teamBWins ? 'text-emerald-400' : 'text-zinc-200'}`}>
                  {teamBTotal.toFixed(1)}
                </div>
                <span className="text-[8.5px] font-mono uppercase text-zinc-500 block">Total PTS</span>
              </div>
            </div>

            {/* Asset List */}
            <div className="space-y-1.5 mt-3">
              {(autopsyData.assetsB || []).map((asset: any, idx: number) => {
                const isPick = asset.type === 'pick' || asset.name?.toLowerCase().includes('round');
                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-zinc-950/80 px-3 py-2 rounded-xl border border-zinc-800/80 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isPick ? (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold border border-indigo-500/30 shrink-0">
                          PICK
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[9px] font-bold border border-teal-500/30 shrink-0">
                          {asset.position || "PLAYER"}
                        </span>
                      )}
                      <span className="text-zinc-200 font-bold truncate">{asset.name}</span>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isPick ? (
                        <span className="text-[10px] text-indigo-300 font-bold bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                          Future Capital
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-black">
                          +{Number(asset.pointsSince || 0).toFixed(1)} pts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>Production Share:</span>
            <span className="font-bold text-zinc-300">
              {((teamBTotal / Math.max(teamATotal + teamBTotal, 1)) * 100).toFixed(0)}% of Trade Output
            </span>
          </div>
        </div>

      </div>

      {/* ── QUANT AUTOPSY DEBRIEF ─────────────────────────────────────── */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 text-xs font-mono text-zinc-400 flex items-start gap-2.5">
        <Sparkles size={16} className="text-teal-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white font-sans">{autopsyData.winner_name}</strong> captured <span className="text-emerald-400 font-bold">+{netDiff} net points</span> above their trade partner since execution date. Unplayed draft picks are tracked as active dynasty capital.
        </p>
      </div>

    </div>
  );
}

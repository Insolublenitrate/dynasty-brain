"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Activity, ShieldAlert, Trophy } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

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
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
      </div>
    );
  }

  if (!autopsyData) {
    return (
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-12 text-center shadow-xl animate-in fade-in duration-500">
        <ArrowRightLeft className="mx-auto mb-4 opacity-50 text-zinc-500" size={48} />
        <h3 className="text-2xl font-black text-white italic mb-2 tracking-widest uppercase">No Trades Detected</h3>
        <p className="text-zinc-400 font-semibold text-sm">There are no completed trades recorded in this league yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl">
        
        {/* Header and Trade Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ArrowRightLeft size={30} style={{ color: currentTheme.primary }} />
              <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tight uppercase">
                Trade Autopsy
              </h3>
            </div>
            <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">
              Analyzing transaction fallout based on actual points scored since execution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select 
              value={selectedTrade}
              onChange={(e) => onTradeChange(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all max-w-xs"
            >
              <option value="">-- Most Recent Trade --</option>
              {tradesList.map(t => (
                <option key={t.transaction_id} value={t.transaction_id}>
                  {t.date}: {t.teams.join(' / ')}
                </option>
              ))}
            </select>
            <div className="px-3.5 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-bold tracking-widest text-zinc-400 flex items-center gap-2 shadow-inner">
              <Activity size={14} className="animate-pulse text-emerald-400" /> LIVE TRACKING
            </div>
          </div>
        </div>

        {/* Autopsy Card */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent to-transparent shadow-lg"
            style={{ backgroundImage: `linear-gradient(to right, transparent, ${currentTheme.primary}, transparent)` }}
          />
          
          <div className="text-center mb-8 mt-2">
            <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase mb-2.5">
              Executed: {autopsyData.date}
            </p>
            <div className="inline-flex items-center gap-2 bg-purple-950/40 text-purple-400 px-6 py-2 rounded-full text-xs font-black tracking-widest border border-purple-800/50 shadow-md">
              <ShieldAlert size={15} /> FLEECE ALERT
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-stretch gap-6 relative">
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-zinc-800 -translate-y-1/2 z-0"></div>

            {/* Team A */}
            <div className="w-full md:w-[45%] bg-zinc-900/90 p-6 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative z-10">
              <div className="text-center mb-6 pb-4 border-b border-zinc-800">
                <h4 className="text-white font-bold text-lg">{autopsyData.teamA}</h4>
                <p className="text-emerald-400 text-xs font-mono uppercase tracking-widest mt-1">Received</p>
              </div>
              <div className="space-y-3">
                {(autopsyData.assetsA || []).map((asset: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800/60 hover:border-emerald-500/40 transition-colors">
                    <span className="text-zinc-200 font-semibold text-sm">{asset.name}</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">+{asset.pointsSince} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex-shrink-0 flex items-center justify-center relative z-10 py-2 md:py-0">
              <div className="w-12 h-12 bg-zinc-950 rounded-full border border-zinc-700 flex items-center justify-center shadow-xl">
                <span className="text-zinc-500 font-black italic text-sm">VS</span>
              </div>
            </div>

            {/* Team B */}
            <div className="w-full md:w-[45%] bg-zinc-900/90 p-6 rounded-2xl border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.05)] relative z-10">
              <div className="text-center mb-6 pb-4 border-b border-zinc-800">
                <h4 className="text-white font-bold text-lg">{autopsyData.teamB}</h4>
                <p className="text-rose-400 text-xs font-mono uppercase tracking-widest mt-1">Received</p>
              </div>
              <div className="space-y-3">
                {(autopsyData.assetsB || []).map((asset: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800/60 hover:border-rose-500/40 transition-colors">
                    <span className="text-zinc-200 font-semibold text-sm">{asset.name}</span>
                    <span className="text-rose-400 font-mono font-bold text-sm">+{asset.pointsSince} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center bg-zinc-900/70 p-6 rounded-2xl border border-zinc-800">
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-2">Net Point Differential</p>
            <p className="text-4xl md:text-5xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] tracking-tighter">
              {autopsyData.netDifference}
            </p>
            <p className="text-zinc-400 text-sm mt-3 italic max-w-xl mx-auto">
              "{autopsyData.winner_name} didn't just win this trade, they expanded their competitive championship window."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

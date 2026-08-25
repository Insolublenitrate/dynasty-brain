"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, TrendingUp, Info, Target, Sparkles, ArrowUpRight, Radio, MessageSquare } from "lucide-react";
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/config/api';

export default function ActionCenterTab() {
  const { leagueId, isLoading } = useLeague();
  const { currentTheme } = useTheme();
  const router = useRouter();

  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [seasonOutlook, setSeasonOutlook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId) return;
    async function fetchData() {
      try {
        const apiUrl = getApiUrl();
        const [mRes, oRes] = await Promise.all([
          fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}`).catch(() => null),
          fetch(`${apiUrl}/api/ai/season-outlook/${leagueId}`).catch(() => null)
        ]);

        if (mRes?.ok) {
          const json = await mRes.json();
          if (Array.isArray(json)) setMatrixData(json);
        }

        if (oRes?.ok) {
          const oJson = await oRes.json();
          if (oJson?.status === 'success') setSeasonOutlook(oJson);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [leagueId]);

  // Attempt to find the current user's roster by name, fallback to first
  const myRoster = matrixData.length > 0 
    ? (matrixData.find(r => r.team_name?.toLowerCase().includes('insolublenitrate')) || matrixData[0]) 
    : null;

  const myOutlook = seasonOutlook?.teams?.find((t: any) => 
    t.team_name?.toLowerCase().includes('insolublenitrate') || (myRoster && t.roster_id === myRoster.roster_id)
  ) || seasonOutlook?.teams?.[0];

  // Generate dynamic actions based on league data
  const actions = matrixData
    .filter(team => team.point_differential < -50 || team.lifecycle_state === 'All-In Contender')
    .map(team => {
      if (team.lifecycle_state === 'All-In Contender') {
        return {
          id: team.roster_id,
          type: "alert",
          icon: <AlertTriangle className="text-rose-400" size={22} />,
          title: `Proactive Sell Target: ${team.team_name}`,
          description: `This team is currently classified as an "All-In Contender". Consider selling aging veteran assets to them at a premium while their championship window is open.`,
          timestamp: "Live Signal",
          bg: "bg-rose-950/20",
          border: "border-rose-900/40",
          btnColor: "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
        };
      }
      if (team.point_differential < -50) {
        return {
          id: team.roster_id,
          type: "opportunity",
          icon: <TrendingUp className="text-emerald-400" size={22} />,
          title: `Buy Low Window: ${team.team_name}`,
          description: `This team is suffering from severe negative variance. Expected Points (${team.expected_points?.toFixed(0)}) greatly exceed Actual Points (${team.actual_points?.toFixed(0)}). Target frustrated managers with buy-low offers.`,
          timestamp: "1 hr ago",
          bg: "bg-emerald-950/20",
          border: "border-emerald-900/40",
          btnColor: "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
        };
      }
      return null;
    })
    .filter(Boolean) as any[];

  if (myRoster) {
    actions.unshift({
      id: "my-status",
      type: "info",
      icon: <Sparkles size={22} style={{ color: currentTheme.primary }} />,
      title: "Roster Lifecycle Classification",
      description: `Based on your Max PF (${myRoster.max_pf?.toFixed(1)}) and Draft Capital (${myRoster.future_capital_score?.toFixed(0)}), your team is classified as '${myRoster.lifecycle_state}'.\n\nAI Directive: ${myRoster.action_recommendation}\n\nCoaching Insight: ${myRoster.ai_coaching}`,
      timestamp: "Live Quant",
      bg: "bg-zinc-900/90",
      border: "border-zinc-700",
      btnColor: "bg-orange-500/20 text-orange-400"
    });
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Top Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
          <Target size={28} style={{ color: currentTheme.primary }} /> ACTION CENTER
        </h2>
        <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mt-1">
          AI-curated intelligence feed based on market discrepancies, roster lifecycles, and 2026 preseason forecasts.
        </p>
      </div>

      {/* ── COACH MADDEN 2026 PRESEASON DEBRIEF ──────────────────────────── */}
      {seasonOutlook && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-zinc-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-mono text-xs font-black uppercase flex items-center gap-1.5 shadow-sm">
                  <Radio size={13} className="animate-pulse text-orange-400" />
                  COACH MADDEN · 2026 PRESEASON STATE OF THE UNION
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {seasonOutlook.league_name}
                </span>
              </div>
              <p className="text-sm font-mono text-zinc-200 leading-relaxed italic border-l-2 border-orange-500/60 pl-3">
                &ldquo;{seasonOutlook.state_of_the_league}&rdquo;
              </p>
            </div>

            {/* Franchise Custom Scouting Card */}
            {myOutlook && (
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 lg:w-96 flex-shrink-0 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Your 2026 Outlook</span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {myOutlook.tier}
                  </span>
                </div>
                <div className="border-t border-zinc-800/80 pt-2 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Proj Scoring:</span>
                    <span className="text-emerald-400 font-bold">{myOutlook.weekly_proj_avg} pts/wk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Camp Breakout:</span>
                    <span className="text-cyan-400 font-bold truncate max-w-[170px]">{myOutlook.camp_breakout}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Preseason Danger:</span>
                    <span className="text-rose-400 font-bold truncate max-w-[170px]">{myOutlook.risk_factor}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/ask-madden')}
                  className="w-full mt-2 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-mono text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <MessageSquare size={13} />
                  <span>Ask Coach Madden</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Lifecycle State</div>
          <div className="text-2xl md:text-3xl font-black" style={{ color: currentTheme.primary }}>
            {loading ? "..." : myRoster?.lifecycle_state || "Active"}
          </div>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Draft Capital Index</div>
          <div className="text-2xl md:text-3xl font-black font-mono text-emerald-400">
            {loading ? "..." : myRoster?.future_capital_score?.toFixed(0) || "5000"}
          </div>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">AI Recommendation</div>
          <div className="text-xl md:text-2xl font-black text-white truncate">
            {loading ? "..." : myRoster?.action_recommendation || "Maintain Course"}
          </div>
        </div>
      </div>

      {/* Action Feed */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>Market Opportunities & Action Items</span>
        </h3>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-zinc-500 p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 animate-pulse font-mono text-sm">
              Analyzing league transactions and points against expected baseline...
            </div>
          ) : actions.length > 0 ? (
            actions.map((action) => (
              <div 
                key={action.id} 
                className={`flex flex-col sm:flex-row gap-4 p-6 rounded-2xl border shadow-xl ${action.bg} ${action.border} transition-all hover:scale-[1.005]`}
              >
                <div className="flex-shrink-0 mt-1">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-white">{action.title}</h4>
                    <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      {action.timestamp}
                    </span>
                  </div>
                  <p className="mt-2 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {action.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-zinc-400 p-12 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-center text-sm">
              The market is currently balanced. No high-conviction arbitrage targets detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

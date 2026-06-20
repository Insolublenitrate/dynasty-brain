"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, Info, Target } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { useLeague } from '@/context/LeagueContext';
import { useRouter } from 'next/navigation';

export default function ActionCenterTab() {
  const { leagueId, isLoading } = useLeague();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !leagueId) {
      router.push('/login');
    }
  }, [leagueId, isLoading, router]);

  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId) return;
    async function fetchMatrix() {
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setMatrixData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatrix();
  }, [leagueId]);

  // Attempt to find the current user's roster by name, fallback to first
  const myRoster = matrixData.length > 0 
    ? (matrixData.find(r => r.team_name.toLowerCase().includes('insolublenitrate')) || matrixData[0]) 
    : null;

  // Generate dynamic actions based on league data
  const actions = matrixData
    .filter(team => team.point_differential < -50 || team.lifecycle_state === 'All-In Contender')
    .map(team => {
      if (team.lifecycle_state === 'All-In Contender') {
        return {
          id: team.roster_id,
          type: "alert",
          icon: <AlertTriangle className="text-rose-500" size={24} />,
          title: `Proactive Sell Target: ${team.team_name}`,
          description: `This team is currently classified as an "All-In Contender". Consider selling aging assets to them at a premium while they believe they are in their championship window.`,
          timestamp: "Just now",
          bg: "bg-rose-500/10",
          border: "border-rose-500/20"
        };
      }
      if (team.point_differential < -50) {
        return {
          id: team.roster_id,
          type: "opportunity",
          icon: <TrendingUp className="text-emerald-500" size={24} />,
          title: `Buy Low Window: ${team.team_name}`,
          description: `This team is suffering from severe negative variance. Their Expected Points (${team.expected_points.toFixed(0)}) greatly exceed their Actual Points (${team.actual_points.toFixed(0)}). Target their frustrated managers with buy-low offers.`,
          timestamp: "1 hr ago",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20"
        };
      }
      return null;
    })
    .filter(Boolean) as any[];

  if (myRoster) {
    actions.unshift({
      id: "my-status",
      type: "info",
      icon: <Info className="text-indigo-500" size={24} />,
      title: "Your Roster Lifecycle Update",
      description: `Based on your Max PF and Draft Capital, your team has been classified as a '${myRoster.lifecycle_state}'. The AI recommends: ${myRoster.action_recommendation}.\n\nAI Coaching Insight: ${myRoster.ai_coaching}`,
      timestamp: "Live",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20"
    });
  }

  // Calculate medians for the grid axes
  const xMedian = matrixData.length > 0 ? [...matrixData].sort((a,b) => a.max_pf - b.max_pf)[Math.floor(matrixData.length/2)].max_pf : 1500;
  const yMedian = matrixData.length > 0 ? [...matrixData].sort((a,b) => a.future_capital_score - b.future_capital_score)[Math.floor(matrixData.length/2)].future_capital_score : 5000;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl text-sm z-50 relative">
          <div className="flex items-center gap-3 mb-3">
            {p.avatar && <img src={`https://sleepercdn.com/avatars/${p.avatar}`} className="w-8 h-8 rounded-full" alt="avatar" />}
            <div>
              <p className="font-bold text-slate-100">{p.team_name}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">{p.lifecycle_state}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400">Max PF: <span className="text-slate-200 font-mono">{p.max_pf.toFixed(1)}</span></p>
            <p className="text-slate-400">Future Draft Capital: <span className="text-slate-200 font-mono">{p.future_capital_score.toFixed(0)}</span></p>
            <p className="text-slate-400 pt-2 border-t border-slate-800 mt-2">Action: <span className="font-semibold text-emerald-400">{p.action_recommendation}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getDotColor = (state: string) => {
    switch (state) {
      case 'Dynasty Juggernaut': return '#6366f1'; // indigo-500
      case 'All-In Contender': return '#f43f5e'; // rose-500
      case 'Rebuilding': return '#10b981'; // emerald-500
      case 'Purgatory': return '#64748b'; // slate-500
      case 'Middle of the Pack': return '#eab308'; // yellow-500
      default: return '#94a3b8';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Action Center</h1>
          <p className="text-slate-400 mt-2">Your AI-curated intelligence feed based on real-time market data and underlying metrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="text-sm font-medium text-slate-400 mb-1">Your Lifecycle State</div>
            <div className="text-2xl font-bold text-indigo-400">
              {loading ? "..." : myRoster?.lifecycle_state || "Unknown"}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="text-sm font-medium text-slate-400 mb-1">Your Draft Capital</div>
            <div className="text-2xl font-bold text-emerald-400">
              {loading ? "..." : myRoster?.future_capital_score.toFixed(0)}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="text-sm font-medium text-slate-400 mb-1">AI Recommendation</div>
            <div className="text-2xl font-bold text-rose-400">
              {loading ? "..." : myRoster?.action_recommendation}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-4">AI Action Feed</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-slate-500 p-8 text-center animate-pulse">Analyzing the league data for discrepancies...</div>
            ) : actions.length > 0 ? (
              actions.map(action => (
                <div key={action.id} className={`flex gap-4 p-6 rounded-xl border shadow-xl ${action.bg} ${action.border}`}>
                  <div className="flex-shrink-0 mt-1">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-slate-200">{action.title}</h3>
                      <span className="text-xs font-medium text-slate-500">{action.timestamp}</span>
                    </div>
                    <p className="mt-2 text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {action.description}
                    </p>
                    <div className="mt-4 flex gap-3">
                      {action.type === 'alert' && (
                        <button className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-sm font-medium rounded-lg transition-colors">
                          Propose Trade
                        </button>
                      )}
                      {action.type === 'opportunity' && (
                        <button className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium rounded-lg transition-colors">
                          Generate Buy Low Offer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 p-8 bg-slate-900 rounded-xl border border-slate-800 shadow-xl text-center">
                The market is completely efficient. No action required.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

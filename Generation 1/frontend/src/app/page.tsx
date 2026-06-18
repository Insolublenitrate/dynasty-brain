"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, Info, Brain } from "lucide-react";
import { useLeague } from '@/context/LeagueContext';
import { useRouter } from 'next/navigation';

export default function LeagueAnalyzer() {
  const { leagueId, isLoading } = useLeague();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !leagueId) {
      router.push('/login');
    }
  }, [leagueId, isLoading, router]);

  const [matrixData, setMatrixData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isLoading || !leagueId) return;
    async function fetchMatrix() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}&t=${Date.now()}`);
        if (!res.ok) throw new Error("Failed to fetch from backend");
        const json = await res.json();
        if (json.error || !Array.isArray(json)) {
          console.error("Backend returned error or non-array:", json);
          setErrorMsg(json.error || "Failed to load league data.");
          setMatrixData([]);
        } else {
          setMatrixData(json);
          setErrorMsg(null);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Network error or backend is down.");
      } finally {
        setLoading(false);
      }
    }
    fetchMatrix();
  }, [leagueId, isLoading]);

  // Assuming the user's roster is index 0 for demonstration purposes
  const myRoster = matrixData.length > 0 ? matrixData[0] : null;

  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(true);

  useEffect(() => {
    if (isLoading || !leagueId) return;
    async function fetchInsights() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/ai/league-insights?league_id=${leagueId}&t=${Date.now()}`);
        if (!res.ok) throw new Error("Failed to fetch from backend");
        const json = await res.json();
        if (!json.error && Array.isArray(json)) {
          setActions(json);
        }
      } catch (err) {
        console.error("Error fetching AI insights:", err);
      } finally {
        setLoadingActions(false);
      }
    }
    fetchInsights();
  }, [leagueId, isLoading]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">League Analyzer</h1>
        <p className="text-slate-400 mt-2">Your high-end AI coaching and league breakdown tool.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-sm font-medium text-slate-400 mb-1">Your Lifecycle State</div>
          <div className="text-2xl font-bold text-indigo-400">
            {loading ? "..." : myRoster?.lifecycle_state || "Unknown"}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-sm font-medium text-slate-400 mb-1">Your Draft Capital</div>
          <div className="text-2xl font-bold text-emerald-400">
            {loading ? "..." : myRoster?.future_capital_score.toFixed(0)}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-sm font-medium text-slate-400 mb-1">AI Recommendation</div>
          <div className="text-2xl font-bold text-rose-400">
            {loading ? "..." : myRoster?.action_recommendation}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold tracking-tight text-white mt-8 mb-4">AI Action Feed</h2>
      <div className="space-y-4">
        {loadingActions || loading || isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <div className="text-slate-400 text-center">
              <p className="font-semibold text-slate-300">Analyzing the league data for discrepancies...</p>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="text-rose-400 p-8 bg-rose-500/10 rounded-xl border border-rose-500/20 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <AlertTriangle size={24} />
              <div>
                <p className="font-semibold">{errorMsg}</p>
                <p className="text-sm mt-1">If the database was wiped or out of sync, please try re-syncing your league data.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('dynasty_league_id');
                window.location.href = '/login';
              }}
              className="mt-2 w-fit px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-sm font-medium rounded-lg transition-colors"
            >
              Clear League & Re-Sync Data
            </button>
          </div>
        ) : actions.length > 0 ? (
          actions.map(action => (
            <div key={action.id} className={`flex gap-4 p-6 rounded-xl border ${
              action.type === 'opportunity' ? 'bg-emerald-500/10 border-emerald-500/20' : 
              action.type === 'alert' ? 'bg-rose-500/10 border-rose-500/20' : 
              'bg-indigo-500/10 border-indigo-500/20'
            }`}>
              <div className="flex-shrink-0 mt-1">
                {action.type === 'opportunity' ? <TrendingUp className="text-emerald-500" size={24} /> :
                 action.type === 'alert' ? <AlertTriangle className="text-rose-500" size={24} /> :
                 <Brain className="text-indigo-500" size={24} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-slate-200">{action.title}</h3>
                  <span className="text-xs font-medium text-slate-500">{action.timestamp}</span>
                </div>
                <p className="mt-2 text-slate-400 leading-relaxed">
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
          <div className="text-slate-500 p-8 bg-slate-900 rounded-xl border border-slate-800 text-center">
            The market is completely efficient. No action required.
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { 
  AlertTriangle, TrendingUp, Swords, 
  Banknote, Skull, Activity, MessageSquareWarning, ArrowRightLeft,
  Flame, Crosshair, ShieldAlert, Zap
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';

export default function DynastyBrainApp() {
  const { leagueId } = useLeague();
  const [activeTab, setActiveTab] = useState('studio');
  
  const [studioData, setStudioData] = useState<any>(null);
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [autopsyData, setAutopsyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!leagueId) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com';
        
        // Fetch Studio Data
        const studioRes = await fetch(`${apiUrl}/api/quant/weekly-studio/${leagueId}`);
        if (studioRes.ok) {
          const sData = await studioRes.json();
          setStudioData(sData);
        }

        // Fetch Matrix Data
        const matrixRes = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}`);
        if (matrixRes.ok) {
          const mData = await matrixRes.json();
          const scatter = mData.map((t: any) => ({
            name: t.team_name,
            owner: t.team_name,
            x: t.roster_age_score,
            y: t.expected_points,
            status: t.health_score > 70 ? 'juggernaut' : (t.expected_points > 1250 ? 'win_now' : (t.roster_age_score < 26 ? 'rebuilding' : 'purgatory'))
          }));
          setMatrixData(scatter);
        }

        // Fetch Autopsy Data
        const autopsyRes = await fetch(`${apiUrl}/api/quant/trade-autopsy/${leagueId}`);
        if (autopsyRes.ok) {
          const aData = await autopsyRes.json();
          if (!aData.error) {
            setAutopsyData(aData);
          }
        }

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [leagueId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // --- STUDIO TAB ---
  const StudioTab = () => {
    if (!studioData) return null;
    const { marquee_matchup, bounty_board, monday_autopsy } = studioData;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Marquee Matchup */}
        <div className="bg-slate-900/80 backdrop-blur-md border-l-4 border-cyan-500 p-6 rounded-r-xl shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 p-4 opacity-5 text-cyan-500 transform rotate-12 pointer-events-none">
            <Swords size={250} />
          </div>
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <Activity className="text-cyan-500 animate-pulse" size={20} />
            <h2 className="text-cyan-500 font-bold tracking-[0.2em] text-xs uppercase">Marquee Matchup of the Week</h2>
          </div>
          <h3 className="text-4xl md:text-5xl font-black text-white italic mb-6 tracking-tight relative z-10 drop-shadow-lg">THE FRAUD CHECK</h3>
          
          <div className="flex flex-col md:flex-row items-center justify-between bg-slate-950/80 p-6 rounded-lg border border-slate-800 relative z-10 shadow-inner">
            <div className="text-center w-full md:w-1/3 mb-4 md:mb-0">
              <p className="text-slate-400 font-mono text-sm mb-1 tracking-wider">TEAM 1</p>
              <p className="text-2xl font-black text-white">{marquee_matchup?.teamA?.name || 'Unknown'}</p>
              <p className="text-cyan-400 font-mono mt-2 text-lg">Pts: {marquee_matchup?.teamA?.proj || 0}</p>
            </div>
            
            <div className="w-full md:w-1/3 flex flex-col items-center justify-center my-4 md:my-0">
              <div className="text-4xl font-black text-slate-700 italic">VS</div>
              <div className="mt-3 px-4 py-1 bg-slate-900 rounded text-xs text-slate-400 font-mono border border-slate-800">
                SPREAD: {marquee_matchup?.spread || 0}
              </div>
            </div>
            
            <div className="text-center w-full md:w-1/3">
              <p className="text-slate-400 font-mono text-sm mb-1 tracking-wider">TEAM 2</p>
              <p className="text-2xl font-black text-white">{marquee_matchup?.teamB?.name || 'Unknown'}</p>
              <p className="text-cyan-400 font-mono mt-2 text-lg">Pts: {marquee_matchup?.teamB?.proj || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Cash Tracker */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 relative hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-950/50 rounded-lg">
                <Banknote className="text-green-500" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">The Bounty Board</h3>
                <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider">Highest Output / Projected Payouts</p>
              </div>
            </div>
            <div className="space-y-3">
              {(bounty_board || []).map((team: any, i: number) => (
                <div key={team.roster_id} className="flex items-center justify-between bg-slate-950/50 p-4 rounded-lg border border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`font-black text-lg ${i === 0 ? 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-slate-600'}`}>#{i+1}</span>
                    <span className="text-slate-200 font-bold">{team.name}</span>
                  </div>
                  <span className="text-green-400 font-mono font-bold text-lg">${team.cashWon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monday Autopsy */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 relative hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-950/50 rounded-lg">
                <Skull className="text-red-500" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Monday Autopsy</h3>
                <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider">Brutal Bench Blunder</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-950/40 to-slate-950 border border-red-900/30 rounded-lg p-5 shadow-inner">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-red-500" />
                <p className="text-red-400 font-bold text-sm">Victim: {monday_autopsy?.victim || 'Unknown'} (Margin: {monday_autopsy?.margin || 0} pts)</p>
              </div>
              
              <div className="flex justify-between items-center text-sm mb-3 border-b border-red-900/20 pb-3">
                <span className="text-slate-300 font-medium">Started: {monday_autopsy?.started?.name} <span className="text-slate-500">({monday_autopsy?.started?.points} pts)</span></span>
              </div>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-slate-300 font-medium">Benched: {monday_autopsy?.benched?.name} <span className="text-green-500">({monday_autopsy?.benched?.points} pts)</span></span>
              </div>
              
              <div className="mt-5 p-3 bg-slate-950 rounded border-l-2 border-red-500 relative">
                <Zap size={14} className="absolute -left-[9px] top-1/2 -translate-y-1/2 text-red-500 bg-slate-950" />
                <p className="text-xs text-slate-400 italic leading-relaxed">
                  "You outsmarted yourself. The data was there, but you went with your gut. Now you're holding an L. Revoke your GM credentials." 
                  <br/><span className="text-cyan-600 font-bold mt-1 inline-block">— AI Analyst</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- MATRIX TAB ---
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 backdrop-blur border border-cyan-900 p-4 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <p className="text-white font-bold text-lg">{data.name}</p>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-2 mt-2">
            <div>
              <p className="text-slate-500 text-[10px] uppercase">Roster Age</p>
              <p className="text-cyan-400 font-mono text-sm">{data.x.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase">Total Output</p>
              <p className="text-cyan-400 font-mono text-sm">{data.y.toFixed(1)}</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800">
            <p className="text-xs uppercase font-black tracking-widest text-slate-500">{data.status.replace('_', ' ')}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const MatrixTab = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
              <Crosshair className="text-cyan-500" /> TRUE POWER MATRIX
            </h3>
            <p className="text-slate-400 text-sm mt-1">Roster Age vs. Total Scoring Output (The Purgatory Detector)</p>
          </div>
        </div>
        
        <div className="h-[500px] w-full relative bg-slate-950/50 rounded-xl p-4 border border-slate-800">
          <div className="absolute top-8 right-8 text-green-500/20 font-black text-3xl md:text-5xl uppercase pointer-events-none tracking-widest hidden sm:block">Juggernauts</div>
          <div className="absolute top-8 left-8 text-yellow-500/20 font-black text-3xl md:text-5xl uppercase pointer-events-none tracking-widest hidden sm:block">Win Now</div>
          <div className="absolute bottom-12 right-8 text-blue-500/20 font-black text-3xl md:text-5xl uppercase pointer-events-none tracking-widest hidden sm:block">Rebuilding</div>
          <div className="absolute bottom-12 left-8 text-red-500/20 font-black text-3xl md:text-5xl uppercase pointer-events-none tracking-widest hidden sm:flex items-center gap-2">
            <Flame size={48} /> Purgatory
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Avg Age" 
                domain={[22, 30]} 
                stroke="#475569" 
                tick={{fill: '#64748b', fontSize: 12}} 
                tickLine={false}
                axisLine={{stroke: '#334155'}}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Points" 
                domain={[800, 1800]} 
                stroke="#475569" 
                tick={{fill: '#64748b', fontSize: 12}} 
                tickLine={false}
                axisLine={{stroke: '#334155'}}
              />
              <RechartsTooltip cursor={{strokeDasharray: '3 3'}} content={<CustomTooltip />} />
              <ReferenceLine x={26.5} stroke="#334155" strokeDasharray="5 5" strokeWidth={2} />
              <ReferenceLine y={1250} stroke="#334155" strokeDasharray="5 5" strokeWidth={2} />
              <Scatter name="Teams" data={matrixData}>
                {matrixData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.y > 1250 && entry.x < 26.5 ? '#22c55e' : // Juggernaut
                      entry.y > 1250 && entry.x >= 26.5 ? '#eab308' : // Win Now
                      entry.y <= 1250 && entry.x < 26.5 ? '#3b82f6' : // Rebuilding
                      '#ef4444' // Purgatory
                    } 
                    className="drop-shadow-lg transition-all duration-300 hover:opacity-80 cursor-pointer"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // --- AUTOPSY TAB ---
  const AutopsyTab = () => {
    if (!autopsyData) {
      return (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-12 text-center shadow-xl">
          <ArrowRightLeft className="text-purple-500 mx-auto mb-4" size={48} />
          <h3 className="text-2xl font-black text-white italic mb-2">NO TRADES DETECTED</h3>
          <p className="text-slate-400">There are no completed trades in this league yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ArrowRightLeft className="text-purple-500" size={32} />
                <h3 className="text-3xl font-black text-white italic tracking-tight">TRADE AUTOPSY</h3>
              </div>
              <p className="text-slate-400 text-sm">Analyzing the most recent transaction based on actual points scored since execution.</p>
            </div>
            <div className="px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2">
              <Activity size={14} className="text-cyan-500" /> LIVE DATA SYNC
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_20px_rgba(168,85,247,0.8)]"></div>
            
            <div className="text-center mb-10 mt-4">
              <p className="text-slate-500 font-mono text-xs tracking-widest uppercase mb-3">Executed: {autopsyData.date}</p>
              <div className="inline-flex items-center gap-2 bg-purple-950/40 text-purple-400 px-6 py-2 rounded-full text-sm font-black tracking-widest border border-purple-900/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <ShieldAlert size={16} /> FLEECE ALERT
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-stretch gap-6 relative">
              <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-slate-800 -translate-y-1/2 z-0"></div>

              {/* Team A */}
              <div className="w-full md:w-[45%] bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-xl border border-green-900/30 shadow-[0_0_20px_rgba(34,197,94,0.05)] relative z-10">
                <div className="text-center mb-6">
                  <h4 className="text-white font-bold text-lg">{autopsyData.teamA}</h4>
                  <p className="text-green-500/80 text-xs font-mono uppercase mt-1">Received</p>
                </div>
                <div className="space-y-3">
                  {(autopsyData.assetsA || []).map((asset: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800/50 hover:border-green-900/50 transition-colors">
                      <span className="text-slate-200 font-medium">{asset.name}</span>
                      <span className="text-green-400 font-mono font-bold">+{asset.pointsSince} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* VS */}
              <div className="flex-shrink-0 flex items-center justify-center relative z-10 py-4 md:py-0">
                <div className="w-12 h-12 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center shadow-lg">
                  <span className="text-slate-600 font-black italic">VS</span>
                </div>
              </div>

              {/* Team B */}
              <div className="w-full md:w-[45%] bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-xl border border-red-900/30 shadow-[0_0_20px_rgba(248,113,113,0.05)] relative z-10">
                <div className="text-center mb-6">
                  <h4 className="text-white font-bold text-lg">{autopsyData.teamB}</h4>
                  <p className="text-red-500/80 text-xs font-mono uppercase mt-1">Received</p>
                </div>
                <div className="space-y-3">
                  {(autopsyData.assetsB || []).map((asset: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800/50 hover:border-red-900/50 transition-colors">
                      <span className="text-slate-200 font-medium">{asset.name}</span>
                      <span className="text-red-400 font-mono font-bold">+{asset.pointsSince} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 text-center bg-slate-900/50 py-6 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2">Net Point Differential</p>
              <p className="text-5xl font-black text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)] tracking-tighter">
                {autopsyData.netDifference}
              </p>
              <p className="text-slate-400 text-sm mt-4 italic max-w-lg mx-auto">
                "{autopsyData.winner_name} didn't just win a trade, they funded a dynasty. This asset mismanagement should be reviewed by the commissioner."
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TICKER_MESSAGES = [
    "🚨 INJURY ALERT: Monitor player statuses before kickoff.",
    "💸 CASH CHASE: The Bounty Board leader extends their lead.",
    "📉 PURGATORY WARNING: If you are in the red quadrant, it is time to blow it up.",
    "🔥 HOT TAKE: Draft capital is overrated. Win now.",
    "👀 SCENE: Is your league active or dead? Send a trade offer today."
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Tab Navigation Area */}
      <div className="bg-slate-950 border-b border-slate-800/80 sticky top-0 z-40 shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {[
            { id: 'studio', label: 'The Studio', icon: <MessageSquareWarning size={16} /> },
            { id: 'matrix', label: 'Power Matrix', icon: <Crosshair size={16} /> },
            { id: 'autopsy', label: 'Trade Autopsy', icon: <ArrowRightLeft size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)] border border-cyan-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-8 pb-24">
        {activeTab === 'studio' && <StudioTab />}
        {activeTab === 'matrix' && <MatrixTab />}
        {activeTab === 'autopsy' && <AutopsyTab />}
      </div>

      {/* Persistent Ticker */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-cyan-900/50 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-stretch h-10">
          <div className="bg-cyan-600 text-white font-black italic px-4 flex items-center justify-center gap-2 z-20 shadow-[5px_0_15px_rgba(0,0,0,0.8)] min-w-[120px]">
            <AlertTriangle size={16} /> BREAKING
          </div>
          <div className="flex-1 overflow-hidden relative flex items-center bg-slate-900/50">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950/90 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950/90 to-transparent z-10"></div>
            
            <div className="animate-[marquee_30s_linear_infinite] whitespace-nowrap inline-flex items-center">
              {[...TICKER_MESSAGES, ...TICKER_MESSAGES].map((msg, i) => (
                <span key={i} className="text-cyan-100 font-mono text-[13px] inline-flex items-center">
                  <span className="mx-6 text-cyan-700">|</span>
                  {msg}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

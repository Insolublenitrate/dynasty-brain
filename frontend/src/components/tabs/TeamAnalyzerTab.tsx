import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  ShieldAlert, Activity, Info, AlertTriangle, TrendingUp, Swords, Skull, Zap, Search
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';

export default function TeamAnalyzerTab() {
  const { leagueId } = useLeague();
  const [rosters, setRosters] = useState<any[]>([]);
  const [selectedRosterId, setSelectedRosterId] = useState<string>('');
  const [analyzerData, setAnalyzerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Colors for charts (Athletic Intel theme)
  const COLORS = ['#f97316', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'];

  useEffect(() => {
    if (!leagueId) return;

    // Fetch available rosters to populate the dropdown
    async function fetchRosters() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com';
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}`);
        if (res.ok) {
          const mData = await res.json();
          setRosters(mData);
          if (mData.length > 0) {
            setSelectedRosterId(mData[0].roster_id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to fetch rosters for analyzer:", err);
      }
    }
    fetchRosters();
  }, [leagueId]);

  useEffect(() => {
    if (!leagueId || !selectedRosterId) return;

    async function fetchAnalyzerData() {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com';
        const res = await fetch(`${apiUrl}/api/quant/team-analyzer/${leagueId}/${selectedRosterId}`);
        if (res.ok) {
          const data = await res.json();
          if (!data.error) {
            setAnalyzerData(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch team analyzer data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalyzerData();
  }, [leagueId, selectedRosterId]);

  if (isLoading && !analyzerData) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!analyzerData) return null;

  const {
    history, position_grades, asset_allocation, selected_analog, 
    rookie_metrics, weekly_metrics, matchups
  } = analyzerData;

  const posGradesOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Area with Dropdown */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Search className="text-orange-500" /> Team Analyzer
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Deep dive into your dynasty build, historical progression, and asset allocation.</p>
        </div>
        <select 
          className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[200px]"
          value={selectedRosterId}
          onChange={(e) => setSelectedRosterId(e.target.value)}
        >
          {rosters.map(r => (
            <option key={r.roster_id} value={r.roster_id}>{r.team_name}</option>
          ))}
        </select>
      </div>

      {/* NFL Analog Banner */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 relative shadow-lg flex items-center justify-between overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-orange-500/10 to-transparent"></div>
        <div className="relative z-10 w-full flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mb-1">System Analysis: NFL Analog</p>
            <h3 className="text-2xl font-black text-white mb-1">Your build resembles the <span className="text-orange-500">{selected_analog?.team}</span></h3>
            <p className="text-zinc-500 italic text-sm">"{selected_analog?.desc}"</p>
          </div>
          <div className="hidden sm:flex h-16 w-16 bg-zinc-950 rounded-full items-center justify-center border border-zinc-800 shrink-0 shadow-inner">
            <Info className="text-orange-500/50" size={32} />
          </div>
        </div>
      </div>

      {/* Positional Strength Grades */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {posGradesOrder.map(pos => (
          <div key={pos} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-md">
            <ShieldAlert className="text-orange-500/30 mb-2" size={24} />
            <p className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase mb-1">{pos} Strength</p>
            <p className="text-3xl font-black text-white">{position_grades[pos] || 'N/A'}</p>
          </div>
        ))}
      </div>

        {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Value Over Time */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 shadow-md">
          <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-orange-500" /> Team Value Over Time
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" stroke="#71717a" fontSize={12} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="power_index" name="Your Power" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} />
                <Line type="monotone" dataKey="league_avg" name="League Avg" stroke="#71717a" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col items-center justify-center">
          <h4 className="text-white font-bold text-lg w-full text-left mb-2">Asset Allocation</h4>
          <p className="text-zinc-500 text-xs w-full text-left mb-4">Ratio of active player value vs future picks.</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={asset_allocation}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {asset_allocation?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold w-full justify-center mt-2">
            {asset_allocation?.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-zinc-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Positional Breakdown Radar */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col items-center justify-center">
          <h4 className="text-white font-bold text-lg w-full text-left mb-2">Positional Breakdown</h4>
          <p className="text-zinc-500 text-xs w-full text-left mb-4">Relative strength across core positions.</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={posGradesOrder.map(pos => ({
                subject: pos, 
                A: position_grades[pos] === 'A+' ? 100 : position_grades[pos] === 'A' ? 95 : position_grades[pos] === 'A-' ? 90 :
                   position_grades[pos] === 'B+' ? 85 : position_grades[pos] === 'B' ? 80 : position_grades[pos] === 'B-' ? 75 :
                   position_grades[pos] === 'C+' ? 70 : position_grades[pos] === 'C' ? 65 : position_grades[pos] === 'D' ? 50 : 40,
                fullMark: 100
              }))}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Strength" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rookie Evaluation */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-2">
              <Activity size={16} className="text-orange-500" /> Rookie Evaluation
            </h4>
            <p className="text-zinc-500 text-[11px] mb-6 leading-relaxed">Evaluates the draft capital invested in youth and the overall outlook for your young core.</p>
            
            <div className="space-y-4">
              <div>
                <p className="text-zinc-400 text-xs mb-1">Rookie Capital Invested</p>
                <p className="text-2xl font-black text-white">{rookie_metrics?.rookie_capital_pct}%</p>
              </div>
              <div>
                <p className="text-zinc-400 text-xs mb-1">Top Prospect</p>
                <p className="text-lg font-bold text-orange-400 flex items-center gap-2">
                  {rookie_metrics?.top_rookie} 
                  {rookie_metrics?.top_rookie_position && <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded">{rookie_metrics?.top_rookie_position}</span>}
                </p>
                <p className="text-zinc-500 text-[10px] mt-1 italic">{rookie_metrics?.top_rookie_reason}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-800/50">
            <p className="text-zinc-400 text-xs mb-1">Youth Outlook</p>
            <p className="text-white font-bold">{rookie_metrics?.outlook}</p>
          </div>
        </div>

        {/* Weekly Performance */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 shadow-md">
          <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-orange-500" /> Weekly Performance
          </h4>
          <p className="text-zinc-500 text-[11px] mb-6 leading-relaxed">Analyzes your team's scoring consistency, floor, and ceiling across the season.</p>
          
          <div className="flex justify-between items-end border-b border-zinc-800/50 pb-4 mb-4">
            <div>
              <p className="text-zinc-400 text-xs mb-1">Avg Points</p>
              <p className="text-2xl font-black text-white">{weekly_metrics?.avg_points} <span className="text-xs text-zinc-500 font-normal ml-1">(Avg: {weekly_metrics?.league_avg_points})</span></p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-xs mb-1">Consistency</p>
              <p className="text-lg font-bold text-orange-400">{weekly_metrics?.consistency_score}/100</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Floor</span>
              <span className="text-amber-500 font-bold">{weekly_metrics?.floor} pts</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{width: `${Math.min(100, (weekly_metrics?.floor/150)*100)}%`}}></div>
            </div>
            
            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-zinc-400">Ceiling</span>
              <span className="text-orange-500 font-bold">{weekly_metrics?.ceiling} pts</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-orange-500 h-1.5 rounded-full" style={{width: `${Math.min(100, (weekly_metrics?.ceiling/200)*100)}%`}}></div>
            </div>
          </div>
        </div>

        {/* Matchups & Rivals */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 shadow-md">
          <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-2">
            <Swords size={16} className="text-orange-500" /> Matchups & Rivals
          </h4>
          <p className="text-zinc-500 text-[11px] mb-6 leading-relaxed">Deep matchup history derived from all previous seasons and actual head-to-head point differentials.</p>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Easiest Win</p>
              <p className="text-orange-400 font-bold text-sm truncate" title={matchups?.easiest_win || 'N/A'}>{matchups?.easiest_win || 'N/A'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Most Dominated</p>
              <p className="text-red-400 font-bold text-sm truncate" title={matchups?.most_dominated || 'N/A'}>{matchups?.most_dominated || 'N/A'}</p>
            </div>
            
            <div className="col-span-2 py-1 border-t border-b border-zinc-800/50 my-1">
              <p className="text-zinc-500 text-[10px] uppercase">Who's My Daddy?</p>
              <p className="text-white font-bold text-sm">{matchups?.whos_my_daddy || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Miracle Win</p>
              <p className="text-orange-400 text-xs truncate" title={matchups?.miracle_win || 'N/A'}>{matchups?.miracle_win || 'N/A'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Biggest Heartbreak</p>
              <p className="text-red-400 text-xs truncate" title={matchups?.biggest_heartbreak || 'N/A'}>{matchups?.biggest_heartbreak || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Longest Win Streak</p>
              <p className="text-orange-400 text-xs font-bold">{matchups?.longest_win_streak || 0} games</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Longest Loss Streak</p>
              <p className="text-red-400 text-xs font-bold">{matchups?.longest_loss_streak || 0} games</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

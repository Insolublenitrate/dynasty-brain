"use client";

import { useState, useEffect } from 'react';
import { useLeague } from '@/context/LeagueContext';
import { useRouter } from 'next/navigation';
import { Search, Info, TrendingUp, AlertTriangle, Shield, Star, Calendar, Zap, Handshake } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import LeagueHistory from '@/components/LeagueHistory';

const PIE_COLORS = ['#6366f1', '#ec4899']; // Indigo and Pink

export default function DynastyRoom() {
  const { leagueId, isLoading: isLeagueLoading } = useLeague();
  const router = useRouter();

  const [rosters, setRosters] = useState<any[]>([]);
  const [selectedRosterId, setSelectedRosterId] = useState<number | null>(null);
  
  const [teamData, setTeamData] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLeagueLoading) return;
    if (!leagueId) {
      router.push('/login');
      return;
    }

    async function fetchRosters() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${leagueId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setRosters(data);
          if (data.length > 0) {
            setSelectedRosterId(data[0].roster_id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchRosters();
  }, [leagueId, isLeagueLoading, router]);

  useEffect(() => {
    if (!leagueId || !selectedRosterId) return;

    async function fetchTeamData() {
      setLoadingTeam(true);
      setErrorMsg(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/quant/team-analyzer/${leagueId}/${selectedRosterId}`);
        const data = await res.json();
        if (data.error) {
          setErrorMsg(data.error);
        } else {
          setTeamData(data);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load team data.");
      } finally {
        setLoadingTeam(false);
      }
    }
    fetchTeamData();
  }, [leagueId, selectedRosterId]);

  if (isLeagueLoading) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
              <Search size={32} className="text-indigo-500" />
              Dynasty Room
            </h1>
            <p className="text-slate-400 mt-2">Deep dive into your dynasty build, historical progression, and asset allocation.</p>
          </div>
          
          <div className="w-full md:w-64">
            <select 
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
              value={selectedRosterId || ''}
              onChange={(e) => setSelectedRosterId(Number(e.target.value))}
            >
              {rosters.map(r => (
                <option key={r.roster_id} value={r.roster_id}>{r.team_name}</option>
              ))}
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-400">
            <AlertTriangle size={20} />
            <p>{errorMsg}</p>
          </div>
        )}

        {!loadingTeam && teamData ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* NFL Analog Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Info size={120} />
              </div>
              <h3 className="text-sm font-bold text-slate-500 tracking-wider uppercase mb-2">System Analysis: NFL Analog</h3>
              <p className="text-xl md:text-2xl font-bold text-white mb-2">
                Your build resembles the <span className="text-indigo-400">{teamData.analog.team}</span>
              </p>
              <p className="text-slate-400 italic">"{teamData.analog.desc}"</p>
            </div>

            {/* Position Grades Row */}
            {teamData.position_grades && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['QB', 'RB', 'WR', 'TE', 'FLEX'].map((pos) => {
                  const grade = teamData.position_grades[pos];
                  const isGood = grade.includes('A') || grade.includes('B');
                  return (
                    <div key={pos} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                      <Shield size={24} className={isGood ? "text-indigo-500 mb-2" : "text-pink-500 mb-2"} />
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{pos} Strength</span>
                      <span className="text-3xl font-black text-white mt-1">{grade}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grid for New Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Rookie Metrics */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-500 tracking-wider uppercase flex items-center gap-2">
                    <Star size={16} /> Rookie Evaluation
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Evaluates the draft capital invested in youth and the overall outlook for your young core.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400">Rookie Capital Invested</p>
                    <p className="text-xl font-bold text-white">{teamData.rookie_metrics?.rookie_capital_pct}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Top Prospect</p>
                    <p className="text-lg font-bold text-indigo-400">
                      {teamData.rookie_metrics?.top_rookie} 
                      {teamData.rookie_metrics?.top_rookie_position && teamData.rookie_metrics.top_rookie !== "None" && (
                        <span className="text-xs font-normal text-slate-500 ml-2 px-1.5 py-0.5 bg-slate-800 rounded">
                          {teamData.rookie_metrics.top_rookie_position}
                        </span>
                      )}
                    </p>
                    {teamData.rookie_metrics?.top_rookie_reason && teamData.rookie_metrics.top_rookie !== "None" && (
                      <p className="text-xs text-slate-500 mt-0.5 italic">{teamData.rookie_metrics.top_rookie_reason}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Youth Outlook</p>
                    <p className="text-md font-medium text-slate-200">{teamData.rookie_metrics?.outlook}</p>
                  </div>
                </div>
              </div>

              {/* Weekly Performance */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-500 tracking-wider uppercase flex items-center gap-2">
                    <Calendar size={16} /> Weekly Performance
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Analyzes your team's scoring consistency, floor, and ceiling across the season.</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Avg Points</p>
                      <p className="text-xl font-bold text-white flex items-end gap-2">
                        {teamData.weekly_metrics?.avg_points}
                        {teamData.weekly_metrics?.league_avg_points !== undefined && (
                          <span className="text-xs font-normal text-slate-500 mb-1">
                            (Avg: {teamData.weekly_metrics.league_avg_points})
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Consistency</p>
                      <p className="text-xl font-bold text-indigo-400">{teamData.weekly_metrics?.consistency_score}/100</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400">Floor</span>
                      <span className="text-xs font-bold text-pink-400">{teamData.weekly_metrics?.floor} pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Ceiling</span>
                      <span className="text-xs font-bold text-indigo-400">{teamData.weekly_metrics?.ceiling} pts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Matchup Metrics */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-500 tracking-wider uppercase flex items-center gap-2">
                    <Handshake size={16} /> Matchups & Rivals
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Deep matchup history derived from all previous seasons and actual head-to-head point differentials.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400">Easiest Win</p>
                    <p className="text-md font-bold text-indigo-400">{teamData.fun_metrics?.easiest_win}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Most Dominated</p>
                    <p className="text-md font-bold text-pink-500">{teamData.fun_metrics?.most_dominated}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Who's My Daddy?</p>
                    <p className="text-md font-bold text-slate-200">{teamData.fun_metrics?.whos_my_daddy}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Miracle Win</p>
                      <p className="text-sm font-bold text-indigo-400">{teamData.fun_metrics?.miracle_win}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Biggest Heartbreak</p>
                      <p className="text-sm font-bold text-pink-500">{teamData.fun_metrics?.biggest_heartbreak}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Ugly Duckling Win</p>
                      <p className="text-sm font-bold text-indigo-400">{teamData.fun_metrics?.ugly_duckling_win}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Highest Scoring Loss</p>
                      <p className="text-sm font-bold text-pink-500">{teamData.fun_metrics?.highest_scoring_loss}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Longest Win Streak</p>
                      <p className="text-md font-bold text-indigo-400">{teamData.fun_metrics?.longest_win_streak} games</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Longest Loss Streak</p>
                      <p className="text-md font-bold text-pink-500">{teamData.fun_metrics?.longest_loss_streak} games</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Hottest Run (Best 4-Week Stretch)</p>
                    <p className="text-md font-medium text-slate-200">{teamData.fun_metrics?.hottest_run} pts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Progression / Regression Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-pink-500" />
                    Historical Progression
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Tracks your overall roster power index over the last three seasons to visualize team trajectory.</p>
                </div>
                <div className="h-56 md:h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={teamData.progression} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="year" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} domain={['dataMin - 100', 'dataMax + 100']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="power_index" 
                        name="Power Index" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#0f172a' }}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="league_avg" 
                        name="League Avg" 
                        stroke="#94a3b8" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: '#94a3b8', strokeWidth: 2, stroke: '#0f172a' }}
                        activeDot={{ r: 6 }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Asset Allocation Pie Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">Asset Allocation</h3>
                  <p className="text-xs text-slate-400 mt-1">Breaks down your roster value between current players (win-now) and future draft capital (rebuild).</p>
                </div>
                <div className="h-56 md:h-64 flex items-center justify-center mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={teamData.asset_allocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {teamData.asset_allocation.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any) => [`${value}%`, 'Allocation']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Positional Radar */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap size={20} className="text-indigo-400" />
                    Positional Strength vs League Avg
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Compares your positional output against the league average to identify strengths and weaknesses.</p>
                </div>
                <div className="h-64 md:h-80 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="95%" data={teamData.positional_radar}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="position" tick={{ fill: '#94a3b8', fontSize: 14 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                      <Radar name="Your Team" dataKey="team_score" stroke="#ec4899" fill="#ec4899" fillOpacity={0.4} />
                      <Radar name="League Avg" dataKey="league_avg" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                        formatter={(value: any) => Math.round(value)}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* League History */}
            <LeagueHistory />
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}

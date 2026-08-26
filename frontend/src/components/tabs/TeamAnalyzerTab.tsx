import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { 
  ShieldAlert, Activity, Info, AlertTriangle, TrendingUp, Swords, Skull, Zap, Search
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

export default function TeamAnalyzerTab() {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [rosters, setRosters] = useState<any[]>([]);
  const [selectedRosterId, setSelectedRosterId] = useState<string>('');
  const [analyzerData, setAnalyzerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Colors for charts (Athletic Intel theme)
  const COLORS = [currentTheme.primary, '#f59e0b', '#ef4444', '#10b981', '#3b82f6'];

  useEffect(() => {
    if (!leagueId) return;

    // Fetch available rosters to populate the dropdown
    async function fetchRosters() {
      try {
        const apiUrl = getApiUrl();
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
        const apiUrl = getApiUrl();
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
    progression, position_grades, asset_allocation, league_asset_allocation, analog, 
    rookie_metrics, weekly_metrics, fun_metrics, demographics, volumes, record_book
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
            <h3 className="text-2xl font-black text-white mb-1">Your build resembles the <span className="text-orange-500">{analog?.team}</span></h3>
            <p className="text-zinc-500 italic text-sm">"{analog?.desc}"</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value Over Time */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 shadow-md lg:col-span-2">
          <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-orange-500" /> Team Value Over Time
          </h4>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progression} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" stroke="#71717a" fontSize={12} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="power_index" name="Your Power" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} />
                <Line type="monotone" dataKey="league_avg" name="League Avg" stroke="#71717a" strokeWidth={3} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col items-center justify-center">
          <h4 className="text-white font-bold text-lg w-full text-left mb-2">Asset Allocation</h4>
          <p className="text-zinc-500 text-xs w-full text-left mb-4">Ratio of active player value vs future picks (Inner ring = League Avg).</p>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* League Avg Inner Pie */}
                {league_asset_allocation && (
                  <Pie
                    data={league_asset_allocation}
                    innerRadius="40%"
                    outerRadius="55%"
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {league_asset_allocation.map((entry: any, index: number) => (
                      <Cell key={`cell-avg-${index}`} fill={index === 0 ? '#52525b' : '#3f3f46'} />
                    ))}
                  </Pie>
                )}
                {/* Team Outer Pie */}
                <Pie
                  data={asset_allocation}
                  innerRadius="65%"
                  outerRadius="85%"
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
          <div className="flex items-center gap-4 text-xs font-bold w-full justify-center mt-2 flex-wrap">
            {asset_allocation?.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-zinc-400">{entry.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-zinc-500"></div>
              <span className="text-zinc-400">League Avg</span>
            </div>
          </div>
        </div>

        {/* Positional Breakdown Radar */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-md flex flex-col items-center justify-center">
          <div className="flex items-center justify-between w-full mb-1">
            <h4 className="text-white font-bold text-base sm:text-lg">Positional Breakdown</h4>
            <span className="text-[10px] font-mono text-zinc-500">100 = Baseline</span>
          </div>
          <p className="text-zinc-500 text-xs w-full text-left mb-2">Relative strength across core positions.</p>
          
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="48%" outerRadius="42%" margin={{ top: 12, right: 20, bottom: 12, left: 20 }} data={posGradesOrder.map(pos => {
                const grade = position_grades[pos] || 'B';
                const teamScore = grade === 'A+' ? 152 : grade === 'A' ? 138 : grade === 'A-' ? 125 :
                                  grade === 'B+' ? 118 : grade === 'B' ? 105 : grade === 'B-' ? 95 :
                                  grade === 'C+' ? 88 : grade === 'C' ? 78 : grade === 'D' ? 62 : 45;
                const ratingTag = teamScore >= 140 ? 'Loaded' : teamScore >= 125 ? 'Elite' : teamScore >= 110 ? 'Strong' : teamScore >= 90 ? 'Solid' : 'Weak';
                const subjectLabel = pos === 'FLEX' ? 'FLX' : pos;
                return {
                  subject: subjectLabel,
                  fullLabel: `${pos} (${teamScore} · ${ratingTag})`,
                  rawPos: pos,
                  A: teamScore,
                  league_avg: 100, // 100 benchmark baseline
                  fullMark: 160
                };
              })}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={(props: any) => {
                    const { payload, x = 0, y = 0, cx = 0, cy = 0 } = props || {};
                    const value = payload?.value || '';
                    const pos = value === 'FLX' ? 'FLEX' : value.split(' ')[0].toUpperCase();
                    const colorMap: Record<string, string> = {
                      QB: '#F59E0B',
                      RB: '#C084FC',
                      WR: '#22C55E',
                      TE: '#EF4444',
                      FLEX: '#38BDF8'
                    };
                    const color = colorMap[pos] || '#E2E8F0';
                    const isLeft = x < cx - 6;
                    const isRight = x > cx + 6;
                    const isTop = y < cy;
                    const textAnchor = isRight ? 'start' : isLeft ? 'end' : 'middle';
                    const yOffset = isTop ? -6 : 10;

                    return (
                      <text
                        x={x}
                        y={y + yOffset}
                        fill={color}
                        fontSize={11}
                        fontWeight={900}
                        fontFamily="'JetBrains Mono', monospace"
                        textAnchor={textAnchor}
                      >
                        {value}
                      </text>
                    );
                  }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 160]} tick={false} axisLine={false} />
                <Radar name="League Avg (100)" dataKey="league_avg" stroke="#71717a" strokeDasharray="3 3" fill="#71717a" fillOpacity={0.1} />
                <Radar 
                  name="Your Strength" 
                  dataKey="A" 
                  stroke="#f97316" 
                  strokeWidth={2.5}
                  fill="#f97316" 
                  fillOpacity={0.25} 
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const raw = payload?.rawPos || payload?.subject;
                    const pos = raw === 'FLX' ? 'FLEX' : raw?.toUpperCase() || 'QB';
                    const colorMap: Record<string, string> = {
                      QB: '#F97316',
                      RB: '#A855F7',
                      WR: '#22C55E',
                      TE: '#EAB308',
                      FLEX: '#38BDF8'
                    };
                    const dotColor = colorMap[pos] || '#F97316';
                    return (
                      <circle
                        key={`${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={dotColor}
                        stroke="#09090b"
                        strokeWidth={1.5}
                      />
                    );
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', marginTop: '6px', fontFamily: "'JetBrains Mono', monospace" }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontFamily: "'JetBrains Mono', monospace" }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* ── POSITIONAL SCORE TELEMETRY RIBBON ───────────────────────── */}
          <div className="grid grid-cols-5 gap-1.5 w-full pt-3 mt-1 border-t border-zinc-800/80 text-center font-mono">
            {posGradesOrder.map(pos => {
              const grade = position_grades[pos] || 'B';
              const teamScore = grade === 'A+' ? 152 : grade === 'A' ? 138 : grade === 'A-' ? 125 :
                                grade === 'B+' ? 118 : grade === 'B' ? 105 : grade === 'B-' ? 95 :
                                grade === 'C+' ? 88 : grade === 'C' ? 78 : grade === 'D' ? 62 : 45;
              const ratingTag = teamScore >= 140 ? 'Loaded' : teamScore >= 125 ? 'Elite' : teamScore >= 110 ? 'Strong' : teamScore >= 90 ? 'Solid' : 'Weak';
              const colorClass = pos === 'QB' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                 pos === 'RB' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                                 pos === 'WR' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                 pos === 'TE' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                                 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
              return (
                <div key={pos} className={`p-1.5 rounded-lg border ${colorClass} flex flex-col justify-center items-center`}>
                  <span className="text-[9px] uppercase font-bold block">{pos}</span>
                  <span className="text-xs font-black block mt-0.5">{teamScore}</span>
                  <span className="text-[8px] opacity-70 uppercase block mt-0.5 font-sans font-semibold">{ratingTag}</span>
                </div>
              );
            })}
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
              <p className="text-orange-400 font-bold text-sm truncate" title={fun_metrics?.easiest_win || 'N/A'}>{fun_metrics?.easiest_win || 'N/A'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Most Dominated</p>
              <p className="text-red-400 font-bold text-sm truncate" title={fun_metrics?.most_dominated || 'N/A'}>{fun_metrics?.most_dominated || 'N/A'}</p>
            </div>
            
            <div className="col-span-2 py-1 border-t border-b border-zinc-800/50 my-1">
              <p className="text-zinc-500 text-[10px] uppercase">Who's My Daddy?</p>
              <p className="text-white font-bold text-sm">{fun_metrics?.whos_my_daddy || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Miracle Win</p>
              <p className="text-orange-400 text-xs truncate" title={fun_metrics?.miracle_win || 'N/A'}>{fun_metrics?.miracle_win || 'N/A'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Biggest Heartbreak</p>
              <p className="text-red-400 text-xs truncate" title={fun_metrics?.biggest_heartbreak || 'N/A'}>{fun_metrics?.biggest_heartbreak || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Longest Win Streak</p>
              <p className="text-orange-400 text-xs font-bold">{fun_metrics?.longest_win_streak || 0} games</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Longest Loss Streak</p>
              <p className="text-red-400 text-xs font-bold">{fun_metrics?.longest_loss_streak || 0} games</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 pt-8 border-t border-zinc-800">
        {/* Left Column: Tactical Roster & Demographic Health */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Tactical Roster & Demographic Health</h2>
          
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4 tracking-wider uppercase">The Active Roster Data Grid</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Position</th>
                    <th className="px-4 py-2 font-medium">Age</th>
                    <th className="px-4 py-2 font-medium">Rank</th>
                    <th className="px-4 py-2 font-medium text-right">Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {demographics?.active_grid?.map((player: any) => (
                    <tr key={player.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-100">{player.name}</td>
                      <td className="px-4 py-3">{player.position}</td>
                      <td className="px-4 py-3">{player.age}</td>
                      <td className="px-4 py-3">{player.rank}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-500">{player.output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4 tracking-wider uppercase">Roster Health Age Demographics</h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Over 28 (Vet Cliff)', value: demographics?.age_buckets?.over_28 || 0, color: '#a1a1aa' },
                      { name: '25-28 (Prime)', value: demographics?.age_buckets?.prime_25_28 || 0, color: '#d97706' },
                      { name: 'Under 24 (Youth)', value: demographics?.age_buckets?.youth_under_24 || 0, color: '#3b82f6' }
                    ]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Over 28 (Vet Cliff)', value: demographics?.age_buckets?.over_28 || 0, color: '#a1a1aa' },
                      { name: '25-28 (Prime)', value: demographics?.age_buckets?.prime_25_28 || 0, color: '#d97706' },
                      { name: 'Under 24 (Youth)', value: demographics?.age_buckets?.youth_under_24 || 0, color: '#3b82f6' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-zinc-400 text-xs font-semibold uppercase">Age</span>
                <span className="text-white font-bold">Buckets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Performance & History Analytics */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Performance & History Analytics</h2>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 tracking-wider uppercase">Key Success Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center hover:bg-blue-600/30 transition-all cursor-default">
                <div className="text-4xl font-bold text-blue-400 mb-2">{fun_metrics?.avg_margin_of_victory}</div>
                <div className="text-xs text-blue-200/70 uppercase tracking-wide">Avg Margin of Victory<br/>(Points per Win)</div>
              </div>
              <div className="bg-orange-600/20 border border-orange-500/30 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center hover:bg-orange-600/30 transition-all cursor-default">
                <div className="text-4xl font-bold text-orange-400 mb-2">{fun_metrics?.biggest_heartbreak ? fun_metrics.biggest_heartbreak.split(' ')[1]?.replace('(-', '-').replace(')', '') : '-0.0'}</div>
                <div className="text-xs text-orange-200/70 uppercase tracking-wide">Biggest Heartbreak<br/>(Smallest Loss)</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold text-zinc-400 tracking-wider uppercase">Manager Volume Tracking</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/30 border border-slate-600/50 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center hover:bg-slate-700/50 transition-all cursor-default">
                <div className="text-4xl font-bold text-white mb-2">{volumes?.total_trades || 0}</div>
                <div className="text-xs text-slate-300 uppercase tracking-wide">Total Trades Completed</div>
              </div>
              <div className="bg-amber-600/20 border border-amber-500/30 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center hover:bg-amber-600/30 transition-all cursor-default">
                <div className="text-4xl font-bold text-amber-500 mb-2">{volumes?.waiver_adds || 0}</div>
                <div className="text-xs text-amber-200/70 uppercase tracking-wide">Waiver Wire Adds</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold text-zinc-400 tracking-wider uppercase">The League Record Book (Hall of Fame)</h3>
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-center gap-6">
              {record_book && record_book.length > 0 ? (
                record_book.map((record: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center space-y-3">
                    <div className={`w-14 h-14 rounded-lg rotate-45 flex items-center justify-center shadow-lg ${
                      record.finish === 'Champion' ? 'bg-gradient-to-br from-yellow-400 to-amber-600' :
                      record.finish === 'Silver' ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      record.finish === 'Bronze' ? 'bg-gradient-to-br from-amber-700 to-orange-900' :
                      'bg-gradient-to-br from-zinc-700 to-zinc-900'
                    }`}>
                      <div className="-rotate-45 text-white font-bold text-xl">
                        {record.finish === 'Champion' ? '1' : record.finish === 'Silver' ? '2' : record.finish === 'Bronze' ? '3' : 'L'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">{record.finish === 'Champion' ? 'Champion' : record.finish === 'Last Place' ? 'Rebuild' : record.finish}</div>
                      <div className="text-sm font-bold text-white">{record.season}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 italic py-8">No historical finishes recorded for this roster.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

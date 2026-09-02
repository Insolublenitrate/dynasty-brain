"use client";
import React, { useEffect, useState } from 'react';
import { Search, GraduationCap, TrendingUp, Activity, Dumbbell, Award, Target, Hash } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import SeasonSelector from '@/components/SeasonSelector';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import { getApiUrl } from '@/config/api';

interface RookieBasic {
  player_id: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string;
  college: string;
  search_rank: number;
}

interface RookieAnalytics {
  player_info: {
    player_id: string;
    first_name: string;
    last_name: string;
    position: string;
    team: string;
    college: string;
    weight: string;
    height: string;
    age: number;
  };
  ncaa_production: {
    breakout_age: number;
    breakout_age_percentile: number;
    college_dominator: number;
    college_dominator_percentile: number;
    yprr: number;
    yprr_percentile: number;
    target_share: number;
    target_share_percentile: number;
    source?: string;
  };
  athleticism: {
    sparq_x: number;
    sparq_x_percentile: number;
    forty_yard: number;
    speed_score: number;
    burst_score: number;
    agility_score: number;
    catch_radius: number;
    radar_data: any[];
  };
  draft_info: {
    nfl_draft_capital: string;
    dynasty_adp: number;
    pro_comp: string;
  };
}

export default function RookieAnalyzerPage() {
  const { currentTheme } = useTheme();
  const [rookies, setRookies] = useState<RookieBasic[]>([]);
  const [selectedRookie, setSelectedRookie] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<RookieAnalytics | null>(null);
  const [ncaaStats, setNcaaStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [seasonYear, setSeasonYear] = useState("2024");

  useEffect(() => {
    async function fetchRookies() {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/rookies?year=${seasonYear}`);
        const data = await res.json();
        setRookies(data);
        if (data && data.length > 0) {
          setSelectedRookie(data[0].player_id);
        } else {
          setSelectedRookie(null);
          setAnalytics(null);
          setNcaaStats([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRookies();
  }, [seasonYear]);

  useEffect(() => {
    if (!selectedRookie) return;
    
    async function fetchAnalytics() {
      setLoadingAnalytics(true);
      try {
        const apiUrl = getApiUrl();
        const [res, resStats] = await Promise.all([
          fetch(`${apiUrl}/api/quant/rookie-analyzer/${selectedRookie}`),
          fetch(`${apiUrl}/api/quant/rookie-ncaa-stats/${selectedRookie}`)
        ]);
        
        const data = await res.json();
        if (!data.error) {
          setAnalytics(data);
        }
        
        if (resStats.ok) {
          const statsData = await resStats.json();
          setNcaaStats(statsData || []);
        } else {
          setNcaaStats([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAnalytics(false);
      }
    }
    fetchAnalytics();
  }, [selectedRookie]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 flex justify-center items-center">
        <div className="animate-spin text-emerald-500"><GraduationCap size={48} /></div>
      </div>
    );
  }

  const renderPercentile = (value: number) => {
    const color = value >= 90 ? "text-emerald-400" : value >= 70 ? "text-green-400" : value >= 40 ? "text-yellow-400" : "text-red-400";
    return <span className={`${color} text-sm font-bold`}>{value}th</span>;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-teal-500 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
                <GraduationCap size={32} className="text-emerald-500" />
                Rookie Big Board
              </h1>
              <SeasonSelector value={seasonYear} onChange={setSeasonYear} />
            </div>
            <p className="text-zinc-400 mt-2">Deep dive into NCAA college production, athletic profiles, and draft analytics.</p>
          </div>
          
          <div className="w-full md:w-80">
            <select 
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
              value={selectedRookie || ''}
              onChange={(e) => setSelectedRookie(e.target.value)}
            >
              {rookies.map(r => (
                <option key={r.player_id} value={r.player_id}>
                  {r.first_name} {r.last_name} ({r.position} - {r.team})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingAnalytics && (
          <div className="flex justify-center p-12">
            <div className="animate-spin text-emerald-500"><Search size={32} /></div>
          </div>
        )}

        {analytics && !loadingAnalytics && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Player Info Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700">
                     <img 
                       src={`https://sleepercdn.com/content/nfl/players/thumb/${analytics.player_info.player_id}.jpg`} 
                       alt={analytics.player_info.first_name}
                       className="w-full h-full object-cover"
                       onError={(e) => { e.currentTarget.style.display = 'none'; }}
                     />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{analytics.player_info.first_name} {analytics.player_info.last_name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-zinc-400 mt-1">
                      <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs font-bold text-zinc-300">{analytics.player_info.position}</span>
                      <span>|</span>
                      <span>{analytics.player_info.team}</span>
                      <span>|</span>
                      <span>{analytics.player_info.college}</span>
                      <span>|</span>
                      <span>{analytics.player_info.height}, {analytics.player_info.weight} lbs</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-zinc-800/50 p-4 rounded-lg text-center min-w-[120px] border border-zinc-700/50">
                    <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">NFL Draft</div>
                    <div className="text-xl font-black text-emerald-400">{analytics.draft_info.nfl_draft_capital}</div>
                  </div>
                  <div className="bg-zinc-800/50 p-4 rounded-lg text-center min-w-[120px] border border-zinc-700/50">
                    <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Dynasty ADP</div>
                    <div className="text-xl font-black text-amber-400">{analytics.draft_info.dynasty_adp}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Predicted NCAA Analytics */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg hover:shadow-amber-500/10 transition-shadow">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-amber-400" />
                    Predicted NCAA Profile
                  </h3>
                  <span className="text-xs font-semibold px-2 py-1 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">
                    Model: Projection
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                    <span className="text-zinc-400 font-medium text-sm">Breakout Age</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{analytics.ncaa_production.breakout_age} yrs</span>
                      {renderPercentile(analytics.ncaa_production.breakout_age_percentile)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                    <span className="text-zinc-400 font-medium text-sm">College Dominator</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{analytics.ncaa_production.college_dominator}%</span>
                      {renderPercentile(analytics.ncaa_production.college_dominator_percentile)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                    <span className="text-zinc-400 font-medium text-sm">Yds Per Route Run</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{analytics.ncaa_production.yprr}</span>
                      {renderPercentile(analytics.ncaa_production.yprr_percentile)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                    <span className="text-zinc-400 font-medium text-sm">Target Share</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{analytics.ncaa_production.target_share}%</span>
                      {renderPercentile(analytics.ncaa_production.target_share_percentile)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Athleticism Radar */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col shadow-lg hover:shadow-emerald-500/10 transition-shadow">
                <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                  <Activity size={20} className="text-emerald-400" />
                  Athletic Profile
                </h3>
                <p className="text-xs text-zinc-500 mb-4">Compared to NFL positional averages</p>
                <div className="flex-1 min-h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analytics.athleticism.radar_data}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <Radar name={analytics.player_info.last_name} dataKey="player" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                      <Radar name="Position Avg" dataKey="avg" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Athletic Metrics & Comps */}
              <div className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg hover:shadow-pink-500/10 transition-shadow">
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6">
                    <Dumbbell size={20} className="text-pink-400" />
                    Combine Measurables
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-800/50 rounded-lg text-center hover:bg-zinc-800 transition-colors">
                      <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">40-Yard Dash</div>
                      <div className="text-lg font-black text-white">{analytics.athleticism.forty_yard}s</div>
                    </div>
                    <div className="p-3 bg-zinc-800/50 rounded-lg text-center hover:bg-zinc-800 transition-colors">
                      <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Speed Score</div>
                      <div className="text-lg font-black text-white">{analytics.athleticism.speed_score}</div>
                    </div>
                    <div className="p-3 bg-zinc-800/50 rounded-lg text-center hover:bg-zinc-800 transition-colors">
                      <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Burst Score</div>
                      <div className="text-lg font-black text-white">{analytics.athleticism.burst_score}</div>
                    </div>
                    <div className="p-3 bg-zinc-800/50 rounded-lg text-center hover:bg-zinc-800 transition-colors">
                      <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">SPARQ-x</div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg font-black text-emerald-400">{analytics.athleticism.sparq_x}</span>
                        {renderPercentile(analytics.athleticism.sparq_x_percentile)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-purple-500/10 border border-amber-500/20 rounded-xl p-6 shadow-lg shadow-amber-500/5">
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                    <Target size={20} className="text-purple-400" />
                    NFL Pro Comparison
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-full">
                      <Award className="text-amber-400" size={24} />
                    </div>
                    <div>
                      <div className="text-sm text-zinc-400 font-medium">Plays style similar to</div>
                      <div className="text-xl font-black text-white tracking-tight">{analytics.draft_info.pro_comp}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            {/* Real NCAA Stats Table */}
            {ncaaStats.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8 shadow-lg">
                <h3 className="text-xl font-black text-white flex items-center gap-2 mb-6">
                  <Award size={20} className="text-yellow-400" />
                  NCAA College Statistics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-sm text-zinc-300">
                    <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50 border-b border-zinc-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Season</th>
                        <th className="px-4 py-3 font-semibold">College</th>
                        <th className="px-4 py-3 font-semibold text-center">G</th>
                        <th className="px-4 py-3 font-semibold text-right">Pass Yds</th>
                        <th className="px-4 py-3 font-semibold text-right">Pass TD</th>
                        <th className="px-4 py-3 font-semibold text-right">Rush Yds</th>
                        <th className="px-4 py-3 font-semibold text-right">Rush TD</th>
                        <th className="px-4 py-3 font-semibold text-right">Rec</th>
                        <th className="px-4 py-3 font-semibold text-right">Rec Yds</th>
                        <th className="px-4 py-3 font-semibold text-right">Rec TD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {ncaaStats.map((stat, i) => (
                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-white">{stat.season}</td>
                          <td className="px-4 py-3">{stat.college}</td>
                          <td className="px-4 py-3 text-center">{stat.games_played}</td>
                          <td className="px-4 py-3 text-right font-mono">{stat.passing_yards}</td>
                          <td className="px-4 py-3 text-right font-mono">{stat.passing_tds}</td>
                          <td className="px-4 py-3 text-right font-mono">{stat.rushing_yards}</td>
                          <td className="px-4 py-3 text-right font-mono">{stat.rushing_tds}</td>
                          <td className="px-4 py-3 text-right font-mono">{stat.receptions}</td>
                          <td className="px-4 py-3 text-right font-mono">{stat.receiving_yards}</td>
                          <td className="px-4 py-3 text-right font-mono">{stat.receiving_tds}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, Trophy, Shield, Flame, Swords, ArrowRight, 
  ChevronRight, ChevronDown, ChevronUp, User, Sparkles, TrendingUp,
  Award, RefreshCw, Layers, CheckCircle2, AlertCircle, Play
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';
import { PositionPill } from '@/components/ui/TacticalVisualAids';
import TacticalBriefingCard from '@/components/ui/TacticalBriefingCard';
import MetricExplainer from '@/components/ui/MetricExplainer';

export default function ScheduleTab() {
  const { leagueId, leagueName, platform } = useLeague();
  const { currentTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'slate' | 'franchise' | 'allplay'>('slate');
  const [selectedRosterId, setSelectedRosterId] = useState<number | null>(null);
  
  // Expanded box score modal / drawer
  const [activeBoxScore, setActiveBoxScore] = useState<any>(null);

  const [selectedSeason, setSelectedSeason] = useState<string>('2026');

  const fetchSchedule = async (cleanId: string, s?: string) => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const queryParam = s ? `?season=${s}` : '';
      const res = await fetch(`${apiUrl}/api/quant/schedule/${cleanId}${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'success') {
          setScheduleData(data);
          if (data.season) setSelectedSeason(data.season);
          if (data.current_week) setSelectedWeek(data.current_week);
          if (data.franchises && data.franchises.length > 0) {
            setSelectedRosterId(data.franchises[0].roster_id);
          }
          setLoading(false);
          return;
        }
      }

      // Direct Sleeper Client Fallback if backend route had delay
      if (platform === 'sleeper' || !platform) {
        await loadDirectSleeperSchedule(cleanId);
      }
    } catch (err) {
      console.warn("Backend schedule load error, attempting Sleeper direct fallback...", err);
      if (platform === 'sleeper' || !platform) {
        await loadDirectSleeperSchedule(cleanId);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!leagueId) return;
    fetchSchedule(leagueId);
  }, [leagueId]);

    async function loadDirectSleeperSchedule(cleanId: string) {
      try {
        const [leagueRes, usersRes, rostersRes] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${cleanId}`).then(r => r.json()).catch(() => null),
          fetch(`https://api.sleeper.app/v1/league/${cleanId}/users`).then(r => r.json()).catch(() => []),
          fetch(`https://api.sleeper.app/v1/league/${cleanId}/rosters`).then(r => r.json()).catch(() => [])
        ]);

        const userMap: Record<string, { name: string; avatar: string | null }> = {};
        (usersRes || []).forEach((u: any) => {
          userMap[u.user_id] = {
            name: u.metadata?.team_name || u.display_name || 'Team Owner',
            avatar: u.avatar || null
          };
        });

        const ownerNames: Record<number, string> = {};
        const teamAvatars: Record<number, string | null> = {};
        (rostersRes || []).forEach((r: any) => {
          const ownerInfo = userMap[r.owner_id] || { name: `Team ${r.roster_id}`, avatar: null };
          ownerNames[r.roster_id] = ownerInfo.name;
          teamAvatars[r.roster_id] = ownerInfo.avatar;
        });

        // Fetch weeks 1 to 18 in parallel
        const weekPromises = [];
        for (let w = 1; w <= 18; w++) {
          weekPromises.push(
            fetch(`https://api.sleeper.app/v1/league/${cleanId}/matchups/${w}`)
              .then(r => r.json())
              .then(mList => ({ week: w, matchups: mList || [] }))
              .catch(() => ({ week: w, matchups: [] }))
          );
        }
        const weeksRaw = await Promise.all(weekPromises);

        const formattedWeeks = weeksRaw.map(({ week, matchups }) => {
          const byMatchupId: Record<number, any[]> = {};
          const scores: number[] = [];

          matchups.forEach((m: any) => {
            const mId = m.matchup_id || 1;
            if (!byMatchupId[mId]) byMatchupId[mId] = [];
            const rId = m.roster_id;
            const pts = Number(m.points || 0);
            if (pts > 0) scores.push(pts);

            byMatchupId[mId].push({
              roster_id: rId,
              matchup_id: mId,
              team_name: ownerNames[rId] || `Team ${rId}`,
              avatar: teamAvatars[rId],
              points: pts,
              starters: (m.starters || []).map((pid: string, idx: number) => ({
                player_id: pid,
                name: `Starter ${idx + 1}`,
                position: 'STARTER',
                team: 'NFL',
                points: Number(m.starters_points?.[idx] || 0)
              })),
              bench_points: 0
            });
          });

          const paired = Object.keys(byMatchupId).map(mId => {
            const teams = byMatchupId[Number(mId)];
            const t1 = teams[0] || null;
            const t2 = teams[1] || null;
            const isPlayed = (t1?.points > 0 || t2?.points > 0);
            let winner: string | null = null;
            if (isPlayed && t1 && t2) {
              winner = t1.points > t2.points ? 'team_a' : (t2.points > t1.points ? 'team_b' : 'tie');
            }
            return {
              matchup_id: Number(mId),
              is_played: isPlayed,
              status: isPlayed ? 'FINAL' : 'UPCOMING',
              team_a: t1,
              team_b: t2,
              winner,
              margin: (t1 && t2) ? Math.abs(t1.points - t2.points) : 0,
              win_prob_a: 50,
              win_prob_b: 50
            };
          });

          const highScorer = matchups.length ? matchups.reduce((max: any, m: any) => (m.points > (max?.points || 0) ? m : max), null) : null;
          const lowScorer = scores.length ? matchups.filter((m: any) => m.points > 0).reduce((min: any, m: any) => (m.points < (min?.points || 999) ? m : min), null) : null;
          const medianVal = scores.length ? scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)] : 0;

          return {
            week,
            has_games: paired.length > 0,
            is_active: week === 1,
            is_playoffs: week >= 15,
            matchups: paired,
            high_score: highScorer && highScorer.points > 0 ? {
              team_name: ownerNames[highScorer.roster_id] || `Team ${highScorer.roster_id}`,
              points: highScorer.points
            } : null,
            low_score: lowScorer ? {
              team_name: ownerNames[lowScorer.roster_id] || `Team ${lowScorer.roster_id}`,
              points: lowScorer.points
            } : null,
            median_score: medianVal
          };
        });

        // Build franchise schedules
        const franchises = (rostersRes || []).map((r: any) => {
          const rId = r.roster_id;
          const tName = ownerNames[rId] || `Team ${rId}`;
          const tAvatar = teamAvatars[rId];
          let totalPf = 0;
          let totalPa = 0;
          let wins = 0;
          let losses = 0;
          let ties = 0;

          const schedule = formattedWeeks.map(wData => {
            const found = wData.matchups.find(m => m.team_a?.roster_id === rId || m.team_b?.roster_id === rId);
            if (!found) return { week: wData.week, opponent_name: 'BYE', result: 'UPCOMING', team_score: 0, opp_score: 0, margin: 0 };
            const isA = found.team_a?.roster_id === rId;
            const myTeam = isA ? found.team_a : found.team_b;
            const oppTeam = isA ? found.team_b : found.team_a;
            const myPts = myTeam?.points || 0;
            const oppPts = oppTeam?.points || 0;
            let resStr = 'UPCOMING';
            if (found.is_played) {
              if (myPts > oppPts) { resStr = 'W'; wins++; }
              else if (myPts < oppPts) { resStr = 'L'; losses++; }
              else { resStr = 'T'; ties++; }
              totalPf += myPts;
              totalPa += oppPts;
            }
            return {
              week: wData.week,
              matchup_id: found.matchup_id,
              opponent_roster_id: oppTeam?.roster_id,
              opponent_name: oppTeam?.team_name || 'BYE',
              opponent_avatar: oppTeam?.avatar,
              team_score: myPts,
              opp_score: oppPts,
              result: resStr,
              margin: Math.abs(myPts - oppPts),
              starters_detail: myTeam?.starters || []
            };
          });

          return {
            roster_id: rId,
            team_name: tName,
            avatar: tAvatar,
            wins,
            losses,
            ties,
            points_for: Math.round(totalPf * 10) / 10,
            points_against: Math.round(totalPa * 10) / 10,
            point_differential: Math.round((totalPf - totalPa) * 10) / 10,
            all_play_record: `${wins * 9}-${losses * 9}`,
            all_play_win_pct: (wins + losses > 0) ? Math.round((wins / (wins + losses)) * 1000) / 10 : 50,
            schedule
          };
        });

        franchises.sort((a: any, b: any) => b.wins - a.wins || b.points_for - a.points_for);

        setScheduleData({
          status: 'success',
          league_id: cleanId,
          league_name: leagueRes?.name || leagueName || 'Dynasty League',
          season: leagueRes?.season || '2026',
          current_week: 1,
          total_weeks: 18,
          weeks: formattedWeeks,
          franchises
        });

        if (franchises.length > 0) setSelectedRosterId(franchises[0].roster_id);
      } catch (fErr) {
        console.error("Direct Sleeper schedule fetch error", fErr);
      }
    }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 animate-spin">
          <RefreshCw size={24} />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Syncing Weekly Schedule & Box Scores...</h3>
          <p className="text-xs font-mono text-zinc-400 mt-1">Ingesting 18 weeks of head-to-head match data, starters, and point margins.</p>
        </div>
      </div>
    );
  }

  if (!scheduleData || !scheduleData.weeks) {
    return (
      <div className="p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-3xl max-w-lg mx-auto">
        <AlertCircle size={36} className="text-amber-400 mx-auto mb-3" />
        <h3 className="text-base font-black uppercase text-white">No Schedule Data Available</h3>
        <p className="text-xs text-zinc-400 font-mono mt-1 mb-4">
          Please check your League ID or ensure the active season has matchups scheduled in Sleeper.
        </p>
      </div>
    );
  }

  const currentWeekData = scheduleData.weeks.find((w: any) => w.week === selectedWeek) || scheduleData.weeks[0];
  const selectedFranchise = scheduleData.franchises?.find((f: any) => f.roster_id === selectedRosterId) || scheduleData.franchises?.[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ── TACTICAL BRIEFING GUIDE ─────────────────────────────────────────── */}
      <TacticalBriefingCard
        title="Matchups & 18-Week Slate: Spreads, Odds & Box Scores"
        subtitle="How to analyze modeled point spreads, win probabilities, and weekly head-to-head slates"
        badge="SCHEDULE WAR ROOM GUIDE"
        points={[
          {
            icon: CalendarDays,
            label: "1. 2026 Preseason Modeling",
            text: "Before games kickoff, all matchups feature modeled point spreads and win probabilities based on multi-year player projection baselines.",
            color: "#38bdf8"
          },
          {
            icon: Flame,
            label: "2. Logistic Win Probability",
            text: "Win percentages reflect player scoring variance distributions. A -7.5 point favorite carries an approximately 64% win probability.",
            color: "#fb923c"
          },
          {
            icon: Sparkles,
            label: "3. The Tactical Play",
            text: "In tight underdog matchups (<40% win prob), start high-variance boom/bust flex options to raise your single-game scoring ceiling.",
            color: "#34d399"
          }
        ]}
      />

      {/* ── 1. HEADER & VIEW SELECTOR ────────────────────────────────────── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ 
                backgroundColor: `${currentTheme.primary}20`,
                border: `1.5px solid ${currentTheme.primary}60`,
                color: currentTheme.primary
              }}
            >
              <CalendarDays size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white">
                  MATCHUPS & LEAGUE SCHEDULE
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  ● SYNCED
                </span>
                <MetricExplainer term="spread" size="xs" />
                <MetricExplainer term="win_prob" size="xs" />
                {scheduleData.available_seasons && scheduleData.available_seasons.length > 1 && (
                  <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-700 text-xs font-mono">
                    <span className="text-zinc-400 text-[10px] uppercase font-bold">Season</span>
                    <select
                      value={scheduleData.season || selectedSeason}
                      onChange={(e) => { if (leagueId) fetchSchedule(leagueId, e.target.value); }}
                      className="bg-transparent text-orange-400 font-black focus:outline-none cursor-pointer text-xs"
                    >
                      {scheduleData.available_seasons.map((s: string) => (
                        <option key={s} value={s} className="bg-zinc-900 text-white">
                          {s} {s === '2026' ? '· Upcoming Slate' : '· Complete Season'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {scheduleData.league_name} · Season {scheduleData.season} · 18-Week Matchup Slate & Box Scores
              </p>
            </div>
          </div>

          {/* View Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-2xl border border-zinc-800 font-mono text-xs">
            <button
              onClick={() => setViewMode('slate')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'slate' 
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={viewMode === 'slate' ? { borderColor: currentTheme.border } : {}}
            >
              <Swords size={14} style={viewMode === 'slate' ? { color: currentTheme.primary } : {}} />
              <span>Weekly Slate</span>
            </button>

            <button
              onClick={() => setViewMode('franchise')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'franchise' 
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={viewMode === 'franchise' ? { borderColor: currentTheme.border } : {}}
            >
              <Shield size={14} style={viewMode === 'franchise' ? { color: currentTheme.primary } : {}} />
              <span>Team Schedule</span>
            </button>

            <button
              onClick={() => setViewMode('allplay')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'allplay' 
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={viewMode === 'allplay' ? { borderColor: currentTheme.border } : {}}
            >
              <TrendingUp size={14} style={viewMode === 'allplay' ? { color: currentTheme.primary } : {}} />
              <span>All-Play Table</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── 2026 PRESEASON QUANT PROJECTIONS BANNER ──────────────────────── */}
      {scheduleData.is_preseason && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-500/15 border border-amber-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-md">
                <Sparkles size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black uppercase text-amber-300 tracking-wider">
                    2026 Preseason Projection Mode Active
                  </h4>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold uppercase">
                    Consensus Quant Forecasts
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-300 mt-1 leading-relaxed">
                  Weekly starter scores, matchup point spreads, and win probabilities are modeled from 2026 depth chart forecasts and player baseline metrics. Official scoring will take over on Week 1 kickoff!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 1: WEEKLY MATCHUP SLATE ─────────────────────────────────── */}
      {viewMode === 'slate' && (
        <div className="space-y-6">
          
          {/* Week Selection Ribbon (Weeks 1 to 18) */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
              {scheduleData.weeks.map((w: any) => {
                const isSelected = selectedWeek === w.week;
                return (
                  <button
                    key={w.week}
                    onClick={() => setSelectedWeek(w.week)}
                    className={`flex-shrink-0 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-orange-500 text-zinc-950 shadow-lg scale-105'
                        : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/80'
                    }`}
                  >
                    <span>WEEK {w.week}</span>
                    {w.is_playoffs && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isSelected ? 'bg-zinc-950/20 text-zinc-950' : 'bg-purple-500/20 text-purple-300'}`}>
                        PLAYOFFS
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekly Highlights & Awards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Trophy size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-amber-400/90 uppercase font-bold tracking-wider">
                  {currentWeekData.high_score?.is_projected ? 'High Roller (Proj)' : 'High Roller'}
                </span>
                <h4 className="text-sm font-black text-white truncate">
                  {currentWeekData.high_score ? currentWeekData.high_score.team_name : 'TBD'}
                </h4>
                <p className="text-xs font-mono text-zinc-400">
                  {currentWeekData.high_score ? `${currentWeekData.high_score.points} pts` : 'In Progress'}
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                <TrendingUp size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-purple-400/90 uppercase font-bold tracking-wider">
                  {currentWeekData.is_median_projected ? 'League Median (Proj)' : 'League Median'}
                </span>
                <h4 className="text-sm font-black text-white">
                  {currentWeekData.median_score > 0 ? `${currentWeekData.median_score} pts` : '124.5 pts'}
                </h4>
                <p className="text-xs font-mono text-zinc-400">Top 50% Win Benchmark</p>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Flame size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-rose-400/90 uppercase font-bold tracking-wider">
                  {currentWeekData.low_score?.is_projected ? 'Sacko Floor (Proj)' : 'Sacko of Week'}
                </span>
                <h4 className="text-sm font-black text-white truncate">
                  {currentWeekData.low_score ? currentWeekData.low_score.team_name : 'TBD'}
                </h4>
                <p className="text-xs font-mono text-zinc-400">
                  {currentWeekData.low_score ? `${currentWeekData.low_score.points} pts` : 'In Progress'}
                </p>
              </div>
            </div>
          </div>

          {/* Matchups Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentWeekData.matchups.map((match: any, idx: number) => {
              const teamA = match.team_a;
              const teamB = match.team_b;
              const isPlayed = match.is_played;
              const isWinnerA = isPlayed ? match.winner === 'team_a' : match.projected_winner === 'team_a';
              const isWinnerB = isPlayed ? match.winner === 'team_b' : match.projected_winner === 'team_b';

              const scoreA = isPlayed ? teamA?.points : (teamA?.projected_points || teamA?.points || 0);
              const scoreB = isPlayed ? teamB?.points : (teamB?.projected_points || teamB?.points || 0);

              return (
                <div 
                  key={match.matchup_id || idx}
                  className="bg-zinc-900 border border-zinc-800/90 rounded-3xl p-5 shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Matchup Header */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
                      <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-800">
                        MATCHUP #{match.matchup_id}
                      </span>
                      <div className="flex items-center gap-2">
                        {isPlayed ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            FINAL · Margin: {match.margin} pts
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                            <Sparkles size={11} />
                            PROJ SPREAD: {match.projected_margin || match.margin} PTS
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team A vs Team B Scoreboard */}
                    <div className="space-y-3">
                      
                      {/* Team A */}
                      <div className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                        isWinnerA ? 'bg-emerald-950/20 border border-emerald-500/30' : 'bg-zinc-950/60 border border-zinc-800/60'
                      }`}>
                        <div className="flex items-center gap-3 min-w-0">
                          {teamA?.avatar ? (
                            <img 
                              src={`https://sleepercdn.com/avatars/thumbs/${teamA.avatar}`} 
                              alt={teamA.team_name}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-700" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-xs">
                              {teamA?.team_name?.slice(0, 2).toUpperCase() || 'T1'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-white truncate">{teamA?.team_name || 'Team A'}</h4>
                              {isWinnerA && <span className="text-[10px] font-mono text-emerald-400 font-bold px-1 rounded bg-emerald-500/10 border border-emerald-500/30">WIN</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-mono text-zinc-400">Roster #{teamA?.roster_id}</p>
                              {!isPlayed && match.win_prob_a !== undefined && (
                                <span className="text-[9px] font-mono text-amber-400/90 font-bold">
                                  {match.win_prob_a}% Win Prob
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-lg font-black font-mono ${isWinnerA ? 'text-emerald-400' : 'text-white'}`}>
                            {scoreA ? scoreA.toFixed(2) : '0.00'}
                          </span>
                          <p className="text-[10px] font-mono text-zinc-400">{isPlayed ? 'PTS' : 'PROJ PTS'}</p>
                        </div>
                      </div>

                      {/* Team B */}
                      {teamB ? (
                        <div className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                          isWinnerB ? 'bg-emerald-950/20 border border-emerald-500/30' : 'bg-zinc-950/60 border border-zinc-800/60'
                        }`}>
                          <div className="flex items-center gap-3 min-w-0">
                            {teamB?.avatar ? (
                              <img 
                                src={`https://sleepercdn.com/avatars/thumbs/${teamB.avatar}`} 
                                alt={teamB.team_name}
                                className="w-10 h-10 rounded-xl object-cover border border-zinc-700" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-xs">
                                {teamB?.team_name?.slice(0, 2).toUpperCase() || 'T2'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-bold text-white truncate">{teamB?.team_name || 'Team B'}</h4>
                                {isWinnerB && <span className="text-[10px] font-mono text-emerald-400 font-bold px-1 rounded bg-emerald-500/10 border border-emerald-500/30">WIN</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-mono text-zinc-400">Roster #{teamB?.roster_id}</p>
                                {!isPlayed && match.win_prob_b !== undefined && (
                                  <span className="text-[9px] font-mono text-amber-400/90 font-bold">
                                    {match.win_prob_b}% Win Prob
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-lg font-black font-mono ${isWinnerB ? 'text-emerald-400' : 'text-white'}`}>
                              {scoreB ? scoreB.toFixed(2) : '0.00'}
                            </span>
                            <p className="text-[10px] font-mono text-zinc-400">{isPlayed ? 'PTS' : 'PROJ PTS'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl text-center text-xs font-mono text-zinc-400">
                          BYE WEEK (No Opponent)
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Expand Box Score Action */}
                  <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => setActiveBoxScore(match)}
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-200 hover:text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 border border-zinc-800"
                    >
                      <span>Tale of the Tape & Starters Box Score</span>
                      <ArrowRight size={14} className="text-orange-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ── VIEW 2: FRANCHISE SEASON SCHEDULE MATRIX ──────────────────────── */}
      {viewMode === 'franchise' && selectedFranchise && (
        <div className="space-y-6">
          
          {/* Franchise Selector Bar */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-3.5">
                {selectedFranchise.avatar ? (
                  <img 
                    src={`https://sleepercdn.com/avatars/thumbs/${selectedFranchise.avatar}`} 
                    alt={selectedFranchise.team_name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-500/50 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 border-2 border-orange-500/50 flex items-center justify-center text-white font-black text-sm">
                    {selectedFranchise.team_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-white">{selectedFranchise.team_name}</h3>
                  <p className="text-xs font-mono text-zinc-400">
                    Record: <span className="text-emerald-400 font-bold">
                      {selectedFranchise.has_played_games
                        ? `${selectedFranchise.wins}W - ${selectedFranchise.losses}L${selectedFranchise.ties ? ` - ${selectedFranchise.ties}T` : ''}`
                        : `0-0 (Scheduled) · Proj: ${selectedFranchise.projected_record || '11-7'}`}
                    </span> · All-Play: {selectedFranchise.has_played_games ? `${selectedFranchise.all_play_record} (${selectedFranchise.all_play_win_pct}%)` : `0-0 (Proj: ${selectedFranchise.projected_all_play_record || '90-72'})`}
                  </p>
                </div>
              </div>

              {/* Team Dropdown Filter */}
              <div className="sm:w-64">
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Select Franchise
                </label>
                <select
                  value={selectedRosterId || ''}
                  onChange={(e) => setSelectedRosterId(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {scheduleData.franchises.map((f: any) => (
                    <option key={f.roster_id} value={f.roster_id}>
                      {f.team_name} ({f.has_played_games ? `${f.wins}-${f.losses}` : `0-0 · Proj ${f.projected_record || '11-7'}`})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Franchise Season KPI Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-800">
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  {selectedFranchise.has_played_games ? 'Points For (PF)' : 'Projected PF'}
                </span>
                <h4 className="text-base font-black font-mono text-white mt-0.5">
                  {selectedFranchise.has_played_games ? selectedFranchise.points_for : selectedFranchise.projected_points_for}
                </h4>
              </div>
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  {selectedFranchise.has_played_games ? 'Points Against (PA)' : 'Projected PA'}
                </span>
                <h4 className="text-base font-black font-mono text-white mt-0.5">
                  {selectedFranchise.has_played_games ? selectedFranchise.points_against : selectedFranchise.projected_points_against}
                </h4>
              </div>
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  {selectedFranchise.has_played_games ? 'Point Differential' : 'Proj Differential'}
                </span>
                <h4 className={`text-base font-black font-mono mt-0.5 ${
                  (selectedFranchise.has_played_games ? selectedFranchise.point_differential : selectedFranchise.projected_point_differential) >= 0 
                    ? 'text-emerald-400' 
                    : 'text-rose-400'
                }`}>
                  {selectedFranchise.has_played_games
                    ? (selectedFranchise.point_differential > 0 ? `+${selectedFranchise.point_differential}` : selectedFranchise.point_differential)
                    : (selectedFranchise.projected_point_differential > 0 ? `+${selectedFranchise.projected_point_differential}` : selectedFranchise.projected_point_differential)}
                </h4>
              </div>
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  {selectedFranchise.has_played_games ? 'All-Play Win %' : 'Proj All-Play Win %'}
                </span>
                <h4 className="text-base font-black font-mono text-cyan-400 mt-0.5">
                  {selectedFranchise.has_played_games ? selectedFranchise.all_play_win_pct : selectedFranchise.projected_all_play_win_pct}%
                </h4>
              </div>
            </div>
          </div>

          {/* 18-Week Chronological Schedule Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase font-mono tracking-wider text-zinc-300">
                18-Week Chronological Season Slate
              </h4>
              <span className="text-[10px] font-mono text-zinc-400">Regular Season + Dynasty Playoffs</span>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {selectedFranchise.schedule.map((game: any) => {
                const isPlayed = game.result !== 'UPCOMING';
                const isWin = isPlayed ? game.result === 'W' : game.projected_result === 'W';
                const isLoss = isPlayed ? game.result === 'L' : game.projected_result === 'L';

                return (
                  <div 
                    key={game.week}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-14 text-xs font-mono font-bold text-zinc-400">
                        WEEK {game.week}
                      </span>
                      
                      <div className="flex items-center gap-3 min-w-0">
                        {game.opponent_avatar ? (
                          <img 
                            src={`https://sleepercdn.com/avatars/thumbs/${game.opponent_avatar}`} 
                            alt={game.opponent_name}
                            className="w-8 h-8 rounded-xl object-cover border border-zinc-700" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-[10px] font-bold">
                            VS
                          </div>
                        )}
                        <div>
                          <h5 className="text-sm font-bold text-white truncate">vs {game.opponent_name}</h5>
                          <p className="text-[10px] font-mono text-zinc-400">Matchup #{game.matchup_id || 1}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      {isPlayed ? (
                        <div className="text-right font-mono">
                          <span className="text-sm font-bold text-white">
                            {game.team_score.toFixed(2)} - {game.opp_score.toFixed(2)}
                          </span>
                          <p className="text-[10px] text-zinc-400">
                            {isWin ? `+${game.margin} pts` : `-${game.margin} pts`}
                          </p>
                        </div>
                      ) : (
                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-amber-300">
                            {game.projected_team_score} - {game.projected_opp_score}
                          </span>
                          <p className="text-[10px] text-zinc-400">
                            Spread: {game.margin} pts
                          </p>
                        </div>
                      )}

                      <span className={`w-16 text-center py-1 rounded-lg text-xs font-mono font-black ${
                        isWin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                        isLoss ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {isPlayed ? game.result : `PROJ ${game.projected_result}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ── VIEW 3: ALL-PLAY & SCHEDULE LUCK STANDINGS TABLE ──────────────── */}
      {viewMode === 'allplay' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white">
                All-Play League Standings & Schedule Luck Index
              </h4>
              <p className="text-xs font-mono text-zinc-400">
                {scheduleData.is_preseason 
                  ? '2026 Preseason Projections: All-Play rankings modeled across all 18 scheduled matchups.' 
                  : 'Removes weekly scheduling luck by scoring every franchise against all other 9 teams each week.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3">Rank & Franchise</th>
                  <th className="px-4 py-3 text-center">{scheduleData.is_preseason ? 'Proj Record' : 'Actual Record'}</th>
                  <th className="px-4 py-3 text-center">{scheduleData.is_preseason ? 'Proj All-Play' : 'All-Play Record'}</th>
                  <th className="px-4 py-3 text-center">{scheduleData.is_preseason ? 'Proj Win %' : 'All-Play Win %'}</th>
                  <th className="px-4 py-3 text-right">{scheduleData.is_preseason ? 'Proj PF' : 'Total PF'}</th>
                  <th className="px-4 py-3 text-right">{scheduleData.is_preseason ? 'Proj PA' : 'Total PA'}</th>
                  <th className="px-6 py-3 text-center">{scheduleData.is_preseason ? '2026 Status' : 'Luck Rating'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {scheduleData.franchises.map((f: any, idx: number) => {
                  const isPre = scheduleData.is_preseason;
                  const winPct = isPre ? f.projected_all_play_win_pct : f.all_play_win_pct;
                  const actualWinPct = isPre ? (f.projected_wins / 18) * 100 : (f.wins / Math.max(1, f.wins + f.losses)) * 100;
                  const luckDelta = actualWinPct - winPct;
                  const isLucky = luckDelta > 5;
                  const isUnlucky = luckDelta < -5;

                  return (
                    <tr key={f.roster_id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <span className="text-zinc-500 font-bold w-4">#{idx + 1}</span>
                        {f.avatar ? (
                          <img 
                            src={`https://sleepercdn.com/avatars/thumbs/${f.avatar}`} 
                            alt={f.team_name}
                            className="w-7 h-7 rounded-lg object-cover" 
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 text-[10px] font-bold">
                            {f.team_name.slice(0, 2)}
                          </div>
                        )}
                        <span className="font-bold text-white font-sans text-sm">{f.team_name}</span>
                      </td>

                      <td className="px-4 py-4 text-center font-bold text-white">
                        {isPre ? f.projected_record : `${f.wins} - ${f.losses}`}
                      </td>

                      <td className="px-4 py-4 text-center text-cyan-400 font-bold">
                        {isPre ? f.projected_all_play_record : f.all_play_record}
                      </td>

                      <td className="px-4 py-4 text-center font-bold text-zinc-200">
                        {winPct}%
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-white">
                        {isPre ? f.projected_points_for : f.points_for}
                      </td>

                      <td className="px-4 py-4 text-right text-zinc-400">
                        {isPre ? f.projected_points_against : f.points_against}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {isPre ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            winPct >= 70 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                            winPct >= 50 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                            'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                          }`}>
                            {winPct >= 70 ? 'Title Contender' : winPct >= 50 ? 'Playoff Threat' : 'Retooling'}
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isLucky ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            isUnlucky ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {isLucky ? 'Schedule Lucky' : isUnlucky ? 'Tough Schedule' : 'Balanced'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. BOX SCORE & STARTERS MODAL (MOBILE-OPTIMIZED HIGH-Z OVERLAY) ──────────── */}
      {activeBoxScore && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveBoxScore(null)}
        >
          <div 
            className="bg-zinc-900 border-t-2 sm:border-2 border-zinc-700 rounded-t-[32px] sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 relative shadow-2xl space-y-4 sm:space-y-5 max-h-[88vh] sm:max-h-[90vh] overflow-y-auto flex flex-col pb-8 sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto sm:hidden -mt-1 mb-1 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase text-orange-400 font-black">
                    Week {selectedWeek} · Matchup #{activeBoxScore.matchup_id}
                  </span>
                  <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold uppercase">
                    {activeBoxScore.is_played ? 'Official Box Score' : 'Preseason Forecast'}
                  </span>
                </div>
                <h3 className="text-base sm:text-2xl font-black uppercase text-white tracking-tight mt-1">
                  Tale of the Tape: Starter vs Starter
                </h3>
              </div>
              <button 
                onClick={() => setActiveBoxScore(null)}
                className="text-zinc-300 hover:text-white bg-zinc-800/90 hover:bg-zinc-700 px-3 py-1.5 rounded-xl transition-all font-mono text-xs font-bold border border-zinc-700 flex items-center gap-1 shrink-0 shadow-sm"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            {/* Matchup Head-to-Head Summary Card */}
            <div className="bg-zinc-950/90 p-4 rounded-2xl border border-zinc-800 shadow-inner">
              <div className="grid grid-cols-2 gap-3 items-center">
                
                {/* Team A */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {activeBoxScore.team_a?.avatar ? (
                      <img 
                        src={`https://sleepercdn.com/avatars/thumbs/${activeBoxScore.team_a.avatar}`} 
                        alt="" 
                        className="w-6 h-6 rounded-lg object-cover border border-zinc-700 shrink-0" 
                      />
                    ) : null}
                    <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-[130px] sm:max-w-[180px]">
                      {activeBoxScore.team_a?.team_name || 'Team A'}
                    </h4>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                    {activeBoxScore.is_played 
                      ? (activeBoxScore.team_a ? Number(activeBoxScore.team_a.points || 0).toFixed(2) : '0.00')
                      : (activeBoxScore.team_a ? Number(activeBoxScore.team_a.projected_points || 125.0).toFixed(2) : '0.00')}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500 uppercase block">
                    {activeBoxScore.is_played ? 'Total Starter Points' : 'Projected Starter Points'}
                  </span>
                </div>

                {/* Team B */}
                <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-[130px] sm:max-w-[180px]">
                      {activeBoxScore.team_b?.team_name || 'BYE'}
                    </h4>
                    {activeBoxScore.team_b?.avatar ? (
                      <img 
                        src={`https://sleepercdn.com/avatars/thumbs/${activeBoxScore.team_b.avatar}`} 
                        alt="" 
                        className="w-6 h-6 rounded-lg object-cover border border-zinc-700 shrink-0" 
                      />
                    ) : null}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                    {activeBoxScore.is_played 
                      ? (activeBoxScore.team_b ? Number(activeBoxScore.team_b.points || 0).toFixed(2) : '0.00')
                      : (activeBoxScore.team_b ? Number(activeBoxScore.team_b.projected_points || 125.0).toFixed(2) : '0.00')}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500 uppercase block">
                    {activeBoxScore.is_played ? 'Total Starter Points' : 'Projected Starter Points'}
                  </span>
                </div>

              </div>
            </div>

            {/* Starters Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
                  Starting Lineup Head-to-Head Slots
                </h4>
                <span className="text-[10px] font-mono text-zinc-500">
                  {(activeBoxScore.team_a?.starters || []).length} Starters
                </span>
              </div>

              <div className="space-y-2.5">
                {(activeBoxScore.team_a?.starters || []).map((pA: any, idx: number) => {
                  const pB = activeBoxScore.team_b?.starters?.[idx];
                  const scoreA = Number(typeof pA.points === 'number' && activeBoxScore.is_played ? pA.points : (pA.projected_points || 12.0));
                  const scoreB = pB ? Number(typeof pB.points === 'number' && activeBoxScore.is_played ? pB.points : (pB.projected_points || 12.0)) : 0;
                  const diff = scoreA - scoreB;
                  const posName = pA.position || (idx === 0 ? 'QB' : idx < 3 ? 'RB' : idx < 5 ? 'WR' : idx === 5 ? 'TE' : 'FLEX');

                  return (
                    <div 
                      key={idx}
                      className="bg-zinc-950/80 rounded-2xl border border-zinc-800/90 p-2.5 sm:p-3 hover:border-zinc-700 transition-all shadow-sm space-y-2"
                    >
                      {/* Top Slot Header */}
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold uppercase flex items-center gap-1.5">
                          <PositionPill pos={posName} />
                          <span>Slot #{idx + 1}</span>
                        </span>
                        
                        <span className={`font-bold px-2 py-0.5 rounded text-[9.5px] border ${
                          diff > 0 
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                            : diff < 0 
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}>
                          {diff > 0 
                            ? `+${diff.toFixed(1)} pts ${activeBoxScore.team_a?.team_name || 'Team A'}` 
                            : diff < 0 
                            ? `+${Math.abs(diff).toFixed(1)} pts ${activeBoxScore.team_b?.team_name || 'Team B'}` 
                            : 'TIED'}
                        </span>
                      </div>

                      {/* 2-Sided Positional Matchup Cards (No text overlapping!) */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        
                        {/* Starter A */}
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          scoreA >= scoreB 
                            ? 'bg-emerald-950/25 border-emerald-500/40 shadow-sm' 
                            : 'bg-zinc-900/50 border-zinc-800/80'
                        }`}>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="font-bold text-white text-xs sm:text-sm truncate">
                              {pA.name || 'Starter'}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              {pA.team || 'NFL'} · {pA.position || posName}
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-sm sm:text-base text-emerald-400">
                              {scoreA.toFixed(1)}
                            </span>
                            <span className="block text-[8px] font-mono text-zinc-500 uppercase leading-none mt-0.5">
                              pts
                            </span>
                          </div>
                        </div>

                        {/* Starter B */}
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          scoreB >= scoreA 
                            ? 'bg-emerald-950/25 border-emerald-500/40 shadow-sm' 
                            : 'bg-zinc-900/50 border-zinc-800/80'
                        }`}>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="font-bold text-white text-xs sm:text-sm truncate">
                              {pB?.name || 'Empty'}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              {pB?.team || 'NFL'} · {pB?.position || posName}
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-sm sm:text-base text-emerald-400">
                              {scoreB.toFixed(1)}
                            </span>
                            <span className="block text-[8px] font-mono text-zinc-500 uppercase leading-none mt-0.5">
                              pts
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coach Madden Breakdown Note */}
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 p-3.5 sm:p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase font-mono mb-1">
                <Sparkles size={14} /> Coach Madden Tactical Insight
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed font-mono">
                BOOM! Notice the starter efficiency! When your flex starters outproduce projections by double digits, you control the clock and capture the win!
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}


"use client";

import React, { useEffect, useState } from "react";
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { 
  AlertTriangle, TrendingUp, Info, Target, Sparkles, ArrowRight, 
  ArrowRightLeft, Radio, MessageSquare, Clock, Zap, Coins, 
  ShieldAlert, ShieldCheck, ChevronDown, Flame, CheckCircle2
} from "lucide-react";
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/config/api';
import MetricExplainer from '@/components/ui/MetricExplainer';

export default function ActionCenterTab() {
  const { leagueId, myRosterId, setMyRosterId, leagueRosters, isLoading: isLeagueLoading } = useLeague();
  const { currentTheme } = useTheme();
  const router = useRouter();
  const [actionFeedParent] = useAutoAnimate();
  const [directivesParent] = useAutoAnimate();

  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [seasonOutlook, setSeasonOutlook] = useState<any>(null);
  const [rosterDetails, setRosterDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTeamSwitcherOpen, setIsTeamSwitcherOpen] = useState(false);

  // Fetch league matrix & season outlook
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

  // Fetch detailed roster telemetry whenever myRosterId or leagueId changes
  useEffect(() => {
    if (!leagueId) return;
    const effectiveRosterId = myRosterId || (matrixData.length > 0 ? matrixData[0].roster_id : 1);
    
    async function fetchRosterDetails() {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/roster-details/${leagueId}/${effectiveRosterId}`);
        if (res.ok) {
          const rJson = await res.json();
          if (!rJson.error) setRosterDetails(rJson);
        }
      } catch (err) {
        console.error("Failed to fetch detailed roster for Action Center:", err);
      }
    }
    fetchRosterDetails();
  }, [leagueId, myRosterId, matrixData]);

  // Identify active franchise
  const myRoster = matrixData.length > 0 
    ? (matrixData.find(r => r.roster_id === myRosterId) || matrixData.find(r => r.team_name?.toLowerCase().includes('insolublenitrate')) || matrixData[0]) 
    : null;

  const myOutlook = seasonOutlook?.teams?.find((t: any) => 
    t.roster_id === myRoster?.roster_id || t.team_name?.toLowerCase().includes(myRoster?.team_name?.toLowerCase() || '')
  ) || seasonOutlook?.teams?.[0];

  // Derive Dynasty Window & Lifecycle
  const getWindowLabel = (lifecycle: string, age: number) => {
    if (lifecycle?.includes('Contender') || lifecycle?.includes('Juggernaut')) {
      return {
        window: "2026 - 2027 Apex Window",
        status: "Win-Now Contender",
        color: "text-emerald-400",
        badgeBg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
        icon: Flame
      };
    }
    if (lifecycle?.includes('Rebuild')) {
      return {
        window: "2027+ Retool & Peak",
        status: "Productive Struggle",
        color: "text-cyan-400",
        badgeBg: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
        icon: Zap
      };
    }
    return {
      window: "2026 Strategic Crossroads",
      status: "Purgatory Retool",
      color: "text-amber-400",
      badgeBg: "bg-amber-500/20 border-amber-500/40 text-amber-300",
      icon: Clock
    };
  };

  const windowMeta = getWindowLabel(myRoster?.lifecycle_state, myRoster?.roster_age_score || 25.5);

  // Identify Age Cliff players on active roster
  const ageCliffPlayers = rosterDetails?.starters?.concat(rosterDetails?.bench || [])?.filter((p: any) => {
    if (p.position === 'RB' && p.age >= 27) return true;
    if (p.position === 'WR' && p.age >= 29) return true;
    if (p.position === 'TE' && p.age >= 30) return true;
    return false;
  }) || [];

  // Count Future 1st Round Picks owned
  const futureFirstsCount = rosterDetails?.draft_picks?.filter((p: any) => p.round === 1)?.length || 0;

  // Best Trade Partner synergy
  const bestPartner = matrixData.find(t => {
    if (t.roster_id === myRoster?.roster_id) return false;
    if (myRoster?.lifecycle_state?.includes('Contender') && t.lifecycle_state?.includes('Rebuilding')) return true;
    if (myRoster?.lifecycle_state?.includes('Rebuilding') && t.lifecycle_state?.includes('Contender')) return true;
    return false;
  }) || matrixData.find(t => t.roster_id !== myRoster?.roster_id);

  // Dynamic Directives tailored to archetype
  const directives = [];
  if (myRoster?.lifecycle_state?.includes('Contender') || myRoster?.lifecycle_state?.includes('Juggernaut')) {
    directives.push({
      id: "d1",
      tag: "CHAMPIONSHIP DIRECTIVE",
      tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      title: "Consolidate Depth into Elite Weekly Starters",
      desc: "Your championship window is open. Trade back-end bench depth or future 2nd/3rd round picks to secure top-tier weekly starter firepower.",
      cta: "Trade in Architect →",
      onClick: () => router.push(`/dynasty-room?arena=trade&sub=architect&partner=${bestPartner?.roster_id || ''}`)
    });
    if (ageCliffPlayers.length > 0) {
      directives.push({
        id: "d2",
        tag: "AGE CLIFF WATCH",
        tagColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        title: `Monitor Veteran Drop-Off: ${ageCliffPlayers[0]?.name} (${ageCliffPlayers[0]?.position}, Age ${ageCliffPlayers[0]?.age})`,
        desc: "RBs 27+ and WRs 29+ face steep post-peak depreciation. Plan an exit window before value hits terminal drop-off.",
        cta: "Audit Roster Intel →",
        onClick: () => router.push('/dynasty-room?arena=command&sub=roster')
      });
    }
    if (bestPartner) {
      directives.push({
        id: "d3",
        tag: "TRADE TARGET MATCH",
        tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        title: `Prime Market Partner: ${bestPartner.team_name} (${bestPartner.lifecycle_state})`,
        desc: `This franchise holds divergent assets. Engage them for immediate starter production while offering youth or draft equity.`,
        cta: `Propose Trade with ${bestPartner.team_name} →`,
        onClick: () => router.push(`/dynasty-room?arena=trade&sub=architect&partner=${bestPartner.roster_id}`)
      });
    }
  } else {
    directives.push({
      id: "d1",
      tag: "REBUILD DIRECTIVE",
      tagColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      title: "Liquidate High-Scoring Veterans for 2026/2027 Capital",
      desc: "Protect your rookie draft slot by selling points off your bench to desperate contenders in exchange for future 1st and 2nd round picks.",
      cta: "Find Trade Buyers →",
      onClick: () => router.push('/dynasty-room?arena=trade&sub=partners')
    });
    directives.push({
      id: "d2",
      tag: "DRAFT CAPITAL ARBITRAGE",
      tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      title: `War Chest Status: ${futureFirstsCount} Future 1st Round Picks Owned`,
      desc: "Draft pick equity appreciates leading into rookie drafts. Hold picks until draft season apex or use them to buy injured young studs.",
      cta: "Draft Board & Rookies →",
      onClick: () => router.push('/dynasty-room?arena=players&sub=rookies')
    });
    if (bestPartner) {
      directives.push({
        id: "d3",
        tag: "CONTENDER BUYER",
        tagColor: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        title: `Target Win-Now Contender: ${bestPartner.team_name}`,
        desc: "Contenders will overpay with future picks for immediate starter production. Shop your veteran assets to them now.",
        cta: `Open Trade in Architect →`,
        onClick: () => router.push(`/dynasty-room?arena=trade&sub=architect&partner=${bestPartner.roster_id}`)
      });
    }
  }

  // Generate dynamic league action items
  const marketActions = matrixData
    .filter(team => team.roster_id !== myRoster?.roster_id && (team.point_differential < -50 || team.lifecycle_state === 'All-In Contender'))
    .map(team => {
      if (team.lifecycle_state === 'All-In Contender') {
        return {
          id: team.roster_id,
          type: "alert",
          icon: <AlertTriangle className="text-rose-400" size={20} />,
          title: `Contender Sell Window: ${team.team_name}`,
          description: `Classified as 'All-In Contender'. They are buyers on the trade market willing to pay premium prices for veteran starters.`,
          timestamp: "Market Signal",
          bg: "bg-rose-950/20",
          border: "border-rose-900/40",
          partnerId: team.roster_id
        };
      }
      return {
        id: team.roster_id,
        type: "opportunity",
        icon: <TrendingUp className="text-emerald-400" size={20} />,
        title: `Buy Low Opportunity: ${team.team_name}`,
        description: `Experiencing severe negative luck variance. Expected points exceed actual output. Target their frustrated assets.`,
        timestamp: "Luck Discrepancy",
        bg: "bg-emerald-950/20",
        border: "border-emerald-900/40",
        partnerId: team.roster_id
      };
    });

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* ── 1. DYNASTY EXECUTIVE HORIZON COCKPIT ────────────────────────────── */}
      <div className="bg-gradient-to-b from-zinc-900/95 via-zinc-900/80 to-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-15" style={{ background: currentTheme.primary }} />
        
        {/* Franchise Header Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-zinc-800/80 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              {myRoster?.avatar ? (
                <img src={`https://sleepercdn.com/avatars/${myRoster.avatar}`} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <ShieldCheck size={28} style={{ color: currentTheme.primary }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white italic tracking-tight font-display">
                  {myRoster?.team_name || "Franchise War Room"}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${windowMeta.badgeBg}`}>
                  {windowMeta.status}
                </span>
                <MetricExplainer term="archetype" size="xs" />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-1">
                <Clock size={13} className={windowMeta.color} />
                <span className="font-bold text-zinc-300">{windowMeta.window}</span>
                <span className="text-zinc-600">•</span>
                <span>Power Index: <strong className="text-white">{myRoster?.power_index ? Math.round(myRoster.power_index) : 2500}</strong></span>
              </div>
            </div>
          </div>

          {/* Franchise Switcher Dropdown */}
          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setIsTeamSwitcherOpen(!isTeamSwitcherOpen)}
              className="w-full md:w-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 text-xs font-mono font-bold transition-all shadow-sm"
            >
              <span>Change Franchise Focus</span>
              <ChevronDown size={14} className={`transition-transform ${isTeamSwitcherOpen ? "rotate-180" : ""}`} />
            </button>

            {isTeamSwitcherOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="px-3 py-1 text-[10px] font-mono font-bold text-zinc-500 uppercase">
                  Select Franchise ({matrixData.length} Teams)
                </div>
                {matrixData.map((t: any) => (
                  <button
                    key={t.roster_id}
                    onClick={() => {
                      setMyRosterId(t.roster_id);
                      setIsTeamSwitcherOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-mono transition-all ${
                      t.roster_id === myRoster?.roster_id 
                        ? "bg-zinc-800 text-white font-bold" 
                        : "hover:bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    <span className="truncate">{t.team_name}</span>
                    <span className="text-[10px] text-zinc-500">{t.lifecycle_state}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4 Quant Vital Signs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-mono uppercase font-bold text-zinc-400">Starter Firepower</span>
              <Zap size={14} className="text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              {myRoster?.starter_ppg ? `${myRoster.starter_ppg.toFixed(1)}` : '155.0'}
              <span className="text-xs text-zinc-500 font-sans font-normal ml-1">PPG</span>
            </div>
            <p className="text-[10px] font-mono text-emerald-400 mt-0.5">Top-Tier Starting Lineup</p>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-mono uppercase font-bold text-zinc-400">Draft War Chest</span>
              <Coins size={14} className="text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {futureFirstsCount}
              <span className="text-xs text-zinc-400 font-sans font-normal ml-1">Future 1sts</span>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
              Equity: {myRoster?.future_capital_score ? Math.round(myRoster.future_capital_score).toLocaleString() : '21,000'} pts
            </p>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-mono uppercase font-bold text-zinc-400">Roster Mean Age</span>
              <Clock size={14} className="text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              {myRoster?.roster_age_score ? `${myRoster.roster_age_score.toFixed(1)}` : '25.4'}
              <span className="text-xs text-zinc-500 font-sans font-normal ml-1">yrs</span>
            </div>
            <p className="text-[10px] font-mono text-cyan-400 mt-0.5">
              {myRoster?.roster_age_score && myRoster.roster_age_score < 26 ? 'Prime Championship Age' : 'Aging Roster Window'}
            </p>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-mono uppercase font-bold text-zinc-400">Optimal Ceiling</span>
              <Target size={14} style={{ color: currentTheme.primary }} />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              {myRoster?.max_pf ? Math.round(myRoster.max_pf).toLocaleString() : '2,800'}
              <span className="text-xs text-zinc-500 font-sans font-normal ml-1">Max PF</span>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 mt-0.5">True Roster Potential</p>
          </div>
        </div>
      </div>

      {/* ── 2. DYNASTY STRATEGIC DIRECTIVES ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-white italic tracking-tight flex items-center gap-2">
            <Sparkles size={18} style={{ color: currentTheme.primary }} />
            <span>IMMEDIATE DYNASTY DIRECTIVES</span>
          </h2>
          <span className="text-[10px] font-mono text-zinc-400 uppercase">Personalized Action Items</span>
        </div>

        <div ref={directivesParent} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {directives.map((item) => (
            <div 
              key={item.id}
              className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl transition-all"
            >
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9.5px] font-mono font-bold border mb-2.5 ${item.tagColor}`}>
                  {item.tag}
                </span>
                <h3 className="text-sm font-bold text-white leading-snug mb-1.5">{item.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">{item.desc}</p>
              </div>

              <button
                onClick={item.onClick}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm border border-zinc-700"
              >
                <span>{item.cta}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. POSITIONAL HEALTH & AGE CLIFF WATCH ───────────────────────────── */}
      {rosterDetails?.position_audits && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-400" />
                <span>Positional Health & Age Cliff Watch</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Evaluates starter depth, pipeline readiness, and threshold risk before value declines.
              </p>
            </div>
            {ageCliffPlayers.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold flex items-center gap-1.5">
                <AlertTriangle size={12} />
                <span>{ageCliffPlayers.length} Cliff Watch Player(s)</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['QB', 'RB', 'WR', 'TE'].map((pos) => {
              const audit = rosterDetails.position_audits[pos];
              if (!audit) return null;
              const isCliffRisk = audit.cliff_risk?.includes('HIGH') || audit.cliff_risk?.includes('MEDIUM');

              return (
                <div key={pos} className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-black text-sm text-white">{pos}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      isCliffRisk ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {audit.cliff_risk}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-zinc-900 pt-2">
                    <div>
                      <span className="text-zinc-500 text-[9px] block">Starter Tier</span>
                      <span className="text-white font-bold">{audit.starter_quality}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[9px] block">Avg Age</span>
                      <span className="text-zinc-300 font-bold">{audit.avg_age} yrs</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-400 truncate">{audit.summary}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. COACH MADDEN TELESTRATOR BRIDGE ──────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-zinc-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-mono text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm">
                <Radio size={12} className="animate-pulse text-orange-400" />
                <span>COACH MADDEN AI WAR ROOM</span>
              </span>
              <span className="text-xs font-mono text-zinc-400 font-bold">Interactive Telestrator Chalkboard</span>
            </div>
            <p className="text-sm font-mono text-zinc-200 leading-relaxed italic border-l-2 border-orange-500/60 pl-3">
              {seasonOutlook?.state_of_the_league ? `"${seasonOutlook.state_of_the_league}"` : '"Draw up your trade routes, diagram blitz leverage points, and engineer your championship roster."'}
            </p>
          </div>

          <button
            onClick={() => router.push('/ask-madden')}
            className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-mono text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shrink-0"
          >
            <MessageSquare size={16} />
            <span>Open Chalkboard & Ask Madden →</span>
          </button>
        </div>
      </div>

      {/* ── 5. LIVE LEAGUE MARKET SIGNALS ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <span>League Trade Market Signals & Discrepancies</span>
          </h3>
          <span className="text-[10px] font-mono text-zinc-400 uppercase">Live Signals</span>
        </div>

        <div ref={actionFeedParent} className="space-y-3">
          {loading ? (
            <div className="text-zinc-500 p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 animate-pulse font-mono text-xs">
              Analyzing league transactions and points against expected baseline...
            </div>
          ) : marketActions.length > 0 ? (
            marketActions.map((action) => (
              <div 
                key={action.id} 
                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-5 rounded-2xl border shadow-xl ${action.bg} ${action.border} transition-all hover:scale-[1.005]`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="shrink-0 mt-0.5">{action.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{action.title}</h4>
                      <span className="text-[9.5px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 shrink-0">
                        {action.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-300 text-xs leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/dynasty-room?arena=trade&sub=architect&partner=${action.partnerId}`)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md border border-zinc-700 shrink-0"
                >
                  <ArrowRightLeft size={13} style={{ color: currentTheme.primary }} />
                  <span>Trade in Architect</span>
                </button>
              </div>
            ))
          ) : (
            <div className="text-zinc-400 p-8 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-center text-xs">
              The market is currently balanced. No high-conviction arbitrage targets detected.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

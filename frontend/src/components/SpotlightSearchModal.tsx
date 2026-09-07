"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, X, Target, Crown, CalendarDays, Briefcase, 
  Sparkles, ArrowRight, UserPlus, Users, Flame, BookOpen, 
  Coins, Scale, Swords, ShieldAlert, Zap, Radar, Activity
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useLeague } from "@/context/LeagueContext";
import { getApiUrl } from "@/config/api";

interface SpotlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: string;
  category: "Navigation" | "Action" | "Tools";
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: React.ElementType;
}

export default function SpotlightSearchModal({ isOpen, onClose }: SpotlightSearchModalProps) {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const { leagueRosters } = useLeague();
  
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [players, setPlayers] = useState<any[]>([]);
  const [isPlayersLoading, setIsPlayersLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch players on first open if empty
  useEffect(() => {
    if (isOpen && players.length === 0) {
      setIsPlayersLoading(true);
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/api/stats/advanced_player_metrics?year=2024`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPlayers(data);
        })
        .catch(err => console.error("Spotlight player load failed:", err))
        .finally(() => setIsPlayersLoading(false));
    }
  }, [isOpen, players.length]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const QUICK_ACTIONS: QuickAction[] = [
    {
      id: "act-center",
      category: "Navigation",
      title: "Action Center & Executive Verdict",
      description: "Contender vs Rebuilder status, bottom-line directives, and vital signs",
      href: "/dynasty-room?arena=command&sub=action",
      icon: Target
    },
    {
      id: "roster-intel",
      category: "Navigation",
      title: "Roster Cliff Watch & Clogger Audit",
      description: "Inspect starter volume, aging veterans, and roster depth",
      href: "/dynasty-room?arena=command&sub=roster",
      icon: ShieldAlert
    },
    {
      id: "trade-arch",
      category: "Navigation",
      title: "Trade Architect & Auto-Balancer",
      description: "Build 2-way trades with instant draft pick equalization",
      href: "/dynasty-room?arena=trade&sub=architect",
      icon: Briefcase
    },
    {
      id: "trade-partners",
      category: "Navigation",
      title: "Smart Trade Partner Matcher",
      description: "Identify high-synergy trade partners and 1-click deal blueprints",
      href: "/dynasty-room?arena=trade&sub=partners",
      icon: Users
    },
    {
      id: "power-tiers",
      category: "Navigation",
      title: "Franchise Power Tiers & Standings",
      description: "Max PF tier rankings, title windows, and roster valuation",
      href: "/dynasty-room?arena=power&sub=tiers",
      icon: Crown
    },
    {
      id: "matchup-slate",
      category: "Navigation",
      title: "Weekly Matchup Slate & Projections",
      description: "Head-to-head weekly matchups and starter comparisons",
      href: "/dynasty-room?arena=matchups&sub=slate",
      icon: CalendarDays
    },
    {
      id: "player-analyzer",
      category: "Tools",
      title: "Player Analyzer & Archetype Intel",
      description: "Deep-dive career trajectories, film grades, and valuation",
      href: "/dynasty-room?arena=players&sub=analyzer",
      icon: Activity
    },
    {
      id: "cross-ref",
      category: "Tools",
      title: "Cross Reference Radar",
      description: "Direct stat-for-stat visual radar and multi-metric player comparison",
      href: "/dynasty-room?arena=players&sub=crossref",
      icon: Radar
    },
    {
      id: "monte-carlo",
      category: "Tools",
      title: "Monte Carlo Matchup Simulator",
      description: "Run 10,000 algorithmic simulations between any two rosters",
      href: "/dynasty-room?arena=matchups&sub=simulator",
      icon: Swords
    },
    {
      id: "bounty-vault",
      category: "Tools",
      title: "Dynasty Bounty Ledger",
      description: "Active high-roller weekly bounties and trophy payouts",
      href: "/dynasty-room?arena=power&sub=bounties",
      icon: Coins
    },
    {
      id: "ask-madden",
      category: "Tools",
      title: "Ask Coach Madden AI",
      description: "Empirical dynasty strategy analysis and telestrated chalkboard",
      href: "/ask-madden",
      icon: Sparkles
    }
  ];

  // Filter actions, teams, players
  const filteredActions = useMemo(() => {
    if (!query.trim()) return QUICK_ACTIONS;
    const q = query.toLowerCase();
    return QUICK_ACTIONS.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.description.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredTeams = useMemo(() => {
    if (!query.trim() || !leagueRosters) return [];
    const q = query.toLowerCase();
    return leagueRosters.filter((r: any) => 
      r.team_name?.toLowerCase().includes(q) || 
      String(r.roster_id).includes(q)
    ).slice(0, 4);
  }, [query, leagueRosters]);

  const filteredPlayers = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return players
      .filter(p => p.player_name?.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, players]);

  // Combined searchable items for keyboard navigation
  const allItems = useMemo(() => {
    const items: Array<{ type: 'action' | 'team' | 'player', data: any }> = [];
    filteredActions.forEach(a => items.push({ type: 'action', data: a }));
    filteredTeams.forEach(t => items.push({ type: 'team', data: t }));
    filteredPlayers.forEach(p => items.push({ type: 'player', data: p }));
    return items;
  }, [filteredActions, filteredTeams, filteredPlayers]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (allItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === "Enter" && allItems[selectedIndex]) {
      e.preventDefault();
      executeItem(allItems[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const executeItem = (item: { type: 'action' | 'team' | 'player', data: any }) => {
    onClose();
    if (item.type === 'action') {
      if (item.data.href) router.push(item.data.href);
      else if (item.data.onClick) item.data.onClick();
    } else if (item.type === 'team') {
      router.push(`/dynasty-room?arena=trade&sub=architect&partner_roster=${item.data.roster_id}`);
    } else if (item.type === 'player') {
      router.push(`/dynasty-room?arena=trade&sub=architect&player_id=${item.data.player_id}&player_name=${encodeURIComponent(item.data.player_name)}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-3 sm:pt-20 px-2 sm:px-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[80vh]"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800/80 flex items-center gap-3 bg-zinc-900/60">
          <Search size={18} style={{ color: currentTheme.primary }} className="shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Jump to feature, search player, or pick a rival..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none font-mono"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-3 flex-1">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                <Zap size={11} style={{ color: currentTheme.primary }} />
                <span>War Room Workflows & Navigation</span>
              </div>
              <div className="space-y-1">
                {filteredActions.map((action, idx) => {
                  const itemIndex = idx;
                  const isSelected = selectedIndex === itemIndex;
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => executeItem({ type: 'action', data: action })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                        isSelected 
                          ? 'bg-zinc-800/90 text-white shadow-md border border-zinc-700' 
                          : 'text-zinc-300 hover:bg-zinc-900/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-zinc-700 text-amber-400' : 'bg-zinc-900 text-zinc-400'}`}>
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold truncate flex items-center gap-2">
                            <span>{action.title}</span>
                            <span className="text-[9px] font-mono font-normal text-zinc-400 px-1.5 py-0.2 rounded bg-zinc-800/60">
                              {action.category}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 truncate">{action.description}</div>
                        </div>
                      </div>
                      <ArrowRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 text-amber-400' : 'opacity-30'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Teams */}
          {filteredTeams.length > 0 && (
            <div>
              <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                <Users size={11} className="text-emerald-400" />
                <span>League Franchises</span>
              </div>
              <div className="space-y-1">
                {filteredTeams.map((team: any, idx) => {
                  const itemIndex = filteredActions.length + idx;
                  const isSelected = selectedIndex === itemIndex;
                  return (
                    <button
                      key={team.roster_id}
                      onClick={() => executeItem({ type: 'team', data: team })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                        isSelected 
                          ? 'bg-zinc-800/90 text-white shadow-md border border-zinc-700' 
                          : 'text-zinc-300 hover:bg-zinc-900/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-mono font-bold text-emerald-400 shrink-0">
                          #{team.roster_id}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white truncate">{team.team_name}</div>
                          <div className="text-[10px] font-mono text-zinc-400">
                            {team.owner_name || `Manager ${team.roster_id}`} • Launch trade offer
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 shrink-0">
                        Open in Trade Architect →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Players */}
          {filteredPlayers.length > 0 && (
            <div>
              <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                <UserPlus size={11} className="text-cyan-400" />
                <span>NFL Players ({filteredPlayers.length})</span>
              </div>
              <div className="space-y-1">
                {filteredPlayers.map((player: any, idx) => {
                  const itemIndex = filteredActions.length + filteredTeams.length + idx;
                  const isSelected = selectedIndex === itemIndex;
                  return (
                    <button
                      key={player.player_id}
                      onClick={() => executeItem({ type: 'player', data: player })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                        isSelected 
                          ? 'bg-zinc-800/90 text-white shadow-md border border-zinc-700' 
                          : 'text-zinc-300 hover:bg-zinc-900/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${
                          player.position === 'RB' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                          player.position === 'WR' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          player.position === 'QB' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {player.position}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                            <span>{player.player_name}</span>
                            <span className="text-[10px] font-mono text-zinc-400">({player.recent_team || 'FA'})</span>
                            {player.age > 0 && (
                              <span className="text-[10px] font-mono text-zinc-500">• Age {player.age}</span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400">
                            {player.ppg ? `${player.ppg.toFixed(1)} PPG` : 'Metrics loaded'} • Click to add to Trade Architect
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold shrink-0">
                        + Trade Asset
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {allItems.length === 0 && (
            <div className="text-center py-8 text-zinc-500 font-mono text-xs space-y-1">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-[10px] text-zinc-600">Try searching for &ldquo;Trade&rdquo;, &ldquo;Contender&rdquo;, &ldquo;Roster&rdquo;, or a player name</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-zinc-400">Blindside Universal Command</span>
        </div>
      </div>
    </div>
  );
}

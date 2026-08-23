"use client";

import React, { useState, useEffect } from 'react';
import { 
  Target, Search, Activity, Crosshair, Briefcase, ArrowRightLeft, 
  AlertTriangle, Swords, Trophy, Crown, Dices, ChevronDown, Layers
} from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import ActionCenterTab from '@/components/tabs/ActionCenterTab';
import TeamAnalyzerTab from '@/components/tabs/TeamAnalyzerTab';
import StudioTab from '@/components/tabs/StudioTab';
import MatrixTab from '@/components/tabs/MatrixTab';
import TradeArchitectTab from '@/components/tabs/TradeArchitectTab';
import AutopsyTab from '@/components/tabs/AutopsyTab';
import RivalriesTab from '@/components/tabs/RivalriesTab';
import RecordBookTab from '@/components/tabs/RecordBookTab';
import PowerRankingsTab from '@/components/tabs/PowerRankingsTab';
import MatchupSimulatorTab from '@/components/tabs/MatchupSimulatorTab';

export default function DynastyRoomPage() {
  const { leagueId, isLoading: isLeagueLoading } = useLeague();
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('action');
  
  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  useEffect(() => {
    if (!leagueId) return;

    async function fetchRecentData() {
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
        const res = await fetch(`${apiUrl}/api/quant/trades/${leagueId}`).catch(() => null);
        if (res?.ok) {
          const tData = await res.json();
          if (Array.isArray(tData)) setRecentTrades(tData);
        }
      } catch (err) {
        console.error("Failed to fetch live trades for ticker:", err);
      }
    }
    fetchRecentData();
  }, [leagueId]);

  const TICKER_MESSAGES = [
    "🚨 INJURY ALERT: Monitor player practice reports before weekly lineup lock.",
    "💸 CASH CHASE: The Bounty Board leader extends their Max PF lead in the division.",
    "📉 PURGATORY WARNING: Teams in the lower-left quadrant should initiate a strategic retooling.",
    "🔥 QUANT TAKE: Draft pick depreciation accelerates by 18% post-draft. Trade picks during the rookie hype apex.",
    "⚡ TRADE ARBITRAGE: Multiple buy-low candidates identified in the Action Center.",
    "⚔️ RIVALRY ALERT: Check the 10x10 Head-to-Head series records in the Rivalries tab.",
    "🎲 TALE OF THE TAPE: Run 10,000 Monte Carlo simulations on any two rosters in the Matchup Simulator."
  ];

  const TABS = [
    { id: 'action', label: 'Action Center', shortLabel: 'Action', icon: Target, category: 'Core' },
    { id: 'studio', label: 'The Studio', shortLabel: 'Studio', icon: Activity, category: 'Core' },
    { id: 'matrix', label: 'Power Matrix', shortLabel: 'Matrix', icon: Crosshair, category: 'Analytics' },
    { id: 'power', label: 'Power Tiers', shortLabel: 'Tiers', icon: Crown, category: 'Analytics' },
    { id: 'rivalries', label: 'Rivalries & All-Play', shortLabel: 'Rivalries', icon: Swords, category: 'Social' },
    { id: 'records', label: 'Record Book', shortLabel: 'Records', icon: Trophy, category: 'Social' },
    { id: 'simulator', label: 'Matchup Simulator', shortLabel: 'Simulator', icon: Dices, category: 'Social' },
    { id: 'team', label: 'Team Analyzer', shortLabel: 'Rosters', icon: Search, category: 'Trades' },
    { id: 'trade', label: 'Trade Architect', shortLabel: 'Trade', icon: Briefcase, category: 'Trades' },
    { id: 'autopsy', label: 'Trade Autopsy', shortLabel: 'Autopsy', icon: ArrowRightLeft, category: 'Trades' }
  ];

  const currentTabObj = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      
      {/* Sub-Tab Navigation Header with Mobile Dropdown & Touch Ribbon */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md sticky top-16 z-30 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-2.5 mb-6 shadow-md">
        
        {/* Mobile Quick Selector (<sm) */}
        <div className="sm:hidden mb-2">
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-lg"
            >
              <optgroup label="⚡ Strategic & Live" className="bg-zinc-900 text-zinc-300">
                <option value="action">🎯 Action Center</option>
                <option value="studio">📡 The Studio</option>
                <option value="matrix">🎯 Power Matrix</option>
                <option value="power">👑 Dynasty Power Tiers</option>
              </optgroup>
              <optgroup label="⚔️ Matchups & Social" className="bg-zinc-900 text-zinc-300">
                <option value="rivalries">⚔️ Rivalries & All-Play Matrix</option>
                <option value="records">🏆 Record Book & Hall of Fame</option>
                <option value="simulator">🎲 Monte Carlo Matchup Simulator</option>
              </optgroup>
              <optgroup label="💼 Rosters & Trading" className="bg-zinc-900 text-zinc-300">
                <option value="team">🔍 Team Analyzer</option>
                <option value="trade">💼 Trade Architect</option>
                <option value="autopsy">🔄 Trade Autopsy</option>
              </optgroup>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-3 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Horizontal Touch Scroll Ribbon */}
        <div className="flex gap-1.5 sm:gap-2 max-w-[1440px] mx-auto overflow-x-auto hide-scrollbar pb-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-zinc-800 text-white border shadow-lg' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                }`}
                style={isActive ? { 
                  borderColor: currentTheme.border, 
                  boxShadow: `0 0 12px ${currentTheme.glow}`,
                  backgroundColor: 'rgba(24, 24, 27, 0.95)'
                } : {}}
              >
                <Icon size={15} style={isActive ? { color: currentTheme.primary } : {}} className="flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="inline sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto pb-12">
        {activeTab === 'action' && <ActionCenterTab />}
        {activeTab === 'studio' && <StudioTab />}
        {activeTab === 'matrix' && <MatrixTab />}
        {activeTab === 'power' && <PowerRankingsTab />}
        {activeTab === 'rivalries' && <RivalriesTab />}
        {activeTab === 'records' && <RecordBookTab />}
        {activeTab === 'simulator' && <MatchupSimulatorTab />}
        {activeTab === 'team' && <TeamAnalyzerTab />}
        {activeTab === 'trade' && <TradeArchitectTab />}
        {activeTab === 'autopsy' && <AutopsyTab />}
      </div>

      {/* Fixed Persistent Breaking News Ticker */}
      <div className="fixed bottom-0 left-0 w-full bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.6)]">
        <div className="flex items-stretch h-9 sm:h-10">
          <div 
            className="text-zinc-950 font-black italic px-3 sm:px-4 flex items-center justify-center gap-1.5 z-20 shadow-md text-xs tracking-wider shrink-0"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <AlertTriangle size={15} className="stroke-[2.5]" /> 
            <span>BREAKING</span>
          </div>
          
          <div className="flex-1 overflow-hidden relative flex items-center bg-zinc-900/40">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10"></div>
            
            <div className="animate-marquee-slow whitespace-nowrap inline-flex items-center text-xs font-mono">
              {[...TICKER_MESSAGES, ...TICKER_MESSAGES].map((msg, i) => (
                <span key={i} className="text-zinc-300 inline-flex items-center">
                  <span className="mx-4 text-zinc-600">|</span>
                  {msg}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

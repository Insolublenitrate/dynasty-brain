"use client";

import React, { useState } from 'react';
import { 
  X, Settings, Palette, Database, Check, Sparkles, RefreshCw, AlertCircle, 
  Compass, ExternalLink, HelpCircle, Shield, ChevronDown, ChevronUp, Radio
} from 'lucide-react';
import { useTheme, THEME_CONFIGS, AccentColor } from '@/context/ThemeContext';
import { useLeague, LeaguePlatform } from '@/context/LeagueContext';
import { getApiUrl } from '@/config/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { accent, setAccent, carbonEnabled, setCarbonEnabled, playbookEnabled, setPlaybookEnabled } = useTheme();
  const { leagueId, platform, leagueName, setLeagueId } = useLeague();
  
  // Platform selection state
  const [selectedPlatform, setSelectedPlatform] = useState<LeaguePlatform>(platform || 'sleeper');
  const [inputLeagueId, setInputLeagueId] = useState(leagueId || '');
  const [season, setSeason] = useState(2024);
  
  // ESPN private credentials
  const [espnS2, setEspnS2] = useState('');
  const [swid, setSwid] = useState('');
  const [showEspnHelp, setShowEspnHelp] = useState(false);

  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleLinkLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = inputLeagueId.trim();
    if (!cleanId) return;

    setIsIngesting(true);
    setIngestStatus(null);

    try {
      let resolvedLeagueName = `${selectedPlatform.toUpperCase()} League`;
      let totalTeams = 10;

      // 1. Direct Client-Side Validation for Sleeper
      if (selectedPlatform === 'sleeper') {
        try {
          const sleeperRes = await fetch(`https://api.sleeper.app/v1/league/${cleanId}`);
          if (!sleeperRes.ok) {
            setIngestStatus({ 
              type: 'error', 
              message: 'Invalid Sleeper League ID. Please check the ID in your Sleeper app settings.' 
            });
            setIsIngesting(false);
            return;
          }
          const sleeperData = await sleeperRes.json();
          if (sleeperData && sleeperData.name) {
            resolvedLeagueName = sleeperData.name.trim();
            totalTeams = sleeperData.total_rosters || sleeperData.settings?.num_teams || 10;
          }
        } catch (sErr) {
          console.warn('Direct Sleeper API pre-check failed, continuing to backend ingest', sErr);
        }
      }

      // 2. Ingest via Backend
      const apiUrl = getApiUrl();
      const payload: any = {
        platform: selectedPlatform,
        league_id: cleanId,
        season: Number(season) || 2026,
      };

      if (selectedPlatform === 'espn') {
        if (espnS2.trim()) payload.espn_s2 = espnS2.trim();
        if (swid.trim()) payload.swid = swid.trim();
      }

      try {
        const res = await fetch(`${apiUrl}/api/leagues/link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            resolvedLeagueName = data.league_name || resolvedLeagueName;
            totalTeams = data.total_teams || totalTeams;
          } else if (data.error && selectedPlatform !== 'sleeper') {
            setIngestStatus({ type: 'error', message: data.error });
            setIsIngesting(false);
            return;
          }
        } else if (selectedPlatform === 'sleeper') {
          // Fallback to direct ingest endpoint if /link had server issue
          await fetch(`${apiUrl}/api/league/ingest/${cleanId}`, { method: 'POST' }).catch(() => {});
        }
      } catch (netErr: any) {
        console.warn('Backend sync encountered network delay', netErr);
        if (selectedPlatform !== 'sleeper' || resolvedLeagueName === 'SLEEPER League') {
          setIngestStatus({ 
            type: 'error', 
            message: `Connection error: ${netErr.message || 'Server unreachable'}` 
          });
          setIsIngesting(false);
          return;
        }
      }

      // 3. Save to context & LocalStorage
      setLeagueId(cleanId, selectedPlatform, resolvedLeagueName);
      setIngestStatus({ 
        type: 'success', 
        message: `Successfully connected ${resolvedLeagueName} (${totalTeams} teams)! Reloading...` 
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err: any) {
      setIngestStatus({ type: 'error', message: `Sync error: ${err.message || 'Could not complete league sync'}` });
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide text-white uppercase italic">
                WAR ROOM & LEAGUE SETTINGS
              </h3>
              <p className="text-[10px] font-mono text-zinc-400">Multi-Platform Ingestion & Visual Themes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* ========================================================================= */}
          {/* MULTI-PLATFORM LEAGUE LINKER */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Database size={14} className="text-orange-400" /> Link Fantasy League
              </label>
              {leagueName && (
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                  <Check size={10} /> {leagueName}
                </span>
              )}
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1 rounded-2xl border border-zinc-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedPlatform('sleeper')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 font-bold ${
                  selectedPlatform === 'sleeper'
                    ? 'bg-orange-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Sleeper</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('espn')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 font-bold ${
                  selectedPlatform === 'espn'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>ESPN</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('yahoo')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 font-bold ${
                  selectedPlatform === 'yahoo'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Yahoo</span>
              </button>
            </div>

            {/* Platform Specific Form */}
            <form onSubmit={handleLinkLeague} className="space-y-3 bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 font-mono text-xs">
              
              {/* League ID Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">
                  {selectedPlatform === 'sleeper' && 'Sleeper League ID'}
                  {selectedPlatform === 'espn' && 'ESPN League ID (From League URL)'}
                  {selectedPlatform === 'yahoo' && 'Yahoo League ID / Key'}
                </label>
                <input
                  type="text"
                  required
                  value={inputLeagueId}
                  onChange={(e) => setInputLeagueId(e.target.value)}
                  placeholder={
                    selectedPlatform === 'sleeper' ? 'e.g. 1312567432052760576' :
                    selectedPlatform === 'espn' ? 'e.g. 123456789' : 'e.g. 123456 or 449.l.123456'
                  }
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-xs"
                />
              </div>

              {/* Season Input (for ESPN / Yahoo) */}
              {selectedPlatform !== 'sleeper' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Season Year</label>
                  <input
                    type="number"
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                    placeholder="2024"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* ESPN Private League Cookie Option */}
              {selectedPlatform === 'espn' && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowEspnHelp(!showEspnHelp)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center justify-between w-full"
                  >
                    <span>Is your ESPN League Private? (Optional Cookies)</span>
                    {showEspnHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showEspnHelp && (
                    <div className="space-y-2 p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-[10px] text-zinc-300">
                      <p className="text-zinc-400">
                        Public ESPN leagues do not need cookies. For private leagues, copy your cookies from espn.com:
                      </p>
                      <div>
                        <label className="text-zinc-400 uppercase">espn_s2 Cookie Value</label>
                        <input
                          type="text"
                          value={espnS2}
                          onChange={(e) => setEspnS2(e.target.value)}
                          placeholder="Long string starting with AE..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white text-[10px] mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 uppercase">SWID Cookie Value</label>
                        <input
                          type="text"
                          value={swid}
                          onChange={(e) => setSwid(e.target.value)}
                          placeholder="{12345678-ABCD-...}"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white text-[10px] mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isIngesting || !inputLeagueId.trim()}
                className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
              >
                {isIngesting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Ingesting & Syncing...
                  </>
                ) : (
                  `Connect & Sync ${selectedPlatform.toUpperCase()} League`
                )}
              </button>

              {ingestStatus && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  ingestStatus.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{ingestStatus.message}</span>
                </div>
              )}

            </form>
          </div>

          {/* ========================================================================= */}
          {/* THEME & COLOR CUSTOMIZATION */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Palette size={14} className="text-orange-400" /> Visual Theme & Tactical Accent
              </label>
              <span className="text-xs font-bold text-orange-400 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30">
                {THEME_CONFIGS[accent].name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(THEME_CONFIGS) as AccentColor[]).map((themeKey) => {
                const config = THEME_CONFIGS[themeKey];
                const isSelected = accent === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setAccent(themeKey)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-zinc-800 text-white shadow-md border-orange-500'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div 
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-sm"
                      style={{ backgroundColor: config.primary }}
                    />
                    <span className="text-xs font-bold truncate">{config.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Coaches Playbook Toggle */}
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between mt-2">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Compass size={14} className="text-orange-400" /> Animated Coaches Playbook
                </div>
                <div className="text-[10px] text-zinc-400">
                  Render animated route lines, pre-snap motions, and chalkboard graphics
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlaybookEnabled(!playbookEnabled)}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  playbookEnabled ? 'bg-orange-500 justify-end' : 'bg-zinc-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Blindside Dynasty Engine v3.5 • Multi-Platform</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

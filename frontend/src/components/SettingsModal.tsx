"use client";

import React, { useState } from 'react';
import { X, Settings, Palette, Database, Check, Sparkles, RefreshCw, AlertCircle, Compass } from 'lucide-react';
import { useTheme, THEME_CONFIGS, AccentColor } from '@/context/ThemeContext';
import { useLeague } from '@/context/LeagueContext';

import { getApiUrl } from '@/config/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { accent, setAccent, carbonEnabled, setCarbonEnabled, playbookEnabled, setPlaybookEnabled } = useTheme();
  const { leagueId, setLeagueId } = useLeague();
  
  const [inputLeagueId, setInputLeagueId] = useState(leagueId || '');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputLeagueId.trim()) return;

    setIsIngesting(true);
    setIngestStatus(null);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/league/ingest/${inputLeagueId.trim()}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setLeagueId(inputLeagueId.trim());
        setIngestStatus({ type: 'success', message: 'League successfully ingested and switched!' });
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setLeagueId(inputLeagueId.trim());
        setIngestStatus({ type: 'success', message: 'League ID set! Reloading data...' });
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (err) {
      setLeagueId(inputLeagueId.trim());
      setIngestStatus({ type: 'success', message: 'Saved league ID locally.' });
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-subtle border border-accent flex items-center justify-center">
              <Settings size={18} className="text-accent" />
            </div>
            <h3 className="text-lg font-black tracking-wide text-white uppercase">Engine Settings</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Theme & Color Customization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Palette size={14} className="text-accent" /> Accent Color & Theme
              </label>
              <span className="text-xs font-bold text-accent px-2 py-0.5 rounded bg-accent-subtle border border-accent">
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
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      isSelected 
                        ? 'border-white bg-zinc-800 text-white shadow-lg ring-1 ring-white/50' 
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span 
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: config.primary, boxShadow: `0 0 8px ${config.glow}` }}
                    />
                    <span className="truncate">{config.name.split(' ')[0]}</span>
                    {isSelected && <Check size={14} className="ml-auto text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual FX Toggles */}
          <div className="space-y-3">
            {/* Animated Coaches Playbook Toggle */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass size={15} className="text-accent" /> Animated Coaches Playbook
                </div>
                <div className="text-xs text-zinc-400">
                  Render animated routes, pre-snap motions, and X's & O's
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlaybookEnabled(!playbookEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  playbookEnabled ? 'bg-orange-500 justify-end' : 'bg-zinc-700 justify-start'
                }`}
                style={playbookEnabled ? { backgroundColor: 'var(--accent-primary)' } : {}}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            {/* Carbon Background Toggle */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={15} className="text-accent" /> Carbon Weave Texture
                </div>
                <div className="text-xs text-zinc-400">
                  Render authentic carbon micro-pattern backdrop
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCarbonEnabled(!carbonEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  carbonEnabled ? 'bg-orange-500 justify-end' : 'bg-zinc-700 justify-start'
                }`}
                style={carbonEnabled ? { backgroundColor: 'var(--accent-primary)' } : {}}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>
          </div>

          {/* Sleeper League Configuration */}
          <form onSubmit={handleSaveLeague} className="space-y-3 pt-2 border-t border-zinc-800">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Database size={14} className="text-accent" /> Sleeper League ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputLeagueId}
                onChange={(e) => setInputLeagueId(e.target.value)}
                placeholder="e.g. 1103525203001847808"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
              <button
                type="submit"
                disabled={isIngesting || !inputLeagueId.trim()}
                className="px-4 py-2.5 rounded-xl font-bold text-sm bg-accent-subtle text-accent border border-accent hover:bg-accent-subtle/80 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isIngesting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Ingesting...
                  </>
                ) : (
                  'Switch'
                )}
              </button>
            </div>

            {ingestStatus && (
              <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-500">
          <span>Waiver WireTap Quant Engine v3.0</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

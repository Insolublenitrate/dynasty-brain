"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AccentColor = 'orange' | 'cyan' | 'emerald' | 'purple' | 'rose' | 'amber';

export interface ThemeConfig {
  id: AccentColor;
  name: string;
  primary: string;
  glow: string;
  border: string;
  subtle: string;
  text: string;
}

export const THEME_CONFIGS: Record<AccentColor, ThemeConfig> = {
  orange: {
    id: 'orange',
    name: 'Orange & Carbon (Default)',
    primary: '#f97316',
    glow: 'rgba(249, 115, 22, 0.4)',
    border: 'rgba(249, 115, 22, 0.3)',
    subtle: 'rgba(249, 115, 22, 0.1)',
    text: 'text-orange-500',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan',
    primary: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.4)',
    border: 'rgba(6, 182, 212, 0.3)',
    subtle: 'rgba(6, 182, 212, 0.1)',
    text: 'text-cyan-400',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    primary: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    border: 'rgba(16, 185, 129, 0.3)',
    subtle: 'rgba(16, 185, 129, 0.1)',
    text: 'text-emerald-400',
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)',
    border: 'rgba(168, 85, 247, 0.3)',
    subtle: 'rgba(168, 85, 247, 0.1)',
    text: 'text-purple-400',
  },
  rose: {
    id: 'rose',
    name: 'Crimson Strike',
    primary: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.4)',
    border: 'rgba(244, 63, 94, 0.3)',
    subtle: 'rgba(244, 63, 94, 0.1)',
    text: 'text-rose-400',
  },
  amber: {
    id: 'amber',
    name: 'Cyber Gold',
    primary: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    border: 'rgba(245, 158, 11, 0.3)',
    subtle: 'rgba(245, 158, 11, 0.1)',
    text: 'text-amber-400',
  },
};

interface ThemeContextType {
  accent: AccentColor;
  setAccent: (color: AccentColor) => void;
  carbonEnabled: boolean;
  setCarbonEnabled: (enabled: boolean) => void;
  playbookEnabled: boolean;
  setPlaybookEnabled: (enabled: boolean) => void;
  currentTheme: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType>({
  accent: 'orange',
  setAccent: () => {},
  carbonEnabled: true,
  setCarbonEnabled: () => {},
  playbookEnabled: true,
  setPlaybookEnabled: () => {},
  currentTheme: THEME_CONFIGS.orange,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>('orange');
  const [carbonEnabled, setCarbonEnabledState] = useState<boolean>(true);
  const [playbookEnabled, setPlaybookEnabledState] = useState<boolean>(true);

  useEffect(() => {
    const savedAccent = localStorage.getItem('dynasty_accent_color') as AccentColor;
    const savedCarbon = localStorage.getItem('dynasty_carbon_bg');
    const savedPlaybook = localStorage.getItem('dynasty_playbook_bg');

    if (savedAccent && THEME_CONFIGS[savedAccent]) {
      setAccentState(savedAccent);
    }
    if (savedCarbon !== null) {
      setCarbonEnabledState(savedCarbon === 'true');
    }
    if (savedPlaybook !== null) {
      setPlaybookEnabledState(savedPlaybook === 'true');
    }
  }, []);

  const setAccent = (color: AccentColor) => {
    setAccentState(color);
    localStorage.setItem('dynasty_accent_color', color);
    applyThemeCssVariables(color);
  };

  const setCarbonEnabled = (enabled: boolean) => {
    setCarbonEnabledState(enabled);
    localStorage.setItem('dynasty_carbon_bg', String(enabled));
  };

  const setPlaybookEnabled = (enabled: boolean) => {
    setPlaybookEnabledState(enabled);
    localStorage.setItem('dynasty_playbook_bg', String(enabled));
  };

  const applyThemeCssVariables = (color: AccentColor) => {
    const config = THEME_CONFIGS[color];
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--accent-primary', config.primary);
      root.style.setProperty('--accent-glow', config.glow);
      root.style.setProperty('--accent-border', config.border);
      root.style.setProperty('--accent-subtle', config.subtle);
    }
  };

  useEffect(() => {
    applyThemeCssVariables(accent);
  }, [accent]);

  const currentTheme = THEME_CONFIGS[accent] || THEME_CONFIGS.orange;

  return (
    <ThemeContext.Provider
      value={{
        accent,
        setAccent,
        carbonEnabled,
        setCarbonEnabled,
        playbookEnabled,
        setPlaybookEnabled,
        currentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

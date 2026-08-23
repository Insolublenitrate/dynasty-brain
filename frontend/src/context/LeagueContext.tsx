"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '@/config/api';

const DEFAULT_LEAGUE_ID = '1312567432052760576';
const DEFAULT_PLATFORM = 'sleeper';

export type LeaguePlatform = 'sleeper' | 'espn' | 'yahoo';

type LeagueContextType = {
  leagueId: string | null;
  platform: LeaguePlatform;
  leagueName: string | null;
  setLeagueId: (id: string, platform?: LeaguePlatform, name?: string) => void;
  setPlatform: (platform: LeaguePlatform) => void;
  isLoading: boolean;
};

const LeagueContext = createContext<LeagueContextType>({
  leagueId: DEFAULT_LEAGUE_ID,
  platform: DEFAULT_PLATFORM,
  leagueName: null,
  setLeagueId: () => {},
  setPlatform: () => {},
  isLoading: false,
});

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const [leagueId, setLeagueIdState] = useState<string>(DEFAULT_LEAGUE_ID);
  const [platform, setPlatformState] = useState<LeaguePlatform>(DEFAULT_PLATFORM);
  const [leagueName, setLeagueName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('dynasty_league_id');
    const storedPlatform = (localStorage.getItem('dynasty_platform') as LeaguePlatform) || DEFAULT_PLATFORM;
    const storedName = localStorage.getItem('dynasty_league_name');

    const activeLeagueId = stored || DEFAULT_LEAGUE_ID;
    const activePlatform = storedPlatform || DEFAULT_PLATFORM;

    setLeagueIdState(activeLeagueId);
    setPlatformState(activePlatform);
    if (storedName) setLeagueName(storedName);

    const verifyAndIngest = async (id: string, plat: LeaguePlatform) => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${id}`);
        const data = await res.json();
        
        // If empty, trigger platform ingestion
        if (data.error && data.error.includes("No rosters found")) {
          console.log(`Ingesting ${plat} league data for ${id}...`);
          if (plat === 'sleeper') {
            await fetch(`${apiUrl}/api/league/ingest/${id}`, { method: 'POST' });
          } else {
            await fetch(`${apiUrl}/api/leagues/link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ platform: plat, league_id: id })
            });
          }
        }
      } catch (e) {
        console.error("Backend verification failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndIngest(activeLeagueId, activePlatform);
  }, []);

  const setLeagueId = (id: string, newPlatform: LeaguePlatform = 'sleeper', name?: string) => {
    localStorage.setItem('dynasty_league_id', id);
    localStorage.setItem('dynasty_platform', newPlatform);
    if (name) {
      localStorage.setItem('dynasty_league_name', name);
      setLeagueName(name);
    }
    setLeagueIdState(id);
    setPlatformState(newPlatform);
  };

  const setPlatform = (newPlatform: LeaguePlatform) => {
    localStorage.setItem('dynasty_platform', newPlatform);
    setPlatformState(newPlatform);
  };

  return (
    <LeagueContext.Provider value={{ leagueId, platform, leagueName, setLeagueId, setPlatform, isLoading }}>
      {children}
    </LeagueContext.Provider>
  );
}

export const useLeague = () => useContext(LeagueContext);

"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '@/config/api';

const DEFAULT_LEAGUE_ID = '1103525203001847808';

type LeagueContextType = {
  leagueId: string | null;
  setLeagueId: (id: string) => void;
  isLoading: boolean;
};

const LeagueContext = createContext<LeagueContextType>({
  leagueId: DEFAULT_LEAGUE_ID,
  setLeagueId: () => {},
  isLoading: false,
});

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const [leagueId, setLeagueIdState] = useState<string>(DEFAULT_LEAGUE_ID);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('dynasty_league_id');
    const activeLeagueId = stored || DEFAULT_LEAGUE_ID;
    
    setLeagueIdState(activeLeagueId);

    const verifyAndIngest = async (id: string) => {
      try {
        const apiUrl = getApiUrl();
        // Ping the matrix endpoint to see if data exists
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${id}`);
        const data = await res.json();
        
        // If the database was wiped or empty, auto-ingest sleeper data
        if (data.error && data.error.includes("No rosters found")) {
          console.log("Empty database detected. Ingesting sleeper league data...");
          await fetch(`${apiUrl}/api/league/ingest/${id}`, { method: 'POST' });
        }
      } catch (e) {
        console.error("Backend verification failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndIngest(activeLeagueId);
  }, []);

  const setLeagueId = (id: string) => {
    localStorage.setItem('dynasty_league_id', id);
    setLeagueIdState(id);
  };

  return (
    <LeagueContext.Provider value={{ leagueId, setLeagueId, isLoading }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  return useContext(LeagueContext);
}

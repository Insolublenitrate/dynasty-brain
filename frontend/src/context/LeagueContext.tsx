"use client";

import { createContext, useContext, useState, useEffect } from 'react';

type LeagueContextType = {
  leagueId: string | null;
  setLeagueId: (id: string) => void;
  isLoading: boolean;
};

const LeagueContext = createContext<LeagueContextType>({
  leagueId: null,
  setLeagueId: () => {},
  isLoading: true,
});

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const [leagueId, setLeagueIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('dynasty_league_id');
    
    const verifyAndIngest = async (id: string) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        // Ping the matrix endpoint to see if data exists
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${id}`);
        const data = await res.json();
        
        // If the database was wiped by the free tier host, silently re-ingest
        if (data.error && data.error.includes("No rosters found")) {
          console.log("Free tier database wipe detected. Auto-ingesting sleeper data...");
          await fetch(`${apiUrl}/api/league/ingest/${id}`, { method: 'POST' });
        }
      } catch (e) {
        console.error("Backend verification failed", e);
      }
    };

    if (stored) {
      setLeagueIdState(stored);
      verifyAndIngest(stored).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
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

"use client";

import { createContext, useContext, useState, useEffect } from 'react';

type LeagueContextType = {
  leagueId: string | null;
  setLeagueId: (id: string) => void;
  seasonYear: string;
  setSeasonYear: (year: string) => void;
  isLoading: boolean;
};

const LeagueContext = createContext<LeagueContextType>({
  leagueId: null,
  setLeagueId: () => {},
  seasonYear: "2026",
  setSeasonYear: () => {},
  isLoading: true,
});

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const [leagueId, setLeagueIdState] = useState<string | null>(null);
  const [seasonYear, setSeasonYearState] = useState<string>("2026");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedLeague = localStorage.getItem('dynasty_league_id');
    const storedYear = localStorage.getItem('dynasty_season_year');
    
    if (storedYear) {
      if (['2026', '2025', '2024', '2023', '2022', '2021', '2020', 'All'].includes(storedYear)) {
        setSeasonYearState(storedYear);
      } else {
        setSeasonYearState('2026');
        localStorage.setItem('dynasty_season_year', '2026');
      }
    }

    const verifyAndIngest = async (id: string) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/quant/matrix?league_id=${id}`);
        const data = await res.json();
        
        if (data.error && data.error.includes("No rosters found")) {
          console.log("Free tier database wipe detected. Auto-ingesting sleeper data...");
          await fetch(`${apiUrl}/api/league/ingest/${id}`, { method: 'POST' });
        }
      } catch (e) {
        console.error("Backend verification failed", e);
      }
    };

    if (storedLeague) {
      setLeagueIdState(storedLeague);
      verifyAndIngest(storedLeague).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const setLeagueId = (id: string) => {
    localStorage.setItem('dynasty_league_id', id);
    setLeagueIdState(id);
  };

  const setSeasonYear = (year: string) => {
    localStorage.setItem('dynasty_season_year', year);
    setSeasonYearState(year);
  };

  return (
    <LeagueContext.Provider value={{ leagueId, setLeagueId, seasonYear, setSeasonYear, isLoading }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  return useContext(LeagueContext);
}

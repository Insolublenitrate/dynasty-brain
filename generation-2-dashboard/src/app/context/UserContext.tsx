"use client";

import { createContext, useContext, useState, useEffect } from 'react';

type UserContextType = {
  sleeperId: string | null;
  setSleeperId: (id: string | null) => void;
};

const UserContext = createContext<UserContextType>({
  sleeperId: null,
  setSleeperId: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [sleeperId, setSleeperIdState] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('madden_sleeper_id');
    if (stored) {
      setSleeperIdState(stored);
    }
  }, []);

  const setSleeperId = (id: string | null) => {
    if (id) {
      localStorage.setItem('madden_sleeper_id', id);
    } else {
      localStorage.removeItem('madden_sleeper_id');
    }
    setSleeperIdState(id);
  };

  if (!isMounted) return null; // Prevent hydration mismatch

  return (
    <UserContext.Provider value={{ sleeperId, setSleeperId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

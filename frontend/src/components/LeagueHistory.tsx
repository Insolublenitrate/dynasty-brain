"use client";
import React, { useEffect, useState } from 'react';
import { Trophy, Frown, CalendarDays } from 'lucide-react';
import { useLeague } from '@/context/LeagueContext';


interface LeagueHistoryRecord {
  season: string;
  champion: string;
  second_place: string;
  third_place: string;
  worst_performer: string;
}

export default function LeagueHistory() {
  const { leagueId } = useLeague();
  const [history, setHistory] = useState<LeagueHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!leagueId) return;
      try {
        setLoading(true);
        // Direct fetch or use api client if configured for this endpoint
        const response = await fetch(`https://dynasty-brain.onrender.com/api/quant/league-history/${leagueId}`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error("Failed to load league history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8 animate-pulse flex items-center justify-center min-h-[150px]">
        <p className="text-zinc-500">Loading League History...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          League Record Book
        </h3>
        <p className="text-xs text-zinc-400 mt-1">A timeline of your league's past champions and last place finishers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {history.map((record) => (
          <div key={record.season} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 relative overflow-hidden group">
            {/* Year Badge */}
            <div className="absolute top-0 right-0 bg-zinc-800 text-zinc-400 text-xs font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
              <CalendarDays size={12} /> {record.season}
            </div>
            
            <div className="space-y-4 mt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-500 shrink-0">
                  <Trophy size={16} />
                </div>
                <div>
                  <p className="text-xs text-yellow-500 font-semibold uppercase tracking-wider">Champion</p>
                  <p className="text-sm font-bold text-white truncate max-w-[150px]" title={record.champion}>
                    {record.champion}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-zinc-300/10 rounded-full text-zinc-300 shrink-0">
                  <Trophy size={14} />
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">2nd Place</p>
                  <p className="text-sm font-medium text-zinc-200 truncate max-w-[150px]" title={record.second_place}>
                    {record.second_place}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-700/10 rounded-full text-amber-600 shrink-0">
                  <Trophy size={14} />
                </div>
                <div>
                  <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">3rd Place</p>
                  <p className="text-sm font-medium text-zinc-200 truncate max-w-[150px]" title={record.third_place}>
                    {record.third_place}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-zinc-800 rounded-full text-zinc-500 shrink-0">
                  <Frown size={16} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Last Place</p>
                  <p className="text-sm font-medium text-zinc-300 truncate max-w-[150px]" title={record.worst_performer}>
                    {record.worst_performer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

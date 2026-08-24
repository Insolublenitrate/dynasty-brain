"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/context/LeagueContext';
import { ShieldAlert, Database, Loader2 } from 'lucide-react';

export default function Login() {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setLeagueId } = useLeague();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode) return;
    
    setLoading(true);
    setError('');

    try {
      // 1. Direct Sleeper check
      let leagueName = 'Sleeper League';
      try {
        const sRes = await fetch(`https://api.sleeper.app/v1/league/${inputCode.trim()}`);
        if (!sRes.ok) {
          setError('Invalid Sleeper League ID. Please verify your ID in the Sleeper app.');
          setLoading(false);
          return;
        }
        const sData = await sRes.json();
        if (sData?.name) leagueName = sData.name.trim();
      } catch (sErr) {
        console.warn('Direct Sleeper check skipped', sErr);
      }

      // 2. Backend Ingest
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
      try {
        const res = await fetch(`${apiUrl}/api/league/ingest/${inputCode.trim()}`, {
          method: 'POST',
        });
        const data = await res.json().catch(() => ({}));
        if (data.league_name) leagueName = data.league_name;
      } catch (bErr) {
        console.warn('Backend ingest will run on next request', bErr);
      }
      
      setLeagueId(inputCode.trim(), 'sleeper', leagueName);
      router.push('/');
    } catch (err) {
      setError('Network error connecting to Sleeper API.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-500/20 p-4 rounded-full">
              <Database className="text-amber-500" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Waiver WireTap</h1>
          <p className="text-zinc-400">Initialize your Quant Engine.</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 flex gap-3 text-rose-500 text-sm">
            <ShieldAlert size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="leagueId" className="block text-sm font-medium text-zinc-300">
              Sleeper League ID
            </label>
            <input
              id="leagueId"
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="e.g. 1312567432052760576"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputCode}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Ingesting Sleeper Data...
              </>
            ) : (
              'Initialize Dashboard'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 pt-4">
          Data extraction takes approximately 5-10 seconds depending on league size and trading history.
        </p>
      </div>
    </div>
  );
}

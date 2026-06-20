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
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://dynasty-brain.onrender.com').replace(/\/+$/, '');
      const res = await fetch(`${apiUrl}/api/league/ingest/${inputCode}`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        setLeagueId(inputCode);
        router.push('/');
      } else {
        setError(data.error || 'Failed to ingest league data. Check your League ID.');
      }
    } catch (err) {
      setError('Network error connecting to backend.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-500/20 p-4 rounded-full">
              <Database className="text-indigo-500" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">DynastyBrain</h1>
          <p className="text-slate-400">Initialize your Quant Engine.</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 flex gap-3 text-rose-500 text-sm">
            <ShieldAlert size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="leagueId" className="block text-sm font-medium text-slate-300">
              Sleeper League ID
            </label>
            <input
              id="leagueId"
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="e.g. 1312567432052760576"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputCode}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        <p className="text-center text-xs text-slate-500 pt-4">
          Data extraction takes approximately 5-10 seconds depending on league size and trading history.
        </p>
      </div>
    </div>
  );
}

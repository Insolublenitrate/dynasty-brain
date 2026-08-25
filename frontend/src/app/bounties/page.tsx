"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BountiesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dynasty-room?arena=command&sub=bounties');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
      <p className="font-mono text-xs text-zinc-400 uppercase tracking-wider animate-pulse">
        Opening High-Stakes Bounty Vault...
      </p>
    </div>
  );
}


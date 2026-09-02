"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlayersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dynasty-room?arena=players");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Players Arena...</p>
    </div>
  );
}


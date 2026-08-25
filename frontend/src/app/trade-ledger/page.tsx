"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TradeLedgerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dynasty-room?arena=trade&sub=trends');
  }, [router]);

  return (
    <div className="flex justify-center items-center py-32">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
    </div>
  );
}

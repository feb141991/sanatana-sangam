'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlansError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[NityaPlans] client error:', error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 pb-24 gap-5"
      style={{ background: '#120d07' }}
    >
      <span className="text-4xl">🗺️</span>
      <p className="text-base font-semibold text-center" style={{ color: 'rgba(245,225,185,0.9)' }}>
        Plans couldn&apos;t load
      </p>
      <p className="text-xs text-center max-w-xs" style={{ color: 'rgba(200,165,110,0.6)' }}>
        {error.message || 'A rendering error occurred. Please try again.'}
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="rounded-full px-5 py-2.5 text-sm font-semibold"
          style={{ background: '#C5A059', color: '#1c1208' }}
        >
          Try again
        </button>
        <button
          onClick={() => router.push('/nitya-karma')}
          className="rounded-full px-5 py-2.5 text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(245,225,185,0.8)' }}
        >
          Go back
        </button>
      </div>
    </div>
  );
}

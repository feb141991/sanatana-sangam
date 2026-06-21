'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandMark from '@/components/BrandMark';
import { createClient } from '@/lib/supabase';

function safeNext(rawNext: string | null) {
  if (!rawNext || !rawNext.startsWith('/') || rawNext.startsWith('//')) return '/home';
  return rawNext;
}

export default function AuthContinuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [message, setMessage] = useState('Opening Shoonaya...');

  useEffect(() => {
    let cancelled = false;
    const next = safeNext(searchParams.get('next'));

    async function continueAuth() {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session && !error) {
          router.replace(next);
          router.refresh();
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 180));
      }

      if (!cancelled) {
        setMessage('We could not finish sign in. Please try again.');
        router.replace('/login?error=session_missing');
      }
    }

    continueAuth();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, supabase]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--divine-bg)] px-6 text-center">
      <div className="space-y-4">
        <BrandMark />
        <p className="text-sm font-medium text-[var(--brand-muted)]">{message}</p>
      </div>
    </main>
  );
}

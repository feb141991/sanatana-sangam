'use client';

import { useEffect, useState } from 'react';
import { reportClientError } from '@/lib/client-error-reporter';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [incidentId, setIncidentId] = useState<string | null>(null);

  useEffect(() => {
    void reportClientError({ source: 'react_root', error }).then(setIncidentId);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--surface-base)] text-[var(--text-cream)]">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand-primary)]">Shoonaya</p>
          <h1 className="font-serif text-3xl font-semibold">This page needs a fresh start</h1>
          <p className="text-[var(--text-muted-warm)]">The problem has been recorded without your personal information.</p>
          {incidentId && <p className="text-xs text-[var(--text-muted-warm)]">Incident {incidentId}</p>}
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-full bg-[var(--brand-primary)] px-6 font-semibold text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

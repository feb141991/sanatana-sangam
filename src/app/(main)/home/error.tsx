'use client';

import { useEffect, useState } from 'react';
import { reportClientError } from '@/lib/client-error-reporter';
import { isChunkLoadError, recoverFromChunkLoadError } from '@/lib/chunk-load-recovery';

export default function HomeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [incidentId, setIncidentId] = useState<string | null>(null);

  const staleBuild = isChunkLoadError(error);

  useEffect(() => {
    if (recoverFromChunkLoadError(error)) return;
    void reportClientError({ source: 'react_home', error }).then(setIncidentId);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand-primary)]">Home</p>
      <h1 className="font-serif text-3xl font-semibold text-[var(--text-cream)]">We could not open your home</h1>
      <p className="max-w-sm text-[var(--text-muted-warm)]">Your account is safe. The technical details were recorded without personal information.</p>
      {incidentId && <p className="text-xs text-[var(--text-muted-warm)]">Incident {incidentId}</p>}
      <button
        type="button"
        onClick={staleBuild ? () => window.location.reload() : reset}
        className="min-h-11 rounded-full bg-[var(--brand-primary)] px-6 font-semibold text-white"
      >
        {staleBuild ? 'Reload page' : 'Try Home again'}
      </button>
    </section>
  );
}

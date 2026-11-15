'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/client-error-reporter';
import { recoverFromChunkLoadError } from '@/lib/chunk-load-recovery';

export default function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      // A stale page asking for a chunk the new deploy no longer has: reload once instead of reporting a crash.
      if (recoverFromChunkLoadError(event.error ?? event.message)) return;
      void reportClientError({
        source: 'window_error',
        error: event.error instanceof Error ? event.error : new Error(event.message || 'Script error'),
      });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (recoverFromChunkLoadError(event.reason)) return;
      void reportClientError({ source: 'unhandled_rejection', error: event.reason });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}

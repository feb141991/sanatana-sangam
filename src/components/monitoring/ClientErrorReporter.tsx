'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/client-error-reporter';

export default function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void reportClientError({
        source: 'window_error',
        error: event.error instanceof Error ? event.error : new Error(event.message || 'Script error'),
      });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
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

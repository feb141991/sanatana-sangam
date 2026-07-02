'use client';

/**
 * TraditionSync — bridges server-fetched tradition into client-side storage.
 *
 * Mounted once in (main)/layout.tsx. Runs a single useEffect on mount to:
 *   1. Write tradition to localStorage so it survives page refreshes and
 *      can be read synchronously before React hydrates (cold-start fix).
 *   2. Set data-tradition on <html> so CSS rules can respond immediately.
 *
 * This component renders nothing.
 */

import { useEffect } from 'react';

export function TraditionSync({ tradition }: { tradition: string }) {
  useEffect(() => {
    if (!tradition) return;
    try {
      localStorage.setItem('sh_tradition', tradition);
      document.documentElement.setAttribute('data-tradition', tradition);
    } catch {
      // localStorage blocked (private mode etc.) — silently skip
    }
  }, [tradition]);

  return null;
}

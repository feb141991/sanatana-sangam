'use client';

import { useState } from 'react';
import { SacredLoader } from '@/components/ui/SacredLoader';

/**
 * Main-layout route loading fallback.
 * Reads tradition synchronously from the `data-tradition` attribute
 * stamped on <html> by our inline cold-start script — no flicker.
 */
export default function MainLoading() {
  const [tradition] = useState<string | null>(() => {
    if (typeof document === 'undefined') return null;
    return document.documentElement.getAttribute('data-tradition') || null;
  });

  return <SacredLoader variant="splash" tradition={tradition} />;
}

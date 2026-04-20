'use client';

import { useState, useEffect } from 'react';
import { getIsPro } from '@/lib/premium';

/** Returns true if the user has activated Sangam Pro. */
export function usePremium(): boolean {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    // Initialise from localStorage on mount
    setIsPro(getIsPro());

    // Re-sync when premium state changes from any tab / component
    function onChanged() { setIsPro(getIsPro()); }
    window.addEventListener('sangam_pro_changed', onChanged);
    window.addEventListener('storage', onChanged); // cross-tab
    return () => {
      window.removeEventListener('sangam_pro_changed', onChanged);
      window.removeEventListener('storage', onChanged);
    };
  }, []);

  return isPro;
}

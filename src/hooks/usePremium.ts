'use client';

import { useState, useEffect, useRef } from 'react';
import { getIsPro } from '@/lib/premium';
import { createClient } from '@/lib/supabase';

/** Returns true if the user has activated Shoonaya Pro. LocalStorage is used for optimistic UI, but DB is authoritative. */
export function usePremium(): boolean {
  const [isPro, setIsPro] = useState(false);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    // 1. Initialise optimistically from localStorage on mount so UI doesn't blink locked
    setIsPro(getIsPro());

    // 2. Authoritative check against the DB
    async function checkDB() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
      if (data) {
        setIsPro(!!data.is_pro);
        // Sync local storage with DB truth
        if (data.is_pro) {
          window.localStorage.setItem('sangam_pro_activated', 'true');
        } else {
          window.localStorage.removeItem('sangam_pro_activated');
        }
      }
    }
    checkDB();

    // Re-sync when premium state changes from any tab / component
    function onChanged() { setIsPro(getIsPro()); }
    window.addEventListener('sangam_pro_changed', onChanged);
    window.addEventListener('storage', onChanged); // cross-tab
    return () => {
      window.removeEventListener('sangam_pro_changed', onChanged);
      window.removeEventListener('storage', onChanged);
    };
  }, [supabase]);

  return isPro;
}

'use client';

// Handles the implicit OAuth flow where Supabase returns
// #access_token=... in the URL hash instead of ?code=
// Reads the token, gets the user, registers on waitlist, redirects to landing.

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function SthapakaCallbackPage() {
  useEffect(() => {
    async function handle() {
      const hash = window.location.hash;

      // If there's a code in the query string, the server route.ts handles it.
      // If there's an access_token in the hash, we handle it here.
      if (!hash.includes('access_token=')) {
        // No hash token — server route already handled or will handle via redirect
        return;
      }

      try {
        const supabase = createClient();

        // Let Supabase parse the hash and establish the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        // If session not set yet, give it a moment (hash processing is async)
        let user = session?.user;
        if (!user) {
          await new Promise(r => setTimeout(r, 800));
          const { data: { user: u } } = await supabase.auth.getUser();
          user = u ?? undefined;
        }

        if (!user?.email) {
          window.location.href = '/?sthapaka_error=auth_failed';
          return;
        }

        const email = user.email;
        const name  = user.user_metadata?.full_name || user.user_metadata?.name || '';

        // Register on waitlist via server API
        const res  = await fetch('/api/sthapaka-register', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, name }),
        });
        const data = await res.json();

        if (!res.ok || !data.foundingNumber) {
          window.location.href = '/?sthapaka_error=server_error';
          return;
        }

        const params = new URLSearchParams({
          sthapaka_registered: '1',
          num:  String(data.foundingNumber),
          name: name,
        });
        window.location.href = '/?' + params.toString();

      } catch (err) {
        console.error('[sthapaka-callback page]', err);
        window.location.href = '/?sthapaka_error=server_error';
      }
    }

    handle();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0c0a07',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ fontSize: '36px' }}>🙏</div>
      <div style={{ color: 'rgba(245,236,215,0.7)', fontSize: '15px', letterSpacing: '0.06em' }}>
        Setting up your Sthapaka account…
      </div>
    </div>
  );
}

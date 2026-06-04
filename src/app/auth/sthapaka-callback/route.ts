import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// ─── /auth/sthapaka-callback ──────────────────────────────────────────────
// OAuth callback specifically for the landing page Sthapaka Google sign-up.
//
// Flow:
//   1. Google OAuth redirects here with ?code=
//   2. Exchange code → get user session + email
//   3. Register email on the waitlist (or fetch existing founding number)
//   4. Redirect back to / with ?sthapaka_registered=1&num=N&name=X
//      so the landing page can show the founding number reveal
// ─────────────────────────────────────────────────────────────────────────────

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/?sthapaka_error=no_code`);
  }

  try {
    // ── 1. Exchange code for session ─────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
      .then(() => supabase.auth.getUser());

    if (authError || !user?.email) {
      return NextResponse.redirect(`${origin}/?sthapaka_error=auth_failed`);
    }

    const email = user.email.toLowerCase().trim();
    const name  = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const tradition = null; // will be selected on landing page after callback

    // ── 2. Check existing waitlist registration ────────────────────────
    const { data: existing } = await serviceSupabase
      .from('waitlist')
      .select('id, founding_number, tradition')
      .ilike('email', email)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    let foundingNumber: number;

    if (existing) {
      // Already registered — just get/ensure founding number
      if (existing.founding_number) {
        foundingNumber = existing.founding_number;
      } else {
        // Assign a founding number
        const { data: latest } = await serviceSupabase
          .from('waitlist')
          .select('founding_number')
          .not('founding_number', 'is', null)
          .order('founding_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        foundingNumber = ((latest?.founding_number as number | null) ?? 0) + 1;
        await serviceSupabase
          .from('waitlist')
          .update({ founding_number: foundingNumber, name: name || undefined })
          .eq('id', existing.id)
          .is('founding_number', null);
      }
    } else {
      // New registration
      const { data: inserted } = await serviceSupabase
        .from('waitlist')
        .insert({ email, name: name || null, tradition, source: 'google_oauth' })
        .select('id, founding_number')
        .single();

      if (inserted?.founding_number) {
        foundingNumber = inserted.founding_number;
      } else {
        // Assign number manually
        const { data: latest } = await serviceSupabase
          .from('waitlist')
          .select('founding_number')
          .not('founding_number', 'is', null)
          .order('founding_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        foundingNumber = ((latest?.founding_number as number | null) ?? 0) + 1;
        if (inserted?.id) {
          await serviceSupabase
            .from('waitlist')
            .update({ founding_number: foundingNumber })
            .eq('id', inserted.id);
        }
      }
    }

    // ── 3. Redirect back to landing with founding number in query ─────────
    const params = new URLSearchParams({
      sthapaka_registered: '1',
      num:  String(foundingNumber),
      name: name || '',
    });
    return NextResponse.redirect(`${origin}/?${params.toString()}`);

  } catch (err) {
    console.error('[sthapaka-callback] Error:', err);
    return NextResponse.redirect(`${origin}/?sthapaka_error=server_error`);
  }
}

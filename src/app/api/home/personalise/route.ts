import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';
import { generateDailyPersonalisation } from '@/lib/daily-personalise';

// GET /api/home/personalise
// Returns today's personalised shloka + practice suggestion for the authenticated user.
// Checks the recommendations cache first; generates via the active Pramana provider if stale.

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // ── 0. Fetch timezone for spiritual date ─────────────────────────────────────
    const { data: tzRow } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();

    // Spiritual day: starts at 4 AM local time, not midnight UTC
    const today = localSpiritualDate(tzRow?.timezone, 4);

    // ── 1. Check recommendations cache ──────────────────────────────────────────
    const { data: cached } = await supabase
      .from('recommendations')
      .select('content')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('type', 'daily_content')
      .maybeSingle();

    if (cached?.content) {
      const c = cached.content as Record<string, unknown>;
      if (c?.suggestion) {
        return NextResponse.json({ ...c, from_cache: true });
      }
    }

    // ── 2. Fetch user profile ────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('tradition, sampradaya, spiritual_level, seeking, full_name, username, consent_religious_data')
      .eq('id', user.id)
      .maybeSingle();

    // Religious-data consent: suppress tradition/spiritual_level from
    // personalization (not deletion) when withdrawn -- fall back to the same
    // neutral defaults already used when no tradition is set at all.
    const religiousDataConsented = profile?.consent_religious_data !== false;
    const rawTradition = religiousDataConsented ? (profile?.tradition ?? 'general') : 'general';
    const level = religiousDataConsented ? (profile?.spiritual_level ?? 'beginner') : 'beginner';
    const name = profile?.full_name ?? profile?.username ?? 'Seeker';

    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: tzRow?.timezone ?? 'Asia/Kolkata',
    }).format(new Date());

    // ── 3. Generate via shared service ───────────────────────────────────────────
    const { payload: parsed } = await generateDailyPersonalisation({
      name,
      tradition: rawTradition,
      level,
      seeking: profile?.seeking,
      dayOfWeek,
      dateIso: today,
      routeContext: '/api/home/personalise',
    });

    // ── 4. Cache result ──────────────────────────────────────────────────────────
    await supabase.from('recommendations').upsert(
      { user_id: user.id, date: today, type: 'daily_content', content: parsed, generated_at: new Date().toISOString() },
      { onConflict: 'user_id,date,type' }
    ).then(({ error }) => { if (error) console.warn('[personalise] cache write failed:', error.message); });

    return NextResponse.json({ ...parsed, from_cache: false });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Personalise failed' }, { status: 500 });
  }
}

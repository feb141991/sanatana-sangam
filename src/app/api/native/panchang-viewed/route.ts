import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { localSpiritualDate } from '@/lib/sacred-time';

// GET/POST /api/native/panchang-viewed
//
// Marks today's Panchang/Tithi as observed/read — a completion action that,
// per docs/NATIVE_DAILY_COMPLETION_MATRIX.md's own audit, did not exist on
// either platform before this route (the audit's recommendation was
// explicitly "do not invent this action" absent a product request; this
// route exists because a later prompt explicitly requested it).
//
// Storage: the existing daily_sadhana.panchang_viewed boolean column
// (already present in the schema, previously unused by any live route —
// see supabase/public_schema.sql). No new table, per this task's own rule.
// This column is NOT one of the five booleans /api/sadhana/perfect-day
// reads (japa_done/quiz_done/nitya_done/pathshala_done/dharmveer_done), so
// this route does not touch or extend the P0-3 perfect-day exploit surface
// documented in the completion matrix.
//
// Auth: getApiUser (Bearer for native, cookie for web) — the authenticated
// user id is resolved server-side from the verified JWT and is the only
// user_id ever written; no client-supplied user_id is trusted or accepted.
//
// Idempotency: upsert on the existing (user_id, date) unique constraint
// with a fixed `panchang_viewed: true` value — calling POST any number of
// times for the same day converges to the same row state, no duplicate
// rows, no double side effects (this route has no reward/points side effect
// at all, unlike japa/quiz/nitya-karma completion).

export const runtime = 'nodejs';

async function resolveToday(supabase: Awaited<ReturnType<typeof getApiUser>>['supabase'], userId: string) {
  const { data: profile } = await supabase!
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .maybeSingle();
  return localSpiritualDate(profile?.timezone ?? 'UTC', 4);
}

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const today = await resolveToday(supabase, user.id);

    const { data, error } = await supabase
      .from('daily_sadhana')
      .select('panchang_viewed')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ viewedToday: Boolean(data?.panchang_viewed) });
  } catch (err: unknown) {
    console.error('[GET /api/native/panchang-viewed] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const today = await resolveToday(supabase, user.id);

    // P0-3: daily_sadhana.panchang_viewed is no longer directly writable by
    // authenticated/anon — routed through the ownership-checked RPC.
    const { error } = await supabase.rpc('mark_panchang_viewed', {
      p_user_id: user.id,
      p_date: today,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, viewedToday: true });
  } catch (err: unknown) {
    console.error('[POST /api/native/panchang-viewed] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

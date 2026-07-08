import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { getDharmVeerBySlug } from '@/lib/dharm-veer-db';
import { localSpiritualDate } from '@/lib/sacred-time';

// POST /api/dharm-veer/submit
//
// Server-backed Dharm Veer completion evidence. Previously the only record
// of a Dharm Veer "completion" was daily_sadhana.dharmveer_done, set by a
// direct client upsert/RPC call with nothing behind it but ownership —
// there was no way to prove a user actually read or swiped a hero at all
// (see docs/NATIVE_DAILY_COMPLETION_P0_REMEDIATION_PLAN.md's Open Question,
// and the header comment on
// supabase/migrations/20260708170000_dharm_veer_responses.sql). This route
// is the single write path into the new dharm_veer_responses table, and is
// what makes a Dharm Veer completion independently verifiable:
//   - heroId is validated against the canonical roster (DB + static
//     fallback, via the same getDharmVeerBySlug() every other Dharm Veer
//     surface already uses) — an attacker cannot log a response for a hero
//     that doesn't exist, which would otherwise let them farm rows with
//     junk hero ids.
//   - user_id is taken from the authenticated session only (getApiUser),
//     never from the request body — a caller cannot log a response for
//     another user.
//   - spiritual_date is computed server-side from the user's own
//     profiles.timezone, never taken from the request body — a caller
//     cannot backdate or forward-date a response.
// RLS on dharm_veer_responses (owner-only INSERT/SELECT, no UPDATE/DELETE
// policy at all) is the second, independent layer: even if this route had
// a bug, the underlying table still refuses to let any user write a row
// for someone else.
//
// daily_sadhana.dharmveer_done is still kept in sync via complete_dharmveer
// (unchanged RPC from the P0-3 migration) purely for display purposes
// (Home, my-progress, Kul hub, native home/progress-summary, weekly-summary
// cron, streak-freeze eligibility all read it) — but it is no longer the
// source of truth for anything reward-bearing; see
// /api/sadhana/perfect-day, which now reads dharm_veer_responses directly.

export const runtime = 'nodejs';

const VALID_DECISIONS = new Set(['inspired', 'skip', 'share']);
const VALID_PRIVACY = new Set(['private', 'community']);
const VALID_MOODS = new Set(['gratitude', 'devotion', 'peace', 'courage']);
const MAX_INTENTION_LENGTH = 2000;

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const heroId = typeof body.heroId === 'string' ? body.heroId.trim() : '';
    const decision = typeof body.decision === 'string' ? body.decision : '';
    const privacy = typeof body.privacy === 'string' && VALID_PRIVACY.has(body.privacy) ? body.privacy : 'private';
    const mood = typeof body.mood === 'string' && VALID_MOODS.has(body.mood) ? body.mood : null;
    const intentionRaw = typeof body.intention === 'string' ? body.intention.trim() : '';
    const intention = intentionRaw.length > 0 ? intentionRaw.slice(0, MAX_INTENTION_LENGTH) : null;

    if (!heroId) {
      return NextResponse.json({ error: 'heroId is required' }, { status: 400 });
    }
    if (!VALID_DECISIONS.has(decision)) {
      return NextResponse.json({ error: 'decision must be one of inspired, skip, share' }, { status: 400 });
    }

    // Validate heroId against the canonical roster (DB dharm_veers, falling
    // back to the static DHARM_VEERS fixture) — the same resolver every
    // other Dharm Veer surface uses. Rejects fabricated/unknown hero ids
    // before they can ever reach the evidence table.
    const hero = await getDharmVeerBySlug(supabase, heroId);
    if (!hero) {
      return NextResponse.json({ error: 'Unknown heroId' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();
    const spiritualDate = localSpiritualDate(profile?.timezone ?? 'UTC', 4);

    const { error: insertError } = await supabase.from('dharm_veer_responses').insert({
      user_id: user.id,
      hero_id: hero.id,
      tradition: hero.tradition,
      spiritual_date: spiritualDate,
      decision,
      mood,
      intention,
      privacy,
    });

    if (insertError && insertError.code !== '23505') {
      // 23505 = duplicate (user_id, spiritual_date, hero_id) — a retry of
      // an already-recorded response. Treated as idempotent success below,
      // not an error, matching /api/quiz/save's own handling of the same
      // situation.
      console.error('[POST /api/dharm-veer/submit] insert failed:', insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Keep the display-only daily_sadhana.dharmveer_done flag in sync (see
    // file header — this is no longer what perfect-day trusts, but Home/
    // my-progress/Kul/etc. still read it directly for "today's practices").
    // Fire-and-forget: a failure here should not fail the response submit.
    try {
      await supabase.rpc('complete_dharmveer', { p_user_id: user.id, p_date: spiritualDate });
    } catch {
      // Non-fatal.
    }

    return NextResponse.json({
      success: true,
      alreadyRecorded: Boolean(insertError),
      heroId: hero.id,
      spiritualDate,
    });
  } catch (err: unknown) {
    console.error('[POST /api/dharm-veer/submit] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

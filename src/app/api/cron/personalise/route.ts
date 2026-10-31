import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { localSpiritualDate } from '@/lib/sacred-time';
import {
  generateDailyPersonalisation,
  type PersonaliseSuggestion,
} from '@/lib/daily-personalise';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60s max execution

interface ProfileRow {
  id: string;
  tradition: string | null;
  sampradaya: string | null;
  spiritual_level: string | null;
  seeking: string[] | string | null;
  full_name: string | null;
  username: string | null;
  timezone: string | null;
  consent_religious_data: boolean | null;
}

export async function GET(req: NextRequest) {
  return handleBatchPersonalise(req);
}

export async function POST(req: NextRequest) {
  return handleBatchPersonalise(req);
}

async function handleBatchPersonalise(req: NextRequest) {
  const startTime = Date.now();

  // ── 0. Auth check ───────────────────────────────────────────────────────────
  const allowedSecrets = [
    process.env.CRON_SECRET,
    process.env.INTERNAL_DISPATCH_SECRET,
  ].filter(Boolean);

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // If secrets are configured, enforce bearer authentication
  if (allowedSecrets.length > 0) {
    if (!token || !allowedSecrets.includes(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const admin = createAdminClient() as any;

    // ── 1. Target spiritual day ───────────────────────────────────────────────
    // When run at pre-dawn lean hours (e.g. 21:30 UTC / 03:00 AM IST), add 3 hours
    // to target the upcoming morning spiritual day (which resets at 4 AM local time).
    const targetMoment = new Date(Date.now() + 3 * 60 * 60 * 1000);

    // ── 2. Identify active users ──────────────────────────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: eventRows, error: eventErr } = await admin
      .from('sadhana_events')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo)
      .limit(500);

    if (eventErr) {
      console.warn('[cron/personalise] Failed to query sadhana_events:', eventErr.message);
    }

    const userIds = new Set<string>();
    for (const row of (eventRows as Array<{ user_id: string }> | null) ?? []) {
      if (row.user_id) userIds.add(row.user_id);
    }

    // Also include any profiles updated in the last 14 days if active list is small
    if (userIds.size < 50) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentProfiles } = await admin
        .from('profiles')
        .select('id')
        .gte('updated_at', fourteenDaysAgo)
        .limit(100);

      for (const p of (recentProfiles as Array<{ id: string }> | null) ?? []) {
        if (p.id) userIds.add(p.id);
      }
    }

    if (userIds.size === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No active users found for personalisation',
        processed: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    // ── 3. Fetch active profiles ──────────────────────────────────────────────
    const { data: profileRows, error: profileErr } = await admin
      .from('profiles')
      .select('id, tradition, sampradaya, spiritual_level, seeking, full_name, username, timezone, consent_religious_data')
      .in('id', Array.from(userIds));

    if (profileErr || !profileRows) {
      console.error('[cron/personalise] Profile fetch failed:', profileErr?.message);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    const profiles = profileRows as ProfileRow[];

    // ── 4. Check existing recommendations cache ───────────────────────────────
    // Group profiles by their target spiritual date
    const userTargetDate = new Map<string, string>();
    for (const p of profiles) {
      const userDate = localSpiritualDate(p.timezone, 4, targetMoment);
      userTargetDate.set(p.id, userDate);
    }

    const targetDates = Array.from(new Set(userTargetDate.values()));
    const { data: existingRecs } = await admin
      .from('recommendations')
      .select('user_id, date')
      .eq('type', 'daily_content')
      .in('date', targetDates)
      .in('user_id', Array.from(userIds));

    const alreadyCached = new Set<string>();
    for (const r of (existingRecs as Array<{ user_id: string; date: string }> | null) ?? []) {
      alreadyCached.add(`${r.user_id}:${r.date}`);
    }

    const profilesToProcess = profiles.filter((p) => {
      const date = userTargetDate.get(p.id)!;
      return !alreadyCached.has(`${p.id}:${date}`);
    });

    if (profilesToProcess.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'All active users already have today\'s personalisation cached',
        total_active: profiles.length,
        already_cached: alreadyCached.size,
        generated: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    // ── 5. Memoized generation by profile signature ───────────────────────────
    // Combines tradition + level + seeking + dayOfWeek to minimise Sarvam calls
    const memoizedGenerations = new Map<string, Promise<{ payload: PersonaliseSuggestion; source: 'ai' | 'fallback' }>>();

    let generatedCount = 0;
    const recordsToInsert: Array<{
      user_id: string;
      date: string;
      type: string;
      content: PersonaliseSuggestion;
      generated_at: string;
    }> = [];

    for (const profile of profilesToProcess) {
      const userDate = userTargetDate.get(profile.id)!;
      const religiousDataConsented = profile.consent_religious_data !== false;
      const rawTradition = religiousDataConsented ? (profile.tradition ?? 'general') : 'general';
      const level = religiousDataConsented ? (profile.spiritual_level ?? 'beginner') : 'beginner';
      const seekingStr = Array.isArray(profile.seeking) ? profile.seeking.join(',') : (profile.seeking ?? '');

      const dayOfWeek = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: profile.timezone ?? 'Asia/Kolkata',
      }).format(targetMoment);

      const memoKey = `${rawTradition}:${level}:${seekingStr}:${dayOfWeek}`;

      let genPromise = memoizedGenerations.get(memoKey);
      if (!genPromise) {
        genPromise = generateDailyPersonalisation({
          name: profile.full_name ?? profile.username ?? 'Seeker',
          tradition: rawTradition,
          level,
          seeking: profile.seeking,
          dayOfWeek,
          dateIso: userDate,
          routeContext: '/api/cron/personalise',
        });
        memoizedGenerations.set(memoKey, genPromise);
        generatedCount++;
      }

      try {
        const { payload } = await genPromise;
        recordsToInsert.push({
          user_id: profile.id,
          date: userDate,
          type: 'daily_content',
          content: payload,
          generated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`[cron/personalise] Generation failed for user ${profile.id}:`, err);
      }
    }

    // ── 6. Batch upsert into recommendations table ────────────────────────────
    if (recordsToInsert.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
        const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
        const { error: upsertErr } = await admin
          .from('recommendations')
          .upsert(batch, { onConflict: 'user_id,date,type' });

        if (upsertErr) {
          console.error('[cron/personalise] Batch upsert error:', upsertErr.message);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      total_active: profiles.length,
      already_cached: alreadyCached.size,
      processed: recordsToInsert.length,
      unique_generations: generatedCount,
      duration_ms: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error('[cron/personalise] Unhandled error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Personalisation batch failed' },
      { status: 500 },
    );
  }
}

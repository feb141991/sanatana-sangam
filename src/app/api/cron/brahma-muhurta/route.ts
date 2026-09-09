import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emitEvent } from '@/lib/monitoring/events';
import { getLocalDateIso, isHourInQuietWindow, getLocalHour, resolveTimeZone } from '@/lib/sacred-time';
import { getNextBrahmaMuhurtaInstant } from '@/lib/panchang';

// ─── Brahma Muhurta Sacred Alert Enqueuer ────────────────────────────────────
//
// Computes each user's own next Brahma Muhurta instant (1hr 36min before
// their own local sunrise, from their real profile coordinates) and enqueues
// a deterministic pending row into `notification_schedule`. The shared
// `notification-dispatch` cron (pg_cron, every 10 min) claims and delivers
// due rows precisely -- this route no longer sends anything itself, and no
// longer depends on running every 15 minutes to catch each user's instant.
//
// Users with no known latitude/longitude are skipped entirely rather than
// falling back to a default location's sunrise -- see
// getNextBrahmaMuhurtaInstant in lib/panchang.ts for why a silent fallback
// there is itself a correctness bug, not a convenience.
//
// Schedule: run once daily, at any fixed UTC time (currently 03:00 UTC, see
// vercel.json -- unchanged from before this rewrite). The exact tick time no
// longer matters for correctness: getNextBrahmaMuhurtaInstant always returns
// each user's genuinely next upcoming instant relative to whenever this runs
// (today's if still ahead, tomorrow's if already passed), so every user gets
// exactly one correctly-timed row enqueued per run, every day, regardless of
// their timezone.
//
// notification_key: `brahma_muhurta:${user_id}:${localDate}` — deduplicates
// any double-enqueue for the same user's same spiritual morning.
// ─────────────────────────────────────────────────────────────────────────────

const TRADITION_COPY: Record<string, { title: string; body: string }> = {
  hindu: {
    title: '🌅 Brahma Muhurta — The Sacred Hour Opens',
    body:  'This is the most auspicious time for sadhana. Rise, bathe, and begin your morning sequence while the world sleeps.',
  },
  sikh: {
    title: '☬ Amrit Vela — The Ambrosial Hour',
    body:  'Waheguru\'s grace flows most freely now. Begin your Nitnem before the mind fills with the day\'s noise.',
  },
  buddhist: {
    title: '☸️ Dawn — Your Practice Window',
    body:  'The mind is clearest before the world stirs. Sit now. Even fifteen minutes in this stillness is worth much more.',
  },
  jain: {
    title: '🤲 Brahma Muhurta — Begin Pratikraman',
    body:  'Jai Jinendra! The pre-dawn hour is auspicious for reflection and Navkar Mantra. Begin with a purified heart.',
  },
};

export async function GET(request: Request) {
  const startTime = Date.now();
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();

  try {
    // ── Step 1: Fetch all active users ────────────────────────────────────────
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, tradition, timezone, latitude, longitude, notification_quiet_hours_start, notification_quiet_hours_end, is_deleting')
      .or('is_deleting.is.null,is_deleting.eq.false');

    if (usersError) {
      console.error('[brahma-muhurta/enqueuer] Fetch profiles error:', usersError);
      return NextResponse.json({ error: `Profiles query failed: ${usersError.message}` }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users', enqueued: 0 });
    }

    type Profile = typeof users[0];

    const scheduledRows: Array<{
      user_id: string;
      title: string;
      body: string;
      send_at: string;
      notification_type: string;
      status: 'pending';
      metadata: Record<string, unknown>;
      notification_key: string;
      retry_count: number;
    }> = [];

    let skippedNoCoordinates = 0;
    let skippedQuietHours = 0;

    // ── Step 2: Compute each user's own next Brahma Muhurta instant ──────────
    for (const u of users as Profile[]) {
      const lat = (u as any).latitude as number | null;
      const lon = (u as any).longitude as number | null;
      const tz  = resolveTimeZone((u as any).timezone);

      const sendAt = getNextBrahmaMuhurtaInstant(now, lat, lon);
      if (!sendAt) {
        // No real location on file -- skip rather than silently substitute
        // a default location's sunrise (see getNextBrahmaMuhurtaInstant).
        skippedNoCoordinates += 1;
        continue;
      }

      const targetLocalHour = getLocalHour(sendAt, tz);
      const quietStart = (u as any).notification_quiet_hours_start !== null ? Number((u as any).notification_quiet_hours_start) : null;
      const quietEnd   = (u as any).notification_quiet_hours_end   !== null ? Number((u as any).notification_quiet_hours_end)   : null;

      if (isHourInQuietWindow(targetLocalHour, quietStart, quietEnd)) {
        skippedQuietHours += 1;
        continue;
      }

      const localDateIso = getLocalDateIso(sendAt, tz);
      const tradition = (u as any).tradition ?? 'hindu';
      const copy = TRADITION_COPY[tradition] ?? TRADITION_COPY.hindu;
      const dedupeKey = `brahma_muhurta:${u.id}:${localDateIso}`;

      scheduledRows.push({
        user_id:           u.id,
        title:             copy.title,
        body:              copy.body,
        send_at:           sendAt.toISOString(),
        notification_type: 'brahma_muhurta',
        status:            'pending',
        metadata: {
          tradition,
          emoji:      '🌅',
          type:       'brahma_muhurta',
          action_url: '/nitya-karma',
          timezone:   tz,
          local_date: localDateIso,
        },
        notification_key: dedupeKey,
        retry_count: 0,
      });
    }

    if (scheduledRows.length === 0) {
      return NextResponse.json({
        message: 'No users to schedule',
        enqueued: 0,
        skipped_no_coordinates: skippedNoCoordinates,
        skipped_quiet_hours: skippedQuietHours,
      });
    }

    // ── Step 3: Upsert scheduled rows in batches of 100 with deduplication ──
    let totalEnqueued = 0;
    for (let i = 0; i < scheduledRows.length; i += 100) {
      const batch = scheduledRows.slice(i, i + 100);
      const { data: upserted, error: upsertError } = await supabase
        .from('notification_schedule')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('id');

      if (upsertError) {
        console.error('[brahma-muhurta/enqueuer] Upsert error:', upsertError.message);
        return NextResponse.json({ error: `Notification schedule upsert failed: ${upsertError.message}` }, { status: 500 });
      }

      totalEnqueued += upserted?.length ?? 0;
    }

    emitEvent({
      severity: 'P3',
      domain: 'notifications',
      route: '/api/cron/brahma-muhurta',
      latency_ms: Date.now() - startTime,
      context: {
        status: 'enqueued',
        total_eligible: users.length,
        scheduled_candidates: scheduledRows.length,
        enqueued_count: totalEnqueued,
        skipped_no_coordinates: skippedNoCoordinates,
        skipped_quiet_hours: skippedQuietHours,
      },
    });

    return NextResponse.json({
      message: 'Brahma Muhurta alerts enqueued',
      total_eligible: users.length,
      enqueued: totalEnqueued,
      skipped_no_coordinates: skippedNoCoordinates,
      skipped_quiet_hours: skippedQuietHours,
    });

  } catch (error) {
    console.error('[brahma-muhurta/enqueuer] Cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Brahma Muhurta cron crashed' },
      { status: 500 }
    );
  }
}

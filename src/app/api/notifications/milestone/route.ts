import { NextResponse, type NextRequest } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { getNextLocalHourUtc, resolveTimeZone } from '@/lib/sacred-time';
import { enqueueNotificationSchedule } from '@/lib/notification-schedule-queue';

// ─── Achievement Milestone Notification ───────────────────────────────────────
// Called by JapaClient after saving a session when streak or total session count
// crosses an auspicious threshold.
//
// POST /api/notifications/milestone
// Body: { type: 'streak' | 'session', threshold: number, shieldName: string }
//
// Deduplication: uses notification_key `milestone:<type>:<threshold>` so the
// same shield is never delivered twice regardless of how many times the client
// calls this endpoint. This relies on the PER-USER unique index
// (user_id, notification_key) — see
// supabase/migrations/20260708120230_fix_notification_key_dedupe_and_rls.sql,
// which also drops a since-removed GLOBAL unique index on notification_key
// alone that would have made two different users hitting the same milestone
// (e.g. two users both reaching a 7-day streak) collide with each other.
//
// Auth: cookie session first, Bearer-token fallback second (getApiUser) — same
// migration /api/sankalpa/* got, so a native caller
// can hit this route too if a future native japa-milestone flow calls it.
// ─────────────────────────────────────────────────────────────────────────────

const SHIELD_COPY: Record<string, Record<number, { title: string; body: string; emoji: string }>> = {
  streak: {
    7:   { emoji: '🔥', title: 'Saptāha Siddhi — 7-Day Streak!',       body: 'Seven consecutive days of japa. The seed of daily practice is taking root. 🙏' },
    21:  { emoji: '🕯️', title: 'Niyama — 21-Day Streak Unlocked!',      body: '21 days without a break. Science calls this habit formation; dharma calls it Niyama. Keep going.' },
    40:  { emoji: '🌟', title: 'Chālisā Siddhi — 40 Days of Sādhana!', body: 'Forty days of unbroken practice — this is the threshold of true transformation. 🕉️' },
    54:  { emoji: '📿', title: 'Ardha Mālā — 54-Day Streak!',           body: 'Half a mala of days. Every bead, every breath, every morning — you are the practice now.' },
    108: { emoji: '🙏', title: 'Pūrṇa Mālā — 108-Day Streak!',          body: 'One hundred and eight days. A full mala. The sacred number complete. Jai! 🙏🕉️' },
    365: { emoji: '☀️', title: 'Varsha Sādhaka — One Full Year!',        body: 'A year of daily sādhana. You have walked the path through every season. Namaste. 🌅' },
  },
  session: {
    7:    { emoji: '🌱', title: 'Prārambha — First 7 Japa Sessions!',    body: 'Seven sessions complete. The journey of a thousand malas begins with a single bead. 🙏' },
    21:   { emoji: '⚡', title: 'Abhyāsa — 21 Japa Sessions!',           body: '21 rounds of mantra. Steady repetition is the highest yoga — you are on the path.' },
    40:   { emoji: '🔆', title: 'Tapas — 40 Japa Sessions!',             body: 'Forty sessions. Tapas is building inside you with each round of the mala. 🕉️' },
    108:  { emoji: '📿', title: 'Mālā Siddha — 108 Sessions Complete!',  body: 'One hundred and eight sessions — a full mala of practice. The mantra lives in you now. 🙏' },
    365:  { emoji: '🌕', title: 'Varshika — 365 Japa Sessions!',         body: 'Three hundred and sixty-five sessions. A year\'s worth of mantra vibration. Extraordinary. 🌕' },
    1000: { emoji: '💎', title: 'Sahasra — 1000 Japa Sessions!',         body: 'One thousand sessions. Sahasra — the sacred number of completion. You are the practice. 💎🕉️' },
  },
};

const VALID_STREAK_THRESHOLDS    = [7, 21, 40, 54, 108, 365];
const VALID_SESSION_THRESHOLDS   = [7, 21, 40, 108, 365, 1000];

export async function POST(request: NextRequest) {
  const { user, error } = await getApiUser(request);
  if (!user) return getApiAuthFailureResponse(error);

  let body: { type?: string; threshold?: number; shieldName?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { type, threshold } = body;

  if ((type !== 'streak' && type !== 'session') || typeof threshold !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const validThresholds = type === 'streak' ? VALID_STREAK_THRESHOLDS : VALID_SESSION_THRESHOLDS;
  if (!validThresholds.includes(threshold)) {
    return NextResponse.json({ error: 'Invalid threshold' }, { status: 400 });
  }

  const copy = SHIELD_COPY[type]?.[threshold];
  if (!copy) return NextResponse.json({ error: 'No copy found' }, { status: 400 });

  const notificationKey = `milestone:${type}:${threshold}`;
  const actionUrl       = '/my-progress';

  const serviceSupabase = createServiceRoleSupabaseClient();
  const bodyText = `${copy.body} Fellow Shoonyas celebrate with you!`;
  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    return NextResponse.json({ ok: false, key: notificationKey, error: profileError.message }, { status: 500 });
  }

  const timezone = resolveTimeZone(profile?.timezone);
  const { sendAt, localDateIso } = getNextLocalHourUtc(new Date(), timezone, 10, 0);
  try {
    const result = await enqueueNotificationSchedule(serviceSupabase, [{
      user_id: user.id,
      title: `${copy.emoji} ${copy.title}`,
      body: bodyText,
      send_at: sendAt.toISOString(),
      notification_type: 'milestone',
      status: 'pending',
      notification_key: notificationKey,
      metadata: {
        emoji: copy.emoji,
        type: 'general',
        action_url: actionUrl,
        timezone,
        local_date: localDateIso,
        milestone_type: type,
        threshold,
      },
    }]);
    return NextResponse.json({ ok: true, key: notificationKey, ...result });
  } catch (err) {
    console.error('[milestone] Schedule admission failed:', err);
    return NextResponse.json(
      {
        ok: false,
        key: notificationKey,
        error: err instanceof Error ? err.message : 'Failed to queue milestone notification',
      },
      { status: 500 }
    );
  }
}

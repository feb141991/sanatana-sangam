import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { sendOneSignalPush } from '@/lib/onesignal-server';

// ─── Achievement Milestone Notification ───────────────────────────────────────
// Called by JapaClient after saving a session when streak or total session count
// crosses an auspicious threshold.
//
// POST /api/notifications/milestone
// Body: { type: 'streak' | 'session', threshold: number, shieldName: string }
//
// Deduplication: uses notification_key `milestone:<type>:<threshold>` so the
// same shield is never delivered twice regardless of how many times the client
// calls this endpoint.
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

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  // Upsert with ignoreDuplicates — idempotent: calling twice does nothing
  const { error: upsertError } = await serviceSupabase
    .from('notifications')
    .upsert({
      user_id:          user.id,
      title:            `${copy.emoji} ${copy.title}`,
      body:             copy.body,
      emoji:            copy.emoji,
      type:             'milestone',
      action_url:       actionUrl,
      notification_key: notificationKey,
    }, { onConflict: 'user_id,notification_key', ignoreDuplicates: true });

  if (upsertError) {
    console.error('[milestone] DB upsert error:', upsertError.message);
    // Don't block — still try the push
  }

  // Fire push (non-blocking, best-effort)
  try {
    await sendOneSignalPush({
      userIds: [user.id],
      title:   `${copy.emoji} ${copy.title}`,
      body:    copy.body,
      url:     new URL(actionUrl, new URL(request.url).origin).toString(),
    });
  } catch (pushErr) {
    console.error('[milestone] Push error:', pushErr);
  }

  return NextResponse.json({ ok: true, key: notificationKey });
}

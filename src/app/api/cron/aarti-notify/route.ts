import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/push-server';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import { AARTI_TIMES, resolveActiveLiveStreams } from '@/lib/live-streams';

/**
 * Aarti Notify Cron
 * -----------------
 * Runs twice daily:
 *   ?slot=morning  →  22:30 UTC  (= 4:00 AM IST)
 *   ?slot=evening  →  12:30 UTC  (= 6:00 PM IST)
 *
 * For each slot, finds all users who opted in for that aarti time on at least
 * one stream, groups them by stream, and sends a personalised push notification.
 */

export async function GET(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const slot = new URL(request.url).searchParams.get('slot') as 'morning' | 'evening' | null;
  if (!slot || !['morning', 'evening'].includes(slot)) {
    return NextResponse.json({ error: 'Missing or invalid ?slot= (morning|evening)' }, { status: 400 });
  }

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase   = createClient(supabaseUrl, serviceRoleKey);
  const safetyState = getNotificationSafetyState('aarti', request);
  const notifyCol  = slot === 'morning' ? 'notify_morning' : 'notify_evening';
  const baseUrl    = new URL(request.url).origin;
  const actionUrl  = `${baseUrl}/live-darshan`;

  // ── Fetch opted-in preferences ────────────────────────────────────────────
  const { data: prefs, error } = await supabase
    .from('darshan_preferences')
    .select('user_id, stream_id')
    .eq(notifyCol, true);

  if (error) {
    console.error('[aarti-notify] DB error:', error);
    return NextResponse.json({ error: 'DB query failed' }, { status: 500 });
  }

  if (!prefs || prefs.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No opted-in users' });
  }

  // ── Resolve the effective stream registry ─────────────────────────────────
  const { data: dbStreams } = await supabase
    .from('live_darshans')
    .select('id, title, location, schedule, category, tradition, current_video_id, is_active, health_status')
    .eq('is_active', true);

  const effectiveStreams = resolveActiveLiveStreams(dbStreams ?? null);
  const streamMap = Object.fromEntries(effectiveStreams.map((stream) => [stream.id, stream]));

  // ── Group user IDs by stream_id ───────────────────────────────────────────
  const byStream: Record<string, string[]> = {};
  for (const pref of prefs) {
    if (!byStream[pref.stream_id]) byStream[pref.stream_id] = [];
    byStream[pref.stream_id].push(pref.user_id);
  }

  // ── Build & send notifications per stream ────────────────────────────────
  const results: { streamId: string; userCount: number; sent: number }[] = [];
  const planned: { streamId: string; userIds: string[]; title: string; body: string }[] = [];

  for (const [streamId, userIds] of Object.entries(byStream)) {
    const stream    = streamMap[streamId];
    const aarti     = AARTI_TIMES[streamId];
    const aartiTime = slot === 'morning' ? aarti?.morning : aarti?.evening;

    if (!stream) continue; // stream removed from registry

    // Build copy
    const templeShort = stream.title.replace(/^(Shri |Sri |Shree |ISKCON |Takhat |Guru )/i, '');
    let title: string;
    let body: string;

    if (slot === 'morning') {
      title = `🌅 Mangal Aarti — ${templeShort}`;
      body  = aartiTime
        ? `Morning aarti at ${aartiTime.split(' — ')[0]} has begun. Join the darshan. 🙏`
        : `Morning darshan at ${stream.title} — begin your day in devotion.`;
    } else {
      title = `🪔 Sandhya Aarti — ${templeShort}`;
      body  = aartiTime
        ? `Evening aarti at ${aartiTime.split(' — ')[0]} is beginning. Offer your prayers. 🙏`
        : `Evening darshan at ${stream.title} — close your day with blessings.`;
    }

    planned.push({ streamId, userIds, title, body });

    if (safetyState.isDryRun || safetyState.skipDelivery) {
      results.push({ streamId, userCount: userIds.length, sent: 0 });
      continue;
    }

    const { sent } = await sendPushNotification({
      userIds,
      title,
      body,
      url: actionUrl,
      data: { type: 'aarti', slot, streamId },
    });

    results.push({ streamId, userCount: userIds.length, sent });
  }

  const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
  if (safetyState.isDryRun || safetyState.skipDelivery) {
    return NextResponse.json(buildNotificationSafetyResponse('aarti', safetyState, {
      eligibleCount: planned.reduce((sum, item) => sum + item.userIds.length, 0),
      wouldSendCount: planned.reduce((sum, item) => sum + item.userIds.length, 0),
      preview: planned.slice(0, 10).map((item) => ({
        streamId: item.streamId,
        userCount: item.userIds.length,
        title: item.title,
      })),
    }));
  }
  return NextResponse.json({ slot, totalSent, streams: results.length, details: results });
}

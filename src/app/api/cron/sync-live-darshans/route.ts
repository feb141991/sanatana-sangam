import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

type SyncRow = { id: string; youtube_channel_id: string | null };

/**
 * Supabase postgrest-js v2 resolves .update() to `never` for live_darshans due to
 * deferred conditional types in complex generic chains. Cast through unknown.
 */
type SyncChainableUpdate = {
  eq(col: string, val: string): PromiseLike<{ error: { message: string } | null }>;
};
function liveSyncUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  values: Record<string, unknown>,
): SyncChainableUpdate {
  return (supabase.from('live_darshans') as unknown as {
    update(v: Record<string, unknown>): SyncChainableUpdate;
  }).update(values);
}
type SyncResult =
  | { id: string; status: 'updated'; videoId: string }
  | { id: string; status: 'not_live' }
  | { id: string; status: 'error'; reason: string };

export async function GET(request: NextRequest) {
  // Unconditionally locked — fails safely if CRON_SECRET is unset.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    return new NextResponse('Missing YOUTUBE_API_KEY', { status: 500 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Fetch all active channels — we sync even suspect streams so they can recover.
  const { data: darshans, error: fetchError } = await supabase
    .from('live_darshans')
    .select('id, youtube_channel_id')
    .eq('is_active', true);

  if (fetchError || !darshans) {
    return new NextResponse(
      `Failed to fetch darshans: ${fetchError?.message ?? 'no data'}`,
      { status: 500 },
    );
  }

  const updates: SyncResult[] = [];

  for (const row of darshans as SyncRow[]) {
    if (!row.youtube_channel_id) continue;

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${row.youtube_channel_id}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      const data = (await response.json()) as { items?: Array<{ id: { videoId: string } }> };

      if (data.items && data.items.length > 0) {
        const liveVideoId = data.items[0].id.videoId;

        // Reset health to healthy when a confirmed live video is found.
        const { error: updateError } = await liveSyncUpdate(supabase, {
          current_video_id:      liveVideoId,
          last_synced_at:        now,
          health_status:         'healthy',
          failure_count:         0,
          last_health_error:     null,
          last_working_video_id: liveVideoId,
        }).eq('id', row.id);

        if (updateError) {
          console.error(`[sync-live-darshans] Failed to update ${row.id}:`, updateError.message);
          updates.push({ id: row.id, status: 'error', reason: updateError.message });
        } else {
          updates.push({ id: row.id, status: 'updated', videoId: liveVideoId });
        }
      } else {
        // Channel is not currently live.
        // Do NOT touch current_video_id — the old video becomes a VOD and is still
        // watchable. Do NOT set health_status — let check-live-darshans own that.
        updates.push({ id: row.id, status: 'not_live' });
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown error';
      console.error(`[sync-live-darshans] YouTube API error for ${row.id}:`, reason);
      updates.push({ id: row.id, status: 'error', reason });
    }
  }

  return NextResponse.json({ success: true, updates });
}

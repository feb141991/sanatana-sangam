import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type SyncRow = { id: string; youtube_channel_id: string | null; current_video_id: string | null };

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

/**
 * Fetches recent video candidates via YouTube channel public RSS feed (0 quota cost).
 */
async function getRecentCandidateVideoIds(channelId: string): Promise<string[]> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Shoonaya-LiveDarshan-Sync/1.0' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const matches = Array.from(xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)).map(m => m[1]);
    return matches.slice(0, 3);
  } catch {
    return [];
  }
}

/**
 * Checks candidate videos for live broadcast status using YouTube videos.list (1 quota unit).
 */
async function findLiveVideoId(
  candidateIds: string[],
  apiKey: string,
): Promise<string | null> {
  if (candidateIds.length === 0) return null;
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${candidateIds.join(',')}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = (await response.json()) as {
    items?: Array<{
      id: string;
      snippet?: { liveBroadcastContent?: string };
      liveStreamingDetails?: { actualStartTime?: string; actualEndTime?: string };
    }>;
  };

  for (const item of data.items ?? []) {
    const isLive =
      item.snippet?.liveBroadcastContent === 'live' ||
      Boolean(item.liveStreamingDetails?.actualStartTime && !item.liveStreamingDetails?.actualEndTime);
    if (isLive) return item.id;
  }
  return null;
}

export async function GET(request: NextRequest) {
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

  const { data: darshans, error: fetchError } = await supabase
    .from('live_darshans')
    .select('id, youtube_channel_id, current_video_id')
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
      // 1. Check zero-quota RSS feed for recent candidate videos + include current_video_id if present
      const rssCandidates = await getRecentCandidateVideoIds(row.youtube_channel_id);
      const candidates = Array.from(
        new Set([...(row.current_video_id ? [row.current_video_id] : []), ...rssCandidates]),
      );

      // 2. Validate live status via low-cost videos.list (1 unit)
      const liveVideoId = await findLiveVideoId(candidates, YOUTUBE_API_KEY);

      if (liveVideoId) {
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
        updates.push({ id: row.id, status: 'not_live' });
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown error';
      console.error(`[sync-live-darshans] Error for ${row.id}:`, reason);
      updates.push({ id: row.id, status: 'error', reason });
    }
  }

  return NextResponse.json({ success: true, updates });
}

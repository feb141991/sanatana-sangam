import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { emitError, emitEvent } from '@/lib/monitoring/events';
import { fetchYouTubeVideoMeta, isValidYouTubeChannelId, isValidYouTubeVideoId } from '@/lib/live-darshan-validation';
import type { LiveDarshanHealthStatus } from '@/lib/live-streams';

type LiveDarshanHealthRow = {
  id: string;
  title: string;
  tradition: string;
  youtube_channel_id: string;
  current_video_id: string | null;
  is_active: boolean | null;
  health_status: LiveDarshanHealthStatus | null;
  failure_count: number | null;
};

type HealthUpdate = {
  health_status: LiveDarshanHealthStatus;
  failure_count: number;
  last_health_checked_at: string;
  last_health_error: string | null;
  last_working_video_id?: string;
  is_active?: boolean;
};

/**
 * Supabase postgrest-js v2 resolves .update() to `never` for live_darshans due to
 * deferred conditional types. Cast through unknown — the runtime call is correct.
 */
type ChainableUpdate = {
  eq(col: string, val: string): PromiseLike<{ error: { message: string } | null }>;
};
function liveUpdateBuilder(
  supabase: ReturnType<typeof createAdminClient>,
  values: Record<string, unknown>,
): ChainableUpdate {
  return (supabase.from('live_darshans') as unknown as {
    update(v: Record<string, unknown>): ChainableUpdate;
  }).update(values);
}

async function applyHealthUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  id: string,
  update: HealthUpdate,
) {
  const { error } = await liveUpdateBuilder(supabase, update as Record<string, unknown>).eq('id', id);
  if (error) {
    console.error(`[check-live-darshans] Failed to write health update for ${id}:`, error.message);
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const startTime = Date.now();
  const now = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from('live_darshans')
    .select('id, title, tradition, youtube_channel_id, current_video_id, is_active, health_status, failure_count')
    .eq('is_active', true);

  if (error) {
    emitError('cron', error, 'P1', { route: '/api/cron/check-live-darshans', provider: 'youtube' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activeRows = (rows ?? []) as unknown as LiveDarshanHealthRow[];
  const youtubeApiKey = process.env.YOUTUBE_API_KEY?.trim();
  const issues: Array<{ id: string; severity: 'P1' | 'P2'; issue: string }> = [];

  for (const row of activeRows) {
    const prevFailures = row.failure_count ?? 0;

    // ── Structural validation ──────────────────────────────────────────────
    if (!isValidYouTubeChannelId(row.youtube_channel_id ?? '')) {
      const newCount = prevFailures + 1;
      const newStatus: LiveDarshanHealthStatus = newCount >= 2 ? 'offline' : 'suspect';
      issues.push({ id: row.id, severity: 'P1', issue: 'invalid youtube_channel_id' });
      emitEvent({
        severity: 'P1',
        domain: 'cron',
        route: '/api/cron/check-live-darshans',
        provider: 'youtube',
        error_message: 'Live Darshan stream has invalid youtube_channel_id',
        context: { stream_id: row.id, title: row.title, issue: 'invalid_channel_id', new_health_status: newStatus },
      });
      await applyHealthUpdate(supabase, row.id, {
        health_status: newStatus,
        failure_count: newCount,
        last_health_checked_at: now,
        last_health_error: 'invalid youtube_channel_id',
        ...(newStatus === 'offline' ? { is_active: false } : {}),
      });
      continue;
    }

    if (!row.current_video_id) {
      // No current_video_id means the player has nothing to show.
      // Mark offline so resolveActiveLiveStreams suppresses the stream from playlists.
      // Do NOT increment failure_count — this is not a YouTube API failure; the sync
      // cron will set a new video_id and reset health_status to healthy when the
      // channel goes live again.
      issues.push({ id: row.id, severity: 'P2', issue: 'missing current_video_id' });
      emitEvent({
        severity: 'P2',
        domain: 'cron',
        route: '/api/cron/check-live-darshans',
        provider: 'youtube',
        error_message: 'Live Darshan stream is active but missing current_video_id — marked offline',
        context: { stream_id: row.id, title: row.title, issue: 'missing_current_video' },
      });
      await applyHealthUpdate(supabase, row.id, {
        health_status: 'offline',
        failure_count: prevFailures, // preserved — not a YouTube failure
        last_health_checked_at: now,
        last_health_error: 'missing current_video_id',
      });
      continue;
    }

    if (!isValidYouTubeVideoId(row.current_video_id)) {
      const newCount = prevFailures + 1;
      const newStatus: LiveDarshanHealthStatus = newCount >= 2 ? 'offline' : 'suspect';
      issues.push({ id: row.id, severity: 'P1', issue: 'invalid current_video_id' });
      emitEvent({
        severity: 'P1',
        domain: 'cron',
        route: '/api/cron/check-live-darshans',
        provider: 'youtube',
        error_message: 'Live Darshan stream has invalid current_video_id format',
        context: { stream_id: row.id, title: row.title, issue: 'invalid_current_video', new_health_status: newStatus },
      });
      await applyHealthUpdate(supabase, row.id, {
        health_status: newStatus,
        failure_count: newCount,
        last_health_checked_at: now,
        last_health_error: 'invalid current_video_id format',
        ...(newStatus === 'offline' ? { is_active: false } : {}),
      });
      continue;
    }

    // ── YouTube metadata check ─────────────────────────────────────────────
    try {
      const meta = await fetchYouTubeVideoMeta(row.current_video_id, youtubeApiKey);

      if (meta.channelId && meta.channelId !== row.youtube_channel_id) {
        const newCount = prevFailures + 1;
        const newStatus: LiveDarshanHealthStatus = newCount >= 2 ? 'offline' : 'suspect';
        issues.push({ id: row.id, severity: 'P1', issue: 'current_video_id channel mismatch' });
        emitEvent({
          severity: 'P1',
          domain: 'cron',
          route: '/api/cron/check-live-darshans',
          provider: 'youtube',
          error_message: 'Live Darshan current_video_id no longer belongs to configured channel',
          context: { stream_id: row.id, title: row.title, issue: 'channel_mismatch', new_health_status: newStatus },
        });
        await applyHealthUpdate(supabase, row.id, {
          health_status: newStatus,
          failure_count: newCount,
          last_health_checked_at: now,
          last_health_error: 'current_video_id does not belong to configured channel',
          ...(newStatus === 'offline' ? { is_active: false } : {}),
        });
      } else {
        // ── Success: reset health counters ─────────────────────────────────
        await applyHealthUpdate(supabase, row.id, {
          health_status: 'healthy',
          failure_count: 0,
          last_health_checked_at: now,
          last_health_error: null,
          last_working_video_id: row.current_video_id,
        });
      }
    } catch (err) {
      const newCount = prevFailures + 1;
      const newStatus: LiveDarshanHealthStatus = newCount >= 2 ? 'offline' : 'suspect';
      const errMsg = err instanceof Error ? err.message : 'unknown error';
      issues.push({ id: row.id, severity: 'P1', issue: 'current_video_id unreachable' });
      emitError('cron', err, 'P1', {
        route: '/api/cron/check-live-darshans',
        provider: 'youtube',
        context: { stream_id: row.id, title: row.title, issue: 'video_unreachable', new_health_status: newStatus },
      });
      await applyHealthUpdate(supabase, row.id, {
        health_status: newStatus,
        failure_count: newCount,
        last_health_checked_at: now,
        last_health_error: errMsg.slice(0, 500),
        ...(newStatus === 'offline' ? { is_active: false } : {}),
      });
    }
  }

  emitEvent({
    severity: issues.length > 0 ? 'P2' : 'P3',
    domain: 'cron',
    route: '/api/cron/check-live-darshans',
    provider: 'youtube',
    latency_ms: Date.now() - startTime,
    context: {
      action: 'health_audit',
      total_streams: rows?.length ?? 0,
      total_streams_checked: activeRows.length,
      issue_count: issues.length,
    },
  });

  return NextResponse.json({ success: true, audited: activeRows.length, issues });
}

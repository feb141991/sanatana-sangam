import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { emitError, emitEvent } from '@/lib/monitoring/events';
import { fetchYouTubeVideoMeta, isValidYouTubeChannelId, isValidYouTubeVideoId } from '@/lib/live-darshan-validation';

type LiveDarshanHealthRow = {
  id: string;
  title: string;
  tradition: string;
  youtube_channel_id: string;
  current_video_id: string | null;
  is_active: boolean | null;
};

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const startTime = Date.now();
  const { data: rows, error } = await supabase
    .from('live_darshans')
    .select('id, title, tradition, youtube_channel_id, current_video_id, is_active')
    .eq('is_active', true);

  if (error) {
    emitError('cron', error, 'P1', { route: '/api/cron/check-live-darshans', provider: 'youtube' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activeRows = (rows ?? []) as unknown as LiveDarshanHealthRow[];

  const youtubeApiKey = process.env.YOUTUBE_API_KEY?.trim();
  const issues: Array<{ id: string; severity: 'P1' | 'P2'; issue: string }> = [];

  for (const row of activeRows) {
    if (!isValidYouTubeChannelId(row.youtube_channel_id ?? '')) {
      issues.push({ id: row.id, severity: 'P1', issue: 'invalid youtube_channel_id' });
      emitEvent({
        severity: 'P1',
        domain: 'cron',
        route: '/api/cron/check-live-darshans',
        provider: 'youtube',
        error_message: 'Live Darshan stream has invalid youtube_channel_id',
        context: { stream_id: row.id, title: row.title, issue: 'invalid_channel_id' },
      });
      continue;
    }

    if (!row.current_video_id) {
      issues.push({ id: row.id, severity: 'P2', issue: 'missing current_video_id' });
      emitEvent({
        severity: 'P2',
        domain: 'cron',
        route: '/api/cron/check-live-darshans',
        provider: 'youtube',
        error_message: 'Live Darshan stream is active but missing current_video_id',
        context: { stream_id: row.id, title: row.title, issue: 'missing_current_video' },
      });
      continue;
    }

    if (!isValidYouTubeVideoId(row.current_video_id)) {
      issues.push({ id: row.id, severity: 'P1', issue: 'invalid current_video_id' });
      emitEvent({
        severity: 'P1',
        domain: 'cron',
        route: '/api/cron/check-live-darshans',
        provider: 'youtube',
        error_message: 'Live Darshan stream has invalid current_video_id',
        context: { stream_id: row.id, title: row.title, issue: 'invalid_current_video' },
      });
      continue;
    }

    try {
      const meta = await fetchYouTubeVideoMeta(row.current_video_id, youtubeApiKey);
      if (meta.channelId && meta.channelId !== row.youtube_channel_id) {
        issues.push({ id: row.id, severity: 'P1', issue: 'current_video_id channel mismatch' });
        emitEvent({
          severity: 'P1',
          domain: 'cron',
          route: '/api/cron/check-live-darshans',
          provider: 'youtube',
          error_message: 'Live Darshan current_video_id no longer belongs to configured channel',
          context: { stream_id: row.id, title: row.title, issue: 'channel_mismatch' },
        });
      }
    } catch (err) {
      issues.push({ id: row.id, severity: 'P1', issue: 'current_video_id unreachable' });
      emitError('cron', err, 'P1', {
        route: '/api/cron/check-live-darshans',
        provider: 'youtube',
        context: { stream_id: row.id, title: row.title, issue: 'video_unreachable' },
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

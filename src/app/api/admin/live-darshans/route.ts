import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';
import { emitError, emitEvent } from '@/lib/monitoring/events';
import { LiveDarshanInput, validateLiveDarshanInput } from '@/lib/live-darshan-validation';

export async function POST(req: NextRequest) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  const body = await req.json().catch(() => null) as LiveDarshanInput | null;
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const startTime = Date.now();
  const validation = await validateLiveDarshanInput(body, {
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
  });

  if (!validation.ok) {
    emitEvent({
      severity: 'P2',
      domain: 'cron',
      route: '/api/admin/live-darshans',
      provider: 'youtube',
      latency_ms: Date.now() - startTime,
      error_message: 'Rejected live darshan ingestion payload',
      context: {
        action: 'validate_reject',
        stream_id: body.id,
        errors: validation.errors.join(' | '),
      },
    });
    return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
  }

  const payload = {
    id: body.id.trim(),
    title: body.title.trim(),
    location: body.location.trim(),
    schedule: body.schedule.trim(),
    category: body.category,
    tradition: body.tradition,
    youtube_channel_id: body.youtube_channel_id.trim(),
    current_video_id: body.current_video_id?.trim() || null,
    is_active: body.is_active ?? true,
  };

  const { data, error } = await admin.supabase
    .from('live_darshans')
    .upsert(payload, { onConflict: 'id' })
    .select('id, title, location, schedule, category, tradition, youtube_channel_id, current_video_id, is_active')
    .single();

  if (error) {
    emitError('cron', error, 'P2', {
      route: '/api/admin/live-darshans',
      provider: 'youtube',
      latency_ms: Date.now() - startTime,
      context: { action: 'upsert_failed', stream_id: payload.id },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  emitEvent({
    severity: 'P3',
    domain: 'cron',
    route: '/api/admin/live-darshans',
    provider: 'youtube',
    latency_ms: Date.now() - startTime,
    context: {
      action: 'upsert_success',
      stream_id: payload.id,
      tradition: payload.tradition,
      category: payload.category,
      channel_title: validation.channelTitle ?? '',
    },
  });

  return NextResponse.json({ success: true, stream: data, validation });
}

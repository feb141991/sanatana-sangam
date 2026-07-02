import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

/**
 * POST /api/live-darshan/report
 * Body: { streamId: string; reason?: string }
 *
 * Inserts a content_report for a broken live-darshan stream.
 * Auth is required. Uses the service role for the insert so RLS
 * on content_reports doesn't block the operation.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { streamId, reason } = body as Record<string, unknown>;
  if (typeof streamId !== 'string' || !streamId.trim()) {
    return NextResponse.json({ error: 'streamId is required' }, { status: 400 });
  }

  const reportReason = typeof reason === 'string' && reason.trim()
    ? reason.trim().slice(0, 500)
    : 'stream_broken';

  // Use service-role client so content_reports insert is not blocked by RLS.
  // Supabase postgrest-js v2 resolves .insert() to `never` for content_reports due to
  // deferred conditional types. Cast through unknown — runtime call is correct.
  const admin = createAdminClient();
  const insertPayload = {
    reported_by:       user.id,
    content_author_id: user.id, // no author user for a stream; reporter as placeholder
    content_type:      'live_darshan',
    content_id:        streamId.trim(),
    reason:            reportReason,
    status:            'pending',
  };
  const { error } = await (admin.from('content_reports') as unknown as {
    insert(v: typeof insertPayload): PromiseLike<{ error: { message: string } | null }>;
  }).insert(insertPayload);

  if (error) {
    console.error('[live-darshan/report] Insert failed:', error.message);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

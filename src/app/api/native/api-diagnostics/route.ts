import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkDurableRateLimit, clientIp, rejectLargeRequest } from '@/lib/api-security';
import { parseNativeApiDiagnosticPayload } from '@/lib/native-api-diagnostic-contract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 32 * 1024;
const RATE_LIMIT = { limit: 60, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const sizeRejection = rejectLargeRequest(request, MAX_BODY_BYTES);
  if (sizeRejection) return sizeRejection;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Diagnostics unavailable' }, { status: 503 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const payload = parseNativeApiDiagnosticPayload(rawPayload);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid API diagnostics payload' }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const ip = clientIp(request);
  const ipHash = ip
    ? createHash('sha256').update(`${serviceKey}:${ip}`).digest('hex')
    : 'unknown';
  const rateRejection = await checkDurableRateLimit(
    `native-api-diagnostic:${ipHash}`,
    RATE_LIMIT.limit,
    RATE_LIMIT.windowMs,
    admin,
  );
  if (rateRejection) return rateRejection;

  const rows = payload.events.map((event) => ({
    client_event_id: event.clientEventId,
    server_request_id: event.serverRequestId,
    retry_server_request_id: event.retryServerRequestId,
    endpoint: event.endpoint,
    method: event.method,
    outcome: event.outcome,
    first_status: event.firstStatus,
    final_status: event.finalStatus,
    attempt_count: event.attemptCount,
    duration_ms: event.durationMs,
    app_version: payload.appVersion,
    platform: payload.platform,
    client_occurred_at: new Date(event.timestamp).toISOString(),
  }));

  const { error } = await admin
    .from('native_api_diagnostic_events')
    .upsert(rows, { onConflict: 'client_event_id', ignoreDuplicates: true });
  if (error) {
    console.error('[native-api-diagnostics] persistence failed', { code: error.code });
    return NextResponse.json({ error: 'Diagnostics persistence failed' }, { status: 503 });
  }

  return NextResponse.json(
    { accepted: payload.events.length },
    { status: 202, headers: { 'Cache-Control': 'no-store' } },
  );
}

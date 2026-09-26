import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkDurableRateLimit, clientIp, rejectLargeRequest } from '@/lib/api-security';
import { parseNativeAuthDiagnosticPayload } from '@/lib/native-auth-diagnostic-contract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 24 * 1024;
const RATE_LIMIT = { limit: 60, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const sizeRejection = rejectLargeRequest(request, MAX_BODY_BYTES);
  if (sizeRejection) return sizeRejection;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Telemetry unavailable' }, { status: 503 });
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
  const payload = parseNativeAuthDiagnosticPayload(rawPayload);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid auth diagnostics payload' }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Rate-limit keys must not retain raw IP addresses. The service key is
  // server-only and acts as a rotating project-scoped pepper.
  const ip = clientIp(request);
  const ipHash = ip
    ? createHash('sha256').update(`${serviceKey}:${ip}`).digest('hex')
    : 'unknown';
  const rateRejection = await checkDurableRateLimit(
    `native-auth-diagnostic:${ipHash}`,
    RATE_LIMIT.limit,
    RATE_LIMIT.windowMs,
    admin,
  );
  if (rateRejection) return rateRejection;

  const rows = payload.events.map((event) => ({
    request_id: event.requestId,
    retry_request_id: event.retryRequestId,
    route: event.route,
    auth_code: event.authCode,
    initial_status: event.initialStatus,
    final_status: event.finalStatus,
    auth_ready_wait_ms: event.authReadyWaitMs,
    had_access_token: event.hadAccessToken,
    refresh_attempted: event.refreshAttempted,
    refresh_succeeded: event.refreshSucceeded,
    duration_ms: event.durationMs,
    app_version: payload.appVersion,
    platform: payload.platform,
    client_occurred_at: new Date(event.timestamp).toISOString(),
  }));

  // A retry or a repeated batch is safe: request_id is the primary key and
  // duplicate events are ignored rather than counted twice.
  const { error } = await admin
    .from('native_auth_diagnostic_events')
    .upsert(rows, { onConflict: 'request_id', ignoreDuplicates: true });

  if (error) {
    console.error('[native-auth-diagnostics] persistence failed', { code: error.code });
    return NextResponse.json({ error: 'Telemetry persistence failed' }, { status: 503 });
  }

  return NextResponse.json(
    { accepted: payload.events.length },
    { status: 202, headers: { 'Cache-Control': 'no-store' } },
  );
}

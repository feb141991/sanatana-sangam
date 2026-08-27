import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkDurableRateLimit, clientIp, rejectLargeRequest } from '@/lib/api-security';
import { parseClientErrorPayload } from '@/lib/client-error-contract';
import { serverReleaseIdentity } from '@/lib/release-identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 24 * 1024;
const RATE_LIMIT = { limit: 30, windowMs: 60_000 };

function fingerprintFor(errorName: string, message: string, stack: string | null, route: string) {
  const normalizedMessage = message
    .replace(/\b[0-9a-f]{8,}\b/gi, '[HASH]')
    .replace(/\b\d+\b/g, '[N]');
  const topFrame = stack?.split('\n').find((line) => line.includes(' at ')) || '';
  return createHash('sha256')
    .update([errorName, normalizedMessage, topFrame, route].join('|'))
    .digest('hex');
}

function hashAnonymousValue(value: string | null, pepper: string) {
  if (!value) return null;
  return createHash('sha256').update(`${pepper}:${value}`).digest('hex');
}

export async function POST(request: Request) {
  const sizeRejection = rejectLargeRequest(request, MAX_BODY_BYTES);
  if (sizeRejection) return sizeRejection;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Telemetry unavailable' }, { status: 503 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const ipHash = hashAnonymousValue(clientIp(request), serviceKey) || 'unknown';
  const rateRejection = await checkDurableRateLimit(
    `client-error:${ipHash}`,
    RATE_LIMIT.limit,
    RATE_LIMIT.windowMs,
    admin,
  );
  if (rateRejection) return rateRejection;

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const payload = parseClientErrorPayload(parsedBody);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid client error report' }, { status: 400 });
  }

  const serverRelease = serverReleaseIdentity();
  const incidentId = `ce_${randomUUID()}`;
  const fingerprint = fingerprintFor(payload.errorName, payload.message, payload.stack, payload.route);
  const anonymousSessionHash = hashAnonymousValue(payload.anonymousSessionNonce, serviceKey);

  const { error } = await admin.from('client_error_events').insert({
    incident_id: incidentId,
    fingerprint,
    source: payload.source,
    error_name: payload.errorName,
    error_message: payload.message,
    stack: payload.stack,
    component_stack: payload.componentStack,
    route: payload.route,
    browser_family: payload.browserFamily,
    os_family: payload.osFamily,
    client_release_sha: payload.clientReleaseSha,
    client_deployment_url: payload.clientDeploymentUrl,
    server_release_sha: serverRelease.sha,
    server_deployment_url: serverRelease.deploymentUrl,
    service_worker_controller: payload.serviceWorkerController,
    online: payload.online,
    anonymous_session_hash: anonymousSessionHash,
  });

  if (error) {
    console.error('[client-errors] persistence failed', { code: error.code, incidentId });
    return NextResponse.json({ error: 'Telemetry persistence failed' }, { status: 503 });
  }

  return NextResponse.json(
    { incidentId, fingerprint },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  );
}

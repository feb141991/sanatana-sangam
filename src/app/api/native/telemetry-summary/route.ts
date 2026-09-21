import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkDurableRateLimit, clientIp, rejectLargeRequest } from '@/lib/api-security';
import { parseNativeTelemetryPayload } from '@/lib/native-telemetry-contract';
import { getApiAuthFailureResponse } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16 * 1024;
// The native client throttles itself to one upload per hour per install;
// this is a generous backstop against a broken/compromised client, not the
// primary control.
const RATE_LIMIT = { limit: 12, windowMs: 60 * 60_000 };

function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function POST(request: NextRequest) {
  const sizeRejection = rejectLargeRequest(request, MAX_BODY_BYTES);
  if (sizeRejection) return sizeRejection;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return NextResponse.json({ error: 'Telemetry unavailable' }, { status: 503 });
  }

  // Untyped client, deliberately -- matching src/lib/api-auth.ts's own
  // documented workaround: `createClient<Database>(...)` resolves `.from(...)`
  // to `never` for any table missing from the generated types, and this
  // table's types haven't been regenerated yet (see migration file).
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Resolve identity server-side -- never trust a body-supplied user id.
  // Native's apiFetch omits the Authorization header entirely for guest
  // requests, so a header that IS present but fails to verify is treated as
  // untrusted rather than silently downgraded to a guest submission.
  let userId: string | null = null;
  const token = getBearerToken(request);
  if (token) {
    const bearerClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await bearerClient.auth.getUser(token);
    if (error || !data?.user) {
      return getApiAuthFailureResponse(error);
    }
    userId = data.user.id;
  }

  const rateKey = userId ? `native-telemetry:user:${userId}` : `native-telemetry:ip:${clientIp(request)}`;
  const rateRejection = await checkDurableRateLimit(rateKey, RATE_LIMIT.limit, RATE_LIMIT.windowMs, admin);
  if (rateRejection) return rateRejection;

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = parseNativeTelemetryPayload(rawBody);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid telemetry payload' }, { status: 400 });
  }

  const { error } = await admin.from('native_startup_telemetry_summaries').insert({
    user_id: userId,
    identity_kind: userId ? 'authenticated' : 'guest',
    schema_version: payload.schemaVersion,
    app_version: payload.appVersion,
    platform: payload.platform,
    total_events: payload.summary.totalEvents,
    summary: payload.summary,
  });

  if (error) {
    console.error('[native-telemetry] persistence failed', error.code, error.message);
    return NextResponse.json({ error: 'Telemetry persistence failed' }, { status: 503 });
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

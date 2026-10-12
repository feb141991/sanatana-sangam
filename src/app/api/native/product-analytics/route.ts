import { NextRequest, NextResponse } from 'next/server';
import { checkDurableRateLimit, rejectLargeRequest } from '@/lib/api-security';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENT_NAMES = new Set([
  'app_opened', 'practice_started', 'practice_completed',
  'progressive_profiling',
]);
const MAX_BODY_BYTES = 2_048;

function privateResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

async function authenticated(request: NextRequest) {
  const result = await getApiUser(request);
  if (!result.user || !result.supabase) {
    return { response: getApiAuthFailureResponse(result.error), user: null, supabase: null };
  }
  return { response: null, user: result.user, supabase: result.supabase };
}

export async function POST(request: NextRequest) {
  const tooLarge = rejectLargeRequest(request, MAX_BODY_BYTES);
  if (tooLarge) return tooLarge;

  const auth = await authenticated(request);
  if (auth.response || !auth.user || !auth.supabase) return auth.response;

  const admin = createAdminClient();
  const rateLimit = await checkDurableRateLimit(`product-analytics:user:${auth.user.id}`, 60, 60_000, admin);
  if (rateLimit) return rateLimit;

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return privateResponse({ error: 'Invalid analytics payload' }, 400);
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => !['events', 'appVersion', 'platform'].includes(key))) {
    return privateResponse({ error: 'Only events, appVersion, and platform are accepted' }, 400);
  }
  if (!Array.isArray(input.events) || input.events.length < 1 || input.events.length > 10 ||
      input.events.some((event) => typeof event !== 'string' || !EVENT_NAMES.has(event))) {
    return privateResponse({ error: 'Events must be a list of 1–10 allowlisted event names' }, 400);
  }
  if (input.appVersion !== undefined && (typeof input.appVersion !== 'string' || input.appVersion.length > 32 || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(input.appVersion))) {
    return privateResponse({ error: 'appVersion must be a semantic version string' }, 400);
  }
  if (input.platform !== undefined && input.platform !== 'ios' && input.platform !== 'android') {
    return privateResponse({ error: 'platform must be ios or android' }, 400);
  }
  const appVersion = typeof input.appVersion === 'string' ? input.appVersion : null;
  const platform = input.platform === 'ios' || input.platform === 'android' ? input.platform : null;
  const { data, error } = await auth.supabase.rpc('record_native_product_analytics', {
    p_events: [...new Set(input.events as string[])],
    p_app_version: appVersion,
    p_platform: platform,
  });
  if (error) {
    console.error('[native-product-analytics] persistence failed', { code: error.code });
    return privateResponse({ error: 'Analytics could not be saved' }, 503);
  }
  const result = data && typeof data === 'object' ? data as { accepted?: unknown; consentRequired?: unknown; religiousConsentRequired?: unknown } : {};
  return privateResponse({
    accepted: typeof result.accepted === 'number' ? result.accepted : 0,
    consentRequired: result.consentRequired === true,
    religiousConsentRequired: result.religiousConsentRequired === true,
  }, 202);
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticated(request);
  if (auth.response || !auth.user || !auth.supabase) return auth.response;
  const { error } = await auth.supabase.rpc('withdraw_native_product_analytics');
  if (error) {
    console.error('[native-product-analytics] withdrawal failed', { code: error.code });
    return privateResponse({ error: 'Analytics history could not be deleted' }, 503);
  }
  return privateResponse({ deleted: true }, 200);
}

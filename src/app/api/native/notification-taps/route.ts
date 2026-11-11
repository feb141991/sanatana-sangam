import { NextRequest, NextResponse } from 'next/server';
import { checkDurableRateLimit, rejectLargeRequest } from '@/lib/api-security';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Records that a person tapped a push notification we sent them (migration 20261111100000).
 *
 * The body is deliberately tiny and carries no identity and no content: the account comes from the session, and
 * the notification's TYPE and send time come from our own delivery log, not from here. Whether to record at all
 * is decided in the database (notification_tap_recording_allowed), so this route cannot widen it. A tap that does
 * not match a push really sent to this account, or whose account has not consented, is acknowledged with 202 and
 * stored as nothing; the app reads the flags and stops queueing.
 */

const MAX_BODY_BYTES = 1_024;
const ALLOWED_KEYS = new Set(['clientEventId', 'notificationKey', 'tappedAt', 'launchState', 'appVersion', 'platform']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

function privateResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const tooLarge = rejectLargeRequest(request, MAX_BODY_BYTES);
  if (tooLarge) return tooLarge;

  const auth = await getApiUser(request);
  if (!auth.user || !auth.supabase) return getApiAuthFailureResponse(auth.error);

  const admin = createAdminClient();
  const rateLimit = await checkDurableRateLimit(`notification-taps:user:${auth.user.id}`, 60, 60_000, admin);
  if (rateLimit) return rateLimit;

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return privateResponse({ error: 'Invalid tap payload' }, 400);
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => !ALLOWED_KEYS.has(key))) {
    return privateResponse({ error: 'Only clientEventId, notificationKey, tappedAt, launchState, appVersion and platform are accepted' }, 400);
  }
  if (typeof input.clientEventId !== 'string' || !UUID.test(input.clientEventId)) {
    return privateResponse({ error: 'clientEventId must be a UUID' }, 400);
  }
  if (typeof input.notificationKey !== 'string' || input.notificationKey.length < 1 || input.notificationKey.length > 200) {
    return privateResponse({ error: 'notificationKey must be 1 to 200 characters' }, 400);
  }
  if (input.launchState !== 'cold_start' && input.launchState !== 'running') {
    return privateResponse({ error: 'launchState must be cold_start or running' }, 400);
  }
  let tappedAt: string | null = null;
  if (input.tappedAt !== undefined) {
    const parsed = typeof input.tappedAt === 'string' ? new Date(input.tappedAt) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return privateResponse({ error: 'tappedAt must be an ISO timestamp' }, 400);
    tappedAt = parsed.toISOString();
  }
  if (input.appVersion !== undefined && (typeof input.appVersion !== 'string' || input.appVersion.length > 32 || !SEMVER.test(input.appVersion))) {
    return privateResponse({ error: 'appVersion must be a semantic version string' }, 400);
  }
  if (input.platform !== undefined && input.platform !== 'ios' && input.platform !== 'android') {
    return privateResponse({ error: 'platform must be ios or android' }, 400);
  }

  const { data, error } = await auth.supabase.rpc('record_notification_tap', {
    p_client_event_id: input.clientEventId,
    p_notification_key: input.notificationKey,
    p_tapped_at: tappedAt,
    p_launch_state: input.launchState,
    p_app_version: typeof input.appVersion === 'string' ? input.appVersion : null,
    p_platform: input.platform === 'ios' || input.platform === 'android' ? input.platform : null,
  });
  if (error) {
    // Log the code only: a database error can carry table, column and query detail, and the key is the person's own.
    console.error('[native-notification-taps] persistence failed', { code: error.code });
    if (error.code === '22023') return privateResponse({ error: 'Invalid tap payload' }, 400);
    return privateResponse({ error: 'The tap could not be saved' }, 503);
  }
  const result = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  return privateResponse({
    accepted: typeof result.accepted === 'number' ? result.accepted : 0,
    consentRequired: result.consentRequired === true,
    religiousConsentRequired: result.religiousConsentRequired === true,
    unmatched: result.unmatched === true,
  }, 202);
}

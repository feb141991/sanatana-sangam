import { NextRequest, NextResponse } from 'next/server';

import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { checkDurableRateLimit, rejectLargeRequest } from '@/lib/api-security';
import {
  EMAIL_CONSENT_CATEGORIES,
  EMAIL_CONSENT_CLIENT_SOURCES,
  EmailConsentError,
  deriveConsentRegion,
  getEmailConsentSummary,
  isWordingVersion,
  readIpCountry,
  setEmailConsent,
  wordingVersionForRegion,
  type EmailConsentCategory,
  type EmailConsentClientSource,
} from '@/lib/email-consent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 2_048;
const READ_LIMIT = 60;
const WRITE_LIMIT = 20;

function respond(body: Record<string, unknown>, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function failure(error: unknown) {
  if (error instanceof EmailConsentError) {
    if (error.code === 'not_found') return respond({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' }, 404);
    if (error.code === 'account_deleting') return respond({ error: 'This account is being deleted', code: 'ACCOUNT_DELETING' }, 409);
    if (error.code === 'invalid') return respond({ error: 'Invalid request', code: 'INVALID_REQUEST' }, 400);
  }
  // Anything else is retryable and deliberately says nothing about the cause.
  return respond({ error: 'Email preferences are temporarily unavailable', code: 'EMAIL_PREFERENCES_UNAVAILABLE' }, 503);
}

function policyFor(request: NextRequest, deviceRegion: unknown) {
  const { region, source } = deriveConsentRegion({ ipCountry: readIpCountry(request.headers), deviceRegion });
  return { region, regionSource: source, wordingVersion: wordingVersionForRegion(region) };
}

/**
 * The signed-in person's e-mail choices, when they last changed, and the wording to show them. Nothing is cached: a stale "on" or "off"
 * would let a screen offer the wrong action.
 */
export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth.user || !auth.supabase) return getApiAuthFailureResponse(auth.error);

  let admin: ReturnType<typeof createServiceRoleSupabaseClient>;
  try {
    admin = createServiceRoleSupabaseClient();
  } catch {
    return failure(null);
  }
  const limited = await checkDurableRateLimit(`email-preferences:read:user:${auth.user.id}`, READ_LIMIT, 60_000, admin);
  if (limited) return limited;

  try {
    const summary = await getEmailConsentSummary(auth.user.id, admin as never);
    return respond({ ...summary, policy: policyFor(request, request.nextUrl.searchParams.get('deviceRegion')) });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Changes ONE choice for the signed-in person. The account is the verified session's, never a field of the body. Asking for the state the
 * person is already in changes nothing and records nothing.
 */
export async function POST(request: NextRequest) {
  const tooLarge = rejectLargeRequest(request, MAX_BODY_BYTES);
  if (tooLarge) return tooLarge;

  const auth = await getApiUser(request);
  if (!auth.user || !auth.supabase) return getApiAuthFailureResponse(auth.error);

  // The content-length check above trusts a header; this one holds on what was actually sent.
  const text = await request.text().catch(() => null);
  if (text !== null && text.length > MAX_BODY_BYTES) return respond({ error: 'Request body too large', code: 'INVALID_REQUEST' }, 413);
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return respond({ error: 'The request body must be a JSON object', code: 'INVALID_REQUEST' }, 400);
  }
  const input = body as Record<string, unknown>;
  const category = input.category;
  const source = input.source;
  if (typeof category !== 'string' || !(EMAIL_CONSENT_CATEGORIES as readonly string[]).includes(category)
    || typeof input.granted !== 'boolean'
    || typeof source !== 'string' || !(EMAIL_CONSENT_CLIENT_SOURCES as readonly string[]).includes(source)) {
    return respond({ error: 'Invalid request', code: 'INVALID_REQUEST' }, 400);
  }

  let admin: ReturnType<typeof createServiceRoleSupabaseClient>;
  try {
    admin = createServiceRoleSupabaseClient();
  } catch {
    return failure(null);
  }
  const limited = await checkDurableRateLimit(`email-preferences:write:user:${auth.user.id}`, WRITE_LIMIT, 60_000, admin);
  if (limited) return limited;

  const policy = policyFor(request, input.deviceRegion);
  try {
    const change = await setEmailConsent({
      userId: auth.user.id,
      category: category as EmailConsentCategory,
      granted: input.granted,
      source: source as EmailConsentClientSource,
      // What the app says it showed. An unknown string is dropped, not stored.
      wordingVersion: isWordingVersion(input.wordingVersion) ? input.wordingVersion : null,
      region: policy.region,
      regionSource: policy.regionSource,
    }, admin);

    let lastChangedAt: string | null = null;
    try {
      lastChangedAt = (await getEmailConsentSummary(auth.user.id, admin as never)).lastChangedAt;
    } catch {
      // The change itself succeeded; the timestamp is a convenience.
    }
    return respond({ ok: true, changed: change.changed, newsletter: change.newsletter && change.marketing, festivals: change.festivals, lastChangedAt });
  } catch (error) {
    return failure(error);
  }
}

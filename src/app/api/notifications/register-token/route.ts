import { NextResponse, type NextRequest } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { recordPushTokenEvent, recordPushTokenEventBatch, type PushTokenEventPayload } from '@/lib/push-token-audit';

const EXPO_TOKEN = /^(?:ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REASONS = new Set(['auth', 'foreground', 'heartbeat', 'settings', 'permission', 'rotation', 'retry']);
const FAILURE_STAGES = new Set(['check_permission', 'fetch_expo_push_token', 'post_register_token', 'remove_registration']);

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function parseBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

function tokenFrom(body: Record<string, unknown>): string | null {
  if (typeof body.token !== 'string') return null;
  const token = body.token.trim();
  return token.length <= 250 && EXPO_TOKEN.test(token) ? token : null;
}

/** Canonical Native contract. Binding version comes from the atomic database upsert. */
export async function POST(request: NextRequest) {
  const { user, error } = await getApiUser(request);
  if (!user) return getApiAuthFailureResponse(error);
  const body = await parseBody(request);
  if (!body) return json({ error: 'Invalid JSON object' }, 400);
  const platform = body.platform === 'ios' || body.platform === 'android' ? body.platform : 'unknown';
  const token = tokenFrom(body);
  if (!token) {
    if (Array.isArray(body.failureEvents)) {
      if (body.failureEvents.length === 0 || body.failureEvents.length > 10) return json({ error: 'Invalid failure event batch' }, 400);
      const events: PushTokenEventPayload[] = [];
      for (const value of body.failureEvents) {
        if (!value || typeof value !== 'object') return json({ error: 'Invalid failure event' }, 400);
        const event = value as Record<string, unknown>;
        const stage = typeof event.stage === 'string' && FAILURE_STAGES.has(event.stage) ? event.stage : 'unknown';
        if (typeof event.reason !== 'string' || !event.reason) return json({ error: 'Invalid failure event' }, 400);
        const reason = event.reason.replace(/(?:Exponent|Expo)PushToken\[[^\]]*\]/g, '[push-token]')
          .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
          .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[credential]')
          .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]').slice(0, 200);
        events.push({ userId: user.id, token: `no-token:${platform}:${stage}`, eventType: 'registration_failed',
          reason: `stage:${stage} | ${reason}`, source: '/api/notifications/register-token' });
      }
      await recordPushTokenEventBatch(events);
      return json({ acknowledged: events.length });
    }
    if (body.token == null && typeof body.failureReason === 'string' && body.failureReason.length > 0) {
      const stage = typeof body.failureStage === 'string' && FAILURE_STAGES.has(body.failureStage) ? body.failureStage : 'unknown';
      const reason = body.failureReason
        .replace(/(?:Exponent|Expo)PushToken\[[^\]]*\]/g, '[push-token]')
        .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
        .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[credential]')
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
        .slice(0, 200);
      await recordPushTokenEvent({ userId: user.id, token: `no-token:${platform}:${stage}`,
        eventType: 'registration_failed', reason: `stage:${stage} | ${reason}`, source: '/api/notifications/register-token' });
      return json({ acknowledged: true });
    }
    return json({ error: 'A valid Expo push token is required' }, 400);
  }
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error: rpcError } = await supabase.rpc('register_native_push_token', {
      p_user_id: user.id, p_token: token, p_platform: platform,
    });
    if (rpcError || typeof data !== 'string' || !UUID.test(data)) {
      console.warn('[push-registration] atomic registration failed', { code: rpcError?.code ?? 'invalid_acknowledgement' });
      return json({ error: 'Push registration is temporarily unavailable', code: 'PUSH_REGISTRATION_UNAVAILABLE' }, 503);
    }
    const reason = typeof body.registrationReason === 'string' && REASONS.has(body.registrationReason) ? body.registrationReason : 'legacy';
    await recordPushTokenEvent({ userId: user.id, token, eventType: 'registered',
      reason: `platform:${platform} | trigger:${reason}`, source: '/api/notifications/register-token' });
    return json({ registered: true, bindingVersion: data });
  } catch {
    console.warn('[push-registration] registration failed');
    return json({ error: 'Push registration is temporarily unavailable', code: 'PUSH_REGISTRATION_UNAVAILABLE' }, 503);
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await getApiUser(request);
  if (!user) return getApiAuthFailureResponse(error);
  const body = await parseBody(request);
  if (!body) return json({ error: 'Invalid JSON object' }, 400);
  const token = tokenFrom(body);
  if (!token) return json({ error: 'A valid Expo push token is required' }, 400);
  const version = body.bindingVersion ?? null;
  if (version !== null && (typeof version !== 'string' || !UUID.test(version))) return json({ error: 'Invalid binding version' }, 400);
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error: rpcError } = await supabase.rpc('remove_native_push_token', {
      p_user_id: user.id, p_token: token, p_binding_version: version,
    });
    if (rpcError || typeof data !== 'boolean') return json({ error: 'Push cleanup is temporarily unavailable' }, 503);
    if (data) await recordPushTokenEvent({ userId: user.id, token, eventType: 'pruned_other',
      reason: 'user_sign_out; removed exact binding', source: '/api/notifications/register-token' });
    return json({ removed: data });
  } catch { return json({ error: 'Push cleanup is temporarily unavailable' }, 503); }
}

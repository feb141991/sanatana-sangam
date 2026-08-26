import { createHash } from 'node:crypto';
import { createServiceRoleSupabaseClient } from '@/lib/admin';

export type PushTokenEventType =
  | 'registered'
  | 'pruned_device_not_registered'
  | 'pruned_other';

export interface PushTokenEventPayload {
  userId?: string | null;
  token: string;
  eventType: PushTokenEventType;
  reason?: string | null;
  source: string;
}

/**
 * Computes a deterministic SHA-256 hash of a push token.
 * This avoids storing plaintext device tokens in append-only audit tables
 * while allowing exact-match lookups during support disputes or investigations.
 */
export function hashPushToken(token: string): string {
  if (!token) return '';
  return createHash('sha256').update(token.trim()).digest('hex');
}

function buildPushTokenEventRow(payload: PushTokenEventPayload) {
  return {
    user_id: payload.userId || null,
    token: hashPushToken(payload.token),
    event_type: payload.eventType,
    reason: payload.reason || null,
    source: payload.source,
  };
}

export async function recordPushTokenEvent(payload: PushTokenEventPayload): Promise<void> {
  if (!payload.token) return;

  try {
    const supabase = createServiceRoleSupabaseClient();
    const row = buildPushTokenEventRow(payload);

    const { error } = await supabase.from('push_token_events').insert(row);

    if (error) {
      console.warn(`[push-token-audit] Failed to insert token event type=${payload.eventType}: ${error.message}`);
    }
  } catch (err) {
    console.warn(
      `[push-token-audit] Caught exception inserting token event type=${payload.eventType}:`,
      err instanceof Error ? err.message : String(err)
    );
  }
}

export async function recordPushTokenEventBatch(payloads: PushTokenEventPayload[]): Promise<void> {
  const validPayloads = payloads.filter((p) => Boolean(p.token));
  if (!validPayloads.length) return;

  try {
    const supabase = createServiceRoleSupabaseClient();
    const rows = validPayloads.map(buildPushTokenEventRow);

    const { error } = await supabase.from('push_token_events').insert(rows);

    if (error) {
      console.warn(`[push-token-audit] Failed to insert ${validPayloads.length} token events: ${error.message}`);
    }
  } catch (err) {
    console.warn(
      `[push-token-audit] Caught exception inserting ${validPayloads.length} token events:`,
      err instanceof Error ? err.message : String(err)
    );
  }
}

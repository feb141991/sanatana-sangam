import { createHmac, timingSafeEqual } from 'node:crypto';

export type ResendWebhookHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

const MAX_WEBHOOK_SKEW_SECONDS = 5 * 60;

/** Verify Svix's signed raw-body envelope used by Resend webhooks. */
export function verifyResendWebhookSignature(
  rawBody: string | Uint8Array,
  headers: ResendWebhookHeaders,
  secret: string,
  nowMs = Date.now(),
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature || !secret.startsWith('whsec_')) return false;
  if (!/^\d+$/.test(timestamp)) return false;

  const timestampSeconds = Number(timestamp);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (!Number.isSafeInteger(timestampSeconds) || Math.abs(nowSeconds - timestampSeconds) > MAX_WEBHOOK_SKEW_SECONDS) {
    return false;
  }

  let key: Buffer;
  try {
    key = Buffer.from(secret.slice('whsec_'.length), 'base64');
  } catch {
    return false;
  }
  if (key.length === 0) return false;

  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.`)
    .update(typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody))
    .digest();
  const candidates = signature.split(/\s+/).flatMap((part) => {
    const [version, encoded] = part.split(',', 2);
    if (version !== 'v1' || !encoded) return [];
    try {
      const decoded = Buffer.from(encoded, 'base64');
      return decoded.length === expected.length ? [decoded] : [];
    } catch {
      return [];
    }
  });

  return candidates.some((candidate) => timingSafeEqual(candidate, expected));
}

export type ResendSuppressionEvent = {
  eventType: string;
  reason: 'hard_bounce' | 'complaint' | null;
  recipients: string[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/** Extract only the minimal suppression signal; never persist the provider payload. */
export function readResendSuppressionEvent(payload: unknown): ResendSuppressionEvent | null {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const eventType = typeof root?.type === 'string' ? root.type : null;
  if (!eventType || !data) return null;

  const rawRecipients = Array.isArray(data.to)
    ? data.to
    : typeof data.to === 'string' ? [data.to] : [];
  const recipients = [...new Set(rawRecipients
    .filter((value): value is string => typeof value === 'string')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))];

  if (eventType === 'email.complained') {
    return { eventType, reason: 'complaint', recipients };
  }

  if (eventType === 'email.bounced') {
    const bounce = asRecord(data.bounce);
    const bounceType = typeof bounce?.type === 'string' ? bounce.type.toLowerCase() : '';
    return { eventType, reason: bounceType === 'permanent' ? 'hard_bounce' : null, recipients };
  }

  return { eventType, reason: null, recipients: [] };
}

import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { readResendSuppressionEvent, verifyResendWebhookSignature } from './resend-webhook';

const signingKey = Buffer.from('a stable test-only signing key').toString('base64');
const secret = `whsec_${signingKey}`;

function signature(rawBody: string, id: string, timestamp: string) {
  return createHmac('sha256', Buffer.from(signingKey, 'base64'))
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest('base64');
}

describe('Resend webhook verification', () => {
  it('validates a current signature over the exact raw body', () => {
    const body = '{"type":"email.bounced","data":{"to":["User@example.com"]}}';
    const timestamp = '1791100000';
    const id = 'msg_test_1';
    expect(verifyResendWebhookSignature(body, {
      id,
      timestamp,
      signature: `v1,${signature(body, id, timestamp)}`,
    }, secret, Number(timestamp) * 1000)).toBe(true);
  });

  it('rejects changed body, stale timestamp, missing header, and unrecognized version', () => {
    const body = '{"type":"email.delivered"}';
    const timestamp = '1791100000';
    const id = 'msg_test_2';
    const signed = signature(body, id, timestamp);
    const headers = { id, timestamp, signature: `v1,${signed}` };
    expect(verifyResendWebhookSignature(`${body} `, headers, secret, Number(timestamp) * 1000)).toBe(false);
    expect(verifyResendWebhookSignature(body, headers, secret, Number(timestamp) * 1000 + 301_000)).toBe(false);
    expect(verifyResendWebhookSignature(body, { ...headers, id: null }, secret, Number(timestamp) * 1000)).toBe(false);
    expect(verifyResendWebhookSignature(body, { ...headers, signature: `v2,${signed}` }, secret, Number(timestamp) * 1000)).toBe(false);
  });

  it('accepts one matching v1 among rotated signatures', () => {
    const body = '{"type":"email.delivered"}';
    const timestamp = '1791100000';
    const id = 'msg_test_3';
    const signed = signature(body, id, timestamp);
    expect(verifyResendWebhookSignature(body, {
      id, timestamp, signature: `v1,${Buffer.alloc(32, 7).toString('base64')} v1,${signed}`,
    }, secret, Number(timestamp) * 1000)).toBe(true);
  });
});

describe('Resend suppression event extraction', () => {
  it('suppresses permanent bounces and deduplicates normalized recipients', () => {
    expect(readResendSuppressionEvent({
      type: 'email.bounced',
      data: { to: [' Person@Example.com ', 'person@example.com'], bounce: { type: 'Permanent' } },
    })).toEqual({ eventType: 'email.bounced', reason: 'hard_bounce', recipients: ['person@example.com'] });
  });

  it('records transient bounces without suppressing the address', () => {
    expect(readResendSuppressionEvent({
      type: 'email.bounced',
      data: { to: ['person@example.com'], bounce: { type: 'Transient' } },
    })).toEqual({ eventType: 'email.bounced', reason: null, recipients: ['person@example.com'] });
  });

  it('suppresses complaints but ignores recipients for unrelated events', () => {
    expect(readResendSuppressionEvent({
      type: 'email.complained', data: { to: ['person@example.com'] },
    })).toMatchObject({ reason: 'complaint', recipients: ['person@example.com'] });
    expect(readResendSuppressionEvent({
      type: 'email.delivered', data: { to: ['person@example.com'] },
    })).toMatchObject({ reason: null, recipients: [] });
  });

  it('rejects malformed envelopes and filters invalid addresses', () => {
    expect(readResendSuppressionEvent({ type: 'email.bounced' })).toBeNull();
    expect(readResendSuppressionEvent({ type: 'email.complained', data: { to: ['nope', 7] } }))
      .toMatchObject({ reason: 'complaint', recipients: [] });
  });
});

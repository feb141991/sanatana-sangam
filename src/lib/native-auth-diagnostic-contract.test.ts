import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNativeAuthDiagnosticPayload } from './native-auth-diagnostic-contract';

const event = (overrides: Record<string, unknown> = {}) => ({
  requestId: 'a1b2c3d4-e5f6-4789-8123-456789abcdef',
  retryRequestId: null,
  route: 'register_token',
  authCode: 'AUTH_UNAVAILABLE',
  initialStatus: 503,
  finalStatus: 503,
  authReadyWaitMs: 25,
  hadAccessToken: true,
  refreshAttempted: false,
  refreshSucceeded: false,
  durationMs: 4300,
  timestamp: Date.now(),
  ...overrides,
});

const payload = (events: unknown[]) => ({ appVersion: '1.8.0', platform: 'ios', events });

test('accepts a bounded diagnostic with no identity or sensitive payload fields', () => {
  const parsed = parseNativeAuthDiagnosticPayload(payload([event()]));
  assert.ok(parsed);
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0].route, 'register_token');
});

test('accepts both middleware request IDs for a 401 followed by refresh retry', () => {
  const parsed = parseNativeAuthDiagnosticPayload(payload([event({
    retryRequestId: 'b1b2c3d4-e5f6-4789-8123-456789abcdef',
    initialStatus: 401,
    finalStatus: 200,
    authCode: 'AUTH_REQUIRED',
    refreshAttempted: true,
    refreshSucceeded: true,
  })]));
  assert.ok(parsed);
  assert.equal(parsed.events[0].retryRequestId, 'b1b2c3d4-e5f6-4789-8123-456789abcdef');
});

test('rejects missing, malformed, or identical retry request IDs', () => {
  assert.equal(parseNativeAuthDiagnosticPayload(payload([event({ retryRequestId: undefined })])), null);
  assert.equal(parseNativeAuthDiagnosticPayload(payload([event({ retryRequestId: 'not-a-uuid' })])), null);
  assert.equal(parseNativeAuthDiagnosticPayload(payload([event({ retryRequestId: 'a1b2c3d4-e5f6-4789-8123-456789abcdef' })])), null);
});

test('rejects unknown routes, inconsistent refresh state, stale events, and oversized batches', () => {
  assert.equal(parseNativeAuthDiagnosticPayload(payload([event({ route: 'profile' })])), null);
  assert.equal(parseNativeAuthDiagnosticPayload(payload([event({ refreshSucceeded: true })])), null);
  assert.equal(parseNativeAuthDiagnosticPayload(payload([event({ timestamp: Date.now() - 100 * 24 * 60 * 60 * 1000 })])), null);
  assert.equal(parseNativeAuthDiagnosticPayload(payload(Array.from({ length: 51 }, (_, i) => event({
    requestId: `a1b2c3d4-e5f6-4789-8123-${String(i).padStart(12, '0')}`,
  })))), null);
});

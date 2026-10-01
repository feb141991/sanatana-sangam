import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNativeApiDiagnosticPayload } from './native-api-diagnostic-contract';

const event = (overrides: Record<string, unknown> = {}) => ({
  clientEventId: 'a1b2c3d4-e5f6-4789-8123-456789abcdef',
  serverRequestId: 'b1b2c3d4-e5f6-4789-8123-456789abcdef',
  retryServerRequestId: null,
  endpoint: '/api/calendar/upcoming',
  method: 'GET',
  outcome: 'http_failure',
  firstStatus: 503,
  finalStatus: 503,
  attemptCount: 2,
  durationMs: 4_500,
  timestamp: Date.now(),
  ...overrides,
});

const payload = (events: unknown[]) => ({ appVersion: '1.8.0', platform: 'ios', events });

test('accepts bounded safe API failures and keeps only the declared diagnostic fields', () => {
  const parsed = parseNativeApiDiagnosticPayload(payload([event({ requestBody: 'private text' })]));
  assert.ok(parsed);
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0].endpoint, '/api/calendar/upcoming');
  assert.equal('requestBody' in parsed.events[0], false);
});

test('accepts recovered retries and transport failures without a server response', () => {
  const recovered = parseNativeApiDiagnosticPayload(payload([event({
    outcome: 'retry_recovered',
    finalStatus: 200,
    retryServerRequestId: 'c1b2c3d4-e5f6-4789-8123-456789abcdef',
  })]));
  assert.ok(recovered);

  const timeout = parseNativeApiDiagnosticPayload(payload([event({
    outcome: 'timeout',
    serverRequestId: null,
    firstStatus: null,
    finalStatus: null,
    attemptCount: 0,
  })]));
  assert.ok(timeout);
});

test('rejects unsafe paths, invalid outcomes/statuses, repeated event IDs, and oversize batches', () => {
  assert.equal(parseNativeApiDiagnosticPayload(payload([event({ endpoint: '/api/calendar/upcoming?email=a@example.com' })])), null);
  assert.equal(parseNativeApiDiagnosticPayload(payload([event({ outcome: 'unknown' })])), null);
  assert.equal(parseNativeApiDiagnosticPayload(payload([event({ finalStatus: 700 })])), null);
  assert.equal(parseNativeApiDiagnosticPayload(payload([event(), event()])), null);
  assert.equal(parseNativeApiDiagnosticPayload(payload(Array.from({ length: 26 }, (_, index) => event({
    clientEventId: `a1b2c3d4-e5f6-4789-8123-${String(index).padStart(12, '0')}`,
  })))), null);
});

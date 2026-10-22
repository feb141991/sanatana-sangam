import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
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
  assert.equal(parsed.events[0].crossedBackground, null, 'older app payloads normalize to unknown');
  assert.equal('requestBody' in parsed.events[0], false);
});

test('accepts the lifecycle marker and rejects malformed marker values', () => {
  const crossed = parseNativeApiDiagnosticPayload(payload([event({ crossedBackground: true })]));
  const foreground = parseNativeApiDiagnosticPayload(payload([event({ crossedBackground: false })]));
  assert.equal(crossed?.events[0].crossedBackground, true);
  assert.equal(foreground?.events[0].crossedBackground, false);
  assert.equal(parseNativeApiDiagnosticPayload(payload([event({ crossedBackground: 'yes' })])), null);
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

test('persists and exposes the optional lifecycle marker through the monitoring path', () => {
  const route = readFileSync(new URL('../app/api/native/api-diagnostics/route.ts', import.meta.url), 'utf8');
  const aggregator = readFileSync(new URL('./monitoring/native-telemetry-aggregator.ts', import.meta.url), 'utf8');
  const adminSection = readFileSync(new URL('../app/admin/monitoring/NativeStartupTelemetrySection.tsx', import.meta.url), 'utf8');
  const migration = readFileSync(new URL('../../supabase/migrations/20261021154326_add_crossed_background_to_native_api_diagnostics.sql', import.meta.url), 'utf8');
  const rollback = readFileSync(new URL('../../supabase/rollbacks/20261021154326_add_crossed_background_to_native_api_diagnostics_rollback.sql', import.meta.url), 'utf8');
  assert.match(route, /crossed_background:\s*event\.crossedBackground/);
  assert.match(aggregator, /duration_ms, crossed_background, app_version/);
  assert.match(adminSection, /event\.crossed_background === null[\s\S]*?"unknown"/);
  assert.match(adminSection, /Backgrounded/);
  assert.match(migration, /add column if not exists crossed_background boolean;/);
  assert.doesNotMatch(migration, /crossed_background boolean not null/i);
  assert.match(rollback, /drop column if exists crossed_background/);
});

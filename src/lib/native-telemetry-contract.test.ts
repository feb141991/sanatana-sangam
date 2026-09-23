import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNativeTelemetryPayload } from './native-telemetry-contract';

const basePayload = {
  schemaVersion: 2,
  appVersion: '1.4.0',
  platform: 'ios',
  summary: {
    routes: [
      {
        route: 'home',
        opens: 10,
        cacheHitRate: 0.9,
        staleOpens: 2,
        staleReportingOpens: 8,
        avgDurationMs: 120,
        p95DurationMs: 300,
        refreshFailures: 1,
        failureReasons: { network: 1 },
        failuresWithCachedData: 1,
      },
    ],
    outbox: [],
    serverTimings: [],
    duplicateRequests: [{ route: 'mandali', avoided: 3, detected: 2 }],
    interactionTimings: [{ name: 'mandali_comment_expand', samples: 5, avgDurationMs: 200, p95DurationMs: 400 }],
    loaderExposure: [{ route: 'profile', shown: 4, shownWithUsableData: 0, avgDurationMs: 50, p95DurationMs: 80 }],
    totalEvents: 20,
  },
};

test('accepts a full schema-v2 payload with every Stage 0 field populated', () => {
  const parsed = parseNativeTelemetryPayload(basePayload);
  assert.ok(parsed);
  assert.equal(parsed.summary.routes[0].staleOpens, 2);
  assert.deepEqual(parsed.summary.routes[0].failureReasons, { network: 1 });
  assert.equal(parsed.summary.duplicateRequests[0].detected, 2);
  assert.equal(parsed.summary.interactionTimings[0].name, 'mandali_comment_expand');
  assert.equal(parsed.summary.loaderExposure[0].shownWithUsableData, 0);
});

test('accepts a pre-Stage-0 (schema v1) payload missing every new field, defaulting to empty/zero', () => {
  const legacyPayload = {
    schemaVersion: 1,
    appVersion: '1.3.0',
    platform: 'android',
    summary: {
      routes: [
        { route: 'home', opens: 5, cacheHitRate: 1, avgDurationMs: 80, p95DurationMs: 100, refreshFailures: 0 },
      ],
      outbox: [],
      serverTimings: [],
      totalEvents: 5,
    },
  };

  const parsed = parseNativeTelemetryPayload(legacyPayload);
  assert.ok(parsed, 'a payload from an app build that predates Stage 0 must still validate');
  assert.equal(parsed.summary.routes[0].staleOpens, 0);
  assert.equal(parsed.summary.routes[0].staleReportingOpens, 0);
  assert.deepEqual(parsed.summary.routes[0].failureReasons, {});
  assert.equal(parsed.summary.routes[0].failuresWithCachedData, 0);
  assert.deepEqual(parsed.summary.duplicateRequests, []);
  assert.deepEqual(parsed.summary.interactionTimings, []);
  assert.deepEqual(parsed.summary.loaderExposure, []);
});

test('rejects a failureReasons key outside the whitelisted enum', () => {
  const payload = structuredClone(basePayload);
  (payload.summary.routes[0].failureReasons as Record<string, number>).made_up_reason = 1;
  assert.equal(parseNativeTelemetryPayload(payload), null);
});

test('rejects an interactionTimings entry with an unrecognized name', () => {
  const payload = structuredClone(basePayload);
  payload.summary.interactionTimings[0].name = 'invented_interaction';
  assert.equal(parseNativeTelemetryPayload(payload), null);
});

test('rejects a duplicateRequests entry with a negative count', () => {
  const payload = structuredClone(basePayload);
  payload.summary.duplicateRequests[0].detected = -1;
  assert.equal(parseNativeTelemetryPayload(payload), null);
});

test('rejects an oversized loaderExposure array', () => {
  const payload = structuredClone(basePayload);
  payload.summary.loaderExposure = Array.from({ length: 31 }, () => payload.summary.loaderExposure[0]);
  assert.equal(parseNativeTelemetryPayload(payload), null);
});

test('rejects a route summary with a non-numeric staleOpens rather than silently defaulting it', () => {
  const payload = structuredClone(basePayload);
  (payload.summary.routes[0] as unknown as Record<string, unknown>).staleOpens = 'not-a-number';
  assert.equal(parseNativeTelemetryPayload(payload), null);
});

test('accepts a schema-v3 payload with a populated firstUsefulFrame', () => {
  const payload = structuredClone(basePayload) as any;
  payload.schemaVersion = 3;
  payload.summary.firstUsefulFrame = {
    samples: 12, avgMs: 850, p50Ms: 700, p75Ms: 950, p95Ms: 1800, emergencyFallbackCount: 1,
  };

  const parsed = parseNativeTelemetryPayload(payload);
  assert.ok(parsed);
  assert.deepEqual(parsed.summary.firstUsefulFrame, {
    samples: 12, avgMs: 850, p50Ms: 700, p75Ms: 950, p95Ms: 1800, emergencyFallbackCount: 1,
  });
});

test('accepts an explicit null firstUsefulFrame (schema-v3 build, no cold start recorded yet) -- not a parse failure', () => {
  const payload = structuredClone(basePayload) as any;
  payload.schemaVersion = 3;
  payload.summary.firstUsefulFrame = null;

  const parsed = parseNativeTelemetryPayload(payload);
  assert.ok(parsed, 'an explicit null must validate, not be treated as malformed');
  assert.equal(parsed.summary.firstUsefulFrame, null);
});

test('defaults firstUsefulFrame to null when the field is entirely absent (pre-schema-v3 payload)', () => {
  const parsed = parseNativeTelemetryPayload(basePayload);
  assert.ok(parsed);
  assert.equal(parsed.summary.firstUsefulFrame, null, 'absence and explicit null must resolve to the same default');
});

test('rejects a present-but-malformed firstUsefulFrame instead of silently defaulting it to null', () => {
  const payload = structuredClone(basePayload) as any;
  payload.schemaVersion = 3;
  payload.summary.firstUsefulFrame = { samples: 12, avgMs: 850, p50Ms: 700, p75Ms: 950, p95Ms: -1, emergencyFallbackCount: 0 };
  assert.equal(
    parseNativeTelemetryPayload(payload), null,
    'a malformed-but-present firstUsefulFrame must fail the whole payload, the same way every other field here does'
  );
});

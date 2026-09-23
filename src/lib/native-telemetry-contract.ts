// Mirrors the shape of shoonaya-mobile's lib/telemetry.ts TelemetrySummary.
// Kept as a hand-copied contract (like client-error-contract.ts) rather than
// a shared package -- these are two separate repos/deploys.

export const NATIVE_TELEMETRY_ROUTES = [
  'home', 'mandali', 'settings', 'notifications', 'bhakti', 'dharm_veer',
  'pathshala', 'panchang', 'vrat', 'japa', 'profile',
] as const;
export type NativeTelemetryRoute = (typeof NATIVE_TELEMETRY_ROUTES)[number];

export const NATIVE_TELEMETRY_OUTBOX_FEATURES = [
  'settings', 'notifications', 'japa', 'mandali_posts', 'mood', 'sankalpa', 'reactions',
] as const;
export type NativeTelemetryOutboxFeature = (typeof NATIVE_TELEMETRY_OUTBOX_FEATURES)[number];

// Stage 0 (docs/PERFORMANCE_RESEARCH_AND_EXECUTION_PLAN.md's reliability
// plan, native repo lib/telemetry.ts schema v2). Mirrors native's
// FailureReason / InteractionName exactly.
export const NATIVE_TELEMETRY_FAILURE_REASONS = [
  'unauthorized', 'timeout', 'network', 'server_error', 'owner_mismatch', 'malformed_response', 'unknown',
] as const;
export type NativeTelemetryFailureReason = (typeof NATIVE_TELEMETRY_FAILURE_REASONS)[number];

export const NATIVE_TELEMETRY_INTERACTION_NAMES = ['mandali_comment_expand'] as const;
export type NativeTelemetryInteractionName = (typeof NATIVE_TELEMETRY_INTERACTION_NAMES)[number];

export type NativeTelemetryRouteSummary = {
  route: NativeTelemetryRoute;
  opens: number;
  cacheHitRate: number;
  // Optional (default 0/absent-safe): only populated by app builds that
  // upload schema v2 summaries. An older build's payload is still valid
  // without these -- see parseRouteSummary.
  staleOpens: number;
  staleReportingOpens: number;
  avgDurationMs: number;
  p95DurationMs: number;
  refreshFailures: number;
  failureReasons: Partial<Record<NativeTelemetryFailureReason, number>>;
  failuresWithCachedData: number;
};

export type NativeTelemetryDuplicateRequestSummary = {
  route: NativeTelemetryRoute;
  avoided: number;
  detected: number;
};

export type NativeTelemetryInteractionTimingSummary = {
  name: NativeTelemetryInteractionName;
  samples: number;
  avgDurationMs: number;
  p95DurationMs: number;
};

export type NativeTelemetryLoaderExposureSummary = {
  route: NativeTelemetryRoute;
  shown: number;
  shownWithUsableData: number;
  avgDurationMs: number;
  p95DurationMs: number;
};

export type NativeTelemetryOutboxSummary = {
  feature: NativeTelemetryOutboxFeature;
  success: number;
  retry: number;
  permanentFailure: number;
};

export type NativeTelemetryServerTimingSummary = {
  route: NativeTelemetryRoute;
  samples: number;
  sections: Array<{ name: string; avgDurationMs: number; p95DurationMs: number }>;
};

// Reliability plan item 8 (native repo lib/telemetry.ts schema v3).
// Cold-start-to-interactive timing -- null is a distinct, valid state (a
// schema-v3 build that simply has not recorded a cold start yet), not a
// parse failure; see parseFirstUsefulFrameSummary's caller for how the
// three states (absent/legacy, explicit null, real summary) are told apart.
export type NativeTelemetryFirstUsefulFrameSummary = {
  samples: number;
  avgMs: number;
  p50Ms: number;
  p75Ms: number;
  p95Ms: number;
  emergencyFallbackCount: number;
};

export type NativeTelemetryPayload = {
  schemaVersion: number;
  appVersion: string | null;
  platform: 'ios' | 'android' | null;
  summary: {
    routes: NativeTelemetryRouteSummary[];
    outbox: NativeTelemetryOutboxSummary[];
    serverTimings: NativeTelemetryServerTimingSummary[];
    // Optional arrays (default [] when absent) for the same reason the new
    // NativeTelemetryRouteSummary fields are optional above: a pre-Stage-0
    // app build's payload has none of these and must still validate.
    duplicateRequests: NativeTelemetryDuplicateRequestSummary[];
    interactionTimings: NativeTelemetryInteractionTimingSummary[];
    loaderExposure: NativeTelemetryLoaderExposureSummary[];
    // Optional (absent = pre-schema-v3 payload, defaults to null), and null
    // itself is also a valid value (a schema-v3 build with no cold start
    // recorded yet) -- distinct from every other field above, which use
    // absence/[] as their empty state instead of null.
    firstUsefulFrame: NativeTelemetryFirstUsefulFrameSummary | null;
    totalEvents: number;
  };
};

// Generous ceiling above the known enum sizes (11 routes, 7 outbox
// features) -- defends against a malformed/oversized payload without
// hand-tuning to the exact current enum length.
const MAX_ARRAY_LENGTH = 30;
const MAX_SECTION_NAME_LENGTH = 60;

function finiteNonNegative(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function boundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

// `undefined` (a pre-Stage-0 payload) is valid and defaults to 0 -- only an
// actually-present-but-wrong value fails validation.
function optionalFiniteNonNegative(value: unknown): number | null {
  if (value === undefined) return 0;
  return finiteNonNegative(value);
}

function parseFailureReasons(input: unknown): Partial<Record<NativeTelemetryFailureReason, number>> | null {
  if (input === undefined) return {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length > NATIVE_TELEMETRY_FAILURE_REASONS.length) return null;

  const result: Partial<Record<NativeTelemetryFailureReason, number>> = {};
  for (const key of keys) {
    if (!NATIVE_TELEMETRY_FAILURE_REASONS.includes(key as NativeTelemetryFailureReason)) return null;
    const value = finiteNonNegative(record[key]);
    if (value === null) return null;
    result[key as NativeTelemetryFailureReason] = value;
  }
  return result;
}

function parseRouteSummary(input: unknown): NativeTelemetryRouteSummary | null {
  if (!input || typeof input !== 'object') return null;
  const r = input as Record<string, unknown>;
  if (!NATIVE_TELEMETRY_ROUTES.includes(r.route as NativeTelemetryRoute)) return null;

  const opens = finiteNonNegative(r.opens);
  const cacheHitRate = finiteNonNegative(r.cacheHitRate);
  const staleOpens = optionalFiniteNonNegative(r.staleOpens);
  const staleReportingOpens = optionalFiniteNonNegative(r.staleReportingOpens);
  const avgDurationMs = finiteNonNegative(r.avgDurationMs);
  const p95DurationMs = finiteNonNegative(r.p95DurationMs);
  const refreshFailures = finiteNonNegative(r.refreshFailures);
  const failureReasons = parseFailureReasons(r.failureReasons);
  const failuresWithCachedData = optionalFiniteNonNegative(r.failuresWithCachedData);
  if (opens === null || cacheHitRate === null || staleOpens === null || staleReportingOpens === null ||
    avgDurationMs === null || p95DurationMs === null || refreshFailures === null || cacheHitRate > 1 ||
    failureReasons === null || failuresWithCachedData === null) {
    return null;
  }

  return {
    route: r.route as NativeTelemetryRoute,
    opens, cacheHitRate, staleOpens, staleReportingOpens, avgDurationMs, p95DurationMs, refreshFailures,
    failureReasons, failuresWithCachedData,
  };
}

function parseDuplicateRequestSummary(input: unknown): NativeTelemetryDuplicateRequestSummary | null {
  if (!input || typeof input !== 'object') return null;
  const d = input as Record<string, unknown>;
  if (!NATIVE_TELEMETRY_ROUTES.includes(d.route as NativeTelemetryRoute)) return null;

  const avoided = finiteNonNegative(d.avoided);
  const detected = finiteNonNegative(d.detected);
  if (avoided === null || detected === null) return null;

  return { route: d.route as NativeTelemetryRoute, avoided, detected };
}

function parseInteractionTimingSummary(input: unknown): NativeTelemetryInteractionTimingSummary | null {
  if (!input || typeof input !== 'object') return null;
  const i = input as Record<string, unknown>;
  if (!NATIVE_TELEMETRY_INTERACTION_NAMES.includes(i.name as NativeTelemetryInteractionName)) return null;

  const samples = finiteNonNegative(i.samples);
  const avgDurationMs = finiteNonNegative(i.avgDurationMs);
  const p95DurationMs = finiteNonNegative(i.p95DurationMs);
  if (samples === null || avgDurationMs === null || p95DurationMs === null) return null;

  return { name: i.name as NativeTelemetryInteractionName, samples, avgDurationMs, p95DurationMs };
}

function parseLoaderExposureSummary(input: unknown): NativeTelemetryLoaderExposureSummary | null {
  if (!input || typeof input !== 'object') return null;
  const l = input as Record<string, unknown>;
  if (!NATIVE_TELEMETRY_ROUTES.includes(l.route as NativeTelemetryRoute)) return null;

  const shown = finiteNonNegative(l.shown);
  const shownWithUsableData = finiteNonNegative(l.shownWithUsableData);
  const avgDurationMs = finiteNonNegative(l.avgDurationMs);
  const p95DurationMs = finiteNonNegative(l.p95DurationMs);
  if (shown === null || shownWithUsableData === null || avgDurationMs === null || p95DurationMs === null) return null;

  return { route: l.route as NativeTelemetryRoute, shown, shownWithUsableData, avgDurationMs, p95DurationMs };
}

function parseOutboxSummary(input: unknown): NativeTelemetryOutboxSummary | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  if (!NATIVE_TELEMETRY_OUTBOX_FEATURES.includes(o.feature as NativeTelemetryOutboxFeature)) return null;

  const success = finiteNonNegative(o.success);
  const retry = finiteNonNegative(o.retry);
  const permanentFailure = finiteNonNegative(o.permanentFailure);
  if (success === null || retry === null || permanentFailure === null) return null;

  return { feature: o.feature as NativeTelemetryOutboxFeature, success, retry, permanentFailure };
}

function parseServerTimingSummary(input: unknown): NativeTelemetryServerTimingSummary | null {
  if (!input || typeof input !== 'object') return null;
  const s = input as Record<string, unknown>;
  if (!NATIVE_TELEMETRY_ROUTES.includes(s.route as NativeTelemetryRoute)) return null;

  const samples = finiteNonNegative(s.samples);
  if (samples === null || !Array.isArray(s.sections) || s.sections.length > MAX_ARRAY_LENGTH) return null;

  const sections: Array<{ name: string; avgDurationMs: number; p95DurationMs: number }> = [];
  for (const raw of s.sections) {
    if (!raw || typeof raw !== 'object') return null;
    const sec = raw as Record<string, unknown>;
    const name = boundedString(sec.name, MAX_SECTION_NAME_LENGTH);
    const avgDurationMs = finiteNonNegative(sec.avgDurationMs);
    const p95DurationMs = finiteNonNegative(sec.p95DurationMs);
    if (!name || avgDurationMs === null || p95DurationMs === null) return null;
    sections.push({ name, avgDurationMs, p95DurationMs });
  }

  return { route: s.route as NativeTelemetryRoute, samples, sections };
}

function parseFirstUsefulFrameSummary(input: unknown): NativeTelemetryFirstUsefulFrameSummary | null {
  if (!input || typeof input !== 'object') return null;
  const f = input as Record<string, unknown>;

  const samples = finiteNonNegative(f.samples);
  const avgMs = finiteNonNegative(f.avgMs);
  const p50Ms = finiteNonNegative(f.p50Ms);
  const p75Ms = finiteNonNegative(f.p75Ms);
  const p95Ms = finiteNonNegative(f.p95Ms);
  const emergencyFallbackCount = finiteNonNegative(f.emergencyFallbackCount);
  if (samples === null || avgMs === null || p50Ms === null || p75Ms === null || p95Ms === null || emergencyFallbackCount === null) {
    return null;
  }

  return { samples, avgMs, p50Ms, p75Ms, p95Ms, emergencyFallbackCount };
}

export function parseNativeTelemetryPayload(input: unknown): NativeTelemetryPayload | null {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;

  const schemaVersion = finiteNonNegative(record.schemaVersion);
  if (schemaVersion === null) return null;

  const appVersion = boundedString(record.appVersion, 40);
  const platformRaw = record.platform;
  const platform = platformRaw === 'ios' || platformRaw === 'android' ? platformRaw : null;

  const summaryRaw = record.summary;
  if (!summaryRaw || typeof summaryRaw !== 'object') return null;
  const s = summaryRaw as Record<string, unknown>;

  const totalEvents = finiteNonNegative(s.totalEvents);
  if (totalEvents === null) return null;
  if (!Array.isArray(s.routes) || s.routes.length > MAX_ARRAY_LENGTH) return null;
  if (!Array.isArray(s.outbox) || s.outbox.length > MAX_ARRAY_LENGTH) return null;
  if (!Array.isArray(s.serverTimings) || s.serverTimings.length > MAX_ARRAY_LENGTH) return null;
  // Optional, default [] -- see the NativeTelemetryPayload doc comment.
  if (s.duplicateRequests !== undefined && (!Array.isArray(s.duplicateRequests) || s.duplicateRequests.length > MAX_ARRAY_LENGTH)) return null;
  if (s.interactionTimings !== undefined && (!Array.isArray(s.interactionTimings) || s.interactionTimings.length > MAX_ARRAY_LENGTH)) return null;
  if (s.loaderExposure !== undefined && (!Array.isArray(s.loaderExposure) || s.loaderExposure.length > MAX_ARRAY_LENGTH)) return null;

  const routes: NativeTelemetryRouteSummary[] = [];
  for (const raw of s.routes) {
    const parsed = parseRouteSummary(raw);
    if (!parsed) return null;
    routes.push(parsed);
  }

  const outbox: NativeTelemetryOutboxSummary[] = [];
  for (const raw of s.outbox) {
    const parsed = parseOutboxSummary(raw);
    if (!parsed) return null;
    outbox.push(parsed);
  }

  const serverTimings: NativeTelemetryServerTimingSummary[] = [];
  for (const raw of s.serverTimings) {
    const parsed = parseServerTimingSummary(raw);
    if (!parsed) return null;
    serverTimings.push(parsed);
  }

  const duplicateRequests: NativeTelemetryDuplicateRequestSummary[] = [];
  for (const raw of (s.duplicateRequests as unknown[] | undefined) ?? []) {
    const parsed = parseDuplicateRequestSummary(raw);
    if (!parsed) return null;
    duplicateRequests.push(parsed);
  }

  const interactionTimings: NativeTelemetryInteractionTimingSummary[] = [];
  for (const raw of (s.interactionTimings as unknown[] | undefined) ?? []) {
    const parsed = parseInteractionTimingSummary(raw);
    if (!parsed) return null;
    interactionTimings.push(parsed);
  }

  const loaderExposure: NativeTelemetryLoaderExposureSummary[] = [];
  for (const raw of (s.loaderExposure as unknown[] | undefined) ?? []) {
    const parsed = parseLoaderExposureSummary(raw);
    if (!parsed) return null;
    loaderExposure.push(parsed);
  }

  // Three valid states, not two: absent (pre-schema-v3 payload) and explicit
  // null (a schema-v3 build with no cold start recorded yet) both resolve to
  // `null` here without touching the parser; only a present-but-malformed
  // value fails the whole payload, same as every other field above.
  let firstUsefulFrame: NativeTelemetryFirstUsefulFrameSummary | null = null;
  if (s.firstUsefulFrame !== undefined && s.firstUsefulFrame !== null) {
    const parsed = parseFirstUsefulFrameSummary(s.firstUsefulFrame);
    if (!parsed) return null;
    firstUsefulFrame = parsed;
  }

  return {
    schemaVersion,
    appVersion,
    platform,
    summary: { routes, outbox, serverTimings, duplicateRequests, interactionTimings, loaderExposure, firstUsefulFrame, totalEvents },
  };
}

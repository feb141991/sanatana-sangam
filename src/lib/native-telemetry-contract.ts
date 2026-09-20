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

export type NativeTelemetryRouteSummary = {
  route: NativeTelemetryRoute;
  opens: number;
  cacheHitRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  refreshFailures: number;
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

export type NativeTelemetryPayload = {
  schemaVersion: number;
  appVersion: string | null;
  platform: 'ios' | 'android' | null;
  summary: {
    routes: NativeTelemetryRouteSummary[];
    outbox: NativeTelemetryOutboxSummary[];
    serverTimings: NativeTelemetryServerTimingSummary[];
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

function parseRouteSummary(input: unknown): NativeTelemetryRouteSummary | null {
  if (!input || typeof input !== 'object') return null;
  const r = input as Record<string, unknown>;
  if (!NATIVE_TELEMETRY_ROUTES.includes(r.route as NativeTelemetryRoute)) return null;

  const opens = finiteNonNegative(r.opens);
  const cacheHitRate = finiteNonNegative(r.cacheHitRate);
  const avgDurationMs = finiteNonNegative(r.avgDurationMs);
  const p95DurationMs = finiteNonNegative(r.p95DurationMs);
  const refreshFailures = finiteNonNegative(r.refreshFailures);
  if (opens === null || cacheHitRate === null || avgDurationMs === null ||
    p95DurationMs === null || refreshFailures === null || cacheHitRate > 1) {
    return null;
  }

  return {
    route: r.route as NativeTelemetryRoute,
    opens, cacheHitRate, avgDurationMs, p95DurationMs, refreshFailures,
  };
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

  return {
    schemaVersion,
    appVersion,
    platform,
    summary: { routes, outbox, serverTimings, totalEvents },
  };
}

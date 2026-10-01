export const NATIVE_API_DIAGNOSTIC_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OTHER'] as const;
export type NativeApiDiagnosticMethod = (typeof NATIVE_API_DIAGNOSTIC_METHODS)[number];

export const NATIVE_API_DIAGNOSTIC_OUTCOMES = [
  'http_failure', 'network_failure', 'timeout', 'client_failure', 'owner_mismatch',
  'retry_recovered', 'auth_recovered', 'slow_success',
] as const;
export type NativeApiDiagnosticOutcome = (typeof NATIVE_API_DIAGNOSTIC_OUTCOMES)[number];

export type NativeApiDiagnosticEvent = {
  clientEventId: string;
  serverRequestId: string | null;
  retryServerRequestId: string | null;
  endpoint: string;
  method: NativeApiDiagnosticMethod;
  outcome: NativeApiDiagnosticOutcome;
  firstStatus: number | null;
  finalStatus: number | null;
  attemptCount: number;
  durationMs: number;
  timestamp: number;
};

export type NativeApiDiagnosticPayload = {
  appVersion: string | null;
  platform: 'ios' | 'android' | null;
  events: NativeApiDiagnosticEvent[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENDPOINT = /^\/(api|supabase)\/[a-z0-9/_:-]{1,115}$/;
const MAX_EVENTS = 25;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function boundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function nullableUuid(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && UUID.test(value));
}

function nullableStatus(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 100 && value <= 599);
}

function parseEvent(value: unknown): NativeApiDiagnosticEvent | null {
  if (!isRecord(value)) return null;
  const method = value.method;
  const outcome = value.outcome;
  const endpoint = value.endpoint;
  const attemptCount = value.attemptCount;
  const durationMs = value.durationMs;
  const timestamp = value.timestamp;

  if (typeof value.clientEventId !== 'string' || !UUID.test(value.clientEventId)
    || !nullableUuid(value.serverRequestId) || !nullableUuid(value.retryServerRequestId)
    || typeof endpoint !== 'string' || endpoint.length > 120 || !ENDPOINT.test(endpoint)
    || !NATIVE_API_DIAGNOSTIC_METHODS.includes(method as NativeApiDiagnosticMethod)
    || !NATIVE_API_DIAGNOSTIC_OUTCOMES.includes(outcome as NativeApiDiagnosticOutcome)
    || !nullableStatus(value.firstStatus) || !nullableStatus(value.finalStatus)
    || typeof attemptCount !== 'number' || !Number.isInteger(attemptCount) || attemptCount < 0 || attemptCount > 4
    || typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 0 || durationMs > 180_000
    || typeof timestamp !== 'number' || !Number.isFinite(timestamp)
    || timestamp < Date.now() - MAX_AGE_MS || timestamp > Date.now() + 24 * 60 * 60 * 1000
    || (value.retryServerRequestId !== null && value.retryServerRequestId === value.serverRequestId)
    || ((outcome === 'retry_recovered' || outcome === 'auth_recovered' || outcome === 'slow_success')
      && (value.finalStatus === null || value.finalStatus < 200 || value.finalStatus >= 300))
    || (outcome === 'http_failure'
      && (value.finalStatus === null || (value.finalStatus >= 200 && value.finalStatus < 400)))
  ) {
    return null;
  }

  return {
    clientEventId: value.clientEventId,
    serverRequestId: value.serverRequestId,
    retryServerRequestId: value.retryServerRequestId,
    endpoint,
    method: method as NativeApiDiagnosticMethod,
    outcome: outcome as NativeApiDiagnosticOutcome,
    firstStatus: value.firstStatus,
    finalStatus: value.finalStatus,
    attemptCount,
    durationMs,
    timestamp,
  };
}

export function parseNativeApiDiagnosticPayload(input: unknown): NativeApiDiagnosticPayload | null {
  if (!isRecord(input) || !Array.isArray(input.events) || input.events.length < 1 || input.events.length > MAX_EVENTS) return null;
  const appVersion = input.appVersion === null ? null : boundedString(input.appVersion, 40);
  const platform = input.platform === 'ios' || input.platform === 'android' ? input.platform : null;
  if (input.appVersion !== null && appVersion === null) return null;

  const events: NativeApiDiagnosticEvent[] = [];
  for (const value of input.events) {
    const event = parseEvent(value);
    if (!event) return null;
    events.push(event);
  }
  if (new Set(events.map((event) => event.clientEventId)).size !== events.length) return null;

  return { appVersion, platform, events };
}

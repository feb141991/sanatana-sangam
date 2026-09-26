export const NATIVE_AUTH_DIAGNOSTIC_ROUTES = [
  'native_home_summary', 'sankalpa', 'register_token', 'festival_quiz_seasons',
  'ai_chat_usage', 'native_home_live', 'dharm_veer_submit',
] as const;
export type NativeAuthDiagnosticRoute = (typeof NATIVE_AUTH_DIAGNOSTIC_ROUTES)[number];

export type NativeAuthDiagnosticEvent = {
  requestId: string;
  retryRequestId: string | null;
  route: NativeAuthDiagnosticRoute;
  authCode: 'AUTH_REQUIRED' | 'AUTH_UNAVAILABLE' | 'unknown';
  initialStatus: number;
  finalStatus: number;
  authReadyWaitMs: number;
  hadAccessToken: boolean;
  refreshAttempted: boolean;
  refreshSucceeded: boolean;
  durationMs: number;
  timestamp: number;
};

export type NativeAuthDiagnosticPayload = {
  appVersion: string | null;
  platform: 'ios' | 'android' | null;
  events: NativeAuthDiagnosticEvent[];
};

const MAX_EVENTS = 50;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function nonNegativeInteger(value: unknown, max: number): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max ? value : null;
}

function boundedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function parseEvent(input: unknown): NativeAuthDiagnosticEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const event = input as Record<string, unknown>;
  const requestId = boundedString(event.requestId, 36);
  const retryRequestId = event.retryRequestId === null ? null : boundedString(event.retryRequestId, 36);
  const authReadyWaitMs = nonNegativeInteger(event.authReadyWaitMs, 180_000);
  const durationMs = nonNegativeInteger(event.durationMs, 180_000);
  const timestamp = nonNegativeInteger(event.timestamp, Number.MAX_SAFE_INTEGER);
  const initialStatus = nonNegativeInteger(event.initialStatus, 599);
  const finalStatus = nonNegativeInteger(event.finalStatus, 599);
  if (!requestId || !UUID_V4.test(requestId) || (event.retryRequestId !== null && (!retryRequestId || !UUID_V4.test(retryRequestId) || retryRequestId === requestId)) ||
    !NATIVE_AUTH_DIAGNOSTIC_ROUTES.includes(event.route as NativeAuthDiagnosticRoute) ||
    !['AUTH_REQUIRED', 'AUTH_UNAVAILABLE', 'unknown'].includes(event.authCode as string) ||
    initialStatus === null || ![0, 401, 503].includes(initialStatus) ||
    finalStatus === null || (finalStatus !== 0 && finalStatus < 100) ||
    authReadyWaitMs === null || durationMs === null || timestamp === null ||
    timestamp < Date.now() - 90 * 24 * 60 * 60 * 1000 || timestamp > Date.now() + 24 * 60 * 60 * 1000 ||
    typeof event.hadAccessToken !== 'boolean' || typeof event.refreshAttempted !== 'boolean' ||
    typeof event.refreshSucceeded !== 'boolean' || (event.refreshSucceeded && !event.refreshAttempted)) return null;

  return {
    requestId,
    retryRequestId,
    route: event.route as NativeAuthDiagnosticRoute,
    authCode: event.authCode as NativeAuthDiagnosticEvent['authCode'],
    initialStatus,
    finalStatus,
    authReadyWaitMs,
    hadAccessToken: event.hadAccessToken,
    refreshAttempted: event.refreshAttempted,
    refreshSucceeded: event.refreshSucceeded,
    durationMs,
    timestamp,
  };
}

export function parseNativeAuthDiagnosticPayload(input: unknown): NativeAuthDiagnosticPayload | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const payload = input as Record<string, unknown>;
  if (!Array.isArray(payload.events) || payload.events.length < 1 || payload.events.length > MAX_EVENTS) return null;

  const events: NativeAuthDiagnosticEvent[] = [];
  for (const raw of payload.events) {
    const event = parseEvent(raw);
    if (!event) return null;
    events.push(event);
  }
  if (new Set(events.map((event) => event.requestId)).size !== events.length) return null;

  const platform = payload.platform === 'ios' || payload.platform === 'android' ? payload.platform : null;
  const appVersion = boundedString(payload.appVersion, 40);
  return { appVersion, platform, events };
}

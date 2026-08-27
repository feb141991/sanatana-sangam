export const CLIENT_ERROR_SOURCES = [
  'react_root',
  'react_home',
  'window_error',
  'unhandled_rejection',
  'qa_probe',
] as const;

export type ClientErrorSource = (typeof CLIENT_ERROR_SOURCES)[number];

export type ClientErrorPayload = {
  source: ClientErrorSource;
  errorName: string;
  message: string;
  stack: string | null;
  componentStack: string | null;
  route: string;
  browserFamily: string;
  osFamily: string;
  clientReleaseSha: string;
  clientDeploymentUrl: string | null;
  serviceWorkerController: string | null;
  online: boolean | null;
  anonymousSessionNonce: string | null;
};

const MAX = {
  errorName: 80,
  message: 1_000,
  stack: 12_000,
  componentStack: 6_000,
  route: 300,
  browserFamily: 40,
  osFamily: 40,
  releaseSha: 64,
  deploymentUrl: 160,
  serviceWorkerController: 300,
  sessionNonce: 80,
} as const;

function boundedString(value: unknown, maxLength: number, required = false): string | null {
  if (typeof value !== 'string') return required ? '' : null;
  const trimmed = value.trim();
  if (!trimmed) return required ? '' : null;
  return trimmed.slice(0, maxLength);
}

export function redactClientErrorText(value: string): string {
  return value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[JWT]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '[UUID]')
    .replace(/([?&](?:token|code|access_token|refresh_token|email|user_id)=)[^&#\s]+/gi, '$1[REDACTED]')
    .replace(/https?:\/\/([^/\s]+)([^\s?#]*)[?#][^\s)]+/gi, 'https://$1$2?[REDACTED]')
    .replace(/\/Users\/[^/\s]+/g, '/Users/[REDACTED]')
    .replace(/\b-?\d{1,3}\.\d{4,}\s*[,/]\s*-?\d{1,3}\.\d{4,}\b/g, '[COORDINATES]');
}

function safeRoute(value: unknown): string {
  const route = boundedString(value, MAX.route, true) || '/unknown';
  const path = route.split(/[?#]/, 1)[0];
  return path.startsWith('/') ? path : '/unknown';
}

function safeController(value: unknown): string | null {
  const raw = boundedString(value, MAX.serviceWorkerController);
  if (!raw) return null;
  try {
    const url = new URL(raw, 'https://local.invalid');
    return url.pathname.slice(0, MAX.serviceWorkerController);
  } catch {
    return null;
  }
}

export function parseClientErrorPayload(input: unknown): ClientErrorPayload | null {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  if (!CLIENT_ERROR_SOURCES.includes(record.source as ClientErrorSource)) return null;

  const errorName = boundedString(record.errorName, MAX.errorName, true);
  const message = boundedString(record.message, MAX.message, true);
  const browserFamily = boundedString(record.browserFamily, MAX.browserFamily, true);
  const osFamily = boundedString(record.osFamily, MAX.osFamily, true);
  const clientReleaseSha = boundedString(record.clientReleaseSha, MAX.releaseSha, true);
  if (!errorName || !message || !browserFamily || !osFamily || !clientReleaseSha) return null;

  const stack = boundedString(record.stack, MAX.stack);
  const componentStack = boundedString(record.componentStack, MAX.componentStack);
  const deploymentUrl = boundedString(record.clientDeploymentUrl, MAX.deploymentUrl);
  const nonce = boundedString(record.anonymousSessionNonce, MAX.sessionNonce);

  return {
    source: record.source as ClientErrorSource,
    errorName: redactClientErrorText(errorName),
    message: redactClientErrorText(message),
    stack: stack ? redactClientErrorText(stack) : null,
    componentStack: componentStack ? redactClientErrorText(componentStack) : null,
    route: safeRoute(record.route),
    browserFamily: redactClientErrorText(browserFamily),
    osFamily: redactClientErrorText(osFamily),
    clientReleaseSha: redactClientErrorText(clientReleaseSha),
    clientDeploymentUrl: deploymentUrl ? redactClientErrorText(deploymentUrl) : null,
    serviceWorkerController: safeController(record.serviceWorkerController),
    online: typeof record.online === 'boolean' ? record.online : null,
    anonymousSessionNonce: nonce ? redactClientErrorText(nonce) : null,
  };
}

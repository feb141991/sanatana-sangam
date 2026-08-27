'use client';

import type { ClientErrorSource } from '@/lib/client-error-contract';
import { CLIENT_RELEASE_IDENTITY } from '@/lib/release-identity';

type ReportInput = {
  source: ClientErrorSource;
  error: unknown;
  componentStack?: string | null;
};

type IncidentResponse = { incidentId?: string };

type PendingReport = { timestamp: number; incident: Promise<string | null> };
const recentlyReported = new Map<string, PendingReport>();
const DEDUPE_WINDOW_MS = 30_000;

function errorParts(error: unknown) {
  if (error instanceof Error) {
    return {
      errorName: error.name || 'Error',
      message: error.message || 'Unknown client error',
      stack: error.stack || null,
    };
  }
  if (typeof error === 'string') {
    return { errorName: 'Error', message: error, stack: null };
  }
  return { errorName: 'UnknownError', message: 'Unknown client error', stack: null };
}

function browserFamily(userAgent: string): string {
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/CriOS|Chrome\//.test(userAgent)) return 'Chrome';
  if (/FxiOS|Firefox\//.test(userAgent)) return 'Firefox';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return 'Other';
}

function osFamily(userAgent: string): string {
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'macOS';
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Linux/.test(userAgent)) return 'Linux';
  return 'Other';
}

function anonymousSessionNonce(): string | null {
  try {
    const key = 'sh_client_error_session';
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const value = crypto.randomUUID();
    sessionStorage.setItem(key, value);
    return value;
  } catch {
    return null;
  }
}

function controllerUrl(): string | null {
  try {
    return navigator.serviceWorker?.controller?.scriptURL || null;
  } catch {
    return null;
  }
}

function recentReport(key: string): PendingReport | null {
  const now = Date.now();
  const previous = recentlyReported.get(key);
  if (previous && now - previous.timestamp < DEDUPE_WINDOW_MS) return previous;
  for (const [candidate, report] of recentlyReported) {
    if (now - report.timestamp > DEDUPE_WINDOW_MS) recentlyReported.delete(candidate);
  }
  return null;
}

export async function reportClientError(input: ReportInput): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const parts = errorParts(input.error);
  const dedupeKey = `${parts.errorName}:${parts.message}:${location.pathname}`;
  const existing = recentReport(dedupeKey);
  if (existing) return existing.incident;

  const payload = {
    source: input.source,
    ...parts,
    componentStack: input.componentStack || null,
    route: location.pathname,
    browserFamily: browserFamily(navigator.userAgent),
    osFamily: osFamily(navigator.userAgent),
    clientReleaseSha: CLIENT_RELEASE_IDENTITY.sha,
    clientDeploymentUrl: CLIENT_RELEASE_IDENTITY.deploymentUrl,
    serviceWorkerController: controllerUrl(),
    online: typeof navigator.onLine === 'boolean' ? navigator.onLine : null,
    anonymousSessionNonce: anonymousSessionNonce(),
  };
  const body = JSON.stringify(payload);

  const incident = (async () => {
    if (document.visibilityState === 'hidden' && typeof navigator.sendBeacon === 'function') {
      const queued = navigator.sendBeacon(
        '/api/client-errors',
        new Blob([body], { type: 'application/json' }),
      );
      if (queued) return null;
    }

    try {
      const response = await fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'omit',
      });
      if (!response.ok) return null;
      const result = (await response.json()) as IncidentResponse;
      return typeof result.incidentId === 'string' ? result.incidentId : null;
    } catch {
      return null;
    }
  })();

  recentlyReported.set(dedupeKey, { timestamp: Date.now(), incident });
  return incident;
}

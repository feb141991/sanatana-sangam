import type {
  LogExplorerFilters,
  LogEventSeverity,
  LogEventSource,
  NormalizedLogEvent,
  LogEventCorrelation,
} from "./admin-log-explorer-types";

const SENSITIVE_KEY_REGEX = /(password|token|secret|authorization|cookie|session_id|jwt|bearer|credit_card|cvv|api_key)/i;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /\+?\d{1,3}[- ]?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b|\b\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g;

/**
 * Deeply redacts sensitive fields and PII (secrets, tokens, auth headers, emails, phones) from log metadata.
 */
export function redactSensitiveLogData(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    let sanitized = value.replace(EMAIL_REGEX, "[REDACTED_EMAIL]");
    sanitized = sanitized.replace(PHONE_REGEX, "[REDACTED_PHONE]");
    if (sanitized.toLowerCase().startsWith("bearer ")) {
      return "Bearer [REDACTED_TOKEN]";
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveLogData(item));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_REGEX.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redactSensitiveLogData(v);
      }
    }
    return out;
  }

  return value;
}

/**
 * Parses URL search params into strongly typed LogExplorerFilters.
 * Caps pagination limit to 50 to enforce bounded query bounds.
 */
export function parseLogFiltersFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): LogExplorerFilters {
  const getParam = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      const val = params.get(key);
      return val && val.trim() !== "" ? val.trim() : undefined;
    }
    const raw = params[key];
    if (Array.isArray(raw)) return raw[0]?.trim() || undefined;
    if (typeof raw === "string" && raw.trim() !== "") return raw.trim();
    return undefined;
  };

  const sourceRaw = getParam("source");
  const validSources: LogEventSource[] = [
    "monitoring",
    "client_errors",
    "crons",
    "notifications",
    "golden_fixtures",
  ];
  const source = validSources.includes(sourceRaw as LogEventSource)
    ? (sourceRaw as LogEventSource)
    : "all";

  const severityRaw = getParam("severity");
  const validSeverities: LogEventSeverity[] = ["critical", "warning", "info"];
  const severity = validSeverities.includes(severityRaw as LogEventSeverity)
    ? (severityRaw as LogEventSeverity)
    : "all";

  const rawLimit = Number(getParam("limit"));
  const limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 25;

  return {
    source,
    severity,
    route: getParam("route"),
    requestId: getParam("requestId"),
    fingerprint: getParam("fingerprint"),
    cronJob: getParam("cronJob"),
    deploymentSha: getParam("deploymentSha"),
    userId: getParam("userId"),
    startDate: getParam("startDate"),
    endDate: getParam("endDate"),
    cursor: getParam("cursor"),
    limit,
  };
}

/**
 * Serializes LogExplorerFilters to URLSearchParams.
 */
export function serializeLogFiltersToSearchParams(filters: LogExplorerFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.source && filters.source !== "all") params.set("source", filters.source);
  if (filters.severity && filters.severity !== "all") params.set("severity", filters.severity);
  if (filters.route) params.set("route", filters.route);
  if (filters.requestId) params.set("requestId", filters.requestId);
  if (filters.fingerprint) params.set("fingerprint", filters.fingerprint);
  if (filters.cronJob) params.set("cronJob", filters.cronJob);
  if (filters.deploymentSha) params.set("deploymentSha", filters.deploymentSha);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.limit && filters.limit !== 25) params.set("limit", String(filters.limit));

  return params;
}

export interface CorrelationLinkItem {
  key: string;
  label: string;
  value: string;
  href?: string;
  type: "request" | "trace" | "fingerprint" | "cron" | "sha" | "user" | "notification" | "incident" | "festival";
}

/**
 * Extracts correlation links only when real, non-empty values exist.
 * Never outputs empty strings or placeholder identifiers.
 */
export function extractCorrelationLinks(correlation: LogEventCorrelation): CorrelationLinkItem[] {
  const links: CorrelationLinkItem[] = [];

  if (correlation.requestId && correlation.requestId.trim() !== "") {
    links.push({
      key: "req_id",
      label: "Request ID",
      value: correlation.requestId.trim(),
      href: `/admin/logs?requestId=${encodeURIComponent(correlation.requestId.trim())}`,
      type: "request",
    });
  }

  if (correlation.traceId && correlation.traceId.trim() !== "") {
    links.push({
      key: "trace_id",
      label: "Trace ID",
      value: correlation.traceId.trim(),
      type: "trace",
    });
  }

  if (correlation.fingerprint && correlation.fingerprint.trim() !== "") {
    links.push({
      key: "fingerprint",
      label: "Crash Fingerprint",
      value: correlation.fingerprint.trim(),
      href: `/admin/monitoring?section=errors&fingerprint=${encodeURIComponent(correlation.fingerprint.trim())}`,
      type: "fingerprint",
    });
  }

  if (correlation.cronJob && correlation.cronJob.trim() !== "") {
    links.push({
      key: "cron_job",
      label: "Cron Routine",
      value: correlation.cronJob.trim(),
      href: `/admin/crons?routine=${encodeURIComponent(correlation.cronJob.trim())}`,
      type: "cron",
    });
  }

  if (correlation.deploymentSha && correlation.deploymentSha.trim() !== "") {
    links.push({
      key: "deploy_sha",
      label: "Release SHA",
      value: correlation.deploymentSha.trim().slice(0, 8),
      href: `/admin/logs?deploymentSha=${encodeURIComponent(correlation.deploymentSha.trim())}`,
      type: "sha",
    });
  }

  if (correlation.userId && correlation.userId.trim() !== "") {
    links.push({
      key: "user_id",
      label: "Seeker Dossier",
      value: correlation.userId.trim().slice(0, 10),
      href: `/admin/users/${encodeURIComponent(correlation.userId.trim())}`,
      type: "user",
    });
  }

  if (correlation.notificationKey && correlation.notificationKey.trim() !== "") {
    links.push({
      key: "notif_key",
      label: "Notification Key",
      value: correlation.notificationKey.trim(),
      type: "notification",
    });
  }

  if (correlation.incidentId && correlation.incidentId.trim() !== "") {
    links.push({
      key: "incident_id",
      label: "Incident ID",
      value: correlation.incidentId.trim(),
      type: "incident",
    });
  }

  if (correlation.festivalId && correlation.festivalId.trim() !== "") {
    links.push({
      key: "festival_id",
      label: "Observance Slug",
      value: correlation.festivalId.trim(),
      href: `/admin/calendar-governance?tab=fixtures&slug=${encodeURIComponent(correlation.festivalId.trim())}`,
      type: "festival",
    });
  }

  return links;
}

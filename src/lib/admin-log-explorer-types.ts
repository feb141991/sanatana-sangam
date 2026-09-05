/**
 * Unified Admin Log Explorer Domain Models and DTOs.
 * Strictly normalizes only telemetry evidence already captured by the system.
 */

export type LogEventSeverity = "critical" | "warning" | "info";

export type LogEventSource =
  | "monitoring"
  | "client_errors"
  | "crons"
  | "notifications"
  | "golden_fixtures";

export interface LogEventCorrelation {
  requestId?: string | null;
  traceId?: string | null;
  fingerprint?: string | null;
  cronJob?: string | null;
  deploymentSha?: string | null;
  sessionHash?: string | null;
  userId?: string | null;
  notificationKey?: string | null;
  incidentId?: string | null;
  festivalId?: string | null;
}

export interface NormalizedLogEvent {
  id: string;
  timestamp: string;
  source: LogEventSource;
  severity: LogEventSeverity;
  title: string;
  message: string;
  route?: string | null;
  correlation: LogEventCorrelation;
  metadata?: Record<string, unknown> | null;
}

export interface LogSourceStatus {
  status: "available" | "unavailable" | "failed" | "empty";
  error?: string | null;
  count: number;
}

export interface LogExplorerFilters {
  source?: LogEventSource | "all";
  severity?: LogEventSeverity | "all";
  route?: string;
  requestId?: string;
  fingerprint?: string;
  cronJob?: string;
  deploymentSha?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
}

export interface LogExplorerApiResponse {
  events: NormalizedLogEvent[];
  sources: Record<LogEventSource, LogSourceStatus>;
  pagination: {
    hasMore: boolean;
    nextCursor?: string | null;
    limit: number;
    totalReturned: number;
  };
  degraded: boolean;
}

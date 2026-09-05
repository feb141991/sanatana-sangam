/**
 * Typed domain models for the shared Administrative Record Inspector.
 * Strictly models only fields backed by real data from existing database tables / APIs.
 */

export type AdminRecordType =
  | "calendar_finding"
  | "content_report"
  | "client_error"
  | "dharm_veer";

export interface CalendarFindingRecord {
  type: "calendar_finding";
  id: string;
  slug: string;
  year: number;
  ruleFamily?: string;
  severity: "critical" | "warning" | "info";
  status: "open" | "resolved" | "suppressed";
  title: string;
  summary: string;
  discrepancy?: {
    expectedDate?: string | null;
    calculatedDate?: string | null;
    ruleReasoning?: string;
  };
  firstSeen?: string;
  lastChecked?: string;
  locationLabel?: string;
}

export interface ContentReportRecord {
  type: "content_report";
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  reportedBy?: string | null;
  reporterUsername?: string | null;
  contentAuthorId?: string | null;
  authorUsername?: string | null;
  createdAt: string;
  adminNote?: string | null;
  metadata?: {
    ai_text?: string;
    user_prompt?: string;
    [key: string]: unknown;
  } | null;
}

export interface ClientErrorRecord {
  type: "client_error";
  fingerprint: string;
  errorName: string;
  errorMessage: string;
  route: string;
  source: string;
  firstSeen: string;
  lastSeen: string;
  count1h: number;
  count24h: number;
  totalCount: number;
  distinctSessionsCount: number;
  browserFamily: string;
  osFamily: string;
  latestClientSha?: string;
  latestServerSha?: string;
  sampleStack?: string | null;
  sampleComponentStack?: string | null;
  isStaleClientHeavy?: boolean;
}

export interface DharmVeerCitation {
  sourceName: string;
  sourceUrl: string;
  rightsStatus: string;
  excerpt: string;
}

export interface DharmVeerRecord {
  type: "dharm_veer";
  slug: string;
  name: string;
  nameLocal?: string | null;
  tradition: string;
  era?: string | null;
  tagline: string;
  journey: string;
  trial: string;
  teaching: string;
  moral: string;
  legacy?: string | null;
  quote?: string | null;
  quoteSource?: string | null;
  generatedBy?: string | null;
  createdAt: string;
  sourceCitations?: DharmVeerCitation[] | null;
}

export type AdminInspectableRecord =
  | CalendarFindingRecord
  | ContentReportRecord
  | ClientErrorRecord
  | DharmVeerRecord;

/**
 * Sanitizes metadata objects by redacting known sensitive keys (passwords, tokens, auth headers).
 */
export function sanitizeAdminMetadata(
  meta: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object") return null;

  const SENSITIVE_KEY_PATTERN = /(token|secret|password|auth|cookie|key|credential|bearer|session_id|jwt)/i;
  const sanitized: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEY_PATTERN.test(k)) {
      sanitized[k] = "[REDACTED]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      sanitized[k] = sanitizeAdminMetadata(v as Record<string, unknown>);
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized;
}

/**
 * Shared, typed, client-safe URL-state helper for the Shoonaya Admin Console.
 * Parses only declared values, rejects invalid values safely, and preserves
 * unrelated query parameters when updating tabs, filters, or record targets.
 */

export const MONITORING_TABS = ["apis", "telemetry", "push", "errors", "ai_reports"] as const;
export type MonitoringTab = typeof MONITORING_TABS[number];

export const MODERATION_FILTERS = ["all", "pending", "reviewed", "actioned", "dismissed"] as const;
export type ModerationFilter = typeof MODERATION_FILTERS[number];

export const CALENDAR_GOVERNANCE_TABS = ["integrity", "review", "coverage", "fixtures", "activity"] as const;
export type CalendarGovernanceTab = typeof CALENDAR_GOVERNANCE_TABS[number];

export const REPORTS_TABS = ["overview", "growth", "sadhana", "commercial", "governance", "logs"] as const;
export type ReportsTab = typeof REPORTS_TABS[number];

export const USER_DOSSIER_TABS = ["timeline", "notifications", "karma", "moderation", "compliance"] as const;
export type UserDossierTab = typeof USER_DOSSIER_TABS[number];

type SearchParamsLike = {
  get(name: string): string | null;
} | URLSearchParams;

/**
 * Safely parse a typed query parameter from searchParams.
 * Returns the matched allowed value or fallback/null if missing or invalid.
 */
export function parseAdminQueryParam<T extends string>(
  searchParams: SearchParamsLike | null | undefined,
  param: string,
  allowed: readonly T[],
  fallback: T
): T;
export function parseAdminQueryParam<T extends string>(
  searchParams: SearchParamsLike | null | undefined,
  param: string,
  allowed?: readonly T[],
  fallback?: T
): T | null;
export function parseAdminQueryParam<T extends string>(
  searchParams: SearchParamsLike | null | undefined,
  param: string,
  allowed?: readonly T[],
  fallback?: T
): T | null {
  if (!searchParams) return fallback ?? null;
  const raw = searchParams.get(param);
  if (!raw) return fallback ?? null;

  if (allowed && allowed.length > 0) {
    const match = allowed.find((val) => val === raw);
    return match ?? fallback ?? null;
  }

  return (raw as T) ?? fallback ?? null;
}

/**
 * Safely parse a raw string parameter (trimmed, non-empty) from searchParams.
 */
export function parseAdminStringParam(
  searchParams: SearchParamsLike | null | undefined,
  param: string,
  fallback: string
): string;
export function parseAdminStringParam(
  searchParams: SearchParamsLike | null | undefined,
  param: string,
  fallback?: string
): string | null;
export function parseAdminStringParam(
  searchParams: SearchParamsLike | null | undefined,
  param: string,
  fallback?: string
): string | null {
  if (!searchParams) return fallback ?? null;
  const raw = searchParams.get(param);
  if (raw === null || raw === undefined) return fallback ?? null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : (fallback ?? null);
}

/**
 * Resolves legacy or aliased monitoring tab parameters.
 * Supports `tab=...` as primary, with backward-compatible support for `section=...`.
 */
export function parseMonitoringTab(
  searchParams: SearchParamsLike | null | undefined,
  fallback: MonitoringTab = "apis"
): MonitoringTab {
  if (!searchParams) return fallback;
  // Primary: tab
  const tab = searchParams.get("tab");
  if (tab && (MONITORING_TABS as readonly string[]).includes(tab)) {
    return tab as MonitoringTab;
  }
  // Alias: section (e.g. from alerts /admin/monitoring?section=errors)
  const section = searchParams.get("section");
  if (section && (MONITORING_TABS as readonly string[]).includes(section)) {
    return section as MonitoringTab;
  }
  return fallback;
}

/**
 * Resolves moderation filter parameters with backward-compatible mapping.
 */
/**
 * Resolves cron routine/job target parameter with alias support.
 * Prioritizes `routine` (canonical from Log Explorer / navigation),
 * followed by legacy aliases `job`, `cron`, and `route`.
 */
export function parseCronTarget(
  searchParams: SearchParamsLike | null | undefined
): string | null {
  if (!searchParams) return null;
  return (
    parseAdminStringParam(searchParams, "routine") ||
    parseAdminStringParam(searchParams, "job") ||
    parseAdminStringParam(searchParams, "cron") ||
    parseAdminStringParam(searchParams, "route") ||
    null
  );
}

export function parseModerationFilter(
  searchParams: SearchParamsLike | null | undefined,
  fallback: ModerationFilter = "all"
): ModerationFilter {
  if (!searchParams) return fallback;
  const raw = searchParams.get("filter") || searchParams.get("status");
  if (!raw) return fallback;
  if (raw === "resolved") return "reviewed"; // legacy mapping
  if ((MODERATION_FILTERS as readonly string[]).includes(raw)) {
    return raw as ModerationFilter;
  }
  return fallback;
}

/**
 * Constructs a new URL string by merging updates into existing searchParams.
 * Pass null or undefined for a key to remove that parameter.
 * Preserves all other unrelated query parameters.
 */
export function buildAdminUrlWithParams(
  pathname: string,
  currentSearchParams: SearchParamsLike | string | null | undefined,
  updates: Record<string, string | null | undefined>
): string {
  let params: URLSearchParams;

  if (typeof currentSearchParams === "string") {
    const rawQs = currentSearchParams.includes("?")
      ? currentSearchParams.slice(currentSearchParams.indexOf("?") + 1)
      : currentSearchParams;
    params = new URLSearchParams(rawQs);
  } else if (currentSearchParams && "toString" in currentSearchParams && typeof currentSearchParams.toString === "function") {
    params = new URLSearchParams(currentSearchParams.toString());
  } else {
    params = new URLSearchParams();
  }

  for (const [key, val] of Object.entries(updates)) {
    if (val === null || val === undefined || val === "") {
      params.delete(key);
    } else {
      params.set(key, val);
    }
  }

  const qs = params.toString();
  return qs.length > 0 ? `${pathname}?${qs}` : pathname;
}

import { filterWithheldJoinedRows } from "@/lib/calendar/withheld";
import { CANONICAL_RULES } from "@/lib/calendar/rules";
import type { MarketingSourceSnapshot } from "../types";

/**
 * Set of slugs that have approved, verified astronomical rules in rules.json.
 * Fail closed: any slug not present in CANONICAL_RULES is rejected.
 */
export const RULED_SLUGS = new Set(CANONICAL_RULES.map(r => r.slug));

export interface ObservanceJoinedRow {
  id: string;
  date: string;
  publication_status?: string;
  tradition?: string;
  observance_definitions?: {
    slug?: string;
    display_name?: string;
    description?: string;
    tradition?: string;
    source?: string;
    [key: string]: unknown;
  } | Array<{
    slug?: string;
    display_name?: string;
    description?: string;
    tradition?: string;
    source?: string;
    [key: string]: unknown;
  }> | null;
  [key: string]: unknown;
}

/**
 * Extracts a normalized definition object from a joined occurrence row.
 */
export function extractDefinition(row: ObservanceJoinedRow) {
  const raw = row.observance_definitions;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

/**
 * Pure filter applying two-stage safety gate on candidate observance occurrences:
 * Stage 1: filterWithheldJoinedRows (checks rule-level launch status / disputed years)
 * Stage 2: RULED_SLUGS check (rejects manual-seed or unruled slugs lacking formal review)
 * Stage 3: Explicit publication_status === "published" requirement
 */
export function filterEligibleMarketingObservances(rows: ObservanceJoinedRow[]): ObservanceJoinedRow[] {
  const publishedOnly = rows.filter(r => r.publication_status === "published");
  const ruleFiltered = filterWithheldJoinedRows(publishedOnly as any);

  return (ruleFiltered as ObservanceJoinedRow[]).filter((row: ObservanceJoinedRow) => {
    const def = extractDefinition(row);
    const slug = def?.slug;
    return typeof slug === "string" && RULED_SLUGS.has(slug);
  });
}

/**
 * Builds a deterministic, immutable source snapshot for audit and admin review.
 */
export function buildObservanceSourceSnapshot(row: ObservanceJoinedRow): MarketingSourceSnapshot {
  const def = extractDefinition(row);
  return {
    occurrence_id: row.id,
    slug: def?.slug ?? "unknown",
    display_name: def?.display_name ?? "Festival",
    date: row.date,
    tradition: (def?.tradition ?? row.tradition ?? "sanatan") as string,
    description: def?.description ?? "",
    verified_source: (def?.source as string) ?? "CANONICAL_RULES",
  };
}

/**
 * Server-side re-validation for a single client-supplied occurrence ID. Used by
 * createCampaign/approveCampaign so a direct API call can never bind a campaign to a
 * withheld/disputed/unpublished/unruled occurrence just because it wasn't offered in
 * the admin GUI's dropdown (which uses fetchPublishedObservancesForDateRange, but that
 * alone only gates what's *offered* -- not what's actually *accepted*). Returns null
 * for "not found" and "found but not currently eligible" alike; callers must treat
 * both as rejection, not as two different outcomes to special-case.
 */
export async function getPublishableOccurrenceById(
  supabase: any,
  occurrenceId: string
): Promise<ObservanceJoinedRow | null> {
  const { data, error } = await supabase
    .from("observance_occurrences")
    .select("*, observance_definitions(*)")
    .eq("id", occurrenceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch observance occurrence: ${error.message}`);
  }
  if (!data) return null;

  const [eligible] = filterEligibleMarketingObservances([data as ObservanceJoinedRow]);
  return eligible ?? null;
}

/**
 * Fetches published, rule-governed observances for a given calendar window.
 */
export async function fetchPublishedObservancesForDateRange(
  supabase: any,
  startDate: string,
  endDate: string
): Promise<ObservanceJoinedRow[]> {
  const { data, error } = await supabase
    .from("observance_occurrences")
    .select("*, observance_definitions(*)")
    .gte("date", startDate)
    .lte("date", endDate)
    .eq("publication_status", "published")
    .order("date", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch published observances: ${error.message}`);
  }

  return filterEligibleMarketingObservances(data ?? []);
}

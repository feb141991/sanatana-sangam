/**
 * Pure candidate-selection logic for a given target day: which festival (if
 * any) qualifies, or which general theme is next in rotation. No writes --
 * reservation.ts is what turns a candidate into a real social_posts row.
 */
import {
  fetchPublishedObservancesForDateRange,
  buildObservanceSourceSnapshot,
  extractDefinition,
  type ObservanceJoinedRow
} from "../sources/published-observance";
import type { SocialGeneralTheme, SocialPostSourceSnapshot } from "./types";

export interface FestivalCandidate {
  sourceOccurrenceId: string;
  snapshot: SocialPostSourceSnapshot;
}

export interface GeneralThemeCandidate {
  themeId: string;
  snapshot: SocialPostSourceSnapshot;
}

/**
 * Selects at most one festival for the target date, scoped to the
 * requested tradition/region when given. Deterministic tie-break when more
 * than one festival qualifies on the same date: prefer an exact
 * target_tradition match, then earliest occurrence id (stable ordering,
 * never wall-clock/random) -- the same occurrence is always picked if this
 * runs twice for the same day.
 */
export async function selectFestivalCandidate(
  supabase: any,
  targetDate: string,
  targetTradition: string | null
): Promise<FestivalCandidate | null> {
  const rows = await fetchPublishedObservancesForDateRange(supabase, targetDate, targetDate);
  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => {
    if (targetTradition) {
      const defA = extractDefinition(a);
      const defB = extractDefinition(b);
      const aMatches = (defA?.tradition ?? a.tradition) === targetTradition ? 0 : 1;
      const bMatches = (defB?.tradition ?? b.tradition) === targetTradition ? 0 : 1;
      if (aMatches !== bMatches) return aMatches - bMatches;
    }
    return String(a.id).localeCompare(String(b.id));
  });

  const chosen = sorted[0] as ObservanceJoinedRow;
  return {
    sourceOccurrenceId: chosen.id,
    snapshot: buildObservanceSourceSnapshot(chosen)
  };
}

/**
 * Selects the least-recently-used active general theme (never-used themes
 * sort first via nulls-first ordering). Fails closed -- returns null, never
 * a theme -- when grounding_material is missing/blank, since an
 * unsupported factual/spiritual claim must stay withheld rather than be
 * posted with generic prose (AGENTS.md Spiritual Content Integrity).
 */
export async function selectGeneralThemeCandidate(supabase: any): Promise<GeneralThemeCandidate | null> {
  const { data, error } = await supabase
    .from("social_general_themes")
    .select("*")
    .eq("is_active", true)
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .order("display_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to select general theme: ${error.message}`);
  }
  if (!data) return null;

  const theme = data as SocialGeneralTheme;
  if (!theme.grounding_material?.trim()) {
    return null;
  }

  return {
    themeId: theme.id,
    snapshot: {
      theme_id: theme.id,
      theme_title: theme.title,
      grounding_material: theme.grounding_material
    }
  };
}

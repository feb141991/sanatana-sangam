/**
 * Location-aware occurrence reads with lazy materialize-on-miss.
 *
 * Festival civil dates depend on WHERE they're computed (sunrise/moonrise
 * timing), not just which calendar_profile names the month/day convention.
 * `observance_occurrences` can now hold distinct rows per (definition, year,
 * calendar_profile, variant_key, location) since the location-identity
 * migration -- but nothing populates a new (profile, location) combination
 * except a real request for it. This is that populating path: check for an
 * existing materialized year for the caller's exact (profile, location)
 * bucket; if a whole year was never computed for that combination, compute
 * it live (Phase A's `calculateObservancesForYear` already supports an
 * explicit location) and upsert it before returning.
 *
 * Deliberately NOT reusing `materializeOccurrencesForYears`'s batch/lock/
 * series-key machinery here -- that function's correctness properties
 * (stamping, regeneration diffing) are tuned for the nightly cron's full-set
 * rewrite, not a single-request cache-fill. This is a simpler, additive
 * writer scoped to exactly the rows a live request needs.
 */
import { calculateObservancesForYear } from './engine';
import { CALENDAR_OCCURRENCE_SELECT } from './occurrence-reader';
import { ruleQualifierToEvaluatorVariant } from './variant-qualifier';
import type { LocationInput } from '@sangam/panchang-engine';

// trg_sync_occurrence_to_festival (DB trigger, see
// sync_occurrence_to_festival()) mirrors every row written under this one
// calendar_profile into a legacy `festivals` table that predates sampradaya
// variants: it is unique on (name, year) with no variant column at all.
// Writing two variant rows whose observance_definitions.display_name is
// identical (e.g. Krishna Janmashtami's Smarta and Gaudiya/ISKCON
// definitions both display as plain "Krishna Janmashtami") violates that
// constraint and rolls back the ENTIRE multi-row upsert -- including every
// unrelated slug in the same batch. Confirmed 2026-09-04 while backfilling
// this exact profile/location bucket after the corrected_2026_festival_
// migration cleanup; see docs/PRD or the calendar governance notes for the
// incident this hardening comes from.
const FESTIVAL_MIRROR_CALENDAR_PROFILE = 'legacy-ujjain';

export interface OccurrenceDefinitionJoin {
  slug: string;
  display_name: string;
  emoji: string | null;
  description: string | null;
  kind: string;
  tradition: string;
  route_kind: string | null;
  route_slug: string | null;
  active: boolean;
}

export interface ResolvedOccurrenceRow extends Record<string, unknown> {
  date: string;
  observance_definitions: OccurrenceDefinitionJoin;
}

interface MaterializedOccurrenceRow {
  definition_id: string;
  year: number;
  date: string;
  occurrence_date: string;
  calendar_profile: string;
  spiritual_tradition: string | null;
  variant_key: string;
  computed_latitude: number;
  computed_longitude: number;
  computed_timezone: string;
  calculated_by: string;
  final_date_source: string;
}

export interface FestivalMirrorDefinitionMeta {
  displayName: string;
  kind: string | null;
}

// See FESTIVAL_MIRROR_CALENDAR_PROFILE above. `festivals` is unique on
// (name, year) with no variant_key column at all -- so this collision is NOT
// limited to two different observance_definitions rows sharing a
// display_name (Krishna Janmashtami is in fact a SINGLE definition; it just
// produces two variant_key occurrence rows -- smarta_nishita, gaudiya_iskcon
// -- for the same year). Every row the trigger's INSERT ... ON CONFLICT (id)
// runs against is keyed by the occurrence's own row id, so two occurrence
// rows sharing a (display_name, year) ALWAYS collide on `festivals`
// regardless of whether they also share definition_id.
//
// For engine-generated `kind = 'vrat'` rows, the trigger deletes rather than
// inserts only when final_date_source is `calculation_engine` or
// `calculation_engine_reviewed` (the values this path writes). A recurring
// vrat (the generic 'ekadashi' rule, ~24 dates/year, one definition/display_
// name) must NOT be collapsed here: those generated rows never reach the
// constraint this function exists to protect, and collapsing them would
// silently destroy 23 of 24 real occurrences for the year. So this only ever collapses
// non-vrat definitions -- confirmed by direct rules.json audit (2026-09-04)
// that Krishna Janmashtami is currently the only kind != 'vrat' festival
// with more than one materialized sampradaya variant.
//
// Within an actual collision, keep a single row: prefer the Smarta/default
// variant per this project's own governance rule (unspecified sampradaya ->
// Smarta), else the generic/no-variant row, else whichever sorts first --
// deterministic, not silently arbitrary.
function collapseFestivalMirrorNameCollisions(
  rows: MaterializedOccurrenceRow[],
  definitionMetaById: Map<string, FestivalMirrorDefinitionMeta>,
): MaterializedOccurrenceRow[] {
  const groups = new Map<string, MaterializedOccurrenceRow[]>();
  for (const row of rows) {
    const meta = definitionMetaById.get(row.definition_id);
    if (meta?.kind === 'vrat') {
      // Never reaches the festivals INSERT branch -- not this function's concern.
      groups.set(`__no_collapse__${row.definition_id}|${row.year}|${row.date}|${row.variant_key}`, [row]);
      continue;
    }
    const name = meta?.displayName ?? row.definition_id;
    const key = `${name}|${row.year}`;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const kept: MaterializedOccurrenceRow[] = [];
  for (const group of groups.values()) {
    if (group.length <= 1) {
      kept.push(...group);
      continue;
    }
    const preferred =
      group.find((r) => r.spiritual_tradition === 'smarta') ??
      group.find((r) => r.spiritual_tradition === null) ??
      [...group].sort((a, b) => a.variant_key.localeCompare(b.variant_key))[0];
    kept.push(preferred);
  }
  return kept;
}

/**
 * Ensures a year has been materialized for a specific (calendar_profile,
 * location) combination. No-op if rows already exist for that combination;
 * otherwise computes and upserts them. Safe to call on every request --
 * the existence check is a single cheap indexed query.
 *
 * Exported (not just called internally) so the cron's "extend in-use
 * combinations into the new year" pass can reuse the exact same write path
 * instead of a second, parallel one -- see the cron route.
 */
export async function ensureYearMaterialized({
  supabase,
  year,
  calendarProfile,
  location,
}: {
  supabase: any;
  year: number;
  calendarProfile: string;
  location: LocationInput;
}): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from('observance_occurrences')
    .select('id')
    .eq('year', year)
    .eq('calendar_profile', calendarProfile)
    .eq('computed_latitude', location.lat)
    .eq('computed_longitude', location.lon)
    .eq('computed_timezone', location.tz)
    .limit(1);

  if (existingError) throw existingError;
  if (existing && existing.length > 0) return; // already materialized for this combo

  const { data: definitions, error: defsError } = await supabase
    .from('observance_definitions')
    .select('id, slug, display_name, kind')
    .eq('active', true);
  if (defsError) throw defsError;

  const definitionIdBySlug = new Map<string, string>();
  const definitionMetaById = new Map<string, FestivalMirrorDefinitionMeta>();
  for (const def of definitions ?? []) {
    definitionIdBySlug.set(def.slug, def.id);
    definitionMetaById.set(def.id, { displayName: def.display_name, kind: def.kind ?? null });
  }

  const isFestivalMirrorProfile = calendarProfile === FESTIVAL_MIRROR_CALENDAR_PROFILE;

  // spiritual_tradition carries a FK into tradition_profiles.slug. A rule's
  // own variant_key is sometimes in rules.json's qualifier vocabulary
  // ('smarta_nishita') rather than a tradition_profiles slug ('smarta') --
  // fetched once per call (small table) so buildRow can validate instead of
  // writing a value that fails the FK and rolls back the whole batch.
  const { data: traditionProfiles, error: traditionError } = await supabase
    .from('tradition_profiles')
    .select('slug');
  if (traditionError) throw traditionError;
  const validTraditionSlugs = new Set((traditionProfiles ?? []).map((t: { slug: string }) => t.slug));

  const calculated = calculateObservancesForYear(year, location);

  // Dedupe by the exact identity index columns before upserting -- Postgres
  // rejects an upsert batch that names the same conflict-target row twice
  // ("ON CONFLICT DO UPDATE command cannot affect row a second time").
  // Multiple CalculatedOccurrence entries can legitimately collapse to the
  // same identity (e.g. two same-slug rule variants that happen to resolve
  // to the same date in a given year), so this is a real, expected case,
  // not just defensive padding -- last-wins is fine since they're
  // identical in every column that matters to the identity key.
  const rowsByKey = new Map<string, MaterializedOccurrenceRow>();
  // 'standard' is EVALUATOR_RULES' generic variantId for every single-
  // variant rule (diwali, karva-chauth, etc. -- there's no real sampradaya
  // split to record for these), so it's excluded here the same way
  // 'legacy-default' already is, rather than writing a nonsense literal
  // 'standard' into spiritual_tradition.
  const GENERIC_VARIANT_KEYS = new Set(['legacy-default', 'standard']);

  // occ.ruleKey's variant suffix is already normalized to rules.json's own
  // qualifier convention by calculateObservancesForYear (see engine.ts's
  // evaluatorVariantToRuleQualifier use). That vocabulary ('smarta_nishita',
  // 'gaudiya_iskcon') doesn't always coincide with a tradition_profiles slug
  // ('smarta', 'gaudiya_iskcon', ...) -- 'gaudiya_iskcon' happens to match
  // directly, 'smarta_nishita' doesn't. Try the value as-is first (covers
  // every rule where it already matches), then variant-qualifier.ts's own
  // crosswalk to the evaluator vocabulary ('smarta'), and only null out if
  // neither resolves to a real row -- writing an unresolvable value here
  // fails the FK and rolls back every other row in the same upsert batch.
  function resolveSpiritualTradition(slug: string, variantKey: string): string | null {
    if (GENERIC_VARIANT_KEYS.has(variantKey)) return null;
    if (validTraditionSlugs.has(variantKey)) return variantKey;
    const evaluatorForm = ruleQualifierToEvaluatorVariant(slug, variantKey);
    if (evaluatorForm && validTraditionSlugs.has(evaluatorForm)) return evaluatorForm;
    return null;
  }

  function buildRow(occ: (typeof calculated)[number]) {
    const definitionId = definitionIdBySlug.get(occ.slug);
    if (!definitionId) return null;
    const variantKey = occ.ruleKey.includes('::') ? occ.ruleKey.split('::')[1] : 'legacy-default';
    const spiritualTradition = resolveSpiritualTradition(occ.slug, variantKey);
    return {
      definition_id: definitionId,
      year,
      date: occ.date,
      occurrence_date: occ.date,
      calendar_profile: calendarProfile,
      spiritual_tradition: spiritualTradition,
      variant_key: variantKey,
      computed_latitude: location.lat,
      computed_longitude: location.lon,
      computed_timezone: location.tz,
      calculated_by: 'lazy_materialize_on_read',
      // Without this, the column defaults to 'legacy_seed' (confirmed via
      // schema read, 2026-09-04) -- NOT one of the two values
      // sync_occurrence_to_festival() checks for its kind:'vrat' exemption,
      // so a lazily-materialized recurring vrat's second date in a year
      // would hit the exact same festivals(name,year) collision this file's
      // hardening exists to prevent. materialize.ts's cron path already
      // sets this for the same reason; matching it here makes the DB
      // trigger's own real exemption apply, rather than relying only on
      // this file's separate kind:'vrat' skip in
      // collapseFestivalMirrorNameCollisions as the sole protection.
      final_date_source: 'calculation_engine',
    };
  }
  for (const occ of calculated) {
    const row = buildRow(occ);
    if (!row) continue;
    const key = `${row.definition_id}|${row.year}|${row.calendar_profile}|${row.occurrence_date}|${row.variant_key}|${row.computed_latitude}|${row.computed_longitude}|${row.computed_timezone}`;
    rowsByKey.set(key, row);
  }
  let rows = Array.from(rowsByKey.values());

  if (isFestivalMirrorProfile) {
    rows = collapseFestivalMirrorNameCollisions(rows, definitionMetaById);
  }

  if (rows.length === 0) return;

  // Upsert against the location-qualified identity index -- a failed write
  // here must not fail the read; the caller falls back to computed-but-
  // uncached data (via the in-memory `calculated` results) if this throws.
  const { error: upsertError } = await supabase
    .from('observance_occurrences')
    .upsert(rows, {
      onConflict: 'definition_id,year,calendar_profile,occurrence_date,variant_key,computed_latitude,computed_longitude,computed_timezone',
    });
  if (upsertError) throw upsertError;
}

/**
 * Home's read path calls this on every request. It must never block on a
 * DB write or an annual astronomy calculation (see the Home/Mandali
 * performance review this function's rewrite came out of) -- so unlike the
 * old implementation, this no longer awaits `ensureYearMaterialized` before
 * querying. It reads whatever is already materialized for this exact
 * (calendarProfile, location) combination and returns immediately.
 *
 * The only case this changes user-visible behavior for is the very first
 * request ever made for a brand-new (profile, location) combination: that
 * request now gets an empty occurrence set (rather than blocking ~1-2s for a
 * synchronous compute+upsert) while materialization is kicked off in the
 * background for the *next* request to pick up. That's consistent with this
 * file's existing withheld-rather-than-guessed governance rule -- an
 * unmaterialized combo is treated the same as any other not-yet-resolved
 * occurrence, not backfilled with a blocking write on a read request.
 */
export async function getOrMaterializeOccurrences({
  supabase,
  fromDate,
  toDate,
  tradition,
  calendarScope,
  calendarProfile,
  location,
}: {
  supabase: any;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  tradition: string;
  calendarScope: string | null;
  calendarProfile: string;
  location: LocationInput;
}): Promise<ResolvedOccurrenceRow[]> {
  const fromYear = Number(fromDate.slice(0, 4));
  const toYear = Number(toDate.slice(0, 4));
  const years = fromYear === toYear ? [fromYear] : [fromYear, toYear];

  let query = supabase
    .from('observance_occurrences')
    .select(CALENDAR_OCCURRENCE_SELECT)
    .gte('date', fromDate)
    .lte('date', toDate)
    .eq('observance_definitions.active', true)
    .in('observance_definitions.tradition', [tradition, 'all'])
    .eq('publication_status', 'published')
    // No 'legacy-ujjain' fallback: rows are keyed to this caller's exact
    // (calendarProfile, location), not Ujjain's coordinates. If nothing is
    // materialized yet for this combination, the background kick-off below
    // populates it for the next read rather than this one blocking on it.
    .eq('calendar_profile', calendarProfile)
    .eq('computed_latitude', location.lat)
    .eq('computed_longitude', location.lon)
    .eq('computed_timezone', location.tz);

  if (calendarScope === 'major_only') {
    query = query.in('observance_definitions.kind', ['major', 'vrat']);
  }

  const { data, error } = await query.order('date', { ascending: true }).limit(8);
  if (error) throw error;
  const rows = (data ?? []) as ResolvedOccurrenceRow[];

  if (rows.length === 0) {
    // Nothing materialized yet for this (profile, location) combination.
    // Fire-and-forget: do not await, do not block this read on an annual
    // astronomy calculation + upsert. The next request (SWR refresh or the
    // user's next Home load) will find the rows this populates.
    for (const year of years) {
      void ensureYearMaterialized({ supabase, year, calendarProfile, location }).catch((err) => {
        console.error(`[resolve-occurrences] background materialize failed for year ${year}, profile ${calendarProfile}:`, err);
      });
    }
  }

  return rows;
}

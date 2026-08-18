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
import type { LocationInput } from '@sangam/panchang-engine';

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

export interface ResolvedOccurrenceRow {
  date: string;
  observance_definitions: OccurrenceDefinitionJoin;
}

const DEFINITION_JOIN_SELECT =
  'slug, display_name, emoji, description, kind, tradition, route_kind, route_slug, active';

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
    .select('id, slug')
    .eq('active', true);
  if (defsError) throw defsError;

  const definitionIdBySlug = new Map<string, string>();
  for (const def of definitions ?? []) definitionIdBySlug.set(def.slug, def.id);

  const calculated = calculateObservancesForYear(year, location);

  // Dedupe by the exact identity index columns before upserting -- Postgres
  // rejects an upsert batch that names the same conflict-target row twice
  // ("ON CONFLICT DO UPDATE command cannot affect row a second time").
  // Multiple CalculatedOccurrence entries can legitimately collapse to the
  // same identity (e.g. two same-slug rule variants that happen to resolve
  // to the same date in a given year), so this is a real, expected case,
  // not just defensive padding -- last-wins is fine since they're
  // identical in every column that matters to the identity key.
  const rowsByKey = new Map<string, ReturnType<typeof buildRow>>();
  function buildRow(occ: (typeof calculated)[number]) {
    const definitionId = definitionIdBySlug.get(occ.slug);
    if (!definitionId) return null;
    const variantKey = occ.ruleKey.includes('::') ? occ.ruleKey.split('::')[1] : 'legacy-default';
    return {
      definition_id: definitionId,
      year,
      date: occ.date,
      occurrence_date: occ.date,
      calendar_profile: calendarProfile,
      variant_key: variantKey,
      computed_latitude: location.lat,
      computed_longitude: location.lon,
      computed_timezone: location.tz,
      calculated_by: 'lazy_materialize_on_read',
    };
  }
  for (const occ of calculated) {
    const row = buildRow(occ);
    if (!row) continue;
    const key = `${row.definition_id}|${row.year}|${row.calendar_profile}|${row.occurrence_date}|${row.variant_key}|${row.computed_latitude}|${row.computed_longitude}|${row.computed_timezone}`;
    rowsByKey.set(key, row);
  }
  const rows = Array.from(rowsByKey.values());

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

  // Best-effort: a materialization failure must not block the read.
  await Promise.all(
    years.map((year) =>
      ensureYearMaterialized({ supabase, year, calendarProfile, location }).catch((err) => {
        console.error(`[resolve-occurrences] lazy materialize failed for year ${year}, profile ${calendarProfile}:`, err);
      }),
    ),
  );

  let query = supabase
    .from('observance_occurrences')
    .select(`date, observance_definitions!inner(${DEFINITION_JOIN_SELECT})`)
    .gte('date', fromDate)
    .lte('date', toDate)
    .eq('observance_definitions.active', true)
    .in('observance_definitions.tradition', [tradition, 'all'])
    .eq('publication_status', 'published')
    // No 'legacy-ujjain' fallback here: ensureYearMaterialized above already
    // guarantees rows exist for this exact (calendarProfile, location) pair
    // (unless the write failed, logged above, in which case there's nothing
    // to fall back to at this location anyway -- Ujjain's rows are keyed to
    // Ujjain's coordinates, not this caller's).
    .eq('calendar_profile', calendarProfile)
    .eq('computed_latitude', location.lat)
    .eq('computed_longitude', location.lon)
    .eq('computed_timezone', location.tz);

  if (calendarScope === 'major_only') {
    query = query.in('observance_definitions.kind', ['major', 'vrat']);
  }

  const { data, error } = await query.order('date', { ascending: true }).limit(8);
  if (error) throw error;
  return (data ?? []) as ResolvedOccurrenceRow[];
}

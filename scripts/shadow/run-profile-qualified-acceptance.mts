/**
 * Controlled Phase 5 write-to-read acceptance against local Postgres.
 *
 * This does NOT calculate, ratify, or publish a new observance date. It copies
 * one existing legacy civil date into two synthetic, shadow-only tradition
 * variants so the storage contract can be tested independently of religious
 * date correctness. Both variants deliberately share the same civil date: a
 * calendar month-system changes the label for a day, never the day itself.
 *
 * The script exercises the real production helpers and a real database:
 *   commitOccurrencesWithBatches -> batch/series persistence
 *   attachMaterialisationBatches -> private completeness hydration
 *   formatOccurrencesToResults   -> profile precedence and read-time primary
 *
 * It exits non-zero on any failure and is run by:
 *   npm run verify:materialisation-shadow
 */
import { createShadowSupabaseClient } from './pg-supabase-shim.mjs';
import {
  batchIdentityKey,
  commitOccurrencesWithBatches,
} from '../../src/lib/calendar/materialize';
import { attachMaterialisationBatches } from '../../src/lib/calendar/occurrence-reader';
import { formatOccurrencesToResults } from '../../src/lib/calendar/observance-formatter';
import { resolveCalendarContext } from '../../src/lib/calendar/calendar-context';

const YEAR = 2026;
const SLUG = 'krishna-janmashtami';
const PROFILE = 'north_indian_purnimanta';
const LAT = 23.1765;
const LON = 75.7885;
const TZ = 'Asia/Kolkata';
const connectionString = process.env.SHADOW_DATABASE_URL ?? 'postgres:///shoonaya_shadow';

let pass = 0;
let fail = 0;

interface ProfileSeedRow {
  slug: string;
}

interface TraditionSeedRow {
  slug: string;
}

interface DefinitionRow {
  id: string;
  slug: string;
  display_name: string;
  emoji: string;
  description: string;
  kind: string;
  tradition: string;
  route_kind: string | null;
  route_slug: string | null;
  active: boolean;
}

interface StoredOccurrenceRow {
  id: string;
  definition_id: string;
  year: number;
  date: string;
  occurrence_date: string;
  calendar_profile: string;
  spiritual_tradition: string | null;
  variant_key: string | null;
  is_primary_variant: boolean;
  series_instance_key: string | null;
  batch_id: string | null;
  review_status: string;
  verification_status: string;
  audit_status: string;
  reasons: unknown[];
  diagnostics: unknown[];
  source_refs: unknown[];
  computed_latitude: number;
  computed_longitude: number;
  computed_timezone: string;
  rule_version: string | null;
  astronomy_version: string | null;
  day_boundary_version: string | null;
}

interface AcceptanceBatchRow {
  id: string;
  status: string;
  expected_row_count: number;
  produced_row_count: number;
}

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  PASS  ${name}`);
    pass++;
  } else {
    console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ''}`);
    fail++;
  }
}

function stableRows<T extends { id?: unknown }>(rows: readonly T[] | null | undefined) {
  return [...(rows ?? [])]
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map(row => JSON.stringify(row));
}

function profileContext(
  tradition: 'smarta' | 'gaudiya_iskcon',
  methods: {
    ekadashiMethod: 'smarta' | 'vaishnava_suddha';
    janmashtamiMethod: 'smarta_nishita' | 'vaishnava_rohini';
  },
) {
  return resolveCalendarContext({
    calendarProfile: PROFILE,
    traditionProfile: tradition,
    calendarProfileDefinition: {
      slug: PROFILE,
      monthSystem: 'purnimanta',
      era: 'vikram_north',
    },
    traditionProfileDefinition: {
      slug: tradition,
      ...methods,
    },
    location: {
      label: 'Ujjain, India',
      latitude: LAT,
      longitude: LON,
      timezone: TZ,
    },
  });
}

async function main() {
  const client = createShadowSupabaseClient(connectionString);

  try {
    const legacyColumns = [
      'id', 'definition_id', 'year', 'date', 'occurrence_date',
      'calendar_profile', 'spiritual_tradition', 'variant_key',
      'series_instance_key', 'batch_id', 'locked_for_regeneration',
      'manual_date_override', 'final_date_source', 'publication_status',
    ].join(', ');

    const { data: profiles, error: profileError } = await client
      .from('calendar_profiles')
      .select('slug, month_system, era');
    const { data: traditions, error: traditionError } = await client
      .from('tradition_profiles')
      .select('slug, ekadashi_method, janmashtami_method');

    const profileRows = (profiles ?? []) as unknown as ProfileSeedRow[];
    const traditionRows = (traditions ?? []) as unknown as TraditionSeedRow[];
    check('real calendar-profile seed is queryable', !profileError && profileRows.some(row => row.slug === PROFILE));
    check('real Smarta tradition policy is queryable', !traditionError && traditionRows.some(row => row.slug === 'smarta'));
    check('real Gaudiya tradition policy is queryable', !traditionError && traditionRows.some(row => row.slug === 'gaudiya_iskcon'));
    console.log(`  INFO  registry rows: calendar=${profiles?.length ?? 0}, tradition=${traditions?.length ?? 0}`);

    const { data: legacyBefore, error: legacyBeforeError } = await client
      .from('observance_occurrences')
      .select(legacyColumns)
      .eq('calendar_profile', 'legacy-ujjain');
    if (legacyBeforeError) throw legacyBeforeError;
    const legacySnapshot = stableRows(legacyBefore);

    const { data: definition, error: definitionError } = await client
      .from('observance_definitions')
      .select('id, slug, display_name, emoji, description, kind, tradition, route_kind, route_slug, active')
      .eq('slug', SLUG)
      .single();
    if (definitionError || !definition) throw definitionError ?? new Error(`${SLUG} definition missing`);
    const definitionRow = definition as unknown as DefinitionRow;

    const { data: legacy, error: legacyError } = await client
      .from('observance_occurrences')
      .select('id, definition_id, year, date, occurrence_date, review_status, verification_status, audit_status, calendar_profile, spiritual_tradition, variant_key, is_primary_variant, series_instance_key, batch_id, reasons, diagnostics, source_refs, computed_latitude, computed_longitude, computed_timezone, rule_version, astronomy_version, day_boundary_version')
      .eq('definition_id', definitionRow.id)
      .eq('year', YEAR)
      .eq('calendar_profile', 'legacy-ujjain')
      .single();
    if (legacyError || !legacy) throw legacyError ?? new Error(`${SLUG} legacy occurrence missing`);
    const legacyRow = legacy as unknown as StoredOccurrenceRow;

    const civilDate = String(legacyRow.date);
    console.log(`  INFO  shadow fixture reuses existing legacy civil date ${civilDate}; no date is derived here`);

    const variants = [
      { spiritualTradition: 'smarta', variantKey: 'smarta' },
      { spiritualTradition: 'gaudiya_iskcon', variantKey: 'gaudiya_iskcon' },
    ];

    const toInsert = variants.map(({ spiritualTradition, variantKey }) => ({
      definition_id: definitionRow.id,
      year: YEAR,
      date: civilDate,
      occurrence_date: civilDate,
      calendar_profile: PROFILE,
      spiritual_tradition: spiritualTradition,
      variant_key: variantKey,
      // Stored primary is deliberately false. The user's profile, at read
      // time, must choose exactly one primary independently of this column.
      is_primary_variant: false,
      calculation_version: 'shadow-profile-contract-1',
      calculated_by: 'shadow-profile-acceptance',
      review_status: 'reviewed',
      verification_status: 'verified',
      audit_status: 'completed',
      final_date_source: 'calculation_engine_reviewed',
      publication_status: 'published',
      locked_for_regeneration: false,
      computed_latitude: LAT,
      computed_longitude: LON,
      computed_timezone: TZ,
      rule_version: 'shadow-profile-contract-1',
      astronomy_version: 'shadow-profile-contract-1',
      day_boundary_version: 'shadow-profile-contract-1',
      reasons: [],
      diagnostics: [],
      source_refs: [],
      __slug: SLUG,
      __anchor: civilDate,
    }));

    const expectedByIdentity = new Map<string, number>();
    const identityMeta = new Map<string, (typeof toInsert)[number]>();
    for (const row of toInsert) {
      const key = batchIdentityKey(row);
      expectedByIdentity.set(key, 1);
      identityMeta.set(key, row);
    }

    const committed = await commitOccurrencesWithBatches(client, {
      toInsert,
      toUpdate: [],
      toStamp: [],
      expectedByIdentity,
      identityMeta,
      versions: {
        engine: 'shadow-profile-contract-1',
        rule: 'shadow-profile-contract-1',
        astronomy: 'shadow-profile-contract-1',
      },
    });

    check('batch commit inserts both synthetic profile variants', committed.inserted === variants.length, JSON.stringify(committed));
    check('batch commit performs no occurrence updates', committed.updated === 0, JSON.stringify(committed));

    const occurrenceColumns = [
      'id', 'definition_id', 'year', 'date', 'occurrence_date',
      'review_status', 'verification_status', 'audit_status',
      'calendar_profile', 'spiritual_tradition', 'variant_key',
      'is_primary_variant', 'series_instance_key', 'batch_id',
      'reasons', 'diagnostics', 'source_refs', 'computed_latitude',
      'computed_longitude', 'computed_timezone', 'rule_version',
      'astronomy_version', 'day_boundary_version',
    ].join(', ');
    const { data: stored, error: storedError } = await client
      .from('observance_occurrences')
      .select(occurrenceColumns)
      .eq('definition_id', definitionRow.id)
      .eq('year', YEAR)
      .eq('calendar_profile', PROFILE);
    if (storedError) throw storedError;

    const storedRows = (stored ?? []) as unknown as StoredOccurrenceRow[];
    check('database stores exactly two profile-qualified rows', storedRows.length === variants.length, `${storedRows.length}`);
    check('both rows carry a materialisation batch', storedRows.every(row => !!row.batch_id));
    check('both rows carry a bounded series-instance key', storedRows.every(row => /^[a-f0-9]{32}$/.test(row.series_instance_key ?? '')));
    check('both traditions share one writer-owned instance identity', new Set(storedRows.map(row => row.series_instance_key)).size === 1);
    check('stored is_primary_variant does not preselect a tradition', storedRows.every(row => row.is_primary_variant === false));

    const batchIds = [...new Set(
      storedRows
        .map(row => row.batch_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    )];
    const { data: batches, error: batchError } = await client
      .from('observance_materialisation_batches')
      .select('id, status, expected_row_count, produced_row_count')
      .in('id', batchIds);
    if (batchError) throw batchError;
    const batchRows = (batches ?? []) as unknown as AcceptanceBatchRow[];
    check('one complete batch exists per tradition identity', batchRows.length === variants.length, `${batchRows.length}`);
    check(
      'every profile batch is honestly complete',
      batchRows.every(row => row.status === 'complete' && row.expected_row_count === 1 && row.produced_row_count === 1),
      JSON.stringify(batches),
    );

    const hydrated = await attachMaterialisationBatches(
      [...storedRows, legacyRow].map(row => ({ ...row, observance_definitions: definitionRow })),
      client,
    );

    const smartaContext = profileContext('smarta', {
      ekadashiMethod: 'smarta',
      janmashtamiMethod: 'smarta_nishita',
    });
    const gaudiyaContext = profileContext('gaudiya_iskcon', {
      ekadashiMethod: 'vaishnava_suddha',
      janmashtamiMethod: 'vaishnava_rohini',
    });

    const formatFor = (tradition: 'smarta' | 'gaudiya_iskcon', context: ReturnType<typeof profileContext>) =>
      formatOccurrencesToResults(
        hydrated,
        [],
        'hindu',
        PROFILE,
        tradition,
        `${YEAR}-01-01`,
        `${YEAR}-12-31`,
        context,
      );

    const smartaResults = formatFor('smarta', smartaContext);
    const gaudiyaResults = formatFor('gaudiya_iskcon', gaudiyaContext);
    const smartaPrimary = smartaResults.filter(result => result.isPrimary);
    const gaudiyaPrimary = gaudiyaResults.filter(result => result.isPrimary);

    check('complete profile materialisation suppresses the legacy fallback', smartaResults.every(result => result.profile.calendar === PROFILE));
    check('Smarta read has exactly one primary result', smartaPrimary.length === 1, `${smartaPrimary.length}`);
    check('Smarta policy selects the Smarta variant at read time', smartaPrimary[0]?.variantKey === 'smarta', smartaPrimary[0]?.variantKey ?? 'none');
    check('Gaudiya read has exactly one primary result', gaudiyaPrimary.length === 1, `${gaudiyaPrimary.length}`);
    check('Gaudiya policy selects the Gaudiya variant at read time', gaudiyaPrimary[0]?.variantKey === 'gaudiya_iskcon', gaudiyaPrimary[0]?.variantKey ?? 'none');
    check('each selected result discloses the other tradition as an alternative', smartaPrimary[0]?.alternatives.length === 1 && gaudiyaPrimary[0]?.alternatives.length === 1);

    const partialBatchId = storedRows.find(row => row.variant_key === 'gaudiya_iskcon')?.batch_id;
    const partialOccurrenceId = storedRows.find(row => row.variant_key === 'gaudiya_iskcon')?.id;
    if (!partialBatchId) throw new Error('Gaudiya batch missing');
    if (!partialOccurrenceId) throw new Error('Gaudiya occurrence missing');
    const { error: partialError } = await client
      .from('observance_materialisation_batches')
      .update({ status: 'partial', produced_row_count: 0, completed_at: null })
      .eq('id', partialBatchId);
    if (partialError) throw partialError;
    const { error: deleteVariantError } = await client
      .from('observance_occurrences')
      .delete()
      .eq('id', partialOccurrenceId);
    if (deleteVariantError) throw deleteVariantError;

    const partiallyHydrated = await attachMaterialisationBatches(
      [
        ...storedRows.filter(row => row.id !== partialOccurrenceId),
        legacyRow,
      ].map(row => ({ ...row, observance_definitions: definitionRow })),
      client,
    );
    const fallbackResults = formatOccurrencesToResults(
      partiallyHydrated,
      [],
      'hindu',
      PROFILE,
      'smarta',
      `${YEAR}-01-01`,
      `${YEAR}-12-31`,
      smartaContext,
    );
    check('partial sibling batch remains discoverable without an occurrence row', partiallyHydrated.some(row =>
      row.calendar_profile === PROFILE && row.batch_family_complete === false
    ));
    check('one absent partial variant fails the whole profile set closed', fallbackResults.length === 1, `${fallbackResults.length}`);
    check('partial profile materialisation keeps the legacy row', fallbackResults[0]?.profile.calendar === 'legacy-ujjain', fallbackResults[0]?.profile.calendar ?? 'none');
    check('legacy fallback discloses incomplete profile materialisation', fallbackResults[0]?.diagnostics.includes('incomplete_profile_materialisation') === true);

    const completeBatchId = storedRows.find(row => row.variant_key === 'smarta')?.batch_id;
    const completeOccurrenceId = storedRows.find(row => row.variant_key === 'smarta')?.id;
    if (!completeBatchId) throw new Error('Smarta batch missing');
    if (!completeOccurrenceId) throw new Error('Smarta occurrence missing');
    const { error: failBatchError } = await client
      .from('observance_materialisation_batches')
      .update({ status: 'failed', produced_row_count: 0, completed_at: null, failure_reason: 'shadow forced failure' })
      .eq('id', completeBatchId);
    if (failBatchError) throw failBatchError;
    const { error: deleteLastVariantError } = await client
      .from('observance_occurrences')
      .delete()
      .eq('id', completeOccurrenceId);
    if (deleteLastVariantError) throw deleteLastVariantError;

    const legacyOnlyHydrated = await attachMaterialisationBatches(
      [{ ...legacyRow, observance_definitions: definitionRow }],
      client,
      PROFILE,
      { latitude: LAT, longitude: LON, timezone: TZ },
    );
    const legacyOnlyResults = formatOccurrencesToResults(
      legacyOnlyHydrated,
      [],
      'hindu',
      PROFILE,
      'smarta',
      `${YEAR}-01-01`,
      `${YEAR}-12-31`,
      smartaContext,
    );
    check('failed profile family stays discoverable when every profile occurrence is absent', legacyOnlyHydrated[0]?.requested_profile_family_incomplete === true);
    check('all-absent profile failure keeps the legacy fallback', legacyOnlyResults.length === 1 && legacyOnlyResults[0]?.profile.calendar === 'legacy-ujjain');
    check('all-absent profile failure remains disclosed', legacyOnlyResults[0]?.diagnostics.includes('incomplete_profile_materialisation') === true);

    const { data: legacyAfter, error: legacyAfterError } = await client
      .from('observance_occurrences')
      .select(legacyColumns)
      .eq('calendar_profile', 'legacy-ujjain');
    if (legacyAfterError) throw legacyAfterError;
    check('profile acceptance does not add, remove, or mutate a legacy row', JSON.stringify(stableRows(legacyAfter)) === JSON.stringify(legacySnapshot));
    console.log(`  INFO  legacy rows checked byte-for-byte: ${legacySnapshot.length}`);
  } finally {
    await client.end();
  }

  console.log('\n=================================================================');
  console.log(`run-profile-qualified-acceptance: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('run-profile-qualified-acceptance crashed:', error);
  process.exit(2);
});

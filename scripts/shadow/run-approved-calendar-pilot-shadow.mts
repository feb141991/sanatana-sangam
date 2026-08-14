import { createShadowSupabaseClient } from './pg-supabase-shim.mjs';
import { materializeApprovedCalendarPilot } from '../../src/lib/calendar/approved-fixture-materializer';
import { attachMaterialisationBatches } from '../../src/lib/calendar/occurrence-reader';
import { formatOccurrencesToResults } from '../../src/lib/calendar/observance-formatter';
import { resolveCalendarContext } from '../../src/lib/calendar/calendar-context';
import { USE_CONDITION_EVALUATOR, USE_CORRECTED_MASA } from '../../src/lib/calendar/engine';

const connectionString = process.env.SHADOW_DATABASE_URL ?? 'postgres:///shoonaya_approved_pilot_shadow';
let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

async function main(): Promise<void> {
  const client = createShadowSupabaseClient(connectionString);
  try {
    check('USE_CORRECTED_MASA remains false', USE_CORRECTED_MASA === false);
    check('USE_CONDITION_EVALUATOR remains false', USE_CONDITION_EVALUATOR === false);

    const dryRun = await materializeApprovedCalendarPilot(client, false);
    check('dry run finds exactly three approved fixtures', dryRun.fixtureCount === 3, String(dryRun.fixtureCount));
    check('dry run proposes only inserts', dryRun.items.every(item => item.action === 'insert'));
    check('dry run preserves both Yogini variants', dryRun.items.filter(item => item.festivalId === 'yogini-ekadashi').length === 2);

    const committed = await materializeApprovedCalendarPilot(client, true);
    check('commit inserts exactly three rows', committed.inserted === 3, JSON.stringify(committed));
    check('commit stores exactly three rows', committed.storedCount === 3, String(committed.storedCount));

    const { data: stored, error: storedError } = await client
      .from('observance_occurrences')
      .select('id, definition_id, year, date, occurrence_date, review_status, verification_status, audit_status, publication_status, calculated_by, final_date_source, source_provenance, calendar_profile, spiritual_tradition, variant_key, is_primary_variant, series_instance_key, batch_id, reasons, diagnostics, source_refs, computed_latitude, computed_longitude, computed_timezone, rule_version, astronomy_version, day_boundary_version')
      .eq('calculated_by', 'approved-golden-pilot-v1');
    if (storedError) throw storedError;
    const rows = stored ?? [];
    check('every row has batch and series identity', rows.every((row: any) => row.batch_id && row.series_instance_key));
    check('stored rows never bake a primary variant', rows.every((row: any) => row.is_primary_variant === false));
    check('every row carries a typed Tier-1 source', rows.every((row: any) => row.source_refs?.[0]?.tier === 1));
    const yoginiRows = rows.filter((row: any) => row.year === 2026);
    check('Yogini readings share one instance key', new Set(yoginiRows.map((row: any) => row.series_instance_key)).size === 1);

    const definitionIds = [...new Set(rows.map((row: any) => row.definition_id))];
    const { data: definitions, error: definitionError } = await client
      .from('observance_definitions')
      .select('id, slug, display_name, emoji, description, kind, tradition, route_kind, route_slug, active')
      .in('id', definitionIds);
    if (definitionError) throw definitionError;
    const definitionsById = new Map((definitions ?? []).map((definition: any) => [definition.id, definition]));
    const hydrated = await attachMaterialisationBatches(
      rows.map((row: any) => ({ ...row, observance_definitions: definitionsById.get(row.definition_id) })),
      client,
    );

    const profileDefinition = {
      slug: 'north_indian_purnimanta',
      monthSystem: 'purnimanta' as const,
      era: 'vikram_north',
    };
    const location = {
      label: 'Ujjain, India',
      latitude: 23.1765,
      longitude: 75.7885,
      timezone: 'Asia/Kolkata',
    };
    const resultsFor = (tradition: string, ekadashiMethod: 'smarta' | 'vaishnava_suddha') =>
      formatOccurrencesToResults(
        hydrated,
        [],
        'hindu',
        'north_indian_purnimanta',
        tradition,
        '2026-01-01',
        '2027-12-31',
        resolveCalendarContext({
          calendarProfile: 'north_indian_purnimanta',
          traditionProfile: tradition,
          calendarProfileDefinition: profileDefinition,
          traditionProfileDefinition: {
            slug: tradition,
            ekadashiMethod,
            janmashtamiMethod: tradition === 'smarta' ? 'smarta_nishita' : 'vaishnava_rohini',
          },
          location,
        }),
      );

    const smarta = resultsFor('smarta', 'smarta');
    const vaishnava = resultsFor('gaudiya_iskcon', 'vaishnava_suddha');
    check('Smarta read has one primary per observance instance', smarta.filter(result => result.isPrimary).length === 2);
    check('Smarta read selects 10 July Yogini', smarta.find(result => result.festivalId === 'yogini-ekadashi' && result.isPrimary)?.civilDate === '2026-07-10');
    check('Vaishnava read has one primary per observance instance', vaishnava.filter(result => result.isPrimary).length === 2);
    check('Vaishnava read selects 11 July Yogini', vaishnava.find(result => result.festivalId === 'yogini-ekadashi' && result.isPrimary)?.civilDate === '2026-07-11');

    const rerun = await materializeApprovedCalendarPilot(client, true);
    check('rerun is idempotent with zero inserts', rerun.inserted === 0, JSON.stringify(rerun));
    check('rerun updates exactly the owned three rows', rerun.updated === 3, JSON.stringify(rerun));
    check('rerun retains exactly three stored rows', rerun.storedCount === 3, String(rerun.storedCount));
  } finally {
    await client.end();
  }

  console.log(`\nrun-approved-calendar-pilot-shadow: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('run-approved-calendar-pilot-shadow crashed:', error);
  process.exit(2);
});

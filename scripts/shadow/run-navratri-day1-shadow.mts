import pg from 'pg';
import { calculateObservancesForYearCorrected, RULE_ENGINE_VERSION } from '../../src/lib/calendar/engine';
import { commitOccurrencesWithBatches } from '../../src/lib/calendar/materialize';
import { currentMaterializationProvenance } from '../../src/lib/calendar/materialisation-batch';
import {
  NAVRATRI_REFERENCE_LOCATION, NAVRATRI_SUBDAY_SLUGS, planNavratriSubdays,
  type ExistingSubdayRow,
} from '../navratri-subdays-plan';
import { createShadowSupabaseClient } from './pg-supabase-shim.mjs';

const url = process.env.SHADOW_DATABASE_URL;
if (!url) throw new Error('SHADOW_DATABASE_URL is required');
const pool = new pg.Pool({ connectionString: url });
const db = createShadowSupabaseClient(url);

try {
  const calculated = calculateObservancesForYearCorrected(2026, NAVRATRI_REFERENCE_LOCATION)
    .filter(occ => NAVRATRI_SUBDAY_SLUGS.some(slug => slug === occ.slug));
  if (calculated.length !== NAVRATRI_SUBDAY_SLUGS.length) {
    throw new Error(`Expected ${NAVRATRI_SUBDAY_SLUGS.length} calculated subdays, got ${calculated.length}`);
  }

  // The forward migration adds Day 1. The other eight definitions and rows
  // model the actual production shape, but exist only in this disposable DB.
  for (const slug of NAVRATRI_SUBDAY_SLUGS.slice(1)) {
    await pool.query(
      `insert into observance_definitions
       (slug, display_name, kind, tradition, calendar_rule_type, verification_type,
        route_kind, route_slug, active, is_shared)
       values ($1, $1, 'major', 'hindu', 'lunar_tithi_span', 'lunar_tithi',
               'vrat', 'sharad-navratri', true, false)`,
      [slug],
    );
  }
  const defs = await pool.query<{ id: string; slug: string }>(
    'select id, slug from observance_definitions where slug = any($1)',
    [[...NAVRATRI_SUBDAY_SLUGS]],
  );
  const definitionIds = new Map(defs.rows.map(row => [row.slug, row.id]));
  if (definitionIds.size !== NAVRATRI_SUBDAY_SLUGS.length) throw new Error('Migration did not register Day 1');

  for (const occ of calculated.filter(row => row.slug !== NAVRATRI_SUBDAY_SLUGS[0])) {
    await pool.query(
      `insert into observance_occurrences
       (definition_id, year, date, occurrence_date, calendar_profile,
        spiritual_tradition, variant_key, computed_latitude, computed_longitude,
        computed_timezone, final_date_source, verification_status,
        publication_status, calculated_by)
       values ($1, $2, $3::date, $3::text, 'legacy-ujjain', null, 'legacy-default',
               $4, $5, $6, 'calculation_engine', 'not_checked',
               'published', 'shadow-existing-subday')`,
      [definitionIds.get(occ.slug), occ.year, occ.date,
        NAVRATRI_REFERENCE_LOCATION.lat, NAVRATRI_REFERENCE_LOCATION.lon,
        NAVRATRI_REFERENCE_LOCATION.tz],
    );
  }

  const selectExisting = async (): Promise<ExistingSubdayRow[]> => {
    const result = await pool.query<ExistingSubdayRow>(
      `select id, definition_id, year, date::text, occurrence_date,
              calendar_profile, spiritual_tradition, variant_key,
              computed_latitude, computed_longitude, computed_timezone,
              locked_for_regeneration, manual_date_override::text,
              final_date_source, publication_status, review_status, verification_status
       from observance_occurrences where year = 2026`,
    );
    return result.rows;
  };
  const versions = currentMaterializationProvenance(RULE_ENGINE_VERSION);
  const commit = async (rows: ExistingSubdayRow[]) => {
    const plan = planNavratriSubdays(calculated, definitionIds, rows, RULE_ENGINE_VERSION);
    const result = await commitOccurrencesWithBatches(db, {
      ...plan, toUpdate: [],
      versions: {
        engine: versions.engineVersion, rule: versions.ruleVersion,
        astronomy: versions.astronomyVersion, dayBoundary: versions.dayBoundaryVersion,
      },
    });
    return { plan, result };
  };

  const first = await commit(await selectExisting());
  if (first.plan.toInsert.length !== 1 || first.plan.toStamp.length !== 8 || first.result.inserted !== 1) {
    throw new Error(`First run mismatch: ${JSON.stringify({ inserts: first.plan.toInsert.length, stamps: first.plan.toStamp.length, written: first.result.inserted })}`);
  }
  const second = await commit(await selectExisting());
  if (second.plan.toInsert.length !== 0 || second.plan.toStamp.length !== 9 || second.result.inserted !== 0) {
    throw new Error(`Repeat run mismatch: ${JSON.stringify({ inserts: second.plan.toInsert.length, stamps: second.plan.toStamp.length, written: second.result.inserted })}`);
  }

  const rows = await pool.query<{
    slug: string; date: string; publication_status: string;
    verification_status: string | null; batch_id: string | null;
    series_instance_key: string | null;
  }>(
    `select d.slug, o.date::text, o.publication_status, o.verification_status,
            o.batch_id, o.series_instance_key
     from observance_occurrences o join observance_definitions d on d.id = o.definition_id
     where o.year = 2026 and o.calendar_profile = 'legacy-ujjain'
       and o.computed_latitude = $1 and o.computed_longitude = $2
       and o.computed_timezone = $3`,
    [NAVRATRI_REFERENCE_LOCATION.lat, NAVRATRI_REFERENCE_LOCATION.lon,
      NAVRATRI_REFERENCE_LOCATION.tz],
  );
  if (rows.rows.length !== NAVRATRI_SUBDAY_SLUGS.length) {
    throw new Error(`Repeat run lost/duplicated rows: ${rows.rows.length}`);
  }
  const expectedDates = new Map(calculated.map(row => [row.slug, row.date]));
  for (const row of rows.rows) {
    if (row.date !== expectedDates.get(row.slug) || !row.batch_id || !row.series_instance_key) {
      throw new Error(`Unstamped or incorrect row: ${JSON.stringify(row)}`);
    }
    if (row.slug === NAVRATRI_SUBDAY_SLUGS[0]) {
      if (row.publication_status !== 'withheld_disputed' || row.verification_status !== 'not_checked') {
        throw new Error('Day 1 was auto-published or auto-verified');
      }
    } else if (row.publication_status !== 'published') {
      throw new Error(`Existing publication state changed for ${row.slug}`);
    }
  }
  const batches = await pool.query<{ status: string; expected_row_count: number; produced_row_count: number }>(
    'select status, expected_row_count, produced_row_count from observance_materialisation_batches',
  );
  if (batches.rows.length !== NAVRATRI_SUBDAY_SLUGS.length || batches.rows.some(
    row => row.status !== 'complete' || row.expected_row_count !== 1 || row.produced_row_count !== 1,
  )) throw new Error(`Incomplete batches after repeat run: ${JSON.stringify(batches.rows)}`);

  console.log(JSON.stringify({
    migrationDefinitionCount: definitionIds.size,
    firstRun: { inserted: first.result.inserted, stamped: first.plan.toStamp.length },
    repeatRun: { inserted: second.result.inserted, stamped: second.plan.toStamp.length },
    occurrenceCount: rows.rows.length,
    completeBatchCount: batches.rows.length,
    day1PublicationStatus: rows.rows.find(row => row.slug === NAVRATRI_SUBDAY_SLUGS[0])?.publication_status,
  }, null, 2));
} finally {
  await db.end();
  await pool.end();
}

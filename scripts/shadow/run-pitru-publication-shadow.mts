import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPitruPakshaDay } from '../../src/lib/pitru-paksha';
import { REFERENCE_LOCATION_UJJAIN } from '../../src/lib/panchang';
import { buildObservanceSeries } from '../../src/lib/calendar/observance-series';
import { CALENDAR_OCCURRENCE_SELECT } from '../../src/lib/calendar/occurrence-reader';
import { formatOccurrencesToResults } from '../../src/lib/calendar/observance-formatter';
import { fetchIncompleteSeriesOccurrenceIds, fetchSeriesCompositionResults } from '../../src/lib/calendar/observance-series-eligibility';
import { produceSeriesCandidates } from '../../src/lib/series-candidate-producer';
import { isEditorialFieldDisplayable } from '../../src/lib/calendar/series-card-helpers';

pg.types.setTypeParser(1082, value => value);
const pool = new pg.Pool({ connectionString: process.env.SHADOW_DATABASE_URL });
const migration = readFileSync('supabase/migrations/20260930013837_publish_approved_pitru_paksha_2026.sql', 'utf8');
const rollback = readFileSync('supabase/rollbacks/20260930013837_publish_approved_pitru_paksha_2026_rollback.sql', 'utf8');
const expectedDates = Array.from({ length: 14 }, (_, i) => new Date(Date.UTC(2026,8,27+i)).toISOString().slice(0,10));
const options = { spiritualDate:'2026-09-30', profile:{calendar:'legacy-ujjain',tradition:'standard'},
  location:{label:'Ujjain',...REFERENCE_LOCATION_UJJAIN},tradition:'hindu' };

// Narrow pg-backed adapter: exercises the actual sibling query/filter chain against SQL.
const db = { from(table: string) {
  assert.equal(table, 'observance_occurrences');
  const clauses:string[]=[]; const params:unknown[]=[];
  const builder = {
    select(columns:string) { assert.equal(columns, CALENDAR_OCCURRENCE_SELECT); return builder; },
    in(column:string, values:string[]) { assert.equal(column,'observance_definitions.slug'); params.push(values); clauses.push(`d.slug = any($${params.length}::text[])`); return builder; },
    eq(column:string,value:string) { assert.equal(column,'calendar_profile'); params.push(value); clauses.push(`o.calendar_profile=$${params.length}`); return builder; },
    gte(column:string,value:string) { assert.equal(column,'date');params.push(value);clauses.push(`o.date >= $${params.length}::date`);return builder; },
    lte(column:string,value:string) { assert.equal(column,'date');params.push(value);clauses.push(`o.date <= $${params.length}::date`);return builder; },
    then(resolve:(value:unknown)=>unknown,reject:(error:unknown)=>unknown) {
      return pool.query(`select o.*, to_jsonb(d) as observance_definitions from observance_occurrences o join observance_definitions d on d.id=o.definition_id where ${clauses.join(' and ')}`,params)
        .then(result=>resolve({data:result.rows,error:null}),reject);
    },
  }; return builder;
}} as unknown as SupabaseClient;
const allRows = async () => (await pool.query('select to_jsonb(o) as row from observance_occurrences o order by id')).rows.map(r=>r.row);
try {
  assert.equal(getPitruPakshaDay('2026-09-26',REFERENCE_LOCATION_UJJAIN),null);
  assert.equal(getPitruPakshaDay('2026-10-11',REFERENCE_LOCATION_UJJAIN),null);
  for (const [i,date] of expectedDates.entries()) {
    const info=getPitruPakshaDay(date,REFERENCE_LOCATION_UJJAIN);
    assert.equal(info?.day,i+1);assert.equal(info?.totalDays,14);assert.equal(info?.isMahalaya,i===13);
  }
  await pool.query(`insert into observance_definitions(slug,display_name,kind,tradition,active) values('mahalaya-amavasya','Mahalaya Amavasya','vrat','hindu',true);
    insert into observance_occurrences(definition_id,year,date,occurrence_date,calendar_profile,spiritual_tradition,variant_key,computed_latitude,computed_longitude,computed_timezone,review_status,verification_status,audit_status,publication_status,review_notes,source_provenance)
    select id,2026,'2026-10-10','2026-10-10','legacy-ujjain',null,'legacy-default',23.1765,75.7885,'Asia/Kolkata','reviewed','verified','completed','published','Existing Mahalaya approval must survive','{"existing_review":"preserve"}' from observance_definitions where slug='mahalaya-amavasya';`);
  await pool.query(readFileSync('supabase/migrations/20260930013151_pitru_paksha_daily_journey_series_2026.sql','utf8'));
  await pool.query(readFileSync('supabase/migrations/20260930013332_pitru_paksha_fix_missing_days_2_to_13.sql','utf8'));
  const originalCount = (await pool.query("select count(*)::int as n from observance_occurrences o join observance_definitions d on d.id=o.definition_id where d.slug like 'pitru-paksha-day-%'" )).rows[0].n;
  assert.equal(originalCount,13);
  // Protected neighbor after historical migrations: it is never publication's target.
  await pool.query(`insert into observance_occurrences(definition_id,year,date,occurrence_date,calendar_profile,variant_key,computed_latitude,computed_longitude,computed_timezone,review_status,verification_status,audit_status,publication_status,review_notes)
    select id,2026,'2026-09-27','2026-09-27','legacy-ujjain','legacy-default',51.5074,-0.1278,'Europe/London','needs_review','not_checked','completed','withheld_disputed','Untouched London row' from observance_definitions where slug='pitru-paksha-day-1';`);
  const before = await allRows();
  await pool.query("update observance_occurrences set date='2026-09-29' where occurrence_date='2026-09-30'");
  await assert.rejects(pool.query(migration), /dates\/context changed/);await pool.query('rollback');
  await pool.query("update observance_occurrences set date='2026-09-30' where occurrence_date='2026-09-30'");
  await pool.query(migration);
  const after = await allRows();
  await pool.query(migration); assert.deepEqual(await allRows(),after,'replay changes nothing');
  assert.equal(after.filter(r=>r.publication_status==='published').length,14);
  assert.equal(after.find(r=>r.computed_timezone==='Europe/London')?.publication_status,'withheld_disputed');
  assert.equal(after.find(r=>r.review_notes==='Existing Mahalaya approval must survive')?.publication_status,'published');
  const raw = await pool.query(`select o.*, to_jsonb(d) as observance_definitions from observance_occurrences o join observance_definitions d on d.id=o.definition_id where o.computed_timezone='Asia/Kolkata' order by date`);
  const current = formatOccurrencesToResults(raw.rows,[],'hindu','legacy-ujjain',null,'2026-09-30','2026-10-15');
  const full = await fetchSeriesCompositionResults(db,current,options);
  const journey = buildObservanceSeries(full,options).find(s=>s.definitionKey==='pitru-paksha');
  if(journey?.status !== 'active') console.error(JSON.stringify({diagnostics:journey?.diagnostics,mahalaya:full.filter(c=>c.slug==='mahalaya-amavasya')},null,2));
  assert.equal(journey?.status,'active');assert.equal(journey?.currentDay,4);assert.equal(journey?.totalDays,14);
  assert.equal(journey?.activeChildOccurrenceIds.length,1);
  assert.equal(isEditorialFieldDisplayable(journey?.editorial?.name,{tradition:'hindu',calendarProfile:'legacy-ujjain'}),true);
  assert.equal((await fetchIncompleteSeriesOccurrenceIds(db,['pitru-paksha-day-4'],['2026-09-30'])).size,0);
  process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES='candidate';
  const child=raw.rows.find(r=>r.occurrence_date==='2026-09-30');
  const input={ targetDate:'2026-09-30',userId:'shadow-opted-in',userTimezone:'Europe/London',wantsFestivalReminders:true,
    childOccurrences:[{id:child.id,slug:'pitru-paksha-day-4',civilDate:child.date,status:'resolved',reviewStatus:child.review_status,
      publicationStatus:child.publication_status,verificationStatus:child.verification_status,auditStatus:child.audit_status,
      finalDateSource:child.final_date_source,sourceRefs:child.source_refs,calendarProfile:child.calendar_profile,tradition:'hindu'}] };
  const generated=produceSeriesCandidates(input);assert.equal(generated.candidates.length,1);
  assert.equal(produceSeriesCandidates({...input,wantsFestivalReminders:false}).candidates.length,0);
  assert.equal(produceSeriesCandidates({...input,childOccurrences:[{...input.childOccurrences[0],calendarProfile:'north_indian_purnimanta'}]}).candidates.length,0);
  await pool.query("update observance_occurrences set publication_status='withheld_disputed' where occurrence_date='2026-10-01'");
  assert.ok((await fetchIncompleteSeriesOccurrenceIds(db,['pitru-paksha-day-4'],['2026-09-30'])).has(child.id));
  await pool.query("update observance_occurrences set publication_status='published' where occurrence_date='2026-10-01'");
  await pool.query(rollback); assert.deepEqual(await allRows(),before,'rollback restores touched state exactly');
  await pool.query(rollback); assert.deepEqual(await allRows(),before,'rollback replay is harmless');
  console.log(JSON.stringify({engineDays:expectedDates.length,start:expectedDates[0],end:expectedDates[13],newlyPublished:13,seriesChildren:14,currentDay:4,activeChildren:1,candidates:1,foreignLocationUntouched:true,replayAndRollbackPassed:true},null,2));
} finally { await pool.end(); }

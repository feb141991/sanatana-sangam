/**
 * Runs the ACTUAL materialiser against the shadow database, twice, and asserts
 * the invariants a hand-written-SQL harness cannot see.
 *
 * WHY THIS FILE EXISTS
 * ---------------------
 * "19/19 shadow checks pass" previously meant 19 hand-written SQL assertions
 * plus a reproduction of `openBatch`'s upsert -- never a call to
 * `materializeOccurrencesForYears` itself. The mass-delete defect (`.select('id')`
 * then reading fields that were never selected, silently `undefined`, every
 * branch falling through to `.delete()`) lived entirely inside that function and
 * could not have been caught by a harness that never executed it.
 *
 * This script closes exactly that gap: it imports the real, unmodified
 * `materializeOccurrencesForYears` via `tsx` and drives it against a real
 * Postgres connection through `pg-supabase-shim.mjs`, which returns precisely
 * the columns a `.select()` asked for -- so an unselected-field bug now produces
 * a genuine `undefined`, the same as it would against production Supabase.
 *
 * THE CHECK THAT MATTERS MOST: run once, then run again with nothing changed.
 * Under the mass-delete defect the retire loop's `.select('id')` makes every
 * field it inspects `undefined`, so `if (r.date && claimed.has(r.date))` is
 * always false regardless of whether the date is genuinely still claimed -- the
 * second run deletes every row linked to a batch, unconditionally. Total row
 * count must never drop across an idempotent rerun.
 *
 * PROTECTION-PATH CHECKS: rather than inventing rows the materialiser never
 * looks at (which would prove nothing), this mutates rows the engine ITSELF
 * just wrote on run 1 -- marking one locked and one manually-overridden -- so
 * run 2 must decide whether to touch them via the exact guarded branches
 * findings #3 and #4 were about, not a code path the fixtures happen to avoid.
 *
 * Exits 0 and prints PASS/FAIL lines; non-zero on any failure.
 */
import { createShadowSupabaseClient } from './pg-supabase-shim.mjs';
import { materializeOccurrencesForYears } from '../../src/lib/calendar/materialize';

const YEAR = 2026;
const connectionString = process.env.SHADOW_DATABASE_URL ?? 'postgres:///shoonaya_shadow';

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  PASS  ${name}`);
    pass++;
  } else {
    console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ''}`);
    fail++;
  }
}

async function main() {
  const client = createShadowSupabaseClient(connectionString);

  const countAll = async () => {
    const { data } = await client.from('observance_occurrences').select('id');
    return data?.length ?? 0;
  };

  const before = await countAll();
  console.log(`\nbefore any run: ${before} total occurrence rows\n`);

  console.log('=== run 1 (commit) ===========================================');
  const run1 = await materializeOccurrencesForYears({
    supabase: client, targetYears: [YEAR], calculatedBy: 'shadow-harness', commit: true,
  });
  console.log(JSON.stringify(run1.summary?.[YEAR] ?? run1, null, 2));

  const afterRun1 = await countAll();
  check('run 1 does not lose rows', afterRun1 >= before, `${before} -> ${afterRun1}`);

  const { data: batchesRun1 } = await client
    .from('observance_materialisation_batches')
    .select('id, status, expected_row_count, produced_row_count');
  const dishonest1 = (batchesRun1 ?? []).filter(
    (b: any) => b.status === 'complete' && b.produced_row_count !== b.expected_row_count,
  );
  check('no batch claims complete without matching counts', dishonest1.length === 0, JSON.stringify(dishonest1));

  // Two rows the engine just wrote and linked to a batch on run 1 -- picked at
  // random from what actually landed, not manufactured. Mutating REAL output
  // is what makes the next checks a genuine test of the guarded branches rather
  // than fixtures the materialiser never inspects.
  const { data: batched } = await client
    .from('observance_occurrences')
    .select('id, date, batch_id, calculation_version')
    .eq('year', YEAR);
  const eligible = (batched ?? []).filter((r: any) => r.batch_id);
  check('at least two rows were batched on run 1 to mutate for the next checks', eligible.length >= 2, `${eligible.length}`);
  if (eligible.length < 2) {
    console.log('\ncannot continue without two batched rows -- aborting');
    await client.end();
    process.exit(1);
  }

  const lockTarget = eligible[0];
  const manualTarget = eligible[1];

  await client.from('observance_occurrences').update({ locked_for_regeneration: true }).eq('id', lockTarget.id);
  // Marks the row protected without changing what date it displays -- the
  // materialiser must leave a manually-overridden row alone even when its own
  // computed date agrees with what is already stored.
  await client.from('observance_occurrences').update({
    manual_date_override: manualTarget.date,
    final_date_source: 'manual_override',
  }).eq('id', manualTarget.id);

  console.log(`\nlocked   after run 1: id=${lockTarget.id} date=${lockTarget.date} batch_id=${lockTarget.batch_id}`);
  console.log(`manual   after run 1: id=${manualTarget.id} date=${manualTarget.date} batch_id=${manualTarget.batch_id}`);

  console.log('\n=== run 2 (idempotent rerun, nothing else changed) ============');
  const run2 = await materializeOccurrencesForYears({
    supabase: client, targetYears: [YEAR], calculatedBy: 'shadow-harness', commit: true,
  });
  console.log(JSON.stringify(run2.summary?.[YEAR] ?? run2, null, 2));

  const afterRun2 = await countAll();
  // THE CHECK. Under the mass-delete defect this fails: run 2's reconciliation
  // pass deletes every row linked to a batch, regardless of whether its date is
  // still claimed, because every field it inspects other than `id` is undefined.
  check(
    'run 2 does not silently delete rows the first run just wrote',
    afterRun2 === afterRun1,
    `${afterRun1} -> ${afterRun2}`,
  );

  const { data: lockedAfter } = await client
    .from('observance_occurrences')
    .select('id, date, calculation_version, locked_for_regeneration')
    .eq('id', lockTarget.id)
    .single();
  check('locked row still exists after rerun', !!lockedAfter, JSON.stringify(lockedAfter));
  check(
    'locked row was not re-stamped or overwritten (calculation_version unchanged)',
    lockedAfter?.calculation_version === lockTarget.calculation_version,
    `${lockTarget.calculation_version} -> ${lockedAfter?.calculation_version}`,
  );

  const { data: manualAfter } = await client
    .from('observance_occurrences')
    .select('id, date, calculation_version, manual_date_override')
    .eq('id', manualTarget.id)
    .single();
  check('manual-override row still exists after rerun', !!manualAfter, JSON.stringify(manualAfter));
  check(
    'manual-override row was not re-stamped (calculation_version unchanged)',
    manualAfter?.calculation_version === manualTarget.calculation_version,
    `${manualTarget.calculation_version} -> ${manualAfter?.calculation_version}`,
  );

  const { data: batchesRun2 } = await client
    .from('observance_materialisation_batches')
    .select('id, status, expected_row_count, produced_row_count');
  const dishonest2 = (batchesRun2 ?? []).filter(
    (b: any) => b.status === 'complete' && b.produced_row_count !== b.expected_row_count,
  );
  check('still no dishonest complete batch after rerun', dishonest2.length === 0, JSON.stringify(dishonest2));

  // Restore the two rows to their original state so this script leaves no
  // trace for whatever runs after it in the same harness invocation.
  await client.from('observance_occurrences').update({ locked_for_regeneration: false }).eq('id', lockTarget.id);
  await client.from('observance_occurrences').update({
    manual_date_override: null,
    final_date_source: 'calculation_engine',
  }).eq('id', manualTarget.id);

  await client.end();

  console.log(`\n=================================================================`);
  console.log(`run-materializer: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(err => {
  console.error('run-materializer crashed:', err);
  process.exit(2);
});

/**
 * Application-code shadow harness driving collectDisputedUnresolvedItems and
 * persistReviewQueueItems against a real PostgreSQL shadow database.
 */
import { createShadowSupabaseClient } from './pg-supabase-shim.mjs';
import { collectDisputedUnresolvedItems, persistReviewQueueItems } from '../../src/lib/calendar/materialize';

const connectionString = process.env.SHADOW_DATABASE_URL ?? 'postgres:///shoonaya_review_queue_shadow';

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

type DefinitionRow = { id: string; slug: string };
type QueueRow = {
  id: string;
  variant_key: string;
  review_status: string;
  source_refs: Array<{ tier?: number }>;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
};

async function main() {
  const supabase = createShadowSupabaseClient(connectionString) as any;

  // 1. Verify collector outputs
  const items2026 = collectDisputedUnresolvedItems(2026);
  const items2025 = collectDisputedUnresolvedItems(2025);
  const items2027 = collectDisputedUnresolvedItems(2027);
  const items2028 = collectDisputedUnresolvedItems(2028);

  const yogini2026 = items2026.filter(i => i.slug === 'yogini-ekadashi');
  const yogini2025 = items2025.filter(i => i.slug === 'yogini-ekadashi');
  const yogini2027 = items2027.filter(i => i.slug === 'yogini-ekadashi');
  const yogini2028 = items2028.filter(i => i.slug === 'yogini-ekadashi');

  check('Yogini 2026 collector produces exactly two entries', yogini2026.length === 2, `got ${yogini2026.length}`);
  check('Yogini 2025 collector produces zero entries', yogini2025.length === 0, `got ${yogini2025.length}`);
  check('Yogini 2027 collector produces zero entries', yogini2027.length === 0, `got ${yogini2027.length}`);
  check('Yogini 2028 collector produces zero entries', yogini2028.length === 0, `got ${yogini2028.length}`);

  // Fetch definition ID mapping from shadow DB
  const { data: rawDefs } = await supabase.from('observance_definitions').select('id, slug');
  const defs = rawDefs as DefinitionRow[] | null;
  const defMap = new Map<string, string>();
  if (defs) {
    for (const d of defs) {
      defMap.set(d.slug, d.id);
    }
  }

  // Ensure yogini-ekadashi definition exists in shadow DB
  if (!defMap.has('yogini-ekadashi')) {
    const { data: rawNewDef } = await supabase.from('observance_definitions').insert([{
      slug: 'yogini-ekadashi',
      display_name: 'Yogini Ekadashi',
      kind: 'vrat',
      tradition: 'hindu',
      active: true,
    }]).select();
    const newDef = rawNewDef as DefinitionRow[] | null;
    if (newDef && newDef[0]) {
      defMap.set('yogini-ekadashi', newDef[0].id);
    }
  }
  const yoginiDefId = defMap.get('yogini-ekadashi');

  // 2. Persist real queue items to shadow DB
  await persistReviewQueueItems(supabase, yogini2026, defMap);

  try {
    await persistReviewQueueItems(supabase, [{
      ...yogini2026[0],
      slug: 'missing-shadow-definition',
    }], defMap);
    check('missing definition fails closed', false, 'persistence silently skipped it');
  } catch (error: unknown) {
    check(
      'missing definition fails closed',
      error instanceof Error && error.message.includes('missing-shadow-definition'),
    );
  }

  const { data: rawQueueAfterRun1 } = await supabase
    .from('observance_review_queue')
    .select('id, variant_key, review_status, source_refs')
    .eq('year', 2026)
    .eq('definition_id', yoginiDefId);
  const queueAfterRun1 = rawQueueAfterRun1 as QueueRow[] | null;

  check('both real Yogini 2026 rows persist', (queueAfterRun1?.length ?? 0) === 2, `got ${queueAfterRun1?.length}`);

  // Check typed source_refs round-trip
  const hasTypedSources = queueAfterRun1?.every(
    row => Array.isArray(row.source_refs) && row.source_refs.length > 0 && row.source_refs[0].tier === 1,
  );
  check('typed source_refs survive round-trip', Boolean(hasTypedSources));

  // 3. Rerun persistence for idempotency
  await persistReviewQueueItems(supabase, yogini2026, defMap);
  const { data: queueAfterRun2 } = await supabase
    .from('observance_review_queue')
    .select('id')
    .eq('year', 2026)
    .eq('definition_id', yoginiDefId);

  check('rerun is cardinality-idempotent', (queueAfterRun2?.length ?? 0) === 2, `got ${queueAfterRun2?.length}`);

  // 4. Test terminal state preservation
  const smartaRow = queueAfterRun1?.find(row => row.variant_key === 'smarta');
  const vaishnavaRow = queueAfterRun1?.find(row => row.variant_key === 'vaishnava_vidhava');

  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testNotesApproved = 'Council approved Smarta reading';
  const testNotesRejected = 'Council rejected Vaishnava reading';

  if (smartaRow && vaishnavaRow) {
    await supabase.from('observance_review_queue').update({
      review_status: 'approved',
      reviewed_by: testUserId,
      reviewed_at: '2026-08-11T12:00:00Z',
      review_notes: testNotesApproved,
    }).eq('id', smartaRow.id);

    await supabase.from('observance_review_queue').update({
      review_status: 'rejected',
      reviewed_by: testUserId,
      reviewed_at: '2026-08-11T12:05:00Z',
      review_notes: testNotesRejected,
    }).eq('id', vaishnavaRow.id);

    // Rerun materializer queue persistence over terminal states
    await persistReviewQueueItems(supabase, yogini2026, defMap);

    const { data: rawFinalRows } = await supabase
      .from('observance_review_queue')
      .select('id, variant_key, review_status, reviewed_by, reviewed_at, review_notes')
      .eq('year', 2026)
      .eq('definition_id', yoginiDefId);
    const finalRows = rawFinalRows as QueueRow[] | null;

    const finalSmarta = finalRows?.find(row => row.id === smartaRow.id);
    const finalVaishnava = finalRows?.find(row => row.id === vaishnavaRow.id);

    check(
      'terminal approved status and reviewer metadata survive rerun',
      finalSmarta?.review_status === 'approved' &&
      finalSmarta?.reviewed_by === testUserId &&
      finalSmarta?.review_notes === testNotesApproved
    );

    check(
      'terminal rejected status and reviewer metadata survive rerun',
      finalVaishnava?.review_status === 'rejected' &&
      finalVaishnava?.reviewed_by === testUserId &&
      finalVaishnava?.review_notes === testNotesRejected
    );
  } else {
    check('terminal status setup', false, 'queue rows missing');
  }

  if (fail > 0) {
    console.error(`\nApp-level shadow verification failed: ${fail} test(s) failed.`);
    process.exit(1);
  } else {
    console.log(`\nApp-level shadow verification passed cleanly: ${pass} test(s) passed.`);
  }

  await supabase.end();
}

main().catch(err => {
  console.error('Fatal error in shadow app runner:', err);
  process.exit(1);
});

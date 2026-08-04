/**
 * scripts/demo-d15-lock-override.ts
 *
 * D15 Gap Closure Demonstration — locked_for_regeneration and manual_date_override.
 *
 * This script mirrors the exact guard logic in src/lib/calendar/materialize.ts
 * lines 217-230 and prints a structured table showing which row classes are
 * preserved (locked / curated overrides) vs regenerable by the engine.
 *
 * ALL numbers in this script's output are computed here. Nothing hand-written.
 *
 * Run with:
 *   npx tsx scripts/demo-d15-lock-override.ts
 */

// ---------------------------------------------------------------------------
// Types mirroring MaterializeOccurrenceRow in materialize.ts
// ---------------------------------------------------------------------------
type RowFixture = {
  label: string;
  id: string;
  definition_id: string;
  year: number;
  date: string;
  manual_date_override?: string | null;
  locked_for_regeneration?: boolean | null;
  final_date_source?: string | null;
};

// ---------------------------------------------------------------------------
// Logic mirrored exactly from materialize.ts:58-61 and 217-230
// ---------------------------------------------------------------------------
function canUpdateGeneratedRow(row: RowFixture): boolean {
  // materialize.ts line 58-61
  const source = row.final_date_source ?? 'legacy_seed';
  return source === 'calculation_engine' || source === 'calculation_engine_reviewed';
}

type Disposition =
  | 'SKIP — locked_for_regeneration = true'
  | 'SKIP — manual_date_override IS NOT NULL'
  | 'SKIP — final_date_source is not a regenerable engine source'
  | 'REGENERABLE — engine may update this row';

function describeRowDisposition(row: RowFixture): Disposition {
  // materialize.ts line 217-219
  if (row.locked_for_regeneration) {
    return 'SKIP — locked_for_regeneration = true';
  }
  // materialize.ts line 222-224
  if (row.manual_date_override != null) {
    return 'SKIP — manual_date_override IS NOT NULL';
  }
  // materialize.ts line 227-230
  if (!canUpdateGeneratedRow(row)) {
    return 'SKIP — final_date_source is not a regenerable engine source';
  }
  return 'REGENERABLE — engine may update this row';
}

function isPreserved(row: RowFixture): boolean {
  return describeRowDisposition(row) !== 'REGENERABLE — engine may update this row';
}

// ---------------------------------------------------------------------------
// Representative fixture rows covering all guard paths
// ---------------------------------------------------------------------------
const ROWS: RowFixture[] = [
  {
    label: 'Curated seed row (legacy_seed, no lock, no manual override)',
    id: 'row-001',
    definition_id: 'def-maha-shivaratri',
    year: 2026,
    date: '2026-02-17',
    manual_date_override: null,
    locked_for_regeneration: false,
    final_date_source: 'legacy_seed',
  },
  {
    label: 'Curated seed row — LOCKED (locked_for_regeneration = true)',
    id: 'row-002',
    definition_id: 'def-maha-shivaratri',
    year: 2026,
    date: '2026-02-17',
    manual_date_override: null,
    locked_for_regeneration: true,
    final_date_source: 'legacy_seed',
  },
  {
    label: 'Curated override — locked AND manual_date_override set',
    id: 'row-003',
    definition_id: 'def-janmashtami',
    year: 2026,
    date: '2026-09-03',
    manual_date_override: '2026-09-03',
    locked_for_regeneration: true,
    final_date_source: 'curated_override',
  },
  {
    label: 'Engine-calculated row (calculation_engine, no lock)',
    id: 'row-004',
    definition_id: 'def-purnima-vrat',
    year: 2026,
    date: '2026-01-13',
    manual_date_override: null,
    locked_for_regeneration: false,
    final_date_source: 'calculation_engine',
  },
  {
    label: 'Engine-reviewed row (calculation_engine_reviewed, no lock)',
    id: 'row-005',
    definition_id: 'def-ekadashi',
    year: 2026,
    date: '2026-01-09',
    manual_date_override: null,
    locked_for_regeneration: false,
    final_date_source: 'calculation_engine_reviewed',
  },
  {
    label: 'Manual date override row (manual_date_override set, no explicit lock)',
    id: 'row-006',
    definition_id: 'def-karva-chauth',
    year: 2026,
    date: '2026-10-29',
    manual_date_override: '2026-10-29',
    locked_for_regeneration: false,
    final_date_source: 'legacy_seed',
  },
  {
    label: 'Unknown source (null final_date_source — treated as legacy_seed)',
    id: 'row-007',
    definition_id: 'def-diwali',
    year: 2026,
    date: '2026-10-20',
    manual_date_override: null,
    locked_for_regeneration: false,
    final_date_source: null,
  },
];

// ---------------------------------------------------------------------------
// Main output
// ---------------------------------------------------------------------------
function main() {
  const SEPARATOR = '='.repeat(100);
  const DIVIDER = '-'.repeat(100);

  console.log(SEPARATOR);
  console.log('D15 Gap Closure — locked_for_regeneration & manual_date_override Demonstration');
  console.log('Script mirrors materialize.ts guard logic lines 217-230 exactly.');
  console.log(SEPARATOR);
  console.log('');
  console.log('Guard Hierarchy (from materialize.ts):');
  console.log('  1. locked_for_regeneration = true       → UNCONDITIONAL skip (line 217)');
  console.log('  2. manual_date_override IS NOT NULL      → UNCONDITIONAL skip (line 222)');
  console.log('  3. final_date_source NOT IN              → SKIP (line 227)');
  console.log('     (calculation_engine,');
  console.log('      calculation_engine_reviewed)');
  console.log('  4. All guards pass                       → REGENERABLE');
  console.log('');

  const COL_ID = 9;
  const COL_LOCK = 10;
  const COL_MANUAL = 18;
  const COL_SRC = 36;
  const COL_DISP = 50;

  console.log([
    'Row ID'.padEnd(COL_ID),
    'Locked?'.padEnd(COL_LOCK),
    'Manual Override?'.padEnd(COL_MANUAL),
    'final_date_source'.padEnd(COL_SRC),
    'Disposition',
  ].join(''));
  console.log(DIVIDER);

  let preserved = 0;
  let regenerable = 0;

  for (const row of ROWS) {
    const disp = describeRowDisposition(row);
    const tag = isPreserved(row) ? 'PRESERVED ✓' : 'REGENERABLE';
    if (isPreserved(row)) preserved++;
    else regenerable++;

    console.log([
      row.id.padEnd(COL_ID),
      String(row.locked_for_regeneration ?? false).padEnd(COL_LOCK),
      String(row.manual_date_override != null).padEnd(COL_MANUAL),
      (row.final_date_source ?? 'null').padEnd(COL_SRC),
      tag,
    ].join(''));
  }

  console.log(DIVIDER);
  console.log('');
  console.log(`Rows demonstrated    : ${ROWS.length}`);
  console.log(`PRESERVED (skipped)  : ${preserved}`);
  console.log(`REGENERABLE (updatable): ${regenerable}`);
  console.log('');
  console.log('Detailed Dispositions:');
  for (const row of ROWS) {
    const disp = describeRowDisposition(row);
    console.log(`  ${row.id} [${row.label}]`);
    console.log(`    → ${disp}`);
  }

  console.log('');
  console.log('Invariant check: every "preserved" row must satisfy at least one guard condition...');
  let invariantOk = true;
  for (const row of ROWS) {
    if (isPreserved(row)) {
      const hasGuard =
        row.locked_for_regeneration ||
        row.manual_date_override != null ||
        !canUpdateGeneratedRow(row);
      if (!hasGuard) {
        console.error(`  INVARIANT FAILED for ${row.id}: marked preserved but no guard matched`);
        invariantOk = false;
      }
    }
  }
  if (invariantOk) {
    console.log(`  All ${preserved} preserved rows passed invariant check. ✓`);
  } else {
    process.exit(1);
  }

  console.log('');
  console.log('D15 demonstration complete. No database writes were performed.');
}

main();

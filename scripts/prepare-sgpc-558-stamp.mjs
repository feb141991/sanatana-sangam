#!/usr/bin/env node

/*
 * Prepare, but never execute, the additive SGPC provenance stamp and its
 * follow-up hold statements. Input is a read-only JSON extract supplied by an
 * operator. The script emits SQL with pre-image predicates; it does not open a
 * database connection.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const EDITION = 558;
const FROM = '2026-03-14';
const TO = '2027-03-13';

function sql(value) { return `'${String(value).replaceAll("'", "''")}'`; }
function effective(row) { return row.manual_date_override ?? row.date; }
function expected(row) { return row.expected_558_date ?? null; }

export function buildStampPlan(rows) {
  const stampable = rows.filter(row => row.tradition === 'sikh' && effective(row) === expected(row) && expected(row) >= FROM && expected(row) <= TO);
  const stale = rows.filter(row => row.tradition === 'sikh' && (!expected(row) || effective(row) !== expected(row) || expected(row) < FROM || expected(row) > TO));
  return { stampable, stale };
}

export function renderPlan(rows) {
  const { stampable, stale } = buildStampPlan(rows);
  const stampStatements = stampable.map(row => `UPDATE observance_occurrences\nSET source_provenance = COALESCE(source_provenance, '{}'::jsonb) || jsonb_build_object('calendar_provenance', jsonb_build_object('provenance', 'sgpc_edition', 'edition', ${EDITION}))\nWHERE id = ${sql(row.id)}\n  AND date = ${sql(row.date)}\n  AND COALESCE(manual_date_override, date) = ${sql(effective(row))}\n  AND source_provenance IS NOT NULL\n  AND (source_provenance->'calendar_provenance') IS NULL;`).join('\n\n');
  const holdStatements = stale.map(row => `UPDATE observance_occurrences\nSET publication_status = 'withheld_disputed'\nWHERE id = ${sql(row.id)}\n  AND publication_status = ${sql(row.publication_status)}\n  AND date = ${sql(row.date)}\n  AND COALESCE(manual_date_override, date) = ${sql(effective(row))};`).join('\n\n');
  const rollbackStatements = stampable.map(row => `UPDATE observance_occurrences\nSET source_provenance = source_provenance - 'calendar_provenance'\nWHERE id = ${sql(row.id)}\n  AND date = ${sql(row.date)}\n  AND COALESCE(manual_date_override, date) = ${sql(effective(row))}\n  AND source_provenance->'calendar_provenance' = jsonb_build_object('provenance', 'sgpc_edition', 'edition', ${EDITION});`).join('\n\n');
  return { stampable, stale, stampSql: stampStatements, holdSql: holdStatements, rollbackSql: rollbackStatements };
}

if (process.argv[1]?.endsWith('prepare-sgpc-558-stamp.mjs')) {
  const input = process.argv[process.argv.indexOf('--extract') + 1];
  const output = process.argv[process.argv.indexOf('--out') + 1];
  if (!input || !output) throw new Error('Usage: node scripts/prepare-sgpc-558-stamp.mjs --extract rows.json --out plan.json');
  const rows = JSON.parse(readFileSync(input, 'utf8'));
  const plan = renderPlan(rows);
  writeFileSync(output, `${JSON.stringify(plan, null, 2)}\n`);
  console.log(`Prepared ${plan.stampable.length} additive stamps and ${plan.stale.length} stale-row holds. No database was contacted.`);
}

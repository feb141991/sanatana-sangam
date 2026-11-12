import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CALENDAR_OCCURRENCE_SELECT } from '../occurrence-reader';

/**
 * Origin: 2026-11-12. The Sikh provenance commit (ff2a001) added `rule_family` to this select as if it were a
 * column of observance_definitions. It is a field of the rules data, not a column, so every canonical
 * occurrence read failed in production with Postgres 42703 and Home's Sacred Days showed "could not be
 * refreshed". The reader tests use a pretend database, so nothing compared the requested columns with the real
 * tables. This does, using the generated types (kept equal to production by regenerating after each migration).
 */

const GENERATED = readFileSync(join(process.cwd(), 'src/types/database.generated.ts'), 'utf8');

function rowColumns(table: string): Set<string> {
  const start = GENERATED.indexOf(`\n      ${table}: {\n        Row: {`);
  expect(start, `${table} must exist in database.generated.ts`).toBeGreaterThan(-1);
  const end = GENERATED.indexOf('\n        }', start);
  const block = GENERATED.slice(start, end);
  return new Set([...block.matchAll(/\n {10}(\w+)\??:/g)].map((m) => m[1]));
}

/** Splits a PostgREST select into plain columns and embedded resources, one level deep. */
function parseSelect(select: string): { columns: string[]; embedded: Record<string, string[]> } {
  const columns: string[] = [];
  const embedded: Record<string, string[]> = {};
  let depth = 0;
  let token = '';
  const parts: string[] = [];
  for (const char of select) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(token);
      token = '';
    } else {
      token += char;
    }
  }
  parts.push(token);
  for (const raw of parts.map((p) => p.trim()).filter(Boolean)) {
    const open = raw.indexOf('(');
    if (open === -1) {
      columns.push(raw);
      continue;
    }
    const name = raw.slice(0, open).split('!')[0].trim();
    embedded[name] = raw.slice(open + 1, raw.lastIndexOf(')')).split(',').map((c) => c.trim()).filter(Boolean);
  }
  return { columns, embedded };
}

describe('CALENDAR_OCCURRENCE_SELECT names only real columns', () => {
  const { columns, embedded } = parseSelect(CALENDAR_OCCURRENCE_SELECT);

  it('parses the select into occurrence columns and the definition embed', () => {
    expect(columns.length).toBeGreaterThan(10);
    expect(Object.keys(embedded)).toEqual(['observance_definitions']);
  });

  it('every occurrence column exists on observance_occurrences', () => {
    const real = rowColumns('observance_occurrences');
    const missing = columns.filter((c) => !real.has(c));
    expect(missing, `not columns of observance_occurrences: ${missing.join(', ')}`).toEqual([]);
  });

  it('every embedded definition column exists on observance_definitions', () => {
    const real = rowColumns('observance_definitions');
    const missing = embedded.observance_definitions.filter((c) => !real.has(c));
    expect(missing, `not columns of observance_definitions: ${missing.join(', ')}`).toEqual([]);
  });

  it('does not ask for rule_family, which lives in the rules data and not in the database', () => {
    expect(CALENDAR_OCCURRENCE_SELECT).not.toMatch(/\brule_family\b/);
  });
});

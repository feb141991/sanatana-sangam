import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BUDGET_EXEMPT_EVENT_TYPES,
  canonicalNotificationBudgetType,
  classifyNotificationCadence,
  LEARNING_EVENT_TYPES,
  NOTIFICATION_CADENCE_POLICY,
  PERSON_INITIATED_EVENT_TYPES,
  SHLOKA_EVENT_TYPES,
} from './notification-cadence-policy';

/**
 * The daily limits live twice: here (the resolver) and in the database (the cadence trigger).
 * If they disagree, the resolver accepts a row the trigger then refuses, the persist call raises, and
 * the WHOLE claimed batch (every user) is returned to pending and retried every ten minutes.
 * This test reads the SQL and fails the moment either side changes without the other.
 */

const MIGRATIONS = path.join(process.cwd(), 'supabase', 'migrations');
const CADENCE_V3 = '20261110140000_one_nudge_a_day_cadence.sql';
const SQL_TEST = path.join(process.cwd(), 'supabase', 'tests', 'notification_cadence_atomicity.test.sql');

function read(file: string): string {
  return readFileSync(file, 'utf8');
}

/** The body of `CREATE OR REPLACE FUNCTION public.<name>(` up to its closing `$$;`. */
function functionBody(sql: string, name: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE FUNCTION public.${name}(`);
  if (start < 0) throw new Error(`function ${name} not found`);
  const open = sql.indexOf('$$', start);
  const close = sql.indexOf('$$;', open + 2);
  if (open < 0 || close < 0) throw new Error(`function ${name} has no $$ body`);
  return sql.slice(open + 2, close);
}

function quoted(list: string): string[] {
  return [...list.matchAll(/'([a-z_0-9]+)'/g)].map((match) => match[1]);
}

/** The newest migration (by filename) that defines the function, which is the definition in force. */
function latestDefinition(name: string): { file: string; sql: string } {
  const files = readdirSync(MIGRATIONS)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .filter((file) => read(path.join(MIGRATIONS, file)).includes(`CREATE OR REPLACE FUNCTION public.${name}(`));
  if (files.length === 0) throw new Error(`no migration defines ${name}`);
  const file = files[files.length - 1];
  return { file, sql: read(path.join(MIGRATIONS, file)) };
}

const v3 = read(path.join(MIGRATIONS, CADENCE_V3));

describe('engagement-cadence-v3: resolver and database agree', () => {
  it('uses the same limits (ceiling, shloka, learning, other)', () => {
    const body = functionBody(v3, 'notification_cadence_limit');
    const sqlLimits = Object.fromEntries([...body.matchAll(/WHEN '([a-z]+)' THEN (\d+)/g)].map((m) => [m[1], Number(m[2])]));
    expect(sqlLimits).toEqual({
      ceiling: NOTIFICATION_CADENCE_POLICY.dailyCeiling,
      shloka: NOTIFICATION_CADENCE_POLICY.classLimits.shloka,
      learning: NOTIFICATION_CADENCE_POLICY.classLimits.learning,
      other: NOTIFICATION_CADENCE_POLICY.classLimits.other,
    });
  });

  it('fails closed on an unknown scope in SQL', () => {
    expect(functionBody(v3, 'notification_cadence_limit')).toMatch(/ELSE 0\s+END/);
  });

  it('uses the same policy version string', () => {
    const body = functionBody(v3, 'notification_cadence_policy_version');
    expect(body).toContain(`'${NOTIFICATION_CADENCE_POLICY.version}'`);
  });

  it('classifies the same person-initiated, shloka and learning types', () => {
    const body = functionBody(v3, 'notification_cadence_class');
    const arrays = [...body.matchAll(/ARRAY\[([^\]]*)\]/g)].map((match) => quoted(match[1]));
    expect(arrays).toHaveLength(2);
    expect(arrays[0].slice().sort()).toEqual([...PERSON_INITIATED_EVENT_TYPES].sort());
    expect(arrays[1].slice().sort()).toEqual([...LEARNING_EVENT_TYPES].sort());
    const shloka = [...body.matchAll(/canonical\.event_type = '([a-z_]+)' THEN 'shloka'/g)].map((match) => match[1]);
    expect(shloka).toEqual([...SHLOKA_EVENT_TYPES]);
  });

  it('treats unknown types as counted ("other") on both sides', () => {
    expect(functionBody(v3, 'notification_cadence_class')).toMatch(/ELSE 'other'\s+END/);
    expect(classifyNotificationCadence('a_type_nobody_has_heard_of')).toBe('other');
  });

  it('exempts exactly the types the database exempts (the definition in force, not an old copy)', () => {
    const { file, sql } = latestDefinition('notification_is_budget_exempt');
    const body = functionBody(sql, 'notification_is_budget_exempt');
    const array = body.match(/ARRAY\[([^\]]*)\]/);
    expect(array, `no ARRAY in ${file}`).not.toBeNull();
    expect(quoted(array![1]).sort()).toEqual([...BUDGET_EXEMPT_EVENT_TYPES].sort());
  });

  it('canonicalises aliases the same way (mood, sattvic, streak and quiz aliases)', () => {
    const { sql } = latestDefinition('canonical_notification_budget_type');
    const body = functionBody(sql, 'canonical_notification_budget_type');
    const pairs = [...body.matchAll(/WHEN '([a-z_]+)' THEN '([a-z_]+)'/g)].map((match) => [match[1], match[2]]);
    expect(pairs.length).toBeGreaterThanOrEqual(8);
    for (const [alias, canonical] of pairs) {
      expect(canonicalNotificationBudgetType(alias), alias).toBe(canonical);
    }
  });

  it('keeps every class the SQL test asserts equal to the resolver’s answer', () => {
    // `SELECT is(public.notification_cadence_class('type', NULL | 'key'), 'class', ...)`
    const assertions = [...read(SQL_TEST).matchAll(
      /SELECT is\(public\.notification_cadence_class\('([a-z_]+)', (NULL|'[^']*')\), '([a-z]+)'/g,
    )];
    expect(assertions.length).toBeGreaterThanOrEqual(10);
    for (const [, type, key, expected] of assertions) {
      const notificationKey = key === 'NULL' ? null : key.slice(1, -1);
      expect(classifyNotificationCadence(type, notificationKey), `${type} / ${key}`).toBe(expected);
    }
  });

  it('has no leftover literal five in the SQL the resolver is meant to match', () => {
    // The old rule hard-coded 5 in three functions. Every limit must now come from notification_cadence_limit.
    const rest = v3.slice(v3.indexOf('CREATE OR REPLACE FUNCTION public.enforce_notification_schedule_cadence('));
    expect(rest).not.toMatch(/>= 5\b|> 5\b|limit=5/);
    expect(rest).not.toContain('engagement-cadence-v2');
  });
});

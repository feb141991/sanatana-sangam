import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  EXPORT_MAX_ROWS_PER_TABLE,
  EXPORT_PAGE_SIZE,
  REDACTED_MARKER,
  USER_EXPORT_EXCLUDED,
  USER_EXPORT_ROUTE_TABLES,
  USER_EXPORT_SOURCES,
  readAllRows,
  readExportSources,
} from './user-data-export';

// Origin: 2026-11-12 privacy audit. The export read 10 of about 110 tables that carry a person's data, stopped at 1,000 rows per
// table (PostgREST's default) and cut two tables to 90 days, while the policy promised "an export of your account data".

const generated = readFileSync(join(process.cwd(), 'src/types/database.generated.ts'), 'utf8');
const publicStart = generated.indexOf('\n  public: {');
const tablesStart = generated.indexOf('Tables: {', publicStart);
const viewsStart = generated.indexOf('Views: {', tablesStart);
const tablesBlock = generated.slice(tablesStart, viewsStart);

const tables = new Map<string, string[]>();
for (const match of tablesBlock.matchAll(/\n {6}(\w+): \{\n {8}Row: \{([\s\S]*?)\n {8}\}/g)) {
  tables.set(match[1], [...match[2].matchAll(/\n {10}(\w+)\??:/g)].map((column) => column[1]));
}

const USER_REFERENCE_COLUMNS = [
  'user_id', 'owner_id', 'profile_id', 'author_id', 'created_by', 'requester_id', 'recipient_id', 'sender_id', 'blocker_id',
  'blocked_id', 'assigned_to', 'target_user_id', 'reporter_id', 'invited_user_id', 'invited_by', 'reviewed_by', 'member_id',
];

const exported = new Set(USER_EXPORT_SOURCES.map((source) => source.table));
const routeTables = new Set<string>(USER_EXPORT_ROUTE_TABLES);
const excluded = new Set(Object.keys(USER_EXPORT_EXCLUDED));

describe('the account data export covers every table that holds a person\'s data', () => {
  it('reads the table list from the generated types', () => {
    expect(tables.size).toBeGreaterThan(150);
    expect(tables.get('profiles')).toBeTruthy();
  });

  it('every table with a user reference is exported, handled by the route, or excluded with a reason', () => {
    const undecided = [...tables.entries()]
      .filter(([name, columns]) => columns.some((column) => USER_REFERENCE_COLUMNS.includes(column)))
      .map(([name]) => name)
      .filter((name) => !exported.has(name) && !routeTables.has(name) && !excluded.has(name) && name !== 'profiles');
    expect(undecided, `decide, in src/lib/user-data-export.ts, whether these are exported or excluded: ${undecided.join(', ')}`).toEqual([]);
  });

  it('no table is in two of the three lists', () => {
    for (const name of exported) {
      expect(routeTables.has(name), `${name} is exported twice`).toBe(false);
      expect(excluded.has(name), `${name} is exported and excluded`).toBe(false);
    }
    for (const name of routeTables) expect(excluded.has(name), `${name} is handled by the route and excluded`).toBe(false);
  });

  it('every listed table and column exists, so a rename cannot silently empty the export', () => {
    for (const source of USER_EXPORT_SOURCES) {
      const columns = tables.get(source.table);
      expect(columns, `table ${source.table}`).toBeTruthy();
      for (const column of [...source.userColumns, ...source.orderBy, ...(source.redact ?? [])]) {
        expect(columns, `${source.table}.${column}`).toContain(column);
      }
    }
    for (const name of [...routeTables, ...excluded]) expect(tables.has(name), `table ${name} no longer exists: remove it from the list`).toBe(true);
  });

  it('every exclusion has a reason a person can read', () => {
    for (const [name, reason] of Object.entries(USER_EXPORT_EXCLUDED)) expect(reason.length, name).toBeGreaterThan(15);
  });

  it('keeps secrets out of the file', () => {
    const redacted = USER_EXPORT_SOURCES.flatMap((source) => (source.redact ?? []).map((column) => `${source.table}.${column}`));
    for (const secret of ['push_tokens.token', 'calendar_subscriptions.token', 'kul_invitations.token', 'kul_family_link_invitations.token', 'birth_profiles.session_token', 'kuls.invite_code']) {
      expect(redacted).toContain(secret);
    }
  });
});

type Call = { table: string; filters: Array<[string, unknown]>; range: [number, number] | null };

function fakeAdmin(plan: (table: string, range: [number, number]) => { data: unknown[] | null; error: { code: string } | null }) {
  const calls: Call[] = [];
  const admin = {
    from(table: string) {
      const call: Call = { table, filters: [], range: null };
      calls.push(call);
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = (column: string, value: unknown) => { call.filters.push([column, value]); return chain; };
      chain.or = (expression: string) => { call.filters.push(['or', expression]); return chain; };
      chain.order = () => chain;
      chain.range = (from: number, to: number) => { call.range = [from, to]; return Promise.resolve(plan(table, [from, to])); };
      return chain;
    },
  };
  return { admin: admin as never, calls };
}

const rows = (count: number, extra: Record<string, unknown> = {}) => Array.from({ length: count }, (_, i) => ({ id: `r${i}`, ...extra }));

describe('readAllRows', () => {
  it('reads every page, not just the first 1,000 rows', async () => {
    const { admin, calls } = fakeAdmin((_, [from]) => ({ data: from === 0 ? rows(EXPORT_PAGE_SIZE) : rows(300), error: null }));
    const result = await readAllRows(admin, { table: 'posts', userColumns: ['author_id'], orderBy: ['id'] }, 'u1');
    expect(result.rows).toHaveLength(EXPORT_PAGE_SIZE + 300);
    expect(result.incomplete).toBeNull();
    expect(calls.map((call) => call.range)).toEqual([[0, 999], [1000, 1999]]);
    expect(calls[0].filters).toContainEqual(['author_id', 'u1']);
  });

  it('says so when a table is cut at the row limit', async () => {
    const { admin } = fakeAdmin(() => ({ data: rows(EXPORT_PAGE_SIZE), error: null }));
    const result = await readAllRows(admin, { table: 'posts', userColumns: ['author_id'], orderBy: ['id'] }, 'u1');
    expect(result.rows).toHaveLength(EXPORT_MAX_ROWS_PER_TABLE);
    expect(result.incomplete).toEqual({ table: 'posts', reason: 'row_limit_reached' });
  });

  it('reports a table it could not read instead of pretending it is empty', async () => {
    const { admin } = fakeAdmin(() => ({ data: null, error: { code: '57014' } }));
    const result = await readAllRows(admin, { table: 'posts', userColumns: ['author_id'], orderBy: ['id'] }, 'u1');
    expect(result).toEqual({ rows: [], incomplete: { table: 'posts', reason: 'read_failed' } });
  });

  it('matches either column when a table points at a person twice', async () => {
    const { admin, calls } = fakeAdmin(() => ({ data: [], error: null }));
    await readAllRows(admin, { table: 'mandali_connections', userColumns: ['requester_id', 'recipient_id'], orderBy: ['id'] }, 'u1');
    expect(calls[0].filters).toEqual([['or', 'requester_id.eq.u1,recipient_id.eq.u1']]);
  });

  it('replaces secret columns with a marker and leaves null as null', async () => {
    const { admin } = fakeAdmin(() => ({ data: [{ id: 1, token: 'abc' }, { id: 2, token: null }], error: null }));
    const result = await readAllRows(admin, { table: 'push_tokens', userColumns: ['user_id'], orderBy: ['id'], redact: ['token'] }, 'u1');
    expect(result.rows).toEqual([{ id: 1, token: REDACTED_MARKER }, { id: 2, token: null }]);
  });
});

describe('readExportSources', () => {
  it('returns only tables with rows, and lists the ones it could not read', async () => {
    const { admin } = fakeAdmin((table) => {
      if (table === 'journal_entries') return { data: rows(2), error: null };
      if (table === 'posts') return { data: null, error: { code: '42P01' } };
      return { data: [], error: null };
    });
    const result = await readExportSources(admin, 'u1');
    expect(Object.keys(result.data)).toEqual(['journal_entries']);
    expect(result.incomplete).toEqual([{ table: 'posts', reason: 'read_failed' }]);
    expect(result.tablesRead).toBe(USER_EXPORT_SOURCES.length);
  });
});

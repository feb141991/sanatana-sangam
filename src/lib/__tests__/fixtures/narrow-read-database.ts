/** Synthetic query adapter for reproducible transport-size/query-count comparisons, not live performance. */
export type FixtureRow = Record<string, unknown>;
export type QueryTrace = { table: string; columns: string; head: boolean; rows: number };
export function fixtureDatabase(tables: Record<string, FixtureRow[]>, errors: Set<string> = new Set()) {
  const traces: QueryTrace[] = [];
  class Query {
    columns = '*'; head = false; singleRow = false; count = false;
    rows: FixtureRow[];
    constructor(readonly table: string) { this.rows = [...(tables[table] ?? [])]; }
    select(columns: string, options?: { count?: string; head?: boolean }) { this.columns = columns; this.head = Boolean(options?.head); this.count = Boolean(options?.count); return this; }
    eq(key: string, value: unknown) { this.rows = this.rows.filter((row) => row[key] === value); return this; }
    gte(key: string, value: string) { this.rows = this.rows.filter((row) => String(row[key]) >= value); return this; }
    lte(key: string, value: string) { this.rows = this.rows.filter((row) => String(row[key]) <= value); return this; }
    order(key: string, options: { ascending: boolean }) { this.rows.sort((a,b) => String(a[key]).localeCompare(String(b[key])) * (options.ascending ? 1 : -1)); return this; }
    limit(limit: number) { this.rows = this.rows.slice(0, limit); return this; }
    single() { this.singleRow = true; return this; }
    maybeSingle() { return this.single(); }
    then<TResult1 = unknown, TResult2 = never>(resolve?: ((value: { data: unknown; error: unknown; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
      reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) {
      const rows = this.rows.map((row) => this.columns === '*' ? row : Object.fromEntries(this.columns.split(',').map((s) => s.trim()).map((column) => [column, row[column] ?? null])));
      traces.push({ table: this.table, columns: this.columns, head: this.head, rows: this.head ? 0 : rows.length });
      return Promise.resolve({ data: this.head ? null : this.singleRow ? rows[0] ?? null : rows,
        error: errors.has(this.table) ? { code: '57014' } : null, count: this.count ? this.rows.length : null }).then(resolve, reject);
    }
  }
  return { traces, from: (table: string) => new Query(table) };
}

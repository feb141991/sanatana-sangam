/**
 * A Supabase-js-shaped query builder backed by REAL Postgres, over `pg`.
 *
 * WHY THIS EXISTS
 * ----------------
 * The shadow harness applied the migration and ran hand-written SQL assertions
 * that reproduced pieces of `openBatch`, but it never called
 * `materializeOccurrencesForYears` itself. That is precisely why the mass-delete
 * defect (`.select('id')` then reading `.date`/`.locked_for_regeneration`/
 * `.manual_date_override`/`.final_date_source` off the result, all silently
 * `undefined`, every branch falling through to `.delete()`) survived a "19/19"
 * shadow run: nothing in that run ever executed the code path containing it.
 *
 * The unit-test fake client (`materialize-commit.test.ts`) does execute the real
 * code, but it is a JS Map standing in for a database -- it cannot enforce a
 * CHECK constraint, infer a conflict target from an index, or silently return
 * `undefined` for an unselected column the way real Postgres does. The
 * `ON CONFLICT` defect from the first shadow round only surfaced once real SQL
 * ran; the mass-delete defect is the same category of gap, just on the read
 * side rather than the write side.
 *
 * This shim closes that gap by giving the ACTUAL materialiser a client whose
 * `.select()` returns exactly the columns asked for -- so a bug that reads an
 * unselected column now reads `undefined` from a real query result, exactly as
 * production Supabase would return it, rather than from a fake that happened to
 * keep every field around regardless of what was selected.
 *
 * SCOPE: implements only the chains `materialize.ts` and
 * `materialisation-batch.ts` actually call -- `.from(table).select(cols)`,
 * `.eq()`, `.in()`, `.insert(rows).select()`, `.update(patch).eq()`,
 * `.upsert(row, { onConflict }).select().single()`, `.delete().eq()`. Not a
 * general PostgREST reimplementation, and not meant to be one.
 */
import pg from 'pg';

/**
 * Pins date/time type parsing to match what PostgREST actually sends over the
 * wire to a real Supabase client -- ISO strings, because JSON has no Date type.
 *
 * Without this, `node-postgres`'s default parsing turns `date` and
 * `timestamp(tz)` columns into JS `Date` objects. That silently broke the
 * materialiser's OWN existing-row lookup on first run: `occurrence_date`/`date`
 * columns came back as `Date` objects, template-literal identity keys built
 * from them (`${definitionId}:${row.date}`) stopped matching the plain
 * `YYYY-MM-DD` strings the engine computes, every existing row looked absent,
 * and the materialiser tried to INSERT rows that already existed -- a real
 * UNIQUE-constraint crash that had nothing to do with the code under test. A
 * shim whose types diverge from production produces exactly this kind of false
 * failure, which is worse than no shim: it looks like evidence.
 *
 * OIDs: 1082 date, 1114 timestamp without tz, 1184 timestamptz.
 */
for (const oid of [1082, 1114, 1184]) {
  pg.types.setTypeParser(oid, (val) => val);
}

function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

function formatVal(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

function buildInsert(table, rows) {
  const arr = Array.isArray(rows) ? rows : [rows];
  const cols = [...new Set(arr.flatMap(r => Object.keys(r)))];
  const values = [];
  const tuples = arr.map(row => {
    const placeholders = cols.map(c => {
      values.push(formatVal(row[c]));
      return `$${values.length}`;
    });
    return `(${placeholders.join(', ')})`;
  });
  const sql = `INSERT INTO ${quoteIdent(table)} (${cols.map(quoteIdent).join(', ')}) VALUES ${tuples.join(', ')}`;
  return { sql, values };
}

function buildUpdate(table, patch, wheres) {
  const cols = Object.keys(patch);
  const values = cols.map(c => formatVal(patch[c]));
  const set = cols.map((c, i) => `${quoteIdent(c)} = $${i + 1}`).join(', ');
  const whereSql = wheres
    .map((w, i) => `${quoteIdent(w.col)} = $${cols.length + i + 1}`)
    .join(' AND ');
  for (const w of wheres) values.push(formatVal(w.val));
  return { sql: `UPDATE ${quoteIdent(table)} SET ${set} WHERE ${whereSql}`, values };
}

/**
 * Builds a fresh, independent chain state so parallel `.from()` calls on the
 * same client (materialize.ts does not issue any, but nothing should assume
 * that) never share mutable state.
 */
function makeQuery(pool, table) {
  const state = { wheres: [], inClauses: [], selectCols: null };

  const exec = async (sql, values) => {
    try {
      const res = await pool.query(sql, values);
      return { data: res.rows, error: null };
    } catch (err) {
      return { data: null, error: { message: err.message, code: err.code } };
    }
  };

  const buildSelectSql = () => {
    const cols = state.selectCols ?? '*';
    let sql = `SELECT ${cols === '*' ? '*' : cols.split(',').map(c => quoteIdent(c.trim())).join(', ')} FROM ${quoteIdent(table)}`;
    const values = [];
    const clauses = [];
    for (const w of state.wheres) {
      values.push(w.val);
      clauses.push(`${quoteIdent(w.col)} = $${values.length}`);
    }
    for (const inClause of state.inClauses) {
      const placeholders = inClause.vals.map(v => {
        values.push(v);
        return `$${values.length}`;
      });
      clauses.push(`${quoteIdent(inClause.col)} IN (${placeholders.join(', ')})`);
    }
    if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
    return { sql, values };
  };

  const builder = {
    select(cols) {
      state.selectCols = cols;
      return builder;
    },
    eq(col, val) {
      state.wheres.push({ col, val });
      return builder;
    },
    in(col, vals) {
      state.inClauses.push({ col, vals });
      return builder;
    },
    single() {
      return builder.then(({ data, error }) => {
        if (error) return { data: null, error };
        if (!data || data.length === 0) {
          return { data: null, error: { message: 'no rows', code: 'PGRST116' } };
        }
        return { data: data[0], error: null };
      });
    },
    insert(rows) {
      const { sql, values } = buildInsert(table, rows);
      let returning = '';
      return {
        select(cols) {
          returning = ` RETURNING ${cols && cols !== '*' ? cols.split(',').map(c => quoteIdent(c.trim())).join(', ') : '*'}`;
          return exec(sql + returning, values);
        },
        then(resolve) {
          return exec(sql, values).then(resolve);
        },
      };
    },
    update(patch) {
      return {
        eq(col, val) {
          const { sql, values } = buildUpdate(table, patch, [...state.wheres, { col, val }]);
          return exec(sql, values);
        },
        in(col, vals) {
          const columns = Object.keys(patch);
          const values = columns.map(column => formatVal(patch[column]));
          const set = columns.map((column, index) => `${quoteIdent(column)} = $${index + 1}`).join(', ');
          const placeholders = vals.map(value => {
            values.push(formatVal(value));
            return `$${values.length}`;
          });
          const sql = `UPDATE ${quoteIdent(table)} SET ${set} WHERE ${quoteIdent(col)} IN (${placeholders.join(', ')})`;
          return exec(sql, values);
        },
      };
    },
    upsert(rows, opts = {}) {
      const arr = Array.isArray(rows) ? rows : [rows];
      const { sql: insertSql, values } = buildInsert(table, arr);
      const conflictCols = (opts.onConflict ?? '').split(',').map(c => c.trim()).filter(Boolean);
      let sql = insertSql;
      if (conflictCols.length) {
        const cols = [...new Set(arr.flatMap(r => Object.keys(r)))];
        const updateSet = cols
          .filter(c => !conflictCols.includes(c))
          .map(c => `${quoteIdent(c)} = EXCLUDED.${quoteIdent(c)}`)
          .join(', ');
        sql += ` ON CONFLICT (${conflictCols.map(quoteIdent).join(', ')}) DO UPDATE SET ${updateSet}`;
      }
      return {
        select(cols) {
          const returning = ` RETURNING ${cols && cols !== '*' ? cols.split(',').map(c => quoteIdent(c.trim())).join(', ') : '*'}`;
          return {
            single: async () => {
              const { data, error } = await exec(sql + returning, values);
              if (error) return { data: null, error };
              return { data: data[0], error: null };
            },
            then(resolve, reject) {
              return exec(sql + returning, values).then(resolve, reject);
            },
          };
        },
        then(resolve, reject) {
          return exec(sql, values).then(resolve, reject);
        },
      };
    },
    delete() {
      // Used only as a bare `.from(table).delete().eq(col, val)` -- no prior
      // `.eq()` in the chain -- so this deliberately does not try to combine
      // with `state.wheres`. Combining them added index arithmetic that could
      // silently miscount if delete() were ever called after a filter, which is
      // exactly the kind of subtle-off-by-one this shim exists to avoid
      // introducing into a harness meant to catch subtle bugs.
      return {
        eq(col, val) {
          return exec(`DELETE FROM ${quoteIdent(table)} WHERE ${quoteIdent(col)} = $1`, [val]);
        },
      };
    },
    then(resolve, reject) {
      const { sql, values } = buildSelectSql();
      return exec(sql, values).then(resolve, reject);
    },
  };

  return builder;
}

export function createShadowSupabaseClient(connectionString) {
  const pool = new pg.Pool({ connectionString });
  return {
    from(table) {
      return makeQuery(pool, table);
    },
    async end() {
      await pool.end();
    },
  };
}

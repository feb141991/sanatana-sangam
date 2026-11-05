import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The e-mail consent history leaves with the account. Every table that holds it also cascades from auth.users, so this guards the
 * explicit list in the admin account-delete route, not the data: a new e-mail consent table with an account column must be added to
 * the route (or exempted here with its reason), the same contract the Sanskara tables have.
 */
const MIGRATIONS = join(process.cwd(), "supabase", "migrations");
const ROUTE = join(process.cwd(), "src", "app", "api", "admin", "users", "[userId]", "route.ts");

const EXEMPT: Record<string, string> = {};

function accountLinkedConsentTables(): Array<{ table: string; column: string }> {
  const found = new Map<string, string>();
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql") && f.includes("email_consent"))) {
    const sql = readFileSync(join(MIGRATIONS, file), "utf8");
    const pattern = /create table public\.(email_consent_\w+)\s*\(([\s\S]*?)\n\);/g;
    for (const match of sql.matchAll(pattern)) {
      const column = /(\w+)\s+uuid[^,\n]*references auth\.users/.exec(match[2]);
      if (column) found.set(match[1], column[1]);
    }
  }
  return [...found].map(([table, column]) => ({ table, column })).sort((a, b) => a.table.localeCompare(b.table));
}

describe("E-mail consent tables and the admin account-delete list", () => {
  const route = readFileSync(ROUTE, "utf8");
  const tables = accountLinkedConsentTables();

  it("finds the account-linked table (a scan that finds nothing would pass vacuously)", () => {
    expect(tables.map((t) => t.table)).toContain("email_consent_events");
    expect(tables.find((t) => t.table === "email_consent_events")?.column).toBe("user_id");
  });

  for (const { table, column } of tables) {
    if (EXEMPT[table]) continue;
    it(`${table} is deleted by ${column} in the admin route`, () => {
      expect(route).toContain(`.from("${table}").delete().eq("${column}", userId)`);
    });
  }

  it("the migration keeps the cascade from auth.users (the route is a second line, not the only one)", () => {
    const sql = readFileSync(join(MIGRATIONS, "20261106090000_email_consent_ledger.sql"), "utf8");
    expect(sql).toMatch(/user_id uuid not null references auth\.users\(id\) on delete cascade/);
  });
});

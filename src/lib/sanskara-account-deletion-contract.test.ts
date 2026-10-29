import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contract R5 (docs/SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md): the admin account-delete list covers every Sanskara table
 * that is linked to an account. Each of these tables also cascades from auth.users, so this guards the explicit list, not
 * the data: a new table with an account column must be added to the route or exempted here with its reason.
 */
const MIGRATIONS = join(process.cwd(), "supabase", "migrations");
const ROUTE = join(process.cwd(), "src", "app", "api", "admin", "users", "[userId]", "route.ts");

// Tables that reference auth.users but are deliberately NOT deleted by account in the admin route.
const EXEMPT: Record<string, string> = {
  sanskara_records:
    "created_by is ON DELETE SET NULL: a dependent's records outlive the account that created them and are removed through their subject",
};

function accountLinkedSanskaraTables(): string[] {
  const tables = new Set<string>();
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql") && f.includes("sanskara"))) {
    const sql = readFileSync(join(MIGRATIONS, file), "utf8");
    const pattern = /create table public\.(sanskara_\w+)\s*\(([\s\S]*?)\n\);/g;
    for (const match of sql.matchAll(pattern)) {
      if (/references auth\.users/.test(match[2])) tables.add(match[1]);
    }
  }
  return [...tables].sort();
}

describe("Sanskara tables and the admin account-delete list", () => {
  const route = readFileSync(ROUTE, "utf8");
  const tables = accountLinkedSanskaraTables();

  it("finds the account-linked tables (a scan that finds nothing would pass vacuously)", () => {
    expect(tables).toEqual(expect.arrayContaining([
      "sanskara_audit", "sanskara_claims", "sanskara_grants", "sanskara_request_log",
      "sanskara_subject_managers", "sanskara_subjects", "sanskara_subscriptions",
    ]));
    expect(tables.length).toBeGreaterThanOrEqual(8);
  });

  it("lists every account-linked table, or exempts it with a reason", () => {
    const missing = tables.filter((table) => !route.includes(`from("${table}")`) && !(table in EXEMPT));
    expect(missing, `add these to the admin delete list or to EXEMPT with a reason: ${missing.join(", ")}`).toEqual([]);
  });

  it("exempts only tables that exist and really are account-linked", () => {
    for (const table of Object.keys(EXEMPT)) expect(tables).toContain(table);
  });
});

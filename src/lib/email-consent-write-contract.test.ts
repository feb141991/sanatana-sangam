import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The e-mail consent history is only complete if every server change goes through set_email_consent (which records its path, wording and
 * region). A route that writes marketing_consent, email_newsletter or email_festivals straight to profiles would still be caught by the
 * database trigger, but would be recorded without that context. So: no code under src/ may set those columns directly.
 *
 * Reads (select lists, comparisons, audience filters) are fine. Only an object key assigning one of the columns is a write.
 */
const SRC = join(process.cwd(), "src");
const COLUMN_KEY = /(^|[^\w.])(marketing_consent|email_newsletter|email_festivals)\s*:\s*(?!\s*(boolean|string)\b)/;

// Files that legitimately mention the columns as object keys without writing them to the database.
const ALLOWED: Record<string, string> = {
  "src/types/database.generated.ts": "generated and hand-extended types describe the columns",
  "src/types/database.ts": "type declarations",
};

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      files(path, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) {
      out.push(path);
    }
  }
  return out;
}

describe("E-mail consent columns are only ever written through set_email_consent", () => {
  const scanned = files(SRC).map((p) => ({ path: relative(process.cwd(), p), text: readFileSync(p, "utf8") }));

  it("scans a meaningful number of files (a scan that finds nothing would pass vacuously)", () => {
    expect(scanned.length).toBeGreaterThan(200);
    expect(scanned.some((f) => f.path.endsWith("email-consent.ts"))).toBe(true);
  });

  it("finds no direct assignment of a consent column outside types and mocks", () => {
    const offenders: string[] = [];
    for (const file of scanned) {
      if (ALLOWED[file.path] || file.path.includes("/mocks/")) continue;
      file.text.split("\n").forEach((line, index) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        if (COLUMN_KEY.test(line)) offenders.push(`${file.path}:${index + 1}: ${line.trim().slice(0, 100)}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it("the unsubscribe route goes through the recorded function", () => {
    const route = scanned.find((f) => f.path === "src/app/api/unsubscribe/route.ts")!.text;
    expect(route).toContain("setEmailConsent(");
    expect(route).not.toMatch(/\.update\(/);
  });

  it("the Native preferences route goes through the recorded function and never takes the account from the body", () => {
    const route = scanned.find((f) => f.path === "src/app/api/native/email-preferences/route.ts")!.text;
    expect(route).toContain("setEmailConsent(");
    expect(route).toContain("userId: auth.user.id");
    expect(route).not.toMatch(/input\.(userId|user_id)/);
  });
});

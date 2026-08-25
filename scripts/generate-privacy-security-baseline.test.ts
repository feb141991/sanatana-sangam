import assert from "node:assert/strict";
import test from "node:test";
import { classifyAccessProbe, classifyTableProbe, extractProfileColumns } from "./generate-privacy-security-baseline";

test("missing anonymous credentials never report secured", () => {
  assert.equal(classifyAccessProbe({ adminCount: 15, anonCount: null, anonError: null, anonCredentialsAvailable: false }).state, "UNKNOWN");
});

test("unexpected anonymous probe errors never report secured", () => {
  assert.equal(classifyAccessProbe({ adminCount: 15, anonCount: null, anonError: { code: "PGRST000", message: "network unavailable" }, anonCredentialsAvailable: true }).state, "ERROR");
});

test("an explicit permission denial reports secured", () => {
  assert.equal(classifyAccessProbe({ adminCount: 15, anonCount: null, anonError: { code: "42501", message: "permission denied" }, anonCredentialsAvailable: true }).state, "SECURED");
});

test("visible anonymous rows report exposed", () => {
  assert.equal(classifyAccessProbe({ adminCount: 15, anonCount: 15, anonError: null, anonCredentialsAvailable: true }).state, "EXPOSED");
});

test("table probe distinguishes failure classes", () => {
  assert.equal(classifyTableProbe(null, null, false).state, "UNKNOWN");
  assert.equal(classifyTableProbe(null, { code: "42P01", message: "does not exist" }, true).state, "NOT_FOUND");
  assert.equal(classifyTableProbe(null, { code: "42501", message: "permission denied" }, true).state, "PERMISSION_DENIED");
  assert.equal(classifyTableProbe(null, { code: "PGRST000", message: "timeout" }, true).state, "ERROR");
});

test("profile columns are parsed from generated types", () => {
  const source = `
      profiles: {
        Row: {
          id: string;
          username: string;
          date_of_birth: string | null;
          is_admin: boolean;
        };
        Insert: {};
      };
  `;
  assert.deepEqual(extractProfileColumns(source), [
    { name: "date_of_birth", type: "string | null", classification: "sensitive_candidate" },
    { name: "id", type: "string", classification: "unclassified" },
    { name: "is_admin", type: "boolean", classification: "internal_candidate" },
    { name: "username", type: "string", classification: "public_candidate" },
  ]);
});

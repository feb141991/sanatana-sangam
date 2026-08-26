import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCategories,
  classifyAccessProbe,
  classifyTableProbe,
  extractProfileColumns,
  isRuntimeEvidencePath,
  type SourceFile,
} from "./generate-privacy-security-baseline";

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

test("audit prose, audit scripts, lockfiles and generated outputs cannot become runtime evidence", () => {
  assert.equal(isRuntimeEvidencePath("src/components/privacy/WebConsentManager.tsx"), true);
  assert.equal(isRuntimeEvidencePath("public/OneSignalSDKWorker.js"), true);
  assert.equal(isRuntimeEvidencePath("docs/compliance/README.md"), false);
  assert.equal(isRuntimeEvidencePath("scripts/generate-privacy-security-baseline.ts"), false);
  assert.equal(isRuntimeEvidencePath("package-lock.json"), false);
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

test("buildCategories generates 14 structured categories with valid audit properties", () => {
  const sampleFiles: SourceFile[] = [
    {
      repository: "backend",
      relativePath: "src/app/api/auth/route.ts",
      content: "/api/auth/login auth.users google-auth-library",
    },
    {
      repository: "backend",
      relativePath: "src/app/api/profile/route.ts",
      content: "tradition sampradaya gotra devata consent_religious_data",
    },
    {
      repository: "backend",
      relativePath: "src/app/api/jyotish/chart/route.ts",
      content: "date_of_birth birth_time birth_place birth_lat birth_lng birth_profiles",
    },
  ];

  const categories = buildCategories(sampleFiles);
  assert.equal(categories.length, 14);

  const ids = categories.map((c) => c.categoryId);
  assert.deepEqual(ids, [
    "CAT-01-AUTH",
    "CAT-02-RELIGIOUS",
    "CAT-03-BIRTH-JYOTISH",
    "CAT-04-LOCATION",
    "CAT-05-MOOD-SANKALPA",
    "CAT-06-PRACTICE-PROGRESS",
    "CAT-07-COMMUNITY-MANDALI",
    "CAT-08-AI-PRAMANA",
    "CAT-09-NOTIFICATIONS",
    "CAT-10-ANALYTICS-ADS",
    "CAT-11-MEDIA-UPLOADS",
    "CAT-12-PAYMENTS",
    "CAT-13-GUEST-DATA",
    "CAT-14-LOGS-ADMIN",
  ]);

  for (const category of categories) {
    assert.ok(category.categoryName.length > 0);
    assert.ok(category.collectionSurface.length > 0);
    assert.ok(category.apiRouteAndAuth.length > 0);
    assert.ok(category.storageTarget.length > 0);
    assert.ok(category.fieldNames.length > 0);
    assert.ok(category.purposeVisibleInCode.length > 0);
    assert.ok(category.recipientsAndVendors.length > 0);
    assert.ok(category.deletionPath.length > 0);
    assert.ok(category.retentionRule.length > 0);
  }
});

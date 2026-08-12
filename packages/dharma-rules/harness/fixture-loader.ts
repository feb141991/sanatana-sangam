/**
 * fixture-loader.ts
 *
 * Loads and validates golden and snapshot fixtures.
 *
 * GOLDEN FIXTURES LIVE IN THE DATABASE (`public.golden_fixtures`), NOT FILES.
 * They moved off git-tracked JSON so the admin governance GUI
 * (/admin/calendar-governance) can read and update approval state directly --
 * a council decision no longer requires a file edit + commit. `loadGoldenFixtures`
 * is therefore async and requires SUPABASE_SERVICE_ROLE_KEY (the table is RLS-
 * locked to service-role only, matching observance_materialisation_batches'
 * posture -- an anon-key read would silently return zero rows, not an error,
 * which is exactly the kind of failure that must be loud here).
 *
 * Snapshot fixtures are UNCHANGED -- still file-based. They are behaviour
 * tripwires, not sourced correctness claims, so there is no council-approval
 * workflow that would benefit from a DB-backed GUI the way golden fixtures do.
 *
 * Key invariants enforced here (not just in tests):
 * - Every golden_fixtures row MUST have a `source` block with tier 1-4. Fail if missing.
 * - A file in snapshot/ MUST NOT have a `source` block.
 * - Schema validation runs against the published JSON Schema at load time, for
 *   both the DB rows and the snapshot files -- a malformed row written by the
 *   admin GUI must fail exactly as loudly as a malformed file used to.
 * - Canonical logical fixture identity is computed for governance checks.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import Ajv from 'ajv';
import { createClient } from '@supabase/supabase-js';
import { config as loadDotenv } from 'dotenv';

// Repo root's .env.local carries NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// regardless of whether this module is loaded from the Next app, a `tsx` script,
// or vitest in this package -- none of those three otherwise agree on env loading.
loadDotenv({ path: resolve(__dirname, '../../../.env.local') });

// ── Path constants ──────────────────────────────────────────────────────────

const FIXTURES_ROOT = resolve(__dirname, '../__fixtures__');
export const SNAPSHOT_DIR  = join(FIXTURES_ROOT, 'snapshot');
const INVALID_DIR          = join(FIXTURES_ROOT, 'fixtures-invalid');
const SCHEMAS_DIR          = join(FIXTURES_ROOT, 'schemas');

// ── DB client for golden_fixtures ───────────────────────────────────────────

function goldenFixturesClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'loadGoldenFixtures() requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ' +
      'golden_fixtures is RLS-locked to service-role only -- there is no anon-key fallback, ' +
      'because that would silently return an empty fixture set instead of failing loudly.',
    );
  }
  return createClient(url, key);
}

// ── Schema loader ───────────────────────────────────────────────────────────

const ajv = new Ajv({ allErrors: true, strict: false });

function loadSchema(name: string) {
  const raw = readFileSync(join(SCHEMAS_DIR, name), 'utf-8');
  return JSON.parse(raw);
}

export const goldenSchema   = loadSchema('golden.schema.json');
export const snapshotSchema = loadSchema('snapshot.schema.json');

const validateGolden   = ajv.compile(goldenSchema);
const validateSnapshot = ajv.compile(snapshotSchema);

// ── Types ───────────────────────────────────────────────────────────────────

export interface Location {
  label: string;
  lat: number;
  lon: number;
  tz: string;
}

export interface Profile {
  calendar: string;
  tradition: string;
  variantKey?: string;
}

export interface GoldenSource {
  tier: 1 | 2 | 3 | 4;
  ref: string;
  citation: string;
  verifiedBy: string;
  verifiedOn: string;
}

export interface GoldenExpected {
  civilDate: string | null;
  monthLabel?: string | null;
  windows?: Record<string, { startLocal: string; endLocal: string }> | null;
  reasonCodes?: string[] | null;
  alternativeCount?: number | null;
}

export interface GoldenFixture {
  caseId: string;
  festivalId: string;
  year: number;
  location: Location;
  profile: Profile;
  expected: GoldenExpected | null;
  tolerance: { windowMinutes: number };
  source: GoldenSource;
  reasoning: string;
  approved: boolean;
  _filePath: string; // "db:golden_fixtures" for DB-backed golden rows; a real path for snapshot files
}

export interface SnapshotCaptured {
  civilDate: string | null;
  slug: string;
  recurring?: boolean | null;
}

export interface SnapshotFixture {
  caseId: string;
  festivalId: string;
  year: number;
  location: Location;
  profile: Profile;
  capturedAt: string;
  engineVersion: string;
  ruleEngineVersion: string;
  captured: SnapshotCaptured;
  approved: false; // always false by schema requirement
  _comment?: string;
  _filePath: string; // injected by loader
}

// ── Governance Helpers & Logical Identity ───────────────────────────────────

export function isApprovedGolden(f: GoldenFixture): boolean {
  return (
    f.approved === true &&
    typeof f.expected?.civilDate === 'string' &&
    f.expected.civilDate.length > 0 &&
    f.source != null &&
    f.source.tier >= 1 &&
    f.source.tier <= 4
  );
}

/**
 * Computes a canonical logical fixture key for governance and overlap analysis.
 * Format: festivalId::year::lat,lon@tz::calendar:tradition
 * Strips namespace prefixes like `snap__` and normalizes text.
 */
export function getCanonicalFixtureKey(fixture: {
  festivalId: string;
  year: number;
  location: Location;
  profile: Profile;
}): string {
  const fest = fixture.festivalId.toLowerCase().trim();
  const yr = fixture.year;
  const latStr = Number(fixture.location.lat).toFixed(4);
  const lonStr = Number(fixture.location.lon).toFixed(4);
  const tz = fixture.location.tz.toLowerCase().trim();
  const cal = fixture.profile.calendar.toLowerCase().trim();
  const trad = fixture.profile.tradition.toLowerCase().trim();
  const vk = (fixture.profile.variantKey ?? '').toLowerCase().trim();

  return `${fest}::${yr}::${latStr},${lonStr}@${tz}::${cal}:${trad}${vk ? `:${vk}` : ''}`;
}

export interface LogicalIdentityAnalysis {
  duplicateGoldenKeys: string[];
  duplicateSnapshotKeys: string[];
  approvedGoldenSnapshotOverlapKeys: string[];
  pendingIntakeSnapshotOverlapKeys: string[];
}

export function analyzeLogicalFixtureIdentity(
  goldenFixtures: GoldenFixture[],
  snapshotFixtures: SnapshotFixture[],
): LogicalIdentityAnalysis {
  const goldenKeyMap = new Map<string, GoldenFixture[]>();
  const snapshotKeyMap = new Map<string, SnapshotFixture[]>();

  for (const g of goldenFixtures) {
    const key = getCanonicalFixtureKey(g);
    const list = goldenKeyMap.get(key) ?? [];
    list.push(g);
    goldenKeyMap.set(key, list);
  }

  for (const s of snapshotFixtures) {
    const key = getCanonicalFixtureKey(s);
    const list = snapshotKeyMap.get(key) ?? [];
    list.push(s);
    snapshotKeyMap.set(key, list);
  }

  const duplicateGoldenKeys: string[] = [];
  for (const [key, list] of goldenKeyMap.entries()) {
    if (list.length > 1) duplicateGoldenKeys.push(key);
  }

  const duplicateSnapshotKeys: string[] = [];
  for (const [key, list] of snapshotKeyMap.entries()) {
    if (list.length > 1) duplicateSnapshotKeys.push(key);
  }

  const approvedGoldenSnapshotOverlapKeys: string[] = [];
  const pendingIntakeSnapshotOverlapKeys: string[] = [];

  for (const [key] of snapshotKeyMap.entries()) {
    const goldenList = goldenKeyMap.get(key);
    if (!goldenList || goldenList.length === 0) continue;

    const hasApprovedGolden = goldenList.some(isApprovedGolden);
    const hasPendingGolden  = goldenList.some(g => !isApprovedGolden(g));

    if (hasApprovedGolden) {
      approvedGoldenSnapshotOverlapKeys.push(key);
    }
    if (hasPendingGolden) {
      pendingIntakeSnapshotOverlapKeys.push(key);
    }
  }

  return {
    duplicateGoldenKeys,
    duplicateSnapshotKeys,
    approvedGoldenSnapshotOverlapKeys,
    pendingIntakeSnapshotOverlapKeys,
  };
}

// ── Validation errors ────────────────────────────────────────────────────────

export class FixtureValidationError extends Error {
  constructor(public readonly filePath: string, public readonly errors: object[]) {
    super(`Fixture validation failed: ${filePath}\n${JSON.stringify(errors, null, 2)}`);
    this.name = 'FixtureValidationError';
  }
}

export class FixtureDirectoryError extends Error {
  constructor(message: string, public readonly filePath: string) {
    super(`${message}: ${filePath}`);
    this.name = 'FixtureDirectoryError';
  }
}

// ── Loader helpers ───────────────────────────────────────────────────────────

function walkJsonFiles(dir: string): string[] {
  try {
    const entries = readdirSync(dir);
    return entries
      .filter(f => extname(f) === '.json')
      .map(f => join(dir, f));
  } catch {
    return [];
  }
}

function parseJson(filePath: string): unknown {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${filePath}: ${String(e)}`);
  }
}

/**
 * Load and validate all golden fixtures from `public.golden_fixtures`.
 *
 * Async because it's a DB read, unlike every other loader in this file.
 * Every row is put back through the exact same golden.schema.json validation
 * a file used to get, so a malformed row (e.g. written by the admin GUI) is
 * caught here rather than surfacing as a confusing engine-comparison failure
 * three functions later.
 */
export async function loadGoldenFixtures(): Promise<GoldenFixture[]> {
  const supabase = goldenFixturesClient();
  const { data, error } = await supabase
    .from('golden_fixtures')
    .select('case_id, festival_id, year, location, profile, expected, tolerance, source, reasoning, approved');

  if (error) {
    throw new Error(`Failed to load golden_fixtures from Supabase: ${error.message}`);
  }

  return (data ?? []).map(row => {
    const raw: Record<string, unknown> = {
      caseId: row.case_id,
      festivalId: row.festival_id,
      year: row.year,
      location: row.location,
      profile: row.profile,
      expected: row.expected,
      tolerance: row.tolerance,
      source: row.source,
      reasoning: row.reasoning,
      approved: row.approved,
    };

    const virtualPath = `db:golden_fixtures#${row.case_id}`;

    const valid = validateGolden(raw);
    if (!valid) {
      throw new FixtureValidationError(virtualPath, validateGolden.errors ?? []);
    }

    if (!('source' in raw) || raw['source'] == null) {
      throw new FixtureDirectoryError(
        'Golden fixture missing required `source` block — every golden_fixtures row must cite a Tier 1-4 source',
        virtualPath,
      );
    }

    return { ...(raw as unknown as GoldenFixture), _filePath: virtualPath };
  });
}

/**
 * Load and validate all snapshot fixtures.
 */
export function loadSnapshotFixtures(): SnapshotFixture[] {
  const files = walkJsonFiles(SNAPSHOT_DIR);
  return files.map(filePath => {
    const raw = parseJson(filePath) as Record<string, unknown>;

    if ('source' in raw && raw['source'] != null) {
      throw new FixtureDirectoryError(
        'Snapshot fixture must NOT have a `source` block — it is a snapshot of behaviour, not a correctness claim. Move to golden/ if it has a Tier 1-4 citation.',
        filePath,
      );
    }

    const valid = validateSnapshot(raw);
    if (!valid) {
      throw new FixtureValidationError(filePath, validateSnapshot.errors ?? []);
    }

    return { ...(raw as unknown as SnapshotFixture), _filePath: filePath };
  });
}

/**
 * Load the deliberately malformed fixtures for the validator's self-test.
 */
export function loadInvalidFixtures(): Array<{ filePath: string; raw: unknown }> {
  return walkJsonFiles(INVALID_DIR).map(filePath => ({
    filePath,
    raw: parseJson(filePath),
  }));
}

/**
 * Validate a raw object against the golden schema and return errors (or null).
 */
export function validateAgainstGoldenSchema(raw: unknown): object[] | null {
  const valid = validateGolden(raw);
  return valid ? null : (validateGolden.errors ?? []);
}

/**
 * Validate a raw object against the snapshot schema and return errors (or null).
 */
export function validateAgainstSnapshotSchema(raw: unknown): object[] | null {
  const valid = validateSnapshot(raw);
  return valid ? null : (validateSnapshot.errors ?? []);
}

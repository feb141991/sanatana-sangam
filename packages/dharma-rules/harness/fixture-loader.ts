/**
 * fixture-loader.ts
 *
 * Loads and validates golden and snapshot fixtures.
 *
 * Key invariants enforced here (not just in tests):
 * - A file in golden/ MUST have a `source` block with tier 1-4. Fail if missing.
 * - A file in snapshot/ MUST NOT have a `source` block.
 * - The two directories must never mix types (detected by schema + structural check).
 * - Schema validation runs against the published JSON Schema at load time.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import Ajv from 'ajv';

// ── Path constants ──────────────────────────────────────────────────────────

const FIXTURES_ROOT = resolve(__dirname, '../__fixtures__');
export const GOLDEN_DIR    = join(FIXTURES_ROOT, 'golden');
export const SNAPSHOT_DIR  = join(FIXTURES_ROOT, 'snapshot');
const INVALID_DIR          = join(FIXTURES_ROOT, 'fixtures-invalid');
const SCHEMAS_DIR          = join(FIXTURES_ROOT, 'schemas');

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
  _filePath: string; // injected by loader, not in schema
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
    return []; // directory doesn't exist yet — that's fine
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
 * Load and validate all golden fixtures.
 * HARD FAIL if:
 * - a file fails schema validation
 * - a file is missing a `source` block (structural check beyond schema)
 * - a file has a source.tier of 5 or 6 (caught by schema enum)
 */
export function loadGoldenFixtures(): GoldenFixture[] {
  const files = walkJsonFiles(GOLDEN_DIR);
  return files.map(filePath => {
    const raw = parseJson(filePath) as Record<string, unknown>;

    // Schema validates: source block required, tier must be 1-4, etc.
    const valid = validateGolden(raw);
    if (!valid) {
      throw new FixtureValidationError(filePath, validateGolden.errors ?? []);
    }

    // Belt-and-suspenders: `source` must exist (schema requires it, but double-check)
    if (!('source' in raw) || raw['source'] == null) {
      throw new FixtureDirectoryError(
        'Golden fixture missing required `source` block — move to snapshot/ or add a Tier 1-4 source',
        filePath,
      );
    }

    return { ...(raw as unknown as GoldenFixture), _filePath: filePath };
  });
}

/**
 * Load and validate all snapshot fixtures.
 * HARD FAIL if:
 * - a file fails schema validation
 * - a file has a `source` block (snapshots must NOT claim correctness)
 */
export function loadSnapshotFixtures(): SnapshotFixture[] {
  const files = walkJsonFiles(SNAPSHOT_DIR);
  return files.map(filePath => {
    const raw = parseJson(filePath) as Record<string, unknown>;

    // Guard: snapshot files must NOT have a source block
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
 * Returns raw JSON without schema validation (so the test can assert it fails).
 */
export function loadInvalidFixtures(): Array<{ filePath: string; raw: unknown }> {
  return walkJsonFiles(INVALID_DIR).map(filePath => ({
    filePath,
    raw: parseJson(filePath),
  }));
}

/**
 * Validate a raw object against the golden schema and return errors (or null).
 * Exported for use in generator scripts.
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

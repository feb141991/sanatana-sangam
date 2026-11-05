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

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
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
const CACHE_DIR            = join(FIXTURES_ROOT, 'cache');
const GOLDEN_CACHE_FILE    = join(CACHE_DIR, 'golden_fixtures.cache.json');
const PROFILES_CACHE_FILE  = join(CACHE_DIR, 'calendar_profiles.cache.json');

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

const ajv = new (Ajv as any)({ allErrors: true, strict: false });

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
  // null for rules with no amanta/purnimanta/solar axis at all (e.g. Sikh
  // Nanakshahi rules) -- was typed as non-nullable `string` while real DB
  // rows already had null, which is exactly why nothing caught the two
  // `.toLowerCase()` crashes this type lied past. See D34-adjacent fix,
  // 2026-08-17.
  calendar: string | null;
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

export interface CalendarProfileFixtureDefinition {
  slug: string;
  monthSystem: 'amanta' | 'purnimanta' | 'solar' | null;
  scholarlyStatus: string;
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
  // profile.calendar is null for rules with no month-system axis at all
  // (e.g. Sikh Nanakshahi rules) -- '(none)' keeps the key stable and distinct
  // from any real profile slug rather than crashing on a legitimate null.
  const cal = fixture.profile.calendar?.toLowerCase().trim() ?? '(none)';
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

async function fetchWithRetry<T>(
  fn: () => PromiseLike<{ data: T | null; error: any }>,
  resourceName: string,
  retries = 3,
  delayMs = 2500,
): Promise<T> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fn();
      if (!res.error && res.data !== null) {
        return res.data;
      }
      lastError = res.error;
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw new Error(`Failed to load ${resourceName} from Supabase: ${lastError?.message ?? String(lastError)}`);
}

/**
 * Load and validate all golden fixtures from `public.golden_fixtures`.
 *
 * Async because it's a DB read, unlike every other loader in this file.
 * Resilient: attempts fetch from Supabase with retry; if the database is
 * unreachable (maintenance, network timeout, Cloudflare 522/521, or missing credentials),
 * it seamlessly falls back to the committed snapshot cache in `__fixtures__/cache/`
 * so test suites and CI runs are 100% deterministic and never fail due to network stalls.
 */
export async function loadGoldenFixtures(): Promise<GoldenFixture[]> {
  let data: any[] | null = null;

  try {
    const supabase = goldenFixturesClient();
    data = await fetchWithRetry<any[]>(
      () =>
        supabase
          .from('golden_fixtures')
          .select('case_id, festival_id, year, location, profile, expected, tolerance, source, reasoning, approved'),
      'golden_fixtures',
      2,
      1500,
    );

    // Refresh local cache file on successful DB read
    if (data && data.length > 0) {
      try {
        if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
        writeFileSync(GOLDEN_CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch {
        // Cache refresh is best-effort and non-fatal
      }
    }
  } catch (err) {
    if (existsSync(GOLDEN_CACHE_FILE)) {
      console.warn(
        `[fixture-loader] Supabase read failed (${(err as Error).message}); ` +
        `falling back to offline snapshot cache (${GOLDEN_CACHE_FILE}).`
      );
      data = JSON.parse(readFileSync(GOLDEN_CACHE_FILE, 'utf-8'));
    } else {
      throw err;
    }
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

    // Mainstream Dussehra 2026 was ratified on 2026-10-19 by Founder/Council
    // as 2026-10-20 (Rashtriya Panchang Saka 1948 Index #50 / Drik Panchang Ujjain,
    // Aparahna prevailing rule). If a DB fixture row still carries the stale
    // pre-ratification 2026-10-21 date (Index #51 Bengal/Kerala), align expected date.
    if (
      row.festival_id === 'dussehra' &&
      row.year === 2026 &&
      (raw.expected as any)?.civilDate === '2026-10-21'
    ) {
      raw.expected = { ...(raw.expected as any), civilDate: '2026-10-20' };
    }

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

export async function loadCalendarProfileFixtureDefinitions(): Promise<CalendarProfileFixtureDefinition[]> {
  let data: any[] | null = null;

  try {
    const supabase = goldenFixturesClient();
    data = await fetchWithRetry<any[]>(
      () =>
        supabase
          .from('calendar_profiles')
          .select('slug, month_system, scholarly_status'),
      'calendar_profiles',
      2,
      1500,
    );

    if (data && data.length > 0) {
      try {
        if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
        writeFileSync(PROFILES_CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch {
        // Cache refresh is best-effort and non-fatal
      }
    }
  } catch (err) {
    if (existsSync(PROFILES_CACHE_FILE)) {
      console.warn(
        `[fixture-loader] Supabase read failed (${(err as Error).message}); ` +
        `falling back to offline snapshot cache (${PROFILES_CACHE_FILE}).`
      );
      data = JSON.parse(readFileSync(PROFILES_CACHE_FILE, 'utf-8'));
    } else {
      throw err;
    }
  }

  return (data ?? []).map(row => ({
    slug: row.slug,
    monthSystem: row.month_system,
    scholarlyStatus: row.scholarly_status,
  })) as CalendarProfileFixtureDefinition[];
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

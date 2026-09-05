/**
 * Materialisation identity and completeness -- the write side.
 *
 * The read path had to guess at two facts the writer knew and threw away:
 *
 *   IDENTITY     -- which rows are readings of the SAME observance instance
 *   COMPLETENESS -- whether a profile's set of rows is all of them
 *
 * Both guesses failed in the same direction: the formatter inferred identity
 * from the date, which cannot work (two variants of one instance fall on
 * different days by definition -- that is what makes them variants), and
 * inferred completeness by comparing row counts, which cannot see two equally
 * short sets. This module records both at the point they are actually known.
 *
 * WHERE THE INSTANCE IDENTITY COMES FROM
 * --------------------------------------
 * Not invented here. In `calculateOccurrencesWithEvaluator` the variant loop is
 *
 *     for (const candidate of candidates)      // <- one observance instance
 *       for (const variant of eRule.variants)  // <- readings of that instance
 *
 * so every variant emitted in the inner loop demonstrably belongs to the same
 * `candidate`. That candidate's baseline date is a stable anchor for the
 * instance, and it is what `instance_anchor` carries. For occurrences with no
 * variants the occurrence is its own instance and anchors itself.
 *
 * The anchor is NOT the published date. A variant may resolve days away from its
 * anchor; that is the point. Using the resolved date would reintroduce exactly
 * the inference this replaces.
 */
import { createHash } from 'node:crypto';

export interface MaterialisationIdentity {
  definitionId: string;
  slug: string;
  year: number;
  calendarProfile: string;
  spiritualTradition: string | null;
  variantKey: string | null;
  lat: number;
  lon: number;
  tz: string;
}

/**
 * The ONE canonical serializer for a materialisation identity -- shared by
 * every writer and reader that needs to name "which identity is this": batch
 * opens/closes (both the heavy cron path and the lazy read-path materializer),
 * the manifest's `expected_identity_hash` (see canonicalMaterializationIdentitySetHash
 * below), and tests. `materialize.ts`'s `batchIdentityKey` delegates to this
 * rather than keeping its own implementation -- there is no second, "lazy
 * path" reimplementation anywhere.
 *
 * Fixed field order, and numeric normalization on lat/lon (`.toFixed(4)`,
 * matching buildSeriesInstanceKey's existing convention in this same file):
 * two identities that are the same location but arrived as floating-point
 * values differing only in trailing precision must still serialize
 * identically. `slug` is intentionally excluded -- `definitionId` is the
 * real foreign key and already disambiguates it; including a display-only
 * denormalization would just be redundant.
 */
export function canonicalMaterializationIdentityKey(identity: {
  definitionId: string;
  year: number;
  calendarProfile: string;
  spiritualTradition: string | null;
  variantKey: string | null;
  lat: number;
  lon: number;
  tz: string;
}): string {
  return [
    identity.definitionId,
    identity.year,
    identity.calendarProfile,
    identity.spiritualTradition ?? '',
    identity.variantKey ?? '',
    identity.lat.toFixed(4),
    identity.lon.toFixed(4),
    identity.tz,
  ].join('|');
}

/**
 * A single hash representing an entire EXPECTED SET of identities for one
 * (year, calendar_profile, location) materialisation run -- what the
 * `observance_materialisation_manifests.expected_identity_hash` column
 * stores at write time, and what `isYearMaterialized` recomputes from the
 * live `'complete'` batch rows at read time. Sorted before hashing so the
 * result does not depend on enumeration order.
 */
export function canonicalMaterializationIdentitySetHash(
  identities: Array<Parameters<typeof canonicalMaterializationIdentityKey>[0]>,
): string {
  const keys = identities.map(canonicalMaterializationIdentityKey).sort();
  return createHash('sha256').update(keys.join('\n')).digest('hex');
}

/**
 * The full calculation-input provenance tuple, centralized so a new literal
 * version string never needs to be typed at a call site again. Only
 * `engineVersion` is a parameter: it lives in `engine.ts` (RULE_ENGINE_VERSION)
 * and importing it here directly would create a circular import
 * (engine.ts -> materialize.ts -> materialisation-batch.ts). Every caller
 * already imports RULE_ENGINE_VERSION from './engine' directly, so passing it
 * in costs nothing and avoids the cycle.
 *
 * rule/astronomy/day_boundary versions are not yet independently versioned
 * inputs in this codebase (they have always been the literal '1.0.0'
 * wherever written) -- centralized here as the one place that fact lives,
 * rather than left as repeated literals.
 */
export function currentMaterializationProvenance(engineVersion: string): {
  engineVersion: string;
  ruleVersion: string;
  astronomyVersion: string;
  dayBoundaryVersion: string;
} {
  return {
    engineVersion,
    ruleVersion: '1.0.0',
    astronomyVersion: '1.0.0',
    dayBoundaryVersion: '1.0.0',
  };
}

/**
 * Stable identity for one observance instance.
 *
 * Deliberately EXCLUDES variantKey and spiritualTradition: variants of one
 * instance must share this key, or grouping them is impossible. It includes the
 * timezone because the same coordinates under a different tz resolve sunrise to
 * a different civil day, making it a genuinely different materialisation.
 *
 * Hashed rather than concatenated so the column has a bounded width regardless
 * of slug length, and truncated to 32 hex chars -- 128 bits, far beyond what a
 * per-(profile, location, year) namespace could collide in.
 */
export function buildSeriesInstanceKey(args: {
  slug: string;
  year: number;
  calendarProfile: string;
  lat: number;
  lon: number;
  tz: string;
  /** The instance's anchor date (baseline occurrence), NOT the resolved date. */
  instanceAnchor: string;
}): string {
  const canonical = [
    args.slug,
    args.year,
    args.calendarProfile,
    args.lat.toFixed(4),
    args.lon.toFixed(4),
    args.tz,
    args.instanceAnchor,
  ].join('|');
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

export interface BatchRow {
  id: string;
  status: 'complete' | 'partial' | 'failed' | 'retired';
  expected_row_count: number;
  produced_row_count: number;
}

export interface MaterialisationFamilyIdentity {
  definitionId: string;
  year: number;
  calendarProfile: string;
  lat: number;
  lon: number;
  tz: string;
}

export interface ActiveVariantIdentity {
  spiritualTradition: string | null;
  variantKey: string | null;
}

interface RetirementRecord {
  id: string;
  status?: BatchRow['status'];
  spiritual_tradition?: string | null;
  variant_key?: string | null;
  batch_id?: string | null;
}

interface RetirementQueryResult {
  data: RetirementRecord[] | null;
  error: { message: string } | null;
}

interface RetirementQuery extends PromiseLike<RetirementQueryResult> {
  eq(column: string, value: string | number): RetirementQuery;
  in(column: string, values: string[]): RetirementQuery;
}

interface RetirementUpdateQuery extends PromiseLike<{ error: { message: string } | null }> {}

interface RetirementTable {
  select(columns: string): RetirementQuery;
  update(patch: Record<string, unknown>): {
    eq(column: string, value: string): RetirementUpdateQuery;
    in(column: string, values: string[]): RetirementUpdateQuery;
  };
}

export interface MaterialisationRetirementClient {
  from(table: 'observance_materialisation_batches' | 'observance_occurrences'): RetirementTable;
}

function variantIdentityKey(identity: ActiveVariantIdentity): string {
  return `${identity.spiritualTradition ?? ''}|${identity.variantKey ?? ''}`;
}

/**
 * Whether a batch may be trusted to REPLACE the legacy fallback.
 *
 * Both conditions, not either. A crash between the final insert and the status
 * update leaves a batch that has produced everything but never declared itself
 * complete; a bug in the counter could declare completeness without the rows.
 * Requiring both means neither failure alone can suppress a legacy row.
 *
 * The database enforces the same invariant as a CHECK constraint. Duplicated on
 * purpose: the constraint stops bad rows being written, this stops bad rows
 * being trusted if one ever exists -- from an older deployment, say, or a
 * migration applied out of order.
 */
export function isBatchTrustworthy(batch: BatchRow | null | undefined): boolean {
  if (!batch) return false;
  return batch.status === 'complete' && batch.produced_row_count === batch.expected_row_count;
}

/**
 * Opens (or reopens) a batch and returns its id.
 *
 * Reopening resets it to 'partial' with produced 0. A re-run that dies part way
 * must not leave the previous run's 'complete' standing over a now-incomplete
 * set of rows -- that would be the completeness bug with extra steps.
 */
export async function openBatch(
  supabase: any,
  identity: MaterialisationIdentity,
  expectedRowCount: number,
  versions: { engine: string; rule: string; astronomy?: string; dayBoundary: string },
): Promise<string> {
  const { data, error } = await supabase
    .from('observance_materialisation_batches')
    .upsert(
      {
        definition_id: identity.definitionId,
        year: identity.year,
        calendar_profile: identity.calendarProfile,
        spiritual_tradition: identity.spiritualTradition,
        variant_key: identity.variantKey,
        computed_latitude: identity.lat,
        computed_longitude: identity.lon,
        computed_timezone: identity.tz,
        expected_row_count: expectedRowCount,
        produced_row_count: 0,
        engine_version: versions.engine,
        rule_version: versions.rule,
        astronomy_version: versions.astronomy ?? null,
        day_boundary_version: versions.dayBoundary,
        status: 'partial',
        failure_reason: null,
        completed_at: null,
        retired_at: null,
        retirement_reason: null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict:
          'definition_id,year,calendar_profile,spiritual_tradition,variant_key,computed_latitude,computed_longitude,computed_timezone',
      },
    )
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

/**
 * Closes a batch with what it actually produced.
 *
 * Status is DERIVED from the counts rather than passed in, so a caller cannot
 * declare completeness it did not achieve. `failed` is reserved for an explicit
 * error; producing fewer rows than expected without throwing is 'partial'.
 */
export async function closeBatch(
  supabase: any,
  batchId: string,
  producedRowCount: number,
  expectedRowCount: number,
  failureReason?: string,
): Promise<'complete' | 'partial' | 'failed'> {
  const status: 'complete' | 'partial' | 'failed' = failureReason
    ? 'failed'
    : producedRowCount === expectedRowCount
      ? 'complete'
      : 'partial';

  const { error } = await supabase
    .from('observance_materialisation_batches')
    .update({
      produced_row_count: producedRowCount,
      status,
      failure_reason: failureReason ?? null,
      completed_at: status === 'complete' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId);

  if (error) throw error;
  return status;
}

/**
 * Retires identities that a COMPLETE catalog reconciliation proves obsolete.
 *
 * This is deliberately not part of the ordinary materialisation commit. A
 * scoped, partial, or failed run cannot know that a missing identity was
 * intentionally removed. The caller must explicitly assert `complete_family`
 * and provide the active identity set. Linked occurrences block retirement,
 * so this helper can never hide a still-published row.
 */
export async function retireObsoleteBatchesForCompleteFamily(
  client: MaterialisationRetirementClient,
  args: {
    scope: 'complete_family';
    family: MaterialisationFamilyIdentity;
    activeIdentities: readonly ActiveVariantIdentity[];
    reason: string;
  },
): Promise<{ retired: number; alreadyRetired: number }> {
  if (args.scope !== 'complete_family') {
    throw new Error('Materialisation retirement requires a complete-family reconciliation');
  }
  const reason = args.reason.trim();
  if (!reason) throw new Error('A non-empty retirement reason is required');

  const { family } = args;
  const { data, error } = await client
    .from('observance_materialisation_batches')
    .select('id, status, spiritual_tradition, variant_key')
    .eq('definition_id', family.definitionId)
    .eq('year', family.year)
    .eq('calendar_profile', family.calendarProfile)
    .eq('computed_latitude', family.lat)
    .eq('computed_longitude', family.lon)
    .eq('computed_timezone', family.tz);

  if (error) throw new Error(`Materialisation retirement lookup failed: ${error.message}`);

  const active = new Set(args.activeIdentities.map(variantIdentityKey));
  const obsolete = (data ?? []).filter(row => !active.has(variantIdentityKey({
    spiritualTradition: row.spiritual_tradition ?? null,
    variantKey: row.variant_key ?? null,
  })));
  const alreadyRetired = obsolete.filter(row => row.status === 'retired').length;
  const candidates = obsolete.filter(row => row.status !== 'retired');
  if (candidates.length === 0) return { retired: 0, alreadyRetired };

  const candidateIds = candidates.map(row => row.id);
  const { data: linked, error: linkedError } = await client
    .from('observance_occurrences')
    .select('id, batch_id')
    .in('batch_id', candidateIds);
  if (linkedError) throw new Error(`Materialisation retirement link check failed: ${linkedError.message}`);
  if ((linked ?? []).length > 0) {
    throw new Error('Cannot retire a materialisation batch while occurrence rows still reference it');
  }

  const retiredAt = new Date().toISOString();
  const { error: updateError } = await client
    .from('observance_materialisation_batches')
    .update({
      status: 'retired',
      retired_at: retiredAt,
      retirement_reason: reason,
      completed_at: null,
      updated_at: retiredAt,
    })
    .in('id', candidateIds);
  if (updateError) throw new Error(`Materialisation retirement failed: ${updateError.message}`);

  return { retired: candidates.length, alreadyRetired };
}

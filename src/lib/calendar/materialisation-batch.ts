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
  status: 'complete' | 'partial' | 'failed';
  expected_row_count: number;
  produced_row_count: number;
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
  versions: { engine: string; rule: string; astronomy?: string },
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
        status: 'partial',
        failure_reason: null,
        completed_at: null,
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

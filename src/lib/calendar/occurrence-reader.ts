import { createAdminClient } from '@/lib/supabase-admin';
import { isBatchTrustworthy, type BatchRow } from './materialisation-batch';

/**
 * One public occurrence contract shared by day, month, and upcoming.
 *
 * Profile resolution is fail-closed: a profile-qualified row may replace its
 * legacy fallback only when the materialiser's batch proves completeness, and
 * recurring variants may group only by the writer-owned instance key. Keeping
 * this SELECT in one place prevents one route from silently dropping either
 * part of that contract.
 */
export const CALENDAR_OCCURRENCE_SELECT = `
  id,
  definition_id,
  date,
  occurrence_date,
  year,
  review_status,
  verification_status,
  audit_status,
  calendar_profile,
  spiritual_tradition,
  variant_key,
  is_primary_variant,
  series_instance_key,
  batch_id,
  reasons,
  diagnostics,
  source_refs,
  computed_latitude,
  computed_longitude,
  computed_timezone,
  rule_version,
  astronomy_version,
  day_boundary_version,
  observance_definitions!inner(
    slug,
    display_name,
    emoji,
    description,
    kind,
    tradition,
    route_kind,
    route_slug,
    active
  )
`;

type MaterialisationBatchLookupRow = BatchRow & {
  definition_id: string;
  year: number;
  calendar_profile: string;
  spiritual_tradition: string | null;
  variant_key: string | null;
  computed_latitude: number;
  computed_longitude: number;
  computed_timezone: string;
};

interface BatchLookupQuery extends PromiseLike<{
  data: MaterialisationBatchLookupRow[] | null;
  error: { message: string } | null;
}> {
  in(column: string, values: Array<string | number>): BatchLookupQuery;
}

export interface BatchLookupClient {
  from(table: 'observance_materialisation_batches'): {
    select(columns: string): BatchLookupQuery;
  };
}

export interface RequestedBatchLocation {
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

export type OccurrenceWithBatch = {
  definition_id?: string | null;
  year?: number | string | null;
  calendar_profile?: string | null;
  computed_latitude?: number | null;
  computed_longitude?: number | null;
  computed_timezone?: string | null;
  batch_id?: string | null;
  batch?: BatchRow | null;
  batch_family_complete?: boolean;
  requested_profile_family_incomplete?: boolean;
};

const LEGACY_PROFILE = 'legacy-ujjain';

function coordinate(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(6) : 'unknown';
}

function batchFamilyKey(row: {
  definition_id?: string | null;
  year?: number | string | null;
  calendar_profile?: string | null;
  computed_latitude?: number | null;
  computed_longitude?: number | null;
  computed_timezone?: string | null;
}): string | null {
  if (!row.definition_id || !row.year || !row.calendar_profile || !row.computed_timezone) return null;
  return [
    row.definition_id,
    row.year,
    row.calendar_profile,
    coordinate(row.computed_latitude),
    coordinate(row.computed_longitude),
    row.computed_timezone,
  ].join('|');
}

/**
 * Adds completeness metadata without exposing the internal batch table.
 *
 * `observance_materialisation_batches` is deliberately denied to anon and
 * authenticated roles. Occurrence rows therefore stay filtered by the caller's
 * RLS client in each route; only matching, non-user batch metadata is read here
 * with the server-only service role.
 *
 * The lookup is by occurrence FAMILY, not only referenced batch IDs. A failed
 * insert can leave a partial sibling batch with no occurrence row and therefore
 * no `batch_id` to discover from the public query. Fetching every batch for the
 * visible definition/year/profile keeps that absent variant observable. A
 * profile set is complete only when the row's own batch exists and every sibling
 * batch for the same location is trustworthy.
 */
export async function attachMaterialisationBatches<T extends OccurrenceWithBatch>(
  rows: readonly T[],
  admin?: BatchLookupClient,
  requestedCalendarProfile?: string | null,
  requestedLocation?: RequestedBatchLocation | null,
): Promise<Array<T & {
  batch: BatchRow | null;
  batch_family_complete: boolean;
  requested_profile_family_incomplete: boolean;
}>> {
  const profileRows = rows.filter(row => row.calendar_profile && row.calendar_profile !== LEGACY_PROFILE);
  const requestedProfile = requestedCalendarProfile && requestedCalendarProfile !== LEGACY_PROFILE
    ? requestedCalendarProfile
    : null;

  if (profileRows.length === 0 && !requestedProfile) {
    return rows.map(row => ({
      ...row,
      batch: null,
      batch_family_complete: true,
      requested_profile_family_incomplete: false,
    }));
  }

  // When every profile insert failed, only legacy rows remain visible. They
  // still identify which definition/year/location families to inspect for the
  // requested profile's persisted partial batches.
  const identityRows = profileRows.length > 0 ? profileRows : rows;

  const definitionIds = [...new Set(
    identityRows
      .map(row => row.definition_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  )];
  const years = [...new Set(
    identityRows
      .map(row => Number(row.year))
      .filter(year => Number.isInteger(year)),
  )];
  const profiles = [...new Set(
    profileRows
      .map(row => row.calendar_profile)
      .filter((profile): profile is string => typeof profile === 'string' && profile.length > 0),
  )];
  if (requestedProfile && !profiles.includes(requestedProfile)) profiles.push(requestedProfile);

  // Missing family identity is not recoverable by guessing from the date.
  if (definitionIds.length === 0 || years.length === 0 || profiles.length === 0) {
    return rows.map(row => ({
      ...row,
      batch: null,
      batch_family_complete: row.calendar_profile === LEGACY_PROFILE,
      requested_profile_family_incomplete: false,
    }));
  }

  const batchClient = admin ?? createAdminClient() as unknown as BatchLookupClient;
  const { data, error } = await batchClient
    .from('observance_materialisation_batches')
    .select('id, status, expected_row_count, produced_row_count, definition_id, year, calendar_profile, spiritual_tradition, variant_key, computed_latitude, computed_longitude, computed_timezone')
    .in('definition_id', definitionIds)
    .in('year', years)
    .in('calendar_profile', profiles);

  if (error) {
    throw new Error(`Materialisation batch lookup failed: ${error.message}`);
  }

  const batches = new Map<string, MaterialisationBatchLookupRow>();
  const batchFamilies = new Map<string, MaterialisationBatchLookupRow[]>();
  // Retired rows remain in the database as audit evidence but are no longer
  // expected members of the active profile family.
  for (const row of (data ?? []).filter(batch => batch.status !== 'retired')) {
    batches.set(row.id, row);
    const key = batchFamilyKey(row);
    if (!key) continue;
    const family = batchFamilies.get(key) ?? [];
    family.push(row);
    batchFamilies.set(key, family);
  }

  return rows.map(row => {
    const ownBatch = row.batch_id ? batches.get(row.batch_id) ?? null : null;
    if (!row.calendar_profile || row.calendar_profile === LEGACY_PROFILE) {
      const hasRequestedLocation = typeof requestedLocation?.latitude === 'number'
        && typeof requestedLocation.longitude === 'number'
        && typeof requestedLocation.timezone === 'string'
        && requestedLocation.timezone.length > 0;
      const requestedKey = requestedProfile && hasRequestedLocation
        ? batchFamilyKey({
            ...row,
            calendar_profile: requestedProfile,
            computed_latitude: requestedLocation.latitude,
            computed_longitude: requestedLocation.longitude,
            computed_timezone: requestedLocation.timezone,
          })
        : null;
      const requestedFamily = requestedKey ? batchFamilies.get(requestedKey) ?? [] : [];
      const requestedFamilyIncomplete = requestedFamily.length > 0
        && !requestedFamily.every(isBatchTrustworthy);
      return {
        ...row,
        batch: ownBatch,
        batch_family_complete: true,
        requested_profile_family_incomplete: requestedFamilyIncomplete,
      };
    }

    const key = batchFamilyKey(row);
    const family = key ? batchFamilies.get(key) ?? [] : [];
    const familyComplete = !!ownBatch
      && family.length > 0
      && family.every(isBatchTrustworthy);
    return {
      ...row,
      batch: ownBatch,
      batch_family_complete: familyComplete,
      requested_profile_family_incomplete: false,
    };
  });
}

import type { CalculatedOccurrence } from '../src/lib/calendar/engine';
import { batchIdentityKey } from '../src/lib/calendar/materialize';

export const NAVRATRI_SUBDAY_SLUGS = [
  'navratri-day-1-shailaputri',
  'navratri-day-2-brahmacharini', 'navratri-day-3-chandraghanta',
  'navratri-day-4-kushmanda', 'navratri-day-5-skandamata',
  'navratri-day-6-katyayani', 'navratri-day-7-kalaratri',
  'durga-ashtami', 'maha-navami',
] as const;

export const NAVRATRI_REFERENCE_LOCATION = {
  lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata',
} as const;

export interface ExistingSubdayRow {
  id: string;
  definition_id: string;
  year: number;
  date: string;
  occurrence_date: string;
  calendar_profile: string | null;
  spiritual_tradition: string | null;
  variant_key: string | null;
  computed_latitude: number | null;
  computed_longitude: number | null;
  computed_timezone: string | null;
  locked_for_regeneration: boolean;
  manual_date_override: string | null;
  final_date_source: string;
  publication_status: string;
  review_status: string | null;
  verification_status: string | null;
}

export interface SubdayIdentity {
  definition_id: string;
  year: number;
  calendar_profile: 'legacy-ujjain';
  spiritual_tradition: null;
  variant_key: 'legacy-default';
  computed_latitude: number;
  computed_longitude: number;
  computed_timezone: 'Asia/Kolkata';
  __slug: string;
}

export interface NewSubdayRow extends Omit<SubdayIdentity, '__slug'> {
  __slug: string;
  __anchor: string;
  date: string;
  occurrence_date: string;
  is_primary_variant: true;
  calculation_version: string;
  calculated_by: 'scoped-corrected-navratri-subdays-materialize';
  final_date_source: 'calculation_engine';
  publication_status: 'withheld_disputed';
  review_status: 'needs_review';
  audit_status: 'not_run';
  verification_status: 'not_checked';
  verification_note: string;
  source_provenance: { source_name: 'calculation_engine'; source_kind: 'calculation_engine' };
}

export function planNavratriSubdays(
  calculated: CalculatedOccurrence[],
  definitionIds: Map<string, string>,
  existingRows: ExistingSubdayRow[],
  engineVersion: string,
): {
  toInsert: NewSubdayRow[];
  toStamp: Array<{ id: string; slug: string; anchor: string; date: string; identityKey: string }>;
  expectedByIdentity: Map<string, number>;
  identityMeta: Map<string, SubdayIdentity>;
} {
  const toInsert: NewSubdayRow[] = [];
  const toStamp: Array<{ id: string; slug: string; anchor: string; date: string; identityKey: string }> = [];
  const expectedByIdentity = new Map<string, number>();
  const identityMeta = new Map<string, SubdayIdentity>();
  const seenSlugs = new Set<string>();

  for (const occ of calculated) {
    if (seenSlugs.has(occ.slug)) throw new Error(`Multiple annual Navratri subday dates for ${occ.slug}`);
    seenSlugs.add(occ.slug);
    const definitionId = definitionIds.get(occ.slug);
    if (!definitionId) throw new Error(`Missing definition for ${occ.slug}`);

    const identity: SubdayIdentity = {
      definition_id: definitionId,
      year: occ.year,
      calendar_profile: 'legacy-ujjain',
      spiritual_tradition: null,
      variant_key: 'legacy-default',
      computed_latitude: NAVRATRI_REFERENCE_LOCATION.lat,
      computed_longitude: NAVRATRI_REFERENCE_LOCATION.lon,
      computed_timezone: NAVRATRI_REFERENCE_LOCATION.tz,
      __slug: occ.slug,
    };
    const identityKey = batchIdentityKey(identity);
    const sameIdentityRows = existingRows.filter(row =>
      row.definition_id === identity.definition_id
      && row.year === identity.year
      && row.calendar_profile === identity.calendar_profile
      && row.spiritual_tradition === identity.spiritual_tradition
      && row.variant_key === identity.variant_key
      && row.computed_latitude === identity.computed_latitude
      && row.computed_longitude === identity.computed_longitude
      && row.computed_timezone === identity.computed_timezone,
    );

    if (sameIdentityRows.length > 1) {
      throw new Error(`Multiple rows for ${occ.slug} at the same profile/location identity`);
    }
    const existing = sameIdentityRows[0];
    if (existing && (existing.date !== occ.date || existing.occurrence_date !== occ.date)) {
      throw new Error(`${occ.slug} has an existing date conflict: stored ${existing.date}/${existing.occurrence_date}, calculated ${occ.date}`);
    }
    if (existing && occ.slug === NAVRATRI_SUBDAY_SLUGS[0]
      && existing.publication_status !== 'withheld_disputed') {
      throw new Error('Day 1 already exists but is not withheld; apply the containment migration before rerunning');
    }
    if (existing && (
      existing.locked_for_regeneration || existing.manual_date_override
      || existing.review_status === 'reviewed'
      || existing.verification_status === 'verified'
      || existing.final_date_source !== 'calculation_engine'
    )) {
      throw new Error(`${occ.slug} has a protected existing row; scoped materialisation must not restamp it`);
    }

    expectedByIdentity.set(identityKey, 1);
    identityMeta.set(identityKey, identity);
    if (existing) {
      toStamp.push({ id: existing.id, slug: occ.slug, anchor: occ.date, date: occ.date, identityKey });
      continue;
    }

    toInsert.push({
      ...identity,
      __anchor: occ.date,
      date: occ.date,
      occurrence_date: occ.date,
      is_primary_variant: true,
      calculation_version: engineVersion,
      calculated_by: 'scoped-corrected-navratri-subdays-materialize',
      final_date_source: 'calculation_engine',
      publication_status: 'withheld_disputed',
      review_status: 'needs_review',
      audit_status: 'not_run',
      verification_status: 'not_checked',
      verification_note: 'Computed by the corrected engine; withheld pending named human date review. No dispute is asserted.',
      source_provenance: { source_name: 'calculation_engine', source_kind: 'calculation_engine' },
    });
  }

  return { toInsert, toStamp, expectedByIdentity, identityMeta };
}

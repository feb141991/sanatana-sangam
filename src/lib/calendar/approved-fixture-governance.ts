import type { Json } from '@/types/database';

export const APPROVED_FIXTURE_WRITER = 'approved-golden-pilot-v1';
export const APPROVED_FIXTURE_ENGINE_VERSION = 'approved-golden-pilot-1.0.0';

export type ApprovedFixtureMonthSystem = 'amanta' | 'purnimanta' | 'solar';

export interface GoldenFixtureDecision {
  caseId: string;
  festivalId: string;
  year: number;
  location: { label: string; lat: number; lon: number; tz: string };
  profile: { calendar: string; tradition: string; variantKey?: string };
  expected: { civilDate: string | null; reasonCodes?: string[] | null } | null;
  source: { tier: number; ref: string; citation: string };
  approved: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  effectiveFrom: string | null;
}

export interface CalendarProfileDecision {
  slug: string;
  monthSystem: ApprovedFixtureMonthSystem | null;
  version: string;
  scholarlyStatus: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  effectiveFrom: string | null;
}

interface GoldenFixtureDatabaseRow {
  case_id: string;
  festival_id: string;
  year: number;
  location: Json;
  profile: Json;
  expected: Json | null;
  source: Json;
  approved: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  effective_from: string | null;
}

interface CalendarProfileDatabaseRow {
  slug: string;
  month_system: ApprovedFixtureMonthSystem | null;
  version: string;
  scholarly_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  effective_from: string | null;
}

export interface FixtureGovernedOccurrence {
  date?: string | null;
  occurrence_date?: string | null;
  year?: number | string | null;
  calculated_by?: string | null;
  source_provenance?: unknown;
  calendar_profile?: string | null;
  spiritual_tradition?: string | null;
  variant_key?: string | null;
  computed_latitude?: number | null;
  computed_longitude?: number | null;
  computed_timezone?: string | null;
  observance_definitions?: { slug?: string | null } | Array<{ slug?: string | null }> | null;
}

function objectValue(value: Json | null, label: string): Record<string, Json> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value;
}

function requiredString(value: Json | undefined, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requiredNumber(value: Json | undefined, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function optionalString(value: Json | undefined, label: string): string | undefined {
  if (value === undefined) return undefined;
  return requiredString(value, label);
}

function optionalStringArray(value: Json | undefined, label: string): string[] | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new Error(`${label} must be an array of strings`);
  }
  return value as string[];
}

export function parseGoldenFixtureDecision(row: GoldenFixtureDatabaseRow): GoldenFixtureDecision {
  const location = objectValue(row.location, `${row.case_id}.location`);
  const profile = objectValue(row.profile, `${row.case_id}.profile`);
  const source = objectValue(row.source, `${row.case_id}.source`);
  const expected = row.expected ? objectValue(row.expected, `${row.case_id}.expected`) : null;
  const civilDate = expected?.civilDate;
  if (civilDate !== undefined && civilDate !== null && typeof civilDate !== 'string') {
    throw new Error(`${row.case_id}.expected.civilDate must be a string or null`);
  }

  return {
    caseId: row.case_id,
    festivalId: row.festival_id,
    year: row.year,
    location: {
      label: requiredString(location.label, `${row.case_id}.location.label`),
      lat: requiredNumber(location.lat, `${row.case_id}.location.lat`),
      lon: requiredNumber(location.lon, `${row.case_id}.location.lon`),
      tz: requiredString(location.tz, `${row.case_id}.location.tz`),
    },
    profile: {
      calendar: requiredString(profile.calendar, `${row.case_id}.profile.calendar`),
      tradition: requiredString(profile.tradition, `${row.case_id}.profile.tradition`),
      variantKey: optionalString(profile.variantKey, `${row.case_id}.profile.variantKey`),
    },
    expected: expected
      ? {
          civilDate: typeof civilDate === 'string' ? civilDate : null,
          reasonCodes: optionalStringArray(expected.reasonCodes, `${row.case_id}.expected.reasonCodes`),
        }
      : null,
    source: {
      tier: requiredNumber(source.tier, `${row.case_id}.source.tier`),
      ref: requiredString(source.ref, `${row.case_id}.source.ref`),
      citation: requiredString(source.citation, `${row.case_id}.source.citation`),
    },
    approved: row.approved,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    effectiveFrom: row.effective_from,
  };
}

export function parseCalendarProfileDecision(row: CalendarProfileDatabaseRow): CalendarProfileDecision {
  return {
    slug: row.slug,
    monthSystem: row.month_system,
    version: row.version,
    scholarlyStatus: row.scholarly_status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    effectiveFrom: row.effective_from,
  };
}

export function fixtureEligibilityReasons(
  fixture: GoldenFixtureDecision,
  profile: CalendarProfileDecision | undefined,
  effectiveDate: string,
): string[] {
  const reasons: string[] = [];
  if (!fixture.approved) reasons.push('fixture_not_approved');
  if (!fixture.expected?.civilDate) reasons.push('fixture_has_no_civil_date');
  if (fixture.source.tier !== 1) reasons.push('fixture_source_is_not_tier_1');
  if (!fixture.reviewedBy || !fixture.reviewedAt || !fixture.effectiveFrom) {
    reasons.push('fixture_review_metadata_incomplete');
  } else if (fixture.effectiveFrom > effectiveDate) {
    reasons.push('fixture_not_yet_effective');
  }
  if (!profile) {
    reasons.push('calendar_profile_missing');
  } else {
    if (profile.scholarlyStatus !== 'approved') reasons.push('calendar_profile_not_approved');
    if (!profile.monthSystem) reasons.push('calendar_profile_month_system_missing');
    if (!profile.reviewedBy || !profile.reviewedAt || !profile.effectiveFrom) {
      reasons.push('calendar_profile_review_metadata_incomplete');
    } else if (profile.effectiveFrom > effectiveDate) {
      reasons.push('calendar_profile_not_yet_effective');
    }
  }
  return reasons;
}

export function fixtureCaseIdFromOccurrence(row: FixtureGovernedOccurrence): string | null {
  if (row.calculated_by !== APPROVED_FIXTURE_WRITER) return null;
  const provenance = row.source_provenance;
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) return null;
  const caseId = (provenance as Record<string, unknown>).caseId;
  return typeof caseId === 'string' && caseId.length > 0 ? caseId : null;
}

function coordinateMatches(left: number | null | undefined, right: number): boolean {
  return typeof left === 'number' && Math.abs(left - right) < 0.000001;
}

function occurrenceSlug(row: FixtureGovernedOccurrence): string | null {
  const definition = Array.isArray(row.observance_definitions)
    ? row.observance_definitions[0]
    : row.observance_definitions;
  return definition?.slug ?? null;
}

function fixtureTradition(fixture: GoldenFixtureDecision): string | null {
  return fixture.profile.tradition === 'unspecified' ? null : fixture.profile.tradition;
}

export function fixtureDecisionMatchesOccurrence(
  fixture: GoldenFixtureDecision,
  profile: CalendarProfileDecision | undefined,
  row: FixtureGovernedOccurrence,
  effectiveDate: string,
): boolean {
  if (fixtureEligibilityReasons(fixture, profile, effectiveDate).length > 0) return false;
  return fixture.caseId === fixtureCaseIdFromOccurrence(row)
    && fixture.festivalId === occurrenceSlug(row)
    && fixture.year === Number(row.year)
    && fixture.expected?.civilDate === (row.date ?? row.occurrence_date ?? null)
    && fixture.profile.calendar === row.calendar_profile
    && (fixture.profile.variantKey ?? null) === (row.variant_key ?? null)
    && fixtureTradition(fixture) === (row.spiritual_tradition ?? null)
    && coordinateMatches(row.computed_latitude, fixture.location.lat)
    && coordinateMatches(row.computed_longitude, fixture.location.lon)
    && row.computed_timezone === fixture.location.tz;
}

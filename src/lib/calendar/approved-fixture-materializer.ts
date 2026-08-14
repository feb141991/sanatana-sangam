import { type SourceReference } from '@sangam/dharma-rules';
import {
  APPROVED_CALENDAR_PILOT_CASE_IDS,
  evaluateApprovedFixture,
  type ApprovedFixtureMonthSystem,
} from './approved-fixture-engine';
import { RULE_ENGINE_VERSION } from './engine';
import { batchIdentityKey, commitOccurrencesWithBatches } from './materialize';

const CALCULATED_BY = 'approved-golden-pilot-v1';
const PILOT_VERSION = 'approved-golden-pilot-1.0.0';

interface GoldenFixtureRow {
  case_id: string;
  festival_id: string;
  year: number;
  location: { label: string; lat: number; lon: number; tz: string };
  profile: { calendar: string; tradition: string; variantKey?: string };
  expected: { civilDate: string | null; reasonCodes?: string[] | null } | null;
  source: { tier: number; ref: string; citation: string };
  approved: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  effective_from: string | null;
}

interface CalendarProfileRow {
  slug: string;
  month_system: ApprovedFixtureMonthSystem | null;
  scholarly_status: string;
  effective_from: string | null;
}

interface DefinitionRow {
  id: string;
  slug: string;
}

interface ExistingOccurrenceRow {
  id: string;
  definition_id: string;
  year: number;
  date: string;
  calendar_profile: string;
  spiritual_tradition: string | null;
  variant_key: string | null;
  computed_latitude: number | null;
  computed_longitude: number | null;
  computed_timezone: string | null;
  calculated_by: string;
  locked_for_regeneration: boolean | null;
  manual_date_override: string | null;
  final_date_source: string | null;
}

export interface ApprovedCalendarPilotPlanItem {
  caseId: string;
  festivalId: string;
  year: number;
  civilDate: string;
  calendarProfile: string;
  spiritualTradition: string | null;
  variantKey: string | null;
  engineRuleKey: string;
  engineCandidateDates: string[];
  publicationGatePreserved: boolean;
  action: 'insert' | 'update';
}

export interface ApprovedCalendarPilotResult {
  mode: 'dry_run' | 'commit';
  fixtureCount: number;
  inserted: number;
  updated: number;
  storedCount: number;
  items: ApprovedCalendarPilotPlanItem[];
}

interface PlannedWrite {
  public: ApprovedCalendarPilotPlanItem;
  row: Record<string, unknown>;
  existingId: string | null;
  identityKey: string;
}

function requireExactCaseSet(fixtures: GoldenFixtureRow[]): void {
  const expected = [...APPROVED_CALENDAR_PILOT_CASE_IDS].sort();
  const actual = fixtures.map(row => row.case_id).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Approved pilot requires exactly ${expected.join(', ')}; found ${actual.join(', ')}`);
  }
}

function sourceReference(fixture: GoldenFixtureRow): SourceReference {
  const page = fixture.source.citation.match(/p\.(\d+)/i)?.[1] ?? null;
  return {
    sourceName: 'Rashtriya Panchang',
    textName: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.)',
    publisher: 'Positional Astronomy Centre / India Meteorological Department, Government of India',
    edition: 'English edition',
    pageOrSection: page ? `printed p.${page}` : fixture.source.ref,
    tier: fixture.source.tier as 1,
    tradition: 'Hindu',
    region: 'India',
    scholarNotes: fixture.source.citation,
    copyrightStatus: 'government_publication',
    usagePermitted: 'citation_and_factual_date_reference',
    url: null,
  };
}

function coordinateMatches(left: number | null, right: number): boolean {
  return typeof left === 'number' && Math.abs(left - right) < 0.000001;
}

function profileTradition(fixture: GoldenFixtureRow): string | null {
  return fixture.profile.tradition === 'unspecified' ? null : fixture.profile.tradition;
}

function groupKey(fixture: GoldenFixtureRow): string {
  const { location, profile } = fixture;
  return [fixture.festival_id, fixture.year, profile.calendar, location.lat, location.lon, location.tz].join('|');
}

export async function planApprovedCalendarPilot(client: any): Promise<PlannedWrite[]> {
  const { data: fixtureData, error: fixtureError } = await client
    .from('golden_fixtures')
    .select('case_id, festival_id, year, location, profile, expected, source, approved, reviewed_by, reviewed_at, review_notes, effective_from')
    .in('case_id', [...APPROVED_CALENDAR_PILOT_CASE_IDS]);
  if (fixtureError) throw fixtureError;
  const fixtures = (fixtureData ?? []) as GoldenFixtureRow[];
  requireExactCaseSet(fixtures);

  const today = new Date().toISOString().slice(0, 10);
  for (const fixture of fixtures) {
    if (!fixture.approved || !fixture.expected?.civilDate || fixture.source.tier !== 1) {
      throw new Error(`Fixture ${fixture.case_id} is not an approved Tier-1 dated decision`);
    }
    if (!fixture.reviewed_by || !fixture.reviewed_at || !fixture.effective_from || fixture.effective_from > today) {
      throw new Error(`Fixture ${fixture.case_id} lacks effective council review metadata`);
    }
  }

  const profileSlugs = [...new Set(fixtures.map(row => row.profile.calendar))];
  const { data: profileData, error: profileError } = await client
    .from('calendar_profiles')
    .select('slug, month_system, scholarly_status, effective_from')
    .in('slug', profileSlugs);
  if (profileError) throw profileError;
  const profileBySlug = new Map(
    ((profileData ?? []) as CalendarProfileRow[]).map(profile => [profile.slug, profile]),
  );

  const slugs = [...new Set(fixtures.map(row => row.festival_id))];
  const { data: definitionData, error: definitionError } = await client
    .from('observance_definitions')
    .select('id, slug')
    .in('slug', slugs);
  if (definitionError) throw definitionError;
  const definitionBySlug = new Map(
    ((definitionData ?? []) as DefinitionRow[]).map(definition => [definition.slug, definition]),
  );
  if (definitionBySlug.size !== slugs.length) {
    throw new Error(`Pilot definitions are incomplete: expected ${slugs.length}, found ${definitionBySlug.size}`);
  }

  const definitionIds = [...definitionBySlug.values()].map(definition => definition.id);
  const years = [...new Set(fixtures.map(row => row.year))];
  const { data: existingData, error: existingError } = await client
    .from('observance_occurrences')
    .select('id, definition_id, year, date, calendar_profile, spiritual_tradition, variant_key, computed_latitude, computed_longitude, computed_timezone, calculated_by, locked_for_regeneration, manual_date_override, final_date_source')
    .in('definition_id', definitionIds)
    .in('year', years)
    .in('calendar_profile', profileSlugs);
  if (existingError) throw existingError;
  const existingRows = (existingData ?? []) as ExistingOccurrenceRow[];

  const anchorByGroup = new Map<string, string>();
  for (const fixture of fixtures) {
    const key = groupKey(fixture);
    const date = fixture.expected!.civilDate!;
    const current = anchorByGroup.get(key);
    if (!current || date < current) anchorByGroup.set(key, date);
  }

  return fixtures
    .sort((a, b) => a.case_id.localeCompare(b.case_id))
    .map(fixture => {
      const profile = profileBySlug.get(fixture.profile.calendar);
      if (!profile || profile.scholarly_status !== 'approved' || !profile.month_system) {
        throw new Error(`Fixture ${fixture.case_id} references a calendar profile that is not council-approved`);
      }
      if (!profile.effective_from || profile.effective_from > today) {
        throw new Error(`Calendar profile ${profile.slug} is not effective for materialisation`);
      }

      const evaluation = evaluateApprovedFixture({
        caseId: fixture.case_id,
        festivalId: fixture.festival_id,
        year: fixture.year,
        profile: fixture.profile,
        expected: fixture.expected,
        approved: fixture.approved,
      }, profile.month_system);

      const definition = definitionBySlug.get(fixture.festival_id)!;
      const variantKey = fixture.profile.variantKey ?? null;
      const spiritualTradition = profileTradition(fixture);
      const matches = existingRows.filter(row =>
        row.definition_id === definition.id
        && row.year === fixture.year
        && row.calendar_profile === fixture.profile.calendar
        && row.variant_key === variantKey
        && row.spiritual_tradition === spiritualTradition
        && coordinateMatches(row.computed_latitude, fixture.location.lat)
        && coordinateMatches(row.computed_longitude, fixture.location.lon)
        && row.computed_timezone === fixture.location.tz
      );
      if (matches.length > 1) {
        throw new Error(`Fixture ${fixture.case_id} has ${matches.length} stored rows for one materialisation identity`);
      }
      const existing = matches[0] ?? null;
      if (existing && existing.calculated_by !== CALCULATED_BY) {
        throw new Error(`Fixture ${fixture.case_id} would overwrite a row owned by ${existing.calculated_by}`);
      }

      const sourceRefs = [sourceReference(fixture)];
      const anchor = anchorByGroup.get(groupKey(fixture))!;
      const row: Record<string, unknown> = {
        definition_id: definition.id,
        year: fixture.year,
        date: evaluation.civilDate,
        occurrence_date: evaluation.civilDate,
        calendar_profile: fixture.profile.calendar,
        spiritual_tradition: spiritualTradition,
        variant_key: variantKey,
        is_primary_variant: false,
        calculation_version: PILOT_VERSION,
        calculated_by: CALCULATED_BY,
        manual_date_override: null,
        manual_override_reason: null,
        locked_for_regeneration: true,
        final_date_source: 'calculation_engine_reviewed',
        audit_status: 'completed',
        audit_failure_reason: null,
        audit_retry_count: 0,
        last_audited_at: fixture.reviewed_at,
        verification_status: 'verified',
        verification_note: `Engine result matches approved golden fixture ${fixture.case_id}.`,
        verification_confidence: 'high',
        verification_run_at: fixture.reviewed_at,
        review_status: 'reviewed',
        reviewed_at: fixture.reviewed_at,
        review_notes: fixture.review_notes,
        publication_status: 'published',
        source_provenance: {
          caseId: fixture.case_id,
          sourceRef: fixture.source.ref,
          councilReviewer: fixture.reviewed_by,
          effectiveFrom: fixture.effective_from,
        },
        computed_latitude: fixture.location.lat,
        computed_longitude: fixture.location.lon,
        computed_timezone: fixture.location.tz,
        rule_version: RULE_ENGINE_VERSION,
        astronomy_version: '1.0.0',
        day_boundary_version: '1.0.0',
        reasons: (fixture.expected!.reasonCodes ?? []).map(code => ({
          code,
          text: 'Council-approved Tier-1 fixture decision.',
          details: { caseId: fixture.case_id },
        })),
        diagnostics: evaluation.publicationWithheld
          ? ['fixture_scoped_approval', `global_gate_${evaluation.withheldReason ?? 'active'}`]
          : ['fixture_scoped_approval'],
        source_refs: sourceRefs,
        __slug: fixture.festival_id,
        __anchor: anchor,
      };
      const identityKey = batchIdentityKey(row);

      return {
        public: {
          caseId: fixture.case_id,
          festivalId: fixture.festival_id,
          year: fixture.year,
          civilDate: evaluation.civilDate,
          calendarProfile: fixture.profile.calendar,
          spiritualTradition,
          variantKey,
          engineRuleKey: evaluation.ruleKey,
          engineCandidateDates: evaluation.candidateDates,
          publicationGatePreserved: evaluation.publicationWithheld,
          action: existing ? 'update' : 'insert',
        },
        row,
        existingId: existing?.id ?? null,
        identityKey,
      };
    });
}

export async function materializeApprovedCalendarPilot(
  client: any,
  commit: boolean,
): Promise<ApprovedCalendarPilotResult> {
  const writes = await planApprovedCalendarPilot(client);
  if (!commit) {
    return {
      mode: 'dry_run',
      fixtureCount: writes.length,
      inserted: 0,
      updated: 0,
      storedCount: 0,
      items: writes.map(write => write.public),
    };
  }

  const toInsert = writes.filter(write => !write.existingId).map(write => write.row);
  const toUpdate = writes
    .filter(write => write.existingId)
    .map(write => ({
      id: write.existingId!,
      patch: { ...write.row, __identityKey: write.identityKey },
    }));
  const expectedByIdentity = new Map(writes.map(write => [write.identityKey, 1]));
  const identityMeta = new Map(writes.map(write => [write.identityKey, write.row]));

  const committed = await commitOccurrencesWithBatches(client, {
    toInsert,
    toUpdate,
    toStamp: [],
    expectedByIdentity,
    identityMeta,
    versions: {
      engine: PILOT_VERSION,
      rule: RULE_ENGINE_VERSION,
      astronomy: '1.0.0',
    },
  });

  const definitionIds = [...new Set(writes.map(write => String(write.row.definition_id)))];
  const years = [...new Set(writes.map(write => Number(write.row.year)))];
  const profiles = [...new Set(writes.map(write => String(write.row.calendar_profile)))];
  const { data: stored, error } = await client
    .from('observance_occurrences')
    .select('id, definition_id, year, date, calendar_profile, spiritual_tradition, variant_key, batch_id, series_instance_key, is_primary_variant, calculated_by')
    .in('definition_id', definitionIds)
    .in('year', years)
    .in('calendar_profile', profiles)
    .eq('calculated_by', CALCULATED_BY);
  if (error) throw error;
  if ((stored ?? []).length !== writes.length) {
    throw new Error(`Approved pilot expected ${writes.length} stored rows; found ${(stored ?? []).length}`);
  }
  if ((stored ?? []).some((row: any) => !row.batch_id || !row.series_instance_key || row.is_primary_variant !== false)) {
    throw new Error('Approved pilot stored rows violate batch, instance, or read-time-primary contract');
  }

  return {
    mode: 'commit',
    fixtureCount: writes.length,
    inserted: committed.inserted,
    updated: committed.updated,
    storedCount: (stored ?? []).length,
    items: writes.map(write => write.public),
  };
}

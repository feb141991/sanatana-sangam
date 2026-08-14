import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type SourceReference } from '@sangam/dharma-rules';
import type { Database } from '@/types/database';
import { evaluateApprovedFixture } from './approved-fixture-engine';
import type { ApprovedFixtureEvaluation } from './approved-fixture-engine';
import {
  APPROVED_FIXTURE_ENGINE_VERSION,
  APPROVED_FIXTURE_WRITER,
  fixtureEligibilityReasons,
  parseCalendarProfileDecision,
  parseGoldenFixtureDecision,
  type CalendarProfileDecision,
  type GoldenFixtureDecision,
} from './approved-fixture-governance';
import { RULE_ENGINE_VERSION } from './engine';
import { batchIdentityKey, commitOccurrencesWithBatches } from './materialize';

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

interface StoredOccurrenceRow {
  id?: string;
  batch_id: string | null;
  source_provenance?: Database['public']['Tables']['observance_occurrences']['Row']['source_provenance'];
  series_instance_key: string | null;
  is_primary_variant: boolean | null;
}

export interface ApprovedFixturePlanItem {
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

export interface ApprovedFixtureMaterializationResult {
  mode: 'dry_run' | 'commit';
  approvedFixtureCount: number;
  fixtureCount: number;
  manifestHash: string;
  excluded: Array<{ caseId: string; reasons: string[] }>;
  inserted: number;
  updated: number;
  storedCount: number;
  items: ApprovedFixturePlanItem[];
}

export interface ApprovedFixtureRollbackResult {
  mode: 'dry_run' | 'commit';
  manifestHash: string;
  occurrenceCount: number;
  batchCount: number;
}

interface PlannedWrite {
  public: ApprovedFixturePlanItem;
  row: Record<string, unknown>;
  existingId: string | null;
  identityKey: string;
}

interface ApprovedFixturePlan {
  approvedFixtureCount: number;
  manifestHash: string;
  excluded: Array<{ caseId: string; reasons: string[] }>;
  writes: PlannedWrite[];
}

interface BatchRollbackUpdateQuery extends PromiseLike<{
  error: { message: string } | null;
}> {
  in(column: 'id', values: string[]): BatchRollbackUpdateQuery;
}

interface BatchRollbackTable {
  update(values: {
    status: 'failed';
    produced_row_count: 0;
    failure_reason: string;
    completed_at: null;
  }): BatchRollbackUpdateQuery;
}

function sourceReference(fixture: GoldenFixtureDecision): SourceReference {
  const page = fixture.source.citation.match(/p\.(\d+)/i)?.[1] ?? null;
  const isRashtriyaPanchang = fixture.source.citation.startsWith('Rashtriya Panchang');
  const sourceName = isRashtriyaPanchang
    ? 'Rashtriya Panchang'
    : fixture.source.citation.split(',')[0]?.trim() || fixture.source.ref;
  return {
    sourceName,
    textName: isRashtriyaPanchang ? 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.)' : sourceName,
    publisher: isRashtriyaPanchang
      ? 'Positional Astronomy Centre / India Meteorological Department, Government of India'
      : null,
    edition: isRashtriyaPanchang ? 'English edition' : null,
    pageOrSection: page ? `printed p.${page}` : fixture.source.ref,
    tier: fixture.source.tier as 1,
    tradition: isRashtriyaPanchang ? 'Hindu' : null,
    region: isRashtriyaPanchang ? 'India' : null,
    scholarNotes: fixture.source.citation,
    copyrightStatus: isRashtriyaPanchang ? 'government_publication' : null,
    usagePermitted: isRashtriyaPanchang ? 'citation_and_factual_date_reference' : null,
    url: null,
  };
}

function coordinateMatches(left: number | null, right: number): boolean {
  return typeof left === 'number' && Math.abs(left - right) < 0.000001;
}

function profileTradition(fixture: GoldenFixtureDecision): string | null {
  return fixture.profile.tradition === 'unspecified' ? null : fixture.profile.tradition;
}

function groupKey(fixture: GoldenFixtureDecision): string {
  const { location, profile } = fixture;
  return [fixture.festivalId, fixture.year, profile.calendar, location.lat, location.lon, location.tz].join('|');
}

function manifestHash(
  fixtures: GoldenFixtureDecision[],
  profiles: Map<string, CalendarProfileDecision>,
  excluded: Array<{ caseId: string; reasons: string[] }>,
  evaluations: Map<string, ApprovedFixtureEvaluation>,
): string {
  const excludedByCaseId = new Map(excluded.map(item => [item.caseId, item.reasons]));
  const payload = fixtures
    .map(fixture => {
      const profile = profiles.get(fixture.profile.calendar);
      return {
        caseId: fixture.caseId,
        festivalId: fixture.festivalId,
        year: fixture.year,
        location: fixture.location,
        fixtureProfile: fixture.profile,
        civilDate: fixture.expected?.civilDate ?? null,
        reasonCodes: fixture.expected?.reasonCodes ?? [],
        source: fixture.source,
        reviewedBy: fixture.reviewedBy,
        reviewedAt: fixture.reviewedAt,
        reviewNotes: fixture.reviewNotes,
        effectiveFrom: fixture.effectiveFrom,
        profile: profile
          ? {
              slug: profile.slug,
              monthSystem: profile.monthSystem,
              version: profile.version,
              scholarlyStatus: profile.scholarlyStatus,
              reviewedBy: profile.reviewedBy,
              reviewedAt: profile.reviewedAt,
              effectiveFrom: profile.effectiveFrom,
            }
          : null,
        engine: {
          materializerVersion: APPROVED_FIXTURE_ENGINE_VERSION,
          ruleVersion: RULE_ENGINE_VERSION,
          evaluation: evaluations.get(fixture.caseId) ?? null,
        },
        eligibility: excludedByCaseId.get(fixture.caseId) ?? [],
      };
    })
    .sort((left, right) => left.caseId.localeCompare(right.caseId));
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function planApprovedFixtures(
  client: SupabaseClient<Database>,
): Promise<ApprovedFixturePlan> {
  const { data: fixtureData, error: fixtureError } = await client
    .from('golden_fixtures')
    .select('case_id, festival_id, year, location, profile, expected, source, approved, reviewed_by, reviewed_at, review_notes, effective_from')
    .eq('approved', true);
  if (fixtureError) throw fixtureError;
  const fixtures = (fixtureData ?? [])
    .map(parseGoldenFixtureDecision)
    .sort((left, right) => left.caseId.localeCompare(right.caseId));
  if (fixtures.length === 0) {
    throw new Error('No council-approved golden fixtures exist');
  }

  const today = new Date().toISOString().slice(0, 10);
  const profileSlugs = [...new Set(fixtures.map(row => row.profile.calendar))];
  const { data: profileData, error: profileError } = await client
    .from('calendar_profiles')
    .select('slug, month_system, version, scholarly_status, reviewed_by, reviewed_at, effective_from')
    .in('slug', profileSlugs);
  if (profileError) throw profileError;
  const profileBySlug = new Map(
    (profileData ?? [])
      .map(parseCalendarProfileDecision)
      .map(profile => [profile.slug, profile]),
  );

  const excluded = fixtures
    .map(fixture => ({
      caseId: fixture.caseId,
      reasons: fixtureEligibilityReasons(fixture, profileBySlug.get(fixture.profile.calendar), today),
    }))
    .filter(item => item.reasons.length > 0);
  const evaluationByCaseId = new Map<string, ApprovedFixtureEvaluation>();
  const initiallyExcludedCaseIds = new Set(excluded.map(item => item.caseId));
  for (const fixture of fixtures.filter(item => !initiallyExcludedCaseIds.has(item.caseId))) {
    const profile = profileBySlug.get(fixture.profile.calendar);
    if (!profile?.monthSystem) continue;
    try {
      evaluationByCaseId.set(fixture.caseId, evaluateApprovedFixture({
        caseId: fixture.caseId,
        festivalId: fixture.festivalId,
        year: fixture.year,
        profile: fixture.profile,
        expected: fixture.expected,
        approved: fixture.approved,
      }, profile.monthSystem));
    } catch (error) {
      excluded.push({
        caseId: fixture.caseId,
        reasons: [`engine_reproduction_failed:${error instanceof Error ? error.message : 'unknown_error'}`],
      });
    }
  }
  excluded.sort((left, right) => left.caseId.localeCompare(right.caseId));
  const excludedCaseIds = new Set(excluded.map(item => item.caseId));
  const eligibleFixtures = fixtures.filter(fixture => !excludedCaseIds.has(fixture.caseId));
  const decisionManifestHash = manifestHash(
    fixtures,
    profileBySlug,
    excluded,
    evaluationByCaseId,
  );

  if (eligibleFixtures.length === 0) {
    return {
      approvedFixtureCount: fixtures.length,
      manifestHash: decisionManifestHash,
      excluded,
      writes: [],
    };
  }

  const slugs = [...new Set(eligibleFixtures.map(row => row.festivalId))];
  const { data: definitionData, error: definitionError } = await client
    .from('observance_definitions')
    .select('id, slug')
    .in('slug', slugs);
  if (definitionError) throw definitionError;
  const definitions = (definitionData ?? []) as unknown as DefinitionRow[];
  const definitionBySlug = new Map(
    definitions.map(definition => [definition.slug, definition]),
  );
  if (definitionBySlug.size !== slugs.length) {
    throw new Error(`Approved fixture definitions are incomplete: expected ${slugs.length}, found ${definitionBySlug.size}`);
  }

  const definitionIds = [...definitionBySlug.values()].map(definition => definition.id);
  const years = [...new Set(eligibleFixtures.map(row => row.year))];
  const { data: existingData, error: existingError } = await client
    .from('observance_occurrences')
    .select('id, definition_id, year, date, calendar_profile, spiritual_tradition, variant_key, computed_latitude, computed_longitude, computed_timezone, calculated_by, locked_for_regeneration, manual_date_override, final_date_source')
    .in('definition_id', definitionIds)
    .in('year', years)
    .in('calendar_profile', profileSlugs);
  if (existingError) throw existingError;
  const existingRows = (existingData ?? []) as ExistingOccurrenceRow[];

  const anchorByGroup = new Map<string, string>();
  for (const fixture of eligibleFixtures) {
    const key = groupKey(fixture);
    const date = fixture.expected?.civilDate;
    if (!date) throw new Error(`Eligible fixture ${fixture.caseId} has no civil date`);
    const current = anchorByGroup.get(key);
    if (!current || date < current) anchorByGroup.set(key, date);
  }

  const writes = eligibleFixtures
    .map(fixture => {
      const profile = profileBySlug.get(fixture.profile.calendar);
      if (!profile?.monthSystem) {
        throw new Error(`Eligible fixture ${fixture.caseId} has no approved month system`);
      }

      const evaluation = evaluationByCaseId.get(fixture.caseId);
      if (!evaluation) throw new Error(`Eligible fixture ${fixture.caseId} has no engine evaluation`);

      const definition = definitionBySlug.get(fixture.festivalId);
      if (!definition) throw new Error(`Definition ${fixture.festivalId} disappeared during planning`);
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
        throw new Error(`Fixture ${fixture.caseId} has ${matches.length} stored rows for one materialisation identity`);
      }
      const existing = matches[0] ?? null;
      if (existing && existing.calculated_by !== APPROVED_FIXTURE_WRITER) {
        throw new Error(`Fixture ${fixture.caseId} would overwrite a row owned by ${existing.calculated_by}`);
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
        calculation_version: APPROVED_FIXTURE_ENGINE_VERSION,
        calculated_by: APPROVED_FIXTURE_WRITER,
        manual_date_override: null,
        manual_override_reason: null,
        locked_for_regeneration: true,
        final_date_source: 'calculation_engine_reviewed',
        audit_status: 'completed',
        audit_failure_reason: null,
        audit_retry_count: 0,
        last_audited_at: fixture.reviewedAt,
        verification_status: 'verified',
        verification_note: `Engine result matches approved golden fixture ${fixture.caseId}.`,
        verification_confidence: 'high',
        verification_run_at: fixture.reviewedAt,
        review_status: 'reviewed',
        reviewed_at: fixture.reviewedAt,
        review_notes: fixture.reviewNotes,
        publication_status: 'published',
        source_provenance: {
          caseId: fixture.caseId,
          sourceRef: fixture.source.ref,
          councilReviewer: fixture.reviewedBy,
          effectiveFrom: fixture.effectiveFrom,
          approvalManifestHash: decisionManifestHash,
        },
        computed_latitude: fixture.location.lat,
        computed_longitude: fixture.location.lon,
        computed_timezone: fixture.location.tz,
        rule_version: RULE_ENGINE_VERSION,
        astronomy_version: '1.0.0',
        day_boundary_version: '1.0.0',
        reasons: (fixture.expected?.reasonCodes ?? []).map(code => ({
          code,
          text: 'Council-approved Tier-1 fixture decision.',
          details: { caseId: fixture.caseId },
        })),
        diagnostics: evaluation.publicationWithheld
          ? ['fixture_scoped_approval', `global_gate_${evaluation.withheldReason ?? 'active'}`]
          : ['fixture_scoped_approval'],
        source_refs: sourceRefs,
        __slug: fixture.festivalId,
        __anchor: anchor,
      };
      const identityKey = batchIdentityKey(row);

      return {
        public: {
          caseId: fixture.caseId,
          festivalId: fixture.festivalId,
          year: fixture.year,
          civilDate: evaluation.civilDate,
          calendarProfile: fixture.profile.calendar,
          spiritualTradition,
          variantKey,
          engineRuleKey: evaluation.ruleKey,
          engineCandidateDates: evaluation.candidateDates,
          publicationGatePreserved: evaluation.publicationWithheld,
          action: existing ? 'update' as const : 'insert' as const,
        },
        row,
        existingId: existing?.id ?? null,
        identityKey,
      };
    });

  return {
    approvedFixtureCount: fixtures.length,
    manifestHash: decisionManifestHash,
    excluded,
    writes,
  };
}

export async function materializeApprovedFixtures(
  client: SupabaseClient<Database>,
  options: { commit: boolean; expectedManifestHash?: string },
): Promise<ApprovedFixtureMaterializationResult> {
  const plan = await planApprovedFixtures(client);
  const { writes } = plan;
  if (!options.commit) {
    return {
      mode: 'dry_run',
      approvedFixtureCount: plan.approvedFixtureCount,
      fixtureCount: writes.length,
      manifestHash: plan.manifestHash,
      excluded: plan.excluded,
      inserted: 0,
      updated: 0,
      storedCount: 0,
      items: writes.map(write => write.public),
    };
  }
  if (!options.expectedManifestHash || options.expectedManifestHash !== plan.manifestHash) {
    throw new Error(
      `Commit manifest mismatch: expected ${plan.manifestHash}, received ${options.expectedManifestHash ?? 'none'}`,
    );
  }
  if (writes.length === 0) throw new Error('Approved fixture manifest contains no eligible writes');

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
      engine: APPROVED_FIXTURE_ENGINE_VERSION,
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
    .eq('calculated_by', APPROVED_FIXTURE_WRITER);
  if (error) throw error;
  const storedRows = (stored ?? []) as unknown as StoredOccurrenceRow[];
  if (storedRows.length !== writes.length) {
    throw new Error(`Approved fixture manifest expected ${writes.length} stored rows; found ${storedRows.length}`);
  }
  if (storedRows.some(row => !row.batch_id || !row.series_instance_key || row.is_primary_variant !== false)) {
    throw new Error('Approved fixture rows violate batch, instance, or read-time-primary contract');
  }

  return {
    mode: 'commit',
    approvedFixtureCount: plan.approvedFixtureCount,
    fixtureCount: writes.length,
    manifestHash: plan.manifestHash,
    excluded: plan.excluded,
    inserted: committed.inserted,
    updated: committed.updated,
    storedCount: storedRows.length,
    items: writes.map(write => write.public),
  };
}

function provenanceManifestHash(value: StoredOccurrenceRow['source_provenance']): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const hash = value.approvalManifestHash;
  return typeof hash === 'string' ? hash : null;
}

export async function rollbackApprovedFixtureManifest(
  client: SupabaseClient<Database>,
  options: { manifestHash: string; commit: boolean },
): Promise<ApprovedFixtureRollbackResult> {
  if (!/^[a-f0-9]{64}$/.test(options.manifestHash)) {
    throw new Error('Rollback requires a lowercase SHA-256 approval manifest hash');
  }

  const { data, error } = await client
    .from('observance_occurrences')
    .select('id, batch_id, source_provenance, series_instance_key, is_primary_variant')
    .eq('calculated_by', APPROVED_FIXTURE_WRITER);
  if (error) throw error;
  const rows = ((data ?? []) as unknown as StoredOccurrenceRow[])
    .filter(row => provenanceManifestHash(row.source_provenance) === options.manifestHash);
  const occurrenceIds = rows
    .map(row => row.id)
    .filter((id): id is string => typeof id === 'string');
  const batchIds = [...new Set(
    rows.map(row => row.batch_id).filter((id): id is string => typeof id === 'string'),
  )];

  if (!options.commit) {
    return {
      mode: 'dry_run',
      manifestHash: options.manifestHash,
      occurrenceCount: occurrenceIds.length,
      batchCount: batchIds.length,
    };
  }
  if (occurrenceIds.length === 0) {
    throw new Error(`No approved-fixture rows belong to manifest ${options.manifestHash}`);
  }

  const { error: deleteError } = await client
    .from('observance_occurrences')
    .delete()
    .in('id', occurrenceIds);
  if (deleteError) throw deleteError;

  if (batchIds.length > 0) {
    const batchTable = client
      .from('observance_materialisation_batches') as unknown as BatchRollbackTable;
    const { error: batchError } = await batchTable
      .update({
        status: 'failed',
        produced_row_count: 0,
        failure_reason: `Approved fixture manifest ${options.manifestHash} rolled back.`,
        completed_at: null,
      })
      .in('id', batchIds);
    if (batchError) throw batchError;
  }

  const { data: remaining, error: remainingError } = await client
    .from('observance_occurrences')
    .select('id, batch_id, source_provenance, series_instance_key, is_primary_variant')
    .eq('calculated_by', APPROVED_FIXTURE_WRITER);
  if (remainingError) throw remainingError;
  const remainingForManifest = ((remaining ?? []) as unknown as StoredOccurrenceRow[])
    .filter(row => provenanceManifestHash(row.source_provenance) === options.manifestHash);
  if (remainingForManifest.length > 0) {
    throw new Error(`Rollback left ${remainingForManifest.length} occurrence rows for manifest ${options.manifestHash}`);
  }

  return {
    mode: 'commit',
    manifestHash: options.manifestHash,
    occurrenceCount: occurrenceIds.length,
    batchCount: batchIds.length,
  };
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationCandidateInsert } from '@/types/database';
import { getCandidateTypePipelineMode, isCandidateResolverGloballyEnabled } from '@/lib/notification-candidate-pipeline-mode';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import {
  buildFamilyRemembranceCandidates,
  type FamilyRemembranceCalendar,
  type FamilyRemembranceEvent,
  type FamilyRemembranceMembership,
  type FamilyRemembranceProfile,
} from '@/lib/kul-family-remembrance-candidate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 500;
const ID_BATCH_SIZE = 100;

function batches<T>(values: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

function candidateSemanticKey(row: Pick<NotificationCandidateInsert, 'user_id' | 'event_instance' | 'local_date' | 'audience_variant'>) {
  return `${row.user_id}:${row.event_instance}:${row.local_date}:${row.audience_variant}`;
}

async function readExistingCandidateKeys(
  supabase: SupabaseClient,
  candidates: NotificationCandidateInsert[],
): Promise<Set<string>> {
  const existingKeys = new Set<string>();
  for (const batch of batches(candidates, ID_BATCH_SIZE)) {
    const userIds = [...new Set(batch.map((candidate) => candidate.user_id))];
    const localDates = [...new Set(batch.map((candidate) => candidate.local_date))];
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.from('notification_candidates')
        .select('user_id, event_instance, local_date, audience_variant')
        .eq('event_type', 'family_remembrance')
        .eq('event_id', 'kul-family-remembrance')
        .in('user_id', userIds)
        .in('local_date', localDates)
        .order('user_id', { ascending: true })
        .order('local_date', { ascending: true })
        .order('event_instance', { ascending: true })
        .order('audience_variant', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw new Error(`Existing family-remembrance candidate query failed: ${error.message}`);
      const page = (data ?? []) as Array<Pick<NotificationCandidateInsert, 'user_id' | 'event_instance' | 'local_date' | 'audience_variant'>>;
      for (const row of page) existingKeys.add(candidateSemanticKey(row));
      if (page.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }
  return existingKeys;
}

async function readRowsForIds<T>(
  supabase: SupabaseClient,
  table: 'kul_members' | 'kuls' | 'kul_events' | 'kul_family_members',
  select: string,
  foreignKey: 'user_id' | 'kul_id' | 'id',
  ids: string[],
  extraFilter?: { equals?: Array<[string, string | boolean]>; notNull?: string },
): Promise<T[]> {
  const results: T[] = [];
  for (const idBatch of batches(ids, ID_BATCH_SIZE)) {
    let lastId: string | null = null;
    for (;;) {
      let query = supabase.from(table).select(select).in(foreignKey, idBatch).order('id', { ascending: true }).limit(PAGE_SIZE);
      for (const [column, value] of extraFilter?.equals ?? []) query = query.eq(column, value);
      if (extraFilter?.notNull) query = query.not(extraFilter.notNull, 'is', null);
      if (lastId) query = query.gt('id', lastId);
      const { data, error } = await query;
      if (error) throw new Error(`${table} query failed: ${error.message}`);
      const page = (data ?? []) as unknown as T[];
      results.push(...page);
      if (page.length < PAGE_SIZE) break;
      const last = page[page.length - 1] as { id?: unknown };
      if (typeof last.id !== 'string') throw new Error(`${table} pagination returned no id`);
      lastId = last.id;
    }
  }
  return results;
}

async function readOptedInProfiles(supabase: SupabaseClient): Promise<FamilyRemembranceProfile[]> {
  const profiles: FamilyRemembranceProfile[] = [];
  let lastId: string | null = null;
  for (;;) {
    let query = supabase.from('profiles')
      .select('id, timezone, app_language, wants_family_remembrance_reminders, family_remembrance_time, family_remembrance_opt_in_generation, notification_quiet_hours_start, notification_quiet_hours_end')
      .eq('wants_family_remembrance_reminders', true)
      .or('is_deleting.is.null,is_deleting.eq.false')
      .order('id', { ascending: true })
      .limit(PAGE_SIZE);
    if (lastId) query = query.gt('id', lastId);
    const { data, error } = await query;
    if (error) throw new Error(`Opted-in profile query failed: ${error.message}`);
    const page = (data ?? []) as unknown as FamilyRemembranceProfile[];
    profiles.push(...page);
    if (page.length < PAGE_SIZE) break;
    lastId = page[page.length - 1].id;
  }
  return profiles;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pipelineMode = getCandidateTypePipelineMode('family_remembrance');
  const resolverEnabled = isCandidateResolverGloballyEnabled();
  if (pipelineMode !== 'candidate' || !resolverEnabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'family_remembrance_candidate_pipeline_not_enabled',
      pipelineMode,
      resolverEnabled,
    });
  }

  const safety = getNotificationSafetyState('family_remembrance', request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Missing Supabase environment' }, { status: 500 });

  const supabase = createClient(url, serviceKey);
  try {
    const profiles = await readOptedInProfiles(supabase);
    if (profiles.length === 0) {
      return NextResponse.json({ success: true, pipeline_mode: 'candidate', optedInProfiles: 0, candidatesCreated: 0 });
    }

    const memberships = await readRowsForIds<FamilyRemembranceMembership>(
      supabase, 'kul_members', 'id, user_id, kul_id', 'user_id', profiles.map((profile) => profile.id),
    );
    const kulIds = [...new Set(memberships.map((membership) => membership.kul_id))];
    if (kulIds.length === 0) {
      return NextResponse.json({ success: true, pipeline_mode: 'candidate', optedInProfiles: profiles.length, kulMemberships: 0, candidatesCreated: 0 });
    }

    const [calendarRows, eventRows, deceasedRows] = await Promise.all([
      readRowsForIds<FamilyRemembranceCalendar>(
        supabase, 'kuls', 'id, remembrance_generation, calendar_latitude, calendar_longitude, calendar_timezone, calendar_reference_label, calendar_month_system', 'id', kulIds,
      ),
      readRowsForIds<FamilyRemembranceEvent>(
        supabase, 'kul_events', 'id, remembrance_generation, kul_id, member_id, event_date, recurring, date_system, masa, paksha, tithi, month_system, masa_is_adhika', 'kul_id', kulIds,
        { equals: [['event_type', 'death_anniversary'], ['recurring', true]], notNull: 'member_id' },
      ),
      readRowsForIds<{ id: string; kul_id: string; remembrance_generation: number }>(
        supabase, 'kul_family_members', 'id, kul_id, remembrance_generation', 'kul_id', kulIds,
        { equals: [['is_alive', false]] },
      ),
    ]);

    const memberGenerationByKulAndId = new Map(
      deceasedRows.map((member) => [`${member.kul_id}:${member.id}`, member.remembrance_generation]),
    );
    const eventsWithMemberGeneration = eventRows.map((event) => ({
      ...event,
      member_remembrance_generation: memberGenerationByKulAndId.get(`${event.kul_id}:${event.member_id}`) ?? 0,
    }));
    const built = buildFamilyRemembranceCandidates({
      profiles,
      memberships,
      calendars: calendarRows,
      events: eventsWithMemberGeneration,
      deceasedMemberIds: new Set(deceasedRows.map((member) => `${member.kul_id}:${member.id}`)),
      now: new Date(),
    });
    const candidates: NotificationCandidateInsert[] = built.candidates;
    const existingKeys = await readExistingCandidateKeys(supabase, candidates);
    const newCandidates = candidates.filter((candidate) => !existingKeys.has(candidateSemanticKey(candidate)));

    if (safety.isDryRun || safety.skipDelivery) {
      return NextResponse.json(buildNotificationSafetyResponse('family_remembrance', safety, {
        eligibleCount: candidates.length,
        skippedCount: built.unresolvedCount + built.skippedScheduleCount,
        wouldInsertCount: newCandidates.length,
        wouldSendCount: 0,
      }));
    }

    let candidatesCreated = 0;
    for (const batch of batches(newCandidates, ID_BATCH_SIZE)) {
      const { data, error } = await supabase.from('notification_candidates').upsert(batch, {
        onConflict: 'user_id,event_type,event_id,event_instance,local_date,audience_variant',
        ignoreDuplicates: true,
      }).select('id');
      if (error) throw new Error(`Family remembrance candidate insert failed: ${error.message}`);
      candidatesCreated += data?.length ?? 0;
    }

    if (built.unresolvedCount > 0 || built.skippedScheduleCount > 0) {
      console.warn('[kul-family-remembrance] candidates skipped', {
        unresolvedCount: built.unresolvedCount,
        skippedScheduleCount: built.skippedScheduleCount,
      });
    }
    console.info('[kul-family-remembrance] producer completed', {
      optedInProfiles: profiles.length,
      kulMemberships: memberships.length,
      candidatesConsidered: candidates.length,
      duplicateCandidatesSkipped: candidates.length - newCandidates.length,
      candidatesCreated,
      unresolvedCount: built.unresolvedCount,
      skippedScheduleCount: built.skippedScheduleCount,
    });

    return NextResponse.json({
      success: true,
      pipeline_mode: 'candidate',
      optedInProfiles: profiles.length,
      kulMemberships: memberships.length,
      candidatesConsidered: candidates.length,
      duplicateCandidatesSkipped: candidates.length - newCandidates.length,
      candidatesCreated,
      unresolvedCount: built.unresolvedCount,
      skippedScheduleCount: built.skippedScheduleCount,
    });
  } catch (error) {
    console.error('[kul-family-remembrance] producer failed', error);
    return NextResponse.json({ error: 'Family remembrance candidate generation failed' }, { status: 503 });
  }
}

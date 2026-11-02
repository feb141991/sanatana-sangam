import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationCandidateInsert } from '@/types/database';
import { getCandidateTypePipelineMode, isCandidateResolverGloballyEnabled } from '@/lib/notification-candidate-pipeline-mode';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import {
  buildSanskaraReminderCandidates,
  SANSKARA_EVENT_TYPE,
  withSanskaraWording,
  type SanskaraDueRow,
} from '@/lib/sanskara-reminder-candidate';
import {
  buildSanskaraHandoverCandidates,
  withSanskaraHandoverWording,
  type SanskaraHandoverDueRow,
} from '@/lib/sanskara-handover-candidate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Upper bound on one run. The selector orders by reminder time, so a backlog is the earliest-due first and the rest follows
// on the next run (hourly).
const MAX_ROWS_PER_RUN = 1000;

type InsertOutcome =
  | { outcome: 'created'; reworded: boolean }
  | { outcome: 'duplicate' }
  | { outcome: 'refused'; reason: string };

/**
 * Inserts one candidate. The insert trigger refuses text that repeats the person's name, which the producer cannot know, so
 * on that one answer the next generic wording is tried (the trigger judges each attempt itself). Any other refusal is final
 * for this run. 23514 and 23505 are answers; every other database error is thrown.
 */
async function insertWithWordings(
  supabase: SupabaseClient,
  first: NotificationCandidateInsert,
  reword: (candidate: NotificationCandidateInsert, variant: number) => NotificationCandidateInsert | null,
): Promise<InsertOutcome> {
  let candidate: NotificationCandidateInsert | null = first;
  for (let variant = 0; candidate; variant += 1) {
    const { error } = await supabase.from('notification_candidates').insert(candidate);
    if (!error) return { outcome: 'created', reworded: variant > 0 };
    if (error.code === '23505') return { outcome: 'duplicate' };
    if (error.code !== '23514') throw new Error(`Sanskara candidate insert failed (${error.code ?? 'no code'})`);
    // The trigger's fixed messages (sanskara_candidate_*) describe a rule, never a person.
    const reason = /^sanskara_candidate_[a-z_]+$/.test(error.message) ? error.message : 'sanskara_candidate_refused';
    if (reason !== 'sanskara_candidate_not_discreet') return { outcome: 'refused', reason };
    candidate = reword(first, variant + 1);
    if (!candidate) return { outcome: 'refused', reason };
  }
  return { outcome: 'refused', reason: 'sanskara_candidate_refused' };
}

type Tally = { created: number; reworded: number; duplicates: number; refused: number; refusedReasons: Record<string, number> };

async function createAll(
  supabase: SupabaseClient,
  candidates: NotificationCandidateInsert[],
  reword: (candidate: NotificationCandidateInsert, variant: number) => NotificationCandidateInsert | null,
): Promise<Tally> {
  const tally: Tally = { created: 0, reworded: 0, duplicates: 0, refused: 0, refusedReasons: {} };
  for (const candidate of candidates) {
    const result = await insertWithWordings(supabase, candidate, reword);
    if (result.outcome === 'created') { tally.created += 1; if (result.reworded) tally.reworded += 1; }
    else if (result.outcome === 'duplicate') tally.duplicates += 1;
    else { tally.refused += 1; tally.refusedReasons[result.reason] = (tally.refusedReasons[result.reason] ?? 0) + 1; }
  }
  return tally;
}

/**
 * Creates a notification candidate for each Sanskara reminder, and each hand-over notice, that has become due.
 *
 * Selection is `sanskara_reminders_due()` (access decided by `sanskara_can`, not here). Each insert is validated by the
 * `sanskara_validate_candidate` trigger against the live subscription, record version, opt-in and access, and refused
 * with 23514 if any of them moved since the selection. A refusal is the expected answer to a change made in that gap, so it
 * is counted and the run goes on; it is not an error. Any other database error stops the run (503).
 * The dispatcher re-checks `sanskara_reminder_still_valid` (reminders) or `sanskara_handover_still_valid` (hand-over notices)
 * again immediately before sending.
 *
 * Off unless NOTIFICATION_RESOLVER_ENABLED is true and NOTIFICATION_CANDIDATE_MODE_SANSKAR_MILESTONE is `candidate`.
 * Nothing in the response or the logs names a person, a record or an id.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pipelineMode = getCandidateTypePipelineMode(SANSKARA_EVENT_TYPE);
  const resolverEnabled = isCandidateResolverGloballyEnabled();
  if (pipelineMode !== 'candidate' || !resolverEnabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'sanskara_candidate_pipeline_not_enabled',
      pipelineMode,
      resolverEnabled,
    });
  }

  const safety = getNotificationSafetyState(SANSKARA_EVENT_TYPE, request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Missing Supabase environment' }, { status: 500 });

  const supabase = createClient(url, serviceKey);
  try {
    const now = new Date();
    const { data, error } = await supabase.rpc('sanskara_reminders_due').limit(MAX_ROWS_PER_RUN);
    if (error) throw new Error(`sanskara_reminders_due failed (${error.code ?? 'no code'})`);
    const rows = (data ?? []) as SanskaraDueRow[];
    const built = buildSanskaraReminderCandidates(rows, now);

    // The hand-over notices: the same event type and gates, a disjoint key space, their own selector and validator.
    const { data: handoverData, error: handoverError } = await supabase.rpc('sanskara_handover_due').limit(MAX_ROWS_PER_RUN);
    // The function is created by migration 20261103110000. Until it is applied PostgREST answers PGRST202 (or Postgres 42883):
    // that skips only this phase, so the milestone reminders keep running whichever of the code and the migration ships first.
    // Any other failure is real and stops the run.
    const handoverNotDeployed = handoverError?.code === 'PGRST202' || handoverError?.code === '42883';
    if (handoverError && !handoverNotDeployed) throw new Error(`sanskara_handover_due failed (${handoverError.code ?? 'no code'})`);
    const handoverRows = (handoverNotDeployed ? [] : (handoverData ?? [])) as SanskaraHandoverDueRow[];
    const handoverBuilt = buildSanskaraHandoverCandidates(handoverRows, now);

    if (safety.isDryRun || safety.skipDelivery) {
      return NextResponse.json(buildNotificationSafetyResponse(SANSKARA_EVENT_TYPE, safety, {
        eligibleCount: rows.length + handoverRows.length,
        skippedCount: built.malformedCount + built.outsideHorizonCount + handoverBuilt.malformedCount + handoverBuilt.outsideHorizonCount,
        wouldInsertCount: built.candidates.length + handoverBuilt.candidates.length,
        wouldSendCount: 0,
      }));
    }

    const reminders = await createAll(supabase, built.candidates, withSanskaraWording);
    const handover = await createAll(supabase, handoverBuilt.candidates, withSanskaraHandoverWording);

    const summary = {
      due: rows.length,
      truncated: rows.length >= MAX_ROWS_PER_RUN,
      malformed: built.malformedCount,
      outsideHorizon: built.outsideHorizonCount,
      ...reminders,
      handover: {
        selectorDeployed: !handoverNotDeployed,
        due: handoverRows.length,
        truncated: handoverRows.length >= MAX_ROWS_PER_RUN,
        malformed: handoverBuilt.malformedCount,
        outsideHorizon: handoverBuilt.outsideHorizonCount,
        ...handover,
      },
    };
    const notCreated = built.malformedCount + reminders.refused + handoverBuilt.malformedCount + handover.refused;
    if (notCreated > 0 || summary.truncated || summary.handover.truncated) console.warn('[sanskara-reminders] rows not created', summary);
    console.info('[sanskara-reminders] producer completed', summary);
    return NextResponse.json({ success: true, pipeline_mode: 'candidate', ...summary });
  } catch (error) {
    console.error('[sanskara-reminders] producer failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Sanskara reminder generation failed' }, { status: 503 });
  }
}

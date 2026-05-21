import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { attachFestivalTrust, mapOccurrenceToFestival, getFallbackFestivalCalendar, type FestivalSourceRow } from '@/lib/festivals';
import { verifyFestivalDatesWithAI, type VerificationReport } from '@/lib/festival-verify';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import type { Database } from '@/types/database';

type LegacyFestivalRow = Pick<
  Database['public']['Tables']['festivals']['Row'],
  | 'id'
  | 'name'
  | 'date'
  | 'emoji'
  | 'description'
  | 'type'
  | 'tradition'
  | 'year'
  | 'source_name'
  | 'source_kind'
  | 'review_status'
  | 'verification_status'
  | 'verification_confidence'
  | 'verification_note'
  | 'suggested_date'
  | 'verification_run_at'
  | 'verification_type'
>;

const LEGACY_FESTIVAL_SELECT = 'id, name, date, emoji, description, type, tradition, year, source_name, source_kind, review_status, verification_status, verification_confidence, verification_note, suggested_date, verification_run_at, verification_type';

function isMissingObservanceModel(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /observance_occurrences|observance_definitions/i.test(message);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const year = new Date().getFullYear();
  const supabase = createAdminClient() as any;

  let report: VerificationReport;
  let usedFallback = false;

  try {
    const occRows = await supabase
      .from('observance_occurrences')
      .select('*, observance_definitions(*)')
      .eq('year', year)
      .order('date', { ascending: true });

    let festivals = getFallbackFestivalCalendar(year);
    let dbRows: any[] = [];
    let usingOccurrenceModel = false;

    if (!occRows.error) {
      usingOccurrenceModel = true;
      dbRows = occRows.data ?? [];
      if (dbRows.length > 0) {
        festivals = dbRows.map((row: any) => mapOccurrenceToFestival(row));
      } else {
        usedFallback = true;
      }
    } else if (isMissingObservanceModel(occRows.error)) {
      const legacyRows = await supabase
        .from('festivals')
        .select(LEGACY_FESTIVAL_SELECT)
        .eq('year', year)
        .order('date', { ascending: true });
      if (legacyRows.error) throw legacyRows.error;
      dbRows = (legacyRows.data ?? []) as LegacyFestivalRow[];
      if (dbRows.length > 0) {
        festivals = dbRows.map((row) => attachFestivalTrust(row as FestivalSourceRow));
      } else {
        usedFallback = true;
      }
    } else {
      throw occRows.error;
    }

    report = await verifyFestivalDatesWithAI(festivals, year);

    if (usingOccurrenceModel && dbRows.length > 0) {
      await Promise.all(report.results.map(async (result) => {
        const row = dbRows.find((candidate: any) => (
          candidate.id === result.id
          || (() => {
            const def = candidate.observance_definitions || {};
            return def.display_name === result.name && candidate.date === result.storedDate;
          })()
        ));
        if (!row) return;
        const requiresAiAudit = result.verificationType === 'lunar_tithi';
        const rowAuditFailed = requiresAiAudit
          && result.status === 'not_checked'
          && /AI verification unavailable|AI did not return a result|Not returned by AI/i.test(result.note);
        const nextAuditStatus = !requiresAiAudit
          ? 'skipped'
          : rowAuditFailed
            ? 'failed'
            : 'completed';
        const currentRetryCount = typeof (row as any).audit_retry_count === 'number'
          ? (row as any).audit_retry_count
          : 0;
        await supabase
          .from('observance_occurrences')
          .update({
            verification_status: result.status,
            verification_confidence: result.confidence,
            verification_note: result.note,
            suggested_date: result.suggestedDate ?? null,
            verification_run_at: report.runAt,
            audit_status: nextAuditStatus,
            audit_failure_reason: rowAuditFailed
              ? result.note
              : null,
            audit_retry_count: rowAuditFailed
              ? currentRetryCount + 1
              : 0,
            last_audited_at: report.runAt,
          })
          .eq('id', row.id);
      }));
    }
  } catch (err: any) {
    console.error('[verify-festival-dates cron] Error:', err);
    return NextResponse.json({ error: err?.message || 'Verification failed' }, { status: 500 });
  }

  const mismatches = report.results.filter((r) => r.status === 'mismatch');
  const uncertain = report.results.filter((r) => r.status === 'uncertain');
  const manualReview = report.results.filter((r) => r.status === 'manual_review');
  const allClear = mismatches.length === 0 && uncertain.length === 0;

  emitEvent({
    severity: allClear ? 'P3' : 'P1',
    domain: 'cron',
    route: '/api/cron/verify-festival-dates',
    context: {
      action: 'festival_date_verification',
      year: String(year),
      source: usedFallback ? 'fallback' : 'database',
      totalChecked: String(report.totalChecked),
      verified: String(report.verified),
      mismatches: String(report.mismatches),
      uncertain: String(report.uncertain),
      manualReview: String(report.manualReview),
      mismatchSummary: mismatches.map((m) => `${m.name}: ${m.storedDate}→${m.suggestedDate ?? '?'}`).join(' | ') || 'none',
      uncertainSummary: uncertain.map((u) => u.name).join(', ') || 'none',
      manualReviewSummary: manualReview.map((entry) => entry.name).join(', ') || 'none',
    },
  });

  if (!allClear) {
    emitError(
      'cron',
      new Error(
        `Festival calendar has ${mismatches.length} mismatch(es), ${uncertain.length} uncertain date(s), and ${manualReview.length} manual-review item(s) for ${year}.`,
      ),
      'P1',
      {
        route: '/api/cron/verify-festival-dates',
        context: {
          action: 'festival_date_mismatch',
          year: String(year),
          source: usedFallback ? 'fallback' : 'database',
        },
      },
    );
  }

  return NextResponse.json({
    message: allClear
      ? `All ${report.totalChecked} AI-checkable festival dates verified`
      : `Found ${mismatches.length} mismatch(es), ${uncertain.length} uncertain date(s), and ${manualReview.length} manual-review item(s)`,
    source: usedFallback ? 'fallback' : 'database',
    report,
  });
}

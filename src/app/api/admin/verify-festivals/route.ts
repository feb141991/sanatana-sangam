import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import { attachFestivalTrust, mapOccurrenceToFestival, getFallbackFestivalCalendar, type FestivalSourceRow } from '@/lib/festivals';
import { verifyFestivalDatesWithAI } from '@/lib/festival-verify';
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

export async function POST(req: Request) {
  const adminCheck = await requireAdminAccess();
  if ('response' in adminCheck) {
    return adminCheck.response;
  }

  let year = new Date().getFullYear();
  try {
    const body = await req.json();
    if (body?.year && typeof body.year === 'number') year = body.year;
  } catch {
    // keep default year
  }

  try {
    const occRows = await adminCheck.supabase
      .from('observance_occurrences')
      .select('*, observance_definitions(*)')
      .eq('year', year)
      .order('date', { ascending: true });

    let festivals = getFallbackFestivalCalendar(year);
    let source: 'database' | 'fallback' = 'fallback';
    let dbRows: any[] = [];
    let usingOccurrenceModel = false;

    if (!occRows.error) {
      usingOccurrenceModel = true;
      dbRows = occRows.data ?? [];
      if (dbRows.length > 0) {
        festivals = dbRows.map((row) => mapOccurrenceToFestival(row));
        source = 'database';
      }
    } else if (isMissingObservanceModel(occRows.error)) {
      const legacyRows = await adminCheck.supabase
        .from('festivals')
        .select(LEGACY_FESTIVAL_SELECT)
        .eq('year', year)
        .order('date', { ascending: true });

      if (legacyRows.error) throw legacyRows.error;

      dbRows = (legacyRows.data ?? []) as LegacyFestivalRow[];
      if (dbRows.length > 0) {
        festivals = dbRows.map((row) => attachFestivalTrust(row as FestivalSourceRow));
        source = 'database';
      }
    } else {
      throw occRows.error;
    }

    const report = await verifyFestivalDatesWithAI(festivals, year);

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
        const nextAuditStatus = requiresAiAudit
          ? (report.auditStatus === 'failed' ? 'failed' : 'completed')
          : 'skipped';
        const currentRetryCount = typeof (row as any).audit_retry_count === 'number'
          ? (row as any).audit_retry_count
          : 0;
        await adminCheck.supabase
          .from('observance_occurrences')
          .update({
            verification_status: result.status,
            verification_confidence: result.confidence,
            verification_note: result.note,
            suggested_date: result.suggestedDate ?? null,
            verification_run_at: report.runAt,
            audit_status: nextAuditStatus,
            audit_failure_reason: requiresAiAudit && report.auditStatus === 'failed'
              ? (report.auditFailureReason ?? 'AI verification unavailable')
              : null,
            audit_retry_count: requiresAiAudit && report.auditStatus === 'failed'
              ? currentRetryCount + 1
              : 0,
            last_audited_at: report.runAt,
          })
          .eq('id', row.id);
      }));
    }

    return NextResponse.json({
      ...report,
      source,
    });
  } catch (err: any) {
    console.error('[verify-festivals] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Verification failed' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { attachFestivalTrust, getFallbackFestivalCalendar, type FestivalSourceRow } from '@/lib/festivals';
import { verifyFestivalDatesWithAI, type VerificationReport } from '@/lib/festival-verify';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import type { Database } from '@/types/database';

type FestivalVerificationRow = Pick<
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
>;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const year = new Date().getFullYear();
  const supabase = createAdminClient();

  let report: VerificationReport;
  let usedFallback = false;

  try {
    const { data: rows, error } = await supabase
      .from('festivals')
      .select('id, name, date, emoji, description, type, tradition, year, source_name, source_kind, review_status')
      .eq('year', year)
      .order('date', { ascending: true });

    if (error) throw error;

    const dbRows = (rows ?? []) as FestivalVerificationRow[];
    const festivals = dbRows.length > 0
      ? dbRows.map((row) => attachFestivalTrust(row as FestivalSourceRow))
      : getFallbackFestivalCalendar(year);
    usedFallback = dbRows.length === 0;

    report = await verifyFestivalDatesWithAI(festivals, year);

    if (dbRows.length > 0) {
      await Promise.all(report.results.map(async (result) => {
        const row = dbRows.find((candidate) => (
          candidate.name === result.name && candidate.date === result.storedDate
        ));
        if (!row) return;
        await (supabase
          .from('festivals') as any)
          .update({
            verification_status: result.status,
            verification_confidence: result.confidence,
            verification_note: result.note,
            suggested_date: result.suggestedDate ?? null,
            verification_run_at: report.runAt,
            verification_type: result.verificationType,
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

import { NextResponse } from 'next/server';
import { FESTIVALS_2026 } from '@/lib/festivals';
import { verifyFestivalDatesWithAI, type VerificationReport } from '@/lib/festival-verify';
import { emitEvent, emitError } from '@/lib/monitoring/events';

// ─── Festival Date Verification Cron ─────────────────────────────────────────
// Schedule: 0 8 5 1 *  (8 AM UTC, 5th January every year)
//
// Runs once a year — early January, well before any major festivals — so any
// date errors in the hardcoded festival calendar can be caught and corrected
// before they affect users.
//
// Flow:
//   1. Calls verifyFestivalDatesWithAI() against FESTIVALS_YYYY
//   2. If mismatches found → sends a push notification to admin + logs to console
//   3. Full report is returned in the response for manual review
//
// The admin can also trigger this on demand from the Festival Manager tab.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const year = new Date().getFullYear();

  // Pick festival list for current year (extend when 2027+ lists are added)
  const festivals = FESTIVALS_2026;

  let report: VerificationReport;
  try {
    report = await verifyFestivalDatesWithAI(festivals, year);
  } catch (err: any) {
    console.error('[verify-festival-dates cron] Error:', err);
    return NextResponse.json({ error: err?.message || 'Verification failed' }, { status: 500 });
  }

  const mismatches = report.results.filter(r => r.status === 'mismatch');
  const uncertain  = report.results.filter(r => r.status === 'uncertain');
  const allClear   = mismatches.length === 0 && uncertain.length === 0;

  // Emit to monitoring events (visible in /admin logs + sadhana_events table)
  emitEvent({
    severity: allClear ? 'P3' : 'P1',
    domain: 'cron',
    route: '/api/cron/verify-festival-dates',
    context: {
      action: 'festival_date_verification',
      year: String(year),
      totalChecked: String(report.totalChecked),
      verified: String(report.verified),
      mismatches: String(report.mismatches),
      uncertain: String(report.uncertain),
      mismatchSummary: mismatches.map(m => `${m.name}: ${m.storedDate}→${m.suggestedDate ?? '?'}`).join(' | ') || 'none',
      uncertainSummary: uncertain.map(u => u.name).join(', ') || 'none',
    },
  });

  if (!allClear) {
    emitError(
      'cron',
      new Error(
        `Festival calendar has ${mismatches.length} mismatch(es) and ${uncertain.length} uncertain date(s) for ${year}. ` +
        `Mismatches: ${mismatches.map(m => `${m.name} (stored ${m.storedDate} → ${m.suggestedDate ?? '?'})`).join('; ')}`
      ),
      'P1',
      { route: '/api/cron/verify-festival-dates', context: { action: 'festival_date_mismatch', year: String(year) } }
    );
  }

  return NextResponse.json({
    message: mismatches.length === 0 && uncertain.length === 0
      ? `All ${report.totalChecked} lunar festival dates verified ✅`
      : `Found ${mismatches.length} mismatch(es) and ${uncertain.length} uncertain date(s) — review needed`,
    report,
  });
}

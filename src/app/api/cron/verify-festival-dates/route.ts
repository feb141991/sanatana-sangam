import { NextResponse } from 'next/server';
import { FESTIVALS_2026 } from '@/lib/festivals';
import { verifyFestivalDatesWithAI, type VerificationReport } from '@/lib/festival-verify';

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

const ADMIN_EMAIL = 'career.prince@gmail.com';

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

  // Log summary
  console.log(`[verify-festival-dates] ${year} — Checked: ${report.totalChecked} | ✅ ${report.verified} | ❌ ${report.mismatches} mismatches | ⚠️ ${report.uncertain} uncertain`);

  if (mismatches.length > 0) {
    console.warn('[verify-festival-dates] MISMATCHES FOUND:');
    for (const m of mismatches) {
      console.warn(`  ❌ ${m.name}: stored ${m.storedDate} → AI suggests ${m.suggestedDate ?? '?'} | ${m.note}`);
    }
  }

  if (uncertain.length > 0) {
    console.warn('[verify-festival-dates] UNCERTAIN DATES:');
    for (const u of uncertain) {
      console.warn(`  ⚠️  ${u.name}: ${u.storedDate} | ${u.note}`);
    }
  }

  // Log issues prominently — visible in Vercel function logs
  if (mismatches.length > 0 || uncertain.length > 0) {
    console.warn(
      `[verify-festival-dates] ACTION REQUIRED: ${mismatches.length} mismatch(es), ` +
      `${uncertain.length} uncertain. Check admin panel at /admin → Festival Verify. ` +
      `Admin email: ${ADMIN_EMAIL}`
    );
  }

  return NextResponse.json({
    message: mismatches.length === 0 && uncertain.length === 0
      ? `All ${report.totalChecked} lunar festival dates verified ✅`
      : `Found ${mismatches.length} mismatch(es) and ${uncertain.length} uncertain date(s) — review needed`,
    report,
  });
}

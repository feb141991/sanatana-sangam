import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import { FESTIVALS_2026 } from '@/lib/festivals';
import { verifyFestivalDatesWithAI } from '@/lib/festival-verify';

// ─── POST /api/admin/verify-festivals ─────────────────────────────────────────
// Runs AI verification of all lunar-based festival dates for the given year.
// Returns a full VerificationReport — mismatches flagged with suggested dates.
//
// Body: { year?: number }  (defaults to 2026)

export async function POST(req: Request) {
  const adminCheck = await requireAdminAccess();
  if ('response' in adminCheck) {
    return adminCheck.response;
  }

  let year = 2026;
  try {
    const body = await req.json();
    if (body?.year && typeof body.year === 'number') year = body.year;
  } catch { /* use default */ }

  // Pick the festival list for the requested year
  // Extend this when 2027 list is added
  const festivals = FESTIVALS_2026;

  try {
    const report = await verifyFestivalDatesWithAI(festivals, year);
    return NextResponse.json(report);
  } catch (err: any) {
    console.error('[verify-festivals] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Verification failed' },
      { status: 500 },
    );
  }
}

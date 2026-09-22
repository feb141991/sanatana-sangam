import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import { attachFestivalTrust, mapOccurrenceToFestival, getFallbackFestivalCalendar, type FestivalSourceRow } from '@/lib/festivals';
import { verifyFestivalDatesWithAI, buildAIUpdatePayload } from '@/lib/festival-verify';
import type { Database } from '@/types/database';

export async function POST(req: NextRequest) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

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

    if (occRows.error) throw occRows.error;
    usingOccurrenceModel = true;
    dbRows = occRows.data ?? [];
    if (dbRows.length > 0) {
      festivals = dbRows.map((row) => mapOccurrenceToFestival(row));
      source = 'database';
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
        const currentRetryCount = typeof (row as any).audit_retry_count === 'number'
          ? (row as any).audit_retry_count
          : 0;
        const updatePayload = buildAIUpdatePayload(result, report.runAt, currentRetryCount);
        await adminCheck.supabase
          .from('observance_occurrences')
          .update(updatePayload)
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

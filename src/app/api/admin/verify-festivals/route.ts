import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import { attachFestivalTrust, getFallbackFestivalCalendar, type FestivalSourceRow } from '@/lib/festivals';
import { verifyFestivalDatesWithAI } from '@/lib/festival-verify';
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
    const { data: rows, error } = await adminCheck.supabase
      .from('festivals')
      .select('id, name, date, emoji, description, type, tradition, year, source_name, source_kind, review_status')
      .eq('year', year)
      .order('date', { ascending: true });

    if (error) throw error;

    const dbRows = (rows ?? []) as FestivalVerificationRow[];
    const festivals = dbRows.length > 0
      ? dbRows.map((row) => attachFestivalTrust(row as FestivalSourceRow))
      : getFallbackFestivalCalendar(year);

    const report = await verifyFestivalDatesWithAI(festivals, year);

    if (dbRows.length > 0) {
      await Promise.all(report.results.map(async (result) => {
        const row = dbRows.find((candidate) => (
          candidate.name === result.name && candidate.date === result.storedDate
        ));
        if (!row) return;
        await adminCheck.supabase
          .from('festivals')
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

    return NextResponse.json({
      ...report,
      source: dbRows.length > 0 ? 'database' : 'fallback',
    });
  } catch (err: any) {
    console.error('[verify-festivals] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Verification failed' },
      { status: 500 },
    );
  }
}

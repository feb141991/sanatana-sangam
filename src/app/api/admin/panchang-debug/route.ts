import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import { getPanchangTimes, getTithiReminder } from '@/lib/panchang';

// ─── GET /api/admin/panchang-debug?lat=XX&lon=YY ─────────────────────────────
// Returns live Panchang engine output for a given coordinate pair.
// Used by the admin Notifications tab to verify the engine is computing correctly.

export async function GET(request: Request) {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  const url = new URL(request.url);
  const lat  = parseFloat(url.searchParams.get('lat') ?? '') || null;
  const lon  = parseFloat(url.searchParams.get('lon') ?? '') || null;

  const now = new Date();

  try {
    const times  = getPanchangTimes(now, lat ?? undefined, lon ?? undefined);
    const tithi  = getTithiReminder(times.tithiIndex, 'hindu');
    const inBrahma = now >= times.brahmaMuhurtaStart && now <= times.brahmaMuhurtaEnd;
    const inRahu   = now >= times.rahuKaalStart   && now <= times.rahuKaalEnd;

    return NextResponse.json({
      computed_at:        now.toISOString(),
      coords:             { lat: lat ?? 23.1765, lon: lon ?? 75.7885, fallback: lat == null },
      tithi:              times.tithi,
      tithiIndex:         times.tithiIndex,
      paksha:             times.paksha,
      nakshatra:          times.nakshatra,
      yoga:               times.yoga,
      brahmaMuhurta: {
        start:        times.brahmaMuhurtaStart.toISOString(),
        end:          times.brahmaMuhurtaEnd.toISOString(),
        active_now:   inBrahma,
      },
      rahuKaal: {
        start:        times.rahuKaalStart.toISOString(),
        end:          times.rahuKaalEnd.toISOString(),
        active_now:   inRahu,
      },
      abhijitMuhurta: {
        start:        times.abhijitStart.toISOString(),
        end:          times.abhijitEnd.toISOString(),
      },
      tithi_reminder:   tithi ?? null,
      would_send_nitya: inBrahma && !inRahu,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Panchang calculation failed' },
      { status: 500 }
    );
  }
}

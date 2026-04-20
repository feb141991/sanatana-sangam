import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { getPanchangTimes, getTithiReminder } from '@/lib/panchang';

// ─── GET /api/admin/panchang-debug?lat=XX&lon=YY ─────────────────────────────
// Returns live Panchang engine output for a given coordinate pair.
// Used by the admin Notifications tab to verify the engine is computing correctly.

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminSupabase = createServiceRoleSupabaseClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('is_admin, tradition, latitude, longitude')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const lat  = parseFloat(url.searchParams.get('lat') ?? '') || (profile as any).latitude  || null;
  const lon  = parseFloat(url.searchParams.get('lon') ?? '') || (profile as any).longitude || null;
  const tradition = (profile as any).tradition ?? 'hindu';

  const now = new Date();

  try {
    const times  = getPanchangTimes(now, lat, lon);
    const tithi  = getTithiReminder(times.tithiIndex, tradition);
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
      tithi_reminder:     tithi ?? null,
      would_send_nitya:   !inRahu && !inBrahma === false, // sends when in Brahma window and not in Rahu
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Panchang calculation failed' },
      { status: 500 }
    );
  }
}

import { NextResponse, type NextRequest } from 'next/server';
import { getDailyHoroscope, RASHI_LIST, findActiveDashaEntry } from '@/lib/jyotish/rashiphal-data';
import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

function normalizeRashi(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return RASHI_LIST.some((r) => r.key === normalized) ? normalized : null;
}

type DashaContextStatus = 'not_requested' | 'available' | 'unavailable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rashi = searchParams.get('rashi')?.toLowerCase();
  const dateParam = searchParams.get('date');
  const timeZone = searchParams.get('tz') ?? 'Asia/Kolkata';

  if (!rashi) {
    return NextResponse.json({ error: 'Missing rashi query parameter' }, { status: 400 });
  }

  const rashiExists = RASHI_LIST.some(r => r.key === rashi);
  if (!rashiExists) {
    return NextResponse.json({ error: `Invalid rashi sign. Must be one of: ${RASHI_LIST.map(r => r.key).join(', ')}` }, { status: 400 });
  }

  const parsedDate = dateParam ? new Date(dateParam) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date query parameter' }, { status: 400 });
  }

  // Bearer-format check, not mere presence -- a malformed/non-Bearer header
  // would fail getApiUser's own token extraction and fall through to its
  // cookie path anyway, paying for a real Auth network round trip for
  // nothing. Native never sends cookies, so this alone correctly fast-paths
  // every anonymous native request without calling getApiUser at all.
  const authHeader = request.headers.get('authorization') ?? '';
  const hasBearerCredentials = /^Bearer\s+.+/i.test(authHeader);

  let dashaContext: { planet: string; endDate: string; note: string } | null = null;
  let dashaContextStatus: DashaContextStatus = 'not_requested';

  if (hasBearerCredentials) {
    // Once credentials are supplied, default to 'unavailable' -- only the
    // exact-match success path below flips this to 'available'. This is what
    // lets the client (not just the [api-auth] server log) tell "guest" apart
    // from "signed in but personalization didn't happen," without ever
    // treating a credential failure as ordinary guest behaviour.
    dashaContextStatus = 'unavailable';
    const { user, supabase: userScopedClient } = await getApiUser(request);
    if (user && userScopedClient) {
      const requestId = request.headers.get('x-request-id') ?? undefined;
      // .limit(2), not .single()/.maybeSingle() -- fetches enough rows to
      // DETECT an ambiguous "more than one primary profile" data anomaly
      // rather than silently picking one and risking the wrong chart.
      const { data: profiles, error } = await userScopedClient
        .from('birth_profiles')
        .select('rashi, chart_data')
        .eq('owner_id', user.id) // redundant with RLS's own owner_id = auth.uid(), kept explicit
        .eq('is_primary', true)
        .limit(2);

      if (error) {
        // code only, never error.message -- a raw provider message can carry
        // internal query/schema detail, same reason authFailure() in
        // api-auth.ts never logs one either.
        console.warn('[rashiphal] birth_profiles read failed', { requestId, code: error.code });
      } else if (profiles && profiles.length === 1) {
        const profile = profiles[0] as { rashi: unknown; chart_data: unknown };
        if (normalizeRashi(profile.rashi) === rashi) {
          const active = findActiveDashaEntry(profile.chart_data, parsedDate);
          if (active) {
            const formattedEndDate = new Date(active.endDate).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            });
            dashaContext = {
              planet: active.planet,
              endDate: active.endDate,
              note: `In the Jyotish view, you are currently in ${active.planet}'s Mahadasha, running until ${formattedEndDate}. Treat this as a longer backdrop to weigh alongside today's transit, not a certain outcome on its own.`,
            };
            dashaContextStatus = 'available';
          }
        }
      } else if (profiles && profiles.length > 1) {
        // Never log user.id here -- a request id plus the anomalous count is
        // enough to trace and fix this without a user identifier in the log.
        console.warn('[rashiphal] more than one primary birth_profiles row', { requestId, count: profiles.length });
      }
    }
    // user is null here (invalid/expired token, or the auth provider itself
    // was unavailable) -- dashaContextStatus stays 'unavailable', and
    // getApiUser's own authFailure() has already logged the classified
    // [api-auth] reason (AUTH_REQUIRED vs AUTH_UNAVAILABLE). The base
    // horoscope below is still returned regardless.
  }

  const dailyHoroscope = getDailyHoroscope(rashi, parsedDate, timeZone, {
    dashaContext,
    useDistinctGuidance: true,
  });

  return NextResponse.json({ ...dailyHoroscope, dashaContextStatus }, {
    // Any request that supplied Bearer credentials -- regardless of outcome
    // -- gets a response whose body can vary by identity (dashaContext or
    // just dashaContextStatus), so it is never safe to cache publicly. Only
    // the pure anonymous path, which is identical for every visitor, keeps
    // today's public caching.
    headers: { 'Cache-Control': hasBearerCredentials ? 'private, no-store' : 'public, max-age=3600' },
  });
}

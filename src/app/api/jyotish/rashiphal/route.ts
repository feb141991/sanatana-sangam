import { NextResponse, type NextRequest } from 'next/server';
import {
  getDailyHoroscope,
  RASHI_LIST,
  findActiveDashaEntry,
  normalizeRashiKey,
  toNativeRashiHoroscope,
} from '@/lib/jyotish/rashiphal-data';
import { isSupportedTransitDate } from '@/lib/jyotish/astro-engine';
import { isValidTimeZone } from '@/lib/sacred-time';
import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

/**
 * Request contract: the `rashi` query parameter is the English RASHI_LIST key
 * ("capricorn"), case-insensitive. Sanskrit or display names are not accepted
 * here; stored profile values (which hold Sanskrit names) are resolved
 * separately with normalizeRashiKey.
 */
function parseRequestRashiKey(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim().toLowerCase();
  return RASHI_LIST.some((r) => r.key === normalized) ? normalized : null;
}

function isValidIsoDatePart(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parseDateParameter(value: string | null): Date | null {
  if (value === null) return new Date();

  if (isValidIsoDatePart(value)) return new Date(`${value}T00:00:00.000Z`);

  const dateTime = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i.exec(value);
  if (!dateTime || !isValidIsoDatePart(dateTime[1])) return null;

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

type DashaContextStatus = 'not_requested' | 'available' | 'unavailable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rashiParam = searchParams.get('rashi');
  const rashi = parseRequestRashiKey(rashiParam);
  const dateParam = searchParams.get('date');
  const timeZoneParam = searchParams.get('tz');
  const timeZone = timeZoneParam ?? 'Asia/Kolkata';
  const contractVersion = searchParams.get('contract');

  if (!rashiParam) {
    return NextResponse.json({ error: 'Missing rashi query parameter' }, { status: 400 });
  }

  if (!rashi) {
    return NextResponse.json({ error: `Invalid rashi sign. Must be one of: ${RASHI_LIST.map(r => r.key).join(', ')}` }, { status: 400 });
  }

  if (contractVersion !== null && contractVersion !== '1' && contractVersion !== '2') {
    return NextResponse.json({ error: 'Unsupported Rashiphala response contract' }, { status: 400 });
  }

  if (timeZoneParam !== null && !isValidTimeZone(timeZoneParam)) {
    return NextResponse.json({ error: 'Invalid timezone query parameter' }, { status: 400 });
  }

  const parsedDate = parseDateParameter(dateParam);
  if (!parsedDate) {
    return NextResponse.json({ error: 'Invalid date query parameter' }, { status: 400 });
  }
  if (!isSupportedTransitDate(parsedDate)) {
    return NextResponse.json({ error: 'Date is outside the supported Rashiphala calculation range' }, { status: 400 });
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
        // birth_profiles.rashi is written by the chart engine as a Sanskrit
        // name ("Makara"); the request carries the English key ("capricorn").
        if (normalizeRashiKey(profile.rashi) === rashi) {
          const active = findActiveDashaEntry(profile.chart_data, parsedDate);
          if (active) {
            const formattedEndDate = new Date(active.endDate).toLocaleDateString('en-IN', {
              timeZone: 'UTC',
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

  let dailyHoroscope: ReturnType<typeof getDailyHoroscope>;
  try {
    dailyHoroscope = getDailyHoroscope(rashi, parsedDate, timeZone, {
      dashaContext,
      useDistinctGuidance: true,
    });
  } catch (error) {
    // Keep any future, non-range engine faults visible to the normal error
    // handling path instead of disguising them as bad client input.
    if (error instanceof RangeError) {
      return NextResponse.json({ error: 'Date is outside the supported Rashiphala calculation range' }, { status: 400 });
    }
    throw error;
  }

  const responseBody = contractVersion === '2'
    ? { ...toNativeRashiHoroscope(dailyHoroscope), dashaContextStatus }
    : { ...dailyHoroscope, dashaContextStatus };

  return NextResponse.json(responseBody, {
    // The response is spiritual-date-sensitive (4 a.m. in the requested
    // timezone), and authenticated responses may include Dasha context. Do
    // not let CDN/client caches serve yesterday's reading across that
    // boundary or reuse a personalized body for another request.
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestProfile, PROFILE_RESOLUTION_PAD_DAYS, shiftDate } from '@/lib/calendar/request-profile';
import { formatOccurrencesToResults, type ClientObservanceResult } from '@/lib/calendar/observance-formatter';
import { attachMaterialisationBatches, CALENDAR_OCCURRENCE_SELECT } from '@/lib/calendar/occurrence-reader';

export const runtime = 'nodejs';

export interface DayResponse {
  date: string;
  observances: ClientObservanceResult[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let dateStr = searchParams.get('date');

    if (!dateStr) {
      const now = new Date();
      dateStr = now.toISOString().split('T')[0];
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
      }
    }

    let tradition = searchParams.get('tradition') || 'all';
    let calendarProfile = searchParams.get('calendar_profile') || '';
    let sampradaya: string | null = null;

    // Cookie OR Bearer: the native app sends a Bearer token, so the previous
    // cookie-only lookup silently gave every native user the default calendar.
    const resolved = await resolveRequestProfile(request, { tradition, calendarProfile });
    // Credentials were sent and rejected: say so instead of quietly serving
    // the default calendar, which leaves a stale client with no way to learn
    // it must refresh.
    if (resolved.invalidCredentials) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // A failed profile READ is a fault, not an absent setting. Answering it
    // with the default would present a guess as the user's own choice.
    if (resolved.profileError) {
      console.error('[API Calendar Day] Profile read error:', resolved.profileError);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }
    const supabase = resolved.supabase;
    calendarProfile = resolved.calendarProfile;
    tradition = resolved.tradition;
    sampradaya = resolved.sampradaya;

    let occurrencesQuery = supabase
      .from('observance_occurrences')
      .select(CALENDAR_OCCURRENCE_SELECT)
      // A single-day request still needs the surrounding window: the chosen
      // profile's row for this festival may sit a day either side, and only by
      // seeing it can we tell 'not materialised' from 'just outside the range'.
      // The formatter clips back to exactly dateStr.
      .gte('date', shiftDate(dateStr, -PROFILE_RESOLUTION_PAD_DAYS))
      .lte('date', shiftDate(dateStr, PROFILE_RESOLUTION_PAD_DAYS))
      .in('calendar_profile', [calendarProfile, 'legacy-ujjain'])
      .eq('observance_definitions.active', true)
      .eq('publication_status', 'published');

    // Tradition filtering happens in SQL, as it already does on /upcoming.
    // Without it this route returned every tradition to every user -- a
    // Sikh user saw Jain observances and vice versa.
    if (tradition && tradition !== 'all') {
      occurrencesQuery = occurrencesQuery.in('observance_definitions.tradition', [tradition, 'all']);
    }

    // Query unresolved items from the review queue. Built (not executed) here
    // so it can run concurrently with occurrencesQuery below -- its filters
    // (calendarProfile, tradition) are already resolved above and don't
    // depend on the occurrences result, so there's no reason to wait for it.
    let queueQuery = supabase
      .from('observance_review_queue')
      .select(`
        id,
        definition_id,
        year,
        calendar_profile,
        spiritual_tradition,
        variant_key,
        location_label,
        computed_latitude,
        computed_longitude,
        computed_timezone,
        ambiguity_type,
        reasoning,
        candidate_dates,
        evaluator_details,
        source_refs,
        review_status,
        observance_definitions!inner(
          slug,
          display_name,
          emoji,
          description,
          kind,
          tradition,
          route_kind,
          route_slug,
          active
        )
      `)
      .in('calendar_profile', [calendarProfile, 'legacy-ujjain'])
      .eq('observance_definitions.active', true)
      // Terminal states must not surface as 'under review'. Approved and rejected
      // rows were still fetched and emitted with reviewStatus 'in_review', so a
      // settled decision kept showing as an open question.
      .eq('review_status', 'pending_review');

    // The queue leaked traditions for the same reason the occurrence query
    // did -- only /upcoming filtered. An unresolved Jain observance would
    // surface on a Sikh user's calendar as 'under review'.
    if (tradition && tradition !== 'all') {
      queueQuery = queueQuery.in('observance_definitions.tradition', [tradition, 'all']);
    }

    const [
      { data: occurrencesData, error: occError },
      { data: queueData, error: queueError },
    ] = await Promise.all([occurrencesQuery, queueQuery]);

    if (occError) {
      console.error('[API Calendar Day] Occurrences error:', occError);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    if (queueError) {
      console.error('[API Calendar Day] Review queue error:', queueError);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    const occurrencesWithBatches = await attachMaterialisationBatches(
      occurrencesData || [],
      undefined,
      calendarProfile,
      resolved.context.effectiveCalculationLocation,
    );

    const formattedResults = formatOccurrencesToResults(
      occurrencesWithBatches,
      queueData || [],
      tradition,
      calendarProfile,
      sampradaya,
      dateStr,
      dateStr,
      resolved.context
    );

    const response: DayResponse = {
      date: dateStr,
      observances: formattedResults,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // PRIVACY: `private` for signed-in requests, `public` for guests. This
        // response is personalised when a user is signed in -- `resolveRequestProfile`
        // unconditionally reads calendar_profile/tradition/sampradaya/location off the
        // SIGNED-IN USER's profile row, so two authenticated users requesting the
        // identical URL can get different bodies; a shared CDN cache keyed on the URL
        // alone would serve one user's calendar selection to another. `resolved.isAuthenticated`
        // is exactly the signal that distinguishes the two cases (see its doc comment
        // in request-profile.ts). For a guest, every input is an explicit query
        // parameter -- no cookie/profile state -- so the response is a pure function
        // of the URL and is safe for the edge/CDN to cache and serve to other guests.
        'Cache-Control': resolved.isAuthenticated
          ? 'private, max-age=3600, stale-while-revalidate=86400'
          : 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[API Calendar Day] Unexpected error:', err);
    return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
  }
}

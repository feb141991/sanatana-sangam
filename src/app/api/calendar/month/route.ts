import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestProfile, PROFILE_RESOLUTION_PAD_DAYS, shiftDate } from '@/lib/calendar/request-profile';
import { formatOccurrencesToResults, type ClientObservanceResult } from '@/lib/calendar/observance-formatter';

export const runtime = 'nodejs';

export interface MonthResponse {
  year: number;
  month: number;
  byDate: Record<string, ClientObservanceResult[]>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const now = new Date();
    
    let year = searchParams.has('year') ? parseInt(searchParams.get('year')!, 10) : now.getUTCFullYear();
    let month = searchParams.has('month') ? parseInt(searchParams.get('month')!, 10) : now.getUTCMonth() + 1;

    if (isNaN(year) || year < 1900 || year > 2100) {
      year = now.getUTCFullYear();
    }
    if (isNaN(month) || month < 1 || month > 12) {
      month = now.getUTCMonth() + 1;
    }

    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDateObj = new Date(Date.UTC(year, month, 0));
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDateObj.getUTCDate()).padStart(2, '0')}`;

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
      console.error('[API Calendar Month] Profile read error:', resolved.profileError);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }
    const supabase = resolved.supabase;
    calendarProfile = resolved.calendarProfile;
    tradition = resolved.tradition;
    sampradaya = resolved.sampradaya;

    let occurrencesQuery = supabase
      .from('observance_occurrences')
      .select(`
        date,
        occurrence_date,
        review_status,
        verification_status,
        audit_status,
        calendar_profile,
        spiritual_tradition,
        variant_key,
        is_primary_variant,
        reasons,
        diagnostics,
        source_refs,
        computed_latitude,
        computed_longitude,
        computed_timezone,
        rule_version,
        astronomy_version,
        day_boundary_version,
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
      // Padded for profile resolution; the formatter clips to the month.
      .gte('date', shiftDate(firstDay, -PROFILE_RESOLUTION_PAD_DAYS))
      .lte('date', shiftDate(lastDay, PROFILE_RESOLUTION_PAD_DAYS))
      .in('calendar_profile', [calendarProfile, 'legacy-ujjain'])
      .eq('observance_definitions.active', true)
      .eq('publication_status', 'published');

    // Tradition filtering happens in SQL, as it already does on /upcoming.
    // Without it this route returned every tradition to every user -- a
    // Sikh user saw Jain observances and vice versa.
    if (tradition && tradition !== 'all') {
      occurrencesQuery = occurrencesQuery.in('observance_definitions.tradition', [tradition, 'all']);
    }

    const { data: occurrencesData, error: occError } = await occurrencesQuery;

    if (occError) {
      console.error('[API Calendar Month] Occurrences error:', occError);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    // Query unresolved items from the review queue
    let queueQuery = supabase
      .from('observance_review_queue')
      .select(`
        id,
        definition_id,
        year,
        calendar_profile,
        location_label,
        computed_latitude,
        computed_longitude,
        computed_timezone,
        ambiguity_type,
        reasoning,
        candidate_dates,
        evaluator_details,
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

    const { data: queueData, error: queueError } = await queueQuery;

    if (queueError) {
      console.error('[API Calendar Month] Review queue error:', queueError);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    const formattedResults = formatOccurrencesToResults(
      occurrencesData || [],
      queueData || [],
      tradition,
      calendarProfile,
      sampradaya,
      firstDay,
      lastDay
    );

    const byDate: Record<string, ClientObservanceResult[]> = {};
    for (const item of formattedResults) {
      const dateKey = item.date;
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(item);
    }

    const response: MonthResponse = {
      year,
      month,
      byDate,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
                // PRIVACY: must be `private`. This response is personalised -- when
        // `calendar_profile` or `tradition` is absent from the query string the
        // route reads them from the SIGNED-IN USER's profile row. Two users
        // requesting the identical URL therefore get different bodies, so a
        // shared CDN cache keyed on the URL alone would serve one user's
        // calendar selection to another. `private` keeps it in the browser cache
        // only. Making this `public` again would require every selection input
        // to be an explicit URL parameter.
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[API Calendar Month] Unexpected error:', err);
    return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
  }
}

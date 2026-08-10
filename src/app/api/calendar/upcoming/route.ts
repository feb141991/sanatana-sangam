import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestProfile, PROFILE_RESOLUTION_PAD_DAYS, shiftDate } from '@/lib/calendar/request-profile';
import { localSpiritualDate } from '@/lib/sacred-time';
import { formatOccurrencesToResults, type ClientObservanceResult } from '@/lib/calendar/observance-formatter';

export const runtime = 'nodejs';

export interface UpcomingResponse {
  from: string;
  to: string;
  observances: ClientObservanceResult[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    let days = searchParams.has('days') ? parseInt(searchParams.get('days')!, 10) : 14;
    if (isNaN(days) || days <= 0) days = 14;
    if (days > 60) days = 60;
    
    let tradition = searchParams.get('tradition') || 'all';
    let calendarProfile = searchParams.get('calendar_profile') || '';
    let sampradaya: string | null = null;
    const reviewedOnly = searchParams.get('reviewed') === '1' || searchParams.get('reviewed') === 'true';
    const tz = searchParams.get('tz') || 'Asia/Kolkata';

    const fromStr = localSpiritualDate(tz, 4);
    const [fy, fm, fd] = fromStr.split('-').map(Number);
    const endDate = new Date(Date.UTC(fy, fm - 1, fd + days));
    const toStr = endDate.toISOString().split('T')[0];

    // Cookie OR Bearer: the native app sends a Bearer token, so the previous
    // cookie-only lookup silently gave every native user the default calendar.
    const resolved = await resolveRequestProfile(request, { tradition, calendarProfile });
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
      // Over-fetch so profile resolution can see rows just outside the window;
      // the formatter clips back to [fromStr, toStr] after resolving.
      .gte('date', shiftDate(fromStr, -PROFILE_RESOLUTION_PAD_DAYS))
      .lte('date', shiftDate(toStr, PROFILE_RESOLUTION_PAD_DAYS))
      .in('calendar_profile', [calendarProfile, 'legacy-ujjain'])
      .eq('observance_definitions.active', true)
      .eq('publication_status', 'published');

    if (reviewedOnly) {
      occurrencesQuery = occurrencesQuery
        .eq('review_status', 'reviewed')
        .eq('verification_status', 'verified')
        .eq('audit_status', 'completed');
    }

    if (tradition && tradition !== 'all') {
      occurrencesQuery = occurrencesQuery.in('observance_definitions.tradition', [tradition, 'all']);
    }

    const { data: occurrencesData, error: occError } = await occurrencesQuery.order('date', { ascending: true });

    if (occError) {
      console.error('[API Calendar Upcoming] Occurrences error:', occError);
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
      .eq('observance_definitions.active', true);

    if (tradition && tradition !== 'all') {
      queueQuery = queueQuery.in('observance_definitions.tradition', [tradition, 'all']);
    }

    const { data: queueData, error: queueError } = await queueQuery;

    if (queueError) {
      console.error('[API Calendar Upcoming] Review queue error:', queueError);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    const formattedResults = formatOccurrencesToResults(
      occurrencesData || [],
      queueData || [],
      tradition,
      calendarProfile,
      sampradaya,
      fromStr,
      toStr
    );

    // Re-sort results by date in JS
    formattedResults.sort((a, b) => a.date.localeCompare(b.date));

    const response: UpcomingResponse = {
      from: fromStr,
      to: toStr,
      observances: formattedResults,
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
        'Cache-Control': 'private, max-age=1800',
      },
    });
  } catch (err) {
    console.error('[API Calendar Upcoming] Unexpected error:', err);
    return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
  }
}

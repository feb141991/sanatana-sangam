import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
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
    // Variant selection keys on sampradaya, not tradition. Read-only here: it is
    // never accepted from the query string, so one user cannot ask for another's.
    let sampradaya: string | null = null;

    const supabase = await createServerSupabaseClient();

    // Resolve tradition and calendar profile from profile if not explicitly passed
    if (!calendarProfile || tradition === 'all') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('calendar_profile, tradition, sampradaya')
          .eq('id', user.id)
          .single();
        if (profile) {
          if (!calendarProfile) calendarProfile = profile.calendar_profile || '';
          if (tradition === 'all') tradition = profile.tradition || 'all';
          sampradaya = profile.sampradaya || null;
        }
      }
    }
    
    if (!calendarProfile) calendarProfile = 'legacy-ujjain';

    const { data: occurrencesData, error: occError } = await supabase
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
      .gte('date', firstDay)
      .lte('date', lastDay)
      .in('calendar_profile', [calendarProfile, 'legacy-ujjain'])
      .eq('observance_definitions.active', true)
      .eq('publication_status', 'published');

    if (occError) {
      console.error('[API Calendar Month] Occurrences error:', occError);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    // Query unresolved items from the review queue
    const { data: queueData, error: queueError } = await supabase
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

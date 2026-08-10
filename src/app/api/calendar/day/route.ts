import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { formatOccurrencesToResults, type ClientObservanceResult } from '@/lib/calendar/observance-formatter';

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

    const supabase = await createServerSupabaseClient();

    // Resolve tradition and calendar profile from profile if not explicitly passed
    if (!calendarProfile || tradition === 'all') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('calendar_profile, tradition')
          .eq('id', user.id)
          .single();
        if (profile) {
          if (!calendarProfile) calendarProfile = profile.calendar_profile || '';
          if (tradition === 'all') tradition = profile.tradition || 'all';
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
      .eq('date', dateStr)
      .in('calendar_profile', [calendarProfile, 'legacy-ujjain'])
      .eq('observance_definitions.active', true)
      .eq('publication_status', 'published');

    if (occError) {
      console.error('[API Calendar Day] Occurrences error:', occError);
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
      console.error('[API Calendar Day] Review queue error:', queueError);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    const formattedResults = formatOccurrencesToResults(
      occurrencesData || [],
      queueData || [],
      tradition,
      calendarProfile,
      dateStr,
      dateStr
    );

    const response: DayResponse = {
      date: dateStr,
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
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[API Calendar Day] Unexpected error:', err);
    return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
  }
}

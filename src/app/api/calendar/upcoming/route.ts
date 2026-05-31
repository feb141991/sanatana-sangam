import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';

export const runtime = 'nodejs';

export interface UpcomingResponse {
  from: string;
  to: string;
  observances: Array<{
    date: string;
    slug: string;
    display_name: string;
    emoji: string;
    kind: "major" | "vrat" | "regional";
    tradition: "hindu" | "sikh" | "buddhist" | "jain" | "all";
    route_kind: string | null;
    route_slug: string | null;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    let days = searchParams.has('days') ? parseInt(searchParams.get('days')!, 10) : 14;
    if (isNaN(days) || days <= 0) days = 14;
    if (days > 60) days = 60;
    
    const tradition = searchParams.get('tradition') || 'all';
    // Accept the caller's timezone so the date window matches their local day,
    // not the server's UTC clock. Fall back to IST (where the Hindu calendar is
    // anchored) when no timezone is provided (e.g. pre-login requests).
    const tz = searchParams.get('tz') || 'Asia/Kolkata';

    // localSpiritualDate respects Brahma Muhurta: before 4am the user is still
    // on the previous spiritual day. This is correct for global users too.
    const fromStr = localSpiritualDate(tz, 4);

    // Build the end date by adding `days` calendar days to the local start.
    const [fy, fm, fd] = fromStr.split('-').map(Number);
    const endDate = new Date(Date.UTC(fy, fm - 1, fd + days));
    const toStr = endDate.toISOString().split('T')[0];

    const supabase = await createServerSupabaseClient();
    
    let query = supabase
      .from('observance_occurrences')
      .select(`
        date,
        observance_definitions!inner(
          slug,
          display_name,
          emoji,
          kind,
          tradition,
          route_kind,
          route_slug,
          active
        )
      `)
      .gte('date', fromStr)
      .lte('date', toStr)
      .eq('observance_definitions.active', true);

    if (tradition && tradition !== 'all') {
      query = query.in('observance_definitions.tradition', [tradition, 'all']);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) {
      console.error('[API Calendar Upcoming] Supabase error:', error);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    const observances = (data || []).map((row: any) => ({
      date: row.date,
      slug: row.observance_definitions.slug,
      display_name: row.observance_definitions.display_name,
      emoji: row.observance_definitions.emoji,
      kind: row.observance_definitions.kind,
      tradition: row.observance_definitions.tradition,
      route_kind: row.observance_definitions.route_kind,
      route_slug: row.observance_definitions.route_slug,
    }));

    // Re-sort in JS to be safe, since Supabase sorts by occurrence.date correctly, 
    // but in case of multiple on same day, we keep them together.
    observances.sort((a, b) => a.date.localeCompare(b.date));

    const response: UpcomingResponse = {
      from: fromStr,
      to: toStr,
      observances,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=1800',
      },
    });
  } catch (err) {
    console.error('[API Calendar Upcoming] Unexpected error:', err);
    return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
  }
}

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
    description: string;
  }>;
}

type ObservanceDefinitionJoin = {
  slug: string;
  display_name: string;
  emoji: string | null;
  description: string | null;
  kind: "major" | "vrat" | "regional";
  tradition: "hindu" | "sikh" | "buddhist" | "jain" | "all";
  route_kind: string | null;
  route_slug: string | null;
  active: boolean;
};

type UpcomingOccurrenceRow = {
  date: string;
  review_status: string | null;
  verification_status: string | null;
  audit_status: string | null;
  observance_definitions: ObservanceDefinitionJoin | ObservanceDefinitionJoin[] | null;
};

function getDefinition(row: UpcomingOccurrenceRow): ObservanceDefinitionJoin | null {
  if (Array.isArray(row.observance_definitions)) {
    return row.observance_definitions[0] ?? null;
  }
  return row.observance_definitions;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    let days = searchParams.has('days') ? parseInt(searchParams.get('days')!, 10) : 14;
    if (isNaN(days) || days <= 0) days = 14;
    if (days > 60) days = 60;
    
    const tradition = searchParams.get('tradition') || 'all';
    const reviewedOnly = searchParams.get('reviewed') === '1' || searchParams.get('reviewed') === 'true';
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
        review_status,
        verification_status,
        audit_status,
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
      .gte('date', fromStr)
      .lte('date', toStr)
      .eq('observance_definitions.active', true);

    if (reviewedOnly) {
      query = query
        .eq('review_status', 'reviewed')
        .eq('verification_status', 'verified')
        .eq('audit_status', 'completed');
    }

    if (tradition && tradition !== 'all') {
      query = query.in('observance_definitions.tradition', [tradition, 'all']);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) {
      console.error('[API Calendar Upcoming] Supabase error:', error);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    const observances = ((data ?? []) as UpcomingOccurrenceRow[])
      .map((row) => {
        const definition = getDefinition(row);
        if (!definition) return null;
        return {
          date: row.date,
          slug: definition.slug,
          display_name: definition.display_name,
          emoji: definition.emoji ?? '🪔',
          description: definition.description ?? '',
          kind: definition.kind,
          tradition: definition.tradition,
          route_kind: definition.route_kind,
          route_slug: definition.route_slug,
        };
      })
      .filter((observance): observance is UpcomingResponse['observances'][number] => observance !== null);

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

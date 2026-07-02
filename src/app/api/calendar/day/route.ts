import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export interface DayResponse {
  date: string;
  observances: Array<{
    slug: string;
    display_name: string;
    emoji: string;
    description: string;
    kind: "major" | "vrat" | "regional";
    tradition: "hindu" | "sikh" | "buddhist" | "jain" | "all";
    route_kind: string | null;
    route_slug: string | null;
    verification_status: string;
    final_date_source: string;
  }>;
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

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('observance_occurrences')
      .select(`
        verification_status,
        final_date_source,
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
      .eq('observance_definitions.active', true);

    if (error) {
      console.error('[API Calendar Day] Supabase error:', error);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    const observances = (data || []).map((row: any) => ({
      slug: row.observance_definitions.slug,
      display_name: row.observance_definitions.display_name,
      emoji: row.observance_definitions.emoji,
      description: row.observance_definitions.description,
      kind: row.observance_definitions.kind,
      tradition: row.observance_definitions.tradition,
      route_kind: row.observance_definitions.route_kind,
      route_slug: row.observance_definitions.route_slug,
      verification_status: row.verification_status,
      final_date_source: row.final_date_source,
    }));

    const response: DayResponse = {
      date: dateStr,
      observances,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[API Calendar Day] Unexpected error:', err);
    return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
  }
}

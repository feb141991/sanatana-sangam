import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export interface MonthResponse {
  year: number;
  month: number;
  byDate: Record<string, Array<{
    slug: string;
    display_name: string;
    emoji: string;
    kind: "major" | "vrat" | "regional";
    tradition: "hindu" | "sikh" | "buddhist" | "jain" | "all";
    route_kind: string | null;
    route_slug: string | null;
  }>>;
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

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
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
      .gte('date', firstDay)
      .lte('date', lastDay)
      .eq('observance_definitions.active', true);

    if (error) {
      console.error('[API Calendar Month] Supabase error:', error);
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
    }

    const byDate: Record<string, any[]> = {};
    for (const rawRow of (data || [])) {
      const row = rawRow as any;
      const dateKey = row.date;
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      
      byDate[dateKey].push({
        slug: row.observance_definitions.slug,
        display_name: row.observance_definitions.display_name,
        emoji: row.observance_definitions.emoji,
        kind: row.observance_definitions.kind,
        tradition: row.observance_definitions.tradition,
        route_kind: row.observance_definitions.route_kind,
        route_slug: row.observance_definitions.route_slug,
      });
    }

    const response: MonthResponse = {
      year,
      month,
      byDate,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[API Calendar Month] Unexpected error:', err);
    return NextResponse.json({ error: 'Calendar unavailable' }, { status: 500 });
  }
}
